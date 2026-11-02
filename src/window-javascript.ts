import type { Document } from "./dom/nodes.js";
import { HTMLScriptElement } from "./html-elements.js";
import { parseHTMLIntoDocument } from "./html/parser.js";
import type { EngineResult, EngineValue } from "./javascript-engine/adapter.js";
import { Engine262Adapter } from "./javascript-engine/engine262-adapter.js";
import type { ClassicScript } from "./javascript-engine/window-classic-script.js";
import { WindowScriptEnvironment } from "./javascript-engine/window-classic-script.js";
import { createWindow } from "./window.js";
import type { WindowOptions } from "./window.js";

export {
  ClassicScript,
  WindowEnvironmentSettings,
} from "./javascript-engine/window-classic-script.js";

export type WindowExecutionOptions = WindowOptions;

export interface ParserInsertedScriptResult {
  readonly element: HTMLScriptElement;
  readonly script: ClassicScript;
  readonly result: EngineResult<EngineValue>;
}

export class WindowExecutionEnvironment extends WindowScriptEnvironment {
  readonly scriptResults: ParserInsertedScriptResult[] = [];

  constructor(options: WindowExecutionOptions = {}) {
    super(new Engine262Adapter(), createWindow(options));
  }

  loadHTML(source: string): Document {
    this.scriptResults.length = 0;
    return parseHTMLIntoDocument(source, this.window.document, (element) => {
      if (
        !(element instanceof HTMLScriptElement) ||
        !isInlineClassic(element)
      ) {
        return;
      }
      const script = this.createClassicScript(element.text);
      this.scriptResults.push({
        element,
        script,
        result: this.runClassicScript(script),
      });
    });
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

function isInlineClassic(element: HTMLScriptElement): boolean {
  if (
    element.getRootNode() !== element.ownerDocument ||
    element.hasAttribute("src") ||
    element.noModule
  ) {
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

function asciiLowercase(value: string): string {
  return value.replace(/[A-Z]/g, (character) => character.toLowerCase());
}

function stripASCIIWhitespace(value: string): string {
  return value.replace(/^[\t\n\f\r ]+|[\t\n\f\r ]+$/g, "");
}
