declare const SERVICE_TYPE: unique symbol;
declare const REALM_VALUE: unique symbol;
declare const REALM_CALLABLE: unique symbol;

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

export interface WindowRealmInstaller {
  primitive(value: RealmPrimitive): RealmValue;
  string(value: RealmValue): RealmResult<string>;
  function(
    name: string,
    length: number,
    callback: RealmHostFunction,
  ): RealmCallable;
  defineGlobal(name: string, value: RealmValue): void;
  evaluate(source: string): RealmResult<RealmValue>;
  createTypeError(message: string): RealmValue;
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
