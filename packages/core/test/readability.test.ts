import { isProbablyReaderable, Readability } from "@mozilla/readability";
import { setDocumentURL } from "@palim/core/internal/dom/nodes.js";
import { describe, expect, it } from "vitest";

import type { Document } from "./public-test-api.js";
import { DOMParser } from "./public-test-api.js";

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

  it("exposes the document base URI while Readability resolves links", () => {
    const document = new DOMParser().parseFromString(
      `<article><p>${"Article text. ".repeat(30)}<a href="relative">Link</a></p></article>`,
      "text/html",
    );
    setDocumentURL(document, "https://example.test/articles/page.html");

    expect(document.baseURI).toBe("https://example.test/articles/page.html");
    const article = new Readability(readabilityDocument(document)).parse();
    expect(document.baseURI).toBe("https://example.test/articles/page.html");
    expect(article?.content).toContain(
      'href="https://example.test/articles/relative"',
    );
  });
});
