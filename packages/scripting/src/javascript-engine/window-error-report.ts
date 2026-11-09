import type { WindowErrorReport } from "@palim/window/internal/window.js";

import type {
  EngineRealm,
  EngineValue,
  JavaScriptEngineAdapter,
} from "./adapter.js";

export function windowErrorReport(
  engine: JavaScriptEngineAdapter,
  realm: EngineRealm,
  value: EngineValue,
  url: string,
): WindowErrorReport {
  const stack = exceptionStack(engine, realm, value);
  return {
    message: engine.exceptionMessage(realm, value),
    url,
    ...(stack === undefined ? {} : { stack }),
  };
}

function exceptionStack(
  engine: JavaScriptEngineAdapter,
  realm: EngineRealm,
  value: EngineValue,
): string | undefined {
  const object = engine.asObject(value);
  if (object === null) {
    return undefined;
  }
  const stack = engine.get(realm, object, "stack");
  if (stack.type === "throw" || engine.isUndefined(stack.value)) {
    return undefined;
  }
  const text = engine.toString(realm, stack.value);
  return text.type === "normal" ? text.value : undefined;
}
