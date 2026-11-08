import { describe, expect, it } from "vitest";

import { normal } from "../../packages/palim/src/javascript-engine/adapter.js";
import type {
  EngineRealm,
  EngineValue,
  JavaScriptEngineAdapter,
} from "../../packages/palim/src/javascript-engine/adapter.js";
import { Engine262Adapter } from "../../packages/palim/src/javascript-engine/engine262-adapter.js";
import { RealmBindingContext } from "../../packages/palim/src/javascript-engine/realm-binding-context.js";

function evaluate(
  engine: JavaScriptEngineAdapter,
  realm: EngineRealm,
  source: string,
): EngineValue {
  const result = engine.evaluate(realm, source);
  if (result.type === "throw") {
    throw new Error(engine.exceptionMessage(realm, result.value));
  }
  return result.value;
}

describe("RealmBindingContext", () => {
  it("installs interfaces and members with Web IDL descriptors", () => {
    const engine = new Engine262Adapter();
    const realm = engine.createRealm();
    const binding = new RealmBindingContext(engine, realm);
    const prototype = engine.createObject(realm, engine.objectPrototype(realm));
    const instance = engine.createObject(realm, prototype);
    const constructor = binding.createConstructor("Example", 0, () =>
      normal(instance),
    );

    binding.installInterface("Example", constructor, prototype);
    binding.method(prototype, "echo", 1, (_thisValue, argumentsList) => {
      const value = binding.requiredString(argumentsList, 0, "echo");
      return value.type === "throw" ? value : binding.primitive(value.value);
    });
    binding.attribute(prototype, "label", () => binding.primitive("example"));

    evaluate(
      engine,
      realm,
      `
        const example = new Example();
        const method = Object.getOwnPropertyDescriptor(Example.prototype, "echo");
        const attribute = Object.getOwnPropertyDescriptor(Example.prototype, "label");
        if (
          example.echo(12) !== "12" ||
          example.label !== "example" ||
          method.value.length !== 1 ||
          !method.configurable ||
          !method.enumerable ||
          !method.writable ||
          typeof attribute.get !== "function" ||
          !attribute.configurable ||
          !attribute.enumerable
        ) {
          throw new Error("binding descriptors are invalid");
        }
      `,
    );
  });

  it("keeps conversion, callback, iterator, record, and exception work in the caller realm", () => {
    const engine = new Engine262Adapter();
    const realm = engine.createRealm();
    const binding = new RealmBindingContext(engine, realm);

    const sequenceValue = evaluate(engine, realm, '["first", 2]');
    const sequenceObject = engine.asObject(sequenceValue);
    expect(sequenceObject).not.toBeNull();
    if (sequenceObject === null) {
      return;
    }
    const sequence = binding.iterableValues(sequenceObject);
    expect(sequence.type).toBe("normal");
    if (sequence.type === "normal" && sequence.value !== null) {
      expect(
        sequence.value.map((value) => {
          const converted = binding.string(value);
          return converted.type === "normal" ? converted.value : "throw";
        }),
      ).toEqual(["first", "2"]);
    }

    const recordValue = evaluate(
      engine,
      realm,
      '({ first: 1, second: "two" })',
    );
    const recordObject = engine.asObject(recordValue);
    expect(recordObject).not.toBeNull();
    if (recordObject === null) {
      return;
    }
    const record = binding.stringRecord(recordObject, true);
    expect(record).toEqual({
      type: "normal",
      value: new Map([
        ["first", "1"],
        ["second", "two"],
      ]),
    });

    const callback = binding.requiredCallable(
      evaluate(engine, realm, "value => `called:${value}`"),
      "callback required",
    );
    expect(callback.type).toBe("normal");
    if (callback.type === "normal") {
      const result = binding.call(
        callback.value,
        engine.fromPrimitive(undefined),
        [engine.fromPrimitive("realm")],
      );
      expect(result.type).toBe("normal");
      if (result.type === "normal") {
        expect(binding.string(result.value)).toEqual({
          type: "normal",
          value: "called:realm",
        });
      }
    }

    const conversion = binding.string(
      evaluate(
        engine,
        realm,
        '({ toString() { throw new RangeError("conversion"); } })',
      ),
    );
    expect(conversion.type).toBe("throw");
    if (conversion.type === "throw") {
      binding.interfaceProperty("conversionError", conversion.value);
    }
    const typeError = binding.typeError("realm type error");
    binding.interfaceProperty("bindingTypeError", typeError.value);
    evaluate(
      engine,
      realm,
      `
        if (
          !(conversionError instanceof RangeError) ||
          conversionError.message !== "conversion" ||
          !(bindingTypeError instanceof TypeError) ||
          bindingTypeError.message !== "realm type error"
        ) {
          throw new Error("exceptions were not created in the caller realm");
        }
      `,
    );
  });
});
