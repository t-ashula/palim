import type {
  EngineObject,
  EnginePrimitive,
  EngineRealm,
  EngineResult,
  EngineValue,
  JavaScriptEngineAdapter,
} from "@palim/scripting/internal/javascript-engine/adapter.js";
import {
  normal,
  thrown,
} from "@palim/scripting/internal/javascript-engine/adapter.js";

export type StructuredValueReference =
  | { readonly type: "primitive"; readonly value: EnginePrimitive }
  | { readonly type: "object"; readonly index: number };

export interface StructuredValueObject {
  readonly type: "array" | "object";
  readonly entries: readonly (readonly [string, StructuredValueReference])[];
}

export interface StructuredValue {
  readonly root: StructuredValueReference;
  readonly objects: readonly StructuredValueObject[];
}

export function serializeEngineValue(
  engine: JavaScriptEngineAdapter,
  realm: EngineRealm,
  value: EngineValue,
): EngineResult<StructuredValue> {
  const objects: StructuredValueObject[] = [];
  const references = new WeakMap<EngineObject, number>();

  const serialize = (
    current: EngineValue,
  ): EngineResult<StructuredValueReference> => {
    const primitive = engine.primitiveValue(current);
    if (primitive !== null) {
      return normal({ type: "primitive", value: primitive.value });
    }
    const object = engine.asObject(current);
    if (object === null || engine.asCallable(current) !== null) {
      return thrown(
        engine.createTypeError(realm, "The value cannot be structured cloned"),
      );
    }
    const existing = references.get(object);
    if (existing !== undefined) {
      return normal({ type: "object", index: existing });
    }
    const array = engine.isArray(realm, object);
    if (array.type === "throw") {
      return array;
    }
    const names = engine.ownEnumerablePropertyNames(realm, object);
    if (names.type === "throw") {
      return names;
    }
    const index = objects.length;
    references.set(object, index);
    const record: {
      type: "array" | "object";
      entries: (readonly [string, StructuredValueReference])[];
    } = { type: array.value ? "array" : "object", entries: [] };
    objects.push(record);
    for (const name of names.value) {
      const property = engine.get(realm, object, name);
      if (property.type === "throw") {
        return property;
      }
      const serialized = serialize(property.value);
      if (serialized.type === "throw") {
        return serialized;
      }
      record.entries.push([name, serialized.value]);
    }
    return normal({ type: "object", index });
  };

  const root = serialize(value);
  return root.type === "throw" ? root : normal({ root: root.value, objects });
}

export function deserializeEngineValue(
  engine: JavaScriptEngineAdapter,
  realm: EngineRealm,
  serialized: StructuredValue,
): EngineResult<EngineValue> {
  const objects = serialized.objects.map((record) =>
    record.type === "array"
      ? engine.createArray(realm, [])
      : engine.createObject(realm, engine.objectPrototype(realm)),
  );
  const resolve = (reference: StructuredValueReference): EngineValue =>
    reference.type === "primitive"
      ? engine.fromPrimitive(reference.value)
      : (objects[reference.index] ??
        (() => {
          throw new TypeError("Invalid structured value reference");
        })());

  for (let index = 0; index < serialized.objects.length; index += 1) {
    const target = objects[index];
    const record = serialized.objects[index];
    if (target === undefined || record === undefined) {
      throw new TypeError("Invalid structured value object");
    }
    for (const [name, reference] of record.entries) {
      const defined = engine.defineDataProperty(
        realm,
        target,
        name,
        resolve(reference),
        { configurable: true, enumerable: true, writable: true },
      );
      if (defined.type === "throw") {
        return defined;
      }
      if (!defined.value) {
        return thrown(
          engine.createTypeError(
            realm,
            `Cannot deserialize structured property ${name}`,
          ),
        );
      }
    }
  }
  return normal(resolve(serialized.root));
}
