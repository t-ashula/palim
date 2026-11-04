import { Readability, isProbablyReaderable } from "@mozilla/readability";
import { describe, expect, it } from "vitest";

import { DOMParser, type Document } from "../src/index.js";

function readabilityDocument(document: Document): never {
  return document as never;
}

describe("Mozilla Readability connection", () => {
  it("accepts a palim Document", () => {
    const document = new DOMParser().parseFromString(
      "<article><p>Article text.</p></article>",
      "text/html",
    );

    expect(() => new Readability(readabilityDocument(document))).not.toThrow();
    expect(typeof isProbablyReaderable(readabilityDocument(document))).toBe(
      "boolean",
    );
  });

  it("accepts a cloned palim Document", () => {
    const document = new DOMParser().parseFromString(
      "<article><p>Article text.</p></article>",
      "text/html",
    );
    const clone = document.cloneNode(true) as Document;

    expect(() => new Readability(readabilityDocument(clone))).not.toThrow();
  });
});
