import {
  clearWindowTimeout,
  reportWindowConsole,
  scheduleWindowMicrotask,
  scheduleWindowTimeout,
} from "@palim/window/internal/window.js";
import type { WindowConsoleMethod } from "@palim/window/internal/window.js";
import { normal } from "./adapter.js";
import type { WindowRealmBindingContext } from "./window-realm-binding-context.js";

const CONSOLE_METHODS: readonly WindowConsoleMethod[] = [
  "assert",
  "clear",
  "count",
  "countReset",
  "debug",
  "dir",
  "dirxml",
  "error",
  "group",
  "groupCollapsed",
  "groupEnd",
  "info",
  "log",
  "table",
  "time",
  "timeEnd",
  "timeLog",
  "trace",
  "warn",
];

export function installWindowInterface(
  binding: WindowRealmBindingContext,
): void {
  const constructor = binding.context.function("Window", 0, () =>
    binding.context.typeError("Illegal constructor"),
  );
  binding.context.installInterface(
    "Window",
    constructor,
    binding.windowPrototype,
    binding.globalObject,
  );
}

export function installWindowMembers(binding: WindowRealmBindingContext): void {
  binding.attribute(
    "window",
    () => binding.dom.platformObject(binding.window.window),
    false,
  );
  binding.attribute(
    "self",
    () => binding.dom.platformObject(binding.window.self),
    true,
    true,
  );
  binding.attribute(
    "frames",
    () => binding.dom.platformObject(binding.window.frames),
    true,
    true,
  );
  binding.attribute(
    "document",
    () => binding.dom.platformObject(binding.window.document),
    false,
  );
  binding.attribute("location", () => binding.locationObject, false);
  binding.attribute(
    "top",
    () => binding.dom.platformObject(binding.window.top),
    false,
  );
  binding.attribute(
    "parent",
    () => binding.dom.platformObject(binding.window.parent),
    true,
    true,
  );
  binding.attribute(
    "frameElement",
    () =>
      binding.window.frameElement === null
        ? binding.engine.fromPrimitive(null)
        : binding.dom.platformObject(binding.window.frameElement),
    true,
  );
}

export function installLocationInterface(
  binding: WindowRealmBindingContext,
): void {
  const constructor = binding.context.function("Location", 0, () =>
    binding.context.typeError("Illegal constructor"),
  );
  binding.context.installInterface(
    "Location",
    constructor,
    binding.locationPrototype,
    binding.globalObject,
  );
}

export function installLocationMembers(
  binding: WindowRealmBindingContext,
): void {
  for (const name of ["href", "pathname", "search", "hash"] as const) {
    binding.context.attribute(binding.locationPrototype, name, (thisValue) =>
      thisValue === binding.locationObject
        ? normal(binding.engine.fromPrimitive(binding.window.location[name]))
        : binding.context.typeError("Invalid Location receiver"),
    );
  }
  binding.context.interfaceMethod(
    binding.locationPrototype,
    "toString",
    0,
    (thisValue) =>
      thisValue === binding.locationObject
        ? normal(
            binding.engine.fromPrimitive(binding.window.location.toString()),
          )
        : binding.context.typeError("Invalid Location receiver"),
  );
}

export function installTimers(binding: WindowRealmBindingContext): void {
  binding.operation("queueMicrotask", 1, (_thisValue, argumentsList) => {
    const callback = binding.context.requiredCallable(
      argumentsList[0],
      "queueMicrotask callback must be callable",
      {
        exceptionBehavior: "report",
        reportException: (value) => { binding.reportException(value); },
      },
    );
    if (callback.type === "throw") {
      return callback;
    }
    scheduleWindowMicrotask(binding.window, () => {
      binding.context.invokeCallback(
        callback.value,
        binding.engine.fromPrimitive(undefined),
        [],
      );
    });
    return binding.context.undefined();
  });
  binding.operation("setTimeout", 1, (_thisValue, argumentsList) => {
    const callback = binding.context.requiredCallable(
      argumentsList[0],
      "setTimeout callback must be callable",
      {
        exceptionBehavior: "report",
        reportException: (value) => { binding.reportException(value); },
      },
    );
    if (callback.type === "throw") {
      return callback;
    }
    const delay = binding.timerDelay(argumentsList[1]);
    if (delay.type === "throw") {
      return delay;
    }
    const id = scheduleWindowTimeout(
      binding.window,
      () => {
        binding.context.invokeCallback(
          callback.value,
          binding.globalThis,
          argumentsList.slice(2),
        );
      },
      delay.value,
    );
    return normal(binding.engine.fromPrimitive(id));
  });
  binding.operation("clearTimeout", 1, (_thisValue, argumentsList) => {
    const id = binding.timerId(argumentsList[0]);
    if (id.type === "throw") {
      return id;
    }
    clearWindowTimeout(binding.window, id.value);
    return binding.context.undefined();
  });
}

export function installConsole(binding: WindowRealmBindingContext): void {
  const consoleObject = binding.engine.createObject(
    binding.realm,
    binding.engine.objectPrototype(binding.realm),
  );
  for (const method of CONSOLE_METHODS) {
    binding.context.interfaceMethod(
      consoleObject,
      method,
      0,
      (_thisValue, argumentsList) => {
        if (
          method === "assert" &&
          argumentsList[0] !== undefined &&
          binding.engine.toBoolean(argumentsList[0])
        ) {
          return binding.context.undefined();
        }
        const values =
          method === "assert" ? argumentsList.slice(1) : argumentsList;
        reportWindowConsole(binding.window, {
          method,
          arguments: values.map((value) => binding.consoleText(value)),
        });
        return binding.context.undefined();
      },
    );
  }
  binding.context.interfaceProperty(
    "console",
    consoleObject,
    binding.globalObject,
  );
}
