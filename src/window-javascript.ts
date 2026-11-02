import type { Document } from "./dom/nodes.js";
import { HTMLScriptElement } from "./html-elements.js";
import { parseHTMLIntoDocumentAsync } from "./html/parser.js";
import type { EngineResult, EngineValue } from "./javascript-engine/adapter.js";
import { Engine262Adapter } from "./javascript-engine/engine262-adapter.js";
import type { ClassicScript } from "./javascript-engine/window-classic-script.js";
import { WindowScriptEnvironment } from "./javascript-engine/window-classic-script.js";
import { URL } from "./url/index.js";
import { createWindow } from "./window.js";
import type { WindowOptions } from "./window.js";

export {
  ClassicScript,
  WindowEnvironmentSettings,
} from "./javascript-engine/window-classic-script.js";

export interface ScriptResource {
  readonly body: Uint8Array;
  readonly url?: string | URL;
  readonly encoding?: string;
}

export interface ScriptResourceLoader {
  load(url: URL): Promise<ScriptResource>;
}

export interface WindowExecutionOptions extends WindowOptions {
  readonly resourceLoader?: ScriptResourceLoader;
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
  readonly #resourceLoader: ScriptResourceLoader | null;

  constructor(options: WindowExecutionOptions = {}) {
    super(new Engine262Adapter(), createWindow(options));
    this.#resourceLoader = options.resourceLoader ?? null;
  }

  async loadHTML(source: string): Promise<Document> {
    this.scriptResults.length = 0;
    return parseHTMLIntoDocumentAsync(
      source,
      this.window.document,
      async (element) => this.#processScript(element),
    );
  }

  async #processScript(element: unknown): Promise<void> {
    if (!(element instanceof HTMLScriptElement) || !isClassic(element)) {
      return;
    }
    const source = element.getAttribute("src");
    if (source === null) {
      this.#executeScript(element, element.text, this.settings.apiBaseURL.href);
      return;
    }
    if (element.async || element.defer) {
      return;
    }

    let resourceURL: URL;
    try {
      resourceURL = new URL(source, this.settings.apiBaseURL);
    } catch {
      this.#recordLoadError(element, source, "invalid-url");
      return;
    }
    if (this.#resourceLoader === null) {
      this.#recordLoadError(element, resourceURL.href, "missing-loader");
      return;
    }

    let resource: ScriptResource;
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

  #executeScript(
    element: HTMLScriptElement,
    sourceText: string,
    sourceURL: string,
  ): void {
    const script = this.createClassicScript(sourceText, sourceURL);
    this.scriptResults.push({
      type: "execution",
      element,
      url: sourceURL,
      script,
      result: this.runClassicScript(script),
    });
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
  resource: ScriptResource,
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
