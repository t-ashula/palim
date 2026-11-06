import { Event } from "./dom/events.js";
import {
  documentImplementation,
  nodeImplementation,
} from "./dom/node-implementation.js";
import type { Document, Element, Node } from "./dom/nodes.js";
import { descendantElements } from "./dom/traversal.js";
import { HTMLScriptElement } from "./html-elements.js";
import { parseHTMLIntoDocumentAsync } from "./html/parser.js";
import type { EngineResult, EngineValue } from "./javascript-engine/adapter.js";
import { Engine262Adapter } from "./javascript-engine/engine262-adapter.js";
import type { ClassicScript } from "./javascript-engine/window-classic-script.js";
import { WindowScriptEnvironment } from "./javascript-engine/window-classic-script.js";
import { URL } from "./url/index.js";
import {
  createWindow,
  createWindowForDocument,
  reportWindowError,
} from "./window.js";
import type { WindowOptions } from "./window.js";

export {
  ClassicScript,
  WindowEnvironmentSettings,
} from "./javascript-engine/window-classic-script.js";

export interface Resource {
  readonly body: Uint8Array;
  readonly url?: string | URL;
  readonly encoding?: string;
}

export interface ResourceLoader {
  load(url: URL): Promise<Resource>;
}

export interface WindowExecutionOptions extends WindowOptions {
  readonly resourceLoader?: ResourceLoader;
}

export interface ParserInsertedScriptExecutionResult {
  readonly type: "execution";
  readonly element: HTMLScriptElement;
  readonly url: string;
  readonly script: ClassicScript;
  readonly result: EngineResult<EngineValue>;
}

export interface ParserInsertedScriptLoadError {
  readonly type: "load-error";
  readonly element: HTMLScriptElement;
  readonly url: string;
  readonly error:
    | "decode-failure"
    | "invalid-resource"
    | "invalid-url"
    | "load-failure"
    | "missing-loader";
}

export type ParserInsertedScriptResult =
  ParserInsertedScriptExecutionResult | ParserInsertedScriptLoadError;

export class WindowExecutionEnvironment extends WindowScriptEnvironment {
  readonly scriptResults: ParserInsertedScriptResult[] = [];
  readonly #resourceLoader: ResourceLoader | null;
  readonly #pendingResourceLoads: Promise<void>[] = [];

  constructor(options: WindowExecutionOptions = {}, document?: Document) {
    super(
      new Engine262Adapter(),
      document === undefined
        ? createWindow(options)
        : createWindowForDocument(document, options),
    );
    this.#resourceLoader = options.resourceLoader ?? null;
    const implementation = documentImplementation(this.window.document);
    implementation.childrenChangedSteps = (node) => {
      this.#processDynamicScript(node);
    };
    implementation.postConnectionSteps = (node) => {
      this.#processDynamicScript(node);
    };
  }

  async loadHTML(source: string): Promise<Document> {
    this.scriptResults.length = 0;
    this.#pendingResourceLoads.length = 0;
    const document = await parseHTMLIntoDocumentAsync(
      source,
      this.window.document,
      async (element) => this.#processScript(element),
      (element) => {
        this.#processElement(element);
      },
    );
    await Promise.all(this.#pendingResourceLoads);
    this.window.dispatchEvent(new Event("load"));
    return document;
  }

  async loadParsedDocument(): Promise<Document> {
    this.scriptResults.length = 0;
    this.#pendingResourceLoads.length = 0;
    const document = this.window.document;
    for (const element of descendantElements(document)) {
      this.#processElement(element);
      await this.#processScript(element);
    }
    await Promise.all(this.#pendingResourceLoads);
    this.window.dispatchEvent(new Event("load"));
    return document;
  }

  async #processScript(element: unknown): Promise<void> {
    if (
      !(element instanceof HTMLScriptElement) ||
      nodeImplementation(element).scriptAlreadyStarted ||
      !isClassic(element)
    ) {
      return;
    }
    const source = element.getAttribute("src");
    if (source === null) {
      if (element.text === "") {
        return;
      }
      nodeImplementation(element).scriptAlreadyStarted = true;
      this.#executeScript(element, element.text, this.#baseURL(element).href);
      return;
    }
    nodeImplementation(element).scriptAlreadyStarted = true;
    if (element.async || element.defer) {
      return;
    }

    let resourceURL: URL;
    try {
      resourceURL = new URL(source, this.#baseURL(element));
    } catch {
      this.#recordLoadError(element, source, "invalid-url");
      return;
    }
    if (this.#resourceLoader === null) {
      this.#recordLoadError(element, resourceURL.href, "missing-loader");
      return;
    }

    let resource: Resource;
    try {
      resource = await this.#resourceLoader.load(new URL(resourceURL.href));
    } catch {
      this.#recordLoadError(element, resourceURL.href, "load-failure");
      return;
    }
    if (!(resource.body instanceof Uint8Array)) {
      this.#recordLoadError(element, resourceURL.href, "invalid-resource");
      return;
    }

    let finalURL: URL;
    try {
      finalURL =
        resource.url === undefined
          ? resourceURL
          : new URL(resource.url, resourceURL);
    } catch {
      this.#recordLoadError(element, resourceURL.href, "invalid-resource");
      return;
    }
    let sourceText: string;
    try {
      sourceText = decodeClassicScript(resource, element);
    } catch {
      this.#recordLoadError(element, resourceURL.href, "decode-failure");
      return;
    }
    this.#executeScript(element, sourceText, finalURL.href);
  }

  #processDynamicScript(node: Node): void {
    if (
      !(node instanceof HTMLScriptElement) ||
      nodeImplementation(node).scriptAlreadyStarted ||
      !node.isConnected ||
      !isClassic(node) ||
      node.hasAttribute("src") ||
      node.text === ""
    ) {
      return;
    }
    nodeImplementation(node).scriptAlreadyStarted = true;
    this.#executeScript(node, node.text, this.#baseURL(node).href);
  }

  #processElement(element: Element): void {
    for (const value of resourceURLs(element)) {
      this.#pendingResourceLoads.push(this.#loadResource(element, value));
    }
  }

