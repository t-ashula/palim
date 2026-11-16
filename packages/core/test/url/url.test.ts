import { describe, expect, it } from "vitest";

import { URL, urlRecord } from "../../src/url/url.js";

describe("URL", () => {
  it("reflects component setters in href", () => {
    const url = new URL("/path", "https://example.test/base");
    url.pathname = "/next";
    url.search = "?q=one";
    url.hash = "#part";

    expect(url.href).toBe("https://example.test/next?q=one#part");
    expect(urlRecord(url).path).toEqual(["next"]);
  });

  it("rejects an invalid URL without a base", () => {
    expect(() => new URL("relative")).toThrow(TypeError);
  });
});
