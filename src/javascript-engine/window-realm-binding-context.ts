import { Window } from "../window.js";
import {
  windowNamedPropertyNames,
  windowNamedPropertyValue,
} from "../window-named-properties.js";
import { normal } from "./adapter.js";
import type {
  EngineHostFunction,
  EngineObject,
  EngineRealm,
  EngineResult,
  EngineValue,
  JavaScriptEngineAdapter,
} from "./adapter.js";
import { DOMRealmBinding } from "./dom-realm-binding.js";
import { createDOMLegacyPlatformObject } from "./dom-realm-legacy-platform-object.js";
import { FormDataRealmBindingContext } from "./form-data-realm-binding-context.js";
import { RealmBindingContext } from "./realm-binding-context.js";
import { URLRealmBinding } from "./url-realm-binding.js";

export class WindowRealmBindingContext {
  readonly engine: JavaScriptEngineAdapter;
  readonly context: RealmBindingContext;
  readonly window: Window;
  readonly globalObject: EngineObject;
  readonly globalThis: EngineObject;
  readonly namedPropertiesObject: EngineObject;
  readonly windowPrototype: EngineObject;
  readonly locationPrototype: EngineObject;
  readonly locationObject: EngineObject;
  readonly dom: DOMRealmBinding;
  readonly formData: FormDataRealmBindingContext;
  readonly url: URLRealmBinding;
  readonly realm: EngineRealm;

  constructor(engine: JavaScriptEngineAdapter, window: Window) {
    this.engine = engine;
    this.window = window;
    this.realm = this.engine.createRealm({ forwardingGlobalThis: true });
    this.context = new RealmBindingContext(engine, this.realm);
    this.globalObject = this.engine.globalObject(this.realm);
    this.globalThis = this.engine.globalThis(this.realm);
    this.dom = new DOMRealmBinding(
      this.engine,
      this.realm,
      this.window.document,
      this.context,
    );
    this.url = new URLRealmBinding(this.engine, this.realm, this.context);
    this.formData = new FormDataRealmBindingContext(this.context);
    const namedPropertiesTarget = this.engine.createObject(
      this.realm,
      this.dom.eventTargetPrototype,
    );
    this.namedPropertiesObject = createDOMLegacyPlatformObject(
      this.context,
      namedPropertiesTarget,
      {
        namedNames: () => windowNamedPropertyNames(this.window),
        namedValue: (name) => windowNamedPropertyValue(this.window, name),
        namedIncludesIndices: true,
        namedWritable: true,
      },
      (value) => this.dom.platformObject(value),
    );
    this.windowPrototype = this.engine.createObject(
      this.realm,
      this.namedPropertiesObject,
    );
    this.locationPrototype = this.engine.createObject(
      this.realm,
      this.engine.objectPrototype(this.realm),
    );
    this.locationObject = this.engine.createObject(
      this.realm,
      this.locationPrototype,
    );

    this.engine.setPrototypeOf(this.globalObject, this.windowPrototype);
    this.dom.associatePlatformObject(this.window, this.globalObject);
    this.dom.bindPlatformObject(this.window, this.globalThis);
  }

  timerDelay(value: EngineValue | undefined): EngineResult<number> {
    if (value === undefined) {
      return normal(0);
    }
    const text = this.context.string(value);
    return text.type === "throw"
      ? text
      : normal(Math.max(0, Number(text.value) || 0));
  }

  timerId(value: EngineValue | undefined): EngineResult<number> {
    if (value === undefined) {
      return normal(0);
    }
    const text = this.context.string(value);
    return text.type === "throw" ? text : normal(Number(text.value) || 0);
  }

  operation(name: string, length: number, callback: EngineHostFunction): void {
    this.context.interfaceMethod(this.globalObject, name, length, callback);
  }

  consoleText(value: EngineValue): string {
    const result = this.context.string(value);
    return result.type === "normal" ? result.value : "<unprintable>";
  }

  attribute(
    name: string,
    value: () => EngineValue,
    configurable: boolean,
    replaceable = false,
  ): void {
    const getter: EngineHostFunction = (thisValue) =>
      this.receiver(thisValue) === null
        ? this.context.typeError(`Invalid Window receiver for ${name}`)
        : normal(value());
    const setter: EngineHostFunction | null = replaceable
      ? (thisValue, argumentsList) => {
          const receiver = this.engine.asObject(thisValue);
          if (receiver === null || this.receiver(thisValue) === null) {
            return this.context.typeError(
              `Invalid Window receiver for ${name}`,
            );
          }
          this.engine.defineDataProperty(
            receiver,
            name,
            argumentsList[0] ?? this.engine.fromPrimitive(undefined),
            {
              configurable: true,
              enumerable: true,
              writable: true,
            },
          );
          return this.context.undefined();
        }
      : null;
    this.engine.defineAccessorProperty(
      this.globalObject,
      name,
      this.engine.createFunction(this.realm, `get ${name}`, 0, getter),
      setter === null
        ? null
        : this.engine.createFunction(this.realm, `set ${name}`, 1, setter),
      { configurable, enumerable: true },
    );
  }

  receiver(value: EngineValue): Window | null {
    const interfaceObject = this.dom.interfaceObject(value);
    return interfaceObject instanceof Window ? interfaceObject : null;
  }
}
