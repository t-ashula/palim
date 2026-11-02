import { Window } from "../window.js";
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

export class WindowRealmBinding {
  readonly #engine: JavaScriptEngineAdapter;
  readonly #window: Window;
  readonly #globalObject: EngineObject;
  readonly #globalThis: EngineObject;
  readonly #windowPrototype: EngineObject;
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

    this.#engine.setPrototypeOf(this.#globalObject, this.#windowPrototype);
    this.dom.associatePlatformObject(this.#window, this.#globalObject);
    this.dom.bindPlatformObject(this.#window, this.#globalThis);
    this.#installWindowInterface();
    this.#installWindowMembers();
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
    this.#attribute("top", () => this.#globalThis, false);
    this.#attribute("parent", () => this.#globalThis, true, true);
    this.#attribute(
      "frameElement",
      () => this.#engine.fromPrimitive(null),
      true,
    );
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
