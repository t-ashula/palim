import { describe, expect, it } from "vitest";

import {
  pathPercentEncode,
  percentDecode,
  percentDecodeBytes,
  utf8DecodeWithoutBOM,
  utf8Encode,
  utf8PercentEncode,
} from "../../src/url/encoding.js";

describe("URL encoding", () => {
  it("encodes Unicode strings as UTF-8 bytes", () => {
    expect(utf8Encode("Aé😀")).toEqual([
      0x41, 0xc3, 0xa9, 0xf0, 0x9f, 0x98, 0x80,
    ]);
    expect(utf8PercentEncode("a b?é", pathPercentEncode)).toBe(
      "a%20b%3F%C3%A9",
    );
  });

  it("decodes valid escapes and preserves malformed escapes", () => {
    expect(percentDecode("%41%ZZé")).toEqual([
      0x41, 0x25, 0x5a, 0x5a, 0xc3, 0xa9,
    ]);
    expect(percentDecodeBytes([0x25, 0x34, 0x31, 0x25])).toEqual([0x41, 0x25]);
  });

  it("replaces malformed UTF-8 sequences", () => {
    expect(utf8DecodeWithoutBOM([0x61, 0xc3, 0x28, 0x62])).toBe("a�(b");
  });
});
