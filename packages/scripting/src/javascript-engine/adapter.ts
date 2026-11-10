export abstract class EngineRealm {
  declare private readonly engineRealm: never;
}

export abstract class EngineValue {
  declare private readonly engineValue: never;
}

export abstract class EngineObject extends EngineValue {
  declare private readonly engineObject: never;
}

export abstract class EngineCallable extends EngineObject {
  declare private readonly engineCallable: never;
}

export abstract class EngineScript {
  declare private readonly engineScript: never;
}

export abstract class EngineJob {
  declare private readonly engineJob: never;
}

export type EnginePrimitive =
  undefined | null | boolean | string | number | bigint;

export type EngineResult<T> =
  | { readonly type: "normal"; readonly value: T }
  | { readonly type: "throw"; readonly value: EngineValue };

export interface EnginePropertyAttributes {
  readonly configurable: boolean;
  readonly enumerable: boolean;
}

export interface EngineDataPropertyAttributes extends EnginePropertyAttributes {
  readonly writable: boolean;
}

export interface EngineRealmOptions {
  readonly forwardingGlobalThis?: boolean;
}

export type EngineWellKnownSymbol = "iterator" | "toStringTag";

export type EnginePropertyKey = string | EngineValue;

export type EngineHostFunction = (
  thisValue: EngineValue,
  argumentsList: readonly EngineValue[],
) => EngineResult<EngineValue>;

export type EngineJobEnqueueCallback = (job: EngineJob) => void;
export type EnginePromiseRejectionOperation = "reject" | "handle";
export type EnginePromiseRejectionTracker = (
  promise: EngineObject,
  reason: EngineValue,
  operation: EnginePromiseRejectionOperation,
) => void;

export const FORWARD_PROXY_TRAP = { type: "forward" } as const;

export type EngineProxyTrapResult =
  EngineResult<EngineValue> | typeof FORWARD_PROXY_TRAP;

export type EngineProxyTrap = (
  argumentsList: readonly EngineValue[],
) => EngineProxyTrapResult;

export interface EngineProxyHandler {
  readonly get?: EngineProxyTrap;
  readonly has?: EngineProxyTrap;
  readonly ownKeys?: EngineProxyTrap;
  readonly getOwnPropertyDescriptor?: EngineProxyTrap;
  readonly set?: EngineProxyTrap;
  readonly defineProperty?: EngineProxyTrap;
  readonly deleteProperty?: EngineProxyTrap;
}

export interface JavaScriptEngineAdapter {
  createRealm(options?: EngineRealmOptions): EngineRealm;
  globalObject(realm: EngineRealm): EngineObject;
  globalThis(realm: EngineRealm): EngineObject;
  objectPrototype(realm: EngineRealm): EngineObject;
  iteratorPrototype(realm: EngineRealm): EngineObject;
  fromPrimitive(value: EnginePrimitive): EngineValue;
  wellKnownSymbol(name: EngineWellKnownSymbol): EngineValue;
  toString(realm: EngineRealm, value: EngineValue): EngineResult<string>;
  toNumber(realm: EngineRealm, value: EngineValue): EngineResult<number>;
  toBoolean(value: EngineValue): boolean;
  asBoolean(value: EngineValue): boolean | null;
  asString(value: EngineValue): string | null;
  asObject(value: EngineValue): EngineObject | null;
  asCallable(value: EngineValue): EngineCallable | null;
  callableRealm(
    realm: EngineRealm,
    callable: EngineCallable,
  ): EngineResult<EngineRealm>;
  isNull(value: EngineValue): boolean;
  isUndefined(value: EngineValue): boolean;
  createObject(
    realm: EngineRealm,
    prototype: EngineObject | null,
  ): EngineObject;
  createArray(realm: EngineRealm, values: readonly EngineValue[]): EngineObject;
  createProxy(
    realm: EngineRealm,
    target: EngineObject,
    handler: EngineProxyHandler,
  ): EngineObject;
  get(
    realm: EngineRealm,
    object: EngineObject,
    key: EnginePropertyKey,
  ): EngineResult<EngineValue>;
  ownEnumerablePropertyNames(
    realm: EngineRealm,
    object: EngineObject,
  ): EngineResult<readonly string[]>;
  hasProperty(
    realm: EngineRealm,
    object: EngineObject,
    key: EnginePropertyKey,
  ): EngineResult<boolean>;
  ownPropertyKeys(
    realm: EngineRealm,
    object: EngineObject,
  ): EngineResult<readonly EngineValue[]>;
  setPrototypeOf(
    realm: EngineRealm,
    object: EngineObject,
    prototype: EngineObject | null,
  ): EngineResult<boolean>;
  initializePrototypeOf(
    object: EngineObject,
    prototype: EngineObject | null,
  ): void;
  setForwardingTarget(object: EngineObject, target: EngineObject): void;
  createFunction(
    realm: EngineRealm,
    name: string,
    length: number,
    callback: EngineHostFunction,
  ): EngineCallable;
  createConstructor(
    realm: EngineRealm,
    name: string,
    length: number,
    callback: EngineHostFunction,
  ): EngineCallable;
  defineDataProperty(
    realm: EngineRealm,
    object: EngineObject,
    name: EnginePropertyKey,
    value: EngineValue,
    attributes: EngineDataPropertyAttributes,
  ): EngineResult<boolean>;
  initializeDataProperty(
    object: EngineObject,
    name: EnginePropertyKey,
    value: EngineValue,
    attributes: EngineDataPropertyAttributes,
  ): void;
  defineAccessorProperty(
    realm: EngineRealm,
    object: EngineObject,
    name: string,
    getter: EngineCallable | null,
    setter: EngineCallable | null,
    attributes: EnginePropertyAttributes,
  ): EngineResult<boolean>;
  initializeAccessorProperty(
    object: EngineObject,
    name: string,
    getter: EngineCallable | null,
    setter: EngineCallable | null,
    attributes: EnginePropertyAttributes,
  ): void;
  compileScript(
    realm: EngineRealm,
    source: string,
    sourceURL?: string,
  ): EngineResult<EngineScript>;
  runScript(
    realm: EngineRealm,
    script: EngineScript,
  ): EngineResult<EngineValue>;
  evaluate(realm: EngineRealm, source: string): EngineResult<EngineValue>;
  call(
    realm: EngineRealm,
    callable: EngineCallable,
    thisValue: EngineValue,
    argumentsList: readonly EngineValue[],
  ): EngineResult<EngineValue>;
  construct(
    realm: EngineRealm,
    constructor: EngineCallable,
    argumentsList: readonly EngineValue[],
  ): EngineResult<EngineObject>;
  createTypeError(realm: EngineRealm, message: string): EngineValue;
  exceptionMessage(realm: EngineRealm, value: EngineValue): string;
  isPromise(value: EngineValue): boolean;
  addPromiseRejectionTracker(tracker: EnginePromiseRejectionTracker): void;
  removePromiseRejectionTracker(tracker: EnginePromiseRejectionTracker): void;
  addJobEnqueueCallback(callback: EngineJobEnqueueCallback): void;
  removeJobEnqueueCallback(callback: EngineJobEnqueueCallback): void;
  enqueueJob(realm: EngineRealm, callback: () => void): EngineJob;
  dequeueJob(): EngineJob | null;
  jobRealm(job: EngineJob): EngineRealm | null;
  jobScript(job: EngineJob): EngineScript | null;
  runJob(job: EngineJob): EngineResult<EngineValue>;
}

export function normal<T>(value: T): EngineResult<T> {
  return { type: "normal", value };
}

export function thrown(value: EngineValue): EngineResult<never> {
  return { type: "throw", value };
}
