import type {
  CanonicalSanitizerConfig,
  CanonicalSanitizerElement,
  CanonicalSanitizerName,
  CanonicalSanitizerPI,
} from "@palim/core/internal/dom/sanitizer.js";
import { normal } from "./adapter.js";
import type { EngineObject, EngineValue } from "./adapter.js";
import type { DOMRealmBindingContext } from "./dom-realm-binding-context.js";

const PROPERTY = {
  configurable: true,
  enumerable: true,
  writable: true,
} as const;

export function installSanitizerMembers(binding: DOMRealmBindingContext): void {
  binding.method(binding.sanitizerPrototype, "get", 0, (thisValue) => {
    const sanitizer = binding.sanitizer(thisValue);
    return sanitizer === null
      ? binding.typeError("Invalid Sanitizer receiver")
      : normal(configurationObject(binding, sanitizer.get()));
  });

  binding.method(
    binding.sanitizerPrototype,
    "allowElement",
    1,
    (thisValue, argumentsList) => {
      const sanitizer = binding.sanitizer(thisValue);
      if (sanitizer === null) {
        return binding.typeError("Invalid Sanitizer receiver");
      }
      const element = binding.sanitizerElementArgument(
        argumentsList,
        0,
        true,
        "allowElement",
      );
      return element.type === "throw"
        ? element
        : binding.primitive(sanitizer.allowElement(element.value));
    },
  );

  for (const [name, replace] of [
    ["removeElement", false],
    ["replaceElementWithChildren", true],
  ] as const) {
    binding.method(
      binding.sanitizerPrototype,
      name,
      1,
      (thisValue, argumentsList) => {
        const sanitizer = binding.sanitizer(thisValue);
        if (sanitizer === null) {
          return binding.typeError("Invalid Sanitizer receiver");
        }
        const element = binding.sanitizerElementArgument(
          argumentsList,
          0,
          false,
          name,
        );
        if (element.type === "throw") {
          return element;
        }
        const value = element.value;
        return binding.primitive(
          replace
            ? sanitizer.replaceElementWithChildren(value)
            : sanitizer.removeElement(value),
        );
      },
    );
  }

  for (const [name, allow] of [
    ["allowProcessingInstruction", true],
    ["removeProcessingInstruction", false],
  ] as const) {
    binding.method(
      binding.sanitizerPrototype,
      name,
      1,
      (thisValue, argumentsList) => {
        const sanitizer = binding.sanitizer(thisValue);
        if (sanitizer === null) {
          return binding.typeError("Invalid Sanitizer receiver");
        }
        const instruction = binding.sanitizerPIArgument(argumentsList, 0, name);
        if (instruction.type === "throw") {
          return instruction;
        }
        return binding.primitive(
          allow
            ? sanitizer.allowProcessingInstruction(instruction.value)
            : sanitizer.removeProcessingInstruction(instruction.value),
        );
      },
    );
  }

  for (const [name, allow] of [
    ["allowAttribute", true],
    ["removeAttribute", false],
  ] as const) {
    binding.method(
      binding.sanitizerPrototype,
      name,
      1,
      (thisValue, argumentsList) => {
        const sanitizer = binding.sanitizer(thisValue);
        if (sanitizer === null) {
          return binding.typeError("Invalid Sanitizer receiver");
        }
        const attribute = binding.sanitizerElementArgument(
          argumentsList,
          0,
          false,
          name,
        );
        if (attribute.type === "throw") {
          return attribute;
        }
        return binding.primitive(
          allow
            ? sanitizer.allowAttribute(attribute.value)
            : sanitizer.removeAttribute(attribute.value),
        );
      },
    );
  }

  for (const [name, setter] of [
    ["setComments", "comments"],
    ["setDataAttributes", "dataAttributes"],
    ["setJavascriptURLs", "javascriptURLs"],
  ] as const) {
    binding.method(
      binding.sanitizerPrototype,
      name,
      1,
      (thisValue, argumentsList) => {
        const sanitizer = binding.sanitizer(thisValue);
        if (sanitizer === null) {
          return binding.typeError("Invalid Sanitizer receiver");
        }
        const value = argumentsList[0];
        if (value === undefined) {
          return binding.typeError(`${name} requires 1 argument(s)`);
        }
        const converted = binding.engine.toBoolean(value);
        const changed =
          setter === "comments"
            ? sanitizer.setComments(converted)
            : setter === "dataAttributes"
              ? sanitizer.setDataAttributes(converted)
              : sanitizer.setJavascriptURLs(converted);
        return binding.primitive(changed);
      },
    );
  }

  binding.method(binding.sanitizerPrototype, "removeUnsafe", 0, (thisValue) => {
    const sanitizer = binding.sanitizer(thisValue);
    return sanitizer === null
      ? binding.typeError("Invalid Sanitizer receiver")
      : binding.primitive(sanitizer.removeUnsafe());
  });
  binding.interfaceTag(binding.sanitizerPrototype, "Sanitizer");
}

