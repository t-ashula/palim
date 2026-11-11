import {
  Agent,
  BasicJobQueue,
  Call,
  ClearKeptObjects,
  Construct,
  CreateArrayFromList,
  CreateBuiltinFunction,
  DefinePropertyOrThrow,
  Descriptor,
  EnumerableOwnProperties,
  ExecutionContext,
  FromPropertyDescriptor,
  Get,
  GetFunctionRealm,
  IsCallable,
  isPromiseObject,
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
  ToPropertyDescriptor,
  ToString,
  Value,
  ValueOfNormalCompletion,
  wellKnownSymbols,
  X,
} from "@engine262/engine262";
import type {
  FunctionObject,
  HostPromiseRejectionTracker,
  Job,
  NativeSteps,
  PropertyKeyValue,
  ProxyObject,
  Realm,
  ScriptRecord,
  Value as Engine262Value,
} from "@engine262/engine262";

import {
  EngineCallable,
  EngineJob,
  EngineObject,
  EngineRealm,
  EngineScript,
  EngineValue,
  normal,
  thrown,
} from "@palim/scripting/internal/javascript-engine/adapter.js";
import type {
  EngineDataPropertyAttributes,
  EngineHostFunction,
  EngineJobEnqueueCallback,
  EnginePromiseRejectionTracker,
  EnginePrimitive,
  EnginePropertyKey,
  EnginePropertyAttributes,
  EngineRealmOptions,
  EngineResult,
  EngineProxyHandler,
  EngineProxyTrap,
  EngineWellKnownSymbol,
  JavaScriptEngineAdapter,
} from "@palim/scripting/internal/javascript-engine/adapter.js";

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

class Engine262Job extends EngineJob {
  constructor(
    readonly owner: Engine262Adapter,
    readonly job: Job,
  ) {
    super();
  }
}

type Engine262ObjectHandle = Engine262Object | Engine262Callable;

