import { Engine262Adapter } from "@palim/engine262";
import type {
  EngineRealm,
  JavaScriptEngineAdapter,
} from "@palim/scripting/internal/javascript-engine/adapter.js";
import {
  deserializeEngineValue,
  serializeEngineValue,
} from "@palim/worker/internal/javascript-engine/structured-value.js";
import { expect, it } from "vitest";

function evaluate(
  engine: JavaScriptEngineAdapter,
  realm: EngineRealm,
  source: string,
) {
  const result = engine.evaluate(realm, source);
  if (result.type === "throw") {
    throw new Error(engine.exceptionMessage(realm, result.value));
  }
  return result.value;
}

it("copies structured values between engine agents", () => {
  const sourceEngine = new Engine262Adapter();
  const sourceRealm = sourceEngine.createRealm();
  const source = evaluate(
    sourceEngine,
    sourceRealm,
    `(() => {
      const value = {
        type: "complete",
        tests: [{ name: "worker test", status: 0 }],
        properties: { explicit_timeout: true },
      };
      value.self = value;
      return value;
    })()`,
  );
  const serialized = serializeEngineValue(sourceEngine, sourceRealm, source);
  expect(serialized.type).toBe("normal");
  if (serialized.type === "throw") {
    return;
  }

  const targetEngine = new Engine262Adapter();
  const targetRealm = targetEngine.createRealm();
  const copied = deserializeEngineValue(
    targetEngine,
    targetRealm,
    serialized.value,
  );
  expect(copied.type).toBe("normal");
  if (copied.type === "throw") {
    return;
  }
  targetEngine.initializeDataProperty(
    targetEngine.globalObject(targetRealm),
    "copied",
    copied.value,
    { configurable: true, enumerable: true, writable: true },
  );

  evaluate(
    targetEngine,
    targetRealm,
    `
      if (
        copied.type !== "complete" ||
        !Array.isArray(copied.tests) ||
        copied.tests[0].name !== "worker test" ||
        copied.properties.explicit_timeout !== true ||
        copied.self !== copied
      ) {
        throw new Error("structured value was not preserved");
      }
    `,
  );
});

it("rejects callable values", () => {
  const engine = new Engine262Adapter();
  const realm = engine.createRealm();
  const value = evaluate(engine, realm, "({ callback() {} })");

  expect(serializeEngineValue(engine, realm, value).type).toBe("throw");
});
