import { FORWARD_PROXY_TRAP, normal } from "./adapter.js";
import type {
  EngineObject,
  EngineProxyHandler,
  EngineResult,
  EngineValue,
} from "./adapter.js";
import type { RealmBindingContext } from "./realm-binding-context.js";

type LegacyPlatformValue =
  object | undefined | null | boolean | string | number;

export interface DOMLegacyPlatformObjectConfiguration {
  readonly indexedLength?: () => number;
  readonly indexedValue?: (index: number) => LegacyPlatformValue;
  readonly namedNames?: () => readonly string[];
  readonly namedValue?: (name: string) => LegacyPlatformValue;
  readonly namedSet?: (
    name: string,
    value: string,
  ) => EngineResult<EngineValue>;
  readonly namedDelete?: (name: string) => void;
  readonly namedEnumerable?: boolean;
  readonly namedIncludesIndices?: boolean;
  readonly namedWritable?: boolean;
  readonly overrideBuiltins?: boolean;
}

export function createDOMLegacyPlatformObject(
  context: RealmBindingContext,
  target: EngineObject,
  configuration: DOMLegacyPlatformObjectConfiguration,
  wrap: (value: object) => EngineObject,
): EngineObject {
  const { engine, realm } = context;
  const proxyReference: { value?: EngineObject } = {};

  const indexedNames = (): string[] =>
    configuration.indexedLength === undefined
      ? []
      : Array.from({ length: configuration.indexedLength() }, (_value, index) =>
          String(index),
        );
  const namedNames = (): readonly string[] =>
    configuration.namedNames?.() ?? [];
  const hasIndex = (property: string | null): boolean =>
    property !== null &&
    isArrayIndex(property) &&
    indexedNames().includes(property);
  const hasName = (property: string | null): EngineResult<boolean> => {
    if (
      property === null ||
      (isArrayIndex(property) && !configuration.namedIncludesIndices) ||
      !namedNames().includes(property)
    ) {
      return normal(false);
    }
    if (configuration.overrideBuiltins) {
      return normal(true);
    }
    const inherited = engine.hasProperty(realm, target, property);
    return inherited.type === "throw" ? inherited : normal(!inherited.value);
  };
  const propertyName = (
    argumentsList: readonly EngineValue[],
  ): string | null =>
    argumentsList[1] === undefined ? null : engine.asString(argumentsList[1]);
  const value = (item: LegacyPlatformValue): EngineResult<EngineValue> =>
    typeof item === "object" && item !== null
      ? normal(wrap(item))
      : context.primitive(item);
  const canOverride = (property: string): EngineResult<boolean> => {
    if (configuration.overrideBuiltins) {
      return normal(true);
    }
    const inherited = engine.hasProperty(realm, target, property);
    return inherited.type === "throw" ? inherited : normal(!inherited.value);
  };

  const handler: EngineProxyHandler = {
    get: (argumentsList) => {
      const property = propertyName(argumentsList);
      if (hasIndex(property)) {
        return value(configuration.indexedValue?.(Number(property)));
      }
      const named = hasName(property);
      if (named.type === "throw") {
        return named;
      }
      return named.value && property !== null
        ? value(configuration.namedValue?.(property))
        : FORWARD_PROXY_TRAP;
    },
    has: (argumentsList) => {
      const property = propertyName(argumentsList);
      if (hasIndex(property)) {
        return context.primitive(true);
      }
      const named = hasName(property);
      if (named.type === "throw") {
        return named;
      }
      return named.value ? context.primitive(true) : FORWARD_PROXY_TRAP;
    },
    ownKeys: () => {
      const targetKeys = engine.ownPropertyKeys(realm, target);
      if (targetKeys.type === "throw") {
        return targetKeys;
      }
      const indices = indexedNames();
      const names: string[] = [];
      for (const name of namedNames()) {
        if (
          indices.includes(name) ||
          (isArrayIndex(name) && !configuration.namedIncludesIndices) ||
          targetKeys.value.some((key) => engine.asString(key) === name)
        ) {
          continue;
        }
        const visible = canOverride(name);
        if (visible.type === "throw") {
          return visible;
        }
        if (visible.value) {
          names.push(name);
        }
      }
      const specialNames = new Set([...indices, ...names]);
      return normal(
        engine.createArray(realm, [
          ...indices.map((name) => engine.fromPrimitive(name)),
          ...names.map((name) => engine.fromPrimitive(name)),
          ...targetKeys.value.filter((key) => {
            const name = engine.asString(key);
            return name === null || !specialNames.has(name);
          }),
        ]),
      );
    },
    getOwnPropertyDescriptor: (argumentsList) => {
      const property = propertyName(argumentsList);
      if (hasIndex(property)) {
        return dataDescriptor(
          context,
          value(configuration.indexedValue?.(Number(property))),
          { writable: false, enumerable: true },
        );
      }
      const named = hasName(property);
      if (named.type === "throw") {
        return named;
      }
      return named.value && property !== null
        ? dataDescriptor(context, value(configuration.namedValue?.(property)), {
            writable:
              configuration.namedWritable ??
              configuration.namedSet !== undefined,
            enumerable: configuration.namedEnumerable ?? false,
          })
        : FORWARD_PROXY_TRAP;
    },
    set: (argumentsList) => {
      const property = propertyName(argumentsList);
      if (argumentsList[3] !== proxyReference.value || property === null) {
        return FORWARD_PROXY_TRAP;
      }
      if (isArrayIndex(property) && !configuration.namedIncludesIndices) {
        return context.primitive(false);
      }
      if (configuration.namedSet !== undefined) {
        const override = canOverride(property);
        if (override.type === "throw") {
          return override;
        }
        if (override.value) {
          const converted = context.string(
            argumentsList[2] ?? engine.fromPrimitive(undefined),
          );
          if (converted.type === "throw") {
            return converted;
          }
          const result = configuration.namedSet(property, converted.value);
          return result.type === "throw" ? result : context.primitive(true);
        }
      }
      const named = hasName(property);
      if (named.type === "throw") {
        return named;
      }
      return named.value ? context.primitive(false) : FORWARD_PROXY_TRAP;
    },
    defineProperty: (argumentsList) => {
      const property = propertyName(argumentsList);
      if (
        property === null ||
        (isArrayIndex(property) && !configuration.namedIncludesIndices)
      ) {
        return property === null
          ? FORWARD_PROXY_TRAP
          : context.primitive(false);
      }
      const named = hasName(property);
      if (named.type === "throw") {
        return named;
      }
      if (named.value) {
        return context.primitive(false);
      }
      if (configuration.namedSet !== undefined) {
        const override = canOverride(property);
        if (override.type === "throw") {
          return override;
        }
        const descriptor = engine.asObject(
          argumentsList[2] ?? engine.fromPrimitive(undefined),
        );
        if (override.value && descriptor !== null) {
          const hasValue = engine.hasProperty(realm, descriptor, "value");
          if (hasValue.type === "throw") {
            return hasValue;
          }
          if (hasValue.value) {
            const descriptorValue = engine.get(realm, descriptor, "value");
            if (descriptorValue.type === "throw") {
              return descriptorValue;
            }
            const converted = context.string(descriptorValue.value);
            if (converted.type === "throw") {
              return converted;
            }
            const result = configuration.namedSet(property, converted.value);
            return result.type === "throw" ? result : context.primitive(true);
          }
        }
      }
      return FORWARD_PROXY_TRAP;
    },
    deleteProperty: (argumentsList) => {
      const property = propertyName(argumentsList);
      if (property === null) {
        return FORWARD_PROXY_TRAP;
      }
      if (hasIndex(property)) {
        return context.primitive(false);
      }
      const named = hasName(property);
      if (named.type === "throw") {
        return named;
      }
      if (named.value && configuration.namedDelete !== undefined) {
        configuration.namedDelete(property);
        return context.primitive(true);
      }
      return named.value ? context.primitive(false) : FORWARD_PROXY_TRAP;
    },
  };
  const proxy = engine.createProxy(realm, target, handler);
  proxyReference.value = proxy;
  return proxy;
}

function isArrayIndex(property: string): boolean {
  return /^(0|[1-9]\d*)$/.test(property) && Number(property) < 4_294_967_295;
}

function dataDescriptor(
  context: RealmBindingContext,
  value: EngineResult<EngineValue>,
  attributes: { writable: boolean; enumerable: boolean },
): EngineResult<EngineValue> {
  if (value.type === "throw") {
    return value;
  }
  const descriptor = context.engine.createObject(
    context.realm,
    context.engine.objectPrototype(context.realm),
  );
  for (const [name, item] of [
    ["value", value.value],
    ["writable", context.engine.fromPrimitive(attributes.writable)],
    ["enumerable", context.engine.fromPrimitive(attributes.enumerable)],
    ["configurable", context.engine.fromPrimitive(true)],
  ] as const) {
    context.dataProperty(descriptor, name, item);
  }
  return normal(descriptor);
}
