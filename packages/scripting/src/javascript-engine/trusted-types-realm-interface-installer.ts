import type {
  TrustedHTMLParserOptions,
  TrustedTypePolicy,
  TrustedTypePolicyCallback,
  TrustedTypePolicyOptions,
} from "@palim/window";
import {
  TrustedHTML,
  TrustedScript,
  TrustedScriptURL,
  windowTrustedTypes,
} from "@palim/window";

import type { EngineObject, EngineResult, EngineValue } from "./adapter.js";
import { normal, thrown } from "./adapter.js";
import type { CallbackRecord } from "./realm-execution-runtime.js";
import type { WindowRealmBindingContext } from "./window-realm-binding-context.js";

type TrustedValue =
  TrustedHTML | TrustedScript | TrustedScriptURL | TrustedHTMLParserOptions;

interface TrustedTypesInstallationState {
  readonly binding: WindowRealmBindingContext;
  readonly policyPrototype: EngineObject;
  readonly factoryPrototype: EngineObject;
  readonly valuePrototypes: ReadonlyMap<string, EngineObject>;
  readonly policies: WeakMap<EngineObject, TrustedTypePolicy>;
  readonly policyObjects: WeakMap<TrustedTypePolicy, EngineObject>;
  readonly values: WeakMap<EngineObject, TrustedValue>;
  readonly valueObjects: WeakMap<TrustedValue, EngineObject>;
}

export function installTrustedTypesInterfaces(
  binding: WindowRealmBindingContext,
): void {
  const objectPrototype = binding.engine.objectPrototype(binding.realm);
  const policyPrototype = binding.engine.createObject(
    binding.realm,
    objectPrototype,
  );
  const factoryPrototype = binding.engine.createObject(
    binding.realm,
    objectPrototype,
  );
  const valuePrototypes = new Map<string, EngineObject>();
  const state: TrustedTypesInstallationState = {
    binding,
    policyPrototype,
    factoryPrototype,
    valuePrototypes,
    policies: new WeakMap(),
    policyObjects: new WeakMap(),
    values: new WeakMap(),
    valueObjects: new WeakMap(),
  };

  installIllegalConstructor(state, "TrustedTypePolicy", policyPrototype);
  installIllegalConstructor(
    state,
    "TrustedTypePolicyFactory",
    factoryPrototype,
  );
  for (const name of [
    "TrustedHTML",
    "TrustedScript",
    "TrustedScriptURL",
    "TrustedHTMLParserOptions",
  ]) {
    const prototype = binding.engine.createObject(
      binding.realm,
      objectPrototype,
    );
    valuePrototypes.set(name, prototype);
    installIllegalConstructor(state, name, prototype);
    if (name !== "TrustedHTMLParserOptions") {
      installTrustedValueMembers(state, name, prototype);
    }
  }
  installPolicyMembers(state);
  installFactoryMembers(state);

  const factoryObject = binding.engine.createObject(
    binding.realm,
    factoryPrototype,
  );
  binding.context.interfaceProperty("trustedTypes", factoryObject);
}

function installIllegalConstructor(
  state: TrustedTypesInstallationState,
  name: string,
  prototype: EngineObject,
): void {
  const constructor = state.binding.context.function(name, 0, () =>
    state.binding.context.typeError("Illegal constructor"),
  );
  state.binding.context.installInterface(name, constructor, prototype);
  state.binding.context.tag(prototype, name);
}

function installPolicyMembers(state: TrustedTypesInstallationState): void {
  state.binding.context.attribute(
    state.policyPrototype,
    "name",
    (thisValue) => {
      const policy = policyValue(state, thisValue);
      return policy === null
        ? state.binding.context.invalidReceiver("TrustedTypePolicy", "name")
        : state.binding.context.primitive(policy.name);
    },
  );
  for (const method of [
    "createHTML",
    "createScript",
    "createScriptURL",
    "createParserOptions",
  ] as const) {
    state.binding.context.method(
      state.policyPrototype,
      method,
      1,
      (thisValue, argumentsList) => {
        const policy = policyValue(state, thisValue);
        if (policy === null) {
          return state.binding.context.invalidReceiver(
            "TrustedTypePolicy",
            method,
          );
        }
        if (method === "createParserOptions") {
          const input =
            argumentsList[0] ??
            state.binding.engine.createObject(
              state.binding.realm,
              state.binding.engine.objectPrototype(state.binding.realm),
            );
          return wrapPolicyCompletion(
            state,
            policy.createParserOptions(input, argumentsList.slice(1)),
          );
        }
        const input = argumentsList[0];
        if (input === undefined) {
          return state.binding.context.typeError(
            `${method} requires 1 argument`,
          );
        }
        const text = state.binding.context.string(input);
        if (text.type === "throw") {
          return text;
        }
        const result = policy[method](text.value, argumentsList.slice(1));
        return wrapPolicyCompletion(state, result);
      },
    );
  }
}

