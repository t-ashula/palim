import { describe, expect, it } from "vitest";

import { tokenizeCSS } from "../src/css-syntax.js";

describe("CSS tokenization", () => {
  it("normalizes input and preserves token source text", () => {
    expect(tokenizeCSS("name\r\n#id 12px 50%")).toEqual([
      { type: "ident", value: "name", raw: "name" },
      { type: "whitespace", raw: "\n" },
      { type: "hash", value: "id", id: true, raw: "#id" },
      { type: "whitespace", raw: " " },
      { type: "dimension", value: 12, unit: "px", raw: "12px" },
      { type: "whitespace", raw: " " },
      { type: "percentage", value: 50, raw: "50%" },
    ]);
  });

  it("removes comments and replaces null characters", () => {
    expect(tokenizeCSS("a/* hidden */\0b")).toEqual([
      { type: "ident", value: "a", raw: "a" },
      { type: "ident", value: "�b", raw: "�b" },
    ]);
  });
});
