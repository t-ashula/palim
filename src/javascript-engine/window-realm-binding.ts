import type { Window } from "../window.js";
import type { EngineRealm, JavaScriptEngineAdapter } from "./adapter.js";
import type { DOMRealmBinding } from "./dom-realm-binding.js";
import type { URLRealmBinding } from "./url-realm-binding.js";
import { WindowRealmBindingContext } from "./window-realm-binding-context.js";

export class WindowRealmBinding {
  readonly #binding: WindowRealmBindingContext;

  constructor(engine: JavaScriptEngineAdapter, window: Window) {
    this.#binding = new WindowRealmBindingContext(engine, window);
  }

  get dom(): DOMRealmBinding {
    return this.#binding.dom;
  }

  get url(): URLRealmBinding {
    return this.#binding.url;
  }

  get realm(): EngineRealm {
    return this.#binding.realm;
  }
}
