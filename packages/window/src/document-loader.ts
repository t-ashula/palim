import { Event, type EventTarget } from "@palim/core/internal/dom/events.js";
import {
  DocumentImplementation,
  documentImplementation,
} from "@palim/core/internal/dom/node-implementation.js";
import { Document, type Element } from "@palim/core/internal/dom/nodes.js";
import { descendantElements } from "@palim/core/internal/dom/traversal.js";
import {
  HTMLIFrameElement,
  HTMLScriptElement,
  setHTMLIFrameElementContentWindow,
} from "@palim/core/internal/html-elements.js";
import {
  parseHTML,
  parseHTMLIntoDocumentAsync,
} from "@palim/core/internal/html/parser.js";
import { originFromURL } from "@palim/core/internal/origin.js";
import { parseXML } from "@palim/core/internal/xml/parser.js";
import { URL } from "@palim/core/internal/url/index.js";

import {
  createChildWindow,
  createWindow,
  createWindowForDocument,
  detachWindow,
  replaceWindowDocument,
  type Window,
  type WindowOptions,
} from "./window.js";
import { decodeHTMLBytes } from "./html-byte-input.js";

export interface Resource {
  readonly body: Uint8Array;
  readonly url?: string | URL;
  readonly encoding?: string;
  readonly mimeType?: string;
}

function isXMLMIMEType(mimeType: string): boolean {
  const slash = mimeType.indexOf("/");
  return (
    mimeType === "text/xml" ||
    mimeType === "application/xml" ||
    (slash > 0 && mimeType.slice(slash + 1).endsWith("+xml"))
  );
}

function createHTMLDocumentWithContentType(contentType: string): Document {
  const template = documentImplementation(parseHTML(""));
  return new Document(
    new DocumentImplementation(
      template.fragmentParser,
      contentType,
      template.elementFactory,
    ),
  );
}

export interface ResourceLoader {
  load(url: URL): Promise<Resource>;
}

export interface WindowScripting {
  createChild(
    window: Window,
    resourceLoader: ResourceLoader | null,
  ): WindowScripting;
  processScript(element: unknown): Promise<void>;
  waitForPendingScripts(): Promise<void>;
  dispatchEvent(target: EventTarget, event: Event): boolean;
}

export interface WindowDocumentOptions extends WindowOptions {
  readonly resourceLoader?: ResourceLoader;
}

interface IFrameState {
  readonly loader: WindowDocumentLoader;
  scripting: WindowScripting | null;
  navigation: number;
}

export class WindowDocumentLoader {
  readonly window: Window;
  readonly resourceLoader: ResourceLoader | null;
  readonly #pendingResourceLoads: Promise<void>[] = [];
  readonly #iframeStates = new Map<HTMLIFrameElement, IFrameState>();
  readonly #options: WindowDocumentOptions;
  readonly #frameElement: Element | undefined;
  readonly #parentLoader: WindowDocumentLoader | undefined;
  #scripting: WindowScripting | null = null;
  #loadingHTML = false;
  #active = true;

  constructor(
    options: WindowDocumentOptions = {},
    document?: Document,
    parent?: Window,
    frameElement?: Element,
    parentLoader?: WindowDocumentLoader,
  ) {
    this.#options = options;
    this.#frameElement = frameElement;
    this.#parentLoader = parentLoader;
    if (parent !== undefined) {
      if (frameElement === undefined) {
        throw new TypeError("A child Window requires a frame element");
      }
      this.window = createChildWindow(parent, frameElement, options);
    } else {
      this.window =
        document === undefined
          ? createWindow(options)
          : createWindowForDocument(document, options);
    }
    this.resourceLoader = options.resourceLoader ?? null;
    this.#installDocumentHooks();
  }

  async loadHTML(
    source: string,
    scripting: WindowScripting | null,
  ): Promise<Document> {
    this.#scripting = scripting;
    this.#pendingResourceLoads.length = 0;
    this.#loadingHTML = true;
    try {
      return await parseHTMLIntoDocumentAsync(
        source,
        this.window.document,
        async (element) => scripting?.processScript(element),
        (element) => {
          this.#processElement(element);
        },
      );
    } finally {
      this.#loadingHTML = false;
    }
  }

