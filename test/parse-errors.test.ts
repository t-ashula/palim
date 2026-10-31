import { describe, expect, it } from "vitest";

import { Document, DOMParser, parseErrors } from "../src/index.js";
import type { ParseErrorSource } from "../src/index.js";

describe("parseErrors", () => {
  it("returns no errors for a conforming document", () => {
    const document = new DOMParser().parseFromString(
      "<!doctype html><html><head></head><body></body></html>",
      "text/html",
    );

    expect(parseErrors(document)).toEqual([]);
  });

  it("returns tokenizer errors stored in the parsed document", () => {
    const document = new DOMParser().parseFromString("\0", "text/html");

    expect(parseErrors(document)).toEqual([
      {
        source: "tokenizer",
        code: "unexpected-null-character",
        line: 1,
        column: 1,
      },
      {
        source: "tree-construction",
        code: "missing-doctype",
        line: null,
        column: null,
      },
      {
        source: "tree-construction",
        code: "null-character-in-body",
        line: null,
        column: null,
      },
    ]);
  });

  it("returns tree-construction errors stored in the parsed document", () => {
    const document = new DOMParser().parseFromString(
      "<!doctype html><p></div>",
      "text/html",
    );

    expect(
      parseErrors(document).some(
        (error) => error.source === "tree-construction",
      ),
    ).toBe(true);
  });

  it("keeps errors associated with each document", () => {
    const parser = new DOMParser();
    const first = parser.parseFromString("\0", "text/html");
    const second = parser.parseFromString("<!doctype html>", "text/html");

    expect(parseErrors(first)).toHaveLength(3);
    expect(parseErrors(second)).toEqual([]);
  });

  it("returns a read-only snapshot", () => {
    const document = new DOMParser().parseFromString("\0", "text/html");
    const errors = parseErrors(document);

    expect(Object.isFrozen(errors)).toBe(true);
    expect(Object.isFrozen(errors[0])).toBe(true);
    expect(parseErrors(document)).not.toBe(errors);
  });

  it("accepts the internal parse-error source interface", () => {
    const source: ParseErrorSource = new Document();

    expect(parseErrors(source)).toEqual([]);
  });
});
