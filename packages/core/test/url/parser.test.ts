import { describe, expect, it } from "vitest";

import {
  parseURL,
  serializeOrigin,
  serializeURL,
  setURLFragment,
  setURLPathname,
  setURLQuery,
} from "../../src/url/parser.js";

describe("URL parsing and serialization", () => {
  it("parses relative URLs and serializes their origin", () => {
    const base = parseURL("https://example.test/a/b");
    const url = parseURL("../c?q=1#f", base ?? undefined);
    if (url === null) {
      throw new Error("URL parse failed");
    }

    expect(serializeURL(url)).toBe("https://example.test/c?q=1#f");
    expect(serializeOrigin(url)).toBe("https://example.test");
  });

  it("updates path, query, and fragment components", () => {
    const url = parseURL("https://example.test/old");
    if (url === null) {
      throw new Error("URL parse failed");
    }

    setURLPathname(url, "/next path");
    setURLQuery(url, "x=1 2");
    setURLFragment(url, "part 1");

    expect(serializeURL(url)).toBe(
      "https://example.test/next%20path?x=1%202#part%201",
    );
  });
});