function installFactoryMembers(state: TrustedTypesInstallationState): void {
  const factory = windowTrustedTypes(state.binding.window);
  state.binding.context.method(
    state.factoryPrototype,
    "createPolicy",
    2,
    (_thisValue, argumentsList) => {
      const name = state.binding.context.requiredString(
        argumentsList,
        0,
        "createPolicy",
      );
      if (name.type === "throw") {
        return name;
      }
      const options = policyOptions(state, argumentsList[1]);
      if (options.type === "throw") {
        return options;
      }
      const result = factory.createPolicy(name.value, options.value);
      return result === null
        ? state.binding.context.typeError(
            "A default Trusted Types policy already exists",
          )
        : normal(wrapPolicy(state, result));
    },
  );
  state.binding.context.attribute(
    state.factoryPrototype,
    "defaultPolicy",
    () => {
      const policy = factory.defaultPolicy;
      return normal(
        policy === null
          ? state.binding.engine.fromPrimitive(null)
          : wrapPolicy(state, policy),
      );
    },
  );
  for (const [method, name] of [
    ["isHTML", "TrustedHTML"],
    ["isScript", "TrustedScript"],
    ["isScriptURL", "TrustedScriptURL"],
    ["isHTMLParserOptions", "TrustedHTMLParserOptions"],
  ] as const) {
    state.binding.context.method(
      state.factoryPrototype,
      method,
      1,
      (_thisValue, argumentsList) => {
        const object =
          argumentsList[0] === undefined
            ? null
            : state.binding.engine.asObject(argumentsList[0]);
        const value = object === null ? undefined : state.values.get(object);
        return state.binding.context.primitive(
          value !== undefined && trustedValueName(value) === name,
        );
      },
    );
  }
}

function policyOptions(
  state: TrustedTypesInstallationState,
  value: EngineValue | undefined,
): EngineResult<TrustedTypePolicyOptions> {
  if (
    value === undefined ||
    state.binding.engine.isUndefined(value) ||
    state.binding.engine.isNull(value)
  ) {
    return normal({});
  }
  const object = state.binding.engine.asObject(value);
  if (object === null) {
    return state.binding.context.typeError("Policy options are not an object");
  }
  const callbacks: {
    createHTML?: TrustedTypePolicyCallback;
    createScript?: TrustedTypePolicyCallback;
    createScriptURL?: TrustedTypePolicyCallback;
    createParserOptions?: TrustedTypePolicyCallback;
  } = {};
  for (const name of [
    "createHTML",
    "createScript",
    "createScriptURL",
    "createParserOptions",
  ] as const) {
    const property = state.binding.engine.get(
      state.binding.realm,
      object,
      name,
    );
    if (property.type === "throw") {
      return property;
    }
    if (state.binding.engine.isUndefined(property.value)) {
      continue;
    }
    const callback = state.binding.context.requiredCallable(
      property.value,
      `${name} is not callable`,
    );
    if (callback.type === "throw") {
      return callback;
    }
    callbacks[name] = pagePolicyCallback(
      state,
      callback.value,
      name === "createParserOptions" ? "object" : "string",
    );
  }
  return normal(callbacks);
}

