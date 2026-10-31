import type { Document, DocumentFragment } from "./dom.js";
import type { HTMLFragmentContext } from "./html/parser.js";
import { parseHTML, parseHTMLFragment } from "./html/parser.js";

export class DOMParser {
  parseFromString(input: string, type: "text/html"): Document;
  parseFromString(input: string, type: string): Document {
    if (type !== "text/html") {
      throw new TypeError(`Unsupported type: ${type}`);
    }
    return parseHTML(input);
  }

  parseFragment(input: string, context: HTMLFragmentContext): DocumentFragment {
    return parseHTMLFragment(input, context);
  }
}

export type { HTMLFragmentContext };