function configurationObject(
  binding: DOMRealmBindingContext,
  config: CanonicalSanitizerConfig,
): EngineObject {
  const object = createObject(binding);
  const define = (name: string, value: EngineValue): void => {
    binding.engine.initializeDataProperty(object, name, value, PROPERTY);
  };
  if (config.elements !== undefined) {
    define(
      "elements",
      array(
        binding,
        config.elements.map((value) => elementObject(binding, value)),
      ),
    );
  }
  for (const [name, values] of [
    ["removeElements", config.removeElements],
    ["replaceWithChildrenElements", config.replaceWithChildrenElements],
    ["attributes", config.attributes],
    ["removeAttributes", config.removeAttributes],
  ] as const) {
    if (values !== undefined) {
      define(
        name,
        array(
          binding,
          values.map((value) => nameObject(binding, value)),
        ),
      );
    }
  }
  for (const [name, values] of [
    ["processingInstructions", config.processingInstructions],
    ["removeProcessingInstructions", config.removeProcessingInstructions],
  ] as const) {
    if (values !== undefined) {
      define(
        name,
        array(
          binding,
          values.map((value) => piObject(binding, value)),
        ),
      );
    }
  }
  define("comments", binding.engine.fromPrimitive(config.comments));
  if (config.dataAttributes !== undefined) {
    define(
      "dataAttributes",
      binding.engine.fromPrimitive(config.dataAttributes),
    );
  }
  define("javascriptURLs", binding.engine.fromPrimitive(config.javascriptURLs));
  return object;
}

function elementObject(
  binding: DOMRealmBindingContext,
  element: CanonicalSanitizerElement,
): EngineObject {
  const object = nameObject(binding, element);
  if (element.attributes !== undefined) {
    binding.engine.initializeDataProperty(
      object,
      "attributes",
      array(
        binding,
        element.attributes.map((value) => nameObject(binding, value)),
      ),
      PROPERTY,
    );
  }
  if (element.removeAttributes !== undefined) {
    binding.engine.initializeDataProperty(
      object,
      "removeAttributes",
      array(
        binding,
        element.removeAttributes.map((value) => nameObject(binding, value)),
      ),
      PROPERTY,
    );
  }
  return object;
}

function nameObject(
  binding: DOMRealmBindingContext,
  value: CanonicalSanitizerName,
): EngineObject {
  const object = createObject(binding);
  binding.engine.initializeDataProperty(
    object,
    "name",
    binding.engine.fromPrimitive(value.name),
    PROPERTY,
  );
  binding.engine.initializeDataProperty(
    object,
    "namespace",
    binding.engine.fromPrimitive(value.namespace),
    PROPERTY,
  );
  return object;
}

function piObject(
  binding: DOMRealmBindingContext,
  value: CanonicalSanitizerPI,
): EngineObject {
  const object = createObject(binding);
  binding.engine.initializeDataProperty(
    object,
    "target",
    binding.engine.fromPrimitive(value.target),
    PROPERTY,
  );
  return object;
}

function array(
  binding: DOMRealmBindingContext,
  values: readonly EngineValue[],
): EngineObject {
  return binding.engine.createArray(binding.realm, values);
}

function createObject(binding: DOMRealmBindingContext): EngineObject {
  return binding.engine.createObject(
    binding.realm,
    binding.engine.objectPrototype(binding.realm),
  );
}
