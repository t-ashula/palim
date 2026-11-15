import type { CustomElementRegistry } from "@palim/core";
import {
  initializeCustomElementRegistry,
  isKnownHTMLElementLocalName,
  isValidCustomElementName,
  upgradeCustomElements,
} from "@palim/core";

import type {
  EngineCallable,
  EngineObject,
  EngineResult,
  EngineValue,
} from "./adapter.js";
import { normal, thrown } from "./adapter.js";
import type { DOMRealmBindingContext } from "./dom-realm-binding-context.js";

interface PromiseCapability {
  readonly promise: EngineObject;
  readonly resolve: EngineCallable;
  readonly reject: EngineCallable;
}

const whenDefinedMaps = new WeakMap<
  DOMRealmBindingContext,
  WeakMap<CustomElementRegistry, Map<string, PromiseCapability>>
>();
const definingRegistries = new WeakSet<CustomElementRegistry>();

export function installCustomElementRegistryMembers(
  binding: DOMRealmBindingContext,
): void {
  binding.method(
    binding.customElementRegistryPrototype,
    "define",
    2,
    (thisValue, argumentsList) => {
      const registry = binding.customElementRegistryFor(thisValue);
      if (registry === null) {
        return binding.typeError("Invalid CustomElementRegistry receiver");
      }
      const name = binding.stringArgument(
        argumentsList,
        0,
        "CustomElementRegistry.define",
      );
      if (name.type === "throw") {
        return name;
      }
      const constructor = binding.engine.asCallable(
        argumentsList[1] ?? binding.engine.fromPrimitive(undefined),
      );
      if (constructor === null) {
        return binding.typeError("Custom element constructor is not callable");
      }
      if (!isValidCustomElementName(name.value)) {
        return thrown(
          binding.createDOMException(
            "The custom element name is invalid",
            "SyntaxError",
          ),
        );
      }
      if (
        registry.definition(name.value) !== null ||
        registry.definitionForConstructor(constructor) !== null
      ) {
        return thrown(
          binding.createDOMException(
            "The custom element name or constructor is already defined",
            "NotSupportedError",
          ),
        );
      }
      if (definingRegistries.has(registry)) {
        return thrown(
          binding.createDOMException(
            "A custom element definition is already running",
            "NotSupportedError",
          ),
        );
      }
      const options = binding.engine.asObject(
        argumentsList[2] ?? binding.engine.fromPrimitive(undefined),
      );
      let localName = name.value;
      if (options !== null) {
        const extendsValue = binding.engine.get(
          binding.realm,
          options,
          "extends",
        );
        if (extendsValue.type === "throw") {
          return extendsValue;
        }
        if (!binding.engine.isUndefined(extendsValue.value)) {
          const extendsName = binding.engine.toString(
            binding.realm,
            extendsValue.value,
          );
          if (extendsName.type === "throw") {
            return extendsName;
          }
          if (
            isValidCustomElementName(extendsName.value) ||
            !isKnownHTMLElementLocalName(extendsName.value)
          ) {
            return thrown(
              binding.createDOMException(
                "The extended element is not a customizable built-in element",
                "NotSupportedError",
              ),
            );
          }
          localName = extendsName.value;
        }
      }
      definingRegistries.add(registry);
      let result: EngineResult<EngineValue>;
      try {
        result = binding.defineCustomElement(
          registry,
          name.value,
          localName,
          constructor,
        );
      } finally {
        definingRegistries.delete(registry);
      }
      if (result.type === "normal") {
        binding.upgradeCustomElementDefinition(registry, name.value);
        const capability = whenDefinedMap(binding, registry).get(name.value);
        if (capability !== undefined) {
          whenDefinedMap(binding, registry).delete(name.value);
          settle(binding, capability.resolve, constructor);
        }
      }
      return result;
    },
  );
  binding.method(
    binding.customElementRegistryPrototype,
    "get",
    1,
    (thisValue, argumentsList) => {
      const registry = binding.customElementRegistryFor(thisValue);
      if (registry === null) {
        return binding.typeError("Invalid CustomElementRegistry receiver");
      }
      const name = binding.stringArgument(
        argumentsList,
        0,
        "CustomElementRegistry.get",
      );
      if (name.type === "throw") {
        return name;
      }
      const constructor = registry.definition(name.value)?.constructorIdentity;
      return constructor === undefined
        ? binding.undefined()
        : normal(constructor as EngineValue);
    },
  );
  binding.method(
    binding.customElementRegistryPrototype,
    "getName",
    1,
    (thisValue, argumentsList) => {
      const registry = binding.customElementRegistryFor(thisValue);
      if (registry === null) {
        return binding.typeError("Invalid CustomElementRegistry receiver");
      }
      const constructor = binding.engine.asCallable(
        argumentsList[0] ?? binding.engine.fromPrimitive(undefined),
      );
      if (constructor === null) {
        return binding.typeError("Custom element constructor is not callable");
      }
      const definition = registry.definitionForConstructor(constructor);
      return binding.primitive(definition?.name ?? null);
    },
  );
  binding.method(
    binding.customElementRegistryPrototype,
    "whenDefined",
    1,
    (thisValue, argumentsList) => {
      const registry = binding.customElementRegistryFor(thisValue);
      if (registry === null) {
        return binding.typeError("Invalid CustomElementRegistry receiver");
      }
      const name = binding.stringArgument(
        argumentsList,
        0,
        "CustomElementRegistry.whenDefined",
      );
      if (name.type === "throw") {
        return name;
      }
      if (!isValidCustomElementName(name.value)) {
        const capability = createPromiseCapability(binding);
        settle(
          binding,
          capability.reject,
          binding.createDOMException(
            "The custom element name is invalid",
            "SyntaxError",
          ),
        );
        return normal(capability.promise);
      }
      const constructor = registry.definition(name.value)?.constructorIdentity;
      if (constructor !== undefined) {
        const capability = createPromiseCapability(binding);
        settle(binding, capability.resolve, constructor as EngineValue);
        return normal(capability.promise);
      }
      const map = whenDefinedMap(binding, registry);
      let capability = map.get(name.value);
      if (capability === undefined) {
        capability = createPromiseCapability(binding);
        map.set(name.value, capability);
      }
      return normal(capability.promise);
    },
  );
  binding.method(
    binding.customElementRegistryPrototype,
    "upgrade",
    1,
    (thisValue, argumentsList) => {
      const registry = binding.customElementRegistryFor(thisValue);
      if (registry === null) {
        return binding.typeError("Invalid CustomElementRegistry receiver");
      }
      const root = binding.node(
        argumentsList[0] ?? binding.engine.fromPrimitive(undefined),
      );
      if (root === null) {
        return binding.typeError(
          "CustomElementRegistry.upgrade requires a Node",
        );
      }
      upgradeCustomElements(root, registry);
      return binding.undefined();
    },
  );
  binding.method(
    binding.customElementRegistryPrototype,
    "initialize",
    1,
    (thisValue, argumentsList) => {
      const registry = binding.customElementRegistryFor(thisValue);
      if (registry === null) {
        return binding.typeError("Invalid CustomElementRegistry receiver");
      }
      const root = binding.node(
        argumentsList[0] ?? binding.engine.fromPrimitive(undefined),
      );
      if (root === null) {
        return binding.typeError(
          "CustomElementRegistry.initialize requires a Node",
        );
      }
      return binding.domOperationResult(() => {
        initializeCustomElementRegistry(registry, root);
        return binding.undefined();
      });
    },
  );
}