  async loadParsedDocument(
    scripting: WindowScripting | null,
  ): Promise<Document> {
    this.#scripting = scripting;
    this.#pendingResourceLoads.length = 0;
    const document = this.window.document;
    for (const element of descendantElements(document)) {
      this.#processElement(element);
      await scripting?.processScript(element);
    }
    await this.#finish(scripting);
    return document;
  }

  async #finish(scripting: WindowScripting | null): Promise<void> {
    await this.#waitForPendingResources();
    await scripting?.waitForPendingScripts();
    await this.#waitForPendingResources();
    this.window.dispatchEvent(new Event("load"));
  }

  async #waitForPendingResources(): Promise<void> {
    let index = 0;
    while (index < this.#pendingResourceLoads.length) {
      const pending = this.#pendingResourceLoads.slice(index);
      index = this.#pendingResourceLoads.length;
      await Promise.all(pending);
    }
  }

  #installDocumentHooks(): void {
    const implementation = documentImplementation(this.window.document);
    const previousParserOpenedSteps = implementation.parserOpenedSteps;
    implementation.parserOpenedSteps = () => {
      previousParserOpenedSteps?.();
      if (this.#active) {
        this.#pendingResourceLoads.length = 0;
      }
    };
    const previousParserElementSteps = implementation.parserElementSteps;
    implementation.parserElementSteps = (element) => {
      previousParserElementSteps?.(element);
      if (this.#active) {
        this.#processElement(element);
      }
    };
    const previousParserScriptSteps = implementation.parserScriptSteps;
    implementation.parserScriptSteps = async (element) => {
      await previousParserScriptSteps?.(element);
      if (this.#active) {
        await this.#scripting?.processScript(element);
      }
    };
    const previousParserClosedSteps = implementation.parserClosedSteps;
    implementation.parserClosedSteps = async () => {
      await previousParserClosedSteps?.();
      if (this.#active) {
        await this.#finish(this.#scripting);
        if (!this.#loadingHTML && this.#frameElement !== undefined) {
          if (this.#parentLoader !== undefined) {
            this.#parentLoader.#dispatchEvent(
              this.#frameElement,
              new Event("load"),
            );
          }
        }
      }
    };
    const previousPostConnectionSteps = implementation.postConnectionSteps;
    implementation.postConnectionSteps = (node) => {
      previousPostConnectionSteps?.(node);
      if (this.#active && node instanceof HTMLIFrameElement) {
        this.#connectIFrame(node);
      }
    };

    const previousRemovingSteps = implementation.removingSteps;
    implementation.removingSteps = (node, isSubtreeRoot, oldAncestor) => {
      previousRemovingSteps?.(node, isSubtreeRoot, oldAncestor);
      if (this.#active && node instanceof HTMLIFrameElement) {
        this.#disconnectIFrame(node);
      }
    };

    const previousAttributeChangedSteps = implementation.attributeChangedSteps;
    implementation.attributeChangedSteps = (element, localName, namespace) => {
      previousAttributeChangedSteps?.(element, localName, namespace);
      if (
        this.#active &&
        namespace === null &&
        element instanceof HTMLIFrameElement &&
        element.isConnected &&
        (localName === "srcdoc" ||
          (localName === "src" && !element.hasAttribute("srcdoc")))
      ) {
        const state = this.#iframeStates.get(element);
        if (state !== undefined) {
          this.#queueIFrameNavigation(element, state, false);
        }
      }
    };
  }

  #connectIFrame(element: HTMLIFrameElement): void {
    if (this.#iframeStates.has(element)) {
      return;
    }
    const loader = new WindowDocumentLoader(
      {
        ...(this.#options.consoleHandler === undefined
          ? {}
          : { consoleHandler: this.#options.consoleHandler }),
        ...(this.resourceLoader === null
          ? {}
          : { resourceLoader: this.resourceLoader }),
      },
      undefined,
      this.window,
      element,
      this,
    );
    const state = {
      loader,
      scripting:
        this.#scripting?.createChild(loader.window, this.resourceLoader) ??
        null,
      navigation: 0,
    };
    loader.#scripting = state.scripting;
    this.#iframeStates.set(element, state);
    setHTMLIFrameElementContentWindow(element, loader.window);
    this.#queueIFrameNavigation(element, state, true);
  }

  #disconnectIFrame(element: HTMLIFrameElement): void {
    const state = this.#iframeStates.get(element);
    if (state === undefined) {
      return;
    }
    state.navigation += 1;
    state.loader.#dispose();
    detachWindow(state.loader.window);
    setHTMLIFrameElementContentWindow(element, null);
    this.#iframeStates.delete(element);
  }

  #dispose(): void {
    if (!this.#active) {
      return;
    }
    this.#active = false;
    for (const [element, state] of this.#iframeStates) {
      state.navigation += 1;
      state.loader.#dispose();
      detachWindow(state.loader.window);
      setHTMLIFrameElementContentWindow(element, null);
    }
    this.#iframeStates.clear();
  }

  #queueIFrameNavigation(
    element: HTMLIFrameElement,
    state: IFrameState,
    initialInsertion: boolean,
  ): void {
    state.navigation += 1;
    const navigation = state.navigation;
    this.#pendingResourceLoads.push(
      this.#navigateIFrame(element, state, navigation, initialInsertion),
    );
  }

  async #navigateIFrame(
    element: HTMLIFrameElement,
    state: IFrameState,
    navigation: number,
    initialInsertion: boolean,
  ): Promise<void> {
    if (element.hasAttribute("srcdoc")) {
      this.#prepareChildDocument(element, state, new URL("about:srcdoc"), true);
      await state.loader.loadHTML(
        element.getAttribute("srcdoc") ?? "",
        state.scripting,
      );
      this.#finishIFrameNavigation(element, state, navigation);
      return;
    }

    const source = element.getAttribute("src");
    let url = new URL("about:blank");
    if (source !== null && source.trim() !== "") {
      try {
        url = new URL(source, element.ownerDocument?.baseURI ?? "about:blank");
      } catch {
        // An invalid src leaves the initial about:blank document in place.
      }
    }

    if (inclusiveAncestorWindowHasURL(this.window, url)) {
      if (url.href === "about:blank" && initialInsertion) {
        this.#finishIFrameNavigation(element, state, navigation);
      }
      return;
    }

    if (url.href === "about:blank" && initialInsertion) {
      this.#finishIFrameNavigation(element, state, navigation);
      return;
    }
    if (url.href === "about:blank") {
      this.#prepareChildDocument(element, state, url, true);
      await state.loader.loadHTML("", state.scripting);
      this.#finishIFrameNavigation(element, state, navigation);
      return;
    }

    if (this.resourceLoader === null) {
      this.#finishIFrameNavigation(element, state, navigation);
      return;
    }
    try {
      const resource = await this.resourceLoader.load(new URL(url.href));
      if (!this.#isCurrentIFrameNavigation(element, state, navigation)) {
        return;
      }
      if (!(resource.body instanceof Uint8Array)) {
        this.#finishIFrameNavigation(element, state, navigation);
        return;
      }
      const finalURL =
        resource.url === undefined ? url : new URL(resource.url, url);
      const mimeType = resource.mimeType ?? "text/html";
      const decoded = decodeHTMLBytes(resource.body, {
        ...(resource.encoding === undefined
          ? {}
          : { transportEncoding: resource.encoding }),
      });
      if (isXMLMIMEType(mimeType)) {
        this.#replaceChildDocument(state, parseXML(decoded.text, mimeType));
        this.#prepareChildDocument(element, state, finalURL, false);
        documentImplementation(state.loader.window.document).encoding =
          decoded.encoding;
        await state.loader.loadParsedDocument(state.scripting);
      } else if (mimeType === "text/html") {
        this.#prepareChildDocument(element, state, finalURL, false);
        documentImplementation(state.loader.window.document).encoding =
          decoded.encoding;
        await state.loader.loadHTML(decoded.text, state.scripting);
      } else {
        this.#replaceChildDocument(
          state,
          createHTMLDocumentWithContentType(mimeType),
        );
        this.#prepareChildDocument(element, state, finalURL, false);
        documentImplementation(state.loader.window.document).encoding =
          decoded.encoding;
        await state.loader.loadHTML("", state.scripting);
      }
    } catch {
      // Like browsers, iframe load does not expose network failure details.
    }
    this.#finishIFrameNavigation(element, state, navigation);
  }

  #prepareChildDocument(
    element: HTMLIFrameElement,
    state: IFrameState,
    url: URL,
    inheritsOrigin: boolean,
  ): void {
    const implementation = documentImplementation(state.loader.window.document);
    implementation.url = new URL(url.href);
    implementation.aboutBaseURL = inheritsOrigin
      ? new URL(element.ownerDocument?.baseURI ?? this.window.document.baseURI)
      : null;
    implementation.origin = inheritsOrigin
      ? documentImplementation(this.window.document).origin
      : originFromURL(url);
    implementation.scriptingMode =
      state.scripting === null ? "disabled" : "enabled";
  }

  #replaceChildDocument(state: IFrameState, document: Document): void {
    replaceWindowDocument(state.loader.window, document);
    state.loader.#installDocumentHooks();
    state.scripting =
      this.#scripting?.createChild(state.loader.window, this.resourceLoader) ??
      null;
    state.loader.#scripting = state.scripting;
  }

  #finishIFrameNavigation(
    element: HTMLIFrameElement,
    state: IFrameState,
    navigation: number,
  ): void {
    if (this.#isCurrentIFrameNavigation(element, state, navigation)) {
      this.#dispatchEvent(element, new Event("load"));
    }
  }

  #dispatchEvent(target: EventTarget, event: Event): boolean {
    return (
      this.#scripting?.dispatchEvent(target, event) ??
      target.dispatchEvent(event)
    );
  }

  #isCurrentIFrameNavigation(
    element: HTMLIFrameElement,
    state: IFrameState,
    navigation: number,
  ): boolean {
    return (
      this.#active &&
      element.isConnected &&
      this.#iframeStates.get(element) === state &&
      state.navigation === navigation
    );
  }

  #processElement(element: Element): void {
    if (element instanceof HTMLIFrameElement) {
      if (element.isConnected) {
        this.#connectIFrame(element);
      }
      return;
    }
    for (const value of resourceURLs(element)) {
      this.#pendingResourceLoads.push(this.#loadResource(element, value));
    }
  }

  async #loadResource(element: Element, value: string): Promise<void> {
    if (this.resourceLoader === null) {
      return;
    }
    let resourceURL: URL;
    try {
      resourceURL = new URL(value, baseURL(element));
    } catch {
      return;
    }
    try {
      await this.resourceLoader.load(new URL(resourceURL.href));
    } catch {
      // A subresource failure does not abort loading the document.
    }
  }
}

