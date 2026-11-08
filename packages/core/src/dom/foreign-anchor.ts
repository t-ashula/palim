import { MATHML_NAMESPACE, SVG_NAMESPACE } from "../namespaces.js";
import type { Element } from "./nodes.js";
import { createDOMTokenList, type DOMTokenList } from "./token-list.js";

const FOREIGN_ANCHOR_REL_LISTS = new WeakMap<Element, DOMTokenList>();

export function isForeignAnchorElement(element: Element): boolean {
  return (
    element.localName === "a" &&
    (element.namespaceURI === SVG_NAMESPACE ||
      element.namespaceURI === MATHML_NAMESPACE)
  );
}

export function foreignAnchorRelList(element: Element): DOMTokenList {
  if (!isForeignAnchorElement(element)) {
    throw new TypeError("Element is not an SVG or MathML anchor");
  }
  let relList = FOREIGN_ANCHOR_REL_LISTS.get(element);
  if (relList === undefined) {
    relList = createDOMTokenList(element, "rel");
    FOREIGN_ANCHOR_REL_LISTS.set(element, relList);
  }
  return relList;
}
