import type {
  HostServices,
  RealmCallable,
  RealmHostFunction,
  RealmPrimitive,
  RealmPromiseCapability,
  RealmResult,
  RealmValue,
  WindowEnvironment,
  WindowExtension,
  WindowExtensionContext,
  WindowRealmInstaller,
  WindowTaskScheduler,
} from "@palim/polyfills";
import { scheduleWindowTimeout } from "@palim/window/internal/window.js";

import { normal } from "./adapter.js";
import type {
  EngineCallable,
  EngineObject,
  EngineResult,
  EngineValue,
} from "./adapter.js";
import type { RealmBindingContext } from "./realm-binding-context.js";
import type {
  WindowEnvironmentSettings,
  WindowScriptEventLoop,
} from "./window-classic-script.js";
import type { WindowRealmBinding } from "./window-realm-binding.js";

export function installWindowExtensions(
  extensions: readonly WindowExtension[],
  binding: WindowRealmBinding,
  settings: WindowEnvironmentSettings,
  eventLoop: WindowScriptEventLoop,
  host: HostServices,
): void {
  if (extensions.length === 0) {
    return;
  }
  const context = createExtensionContext(binding, settings, eventLoop, host);
  for (const extension of extensions) {
    eventLoop.runScript(settings, () => {
      extension(context);
      return normal(binding.context.engine.fromPrimitive(undefined));
    });
  }
}

function createExtensionContext(
  binding: WindowRealmBinding,
  settings: WindowEnvironmentSettings,
  eventLoop: WindowScriptEventLoop,
  host: HostServices,
): WindowExtensionContext {
  const realm = new ScriptingWindowRealmInstaller(binding.context);
  const window: WindowEnvironment = {
    get url() {
      return settings.apiBaseURL.href;
    },
    get origin() {
      return settings.apiBaseURL.origin;
    },
    isActive() {
      return settings.window.document.defaultView === settings.window;
    },
  };
  const tasks: WindowTaskScheduler = {
    enqueue(callback) {
      scheduleWindowTimeout(
        settings.window,
        () => {
          if (!window.isActive()) {
            return;
          }
          const result = eventLoop.runScript(settings, () =>
            realmResultToEngine(callback()),
          );
          if (result.type === "throw") {
            settings.reportException(result.value);
          }
        },
        0,
      );
    },
  };
  return Object.freeze({ realm, window, tasks, host });
}

class ScriptingWindowRealmInstaller implements WindowRealmInstaller {
  constructor(readonly context: RealmBindingContext) {}

  primitive(value: RealmPrimitive): RealmValue {
    return toRealmValue(this.context.engine.fromPrimitive(value));
  }

  string(value: RealmValue): RealmResult<string> {
    return toRealmResult(
      this.context.engine.toString(this.context.realm, toEngineValue(value)),
    );
  }

  function(
    name: string,
    length: number,
    callback: RealmHostFunction,
  ): RealmCallable {
    return this.context.function(name, length, (thisValue, argumentsList) =>
      realmResultToEngine(
        callback(toRealmValue(thisValue), argumentsList.map(toRealmValue)),
      ),
    ) as unknown as RealmCallable;
  }

  defineGlobal(name: string, value: RealmValue): void {
    this.context.interfaceProperty(name, toEngineValue(value));
  }

  evaluate(source: string): RealmResult<RealmValue> {
    return engineResultToRealm(
      this.context.engine.evaluate(this.context.realm, source),
    );
  }

  createTypeError(message: string): RealmValue {
    return toRealmValue(
      this.context.engine.createTypeError(this.context.realm, message),
    );
  }

  promise(): RealmPromiseCapability {
    const capability = this.#object(
      this.context.engine.evaluate(
        this.context.realm,
        "(() => { let resolve; let reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; })()",
      ),
      "Could not create a realm Promise",
    );
    const promise = this.#property(capability, "promise");
    const resolve = this.#callable(capability, "resolve");
    const reject = this.#callable(capability, "reject");
    return {
      promise: toRealmValue(promise),
      resolve: (value) =>
        engineResultToRealm(
          this.context.call(
            resolve,
            this.context.engine.fromPrimitive(undefined),
            [toEngineValue(value)],
          ),
        ),
      reject: (reason) =>
        engineResultToRealm(
          this.context.call(
            reject,
            this.context.engine.fromPrimitive(undefined),
            [toEngineValue(reason)],
          ),
        ),
    };
  }

  #object(result: EngineResult<EngineValue>, message: string): EngineObject {
    if (result.type === "throw") {
      throw new TypeError(
        `${message}: ${this.context.engine.exceptionMessage(this.context.realm, result.value)}`,
      );
    }
    const object = this.context.engine.asObject(result.value);
    if (object === null) {
      throw new TypeError(message);
    }
    return object;
  }

  #property(object: EngineObject, name: string): EngineValue {
    const result = this.context.engine.get(this.context.realm, object, name);
    if (result.type === "throw") {
      throw new TypeError(
        `Could not read Promise capability ${name}: ${this.context.engine.exceptionMessage(this.context.realm, result.value)}`,
      );
    }
    return result.value;
  }

  #callable(object: EngineObject, name: string): EngineCallable {
    const callable = this.context.engine.asCallable(
      this.#property(object, name),
    );
    if (callable === null) {
      throw new TypeError(`Promise capability ${name} is not callable`);
    }
    return callable;
  }
}

function toRealmValue(value: EngineValue): RealmValue {
  return value as unknown as RealmValue;
}

function toEngineValue(value: RealmValue): EngineValue {
  return value as unknown as EngineValue;
}

function toRealmResult<T>(result: EngineResult<T>): RealmResult<T> {
  return result as unknown as RealmResult<T>;
}

function engineResultToRealm(
  result: EngineResult<EngineValue>,
): RealmResult<RealmValue> {
  return result.type === "normal"
    ? { type: "normal", value: toRealmValue(result.value) }
    : { type: "throw", value: toRealmValue(result.value) };
}

function realmResultToEngine(
  result: RealmResult<RealmValue>,
): EngineResult<EngineValue> {
  return result.type === "normal"
    ? { type: "normal", value: toEngineValue(result.value) }
    : { type: "throw", value: toEngineValue(result.value) };
}
