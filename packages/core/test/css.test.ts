import { describe, expect, test } from "vitest";

import { CSS } from "../src/css.js";

describe("CSS", () => {
  test("escapes identifiers", () => {
    expect(CSS.escape("hello world")).toBe("hello\\ world");
    expect(CSS.escape("0a")).toBe("\\30 a");
    expect(CSS.escape("-1a")).toBe("-\\31 a");
    expect(CSS.escape("\0")).toBe("\uFFFD");
    expect(CSS.escape("-")).toBe("\\-");
    expect(CSS.escape("💩")).toBe("💩");
  });

  test("evaluates declarations and conditions", () => {
    expect(CSS.supports("color", "red")).toBe(true);
    expect(CSS.supports("margin", "10px 20px")).toBe(true);
    expect(CSS.supports("width", "min(100px, 50%)")).toBe(true);
    expect(CSS.supports("color", "rainbow")).toBe(false);
    expect(CSS.supports("  color  ", "red")).toBe(false);
    expect(CSS.supports("not (color: rainbow)")).toBe(true);
    expect(CSS.supports("(color: red) and (display: block)")).toBe(true);
    expect(CSS.supports("(color: red) or (unknown: value)")).toBe(true);
  });
});
