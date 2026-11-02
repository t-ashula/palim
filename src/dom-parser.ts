import type { Document } from "./dom.js";
import { parseHTML } from "./html/parser.js";
import { parseXML } from "./xml/parser.js";
import type { XMLMIMEType } from "./xml/parser.js";

export type DOMParserSupportedType = "text/html" | XMLMIMEType;

export class DOMParser {
  parseFromString(input: string, type: DOMParserSupportedType): Document;
  parseFromString(input: string, type: string): Document {
    if (type === "text/html") {
      return parseHTML(input);
    }
    if (
      type === "text/xml" ||
      type === "application/xml" ||
      type === "application/xhtml+xml" ||
      type === "image/svg+xml"
    ) {
      return parseXML(input, type);
    }
    throw new TypeError(`Unsupported type: ${type}`);
  }
}
