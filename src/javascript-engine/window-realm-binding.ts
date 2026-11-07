import type { Window } from "../window.js";
import type { EngineRealm, JavaScriptEngineAdapter } from "./adapter.js";
import type { DOMRealmBinding } from "./dom-realm-binding.js";
import type { URLRealmBinding } from "./url-realm-binding.js";
import { WindowRealmBindingContext } from "./window-realm-binding-context.js";
import { installFormDataInterface } from "./form-data-realm-interface-installer.js";
import {
  installConsole,
  installLocationInterface,
  installLocationMembers,
  installTimers,
  installWindowInterface,
  installWindowMembers,
} from "./window-realm-interface-installers.js";

export class WindowRealmBinding {
  readonly #binding: WindowRealmBindingContext;

  constructor(engine: JavaScriptEngineAdapter, window: Window) {
    this.#binding = new WindowRealmBindingContext(engine, window);
    installFormDataInterface(this.#binding.context, this.#binding.formData);
    installWindowInterface(this.#binding);
    installLocationInterface(this.#binding);
    installWindowMembers(this.#binding);
    installLocationMembers(this.#binding);
    installTimers(this.#binding);
    installConsole(this.#binding);
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
