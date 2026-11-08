import { documentImplementation } from "@palim/core/internal/dom/node-implementation.js";
import type { Document } from "@palim/core/internal/dom/nodes.js";
import type { Origin } from "@palim/core/internal/origin.js";
import type { Window } from "../window.js";
import { URL } from "@palim/core/internal/url/index.js";
import { thrown } from "./adapter.js";
import type {
  EngineResult,
  EngineScript,
  EngineValue,
  JavaScriptEngineAdapter,
} from "./adapter.js";
import { WindowRealmBinding } from "./window-realm-binding.js";

type ClassicScriptCompilation =
  | { readonly type: "compiled"; readonly script: EngineScript }
  | { readonly type: "parse-error"; readonly error: EngineValue };

export class ClassicScript {
  constructor(
    readonly sourceText: string,
    readonly settings: WindowEnvironmentSettings,
    readonly baseURL: URL,
    readonly mutedErrors: false,
    readonly compilation: ClassicScriptCompilation,
  ) {}
}

export class WindowEnvironmentSettings {
  readonly #creationURL: URL;
  readonly #topLevelCreationURL: URL;
  readonly #topLevelOrigin: Origin;
  readonly #document: Document;

  constructor(
    readonly window: Window,
    readonly binding: WindowRealmBinding,
    readonly responsibleEventLoop: WindowScriptEventLoop,
  ) {
    this.#document = this.window.document;
    const implementation = documentImplementation(this.#document);
    this.#creationURL = new URL(implementation.url.href);
    this.#topLevelCreationURL = new URL(implementation.url.href);
    this.#topLevelOrigin = implementation.origin;
  }

  get creationURL(): URL {
    return new URL(this.#creationURL.href);
  }

  get topLevelCreationURL(): URL {
    return new URL(this.#topLevelCreationURL.href);
  }

  get apiBaseURL(): URL {
    return new URL(documentImplementation(this.#document).url.href);
  }

  get origin(): Origin {
    return documentImplementation(this.#document).origin;
  }

  get topLevelOrigin(): Origin {
    return this.#topLevelOrigin;
  }

  get realm() {
    return this.binding.realm;
  }

  hasActiveDocument(): boolean {
    return this.window.document === this.#document;
  }
}

export class WindowScriptEventLoop {
  readonly #settingsStack: WindowEnvironmentSettings[] = [];
  #performingCheckpoint = false;

  constructor(readonly engine: JavaScriptEngineAdapter) {}

  get currentSettings(): WindowEnvironmentSettings | null {
    return this.#settingsStack.at(-1) ?? null;
  }

  runScript(
    settings: WindowEnvironmentSettings,
    callback: () => EngineResult<EngineValue>,
  ): EngineResult<EngineValue> {
    this.#settingsStack.push(settings);
    try {
      return callback();
    } finally {
      const removed = this.#settingsStack.pop();
      if (removed !== settings) {
        throw new TypeError("Window settings stack is inconsistent");
      }
      if (this.#settingsStack.length === 0 && !this.#performingCheckpoint) {
        this.#performingCheckpoint = true;
        try {
          this.engine.performPromiseCheckpoint();
        } finally {
          this.#performingCheckpoint = false;
        }
      }
    }
  }
}

export class WindowClassicScriptRuntime {
  constructor(
    readonly engine: JavaScriptEngineAdapter,
    readonly settings: WindowEnvironmentSettings,
  ) {}

  get currentSettings(): WindowEnvironmentSettings | null {
    return this.settings.responsibleEventLoop.currentSettings;
  }

  createClassicScript(
    sourceText: string,
    sourceURL?: string | URL,
  ): ClassicScript {
    const apiBaseURL = this.settings.apiBaseURL;
    const baseURL =
      sourceURL === undefined ? apiBaseURL : new URL(sourceURL, apiBaseURL);
    const compilation = this.engine.compileScript(
      this.settings.realm,
      sourceText,
      baseURL.href,
    );
    return new ClassicScript(
      sourceText,
      this.settings,
      baseURL,
      false,
      compilation.type === "normal"
        ? { type: "compiled", script: compilation.value }
        : { type: "parse-error", error: compilation.value },
    );
  }

  runClassicScript(script: ClassicScript): EngineResult<EngineValue> {
    if (script.settings !== this.settings) {
      throw new TypeError("The classic script belongs to another runtime");
    }
    if (!this.settings.hasActiveDocument()) {
      throw new TypeError("The Window document is no longer active");
    }
    return this.settings.responsibleEventLoop.runScript(this.settings, () =>
      script.compilation.type === "parse-error"
        ? thrown(script.compilation.error)
        : this.engine.runScript(this.settings.realm, script.compilation.script),
    );
  }
}

export class WindowScriptEnvironment {
  readonly binding: WindowRealmBinding;
  readonly eventLoop: WindowScriptEventLoop;
  readonly settings: WindowEnvironmentSettings;
  readonly runtime: WindowClassicScriptRuntime;

  constructor(
    readonly engine: JavaScriptEngineAdapter,
    readonly window: Window,
  ) {
    this.binding = new WindowRealmBinding(this.engine, this.window);
    this.eventLoop = new WindowScriptEventLoop(this.engine);
    this.settings = new WindowEnvironmentSettings(
      this.window,
      this.binding,
      this.eventLoop,
    );
    this.runtime = new WindowClassicScriptRuntime(this.engine, this.settings);
  }

  createClassicScript(
    sourceText: string,
    sourceURL?: string | URL,
  ): ClassicScript {
    return this.runtime.createClassicScript(sourceText, sourceURL);
  }

  runClassicScript(script: ClassicScript): EngineResult<EngineValue> {
    return this.runtime.runClassicScript(script);
  }
}
