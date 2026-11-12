declare const SERVICE_TYPE: unique symbol;
declare const REALM_VALUE: unique symbol;
declare const REALM_CALLABLE: unique symbol;
declare const REALM_OBJECT: unique symbol;

export interface HostServiceKey<T> {
  readonly name: string;
  readonly [SERVICE_TYPE]?: T;
}

export interface HostServiceRegistration<T> {
  readonly key: HostServiceKey<T>;
  readonly service: T;
}

export interface HostServices {
  require<T>(key: HostServiceKey<T>): T;
}

export function createHostServiceKey<T>(name: string): HostServiceKey<T> {
  return Object.freeze({ name });
}

export function hostService<T>(
  key: HostServiceKey<T>,
  service: T,
): HostServiceRegistration<T> {
  return { key, service };
}

export function createHostServices(
  registrations: readonly HostServiceRegistration<unknown>[] = [],
): HostServices {
  const services = new Map<HostServiceKey<unknown>, unknown>();
  for (const registration of registrations) {
    if (services.has(registration.key)) {
      throw new TypeError(
        `Host service ${JSON.stringify(registration.key.name)} is registered twice`,
      );
    }
    services.set(registration.key, registration.service);
  }
  return Object.freeze({
    require<T>(key: HostServiceKey<T>): T {
      if (!services.has(key)) {
        throw new TypeError(
          `Required host service ${JSON.stringify(key.name)} is not available`,
        );
      }
      return services.get(key) as T;
    },
  });
}

export interface RealmValue {
  readonly [REALM_VALUE]: never;
}

export interface RealmCallable extends RealmValue {
  readonly [REALM_CALLABLE]: never;
}

export interface RealmObject extends RealmValue {
  readonly [REALM_OBJECT]: never;
}

export type RealmPrimitive =
  undefined | null | boolean | string | number | bigint;

export type RealmResult<T> =
  | { readonly type: "normal"; readonly value: T }
  | { readonly type: "throw"; readonly value: RealmValue };

export type RealmHostFunction = (
  thisValue: RealmValue,
  argumentsList: readonly RealmValue[],
) => RealmResult<RealmValue>;

export interface RealmPromiseCapability {
  readonly promise: RealmValue;
  resolve(value: RealmValue): RealmResult<RealmValue>;
  reject(reason: RealmValue): RealmResult<RealmValue>;
}

export interface RealmInterface {
  create(): RealmObject;
  method(name: string, length: number, callback: RealmHostFunction): void;
  attribute(
    name: string,
    getter: RealmHostFunction,
    setter?: RealmHostFunction,
  ): void;
  staticMethod(name: string, length: number, callback: RealmHostFunction): void;
  iterator(callback: RealmHostFunction): void;
}

export interface WindowRealmInstaller {
  primitive(value: RealmPrimitive): RealmValue;
  string(value: RealmValue): RealmResult<string>;
  number(value: RealmValue): RealmResult<number>;
  boolean(value: RealmValue): boolean;
  isUndefined(value: RealmValue): boolean;
  isNull(value: RealmValue): boolean;
  object(value: RealmValue): RealmObject | null;
  callable(value: RealmValue): RealmCallable | null;
  get(object: RealmObject, name: string): RealmResult<RealmValue>;
  ownEnumerablePropertyNames(
    object: RealmObject,
  ): RealmResult<readonly string[]>;
  iterableValues(
    object: RealmObject,
  ): RealmResult<readonly RealmValue[] | null>;
  array(values: readonly RealmValue[]): RealmObject;
  iterator(values: readonly RealmValue[]): RealmResult<RealmObject>;
  call(
    callable: RealmCallable,
    thisValue: RealmValue,
    argumentsList: readonly RealmValue[],
  ): RealmResult<RealmValue>;
  formDataFromURLEncoded(bytes: Uint8Array): RealmObject;
  defineGlobalFunction(
    name: string,
    length: number,
    callback: RealmHostFunction,
  ): RealmCallable;
  defineInterface(
    name: string,
    length: number,
    construct: RealmHostFunction,
  ): RealmInterface;
  createTypeError(message: string): RealmValue;
  createRangeError(message: string): RealmValue;
  parseJSON(value: string): RealmResult<RealmValue>;
  stringifyJSON(value: RealmValue): RealmResult<string>;
  arrayBuffer(bytes: Uint8Array): RealmResult<RealmObject>;
  promise(): RealmPromiseCapability;
}

export interface WindowEnvironment {
  readonly url: string;
  readonly origin: string;
  isActive(): boolean;
}

export interface WindowTaskScheduler {
  enqueue(callback: () => RealmResult<RealmValue>): void;
}

export interface WindowExtensionContext {
  readonly realm: WindowRealmInstaller;
  readonly window: WindowEnvironment;
  readonly tasks: WindowTaskScheduler;
  readonly host: HostServices;
}

export type WindowExtension = ((context: WindowExtensionContext) => void) & {
  readonly hostServices?: readonly HostServiceRegistration<unknown>[];
};

export function createWindowExtension(
  install: (context: WindowExtensionContext) => void,
  hostServices: readonly HostServiceRegistration<unknown>[] = [],
): WindowExtension {
  return Object.assign(install, { hostServices });
}

export function createExtensionHostServices(
  extensions: readonly WindowExtension[],
): HostServices {
  return createHostServices(
    extensions.flatMap((extension) => extension.hostServices ?? []),
  );
}

export function realmNormal<T>(value: T): RealmResult<T> {
  return { type: "normal", value };
}

export function realmThrow(value: RealmValue): RealmResult<never> {
  return { type: "throw", value };
}
