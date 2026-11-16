import { describe, expect, it } from "vitest";

import {
  containsOnlyXMLCharacters,
  isXMLCharacter,
  isXMLName,
  isXMLNameCharacter,
  isXMLNameStart,
} from "../../src/xml/syntax.js";

describe("XML syntax predicates", () => {
  it("distinguishes name starts from later name characters", () => {
    expect(isXMLNameStart("A")).toBe(true);
    expect(isXMLNameStart("_", false)).toBe(true);
    expect(isXMLNameStart(":", false)).toBe(false);
    expect(isXMLNameStart("1")).toBe(false);
    expect(isXMLNameCharacter("1")).toBe(true);
    expect(isXMLNameCharacter("-")).toBe(true);
  });

  it("validates complete names with optional colon support", () => {
    expect(isXMLName("prefix:item")).toBe(true);
    expect(isXMLName("prefix:item", false)).toBe(false);
    expect(isXMLName("1item")).toBe(false);
    expect(isXMLName("")).toBe(false);
  });

  it("rejects nulls and surrogate code points as XML characters", () => {
    expect(isXMLCharacter(0x9)).toBe(true);
    expect(isXMLCharacter(0)).toBe(false);
    expect(isXMLCharacter(0xd800)).toBe(false);
    expect(containsOnlyXMLCharacters("text\n😀")).toBe(true);
    expect(containsOnlyXMLCharacters("text\0")).toBe(false);
  });
});
