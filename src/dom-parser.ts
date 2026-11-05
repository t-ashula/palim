import type { Document } from "./dom.js";
import {
  documentImplementation,
  nodeImplementation,
} from "./dom/node-implementation.js";
import { descendantElements } from "./dom/traversal.js";
import { parseHTML } from "./html/parser.js";
import { HTML_NAMESPACE, SVG_NAMESPACE } from "./namespaces.js";
import { URL } from "./url/index.js";
import { parseXML } from "./xml/parser.js";
import type { XMLMIMEType } from "./xml/parser.js";

export type DOMParserSupportedType = "text/html" | XMLMIMEType;

const associatedDocuments = new WeakMap<DOMParser, Document>();

export class DOMParser {
  parseFromString(input: string, type: DOMParserSupportedType): Document;
  parseFromString(input: string, type: string): Document {
    let document: Document;
    if (type === "text/html") {
      document = parseHTML(input);
    } else if (
      type === "text/xml" ||
      type === "application/xml" ||
      type === "application/xhtml+xml" ||
      type === "image/svg+xml"
    ) {
      document = parseXML(input, type);
    } else {
      throw new TypeError(`Unsupported type: ${type}`);
    }
    finalizeDOMParserDocument(this, document);
    return document;
  }
}

export function associateDOMParser(
  parser: DOMParser,
  document: Document,
): void {
  associatedDocuments.set(parser, document);
}

function finalizeDOMParserDocument(
  parser: DOMParser,
  document: Document,
): void {
  const associatedDocument = associatedDocuments.get(parser);
  if (associatedDocument !== undefined) {
    const source = documentImplementation(associatedDocument);
    const implementation = documentImplementation(document);
    implementation.relevantRealmDocument = source.relevantRealmDocument;
    implementation.url = new URL(source.url.href);
    implementation.origin = source.origin;
  }
  for (const element of descendantElements(document)) {
    if (
      element.localName === "script" &&
      (element.namespaceURI === HTML_NAMESPACE ||
        element.namespaceURI === SVG_NAMESPACE)
    ) {
      nodeImplementation(element).scriptAlreadyStarted = true;
    }
  }
}
