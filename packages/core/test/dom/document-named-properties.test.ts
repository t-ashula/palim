import { describe, expect, it } from "vitest";

import {
  documentNamedItem,
  documentNamedPropertyNames,
} from "../../src/dom/document-named-properties.js";
import { parseHTML as parse, requireElement as select } from "../helper/dom.js";
import type { Element } from "../public-test-api.js";

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
