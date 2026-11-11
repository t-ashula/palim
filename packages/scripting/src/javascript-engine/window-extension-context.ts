import type {
  HostServices,
  RealmCallable,
  RealmHostFunction,
  RealmInterface,
  RealmObject,
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

  number(value: RealmValue): RealmResult<number> {
    return toRealmResult(
      this.context.engine.toNumber(this.context.realm, toEngineValue(value)),
    );
  }

  boolean(value: RealmValue): boolean {
    return this.context.engine.toBoolean(toEngineValue(value));
  }

  isUndefined(value: RealmValue): boolean {
    return this.context.engine.isUndefined(toEngineValue(value));
  }

  isNull(value: RealmValue): boolean {
    return this.context.engine.isNull(toEngineValue(value));
  }

  object(value: RealmValue): RealmObject | null {
    const object = this.context.engine.asObject(toEngineValue(value));
    return object === null ? null : toRealmObject(object);
  }

  callable(value: RealmValue): RealmCallable | null {
    const callable = this.context.engine.asCallable(toEngineValue(value));
    return callable === null ? null : (toRealmValue(callable) as RealmCallable);
  }

  get(object: RealmObject, name: string): RealmResult<RealmValue> {
    return engineResultToRealm(
      this.context.engine.get(this.context.realm, toEngineObject(object), name),
    );
  }

  ownEnumerablePropertyNames(
    object: RealmObject,
  ): RealmResult<readonly string[]> {
    return toRealmResult(
      this.context.engine.ownEnumerablePropertyNames(
        this.context.realm,
        toEngineObject(object),
      ),
    );
  }

  iterableValues(
    object: RealmObject,
  ): RealmResult<readonly RealmValue[] | null> {
    const result = this.context.iterableValues(toEngineObject(object));
    return result.type === "throw"
      ? { type: "throw", value: toRealmValue(result.value) }
      : {
          type: "normal",
          value:
            result.value === null
              ? null
              : result.value.map((value) => toRealmValue(value)),
        };
  }

  array(values: readonly RealmValue[]): RealmObject {
    return toRealmObject(
      this.context.engine.createArray(
        this.context.realm,
        values.map(toEngineValue),
      ),
    );
  }

  iterator(values: readonly RealmValue[]): RealmResult<RealmObject> {
    const array = this.context.engine.createArray(
      this.context.realm,
      values.map(toEngineValue),
    );
    const method = this.context.engine.get(
      this.context.realm,
      array,
      this.context.engine.wellKnownSymbol("iterator"),
    );
    if (method.type === "throw") {
      return { type: "throw", value: toRealmValue(method.value) };
    }
    const callable = this.context.engine.asCallable(method.value);
    if (callable === null) {
      return {
        type: "throw",
        value: this.createTypeError("Array iterator is not callable"),
      };
    }
    const result = this.context.call(callable, array, []);
    if (result.type === "throw") {
      return { type: "throw", value: toRealmValue(result.value) };
    }
    const iterator = this.context.engine.asObject(result.value);
    return iterator === null
      ? {
          type: "throw",
          value: this.createTypeError(
            "Array iterator did not return an object",
          ),
        }
      : { type: "normal", value: toRealmObject(iterator) };
  }

  call(
    callable: RealmCallable,
    thisValue: RealmValue,
    argumentsList: readonly RealmValue[],
  ): RealmResult<RealmValue> {
    return engineResultToRealm(
      this.context.call(
        toEngineCallable(callable),
        toEngineValue(thisValue),
        argumentsList.map(toEngineValue),
      ),
    );
  }

  defineGlobalFunction(
    name: string,
    length: number,
    callback: RealmHostFunction,
  ): RealmCallable {
    const callable = this.context.function(
      name,
      length,
      (thisValue, argumentsList) =>
        realmResultToEngine(
          callback(toRealmValue(thisValue), argumentsList.map(toRealmValue)),
        ),
    );
    this.context.interfaceProperty(name, callable);
    return toRealmValue(callable) as RealmCallable;
  }

  defineInterface(
    name: string,
    length: number,
    construct: RealmHostFunction,
  ): RealmInterface {
    const prototype = this.context.engine.createObject(
      this.context.realm,
      this.context.engine.objectPrototype(this.context.realm),
    );
    const constructor = this.context.createConstructor(
      name,
      length,
      (thisValue, argumentsList) =>
        realmResultToEngine(
          construct(toRealmValue(thisValue), argumentsList.map(toRealmValue)),
        ),
    );
    this.context.installInterface(name, constructor, prototype);
    this.context.tag(prototype, name);
    return new ScriptingRealmInterface(this.context, constructor, prototype);
  }

  createTypeError(message: string): RealmValue {
    return toRealmValue(
      this.context.engine.createTypeError(this.context.realm, message),
    );
  }

  createRangeError(message: string): RealmValue {
    return toRealmValue(
      this.context.engine.createRangeError(this.context.realm, message),
    );
  }

  parseJSON(value: string): RealmResult<RealmValue> {
    return this.#callGlobalMethod("JSON", "parse", [this.primitive(value)]);
  }

  stringifyJSON(value: RealmValue): RealmResult<string> {
    const result = this.#callGlobalMethod("JSON", "stringify", [value]);
    return result.type === "throw" ? result : this.string(result.value);
  }

  arrayBuffer(bytes: Uint8Array): RealmResult<RealmObject> {
    const constructor = this.#globalCallable("Uint8Array");
    if (constructor.type === "throw") {
      return constructor;
    }
    const values = this.context.engine.createArray(
      this.context.realm,
      Array.from(bytes, (byte) => this.context.engine.fromPrimitive(byte)),
    );
    const typedArray = this.context.engine.construct(
      this.context.realm,
      toEngineCallable(constructor.value),
      [values],
    );
    if (typedArray.type === "throw") {
      return { type: "throw", value: toRealmValue(typedArray.value) };
    }
    const buffer = this.context.engine.get(
      this.context.realm,
      typedArray.value,
      "buffer",
    );
    if (buffer.type === "throw") {
      return { type: "throw", value: toRealmValue(buffer.value) };
    }
    const object = this.context.engine.asObject(buffer.value);
    return object === null
      ? {
          type: "throw",
          value: this.createTypeError("Uint8Array buffer is not an object"),
        }
      : { type: "normal", value: toRealmObject(object) };
  }

  promise(): RealmPromiseCapability {
    const functions: {
      resolve?: EngineCallable;
      reject?: EngineCallable;
    } = {};
    const executor = this.context.function(
      "",
      2,
      (_thisValue, argumentsList) => {
        const resolve =
          argumentsList[0] === undefined
            ? null
            : this.context.engine.asCallable(argumentsList[0]);
        const reject =
          argumentsList[1] === undefined
            ? null
            : this.context.engine.asCallable(argumentsList[1]);
        if (resolve !== null) {
          functions.resolve = resolve;
        }
        if (reject !== null) {
          functions.reject = reject;
        }
        return normal(this.context.engine.fromPrimitive(undefined));
      },
    );
    const promiseConstructor = this.#globalCallable("Promise");
    if (promiseConstructor.type === "throw") {
      throw new TypeError("Promise is unavailable in the Window realm");
    }
    const promise = this.context.engine.construct(
      this.context.realm,
      toEngineCallable(promiseConstructor.value),
      [executor],
    );
    if (
      promise.type === "throw" ||
      functions.resolve === undefined ||
      functions.reject === undefined
    ) {
      throw new TypeError("Could not create a realm Promise");
    }
    const resolveFunction = functions.resolve;
    const rejectFunction = functions.reject;
    return {
      promise: toRealmValue(promise.value),
      resolve: (value) =>
        engineResultToRealm(
          this.context.call(
            resolveFunction,
            this.context.engine.fromPrimitive(undefined),
            [toEngineValue(value)],
          ),
        ),
      reject: (reason) =>
        engineResultToRealm(
          this.context.call(
            rejectFunction,
            this.context.engine.fromPrimitive(undefined),
            [toEngineValue(reason)],
          ),
        ),
    };
  }

  #callGlobalMethod(
    objectName: string,
    methodName: string,
    argumentsList: readonly RealmValue[],
  ): RealmResult<RealmValue> {
    const object = this.#globalObject(objectName);
    if (object.type === "throw") {
      return object;
    }
    const method = this.context.engine.get(
      this.context.realm,
      toEngineObject(object.value),
      methodName,
    );
    if (method.type === "throw") {
      return { type: "throw", value: toRealmValue(method.value) };
    }
    const callable = this.context.engine.asCallable(method.value);
    return callable === null
      ? {
          type: "throw",
          value: this.createTypeError(
            `${objectName}.${methodName} is not callable`,
          ),
        }
      : engineResultToRealm(
          this.context.call(
            callable,
            toEngineObject(object.value),
            argumentsList.map(toEngineValue),
          ),
        );
  }

  #globalCallable(name: string): RealmResult<RealmCallable> {
    const value = this.context.engine.get(
      this.context.realm,
      this.context.engine.globalObject(this.context.realm),
      name,
    );
    if (value.type === "throw") {
      return { type: "throw", value: toRealmValue(value.value) };
    }
    const callable = this.context.engine.asCallable(value.value);
    return callable === null
      ? {
          type: "throw",
          value: this.createTypeError(`${name} is not callable`),
        }
      : { type: "normal", value: toRealmValue(callable) as RealmCallable };
  }

  #globalObject(name: string): RealmResult<RealmObject> {
    const value = this.context.engine.get(
      this.context.realm,
      this.context.engine.globalObject(this.context.realm),
      name,
    );
    if (value.type === "throw") {
      return { type: "throw", value: toRealmValue(value.value) };
    }
    const object = this.context.engine.asObject(value.value);
    return object === null
      ? {
          type: "throw",
          value: this.createTypeError(`${name} is not an object`),
        }
      : { type: "normal", value: toRealmObject(object) };
  }
}

