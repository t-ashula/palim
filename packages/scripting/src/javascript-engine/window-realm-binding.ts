import type { RealmFormDataEntry } from "@palim/polyfills";
import type { Window } from "@palim/window";
import { blobBytes, File } from "@palim/window";

import type {
  EngineObject,
  EngineRealm,
  EngineValue,
  JavaScriptEngineAdapter,
} from "./adapter.js";
import { installBlobInterfaces } from "./blob-realm-interface-installer.js";
import type { DOMRealmBinding } from "./dom-realm-binding.js";
import { installFormDataInterface } from "./form-data-realm-interface-installer.js";
import type { RealmBindingContext } from "./realm-binding-context.js";
import type { RealmExecutionRuntime } from "./realm-execution-runtime.js";
import { installTrustedTypesInterfaces } from "./trusted-types-realm-interface-installer.js";
import type { URLRealmBinding } from "./url-realm-binding.js";
import { WindowRealmBindingContext } from "./window-realm-binding-context.js";
import {
  installAnimationFrameProvider,
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
    installBlobInterfaces(this.#binding.context, this.#binding.blobs);
    installFormDataInterface(this.#binding.context, this.#binding.formData);
    installTrustedTypesInterfaces(this.#binding);
    installWindowInterface(this.#binding);
    installLocationInterface(this.#binding);
    installWindowMembers(this.#binding);
    installLocationMembers(this.#binding);
    installTimers(this.#binding);
    installAnimationFrameProvider(this.#binding);
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

  get context(): RealmBindingContext {
    return this.#binding.context;
  }

  get window(): Window {
    return this.#binding.window;
  }

  createFormData(entries: Iterable<readonly [string, string]>): EngineObject {
    return this.#binding.formData.create(entries);
  }

  formDataEntries(value: EngineValue): readonly RealmFormDataEntry[] | null {
    const formData = this.#binding.formData.value(value);
    return formData === null
      ? null
      : Array.from(formData, ([name, entry]) =>
          typeof entry === "string"
            ? { name, value: entry }
            : {
                name,
                filename: entry instanceof File ? entry.name : "blob",
                type: entry.type,
                bytes: blobBytes(entry),
              },
        );
  }

  reportException(
    value: EngineValue,
    filename?: string,
    mutedErrors?: boolean,
  ): void {
    this.#binding.reportException(value, filename, mutedErrors);
  }

  dispatchPromiseRejectionEvent(
    type: "rejectionhandled" | "unhandledrejection",
    promise: EngineObject,
    reason: EngineValue,
  ): boolean {
    return this.#binding.dispatchPromiseRejectionEvent(type, promise, reason);
  }

  reportUnhandledRejection(reason: EngineValue): void {
    this.#binding.reportUnhandledRejection(reason);
  }
}
