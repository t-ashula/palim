import type { Origin, URL } from "@palim/core";
import { uuidV4 } from "@palim/core";

import type { Blob } from "./blob.js";
import { blobBytes } from "./blob.js";
import type { Resource, ResourceLoader } from "./document-loader.js";

interface BlobURLEntry {
  readonly blob: Blob;
  readonly url: string;
}

export type ResourceLoadResult =
  | {
      readonly type: "resource";
      readonly resource: Resource | Promise<Resource>;
    }
  | { readonly type: "not-found" }
  | { readonly type: "missing-loader" };

const ENTRIES = new Map<string, BlobURLEntry>();

export function serializeBlobURLOrigin(origin: Origin): string {
  if (origin.type === "opaque") {
    return "null";
  }
  const port = origin.port === null ? "" : `:${String(origin.port)}`;
  return `${origin.scheme}://${origin.host}${port}`;
}

export function createBlobURL(blob: Blob, origin: string): string {
  const identifier = uuidV4();
  const url = `blob:${origin}/${identifier}`;
  ENTRIES.set(url, { blob, url });
  return url;
}

export function revokeBlobURL(value: string): void {
  if (!value.startsWith("blob:")) {
    return;
  }
  ENTRIES.delete(value);
}

export function loadResource(
  loader: ResourceLoader | null,
  url: URL,
): ResourceLoadResult {
  if (url.protocol === "blob:") {
    const entry = ENTRIES.get(url.href);
    if (entry === undefined) {
      return { type: "not-found" };
    }
    return {
      type: "resource",
      resource: {
        body: blobBytes(entry.blob),
        url: entry.url,
        mimeType: entry.blob.type,
      },
    };
  }
  if (loader === null) {
    return { type: "missing-loader" };
  }
  return { type: "resource", resource: loader.load(url) };
}
