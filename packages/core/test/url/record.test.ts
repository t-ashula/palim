import { describe, expect, it } from "vitest";

import {
  cloneURLRecord,
  defaultPort,
  emptyURLRecord,
  hasOpaquePath,
  isSpecialScheme,
} from "../../src/url/record.js";

describe("URL records", () => {
  it("identifies special schemes and their default ports", () => {
    expect(isSpecialScheme("https")).toBe(true);
    expect(isSpecialScheme("custom")).toBe(false);
    expect(defaultPort("http")).toBe(80);
    expect(defaultPort("file")).toBeNull();
    expect(defaultPort("custom")).toBeUndefined();
  });

  it("creates and independently clones records", () => {
    const record = emptyURLRecord();
    if (!Array.isArray(record.path)) {
      throw new Error("expected a hierarchical URL path");
    }
    record.path.push("one");
    const clone = cloneURLRecord(record);
    if (!Array.isArray(clone.path)) {
      throw new Error("expected a cloned hierarchical URL path");
    }
    clone.path.push("two");

    expect(record.path).toEqual(["one"]);
    expect(clone.path).toEqual(["one", "two"]);
    expect(hasOpaquePath(record)).toBe(false);
  });
});
