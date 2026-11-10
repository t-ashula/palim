import { documentImplementation } from "@palim/core/internal/dom/node-implementation.js";
import type { Document } from "@palim/core/internal/dom/nodes.js";
import type { Origin } from "@palim/core/internal/origin.js";
import {
  setWindowMicrotaskScheduler,
  type Window,
} from "@palim/window/internal/window.js";
import { URL } from "@palim/core/internal/url/index.js";
import { thrown } from "./adapter.js";
import type {
  EngineResult,
  EngineScript,
  EngineValue,
  JavaScriptEngineAdapter,
} from "./adapter.js";
import { WindowRealmBinding } from "./window-realm-binding.js";
import { RealmExecutionRuntime } from "./realm-execution-runtime.js";

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
    const topLevelImplementation = documentImplementation(
      this.window.top.document,
    );
    this.#topLevelCreationURL = new URL(topLevelImplementation.url.href);
    this.#topLevelOrigin = topLevelImplementation.origin;
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

  reportException(value: EngineValue): void {
    this.binding.reportException(value);
  }

  hasActiveDocument(): boolean {
    return this.window.document === this.#document;
  }
}

export class WindowScriptEventLoop {
  readonly runtime: RealmExecutionRuntime;
  #performingCheckpoint = false;

  constructor(readonly engine: JavaScriptEngineAdapter) {
    this.runtime = new RealmExecutionRuntime(this.engine, () => {
      if (this.#performingCheckpoint) {
        return;
      }
      this.#performingCheckpoint = true;
      try {
        this.runtime.performMicrotaskCheckpoint();
      } finally {
        this.#performingCheckpoint = false;
      }
    });
  }

  get currentSettings(): WindowEnvironmentSettings | null {
    const settings = this.runtime.currentSettings;
    return settings instanceof WindowEnvironmentSettings ? settings : null;
  }

  get entrySettings(): WindowEnvironmentSettings | null {
    const settings = this.runtime.entrySettings;
    return settings instanceof WindowEnvironmentSettings ? settings : null;
  }

  get incumbentSettings(): WindowEnvironmentSettings | null {
    const settings = this.runtime.incumbentSettings;
    return settings instanceof WindowEnvironmentSettings ? settings : null;
  }

  runScript(
    settings: WindowEnvironmentSettings,
    callback: () => EngineResult<EngineValue>,
  ): EngineResult<EngineValue> {
    return this.runtime.run(settings, settings, callback);
  }

  enqueueMicrotask(
    settings: WindowEnvironmentSettings,
    callback: () => void,
  ): void {
    if (settings.responsibleEventLoop !== this) {
      throw new TypeError("The settings use another event loop");
    }
    this.runtime.enqueueMicrotask(settings, callback);
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

  get entrySettings(): WindowEnvironmentSettings | null {
    return this.settings.responsibleEventLoop.entrySettings;
  }

  get incumbentSettings(): WindowEnvironmentSettings | null {
    return this.settings.responsibleEventLoop.incumbentSettings;
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
    if (compilation.type === "normal") {
      this.settings.responsibleEventLoop.runtime.registerScriptSettings(
        compilation.value,
        this.settings,
      );
    }
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
    eventLoop?: WindowScriptEventLoop,
  ) {
    if (eventLoop !== undefined && eventLoop.engine !== this.engine) {
      throw new TypeError("A Window event loop cannot use another engine");
    }
    this.eventLoop = eventLoop ?? new WindowScriptEventLoop(this.engine);
    this.binding = new WindowRealmBinding(
      this.engine,
      this.window,
      this.eventLoop.runtime,
    );
    this.settings = new WindowEnvironmentSettings(
      this.window,
      this.binding,
      this.eventLoop,
    );
    this.eventLoop.runtime.registerSettings(this.settings);
    const enqueueMicrotask = (callback: () => void): void => {
      this.eventLoop.enqueueMicrotask(this.settings, callback);
    };
    setWindowMicrotaskScheduler(this.window, enqueueMicrotask);
    this.binding.dom.setMutationObserverMicrotaskScheduler(enqueueMicrotask);
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
