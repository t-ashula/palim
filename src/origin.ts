import type { URL } from "./url/index.js";

export interface TupleOrigin {
  readonly type: "tuple";
  readonly scheme: "http" | "https";
  readonly host: string;
  readonly port: number | null;
}

export class OpaqueOrigin {
  readonly type = "opaque";
  readonly #identity = Symbol();

  isSameOrigin(other: Origin): boolean {
    return other instanceof OpaqueOrigin && other.#identity === this.#identity;
  }
}

export type Origin = TupleOrigin | OpaqueOrigin;

export function originFromURL(url: URL): Origin {
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return new OpaqueOrigin();
  }
  return Object.freeze({
    type: "tuple",
    scheme: url.protocol === "http:" ? "http" : "https",
    host: url.hostname,
    port: url.port === "" ? null : Number(url.port),
  });
}
