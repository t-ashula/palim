import type { Document, DocumentFragment } from "./dom.js";
import type { HTMLFragmentContext, HTMLParserOptions } from "./html/parser.js";
import { parseHTML, parseHTMLFragment } from "./html/parser.js";

export class DOMParser {
  parseFromString(
    input: string,
    type: "text/html",
    options?: HTMLParserOptions,
  ): Document;
  parseFromString(
    input: string,
    type: string,
    options: HTMLParserOptions = {},
  ): Document {
    if (type !== "text/html") {
      throw new TypeError(`Unsupported type: ${type}`);
    }
    return parseHTML(input, options);
  }

  parseFragment(
    input: string,
    context: HTMLFragmentContext,
    options: HTMLParserOptions = {},
  ): DocumentFragment {
    return parseHTMLFragment(input, context, options);
  }
}

export type { HTMLFragmentContext, HTMLParserOptions };
