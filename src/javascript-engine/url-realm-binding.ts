import type { URLSearchParams } from "../url/index.js";
import { URL } from "../url/index.js";
import type {
  EngineObject,
  EngineRealm,
  JavaScriptEngineAdapter,
} from "./adapter.js";
import { RealmBindingContext } from "./realm-binding-context.js";
import { URLRealmBindingContext } from "./url-realm-binding-context.js";
import { installURLInterfaces } from "./url-realm-interface-installer.js";

export class URLRealmBinding {
  readonly #domain: URLRealmBindingContext;

  constructor(
    engine: JavaScriptEngineAdapter,
    realm: EngineRealm,
    binding = new RealmBindingContext(engine, realm),
  ) {
    this.#domain = new URLRealmBindingContext(binding);
    installURLInterfaces(binding, this.#domain);
  }

  platformObject(value: URL | URLSearchParams): EngineObject {
    return value instanceof URL
      ? this.#domain.wrapURL(value)
      : this.#domain.wrapSearchParams(value);
  }
}
