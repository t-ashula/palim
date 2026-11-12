import { describe, expect, it } from "vitest";

import {
  parseFormUrlEncoded,
  parseFormUrlEncodedString,
  serializeFormUrlEncoded,
} from "@palim/core/internal/url/index.js";

describe("application/x-www-form-urlencoded", () => {
  it("parses bytes before decoding names and values as UTF-8", () => {
    expect(
      parseFormUrlEncoded(
        new TextEncoder().encode(
          "%EF%BB%BFtest=%EF%BB%BF&bad=%C2x&raw=†&empty&plus=a+b",
        ),
      ),
    ).toEqual([
      ["\ufefftest", "\ufeff"],
      ["bad", "\ufffdx"],
      ["raw", "†"],
      ["empty", ""],
      ["plus", "a b"],
    ]);
  });

  it("preserves empty values while ignoring empty sequences", () => {
    expect(parseFormUrlEncodedString("&&a&&b=&=c&&")).toEqual([
      ["a", ""],
      ["b", ""],
      ["", "c"],
    ]);
  });

  it("serializes pairs with the form percent-encode set", () => {
    expect(
      serializeFormUrlEncoded([
        ["a b", "~"],
        ["†", "x+y"],
      ]),
    ).toBe("a+b=%7E&%E2%80%A0=x%2By");
  });
});