  async #loadResource(element: Element, value: string): Promise<void> {
    if (this.#resourceLoader === null) {
      return;
    }
    let resourceURL: URL;
    try {
      resourceURL = new URL(value, this.#baseURL(element));
    } catch {
      return;
    }
    try {
      await this.#resourceLoader.load(new URL(resourceURL.href));
    } catch {
      // A subresource failure does not abort loading the document.
    }
  }

  #baseURL(element: Element): URL {
    const fallback = this.settings.apiBaseURL;
    const value = element.ownerDocument
      ?.querySelector("base[href]")
      ?.getAttribute("href");
    if (value === null || value === undefined) {
      return fallback;
    }
    try {
      return new URL(value, fallback);
    } catch {
      return fallback;
    }
  }

  #executeScript(
    element: HTMLScriptElement,
    sourceText: string,
    sourceURL: string,
  ): void {
    const script = this.createClassicScript(sourceText, sourceURL);
    const implementation = documentImplementation(
      element.ownerDocument ?? this.window.document,
    );
    const previousCurrentScript = implementation.currentScript;
    implementation.currentScript = element;
    try {
      const result = this.runClassicScript(script);
      this.scriptResults.push({
        type: "execution",
        element,
        url: sourceURL,
        script,
        result,
      });
      if (result.type === "throw") {
        const stack = exceptionStack(this, result.value);
        reportWindowError(this.window, {
          message: this.engine.exceptionMessage(
            this.settings.realm,
            result.value,
          ),
          url: sourceURL,
          ...(stack === undefined ? {} : { stack }),
        });
      }
    } finally {
      implementation.currentScript = previousCurrentScript;
    }
  }

  #recordLoadError(
    element: HTMLScriptElement,
    url: string,
    error: ParserInsertedScriptLoadError["error"],
  ): void {
    this.scriptResults.push({ type: "load-error", element, url, error });
  }
}

function exceptionStack(
  environment: WindowExecutionEnvironment,
  value: EngineValue,
): string | undefined {
  const object = environment.engine.asObject(value);
  if (object === null) {
    return undefined;
  }
  const stack = environment.engine.get(
    environment.settings.realm,
    object,
    "stack",
  );
  if (stack.type === "throw" || environment.engine.isUndefined(stack.value)) {
    return undefined;
  }
  const text = environment.engine.toString(
    environment.settings.realm,
    stack.value,
  );
  return text.type === "normal" ? text.value : undefined;
}

function resourceURLs(element: Element): string[] {
  if (element instanceof HTMLScriptElement) {
    return element.async || element.defer || !isClassic(element)
      ? resourceAttribute(element, "src")
      : [];
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
    case "iframe":
    case "frame":
      return resourceAttribute(element, "src");
    case "embed":
      return resourceAttribute(element, "src");
    case "object":
      return resourceAttribute(element, "data");
    case "audio":
    case "source":
      return resourceAttribute(element, "src");
    case "video":
      return [
        ...resourceAttribute(element, "src"),
        ...resourceAttribute(element, "poster"),
      ];
    case "track":
      return resourceAttribute(element, "src");
    default:
      return [];
  }
}

function resourceAttribute(element: Element, attribute: string): string[] {
  const value = element.getAttribute(attribute);
  return value === null || value === "" ? [] : [value];
}

const JAVASCRIPT_MIME_TYPE_ESSENCES = new Set([
  "application/ecmascript",
  "application/javascript",
  "application/x-ecmascript",
  "application/x-javascript",
  "text/ecmascript",
  "text/javascript",
  "text/javascript1.0",
  "text/javascript1.1",
  "text/javascript1.2",
  "text/javascript1.3",
  "text/javascript1.4",
  "text/javascript1.5",
  "text/jscript",
  "text/livescript",
  "text/x-ecmascript",
  "text/x-javascript",
]);

function isClassic(element: HTMLScriptElement): boolean {
  if (element.getRootNode() !== element.ownerDocument || element.noModule) {
    return false;
  }
  const typeAttribute = element.getAttribute("type");
  if (typeAttribute !== null) {
    if (typeAttribute === "") {
      return true;
    }
    const type = asciiLowercase(stripASCIIWhitespace(typeAttribute));
    return JAVASCRIPT_MIME_TYPE_ESSENCES.has(type);
  }
  const language = element.getAttribute("language");
  return (
    language === null ||
    language === "" ||
    JAVASCRIPT_MIME_TYPE_ESSENCES.has(`text/${asciiLowercase(language)}`)
  );
}

interface TextDecoderInstance {
  decode(input?: Uint8Array): string;
}

type TextDecoderConstructor = new (label?: string) => TextDecoderInstance;

const platform = globalThis as typeof globalThis & {
  readonly TextDecoder: TextDecoderConstructor;
};

function decodeClassicScript(
  resource: Resource,
  element: HTMLScriptElement,
): string {
  const encoding =
    resource.encoding ??
    (element.charset === "" ? undefined : element.charset) ??
    element.ownerDocument?.characterSet ??
    "utf-8";
  return new platform.TextDecoder(encoding).decode(resource.body);
}

function asciiLowercase(value: string): string {
  return value.replace(/[A-Z]/g, (character) => character.toLowerCase());
}

function stripASCIIWhitespace(value: string): string {
  return value.replace(/^[\t\n\f\r ]+|[\t\n\f\r ]+$/g, "");
}
