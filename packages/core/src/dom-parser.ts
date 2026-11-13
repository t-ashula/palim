import { Document } from "./dom.js";
import {
  documentImplementation,
  nodeImplementation,
} from "./dom/node-implementation.js";
import { descendantElements } from "./dom/traversal.js";
import { htmlDocumentParser } from "./html/parser.js";
import { HTML_NAMESPACE, SVG_NAMESPACE } from "./namespaces.js";
import { URL } from "./url/index.js";
import type { XMLMIMEType } from "./xml/parser.js";
import { xmlDocumentParser } from "./xml/parser.js";

export type DOMParserSupportedType = "text/html" | XMLMIMEType;

export function isDOMParserSupportedType(
  value: string,
): value is DOMParserSupportedType {
  return (
    value === "text/html" ||
    value === "text/xml" ||
    value === "application/xml" ||
    value === "application/xhtml+xml" ||
    value === "image/svg+xml"
  );
}

const associatedDocuments = new WeakMap<DOMParser, Document>();

interface DocumentParser {
  createDocument(
    contentType: string,
    documentConstructor: typeof Document,
  ): Document;
  parseInto(input: string, document: Document): void;
}

export class DOMParser {
  parseFromString(input: string, type: DOMParserSupportedType): Document;
  parseFromString(input: string, type: string): Document {
    if (!isDOMParserSupportedType(type)) {
      throw new TypeError(`Unsupported type: ${type}`);
    }
    const parser: DocumentParser =
      type === "text/html" ? htmlDocumentParser : xmlDocumentParser;
    const document = parser.createDocument(type, Document);
    initializeDOMParserDocument(this, document);
    parser.parseInto(input, document);
    finalizeDOMParserDocument(document);
    return document;
  }
}

export function associateDOMParser(
  parser: DOMParser,
  document: Document,
): void {
  associatedDocuments.set(parser, document);
}

function initializeDOMParserDocument(
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
}

function finalizeDOMParserDocument(document: Document): void {
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