function pagePolicyCallback(
  state: TrustedTypesInstallationState,
  callback: CallbackRecord,
  resultType: "object" | "string",
): TrustedTypePolicyCallback {
  return (input, argumentsList) => {
    const inputValue =
      typeof input === "string"
        ? state.binding.engine.fromPrimitive(input)
        : pageRealmValue(input);
    const result = state.binding.context.invokeCallback(
      callback,
      state.binding.engine.fromPrimitive(undefined),
      [inputValue, ...argumentsList.map(pageRealmValue)],
    );
    if (result.type === "throw") {
      return { type: "throw", value: result.value };
    }
    if (resultType === "object") {
      if (
        state.binding.engine.isNull(result.value) ||
        state.binding.engine.isUndefined(result.value)
      ) {
        return { type: "normal", value: null };
      }
      const object = state.binding.engine.asObject(result.value);
      if (object !== null) {
        return { type: "normal", value: object };
      }
      const failure = state.binding.context.typeError(
        "createParserOptions must return an object",
      );
      return { type: "throw", value: failure.value };
    }
    if (
      state.binding.engine.isNull(result.value) ||
      state.binding.engine.isUndefined(result.value)
    ) {
      return { type: "normal", value: null };
    }
    const converted = state.binding.context.string(result.value);
    return converted.type === "throw"
      ? { type: "throw", value: converted.value }
      : { type: "normal", value: converted.value };
  };
}

function pageRealmValue(value: unknown): EngineValue {
  return value as EngineValue;
}

function wrapPolicy(
  state: TrustedTypesInstallationState,
  policy: TrustedTypePolicy,
): EngineObject {
  const existing = state.policyObjects.get(policy);
  if (existing !== undefined) {
    return existing;
  }
  const object = state.binding.engine.createObject(
    state.binding.realm,
    state.policyPrototype,
  );
  state.policyObjects.set(policy, object);
  state.policies.set(object, policy);
  return object;
}

function policyValue(
  state: TrustedTypesInstallationState,
  value: EngineValue,
): TrustedTypePolicy | null {
  const object = state.binding.engine.asObject(value);
  return object === null ? null : (state.policies.get(object) ?? null);
}

function wrapPolicyCompletion(
  state: TrustedTypesInstallationState,
  result:
    | ReturnType<TrustedTypePolicy["createHTML"]>
    | ReturnType<TrustedTypePolicy["createScript"]>
    | ReturnType<TrustedTypePolicy["createScriptURL"]>
    | ReturnType<TrustedTypePolicy["createParserOptions"]>,
): EngineResult<EngineValue> {
  switch (result.type) {
    case "throw":
      return thrown(pageRealmValue(result.value));
    case "missing-callback":
      return state.binding.context.typeError(
        "The policy does not define this callback",
      );
    case "invalid-parser-options":
      return state.binding.context.typeError(
        "createParserOptions returned null or undefined",
      );
    case "normal":
      return normal(wrapTrustedValue(state, result.value));
  }
}

function wrapTrustedValue(
  state: TrustedTypesInstallationState,
  value: TrustedValue,
): EngineObject {
  const existing = state.valueObjects.get(value);
  if (existing !== undefined) {
    return existing;
  }
  const prototype = state.valuePrototypes.get(trustedValueName(value));
  if (prototype === undefined) {
    throw new Error("Unknown Trusted Type value");
  }
  const object = state.binding.engine.createObject(
    state.binding.realm,
    prototype,
  );
  state.valueObjects.set(value, object);
  state.values.set(object, value);
  return object;
}

function installTrustedValueMembers(
  state: TrustedTypesInstallationState,
  name: string,
  prototype: EngineObject,
): void {
  const returnString = (thisValue: EngineValue): EngineResult<EngineValue> => {
    const object = state.binding.engine.asObject(thisValue);
    const value = object === null ? undefined : state.values.get(object);
    if (value === undefined || trustedValueName(value) !== name) {
      return state.binding.context.invalidReceiver(name, "toString");
    }
    return state.binding.context.primitive(
      typeof value.data === "string" ? value.data : "[object Object]",
    );
  };
  state.binding.context.method(prototype, "toString", 0, returnString);
  state.binding.context.method(prototype, "toJSON", 0, returnString);
}

function trustedValueName(value: TrustedValue): string {
  if (value instanceof TrustedHTML) {
    return "TrustedHTML";
  }
  if (value instanceof TrustedScript) {
    return "TrustedScript";
  }
  if (value instanceof TrustedScriptURL) {
    return "TrustedScriptURL";
  }
  return "TrustedHTMLParserOptions";
}
