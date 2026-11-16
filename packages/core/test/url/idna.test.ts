import { describe, expect, it } from "vitest";

import { domainToASCII } from "../../src/url/idna.js";

describe("domainToASCII", () => {
  it("maps Unicode labels to ASCII", () => {
    expect(domainToASCII("BÜCHER.example")).toBe("xn--bcher-kva.example");
  });

  it("rejects invalid labels", () => {
    expect(domainToASCII("a�b")).toBeNull();
  });
});
