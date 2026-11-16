import { describe, expect, it } from "vitest";

import {
  createHTMLCollection,
  createNamedNodeMap,
  createNodeList,
  htmlCollectionSupportedPropertyNames,
  namedNodeMapSupportedPropertyNames,
} from "../../src/dom/collections.js";
import { parseHTML, requireElement } from "../helper/dom.js";

describe("DOM collections", () => {
  it("creates a live NodeList", () => {
    const document = parseHTML("<main><span></span></main>");
    const main = requireElement(document, "main");
    const list = createNodeList(() => [...main.childNodes]);

    expect(list.length).toBe(1);
    expect(list.item(0)).toBe(main.firstChild);

    main.append(document.createElement("i"));

    expect(list.length).toBe(2);
    expect([...list]).toEqual([...main.childNodes]);
  });

  it("exposes HTMLCollection names from ids and name attributes", () => {
    const document = parseHTML(
      '<main><img id="logo"><form name="search"></form><div name="ignored"></div></main>',
    );
    const main = requireElement(document, "main");
    const collection = createHTMLCollection(() => [...main.children]);

    expect(htmlCollectionSupportedPropertyNames(collection)).toEqual([
      "logo",
      "search",
      "ignored",
    ]);
    expect(collection.namedItem("logo")).toBe(main.firstElementChild);
  });

  it("creates a live NamedNodeMap for an element", () => {
    const element = requireElement(
      parseHTML('<main id="target" class="first"></main>'),
      "main",
    );
    const attributes = createNamedNodeMap(element);

    expect(namedNodeMapSupportedPropertyNames(attributes)).toEqual([
      "id",
      "class",
    ]);

    element.setAttribute("title", "label");

    expect(attributes.getNamedItem("title")?.value).toBe("label");
    expect(attributes.length).toBe(3);
  });
});
