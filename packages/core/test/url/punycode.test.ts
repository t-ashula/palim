import { describe, expect, it } from "vitest";

import { punycodeDecode, punycodeEncode } from "../../src/url/punycode.js";

describe("Punycode", () => {
  it.each([
    ["bücher", "bcher-kva"],
    ["例え", "r8jz45g"],
    ["mañana", "maana-pta"],
  ])("round-trips %s", (unicode, encoded) => {
    expect(punycodeEncode(unicode)).toBe(encoded);
    expect(punycodeDecode(encoded)).toBe(unicode);
  });

  it("rejects invalid encoded input", () => {
    expect(punycodeDecode("invalid_")).toBeNull();
  });
});
