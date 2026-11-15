import { URL } from "@palim/core";
import { describe, expect, it } from "vitest";

import { Blob } from "../src/blob.js";
import { createBlobURL, loadResource, revokeBlobURL } from "../src/blob-url.js";

describe("Blob URL store", () => {
  it("returns independent URLs and resolves Blob resources", async () => {
    const blob = new Blob(["content"], { type: "Text/Plain" });
    const first = createBlobURL(blob, "https://example.test");
    const second = createBlobURL(blob, "https://example.test");

    expect(first).not.toBe(second);
    expect(first).toMatch(
      /^blob:https:\/\/example\.test\/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
    const loaded = loadResource(null, new URL(first));
    expect(loaded.type).toBe("resource");
    if (loaded.type !== "resource") {
      throw new Error("Expected a Blob URL resource");
    }
    const resource = await loaded.resource;
    expect(new TextDecoder().decode(resource.body)).toBe("content");
    expect(resource.mimeType).toBe("text/plain");
    expect(resource.url).toBe(first);
  });

  it("rejects revoked and unknown Blob URLs without using the loader", () => {
    const url = createBlobURL(new Blob(["content"]), "https://example.test");
    let requests = 0;
    const loader = {
      load: () => {
        requests += 1;
        return Promise.resolve({ body: new Uint8Array() });
      },
    };

    revokeBlobURL(url);

    expect(loadResource(loader, new URL(url))).toEqual({ type: "not-found" });
    expect(
      loadResource(loader, new URL("blob:https://example.test/unknown")),
    ).toEqual({ type: "not-found" });
    expect(requests).toBe(0);
  });

  it("passes non-Blob URLs to the supplied loader", async () => {
    const resource = { body: new Uint8Array([1]) };
    const loader = {
      load: (url: URL) => {
        expect(url.href).toBe("https://example.test/resource");
        return Promise.resolve(resource);
      },
    };

    const loaded = loadResource(
      loader,
      new URL("https://example.test/resource"),
    );
    expect(loaded.type).toBe("resource");
    if (loaded.type !== "resource") {
      throw new Error("Expected a loaded resource");
    }
    await expect(loaded.resource).resolves.toBe(resource);
  });

  it("reports a missing loader without throwing an ES error", () => {
    expect(
      loadResource(null, new URL("https://example.test/resource")),
    ).toEqual({ type: "missing-loader" });
  });
});
