import type { Window } from "@palim/window/internal/window.js";
import type {
  EngineRealm,
  EngineValue,
  JavaScriptEngineAdapter,
} from "./adapter.js";
import type { DOMRealmBinding } from "./dom-realm-binding.js";
import type { URLRealmBinding } from "./url-realm-binding.js";
import { WindowRealmBindingContext } from "./window-realm-binding-context.js";
import type { RealmExecutionRuntime } from "./realm-execution-runtime.js";
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

  constructor(
    engine: JavaScriptEngineAdapter,
    window: Window,
    runtime?: RealmExecutionRuntime,
  ) {
    this.#binding = new WindowRealmBindingContext(engine, window, runtime);
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

  reportException(
    value: EngineValue,
    filename?: string,
    mutedErrors?: boolean,
  ): void {
    this.#binding.reportException(value, filename, mutedErrors);
  }
}
