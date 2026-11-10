import type { WindowErrorReport } from "@palim/window/internal/window.js";

import type {
  EngineRealm,
  EngineValue,
  JavaScriptEngineAdapter,
} from "./adapter.js";

export interface WindowErrorInformation {
  readonly message: string;
  readonly filename: string;
  readonly lineno: number;
  readonly colno: number;
  readonly stack?: string;
}

export function extractWindowErrorInformation(
  engine: JavaScriptEngineAdapter,
  realm: EngineRealm,
  value: EngineValue,
  filename: string,
): WindowErrorInformation {
  const stack = exceptionStack(engine, realm, value);
  return {
    message: engine.exceptionMessage(realm, value),
    filename,
    lineno: 0,
    colno: 0,
    ...(stack === undefined ? {} : { stack }),
  };
}

export function windowErrorReport(
  information: WindowErrorInformation,
): WindowErrorReport {
  return {
    message: information.message,
    url: information.filename,
    ...(information.stack === undefined ? {} : { stack: information.stack }),
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
