import { describe, expect, it } from "vitest";

import { HTMLTokenizer, tokenize } from "../../src/html/tokenizer.js";

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

  it("preserves the order of insertions made before tokenization resumes", () => {
    const tokenizer = new HTMLTokenizer("", { streaming: true });

    tokenizer.insert("B");
    tokenizer.insert("A");
    tokenizer.insert("R");
    tokenizer.close();

    expect(tokenizer.run().tokens).toEqual([
      { type: "Character", data: "BAR" },
    ]);
  });

  it("preserves CDATA section states across appended input", () => {
    const tokenizer = new HTMLTokenizer("", {
      initialState: "CDATA section state",
      streaming: true,
    });
    const tokens = [];

    for (const character of "content]]>after") {
      tokenizer.append(character);
      for (let token = tokenizer.nextToken(); token !== null;) {
        tokens.push(token);
        token = tokenizer.nextToken();
      }
    }
    tokenizer.close();
    for (let token = tokenizer.nextToken(); token !== null;) {
      tokens.push(token);
      token = tokenizer.nextToken();
    }

    expect(tokens.every((token) => token.type === "Character")).toBe(true);
    expect(
      tokens
        .map((token) => (token.type === "Character" ? token.data : ""))
        .join(""),
    ).toBe("contentafter");
  });
});
