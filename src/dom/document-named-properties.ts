import { createHTMLCollection } from "./collections.js";
import type { HTMLCollection } from "./collections.js";
import { documentImplementation } from "./node-implementation.js";
import type { DocumentImplementation } from "./node-implementation.js";
import type { Document, Element } from "./nodes.js";
import { descendantElements } from "./traversal.js";
import { HTML_NAMESPACE } from "../namespaces.js";

const DOCUMENT_NAMED_ELEMENT_LOCAL_NAMES = new Set([
  "embed",
  "form",
  "iframe",
  "img",
  "object",
]);

const DOCUMENT_NAMED_ITEM_COLLECTIONS = new WeakMap<
  DocumentImplementation,
  Map<string, HTMLCollection<Element, Element>>
>();
const DOCUMENT_NAMED_PROPERTY_NAMES = new WeakMap<
  DocumentImplementation,
  { readonly version: number; readonly names: readonly string[] }
>();

export function documentNamedPropertyNames(
  document: Document,
): readonly string[] {
  const implementation = documentImplementation(document);
  const cached = DOCUMENT_NAMED_PROPERTY_NAMES.get(implementation);
  if (cached?.version === implementation.namedPropertyVersion) {
    return cached.names;
  }
  const names: string[] = [];
  for (const element of descendantElements(document)) {
    if (!isDocumentNamedElement(element)) {
      continue;
    }
    const id = documentNamedElementId(element);
    if (id !== null && id !== "" && !names.includes(id)) {
      names.push(id);
    }
    const name = element.getAttributeNS(null, "name");
    if (name !== null && name !== "" && !names.includes(name)) {
      names.push(name);
    }
  }
  const result = Object.freeze(names);
  DOCUMENT_NAMED_PROPERTY_NAMES.set(implementation, {
    version: implementation.namedPropertyVersion,
    names: result,
  });
  return result;
}

export function documentNamedItem(
  document: Document,
  name: string,
): object | null | undefined {
  const elements = documentNamedElements(document, name);
  const element = elements[0];
  if (element === undefined) {
    return undefined;
  }
  if (elements.length === 1) {
    return element.localName === "iframe"
      ? iframeContentWindow(element)
      : element;
  }
  const implementation = documentImplementation(document);
  let collections = DOCUMENT_NAMED_ITEM_COLLECTIONS.get(implementation);
  if (collections === undefined) {
    collections = new Map();
    DOCUMENT_NAMED_ITEM_COLLECTIONS.set(implementation, collections);
  }
  let collection = collections.get(name);
  if (collection === undefined) {
    collection = createHTMLCollection(() =>
      documentNamedElements(document, name),
    );
    collections.set(name, collection);
  }
  return collection;
}

function documentNamedElements(document: Document, name: string): Element[] {
  return descendantElements(document).filter(
    (element) =>
      isDocumentNamedElement(element) &&
      (documentNamedElementId(element) === name ||
        element.getAttributeNS(null, "name") === name),
  );
}

function isDocumentNamedElement(element: Element): boolean {
  if (
    element.namespaceURI !== HTML_NAMESPACE ||
    !DOCUMENT_NAMED_ELEMENT_LOCAL_NAMES.has(element.localName)
  ) {
    return false;
  }
  return (
    element.localName === "object" ||
    (element.getAttributeNS(null, "name") ?? "") !== ""
  );
}

function documentNamedElementId(element: Element): string | null {
  return element.localName === "object" || element.localName === "img"
    ? element.getAttributeNS(null, "id")
    : null;
}

function iframeContentWindow(element: Element): object | null {
  return (element as Element & { readonly contentWindow: object | null })
    .contentWindow;
}
