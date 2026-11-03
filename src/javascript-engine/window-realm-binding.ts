import { reportWindowConsole, reportWindowError, Window } from "../window.js";
import type { WindowConsoleMethod } from "../window.js";
import { URL } from "../url/index.js";
import { normal, thrown } from "./adapter.js";
import type {
  EngineHostFunction,
  EngineObject,
  EngineRealm,
  EngineResult,
  EngineValue,
  JavaScriptEngineAdapter,
} from "./adapter.js";
import { DOMRealmBinding } from "./dom-realm-binding.js";
import { URLRealmBinding } from "./url-realm-binding.js";

const INTERFACE_PROPERTY = {
  configurable: true,
  enumerable: false,
  writable: true,
} as const;

const CONSTRUCTOR_PROPERTY = {
  configurable: true,
  enumerable: false,
  writable: true,
} as const;

const CONSOLE_METHODS: readonly WindowConsoleMethod[] = [
  "assert",
  "clear",
  "count",
  "countReset",
  "debug",
  "dir",
  "dirxml",
  "error",
  "group",
  "groupCollapsed",
  "groupEnd",
  "info",
  "log",
  "table",
  "time",
  "timeEnd",
  "timeLog",
  "trace",
  "warn",
];

export class WindowRealmBinding {
  readonly #engine: JavaScriptEngineAdapter;
  readonly #window: Window;
  readonly #globalObject: EngineObject;
  readonly #globalThis: EngineObject;
  readonly #windowPrototype: EngineObject;
  readonly #locationPrototype: EngineObject;
  readonly #locationObject: EngineObject;
  readonly #timers = new Map<number, unknown>();
  #nextTimerId = 1;
  readonly dom: DOMRealmBinding;
  readonly url: URLRealmBinding;
  readonly realm: EngineRealm;

  constructor(engine: JavaScriptEngineAdapter, window: Window) {
    this.#engine = engine;
    this.#window = window;
    this.realm = this.#engine.createRealm({ forwardingGlobalThis: true });
    this.#globalObject = this.#engine.globalObject(this.realm);
    this.#globalThis = this.#engine.globalThis(this.realm);
    this.dom = new DOMRealmBinding(this.#engine, this.realm);
    this.url = new URLRealmBinding(this.#engine, this.realm);
    this.#windowPrototype = this.#engine.createObject(
      this.realm,
      this.dom.eventTargetPrototype,
    );
    this.#locationPrototype = this.#engine.createObject(
      this.realm,
      this.#engine.objectPrototype(this.realm),
    );
    this.#locationObject = this.#engine.createObject(
      this.realm,
      this.#locationPrototype,
    );

