import type { URLSearchParams } from "@palim/core";
import { URL } from "@palim/core";

import type {
  EngineObject,
  EngineRealm,
  JavaScriptEngineAdapter,
} from "./adapter.js";
import type { BlobRealmBindingContext } from "./blob-realm-binding-context.js";
import { RealmBindingContext } from "./realm-binding-context.js";
import { URLRealmBindingContext } from "./url-realm-binding-context.js";
import { installURLInterfaces } from "./url-realm-interface-installer.js";

export interface BlobURLRealmBindingOptions {
  readonly blobs: BlobRealmBindingContext;
  readonly origin: string;
}

export class URLRealmBinding {
  readonly #domain: URLRealmBindingContext;

  constructor(
    engine: JavaScriptEngineAdapter,
    realm: EngineRealm,
    binding = new RealmBindingContext(engine, realm),
    blobURLs?: BlobURLRealmBindingOptions,
  ) {
    this.#domain = new URLRealmBindingContext(binding);
    installURLInterfaces(binding, this.#domain, blobURLs);
  }

  platformObject(value: URL | URLSearchParams): EngineObject {
    return value instanceof URL
      ? this.#domain.wrapURL(value)
      : this.#domain.wrapSearchParams(value);
  }
}
