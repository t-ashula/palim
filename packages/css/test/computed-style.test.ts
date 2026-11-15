import type { Document, Element } from "@palim/core";
import { DOMParser } from "@palim/core";
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
});

function requiredElement(document: Document, selector: string): Element {
  const element = document.querySelector(selector);
  if (element === null) {
    throw new TypeError(`Missing test element: ${selector}`);
  }
  return element;
}
