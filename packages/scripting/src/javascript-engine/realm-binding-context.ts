import { normal, thrown } from "./adapter.js";
import type {
  EngineCallable,
  EngineDataPropertyAttributes,
  EngineHostFunction,
  EngineObject,
  EnginePrimitive,
  EnginePropertyAttributes,
  EnginePropertyKey,
  EngineRealm,
  EngineResult,
  EngineValue,
  JavaScriptEngineAdapter,
} from "./adapter.js";

const INTERFACE_PROPERTY = {
  configurable: true,
  enumerable: false,
  writable: true,
} as const;

const MEMBER_PROPERTY = {
  configurable: true,
  enumerable: true,
  writable: true,
} as const;

const ATTRIBUTE_PROPERTY = {
  configurable: true,
  enumerable: true,
} as const;

const TAG_PROPERTY = {
  configurable: true,
  enumerable: false,
  writable: false,
} as const;

export class RealmBindingContext {
  constructor(
    readonly engine: JavaScriptEngineAdapter,
    readonly realm: EngineRealm,
  ) {}

  installInterface(
    name: string,
    constructor: EngineCallable,
    prototype: EngineObject,
    target = this.engine.globalObject(this.realm),
  ): void {
    this.engine.initializeDataProperty(constructor, "prototype", prototype, {
      configurable: false,
      enumerable: false,
      writable: false,
    });
    this.engine.initializeDataProperty(prototype, "constructor", constructor, {
      configurable: true,
      enumerable: false,
      writable: true,
    });
    this.engine.initializeDataProperty(
      target,
      name,
      constructor,
      INTERFACE_PROPERTY,
    );
  }

  function(
    name: string,
    length: number,
    callback: EngineHostFunction,
  ): EngineCallable {
    return this.engine.createFunction(this.realm, name, length, callback);
  }

  createConstructor(
    name: string,
    length: number,
    callback: EngineHostFunction,
  ): EngineCallable {
    return this.engine.createConstructor(this.realm, name, length, callback);
  }

  dataProperty(
    object: EngineObject,
    name: EnginePropertyKey,
    value: EngineValue,
    attributes: EngineDataPropertyAttributes = MEMBER_PROPERTY,
  ): void {
    this.engine.initializeDataProperty(object, name, value, attributes);
  }

  interfaceProperty(
    name: string,
    value: EngineValue,
    target = this.engine.globalObject(this.realm),
  ): void {
    this.dataProperty(target, name, value, INTERFACE_PROPERTY);
  }

  method(
    object: EngineObject,
    name: string,
    length: number,
    callback: EngineHostFunction,
    attributes: EngineDataPropertyAttributes = MEMBER_PROPERTY,
  ): EngineCallable {
    const method = this.engine.createFunction(
      this.realm,
      name,
      length,
      callback,
    );
    this.engine.initializeDataProperty(object, name, method, attributes);
    return method;
  }

  interfaceMethod(
    object: EngineObject,
    name: string,
    length: number,
    callback: EngineHostFunction,
  ): EngineCallable {
    return this.method(object, name, length, callback, INTERFACE_PROPERTY);
  }

  attribute(
    object: EngineObject,
    name: string,
    getter: EngineHostFunction,
    setter: EngineHostFunction | null = null,
    attributes: EnginePropertyAttributes = ATTRIBUTE_PROPERTY,
  ): void {
    this.engine.initializeAccessorProperty(
      object,
      name,
      this.engine.createFunction(this.realm, `get ${name}`, 0, getter),
      setter === null
        ? null
        : this.engine.createFunction(this.realm, `set ${name}`, 1, setter),
      attributes,
    );
  }

  tag(prototype: EngineObject, value: string): void {
    this.engine.initializeDataProperty(
      prototype,
      this.engine.wellKnownSymbol("toStringTag"),
      this.engine.fromPrimitive(value),
      TAG_PROPERTY,
    );
  }

  primitive(value: EnginePrimitive): EngineResult<EngineValue> {
    return normal(this.engine.fromPrimitive(value));
  }

  undefined(): EngineResult<EngineValue> {
    return this.primitive(undefined);
  }

  typeError(message: string): EngineResult<never> {
    return thrown(this.engine.createTypeError(this.realm, message));
  }

  invalidReceiver(interfaceName: string, member: string): EngineResult<never> {
    return this.typeError(`Invalid ${interfaceName} receiver for ${member}`);
  }

