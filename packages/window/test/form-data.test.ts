import { FormData } from "@palim/window/internal/form-data.js";
import { describe, expect, it } from "vitest";

describe("FormData", () => {
  it("owns a copied entry list in the Window capability", () => {
    const entries: [string, string][] = [
      ["first", "one"],
      ["first", "two"],
    ];
    const formData = new FormData(entries);
    entries[0] = ["changed", "outside"];

    formData.append("last", "three");

    expect(Array.from(formData)).toEqual([
      ["first", "one"],
      ["first", "two"],
      ["last", "three"],
    ]);
  });
});
