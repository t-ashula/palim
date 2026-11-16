import type { Document, Element } from "../public-test-api.js";
import { DOMParser } from "../public-test-api.js";

export function parseHTML(input = ""): Document {
  return new DOMParser().parseFromString(input, "text/html");
}

export function requireElement(document: Document, selector: string): Element {
  const element = document.querySelector(selector);
  if (element === null) {
    throw new Error(`missing test element: ${selector}`);
  }
  return element;
}