  string(value: EngineValue, wellFormed = false): EngineResult<string> {
    const converted = this.engine.toString(this.realm, value);
    return converted.type === "throw" || !wellFormed
      ? converted
      : normal(converted.value.toWellFormed());
  }

  requiredString(
    argumentsList: readonly EngineValue[],
    index: number,
    operation: string,
    wellFormed = false,
  ): EngineResult<string> {
    const value = argumentsList[index];
    return value === undefined
      ? this.typeError(`${operation} requires ${String(index + 1)} argument(s)`)
      : this.string(value, wellFormed);
  }

  optionalString(
    value: EngineValue | undefined,
    fallback: string,
    wellFormed?: boolean,
  ): EngineResult<string>;
  optionalString(
    value: EngineValue | undefined,
    fallback: undefined,
    wellFormed?: boolean,
  ): EngineResult<string | undefined>;
  optionalString(
    value: EngineValue | undefined,
    fallback: string | undefined,
    wellFormed = false,
  ): EngineResult<string | undefined> {
    return value === undefined || this.engine.isUndefined(value)
      ? normal(fallback)
      : this.string(value, wellFormed);
  }

  nullableString(
    argumentsList: readonly EngineValue[],
    index: number,
    operation: string,
    wellFormed = false,
  ): EngineResult<string | null> {
    const value = argumentsList[index];
    if (value === undefined) {
      return this.typeError(
        `${operation} requires ${String(index + 1)} argument(s)`,
      );
    }
    return this.engine.isNull(value) || this.engine.isUndefined(value)
      ? normal(null)
      : this.string(value, wellFormed);
  }

  requiredCallable(
    value: EngineValue | undefined,
    message: string,
  ): EngineResult<EngineCallable> {
    const callable = value === undefined ? null : this.engine.asCallable(value);
    return callable === null ? this.typeError(message) : normal(callable);
  }

  call(
    callable: EngineCallable,
    thisValue: EngineValue,
    argumentsList: readonly EngineValue[],
  ): EngineResult<EngineValue> {
    return this.engine.call(this.realm, callable, thisValue, argumentsList);
  }

  iterableValues(
    object: EngineObject,
  ): EngineResult<readonly EngineValue[] | null> {
    const methodValue = this.engine.get(
      this.realm,
      object,
      this.engine.wellKnownSymbol("iterator"),
    );
    if (methodValue.type === "throw") {
      return methodValue;
    }
    if (
      this.engine.isUndefined(methodValue.value) ||
      this.engine.isNull(methodValue.value)
    ) {
      return normal(null);
    }
    const method = this.engine.asCallable(methodValue.value);
    if (method === null) {
      return this.typeError("The iterator property is not callable");
    }
    const iteratorValue = this.call(method, object, []);
    if (iteratorValue.type === "throw") {
      return iteratorValue;
    }
    const iterator = this.engine.asObject(iteratorValue.value);
    if (iterator === null) {
      return this.typeError("The iterator did not return an object");
    }
    const nextValue = this.engine.get(this.realm, iterator, "next");
    if (nextValue.type === "throw") {
      return nextValue;
    }
    const next = this.engine.asCallable(nextValue.value);
    if (next === null) {
      return this.typeError("The iterator next property is not callable");
    }

    const values: EngineValue[] = [];
    for (;;) {
      const resultValue = this.call(next, iterator, []);
      if (resultValue.type === "throw") {
        return resultValue;
      }
      const result = this.engine.asObject(resultValue.value);
      if (result === null) {
        return this.typeError("Iterator result is not an object");
      }
      const done = this.engine.get(this.realm, result, "done");
      if (done.type === "throw") {
        return done;
      }
      if (this.engine.toBoolean(done.value)) {
        return normal(values);
      }
      const item = this.engine.get(this.realm, result, "value");
      if (item.type === "throw") {
        return item;
      }
      values.push(item.value);
    }
  }

  stringRecord(
    object: EngineObject,
    wellFormed = false,
  ): EngineResult<ReadonlyMap<string, string>> {
    const names = this.engine.ownEnumerablePropertyNames(this.realm, object);
    if (names.type === "throw") {
      return names;
    }
    const record = new Map<string, string>();
    for (const name of names.value) {
      const property = this.engine.get(this.realm, object, name);
      if (property.type === "throw") {
        return property;
      }
      const value = this.string(property.value, wellFormed);
      if (value.type === "throw") {
        return value;
      }
      record.set(wellFormed ? name.toWellFormed() : name, value.value);
    }
    return normal(record);
  }
}
