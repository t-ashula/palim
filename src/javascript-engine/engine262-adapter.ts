import {
  Agent,
  Call,
  Construct,
  CreateArrayFromList,
  CreateBuiltinFunction,
  DefinePropertyOrThrow,
  Descriptor,
  EnumerableOwnProperties,
  Get,
  IsCallable,
  JSStringValue,
  ManagedRealm,
  markBuiltinFunctionAsConstructor,
  ObjectValue,
  OrdinaryObjectCreate,
  ProxyCreate,
  setSurroundingAgent,
  skipDebugger,
  ThrowCompletion,
  ToBoolean,
  ToNumber,
  ToString,
  Value,
  ValueOfNormalCompletion,
  wellKnownSymbols,
  X,
} from "@engine262/engine262";
import type {
  FunctionObject,
  NativeSteps,
  PropertyKeyValue,
  ProxyObject,
  ScriptRecord,
  Value as Engine262Value,
} from "@engine262/engine262";

import {
  EngineCallable,
  EngineObject,
  EngineRealm,
  EngineScript,
  EngineValue,
  normal,
  thrown,
} from "./adapter.js";
import type {
  EngineDataPropertyAttributes,
  EngineHostFunction,
  EnginePrimitive,
  EnginePropertyKey,
  EnginePropertyAttributes,
  EngineRealmOptions,
  EngineResult,
  EngineWellKnownSymbol,
  JavaScriptEngineAdapter,
} from "./adapter.js";

class Engine262Realm extends EngineRealm {
  constructor(
    readonly owner: Engine262Adapter,
    readonly realm: ManagedRealm,
    readonly globalThisValue: ObjectValue,
  ) {
    super();
  }
}

class Engine262Primitive extends EngineValue {
  constructor(
    readonly owner: Engine262Adapter,
    readonly value: Engine262Value,
  ) {
    super();
  }
}

class Engine262Object extends EngineObject {
  constructor(
    readonly owner: Engine262Adapter,
    readonly value: ObjectValue,
  ) {
    super();
  }
}

class Engine262Callable extends EngineCallable {
  constructor(
    readonly owner: Engine262Adapter,
    readonly value: FunctionObject,
  ) {
    super();
  }
}

class Engine262Script extends EngineScript {
  constructor(
    readonly owner: Engine262Adapter,
    readonly realm: Engine262Realm,
    readonly record: ScriptRecord,
  ) {
    super();
  }
}

type Engine262ObjectHandle = Engine262Object | Engine262Callable;

export class Engine262Adapter implements JavaScriptEngineAdapter {
  readonly #agent = new Agent({ startEventLoop: false });
  readonly #objects = new WeakMap<ObjectValue, Engine262ObjectHandle>();
  readonly #forwardingObjects = new WeakSet<ObjectValue>();

  createRealm(options: EngineRealmOptions = {}): EngineRealm {
    this.#activate();
    let forwardingGlobalThis: ObjectValue | undefined;
    const realm = new ManagedRealm({}, (record) => {
      if (!options.forwardingGlobalThis) {
        return [undefined, undefined];
      }
      const globalObject = OrdinaryObjectCreate(
        record.Intrinsics["%Object.prototype%"],
      );
      const handler = OrdinaryObjectCreate(
        record.Intrinsics["%Object.prototype%"],
      );
      forwardingGlobalThis = X(ProxyCreate(globalObject, handler));
      this.#forwardingObjects.add(forwardingGlobalThis);
      return [globalObject, forwardingGlobalThis];
    });
    return new Engine262Realm(
      this,
      realm,
      forwardingGlobalThis ?? realm.GlobalObject,
    );
  }

  globalObject(realm: EngineRealm): EngineObject {
    return this.#wrapObject(this.#realm(realm).realm.GlobalObject);
  }

  globalThis(realm: EngineRealm): EngineObject {
    return this.#wrapObject(this.#realm(realm).globalThisValue);
  }

