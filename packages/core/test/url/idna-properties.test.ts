import { describe, expect, it } from "vitest";

import {
  IDNA_BIDI_CLASS_RANGES,
  IDNA_JOINING_TYPE_RANGES,
  IDNA_VIRAMA_RANGES,
} from "../../src/url/idna-properties.js";

describe("IDNA property tables", () => {
  it.each([
    ["virama", IDNA_VIRAMA_RANGES],
    ["joining type", IDNA_JOINING_TYPE_RANGES],
    ["bidi class", IDNA_BIDI_CLASS_RANGES],
  ])("contains ordered %s ranges", (_, ranges) => {
    expect(ranges.length).toBeGreaterThan(0);
    for (let index = 1; index < ranges.length; index += 1) {
      const previous = ranges[index - 1];
      const current = ranges[index];
      if (previous === undefined || current === undefined) {
        throw new Error("missing IDNA property range");
      }
      expect(current.start).toBeGreaterThan(previous.end);
    }
  });
});
