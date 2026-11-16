import { describe, expect, it } from "vitest";

import {
  asciiLowercase,
  asciiUppercase,
  domString,
  normalizeNamespace,
  validateAndExtract,
  validateName,
} from "../../src/dom/conversions.js";
import { expectDOMException } from "../helper/assertions.js";

describe("DOM conversions", () => {
  it("performs DOMString and ASCII-only case conversion", () => {
    expect(domString(null)).toBe("null");
    expect(asciiLowercase("AİZ")).toBe("aİz");
    expect(asciiUppercase("aız")).toBe("AıZ");
  });

  it("normalizes empty namespaces", () => {
    expect(normalizeNamespace(undefined)).toBeNull();
    expect(normalizeNamespace(null)).toBeNull();
    expect(normalizeNamespace("")).toBeNull();
    expect(normalizeNamespace("urn:test")).toBe("urn:test");
  });

  it("validates names and extracts namespace components", () => {
    expect(validateAndExtract("urn:test", "p:item")).toEqual({
      namespace: "urn:test",
      prefix: "p",
      localName: "item",
      qualifiedName: "p:item",
    });
    expect(() => {
      validateName("item");
    }).not.toThrow();
    expectDOMException(() => {
      validateName("1item");
    }, "InvalidCharacterError");
    expectDOMException(
      () => validateAndExtract(null, "p:item"),
      "NamespaceError",
    );
  });
});