export class Engine262Adapter implements JavaScriptEngineAdapter {
  readonly #jobQueue = new BasicJobQueue();
  readonly #promiseRejectionTrackers = new Set<EnginePromiseRejectionTracker>();
  readonly #hostPromiseRejectionTrackers = new Set<HostPromiseRejectionTracker>(
    [
      (promise, operation) => {
        const reason = promise.PromiseResult;
        if (reason === undefined) {
          throw new TypeError("A tracked Promise has no result");
        }
        const promiseHandle = this.#wrapObject(promise);
        const reasonHandle = this.#wrap(reason);
        for (const tracker of this.#promiseRejectionTrackers) {
          tracker(promiseHandle, reasonHandle, operation);
        }
      },
    ],
  );
  readonly #agent = new Agent({
    hostHooks: {
      HostPromiseRejectionTrackers: this.#hostPromiseRejectionTrackers,
    },
    jobQueue: this.#jobQueue,
    startEventLoop: false,
  });
  readonly #objects = new WeakMap<ObjectValue, Engine262ObjectHandle>();
  readonly #realms = new WeakMap<Realm, Engine262Realm>();
  readonly #forwardingObjects = new WeakSet<ObjectValue>();
  readonly #jobs = new WeakMap<Job, Engine262Job>();
  readonly #scripts = new WeakMap<ScriptRecord, Engine262Script>();
  readonly #jobEnqueueCallbacks = new Set<EngineJobEnqueueCallback>();

  constructor() {
    this.#jobQueue.onNewJob.add((job) => {
      const handle = this.#wrapJob(job);
      for (const callback of this.#jobEnqueueCallbacks) {
        callback(handle);
      }
    });
  }

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
    const handle = new Engine262Realm(
      this,
      realm,
      forwardingGlobalThis ?? realm.GlobalObject,
    );
    this.#realms.set(realm, handle);
    return handle;
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

  asBoolean(value: EngineValue): boolean | null {
    const engineValue = this.#value(value);
    if (engineValue === Value.true) {
      return true;
    }
    if (engineValue === Value.false) {
      return false;
    }
    return null;
  }

  asString(value: EngineValue): string | null {
    const engineValue = this.#value(value);
    return engineValue instanceof JSStringValue
      ? engineValue.stringValue()
      : null;
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

  callableRealm(
    realm: EngineRealm,
    callable: EngineCallable,
  ): EngineResult<EngineRealm> {
    const realmHandle = this.#realm(realm);
    return this.#withRealm(realmHandle, () => {
      const completion = GetFunctionRealm(this.#callable(callable));
      if (completion instanceof ThrowCompletion) {
        return thrown(this.#wrap(completion.Value));
      }
      const callableRealm = this.#realms.get(
        ValueOfNormalCompletion(completion),
      );
      if (callableRealm === undefined) {
        throw new TypeError(
          "The callable realm is not managed by this adapter",
        );
      }
      return normal(callableRealm);
    });
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

  createProxy(
    realm: EngineRealm,
    target: EngineObject,
    handler: EngineProxyHandler,
  ): EngineObject {
    const realmHandle = this.#realm(realm);
    return this.#withRealm(realmHandle, () => {
      const handlerObject = OrdinaryObjectCreate(
        realmHandle.realm.Intrinsics["%Object.prototype%"],
      );
      for (const name of Object.keys(handler) as (keyof EngineProxyHandler)[]) {
        const trap = handler[name];
        if (trap === undefined) {
          continue;
        }
        X(
          DefinePropertyOrThrow(
            handlerObject,
            name,
            Descriptor({
              Value: this.#proxyTrapFunction(realmHandle, name, trap),
              Writable: true,
              Enumerable: true,
              Configurable: true,
            }),
          ),
        );
      }
      return this.#wrapObject(
        X(ProxyCreate(this.#object(target), handlerObject)),
      );
    });
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

  hasProperty(
    realm: EngineRealm,
    object: EngineObject,
    key: EnginePropertyKey,
  ): EngineResult<boolean> {
    const realmHandle = this.#realm(realm);
    return this.#withRealm(realmHandle, () => {
      const completion = skipDebugger(
        this.#object(object).HasProperty(this.#propertyKey(key)),
      );
      return completion instanceof ThrowCompletion
        ? thrown(this.#wrap(completion.Value))
        : normal(ValueOfNormalCompletion(completion));
    });
  }

  ownPropertyKeys(
    realm: EngineRealm,
    object: EngineObject,
  ): EngineResult<readonly EngineValue[]> {
    const realmHandle = this.#realm(realm);
    return this.#withRealm(realmHandle, () => {
      const completion = skipDebugger(this.#object(object).OwnPropertyKeys());
      return completion instanceof ThrowCompletion
        ? thrown(this.#wrap(completion.Value))
        : normal(
            ValueOfNormalCompletion(completion).map((key) => this.#wrap(key)),
          );
    });
  }

  setPrototypeOf(
    realm: EngineRealm,
    object: EngineObject,
    prototype: EngineObject | null,
  ): EngineResult<boolean> {
    const realmHandle = this.#realm(realm);
    return this.#withRealm(realmHandle, () => {
      const completion = skipDebugger(
        this.#object(object).SetPrototypeOf(
          prototype === null ? Value.null : this.#object(prototype),
        ),
      );
      return completion instanceof ThrowCompletion
        ? thrown(this.#wrap(completion.Value))
        : normal(ValueOfNormalCompletion(completion));
    });
  }

  initializePrototypeOf(
    object: EngineObject,
    prototype: EngineObject | null,
  ): void {
    this.#activate();
    const completion = skipDebugger(
      this.#object(object).SetPrototypeOf(
        prototype === null ? Value.null : this.#object(prototype),
      ),
    );
    if (
      completion instanceof ThrowCompletion ||
      !ValueOfNormalCompletion(completion)
    ) {
      throw new TypeError("Cannot initialize the object prototype");
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
    realm: EngineRealm,
    object: EngineObject,
    name: EnginePropertyKey,
    value: EngineValue,
    attributes: EngineDataPropertyAttributes,
  ): EngineResult<boolean> {
    const realmHandle = this.#realm(realm);
    return this.#withRealm(realmHandle, () => {
      const completion = skipDebugger(
        this.#object(object).DefineOwnProperty(
          this.#propertyKey(name),
          Descriptor({
            Value: this.#value(value),
            Writable: attributes.writable,
            Enumerable: attributes.enumerable,
            Configurable: attributes.configurable,
          }),
        ),
      );
      return completion instanceof ThrowCompletion
        ? thrown(this.#wrap(completion.Value))
        : normal(ValueOfNormalCompletion(completion));
    });
  }

  initializeDataProperty(
    object: EngineObject,
    name: EnginePropertyKey,
    value: EngineValue,
    attributes: EngineDataPropertyAttributes,
  ): void {
    this.#activate();
    const completion = skipDebugger(
      this.#object(object).DefineOwnProperty(
        this.#propertyKey(name),
        Descriptor({
          Value: this.#value(value),
          Writable: attributes.writable,
          Enumerable: attributes.enumerable,
          Configurable: attributes.configurable,
        }),
      ),
    );
    if (
      completion instanceof ThrowCompletion ||
      !ValueOfNormalCompletion(completion)
    ) {
      throw new TypeError("Cannot initialize data property");
    }
  }

  defineAccessorProperty(
    realm: EngineRealm,
    object: EngineObject,
    name: string,
    getter: EngineCallable | null,
    setter: EngineCallable | null,
    attributes: EnginePropertyAttributes,
  ): EngineResult<boolean> {
    const realmHandle = this.#realm(realm);
    return this.#withRealm(realmHandle, () => {
      const completion = skipDebugger(
        this.#object(object).DefineOwnProperty(
          name,
          Descriptor({
            Get: getter === null ? Value.undefined : this.#callable(getter),
            Set: setter === null ? Value.undefined : this.#callable(setter),
            Enumerable: attributes.enumerable,
            Configurable: attributes.configurable,
          }),
        ),
      );
      return completion instanceof ThrowCompletion
        ? thrown(this.#wrap(completion.Value))
        : normal(ValueOfNormalCompletion(completion));
    });
  }

  initializeAccessorProperty(
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
      throw new TypeError(`Cannot initialize property ${name}`);
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
    if (completion instanceof ThrowCompletion) {
      return thrown(this.#wrap(completion.Value));
    }
    const record = ValueOfNormalCompletion(completion);
    const script = new Engine262Script(this, realmHandle, record);
    this.#scripts.set(record, script);
    return normal(script);
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

  construct(
    realm: EngineRealm,
    constructor: EngineCallable,
    argumentsList: readonly EngineValue[],
  ): EngineResult<EngineObject> {
    const realmHandle = this.#realm(realm);
    return this.#withRealm(realmHandle, () => {
      const completion = skipDebugger(
        Construct(
          this.#callable(constructor),
          argumentsList.map((argument) => this.#value(argument)),
        ),
      );
      return completion instanceof ThrowCompletion
        ? thrown(this.#wrap(completion.Value))
        : normal(this.#wrapObject(ValueOfNormalCompletion(completion)));
    });
  }

  createTypeError(realm: EngineRealm, message: string): EngineValue {
    return this.#createError(realm, "%TypeError%", message);
  }

  createRangeError(realm: EngineRealm, message: string): EngineValue {
    return this.#createError(realm, "%RangeError%", message);
  }

  #createError(
    realm: EngineRealm,
    intrinsic: "%TypeError%" | "%RangeError%",
    message: string,
  ): EngineValue {
    const realmHandle = this.#realm(realm);
    return this.#withRealm(realmHandle, () => {
      const completion = skipDebugger(
        Construct(realmHandle.realm.Intrinsics[intrinsic], [Value(message)]),
      );
      if (completion instanceof ThrowCompletion) {
        throw new TypeError(`Cannot create a JavaScript ${intrinsic}`);
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

  isPromise(value: EngineValue): boolean {
    return isPromiseObject(this.#value(value));
  }

  addPromiseRejectionTracker(tracker: EnginePromiseRejectionTracker): void {
    this.#promiseRejectionTrackers.add(tracker);
  }

  removePromiseRejectionTracker(tracker: EnginePromiseRejectionTracker): void {
    this.#promiseRejectionTrackers.delete(tracker);
  }

  addJobEnqueueCallback(callback: EngineJobEnqueueCallback): void {
    this.#jobEnqueueCallbacks.add(callback);
  }

  removeJobEnqueueCallback(callback: EngineJobEnqueueCallback): void {
    this.#jobEnqueueCallbacks.delete(callback);
  }

  enqueueJob(realm: EngineRealm, callback: () => void): EngineJob {
    this.#activate();
    const realmHandle = this.#realm(realm);
    const pageErrorCompletion = (error: unknown): ThrowCompletion =>
      this.#pageErrorCompletion(realmHandle, error);
    const job: Job = {
      queueName: "Microtasks",
      job: function* job() {
        try {
          callback();
          return Value.undefined;
        } catch (error: unknown) {
          return pageErrorCompletion(error);
        }
      },
      callerRealm: realmHandle.realm,
      callerScriptOrModule: null,
    };
    this.#jobQueue.enqueueGenericJob(job);
    return this.#wrapJob(job);
  }

  dequeueJob(): EngineJob | null {
    this.#activate();
    const job = this.#jobQueue.shift();
    return job === undefined ? null : this.#wrapJob(job);
  }

  jobRealm(job: EngineJob): EngineRealm | null {
    const realm = this.#job(job).callerRealm;
    if (realm === undefined) {
      return null;
    }
    const handle = this.#realms.get(realm);
    if (handle === undefined) {
      throw new TypeError("The job realm is not owned by this adapter");
    }
    return handle;
  }

  jobScript(job: EngineJob): EngineScript | null {
    const script = this.#job(job).callerScriptOrModule;
    return script === null
      ? null
      : (this.#scripts.get(script as ScriptRecord) ?? null);
  }

  runJob(job: EngineJob): EngineResult<EngineValue> {
    this.#activate();
    const record = this.#job(job);
    const stack = this.#agent.executionContextStack;
    const previousDepth = stack.length;
    const context =
      record.callerRealm === undefined ? null : new ExecutionContext();
    if (context !== null && record.callerRealm !== undefined) {
      context.Function = Value.null;
      context.Realm = record.callerRealm;
      context.ScriptOrModule = record.callerScriptOrModule;
      stack.push(context);
    }
    try {
      const completion = skipDebugger(record.job());
      return completion instanceof ThrowCompletion
        ? thrown(this.#wrap(completion.Value as Engine262Value))
        : normal(this.fromPrimitive(undefined));
    } catch (error: unknown) {
      if (stack.length > previousDepth) {
        stack.length = previousDepth;
      }
      throw error;
    } finally {
      if (context !== null && stack.length > previousDepth) {
        stack.pop(context);
      }
      ClearKeptObjects();
    }
  }

  #wrapJob(job: Job): Engine262Job {
    let handle = this.#jobs.get(job);
    if (handle === undefined) {
      handle = new Engine262Job(this, job);
      this.#jobs.set(job, handle);
    }
    return handle;
  }

  #job(job: EngineJob): Job {
    if (!(job instanceof Engine262Job) || job.owner !== this) {
      throw new TypeError("The job is not owned by this adapter");
    }
    return job.job;
  }

  #proxyTrapFunction(
    realm: Engine262Realm,
    name: keyof EngineProxyHandler,
    trap: EngineProxyTrap,
  ): FunctionObject {
    const lengths: Readonly<Record<keyof EngineProxyHandler, number>> = {
      get: 3,
      has: 2,
      ownKeys: 1,
      getOwnPropertyDescriptor: 2,
      set: 4,
      defineProperty: 3,
      deleteProperty: 2,
    };
    const steps: NativeSteps = (argumentsList) => {
      try {
        const rawArguments = Array.from(argumentsList.values());
        const result = trap(
          rawArguments.map((argument) => this.#wrap(argument)),
        );
        if (result.type === "forward") {
          return this.#forwardProxyTrap(name, rawArguments);
        }
        return result.type === "throw"
          ? ThrowCompletion(this.#value(result.value))
          : this.#value(result.value);
      } catch (error: unknown) {
        return this.#pageErrorCompletion(realm, error);
      }
    };
    return CreateBuiltinFunction(steps, lengths[name], name, [], realm.realm);
  }

  #forwardProxyTrap(
    name: keyof EngineProxyHandler,
    argumentsList: readonly Engine262Value[],
  ): Engine262Value | ThrowCompletion {
    const target = argumentsList[0];
    if (!(target instanceof ObjectValue)) {
      throw new TypeError("Proxy target is not an object");
    }
    if (name === "ownKeys") {
      const completion = skipDebugger(target.OwnPropertyKeys());
      return completion instanceof ThrowCompletion
        ? completion
        : CreateArrayFromList(ValueOfNormalCompletion(completion));
    }
    const property = argumentsList[1] as PropertyKeyValue | undefined;
    if (property === undefined) {
      throw new TypeError(`Proxy ${name} trap requires a property key`);
    }
    if (name === "get") {
      const receiver = argumentsList[2] ?? target;
      const completion = skipDebugger(target.Get(property, receiver));
      return completion instanceof ThrowCompletion
        ? completion
        : ValueOfNormalCompletion(completion);
    }
    if (name === "has") {
      const completion = skipDebugger(target.HasProperty(property));
      return completion instanceof ThrowCompletion
        ? completion
        : Value(ValueOfNormalCompletion(completion));
    }
    if (name === "getOwnPropertyDescriptor") {
      const completion = skipDebugger(target.GetOwnProperty(property));
      return completion instanceof ThrowCompletion
        ? completion
        : FromPropertyDescriptor(ValueOfNormalCompletion(completion));
    }
    if (name === "set") {
      const value = argumentsList[2] ?? Value.undefined;
      const receiver = argumentsList[3] ?? target;
      const completion = skipDebugger(target.Set(property, value, receiver));
      return completion instanceof ThrowCompletion
        ? completion
        : Value(ValueOfNormalCompletion(completion));
    }
    if (name === "defineProperty") {
      const descriptorValue = argumentsList[2] ?? Value.undefined;
      const descriptor = skipDebugger(ToPropertyDescriptor(descriptorValue));
      if (descriptor instanceof ThrowCompletion) {
        return descriptor;
      }
      const completion = skipDebugger(
        target.DefineOwnProperty(property, ValueOfNormalCompletion(descriptor)),
      );
      return completion instanceof ThrowCompletion
        ? completion
        : Value(ValueOfNormalCompletion(completion));
    }
    const completion = skipDebugger(target.Delete(property));
    return completion instanceof ThrowCompletion
      ? completion
      : Value(ValueOfNormalCompletion(completion));
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
        } catch (error: unknown) {
          return this.#pageErrorCompletion(realmHandle, error);
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

  #pageErrorCompletion(realm: Engine262Realm, error: unknown): ThrowCompletion {
    let message = "Host execution failed";
    try {
      message = error instanceof Error ? error.message : String(error);
    } catch {
      // Keep the fallback message if inspecting the host exception fails.
    }
    const completion = skipDebugger(
      Construct(realm.realm.Intrinsics["%Error%"], [Value(message)]),
    );
    return completion instanceof ThrowCompletion
      ? completion
      : ThrowCompletion(ValueOfNormalCompletion(completion));
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
    const activeDepth = this.#agent.executionContextStack.length;
    try {
      return callback();
    } catch (error: unknown) {
      if (this.#agent.executionContextStack.length > activeDepth) {
        this.#agent.executionContextStack.length = activeDepth;
      }
      throw error;
    } finally {
      pop?.();
    }
  }
}
