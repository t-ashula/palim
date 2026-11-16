import { describe, expect, it } from "vitest";

import {
  createRange,
  createStaticRange,
  isRange,
  isStaticRange,
} from "../../src/dom/range-implementation.js";
import { parseHTML, requireElement } from "../helper/dom.js";

describe("range implementations", () => {
  it("creates a collapsed live Range for a Document", () => {
    const document = parseHTML("<main></main>");
    const range = createRange(document);

    expect(isRange(range)).toBe(true);
    expect(range.collapsed).toBe(true);
    expect(range.startContainer).toBe(document);
  });

  it("creates an immutable StaticRange from boundary points", () => {
    const document = parseHTML("<main>text</main>");
    const main = requireElement(document, "main");
    const text = main.firstChild;
    if (text === null) {
      throw new Error("missing text node");
    }
    const range = createStaticRange({
      startContainer: text,
      startOffset: 0,
      endContainer: text,
      endOffset: 4,
    });

    expect(isStaticRange(range)).toBe(true);
    expect(range.collapsed).toBe(false);
  });
});