  objectPrototype(realm: EngineRealm): EngineObject {
    return this.#wrapObject(
      this.#realm(realm).realm.Intrinsics["%Object.prototype%"],
    );
  }

  iteratorPrototype(realm: EngineRealm): EngineObject {
    return this.#wrapObject(
      this.#realm(realm).realm.Intrinsics["%Iterator.prototype%"],
    );
  }

  fromPrimitive(value: EnginePrimitive): EngineValue {
    return new Engine262Primitive(this, Value(value));
  }

  wellKnownSymbol(name: EngineWellKnownSymbol): EngineValue {
    return new Engine262Primitive(this, wellKnownSymbols[name]);
  }

  toString(realm: EngineRealm, value: EngineValue): EngineResult<string> {
    const realmHandle = this.#realm(realm);
    return this.#withRealm(realmHandle, () => {
      const completion = skipDebugger(ToString(this.#value(value)));
      if (completion instanceof ThrowCompletion) {
        return thrown(this.#wrap(completion.Value));
      }
      return normal(ValueOfNormalCompletion(completion));
    });
  }

  toNumber(realm: EngineRealm, value: EngineValue): EngineResult<number> {
    const realmHandle = this.#realm(realm);
    return this.#withRealm(realmHandle, () => {
      const completion = skipDebugger(ToNumber(this.#value(value)));
      if (completion instanceof ThrowCompletion) {
        return thrown(this.#wrap(completion.Value));
      }
      return normal(ValueOfNormalCompletion(completion).numberValue());
    });
  }

  toBoolean(value: EngineValue): boolean {
    return ToBoolean(this.#value(value));
  }

  asObject(value: EngineValue): EngineObject | null {
    const engineValue = this.#value(value);
    return engineValue instanceof ObjectValue
      ? this.#wrapObject(engineValue)
      : null;
  }

  asCallable(value: EngineValue): EngineCallable | null {
    const engineValue = this.#value(value);
    return IsCallable(engineValue) ? this.#wrapCallable(engineValue) : null;
  }

  isNull(value: EngineValue): boolean {
    return this.#value(value) === Value.null;
  }

  isUndefined(value: EngineValue): boolean {
    return this.#value(value) === Value.undefined;
  }

  createObject(
    realm: EngineRealm,
    prototype: EngineObject | null,
  ): EngineObject {
    const realmHandle = this.#realm(realm);
    return this.#withRealm(realmHandle, () =>
      this.#wrapObject(
        OrdinaryObjectCreate(
          prototype === null ? Value.null : this.#object(prototype),
        ),
      ),
    );
  }

  createArray(
    realm: EngineRealm,
    values: readonly EngineValue[],
  ): EngineObject {
    const realmHandle = this.#realm(realm);
    return this.#withRealm(realmHandle, () =>
      this.#wrapObject(
        CreateArrayFromList(values.map((value) => this.#value(value))),
      ),
    );
  }

  get(
    realm: EngineRealm,
    object: EngineObject,
    key: EnginePropertyKey,
  ): EngineResult<EngineValue> {
    const realmHandle = this.#realm(realm);
    return this.#withRealm(realmHandle, () => {
      const completion = skipDebugger(
        Get(this.#object(object), this.#propertyKey(key)),
      );
      return completion instanceof ThrowCompletion
        ? thrown(this.#wrap(completion.Value))
        : normal(this.#wrap(ValueOfNormalCompletion(completion)));
    });
  }

  ownEnumerablePropertyNames(
    realm: EngineRealm,
    object: EngineObject,
  ): EngineResult<readonly string[]> {
    const realmHandle = this.#realm(realm);
    return this.#withRealm(realmHandle, () => {
      const completion = skipDebugger(
        EnumerableOwnProperties(this.#object(object), "key"),
      );
      return completion instanceof ThrowCompletion
        ? thrown(this.#wrap(completion.Value))
        : normal(
            ValueOfNormalCompletion(completion).map((key: JSStringValue) =>
              key.stringValue(),
            ),
          );
    });
  }

  setPrototypeOf(object: EngineObject, prototype: EngineObject | null): void {
    this.#activate();
    const completion = skipDebugger(
      this.#object(object).SetPrototypeOf(
        prototype === null ? Value.null : this.#object(prototype),
      ),
    );
    if (completion instanceof ThrowCompletion) {
      throw new TypeError("Cannot set the object prototype");
    }
    if (!ValueOfNormalCompletion(completion)) {
      throw new TypeError("The object prototype was rejected");
    }
  }

  setForwardingTarget(object: EngineObject, target: EngineObject): void {
    const forwardingObject = this.#object(object);
    if (!this.#forwardingObjects.has(forwardingObject)) {
      throw new TypeError("The object is not a forwarding global this");
    }
    (forwardingObject as ProxyObject).ProxyTarget = this.#object(target);
  }

  createFunction(
    realm: EngineRealm,
    name: string,
    length: number,
    callback: EngineHostFunction,
  ): EngineCallable {
    return this.#createFunction(realm, name, length, callback, false);
  }

  createConstructor(
    realm: EngineRealm,
    name: string,
    length: number,
    callback: EngineHostFunction,
  ): EngineCallable {
    return this.#createFunction(realm, name, length, callback, true);
  }

  defineDataProperty(
    object: EngineObject,
    name: EnginePropertyKey,
    value: EngineValue,
    attributes: EngineDataPropertyAttributes,
  ): void {
    this.#activate();
    const completion = skipDebugger(
      DefinePropertyOrThrow(
        this.#object(object),
        this.#propertyKey(name),
        Descriptor({
          Value: this.#value(value),
          Writable: attributes.writable,
          Enumerable: attributes.enumerable,
          Configurable: attributes.configurable,
        }),
      ),
    );
    if (completion instanceof ThrowCompletion) {
      throw new TypeError("Cannot define data property");
    }
  }

  defineAccessorProperty(
    object: EngineObject,
    name: string,
    getter: EngineCallable | null,
    setter: EngineCallable | null,
    attributes: EnginePropertyAttributes,
  ): void {
    this.#activate();
    const completion = skipDebugger(
      DefinePropertyOrThrow(
        this.#object(object),
        name,
        Descriptor({
          Get: getter === null ? Value.undefined : this.#callable(getter),
          Set: setter === null ? Value.undefined : this.#callable(setter),
          Enumerable: attributes.enumerable,
          Configurable: attributes.configurable,
        }),
      ),
    );
    if (completion instanceof ThrowCompletion) {
      throw new TypeError(`Cannot define property ${name}`);
    }
  }

  compileScript(
    realm: EngineRealm,
    source: string,
    sourceURL?: string,
  ): EngineResult<EngineScript> {
    const realmHandle = this.#realm(realm);
    this.#activate();
    const completion = realmHandle.realm.compileScript(source, {
      specifier: sourceURL,
    });
    return completion instanceof ThrowCompletion
      ? thrown(this.#wrap(completion.Value))
      : normal(
          new Engine262Script(
            this,
            realmHandle,
            ValueOfNormalCompletion(completion),
          ),
        );
  }

  runScript(
    realm: EngineRealm,
    script: EngineScript,
  ): EngineResult<EngineValue> {
    const realmHandle = this.#realm(realm);
    if (
      !(script instanceof Engine262Script) ||
      script.owner !== this ||
      script.realm !== realmHandle
    ) {
      throw new TypeError("The script belongs to another engine realm");
    }
    this.#activate();
    const completion = realmHandle.realm.evaluateScriptSkipDebugger(
      script.record,
    );
    return completion instanceof ThrowCompletion
      ? thrown(this.#wrap(completion.Value))
      : normal(this.#wrap(ValueOfNormalCompletion(completion)));
  }

  evaluate(realm: EngineRealm, source: string): EngineResult<EngineValue> {
    const compilation = this.compileScript(realm, source);
    return compilation.type === "throw"
      ? compilation
      : this.runScript(realm, compilation.value);
  }

  call(
    realm: EngineRealm,
    callable: EngineCallable,
    thisValue: EngineValue,
    argumentsList: readonly EngineValue[],
  ): EngineResult<EngineValue> {
    const realmHandle = this.#realm(realm);
    return this.#withRealm(realmHandle, () => {
      const completion = skipDebugger(
        Call(
          this.#callable(callable),
          this.#value(thisValue),
          argumentsList.map((argument) => this.#value(argument)),
        ),
      );
      return completion instanceof ThrowCompletion
        ? thrown(this.#wrap(completion.Value))
        : normal(this.#wrap(ValueOfNormalCompletion(completion)));
    });
  }

  createTypeError(realm: EngineRealm, message: string): EngineValue {
    const realmHandle = this.#realm(realm);
    return this.#withRealm(realmHandle, () => {
      const completion = skipDebugger(
        Construct(realmHandle.realm.Intrinsics["%TypeError%"], [
          Value(message),
        ]),
      );
      if (completion instanceof ThrowCompletion) {
        throw new TypeError("Cannot create a JavaScript TypeError");
      }
      return this.#wrap(ValueOfNormalCompletion(completion));
    });
  }

  exceptionMessage(realm: EngineRealm, value: EngineValue): string {
    const result = this.toString(realm, value);
    return result.type === "normal"
      ? result.value
      : "JavaScript execution failed";
  }

  performPromiseCheckpoint(): void {
    this.#activate();
    this.#agent.eventLoop.runOnce();
  }

  #createFunction(
    realm: EngineRealm,
    name: string,
    length: number,
    callback: EngineHostFunction,
    constructor: boolean,
  ): EngineCallable {
    const realmHandle = this.#realm(realm);
    return this.#withRealm(realmHandle, () => {
      const steps: NativeSteps = (argumentsList, context) => {
        try {
          if (constructor && context.NewTarget === Value.undefined) {
            return ThrowCompletion(
              this.#value(
                this.createTypeError(realmHandle, `${name} requires 'new'`),
              ),
            );
          }
          const values: EngineValue[] = [];
          for (const value of argumentsList.values()) {
            values.push(this.#wrap(value));
          }
          const result = callback(this.#wrap(context.thisValue), values);
          return result.type === "throw"
            ? ThrowCompletion(this.#value(result.value))
            : this.#value(result.value);
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Host operation failed";
          return ThrowCompletion(
            this.#value(this.createTypeError(realmHandle, message)),
          );
        }
      };
      const behavior = constructor
        ? markBuiltinFunctionAsConstructor(steps)
        : steps;
      return this.#wrapCallable(
        CreateBuiltinFunction(behavior, length, name, [], realmHandle.realm),
      );
    });
  }

  #activate(): void {
    setSurroundingAgent(this.#agent);
  }

  #realm(realm: EngineRealm): Engine262Realm {
    if (!(realm instanceof Engine262Realm) || realm.owner !== this) {
      throw new TypeError("The realm belongs to another engine adapter");
    }
    return realm;
  }

  #value(value: EngineValue): Engine262Value {
    if (
      (value instanceof Engine262Primitive ||
        value instanceof Engine262Object ||
        value instanceof Engine262Callable) &&
      value.owner === this
    ) {
      return value.value;
    }
    throw new TypeError("The value belongs to another engine adapter");
  }

  #object(object: EngineObject): ObjectValue {
    const value = this.#value(object);
    if (!(value instanceof ObjectValue)) {
      throw new TypeError("The handle does not contain an object");
    }
    return value;
  }

  #propertyKey(key: EnginePropertyKey): PropertyKeyValue | string {
    if (typeof key === "string") {
      return key;
    }
    const value = this.#value(key);
    if (value instanceof JSStringValue || value.type === "Symbol") {
      return value;
    }
    throw new TypeError("The value is not a property key");
  }

  #callable(callable: EngineCallable): FunctionObject {
    const value = this.#value(callable);
    if (!IsCallable(value)) {
      throw new TypeError("The handle does not contain a callable");
    }
    return value;
  }

  #wrap(value: Engine262Value): EngineValue {
    return value instanceof ObjectValue
      ? this.#wrapObject(value)
      : new Engine262Primitive(this, value);
  }

  #wrapObject(value: ObjectValue): Engine262ObjectHandle {
    const existing = this.#objects.get(value);
    if (existing !== undefined) {
      return existing;
    }
    const handle = IsCallable(value)
      ? new Engine262Callable(this, value)
      : new Engine262Object(this, value);
    this.#objects.set(value, handle);
    return handle;
  }

  #wrapCallable(value: FunctionObject): Engine262Callable {
    const handle = this.#wrapObject(value);
    if (!(handle instanceof Engine262Callable)) {
      throw new TypeError("The engine value is not callable");
    }
    return handle;
  }

  #withRealm<T>(realm: Engine262Realm, callback: () => T): T {
    this.#activate();
    const pop = realm.realm.pushTopContext();
    try {
      return callback();
    } finally {
      pop?.();
    }
  }
}