    this.#engine.setPrototypeOf(this.#globalObject, this.#windowPrototype);
    this.dom.associatePlatformObject(this.#window, this.#globalObject);
    this.dom.bindPlatformObject(this.#window, this.#globalThis);
    this.#installWindowInterface();
    this.#installLocationInterface();
    this.#installWindowMembers();
    this.#installLocationMembers();
    this.#installTimers();
    this.#installConsole();
  }

  #installWindowInterface(): void {
    const constructor = this.#engine.createFunction(
      this.realm,
      "Window",
      0,
      () => this.#typeError("Illegal constructor"),
    );
    this.#engine.defineDataProperty(
      constructor,
      "prototype",
      this.#windowPrototype,
      {
        configurable: false,
        enumerable: false,
        writable: false,
      },
    );
    this.#engine.defineDataProperty(
      this.#windowPrototype,
      "constructor",
      constructor,
      CONSTRUCTOR_PROPERTY,
    );
    this.#engine.defineDataProperty(
      this.#globalObject,
      "Window",
      constructor,
      INTERFACE_PROPERTY,
    );
  }

  #installWindowMembers(): void {
    this.#attribute("window", () => this.#globalThis, false);
    this.#attribute("self", () => this.#globalThis, true, true);
    this.#attribute("frames", () => this.#globalThis, true, true);
    this.#attribute(
      "document",
      () => this.dom.platformObject(this.#window.document),
      false,
    );
    this.#attribute("location", () => this.#locationObject, false);
    this.#attribute("top", () => this.#globalThis, false);
    this.#attribute("parent", () => this.#globalThis, true, true);
    this.#attribute(
      "frameElement",
      () => this.#engine.fromPrimitive(null),
      true,
    );
  }

  #installLocationInterface(): void {
    const constructor = this.#engine.createFunction(
      this.realm,
      "Location",
      0,
      () => this.#typeError("Illegal constructor"),
    );
    this.#engine.defineDataProperty(
      constructor,
      "prototype",
      this.#locationPrototype,
      {
        configurable: false,
        enumerable: false,
        writable: false,
      },
    );
    this.#engine.defineDataProperty(
      this.#locationPrototype,
      "constructor",
      constructor,
      CONSTRUCTOR_PROPERTY,
    );
    this.#engine.defineDataProperty(
      this.#globalObject,
      "Location",
      constructor,
      INTERFACE_PROPERTY,
    );
  }

  #installLocationMembers(): void {
    for (const name of ["href", "pathname", "search", "hash"] as const) {
      this.#engine.defineAccessorProperty(
        this.#locationPrototype,
        name,
        this.#engine.createFunction(
          this.realm,
          `get ${name}`,
          0,
          (thisValue) =>
            thisValue === this.#locationObject
              ? normal(this.#engine.fromPrimitive(this.#locationURL()[name]))
              : this.#typeError("Invalid Location receiver"),
        ),
        null,
        { configurable: true, enumerable: true },
      );
    }
    this.#engine.defineDataProperty(
      this.#locationPrototype,
      "toString",
      this.#engine.createFunction(this.realm, "toString", 0, (thisValue) =>
        thisValue === this.#locationObject
          ? normal(this.#engine.fromPrimitive(this.#locationURL().href))
          : this.#typeError("Invalid Location receiver"),
      ),
      INTERFACE_PROPERTY,
    );
  }

  #locationURL(): URL {
    return new URL(this.#window.document.URL);
  }

  #installTimers(): void {
    this.#operation("setTimeout", 1, (_thisValue, argumentsList) => {
      const callback = this.#engine.asCallable(
        argumentsList[0] ?? this.#engine.fromPrimitive(undefined),
      );
      if (callback === null) {
        return this.#typeError("setTimeout callback must be callable");
      }
      const delay = this.#timerDelay(argumentsList[1]);
      if (delay.type === "throw") {
        return delay;
      }
      const id = this.#nextTimerId;
      this.#nextTimerId += 1;
      const handle = hostTimers().setTimeout(() => {
        this.#timers.delete(id);
        const result = this.#engine.call(
          this.realm,
          callback,
          this.#globalThis,
          argumentsList.slice(2),
        );
        this.#engine.performPromiseCheckpoint();
        if (result.type === "throw") {
          reportWindowError(this.#window, {
            message: this.#engine.exceptionMessage(this.realm, result.value),
            url: this.#window.document.URL,
          });
        }
      }, delay.value);
      this.#timers.set(id, handle);
      return normal(this.#engine.fromPrimitive(id));
    });
    this.#operation("clearTimeout", 1, (_thisValue, argumentsList) => {
      const id = this.#timerId(argumentsList[0]);
      if (id.type === "throw") {
        return id;
      }
      const handle = this.#timers.get(id.value);
      if (handle !== undefined) {
        hostTimers().clearTimeout(handle);
        this.#timers.delete(id.value);
      }
      return this.#undefined();
    });
  }

  #timerDelay(value: EngineValue | undefined): EngineResult<number> {
    if (value === undefined) {
      return normal(0);
    }
    const text = this.#engine.toString(this.realm, value);
    return text.type === "throw"
      ? text
      : normal(Math.max(0, Number(text.value) || 0));
  }

  #timerId(value: EngineValue | undefined): EngineResult<number> {
    if (value === undefined) {
      return normal(0);
    }
    const text = this.#engine.toString(this.realm, value);
    return text.type === "throw" ? text : normal(Number(text.value) || 0);
  }

  #operation(name: string, length: number, callback: EngineHostFunction): void {
    this.#engine.defineDataProperty(
      this.#globalObject,
      name,
      this.#engine.createFunction(this.realm, name, length, callback),
      INTERFACE_PROPERTY,
    );
  }

  #installConsole(): void {
    const consoleObject = this.#engine.createObject(
      this.realm,
      this.#engine.objectPrototype(this.realm),
    );
    for (const method of CONSOLE_METHODS) {
      const operation = this.#engine.createFunction(
        this.realm,
        method,
        0,
        (_thisValue, argumentsList) => {
          if (
            method === "assert" &&
            argumentsList[0] !== undefined &&
            this.#engine.toBoolean(argumentsList[0])
          ) {
            return this.#undefined();
          }
          const values =
            method === "assert" ? argumentsList.slice(1) : argumentsList;
          reportWindowConsole(this.#window, {
            method,
            arguments: values.map((value) => this.#consoleText(value)),
          });
          return this.#undefined();
        },
      );
      this.#engine.defineDataProperty(consoleObject, method, operation, {
        configurable: true,
        enumerable: false,
        writable: true,
      });
    }
    this.#engine.defineDataProperty(
      this.#globalObject,
      "console",
      consoleObject,
      INTERFACE_PROPERTY,
    );
  }

  #consoleText(value: EngineValue): string {
    const result = this.#engine.toString(this.realm, value);
    return result.type === "normal" ? result.value : "<unprintable>";
  }

  #attribute(
    name: string,
    value: () => EngineValue,
    configurable: boolean,
    replaceable = false,
  ): void {
    const getter: EngineHostFunction = (thisValue) =>
      this.#receiver(thisValue) === null
        ? this.#typeError(`Invalid Window receiver for ${name}`)
        : normal(value());
    const setter: EngineHostFunction | null = replaceable
      ? (thisValue, argumentsList) => {
          const receiver = this.#engine.asObject(thisValue);
          if (receiver === null || this.#receiver(thisValue) === null) {
            return this.#typeError(`Invalid Window receiver for ${name}`);
          }
          this.#engine.defineDataProperty(
            receiver,
            name,
            argumentsList[0] ?? this.#engine.fromPrimitive(undefined),
            {
              configurable: true,
              enumerable: true,
              writable: true,
            },
          );
          return this.#undefined();
        }
      : null;
    this.#engine.defineAccessorProperty(
      this.#globalObject,
      name,
      this.#engine.createFunction(this.realm, `get ${name}`, 0, getter),
      setter === null
        ? null
        : this.#engine.createFunction(this.realm, `set ${name}`, 1, setter),
      { configurable, enumerable: true },
    );
  }

  #receiver(value: EngineValue): Window | null {
    const interfaceObject = this.dom.interfaceObject(value);
    return interfaceObject instanceof Window ? interfaceObject : null;
  }

  #undefined(): EngineResult<EngineValue> {
    return normal(this.#engine.fromPrimitive(undefined));
  }

  #typeError(message: string): EngineResult<EngineValue> {
    return thrown(this.#engine.createTypeError(this.realm, message));
  }
}

function hostTimers(): {
  setTimeout(callback: () => void, delay: number): unknown;
  clearTimeout(handle: unknown): void;
} {
  const host: unknown = globalThis;
  return host as {
    setTimeout(callback: () => void, delay: number): unknown;
    clearTimeout(handle: unknown): void;
  };
}
