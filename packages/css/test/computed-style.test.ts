import type { Document, Element } from "@palim/core";
import { CSSStyleRule, DOMParser } from "@palim/core";
import { describe, expect, test } from "vitest";

import { computedStyle, invalidateComputedStyles } from "../src/index.js";

describe("computedStyle", () => {
  test("applies user-agent display defaults", () => {
    const document = new DOMParser().parseFromString(
      "<main><span>text</span></main>",
      "text/html",
    );

    expect(computedStyle(requiredElement(document, "main")).display).toBe(
      "block",
    );
    expect(computedStyle(requiredElement(document, "span")).display).toBe(
      "inline",
    );
  });

  test("cascades author rules and inline declarations", () => {
    const document = new DOMParser().parseFromString(
      '<style>div { display: block; width: 10px } .item { display: none !important } #target { width: 20px }</style><div id="target" class="item" style="display: inline; width: 30px"></div>',
      "text/html",
    );
    const target = requiredElement(document, "#target");

    expect(computedStyle(target).display).toBe("none");
    expect(computedStyle(target).width).toBe("30px");
  });

  test("resolves inherited and CSS-wide values after invalidation", () => {
    const document = new DOMParser().parseFromString(
      '<section style="font-size: 20px"><span style="font-size: inherit"></span></section>',
      "text/html",
    );
    const section = requiredElement(document, "section");
    const span = requiredElement(document, "span");

    expect(computedStyle(span)["font-size"]).toBe("20px");
    section.setAttribute("style", "font-size: 24px");
    invalidateComputedStyles(document);
    expect(computedStyle(span)["font-size"]).toBe("24px");
  });

  test("uses rules inserted through the stylesheet object", () => {
    const document = new DOMParser().parseFromString(
      "<style></style><div></div>",
      "text/html",
    );
    const sheet = document.styleSheets.item(0);
    if (sheet === null) {
      throw new Error("Expected a stylesheet fixture");
    }

    sheet.insertRule("div { display: none }", 0);
    invalidateComputedStyles(document);

    expect(computedStyle(requiredElement(document, "div")).display).toBe(
      "none",
    );
  });

  test("uses declaration changes made through a style rule", () => {
    const document = new DOMParser().parseFromString(
      "<style>div { display: block }</style><div></div>",
      "text/html",
    );
    const rule = document.styleSheets.item(0)?.cssRules.item(0);
    if (!(rule instanceof CSSStyleRule)) {
      throw new Error("Expected a CSSStyleRule fixture");
    }

    rule.style.setProperty("display", "none");
    invalidateComputedStyles(document);

    expect(computedStyle(requiredElement(document, "div")).display).toBe(
      "none",
    );
  });
});

function requiredElement(document: Document, selector: string): Element {
  const element = document.querySelector(selector);
  if (element === null) {
    throw new TypeError(`Missing test element: ${selector}`);
  }
  return element;
}
