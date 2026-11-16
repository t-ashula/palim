import { describe, expect, it } from "vitest";

import { IDNA_MAPPING_TABLE } from "../../src/url/idna-mapping.js";

describe("IDNA mapping table", () => {
  it("contains ordered, non-overlapping code point ranges", () => {
    expect(IDNA_MAPPING_TABLE.length).toBeGreaterThan(0);
    for (let index = 1; index < IDNA_MAPPING_TABLE.length; index += 1) {
      const previous = IDNA_MAPPING_TABLE[index - 1];
      const current = IDNA_MAPPING_TABLE[index];
      if (previous === undefined || current === undefined) {
        throw new Error("missing IDNA range");
      }
      expect(current.start).toBeGreaterThan(previous.end);
    }
  });
});