class ScriptingRealmInterface implements RealmInterface {
  constructor(
    readonly context: RealmBindingContext,
    readonly constructorValue: EngineCallable,
    readonly prototype: EngineObject,
  ) {}

  create(): RealmObject {
    return toRealmObject(
      this.context.engine.createObject(this.context.realm, this.prototype),
    );
  }

  method(name: string, length: number, callback: RealmHostFunction): void {
    this.context.method(this.prototype, name, length, realmCallback(callback));
  }

  attribute(
    name: string,
    getter: RealmHostFunction,
    setter?: RealmHostFunction,
  ): void {
    this.context.attribute(
      this.prototype,
      name,
      realmCallback(getter),
      setter === undefined ? null : realmCallback(setter),
    );
  }

  staticMethod(
    name: string,
    length: number,
    callback: RealmHostFunction,
  ): void {
    this.context.interfaceMethod(
      this.constructorValue,
      name,
      length,
      realmCallback(callback),
    );
  }

  iterator(callback: RealmHostFunction): void {
    const method = this.context.function(
      "[Symbol.iterator]",
      0,
      realmCallback(callback),
    );
    this.context.engine.initializeDataProperty(
      this.prototype,
      this.context.engine.wellKnownSymbol("iterator"),
      method,
      { configurable: true, enumerable: false, writable: true },
    );
  }
}

function realmCallback(callback: RealmHostFunction) {
  return (thisValue: EngineValue, argumentsList: readonly EngineValue[]) =>
    realmResultToEngine(
      callback(toRealmValue(thisValue), argumentsList.map(toRealmValue)),
    );
}

function toRealmValue(value: EngineValue): RealmValue {
  return value as unknown as RealmValue;
}

function toEngineValue(value: RealmValue): EngineValue {
  return value as unknown as EngineValue;
}

function toRealmObject(value: EngineObject): RealmObject {
  return value as unknown as RealmObject;
}

function toEngineObject(value: RealmObject): EngineObject {
  return value as unknown as EngineObject;
}

function toEngineCallable(value: RealmCallable): EngineCallable {
  return value as unknown as EngineCallable;
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
