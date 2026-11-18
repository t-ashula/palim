import type { MutationObserverInit } from "@palim/core";

import type { EngineObject, EngineResult, EngineValue } from "./adapter.js";
import { normal, thrown } from "./adapter.js";
import type { DOMRealmBindingContext } from "./dom-realm-binding-context.js";

export function installMutationObserverMembers(
  binding: DOMRealmBindingContext,
): void {
  binding.method(
    binding.mutationObserverPrototype,
    "observe",
    2,
    (thisValue, argumentsList) => {
      const observer = binding.mutationObserver(thisValue);
      if (observer === null) {
        return binding.typeError("Invalid MutationObserver receiver");
      }
      const target = binding.node(
        argumentsList[0] ?? binding.engine.fromPrimitive(undefined),
      );
      if (target === null) {
        return binding.typeError("MutationObserver.observe requires a Node");
      }
      const options = mutationObserverOptions(binding, argumentsList[1]);
      if (options.type === "throw") {
        return options;
      }
      try {
        observer.observe(target, options.value);
      } catch (error) {
        return binding.typeError(
          error instanceof Error ? error.message : "Invalid observer options",
        );
      }
      return binding.undefined();
    },
  );
  binding.method(
    binding.mutationObserverPrototype,
    "disconnect",
    0,
    (thisValue) => {
      const observer = binding.mutationObserver(thisValue);
      if (observer === null) {
        return binding.typeError("Invalid MutationObserver receiver");
      }
      observer.disconnect();
      return binding.undefined();
    },
  );
  binding.method(
    binding.mutationObserverPrototype,
    "takeRecords",
    0,
    (thisValue) => {
      const observer = binding.mutationObserver(thisValue);
      if (observer === null) {
        return binding.typeError("Invalid MutationObserver receiver");
      }
      return normal(
        binding.engine.createArray(
          binding.realm,
          observer.takeRecords().map((record) => binding.wrap(record)),
        ),
      );
    },
  );

  const recordAttribute = (
    name: string,
    value: (
      record: NonNullable<ReturnType<DOMRealmBindingContext["mutationRecord"]>>,
    ) => EngineValue,
  ): void => {
    binding.attribute(binding.mutationRecordPrototype, name, (thisValue) => {
      const record = binding.mutationRecord(thisValue);
      return record === null
        ? binding.typeError("Invalid MutationRecord receiver")
        : normal(value(record));
    });
  };
  recordAttribute("type", (record) =>
    binding.engine.fromPrimitive(record.type),
  );
  recordAttribute("target", (record) => binding.wrap(record.target));
  recordAttribute("addedNodes", (record) => binding.wrap(record.addedNodes));
  recordAttribute("removedNodes", (record) =>
    binding.wrap(record.removedNodes),
  );
  recordAttribute("previousSibling", (record) =>
    record.previousSibling === null
      ? binding.engine.fromPrimitive(null)
      : binding.wrap(record.previousSibling),
  );
  recordAttribute("nextSibling", (record) =>
    record.nextSibling === null
      ? binding.engine.fromPrimitive(null)
      : binding.wrap(record.nextSibling),
  );
  recordAttribute("attributeName", (record) =>
    binding.engine.fromPrimitive(record.attributeName),
  );
  recordAttribute("attributeNamespace", (record) =>
    binding.engine.fromPrimitive(record.attributeNamespace),
  );
  recordAttribute("oldValue", (record) =>
    binding.engine.fromPrimitive(record.oldValue),
  );
}

function mutationObserverOptions(
  binding: DOMRealmBindingContext,
  value: EngineValue | undefined,
): EngineResult<MutationObserverInit> {
  if (
    value === undefined ||
    binding.engine.isUndefined(value) ||
    binding.engine.isNull(value)
  ) {
    return thrown(
      binding.engine.createTypeError(
        binding.realm,
        "MutationObserver options must be an object",
      ),
    );
  }
  const object = binding.engine.asObject(value);
  if (object === null) {
    return thrown(
      binding.engine.createTypeError(
        binding.realm,
        "MutationObserver options must be an object",
      ),
    );
  }
  const attributeFilter = stringSequenceMember(
    binding,
    object,
    "attributeFilter",
  );
  if (attributeFilter.type === "throw") {
    return attributeFilter;
  }
  const attributeOldValue = booleanMember(binding, object, "attributeOldValue");
  if (attributeOldValue.type === "throw") {
    return attributeOldValue;
  }
  const attributes = booleanMember(binding, object, "attributes");
  if (attributes.type === "throw") {
    return attributes;
  }
  const characterData = booleanMember(binding, object, "characterData");
  if (characterData.type === "throw") {
    return characterData;
  }
  const characterDataOldValue = booleanMember(
    binding,
    object,
    "characterDataOldValue",
  );
  if (characterDataOldValue.type === "throw") {
    return characterDataOldValue;
  }
  const childList = booleanMember(binding, object, "childList");
  if (childList.type === "throw") {
    return childList;
  }
  const subtree = booleanMember(binding, object, "subtree");
  if (subtree.type === "throw") {
    return subtree;
  }
  return normal<MutationObserverInit>({
    ...(attributeFilter.value === undefined
      ? {}
      : { attributeFilter: attributeFilter.value }),
    ...(attributeOldValue.value === undefined
      ? {}
      : { attributeOldValue: attributeOldValue.value }),
    ...(attributes.value === undefined ? {} : { attributes: attributes.value }),
    ...(characterData.value === undefined
      ? {}
      : { characterData: characterData.value }),
    ...(characterDataOldValue.value === undefined
      ? {}
      : { characterDataOldValue: characterDataOldValue.value }),
    ...(childList.value === undefined ? {} : { childList: childList.value }),
    ...(subtree.value === undefined ? {} : { subtree: subtree.value }),
  });
}

function booleanMember(
  binding: DOMRealmBindingContext,
  object: EngineObject,
  name: string,
): EngineResult<boolean | undefined> {
  const value = binding.engine.get(binding.realm, object, name);
  if (value.type === "throw") {
    return thrown(value.value);
  }
  return normal(
    binding.engine.isUndefined(value.value)
      ? undefined
      : binding.engine.toBoolean(value.value),
  );
}

function stringSequenceMember(
  binding: DOMRealmBindingContext,
  object: EngineObject,
  name: string,
): EngineResult<readonly string[] | undefined> {
  const value = binding.engine.get(binding.realm, object, name);
  if (value.type === "throw") {
    return thrown(value.value);
  }
  if (binding.engine.isUndefined(value.value)) {
    return normal(undefined);
  }
  const sequence = binding.engine.asObject(value.value);
  if (sequence === null) {
    return thrown(
      binding.engine.createTypeError(
        binding.realm,
        `${name} must be a sequence`,
      ),
    );
  }
  const values = binding.context.iterableValues(sequence);
  if (values.type === "throw") {
    return thrown(values.value);
  }
  if (values.value === null) {
    return thrown(
      binding.engine.createTypeError(binding.realm, `${name} must be iterable`),
    );
  }
  const converted: string[] = [];
  for (const item of values.value) {
    const string = binding.engine.toString(binding.realm, item);
    if (string.type === "throw") {
      return thrown(string.value);
    }
    converted.push(string.value);
  }
  return normal(converted);
}
