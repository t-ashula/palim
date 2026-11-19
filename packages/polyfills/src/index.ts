declare const SERVICE_TYPE: unique symbol;
declare const REALM_VALUE: unique symbol;
declare const REALM_CALLABLE: unique symbol;
declare const REALM_OBJECT: unique symbol;
declare const WINDOW_EXTENSION: unique symbol;
declare const DEDICATED_WORKER_EXTENSION: unique symbol;
declare const SHARED_WORKER_EXTENSION: unique symbol;
declare const SERVICE_WORKER_EXTENSION: unique symbol;

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
      if (services.get(registration.key) === registration.service) {
        continue;
      }
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

export type RealmFormDataEntry =
  | { readonly name: string; readonly value: string }
  | {
      readonly name: string;
      readonly filename: string;
      readonly type: string;
      readonly bytes: Uint8Array;
    };

export interface RealmInterface {
  prototypeObject(): RealmObject;
  create(): RealmObject;
  method(name: string, length: number, callback: RealmHostFunction): void;
  attribute(
    name: string,
    getter: RealmHostFunction,
    setter?: RealmHostFunction,
  ): void;
  staticMethod(name: string, length: number, callback: RealmHostFunction): void;
  constant(name: string, value: number): void;
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
  formDataEntries(value: RealmValue): readonly RealmFormDataEntry[] | null;
  defineGlobalFunction(
    name: string,
    length: number,
    callback: RealmHostFunction,
  ): RealmCallable;
  defineInterface(
    name: string,
    length: number,
    construct: RealmHostFunction,
    parent?: "EventTarget" | RealmInterface,
  ): RealmInterface;
  initializeEventTarget(object: RealmObject): void;
  dispatchEvent(target: RealmObject, type: string): RealmResult<RealmValue>;
  createTypeError(message: string): RealmValue;
  createRangeError(message: string): RealmValue;
  createDOMException(message: string, name: string): RealmValue;
  parseJSON(value: string): RealmResult<RealmValue>;
  stringifyJSON(value: RealmValue): RealmResult<string>;
  arrayBuffer(bytes: Uint8Array): RealmResult<RealmObject>;
  documentResponse(
    bytes: Uint8Array,
    mimeType: string,
    url: string,
  ): RealmResult<RealmObject | null>;
  promise(): RealmPromiseCapability;
}

export interface WindowEnvironment {
  readonly url: string;
  readonly origin: string;
  readonly hasDocument: boolean;
  isActive(): boolean;
}

export interface WindowTaskScheduler {
  enqueue(callback: () => RealmResult<RealmValue>): void;
}

export interface WindowExtensionContext {
  readonly realm: WindowRealmInstaller;
  readonly environment: WindowEnvironment;
  readonly tasks: WindowTaskScheduler;
  readonly host: HostServices;
}

export type Extension = ((context: WindowExtensionContext) => void) & {
  readonly hostServices?: readonly HostServiceRegistration<unknown>[];
};

export type WindowExtension = Extension & {
  readonly [WINDOW_EXTENSION]: true;
};

export type DedicatedWorkerExtension = Extension & {
  readonly [DEDICATED_WORKER_EXTENSION]: true;
};

export type SharedWorkerExtension = Extension & {
  readonly [SHARED_WORKER_EXTENSION]: true;
};

export type ServiceWorkerExtension = Extension & {
  readonly [SERVICE_WORKER_EXTENSION]: true;
};

export function createWindowExtension(
  install: (context: WindowExtensionContext) => void,
  hostServices: readonly HostServiceRegistration<unknown>[] = [],
): WindowExtension {
  return Object.assign(install, { hostServices }) as WindowExtension;
}

export function createExtensionHostServices(
  extensions: readonly Extension[],
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

export { fetchPolyfill } from "./fetch.js";
export { xmlHttpRequestPolyfill } from "./xml-http-request.js";
export { hostNetworkService } from "./network.js";
export type {
  HostCancellation,
  HostNetwork,
  HostNetworkRequest,
  HostNetworkResponse,
} from "./network.js";
