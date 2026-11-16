import { describe, expect, it } from "vitest";

import { parseURL, URL, URLSearchParams } from "../../src/url/index.js";

describe("URL module exports", () => {
  it("provides the public URL constructors and parser", () => {
    expect(new URL("https://example.test/").hostname).toBe("example.test");
    expect(new URLSearchParams("a=1").get("a")).toBe("1");
    expect(parseURL("https://example.test/")).not.toBeNull();
  });
});
