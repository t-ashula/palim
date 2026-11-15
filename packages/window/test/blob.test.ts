import { describe, expect, it } from "vitest";

import { Blob, File } from "../src/blob.js";

describe("Blob", () => {
  it("copies parts and normalizes the content type", async () => {
    const source = new Uint8Array([65, 66]);
    const blob = new Blob([source, "\ud800"], { type: "Text/Plain" });
    source[0] = 90;

    expect(blob.size).toBe(5);
    expect(blob.type).toBe("text/plain");
    expect(Array.from(new Uint8Array(await blob.arrayBuffer()))).toEqual([
      65, 66, 0xef, 0xbf, 0xbd,
    ]);
  });

  it("returns independent slices and ArrayBuffers", async () => {
    const blob = new Blob([new Uint8Array([1, 2, 3, 4])]);
    const slice = blob.slice(-3, -1, "APPLICATION/OCTET-STREAM");
    const result = new Uint8Array(await slice.arrayBuffer());
    result[0] = 9;

    expect(slice.size).toBe(2);
    expect(slice.type).toBe("application/octet-stream");
    expect(Array.from(new Uint8Array(await slice.arrayBuffer()))).toEqual([
      2, 3,
    ]);
    expect(Array.from(new Uint8Array(await blob.arrayBuffer()))).toEqual([
      1, 2, 3, 4,
    ]);
  });

  it("decodes text as UTF-8", async () => {
    expect(await new Blob(["a", new Uint8Array([0xc3, 0xa9])]).text()).toBe(
      "aé",
    );
  });

  it("replaces invalid UTF-8 and strips one leading byte order mark", async () => {
    const invalid = new Blob([
      new Uint8Array([
        192, 193, 245, 246, 247, 248, 249, 250, 251, 252, 253, 254, 255,
      ]),
    ]);
    const byteOrderMarks = new Blob([
      new Uint8Array([0xef, 0xbb, 0xbf, 0xef, 0xbb, 0xbf, 0x50]),
    ]);

    expect(await invalid.text()).toBe("�".repeat(13));
    expect(await byteOrderMarks.text()).toBe("﻿P");
  });
});

describe("File", () => {
  it("adds file metadata to Blob data", async () => {
    const file = new File(["content"], "example.txt", {
      type: "Text/Plain",
      lastModified: 42,
    });

    expect(file).toBeInstanceOf(Blob);
    expect(file.name).toBe("example.txt");
    expect(file.lastModified).toBe(42);
    expect(file.webkitRelativePath).toBe("");
    expect(file.type).toBe("text/plain");
    expect(await file.text()).toBe("content");
  });
});