function inclusiveAncestorWindowHasURL(window: Window, url: URL): boolean {
  const target = urlWithoutFragment(url);
  let ancestor = window;
  for (;;) {
    if (urlWithoutFragment(new URL(ancestor.document.URL)) === target) {
      return true;
    }
    if (ancestor.parent === ancestor) {
      return false;
    }
    ancestor = ancestor.parent;
  }
}

function urlWithoutFragment(url: URL): string {
  const copy = new URL(url.href);
  copy.hash = "";
  return copy.href;
}

function baseURL(element: Element): URL {
  const document = element.ownerDocument;
  const fallback = new URL(document?.URL ?? "about:blank");
  const value = document?.querySelector("base[href]")?.getAttribute("href");
  if (value === null || value === undefined) {
    return fallback;
  }
  try {
    return new URL(value, fallback);
  } catch {
    return fallback;
  }
}

function resourceURLs(element: Element): string[] {
  if (element instanceof HTMLScriptElement) {
    return [];
  }
  switch (element.localName) {
    case "link": {
      const rel = new Set(
        (element.getAttribute("rel") ?? "")
          .toLowerCase()
          .split(/[\t\n\f\r ]+/u),
      );
      const loadsResource = [
        "icon",
        "modulepreload",
        "prefetch",
        "preload",
        "stylesheet",
      ].some((token) => rel.has(token));
      return loadsResource ? resourceAttribute(element, "href") : [];
    }
    case "img":
      return resourceAttribute(element, "src");
    case "input":
      return (element.getAttribute("type") ?? "").toLowerCase() === "image"
        ? resourceAttribute(element, "src")
        : [];
    case "frame":
    case "embed":
    case "audio":
    case "source":
    case "track":
      return resourceAttribute(element, "src");
    case "object":
      return resourceAttribute(element, "data");
    case "video":
      return [
        ...resourceAttribute(element, "src"),
        ...resourceAttribute(element, "poster"),
      ];
    default:
      return [];
  }
}

function resourceAttribute(element: Element, attribute: string): string[] {
  const value = element.getAttribute(attribute);
  return value === null || value === "" ? [] : [value];
}