function whenDefinedMap(
  binding: DOMRealmBindingContext,
  registry: CustomElementRegistry,
): Map<string, PromiseCapability> {
  let registryMaps = whenDefinedMaps.get(binding);
  if (registryMaps === undefined) {
    registryMaps = new WeakMap();
    whenDefinedMaps.set(binding, registryMaps);
  }
  let map = registryMaps.get(registry);
  if (map === undefined) {
    map = new Map();
    registryMaps.set(registry, map);
  }
  return map;
}

function createPromiseCapability(
  binding: DOMRealmBindingContext,
): PromiseCapability {
  let resolve: EngineCallable | undefined;
  let reject: EngineCallable | undefined;
  const executor = binding.context.function(
    "",
    2,
    (_thisValue, argumentsList) => {
      resolve =
        binding.engine.asCallable(
          argumentsList[0] ?? binding.engine.fromPrimitive(undefined),
        ) ?? undefined;
      reject =
        binding.engine.asCallable(
          argumentsList[1] ?? binding.engine.fromPrimitive(undefined),
        ) ?? undefined;
      return binding.undefined();
    },
  );
  const promiseValue = binding.engine.get(
    binding.realm,
    binding.engine.globalObject(binding.realm),
    "Promise",
  );
  if (promiseValue.type === "throw") {
    throw new TypeError("Could not get realm Promise constructor");
  }
  const promiseConstructor = binding.engine.asCallable(promiseValue.value);
  if (promiseConstructor === null) {
    throw new TypeError("Realm Promise is not a constructor");
  }
  const promise = binding.engine.construct(binding.realm, promiseConstructor, [
    executor,
  ]);
  if (
    promise.type === "throw" ||
    resolve === undefined ||
    reject === undefined
  ) {
    throw new TypeError("Could not create realm Promise");
  }
  markPromiseHandled(binding, promise.value);
  return { promise: promise.value, resolve, reject };
}

function markPromiseHandled(
  binding: DOMRealmBindingContext,
  promise: EngineObject,
): void {
  const thenValue = binding.engine.get(binding.realm, promise, "then");
  if (thenValue.type === "throw") {
    return;
  }
  const then = binding.engine.asCallable(thenValue.value);
  if (then === null) {
    return;
  }
  binding.context.call(then, promise, [
    binding.engine.fromPrimitive(undefined),
    binding.context.function("", 0, () => binding.undefined()),
  ]);
}

function settle(
  binding: DOMRealmBindingContext,
  operation: EngineCallable,
  value: EngineValue,
): void {
  binding.context.call(operation, binding.engine.fromPrimitive(undefined), [
    value,
  ]);
}
