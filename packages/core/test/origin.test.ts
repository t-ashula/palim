import { describe, expect, it } from "vitest";

import { OpaqueOrigin, originFromURL } from "../src/origin.js";
import { URL } from "../src/url/index.js";

describe("URL origins", () => {
  it("creates tuple origins for HTTP URLs", () => {
    expect(originFromURL(new URL("https://example.test:8443/path"))).toEqual({
      type: "tuple",
      scheme: "https",
      host: "example.test",
      port: 8443,
    });
  });

  it("gives every non-HTTP origin a distinct opaque identity", () => {
    const first = originFromURL(new URL("data:text/plain,first"));
    const second = originFromURL(new URL("data:text/plain,second"));
    if (!(first instanceof OpaqueOrigin) || !(second instanceof OpaqueOrigin)) {
      throw new Error("expected opaque origins");
    }

    expect(first.isSameOrigin(first)).toBe(true);
    expect(first.isSameOrigin(second)).toBe(false);
  });
});
