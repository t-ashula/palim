import type { DOMRealmBindingContext } from "./dom-realm-binding-context.js";

export function installCustomElementRegistryMembers(
  binding: DOMRealmBindingContext,
): void {
  binding.method(
    binding.customElementRegistryPrototype,
    "define",
    2,
    (thisValue, argumentsList) => {
      if (thisValue !== binding.customElementRegistryObject) {
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
      return binding.defineCustomElement(name.value, constructor);
    },
  );
}
