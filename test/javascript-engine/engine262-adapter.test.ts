import { describe, expect, it } from "vitest";

import { normal } from "../../src/javascript-engine/adapter.js";
import type {
  EngineRealm,
  JavaScriptEngineAdapter,
} from "../../src/javascript-engine/adapter.js";
import { Engine262Adapter } from "../../src/javascript-engine/engine262-adapter.js";

function evaluate(
  engine: JavaScriptEngineAdapter,
  realm: EngineRealm,
  source: string,
): void {
  const result = engine.evaluate(realm, source);
  if (result.type === "throw") {
    throw new Error(engine.exceptionMessage(realm, result.value));
  }
}

describe("Engine262Adapter", () => {
  it("evaluates source in separate realms", () => {
    const engine = new Engine262Adapter();
    const firstRealm = engine.createRealm();
    const secondRealm = engine.createRealm();
    engine.defineDataProperty(
      engine.globalObject(firstRealm),
      "realmValue",
      engine.fromPrimitive("first"),
      { configurable: true, enumerable: true, writable: true },
    );
    engine.defineDataProperty(
      engine.globalObject(secondRealm),
      "realmValue",
      engine.fromPrimitive("second"),
      { configurable: true, enumerable: true, writable: true },
    );

    const first = engine.evaluate(firstRealm, "realmValue");
    const second = engine.evaluate(secondRealm, "realmValue");
    expect(first.type).toBe("normal");
    expect(second.type).toBe("normal");
    if (first.type === "normal" && second.type === "normal") {
      expect(engine.toString(firstRealm, first.value)).toEqual(normal("first"));
      expect(engine.toString(secondRealm, second.value)).toEqual(
        normal("second"),
      );
    }
  });

  it("calls host functions and preserves property descriptors", () => {
    const engine = new Engine262Adapter();
    const realm = engine.createRealm();
    const hostFunction = engine.createFunction(
      realm,
      "hostFunction",
      1,
      (_thisValue, argumentsList) =>
        normal(argumentsList[0] ?? engine.fromPrimitive(undefined)),
    );
    engine.defineDataProperty(
      engine.globalObject(realm),
      "hostFunction",
      hostFunction,
      { configurable: false, enumerable: false, writable: false },
    );

    evaluate(
      engine,
      realm,
      `
        if (hostFunction("value") !== "value") {
          throw new Error("host function result was not preserved");
        }
        const descriptor = Object.getOwnPropertyDescriptor(
          globalThis,
          "hostFunction",
        );
        if (
          descriptor.configurable ||
          descriptor.enumerable ||
          descriptor.writable
        ) {
          throw new Error("property descriptor was not preserved");
        }
      `,
    );
  });

  it("returns exceptions as engine values", () => {
    const engine = new Engine262Adapter();
    const realm = engine.createRealm();

    const result = engine.evaluate(realm, 'throw new TypeError("failure")');

    expect(result.type).toBe("throw");
    if (result.type === "throw") {
      expect(engine.exceptionMessage(realm, result.value)).toBe(
        "TypeError: failure",
      );
    }
  });

  it("performs Promise jobs only at an explicit checkpoint", () => {
    const engine = new Engine262Adapter();
    const realm = engine.createRealm();
    let calls = 0;
    const record = engine.createFunction(realm, "record", 0, () => {
      calls += 1;
      return normal(engine.fromPrimitive(undefined));
    });
    engine.defineDataProperty(engine.globalObject(realm), "record", record, {
      configurable: true,
      enumerable: false,
      writable: true,
    });

    evaluate(engine, realm, "Promise.resolve().then(record)");
    expect(calls).toBe(0);

    engine.performPromiseCheckpoint();
    expect(calls).toBe(1);
  });

  it("keeps forwarding global this identity while changing its target", () => {
    const engine = new Engine262Adapter();
    const realm = engine.createRealm({ forwardingGlobalThis: true });
    const globalThis = engine.globalThis(realm);
    const replacement = engine.createObject(
      realm,
      engine.objectPrototype(realm),
    );
    engine.defineDataProperty(
      replacement,
      "marker",
      engine.fromPrimitive("replacement"),
      { configurable: true, enumerable: true, writable: true },
    );

    engine.setForwardingTarget(globalThis, replacement);
    const result = engine.evaluate(realm, "globalThis.marker");

    expect(engine.globalThis(realm)).toBe(globalThis);
    expect(result.type).toBe("normal");
    if (result.type === "normal") {
      expect(engine.toString(realm, result.value)).toEqual(
        normal("replacement"),
      );
    }
  });

  it("rejects handles from another adapter instance", () => {
    const first = new Engine262Adapter();
    const second = new Engine262Adapter();
    const firstRealm = first.createRealm();
    const secondRealm = second.createRealm();

    expect(() => {
      second.defineDataProperty(
        first.globalObject(firstRealm),
        "value",
        second.fromPrimitive(1),
        { configurable: true, enumerable: true, writable: true },
      );
    }).toThrow("another engine adapter");
    expect(() => second.globalObject(firstRealm)).toThrow(
      "another engine adapter",
    );
    expect(second.globalObject(secondRealm)).toBeDefined();
  });
});
