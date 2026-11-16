import { describe, expect, it } from "vitest";

import { parseInternalSubset } from "../../src/xml/dtd.js";

describe("XML internal subsets", () => {
  it("collects entities and default attributes", () => {
    const result = parseInternalSubset(
      '<!ENTITY name "value"><!ATTLIST item kind NMTOKEN "default">',
    );

    expect(result.generalEntities.get("name")).toEqual({
      value: "value",
      external: false,
      wellFormed: true,
    });
    expect(result.defaultAttributes).toEqual([
      {
        elementName: "item",
        attributeName: "kind",
        value: "default",
        tokenized: true,
      },
    ]);
  });

  it("rejects malformed declarations", () => {
    expect(() => parseInternalSubset("<!ENTITY missing")).toThrow(SyntaxError);
  });
});
