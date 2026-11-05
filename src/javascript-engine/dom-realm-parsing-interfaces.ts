import type { DOMParserSupportedType } from "../dom-parser.js";
import { XMLSerializer } from "../xml-serializer.js";
import { normal } from "./adapter.js";
import type { DOMRealmBindingContext } from "./dom-realm-binding-context.js";

function isDOMParserSupportedType(
  value: string,
): value is DOMParserSupportedType {
  return (
    value === "text/html" ||
    value === "text/xml" ||
    value === "application/xml" ||
    value === "application/xhtml+xml" ||
    value === "image/svg+xml"
  );
}

export function installDOMParserMembers(binding: DOMRealmBindingContext): void {
  binding.method(
    binding.domParserPrototype,
    "parseFromString",
    2,
    (thisValue, argumentsList) => {
      const object = binding.engine.asObject(thisValue);
      const parser =
        object === null ? undefined : binding.domParsers.get(object);
      if (parser === undefined) {
        return binding.typeError("Invalid DOMParser receiver");
      }
      const input = binding.stringArgument(argumentsList, 0, "parseFromString");
      if (input.type === "throw") {
        return input;
      }
      const type = binding.stringArgument(argumentsList, 1, "parseFromString");
      if (type.type === "throw") {
        return type;
      }
      if (!isDOMParserSupportedType(type.value)) {
        return binding.typeError(`Unsupported type: ${type.value}`);
      }
      return normal(
        binding.wrap(parser.parseFromString(input.value, type.value)),
      );
    },
  );
  binding.interfaceTag(binding.domParserPrototype, "DOMParser");
}

export function installXMLSerializerMembers(
  binding: DOMRealmBindingContext,
): void {
  binding.method(
    binding.xmlSerializerPrototype,
    "serializeToString",
    1,
    (thisValue, argumentsList) => {
      const object = binding.engine.asObject(thisValue);
      if (object === null || !binding.xmlSerializers.has(object)) {
        return binding.typeError("Invalid XMLSerializer receiver");
      }
      const rootValue = argumentsList[0];
      const root = rootValue === undefined ? null : binding.node(rootValue);
      if (root === null) {
        return binding.typeError("The argument is not a Node");
      }
      return binding.domOperationResult(() =>
        binding.primitive(new XMLSerializer().serializeToString(root)),
      );
    },
  );
  binding.interfaceTag(binding.xmlSerializerPrototype, "XMLSerializer");
}
