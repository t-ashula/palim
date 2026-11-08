import { describe, expect, it } from "vitest";

import { Document, Sanitizer } from "./public-test-api.js";

describe("Sanitizer", () => {
  it("canonicalizes configuration and keeps returned copies independent", () => {
    const sanitizer = new Sanitizer({
      elements: [
        {
          name: "div",
          attributes: ["title"],
        },
      ],
    });

    const first = sanitizer.get();
    expect(first.elements).toEqual([
      {
        name: "div",
        namespace: "http://www.w3.org/1999/xhtml",
        attributes: [{ name: "title", namespace: null }],
      },
    ]);
    first.elements?.splice(0);
    expect(sanitizer.get().elements).toHaveLength(1);
  });

  it("filters while parsing and redirects replaced element children", () => {
    const document = Document.parseHTMLUnsafe(
      "a<!--comment-->b<section><strong>child</strong></section>",
      {
        sanitizer: {
          comments: false,
          replaceWithChildrenElements: ["section"],
        },
      },
    );

    expect(document.body?.childNodes.item(0)?.textContent).toBe("ab");
    expect(document.body?.querySelector("section")).toBeNull();
    expect(document.body?.querySelector("strong")?.textContent).toBe("child");
  });
});
