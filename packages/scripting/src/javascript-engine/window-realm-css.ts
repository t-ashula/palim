import { CSS } from "@palim/core";

import type { WindowRealmBindingContext } from "./window-realm-binding-context.js";

export function installCSS(binding: WindowRealmBindingContext): void {
  const object = binding.engine.createObject(
    binding.realm,
    binding.engine.objectPrototype(binding.realm),
  );
  binding.context.tag(object, "CSS");
  binding.context.method(object, "escape", 1, (_thisValue, argumentsList) => {
    const value = binding.context.requiredString(
      argumentsList,
      0,
      "CSS.escape",
    );
    return value.type === "throw"
      ? value
      : binding.context.primitive(CSS.escape(value.value));
  });
  binding.context.method(object, "supports", 1, (_thisValue, argumentsList) => {
    const first = binding.context.requiredString(
      argumentsList,
      0,
      "CSS.supports",
    );
    if (first.type === "throw") {
      return first;
    }
    if (argumentsList[1] === undefined) {
      return binding.context.primitive(CSS.supports(first.value));
    }
    const second = binding.context.string(argumentsList[1]);
    return second.type === "throw"
      ? second
      : binding.context.primitive(CSS.supports(first.value, second.value));
  });
  binding.context.interfaceProperty("CSS", object);
}
