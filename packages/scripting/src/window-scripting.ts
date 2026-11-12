import type { Event, EventTarget } from "@palim/core/internal/dom/events.js";
import {
  documentImplementation,
  nodeImplementation,
} from "@palim/core/internal/dom/node-implementation.js";
import type { Element, Node } from "@palim/core/internal/dom/nodes.js";
import { HTMLScriptElement } from "@palim/core/internal/html-elements.js";
import { URL } from "@palim/core/internal/url/index.js";
import type { HostServices, WindowExtension } from "@palim/polyfills";
import { createHostServices } from "@palim/polyfills";
import type {
  Resource,
  ResourceLoader,
  WindowScripting,
} from "@palim/window/internal/document-loader.js";
import type { Window } from "@palim/window/internal/window.js";

import type {
  EngineResult,
  EngineValue,
  JavaScriptEngineAdapter,
} from "./javascript-engine/adapter.js";
import type {
  ClassicScript,
  WindowScriptEventLoop,
} from "./javascript-engine/window-classic-script.js";
import { WindowScriptEnvironment } from "./javascript-engine/window-classic-script.js";
import { installWindowExtensions } from "./javascript-engine/window-extension-context.js";

export {
  ClassicScript,
  WindowEnvironmentSettings,
} from "./javascript-engine/window-classic-script.js";

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

export function createWindowScripting(
  engine: JavaScriptEngineAdapter,
  window: Window,
  resourceLoader: ResourceLoader | null,
  extensions: readonly WindowExtension[] = [],
  hostServices: HostServices = createHostServices(),
): WindowScriptingEnvironment {
  return new WindowScriptingEnvironment(
    engine,
    window,
    resourceLoader,
    extensions,
    hostServices,
  );
}

export class WindowScriptingEnvironment
  extends WindowScriptEnvironment
  implements WindowScripting
{
  readonly scriptResults: ParserInsertedScriptResult[] = [];
  readonly #resourceLoader: ResourceLoader | null;
  readonly #extensions: readonly WindowExtension[];
  readonly #hostServices: HostServices;
  readonly #pendingResourceLoads: Promise<void>[] = [];

  constructor(
    engine: JavaScriptEngineAdapter,
    window: Window,
    resourceLoader: ResourceLoader | null,
    extensions: readonly WindowExtension[] = [],
    hostServices: HostServices = createHostServices(),
    eventLoop?: WindowScriptEventLoop,
  ) {
    super(engine, window, eventLoop);
    this.#resourceLoader = resourceLoader;
    this.#extensions = extensions;
    this.#hostServices = hostServices;
    installWindowExtensions(
      this.#extensions,
      this.binding,
      this.settings,
      this.eventLoop,
      this.#hostServices,
    );
    documentImplementation(this.window.document).scriptingMode = "enabled";
    const implementation = documentImplementation(this.window.document);
    const previousChildrenChangedSteps = implementation.childrenChangedSteps;
    implementation.childrenChangedSteps = (node) => {
      previousChildrenChangedSteps?.(node);
      this.#processDynamicScript(node);
    };
    const previousPostConnectionSteps = implementation.postConnectionSteps;
    implementation.postConnectionSteps = (node) => {
      previousPostConnectionSteps?.(node);
      this.#processDynamicScript(node);
    };
  }

  async waitForPendingScripts(): Promise<void> {
    await Promise.all(this.#pendingResourceLoads);
  }

  dispatchEvent(target: EventTarget, event: Event): boolean {
    return this.binding.dom.dispatchEvent(target, event);
  }

  createChild(
    window: Window,
    resourceLoader: ResourceLoader | null,
  ): WindowScriptingEnvironment {
    return new WindowScriptingEnvironment(
      this.engine,
      window,
      resourceLoader,
      this.#extensions,
      this.#hostServices,
      this.eventLoop,
    );
  }

  async processScript(element: unknown): Promise<void> {
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
      this.#pendingResourceLoads.push(
        this.#loadExternalScriptWithoutExecution(element, source),
      );
      return;
    }

    await this.#loadAndExecuteExternalScript(element, source);
  }

  #processDynamicScript(node: Node): void {
    if (
      !(node instanceof HTMLScriptElement) ||
      nodeImplementation(node).scriptAlreadyStarted ||
      !node.isConnected ||
      !isClassic(node)
    ) {
      return;
    }
    const source = node.getAttribute("src");
    if (source === null) {
      if (node.text === "") {
        return;
      }
      nodeImplementation(node).scriptAlreadyStarted = true;
      this.#executeScript(node, node.text, this.#baseURL(node).href);
      return;
    }
    nodeImplementation(node).scriptAlreadyStarted = true;
    const loading = this.#loadAndExecuteExternalScript(node, source);
    this.#pendingResourceLoads.push(loading);
  }

  async #loadAndExecuteExternalScript(
    element: HTMLScriptElement,
    source: string,
  ): Promise<void> {
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

  async #loadExternalScriptWithoutExecution(
    element: HTMLScriptElement,
    source: string,
  ): Promise<void> {
    if (this.#resourceLoader === null) {
      return;
    }
    let resourceURL: URL;
    try {
      resourceURL = new URL(source, this.#baseURL(element));
    } catch {
      return;
    }
    try {
      await this.#resourceLoader.load(new URL(resourceURL.href));
    } catch {
      // A deferred script load failure does not abort document loading.
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
        this.binding.reportException(
          result.value,
          sourceURL,
          script.mutedErrors,
        );
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
  if (!element.isConnected || element.noModule) {
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
