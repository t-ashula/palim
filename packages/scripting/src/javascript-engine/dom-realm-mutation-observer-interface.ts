import type { MutationObserverInit } from "@palim/core/internal/dom.js";

import type { EngineResult, EngineValue } from "./adapter.js";
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
      if (options.value.childList !== true) {
        return binding.typeError("The childList option must be true");
      }
      observer.observe(target, options.value);
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
  const childList = binding.engine.get(binding.realm, object, "childList");
  if (childList.type === "throw") {
    return thrown(childList.value);
  }
  const subtree = binding.engine.get(binding.realm, object, "subtree");
  if (subtree.type === "throw") {
    return thrown(subtree.value);
  }
  return normal<MutationObserverInit>({
    childList: binding.engine.toBoolean(childList.value),
    subtree: binding.engine.toBoolean(subtree.value),
  });
}
