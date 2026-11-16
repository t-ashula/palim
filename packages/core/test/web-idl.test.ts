import { describe, expect, it } from "vitest";

import { requireArguments, toLong } from "../src/web-idl.js";

describe("Web IDL conversions", () => {
  it("reports the required and supplied argument counts", () => {
    expect(() => {
      requireArguments(0, 1);
    }).toThrow("1 argument required, but only 0 present");
    expect(() => {
      requireArguments(1, 2);
    }).toThrow("2 arguments required, but only 1 present");
    expect(() => {
      requireArguments(2, 2);
    }).not.toThrow();
  });

  it.each([
    [undefined, 0],
    [Number.POSITIVE_INFINITY, 0],
    [3.9, 3],
    [-3.9, -3],
    [4_294_967_297, 1],
    [2_147_483_648, -2_147_483_648],
  ])("converts %j to a signed 32-bit integer", (input, expected) => {
    expect(toLong(input)).toBe(expected);
  });
});
