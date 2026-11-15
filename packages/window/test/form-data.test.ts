import { describe, expect, it } from "vitest";

import { Blob, File } from "../src/blob.js";
import { FormData } from "../src/form-data.js";

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

  it("stores File identity and converts Blob values to File entries", async () => {
    const formData = new FormData();
    const file = new File(["file"], "original.txt", { lastModified: 42 });
    formData.append("same", file);
    formData.append("renamed", file, "renamed.txt");
    formData.set("blob", new Blob(["blob"], { type: "text/plain" }));

    expect(formData.get("same")).toBe(file);
    expect(formData.get("renamed")).toMatchObject({
      name: "renamed.txt",
      lastModified: 42,
    });
    expect(formData.get("blob")).toMatchObject({
      name: "blob",
      type: "text/plain",
    });
    expect(await (formData.get("blob") as File).text()).toBe("blob");
  });
});
