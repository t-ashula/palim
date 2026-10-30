import type { Document } from "./dom.js";
import { parseHTML } from "./html/parser.js";

export class DOMParser {
  parseFromString(input: string, type: "text/html"): Document;
  parseFromString(input: string, type: string): Document {
    if (type !== "text/html") {
      throw new TypeError(`Unsupported type: ${type}`);
    }
    return parseHTML(input);
  }
}
