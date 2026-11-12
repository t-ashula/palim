import type { HTMLCollection } from "@palim/core/internal/dom/collections.js";
import { createHTMLCollection } from "@palim/core/internal/dom/collections.js";
import type { DocumentImplementation } from "@palim/core/internal/dom/node-implementation.js";
import { documentImplementation } from "@palim/core/internal/dom/node-implementation.js";
import type { Document, Element } from "@palim/core/internal/dom/nodes.js";
import { descendantElements } from "@palim/core/internal/dom/traversal.js";
import { HTML_NAMESPACE } from "@palim/core/internal/namespaces.js";

import type { Window } from "./window.js";

const WINDOW_NAMED_ELEMENT_LOCAL_NAMES = new Set([
  "embed",
  "form",
  "iframe",
  "img",
  "object",
]);

const WINDOW_NAMED_ITEM_COLLECTIONS = new WeakMap<
  DocumentImplementation,
  Map<string, HTMLCollection<Element, Element>>
>();
const WINDOW_NAMED_PROPERTY_NAMES = new WeakMap<
  DocumentImplementation,
  { readonly version: number; readonly names: readonly string[] }
>();

export function windowNamedPropertyNames(window: Window): readonly string[] {
  const document = window.document;
  const implementation = documentImplementation(document);
  const cached = WINDOW_NAMED_PROPERTY_NAMES.get(implementation);
  if (cached?.version === implementation.namedPropertyVersion) {
    return cached.names;
  }
  const names: string[] = [];
  for (const element of descendantElements(document)) {
    const id = element.getAttributeNS(null, "id");
    if (id !== null && id !== "" && !names.includes(id)) {
      names.push(id);
    }
    if (!isWindowNamedElement(element)) {
      continue;
    }
    const name = element.getAttributeNS(null, "name");
    if (name !== null && name !== "" && !names.includes(name)) {
      names.push(name);
    }
  }
  const result = Object.freeze(names);
  WINDOW_NAMED_PROPERTY_NAMES.set(implementation, {
    version: implementation.namedPropertyVersion,
    names: result,
  });
  return result;
}

export function windowNamedPropertyValue(
  window: Window,
  name: string,
): object | null | undefined {
  const document = window.document;
  const elements = windowNamedElements(document, name);
  if (elements.length === 0) {
    return undefined;
  }
  if (elements.length === 1) {
    const element = elements[0];
    return element?.localName === "iframe"
      ? iframeContentWindow(element)
      : element;
  }
  const implementation = documentImplementation(document);
  let collections = WINDOW_NAMED_ITEM_COLLECTIONS.get(implementation);
  if (collections === undefined) {
    collections = new Map();
    WINDOW_NAMED_ITEM_COLLECTIONS.set(implementation, collections);
  }
  let collection = collections.get(name);
  if (collection === undefined) {
    collection = createHTMLCollection(() =>
      windowNamedElements(document, name),
    );
    collections.set(name, collection);
  }
  return collection;
}

function windowNamedElements(document: Document, name: string): Element[] {
  return descendantElements(document).filter(
    (element) =>
      element.getAttributeNS(null, "id") === name ||
      (isWindowNamedElement(element) &&
        element.getAttributeNS(null, "name") === name),
  );
}

function iframeContentWindow(element: Element): object | null {
  return (element as Element & { readonly contentWindow: object | null })
    .contentWindow;
}

function isWindowNamedElement(element: Element): boolean {
  return (
    element.namespaceURI === HTML_NAMESPACE &&
    WINDOW_NAMED_ELEMENT_LOCAL_NAMES.has(element.localName)
  );
}
