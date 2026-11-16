import { describe, expect, it } from "vitest";

import { URL } from "../../src/url/url.js";
import { URLSearchParams } from "../../src/url/url-search-params.js";

describe("URLSearchParams", () => {
  it("preserves duplicate values and serializes mutations", () => {
    const params = new URLSearchParams("a=1&a=2&space=one+two");
    expect(params.getAll("a")).toEqual(["1", "2"]);
    expect(params.get("space")).toBe("one two");

    params.set("a", "3");
    params.append("b", "4");
    expect(params.toString()).toBe("a=3&space=one+two&b=4");
  });

  it("updates its owning URL", () => {
    const url = new URL("https://example.test/?a=1");
    url.searchParams.append("b", "2");
    expect(url.search).toBe("?a=1&b=2");
  });
});
