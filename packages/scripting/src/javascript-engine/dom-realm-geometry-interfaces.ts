import { DOMRect, DOMRectReadOnly } from "@palim/core";

import type { EngineObject, EngineResult, EngineValue } from "./adapter.js";
import { normal } from "./adapter.js";
import type { DOMRealmBindingContext } from "./dom-realm-binding-context.js";

const DATA = { configurable: true, enumerable: true, writable: true } as const;

export function installGeometryInterfaces(
  binding: DOMRealmBindingContext,
): void {
  const readOnlyConstructor = binding.installInterface(
    "DOMRectReadOnly",
    binding.domRectReadOnlyPrototype,
    0,
    (_thisValue, argumentsList) => constructRect(binding, argumentsList, true),
  );
  const rectConstructor = binding.installInterface(
    "DOMRect",
    binding.domRectPrototype,
    0,
    (_thisValue, argumentsList) => constructRect(binding, argumentsList, false),
  );
  binding.installInterface("DOMRectList", binding.domRectListPrototype);
  installFromRect(binding, readOnlyConstructor, true);
  installFromRect(binding, rectConstructor, false);

  for (const name of [
    "x",
    "y",
    "width",
    "height",
    "top",
    "right",
    "bottom",
    "left",
  ] as const) {
    binding.attribute(binding.domRectReadOnlyPrototype, name, (thisValue) => {
      const rect = binding.domRectReadOnly(thisValue);
      return rect === null
        ? binding.typeError("Invalid DOMRectReadOnly receiver")
        : binding.primitive(rect[name]);
    });
  }
  for (const name of ["x", "y", "width", "height"] as const) {
    binding.attribute(
      binding.domRectPrototype,
      name,
      (thisValue) => {
        const rect = binding.domRect(thisValue);
        return rect === null
          ? binding.typeError("Invalid DOMRect receiver")
          : binding.primitive(rect[name]);
      },
      (thisValue, argumentsList) => {
        const rect = binding.domRect(thisValue);
        if (rect === null) {
          return binding.typeError("Invalid DOMRect receiver");
        }
        const converted = numberArgument(binding, argumentsList[0]);
        if (converted.type === "throw") {
          return converted;
        }
        rect[name] = converted.value;
        return binding.undefined();
      },
    );
  }
  for (const [prototype, name] of [
    [binding.domRectReadOnlyPrototype, "DOMRectReadOnly"],
    [binding.domRectPrototype, "DOMRect"],
    [binding.domRectListPrototype, "DOMRectList"],
  ] as const) {
    binding.interfaceTag(prototype, name);
  }

  binding.method(binding.domRectReadOnlyPrototype, "toJSON", 0, (thisValue) => {
    const rect = binding.domRectReadOnly(thisValue);
    if (rect === null) {
      return binding.typeError("Invalid DOMRectReadOnly receiver");
    }
    return normal(rectJSON(binding, rect));
  });
  binding.attribute(binding.domRectListPrototype, "length", (thisValue) => {
    const list = binding.domRectList(thisValue);
    return list === null
      ? binding.typeError("Invalid DOMRectList receiver")
      : binding.primitive(list.length);
  });
  binding.method(binding.domRectListPrototype, "item", 1, (thisValue, args) => {
    const list = binding.domRectList(thisValue);
    if (list === null) {
      return binding.typeError("Invalid DOMRectList receiver");
    }
    const converted = numberArgument(binding, args[0]);
    if (converted.type === "throw") {
      return converted;
    }
    const item = list.item(converted.value);
    return item === null ? binding.primitive(null) : normal(binding.wrap(item));
  });
  binding.installIterator(
    binding.domRectListPrototype,
    (value) => binding.domRectList(value),
    "DOMRectList",
  );
}

function constructRect(
  binding: DOMRealmBindingContext,
  args: readonly EngineValue[],
  readOnly: boolean,
): EngineResult<EngineValue> {
  const values: number[] = [];
  for (let index = 0; index < 4; index += 1) {
    const converted = numberArgument(binding, args[index]);
    if (converted.type === "throw") {
      return converted;
    }
    values.push(converted.value);
  }
  const [x = 0, y = 0, width = 0, height = 0] = values;
  return normal(
    binding.wrap(
      readOnly
        ? new DOMRectReadOnly(x, y, width, height)
        : new DOMRect(x, y, width, height),
    ),
  );
}

function numberArgument(
  binding: DOMRealmBindingContext,
  value: EngineValue | undefined,
): EngineResult<number> {
  return value === undefined || binding.engine.isUndefined(value)
    ? normal(0)
    : binding.engine.toNumber(binding.realm, value);
}

function installFromRect(
  binding: DOMRealmBindingContext,
  constructor: EngineObject,
  readOnly: boolean,
): void {
  binding.method(constructor, "fromRect", 0, (_thisValue, args) => {
    const value = args[0];
    const object = value === undefined ? null : binding.engine.asObject(value);
    const values: number[] = [];
    for (const name of ["x", "y", "width", "height"] as const) {
      if (object === null) {
        values.push(0);
        continue;
      }
      const property = binding.engine.get(binding.realm, object, name);
      if (property.type === "throw") {
        return property;
      }
      const converted = numberArgument(binding, property.value);
      if (converted.type === "throw") {
        return converted;
      }
      values.push(converted.value);
    }
    return constructRect(
      binding,
      values.map((number) => binding.engine.fromPrimitive(number)),
      readOnly,
    );
  });
}

function rectJSON(
  binding: DOMRealmBindingContext,
  rect: DOMRectReadOnly,
): EngineObject {
  const object = binding.engine.createObject(
    binding.realm,
    binding.engine.objectPrototype(binding.realm),
  );
  for (const [name, value] of Object.entries(rect.toJSON())) {
    binding.engine.initializeDataProperty(
      object,
      name,
      binding.engine.fromPrimitive(value),
      DATA,
    );
  }
  return object;
}
