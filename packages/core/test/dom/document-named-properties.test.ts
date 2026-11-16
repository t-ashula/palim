import { describe, expect, it } from "vitest";

import {
  documentNamedItem,
  documentNamedPropertyNames,
} from "../../src/dom/document-named-properties.js";
import type { Document, Element } from "../public-test-api.js";
import { DOMParser } from "../public-test-api.js";

function parse(input: string): Document {
  return new DOMParser().parseFromString(input, "text/html");
}

function select(document: Document, selector: string): Element {
  const element = document.querySelector(selector);
  if (element === null) {
    throw new Error(`missing test element: ${selector}`);
  }
  return element;
}

describe("Document named properties", () => {
  it("updates supported names and values when matching elements change", () => {
    const document = parse('<img id="first" name="target">');
    const first = select(document, "#first");

    expect(documentNamedPropertyNames(document)).toEqual(["first", "target"]);
    expect(documentNamedItem(document, "target")).toBe(first);

    const second = document.createElement("object");
    second.setAttribute("name", "target");
    document.body?.append(second);
    const collection = documentNamedItem(document, "target");

    expect(Array.from(collection as Iterable<Element>)).toEqual([
      first,
      second,
    ]);

    first.removeAttribute("name");

    expect(Array.from(collection as Iterable<Element>)).toEqual([second]);
    expect(documentNamedPropertyNames(document)).toEqual(["target"]);
  });
});
