import { describe, expect, it } from "vitest";

import { tokenize } from "../../src/html/tokenizer.js";

describe("HTML tokenizer", () => {
  it("emits tags, merged character data, comments, and EOF", () => {
    const result = tokenize("<p id=x>text&amp;more</p><!--note-->");

    expect(result.tokens).toEqual([
      {
        type: "StartTag",
        name: "p",
        attributes: { id: "x" },
        selfClosing: false,
      },
      { type: "Character", data: "text&more" },
      { type: "EndTag", name: "p" },
      { type: "Comment", data: "note" },
    ]);
    expect(result.errors).toEqual([]);
  });

  it("reports malformed character references", () => {
    expect(tokenize("&#0;").errors.map(({ code }) => code)).toContain(
      "null-character-reference",
    );
  });
});
