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

export type EngineHostFunction = (
  thisValue: EngineValue,
  argumentsList: readonly EngineValue[],
) => EngineResult<EngineValue>;

export interface JavaScriptEngineAdapter {
  createRealm(options?: EngineRealmOptions): EngineRealm;
  globalObject(realm: EngineRealm): EngineObject;
  globalThis(realm: EngineRealm): EngineObject;
  objectPrototype(realm: EngineRealm): EngineObject;
  fromPrimitive(value: EnginePrimitive): EngineValue;
  toString(realm: EngineRealm, value: EngineValue): EngineResult<string>;
  toBoolean(value: EngineValue): boolean;
  asObject(value: EngineValue): EngineObject | null;
  asCallable(value: EngineValue): EngineCallable | null;
  isNull(value: EngineValue): boolean;
  isUndefined(value: EngineValue): boolean;
  createObject(
    realm: EngineRealm,
    prototype: EngineObject | null,
  ): EngineObject;
  setPrototypeOf(object: EngineObject, prototype: EngineObject | null): void;
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
    object: EngineObject,
    name: string,
    value: EngineValue,
    attributes: EngineDataPropertyAttributes,
  ): void;
  defineAccessorProperty(
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
  createTypeError(realm: EngineRealm, message: string): EngineValue;
  exceptionMessage(realm: EngineRealm, value: EngineValue): string;
  performPromiseCheckpoint(): void;
}

export function normal<T>(value: T): EngineResult<T> {
  return { type: "normal", value };
}

export function thrown(value: EngineValue): EngineResult<never> {
  return { type: "throw", value };
}
