import { normal } from "./adapter.js";
import { eventImplementation } from "@palim/core/internal/dom/event-implementation.js";
import type { DOMRealmBindingContext } from "./dom-realm-binding-context.js";

export function installEventTargetMembers(
  binding: DOMRealmBindingContext,
): void {
  binding.method(
    binding.eventTargetPrototype,
    "addEventListener",
    2,
    (thisValue, argumentsList) => {
      const target = binding.eventTarget(thisValue);
      if (target === null) {
        return binding.typeError("Invalid EventTarget receiver");
      }
      const type = binding.stringArgument(argumentsList, 0, "addEventListener");
      if (type.type === "throw") {
        return type;
      }
      const options = binding.eventListenerOptions(argumentsList[2], true);
      if (options.type === "throw") {
        return options;
      }
      const callbackValue = argumentsList[1];
      if (
        callbackValue === undefined ||
        binding.engine.isNull(callbackValue) ||
        binding.engine.isUndefined(callbackValue)
      ) {
        return binding.undefined();
      }
      const callbackObject = binding.engine.asObject(callbackValue);
      if (callbackObject === null) {
        return binding.typeError("The event listener is not an object");
      }
      const signal = options.value.signal;
      const listenerOptions =
        signal === null
          ? {
              capture: options.value.capture,
              once: options.value.once,
              passive: options.value.passive,
            }
          : {
              capture: options.value.capture,
              once: options.value.once,
              passive: options.value.passive,
              signal,
            };
      const listener = binding.eventListener(target, callbackObject);
      if (listener.type === "throw") {
        return listener;
      }
      target.addEventListener(type.value, listener.value, listenerOptions);
      return binding.undefined();
    },
  );
  binding.method(
    binding.eventTargetPrototype,
    "removeEventListener",
    2,
    (thisValue, argumentsList) => {
      const target = binding.eventTarget(thisValue);
      if (target === null) {
        return binding.typeError("Invalid EventTarget receiver");
      }
      const type = binding.stringArgument(
        argumentsList,
        0,
        "removeEventListener",
      );
      if (type.type === "throw") {
        return type;
      }
      const callbackValue = argumentsList[1];
      if (
        callbackValue === undefined ||
        binding.engine.isNull(callbackValue) ||
        binding.engine.isUndefined(callbackValue)
      ) {
        return binding.undefined();
      }
      const callbackObject = binding.engine.asObject(callbackValue);
      const listener =
        callbackObject === null
          ? undefined
          : binding.listeners.get(target)?.get(callbackObject);
      if (listener !== undefined) {
        const options = binding.eventListenerOptions(argumentsList[2], false);
        if (options.type === "throw") {
          return options;
        }
        target.removeEventListener(type.value, listener, options.value);
      }
      return binding.undefined();
    },
  );
  binding.method(
    binding.eventTargetPrototype,
    "dispatchEvent",
    1,
    (thisValue, argumentsList) => {
      const target = binding.eventTarget(thisValue);
      if (target === null) {
        return binding.typeError("Invalid EventTarget receiver");
      }
      const eventValue = argumentsList[0];
      const event = eventValue === undefined ? null : binding.event(eventValue);
      if (event === null) {
        return binding.typeError("The argument is not an Event");
      }
      return binding.domOperationResult(() =>
        binding.primitive(binding.dispatchEvent(target, event)),
      );
    },
  );
}

export function installAbortMembers(binding: DOMRealmBindingContext): void {
  binding.attribute(binding.abortSignalPrototype, "aborted", (thisValue) => {
    const signal = binding.abortSignal(thisValue);
    return signal === null
      ? binding.typeError("Invalid AbortSignal receiver")
      : binding.primitive(signal.aborted);
  });
  binding.attribute(binding.abortControllerPrototype, "signal", (thisValue) => {
    const controller = binding.abortController(thisValue);
    return controller === null
      ? binding.typeError("Invalid AbortController receiver")
      : binding.platformValue(controller.signal);
  });
  binding.method(binding.abortControllerPrototype, "abort", 0, (thisValue) => {
    const controller = binding.abortController(thisValue);
    if (controller === null) {
      return binding.typeError("Invalid AbortController receiver");
    }
    controller.abort();
    return binding.undefined();
  });
}

export function installEventMembers(binding: DOMRealmBindingContext): void {
  binding.attribute(binding.eventPrototype, "type", (thisValue) => {
    const event = binding.event(thisValue);
    return event === null
      ? binding.typeError("Invalid Event receiver")
      : binding.primitive(event.type);
  });
  binding.attribute(binding.eventPrototype, "currentTarget", (thisValue) => {
    const event = binding.event(thisValue);
    return event === null
      ? binding.typeError("Invalid Event receiver")
      : binding.platformValue(event.currentTarget);
  });
  for (const name of ["target", "srcElement"] as const) {
    binding.attribute(binding.eventPrototype, name, (thisValue) => {
      const event = binding.event(thisValue);
      return event === null
        ? binding.typeError("Invalid Event receiver")
        : binding.platformValue(event[name]);
    });
  }
  for (const name of ["eventPhase", "timeStamp"] as const) {
    binding.attribute(binding.eventPrototype, name, (thisValue) => {
      const event = binding.event(thisValue);
      return event === null
        ? binding.typeError("Invalid Event receiver")
        : binding.primitive(event[name]);
    });
  }
  binding.attribute(binding.eventPrototype, "isTrusted", (thisValue) => {
    const event = binding.event(thisValue);
    return event === null
      ? binding.typeError("Invalid Event receiver")
      : binding.primitive(event.isTrusted);
  });
  for (const name of [
    "bubbles",
    "cancelable",
    "composed",
    "defaultPrevented",
  ] as const) {
    binding.attribute(binding.eventPrototype, name, (thisValue) => {
      const event = binding.event(thisValue);
      return event === null
        ? binding.typeError("Invalid Event receiver")
        : binding.primitive(event[name]);
    });
  }
  binding.attribute(
    binding.eventPrototype,
    "cancelBubble",
    (thisValue) => {
      const event = binding.event(thisValue);
      return event === null
        ? binding.typeError("Invalid Event receiver")
        : binding.primitive(event.cancelBubble);
    },
    (thisValue, argumentsList) => {
      const event = binding.event(thisValue);
      if (event === null) {
        return binding.typeError("Invalid Event receiver");
      }
      event.cancelBubble = binding.engine.toBoolean(
        argumentsList[0] ?? binding.engine.fromPrimitive(undefined),
      );
      return binding.undefined();
    },
  );
  binding.attribute(
    binding.eventPrototype,
    "returnValue",
    (thisValue) => {
      const event = binding.event(thisValue);
      return event === null
        ? binding.typeError("Invalid Event receiver")
        : binding.primitive(event.returnValue);
    },
    (thisValue, argumentsList) => {
      const event = binding.event(thisValue);
      if (event === null) {
        return binding.typeError("Invalid Event receiver");
      }
      event.returnValue = binding.engine.toBoolean(
        argumentsList[0] ?? binding.engine.fromPrimitive(undefined),
      );
      return binding.undefined();
    },
  );
  for (const name of [
    "stopPropagation",
    "stopImmediatePropagation",
    "preventDefault",
  ] as const) {
    binding.method(binding.eventPrototype, name, 0, (thisValue) => {
      const event = binding.event(thisValue);
      if (event === null) {
        return binding.typeError("Invalid Event receiver");
      }
      event[name]();
      return binding.undefined();
    });
  }
  binding.method(
    binding.eventPrototype,
    "initEvent",
    1,
    (thisValue, argumentsList) => {
      const event = binding.event(thisValue);
      if (event === null) {
        return binding.typeError("Invalid Event receiver");
      }
      const type = binding.stringArgument(argumentsList, 0, "initEvent");
      if (type.type === "throw") {
        return type;
      }
      event.initEvent(
        type.value,
        argumentsList[1] === undefined
          ? false
          : binding.engine.toBoolean(argumentsList[1]),
        argumentsList[2] === undefined
          ? false
          : binding.engine.toBoolean(argumentsList[2]),
      );
      return binding.undefined();
    },
  );
  binding.attribute(binding.customEventPrototype, "detail", (thisValue) => {
    const event = binding.customEvent(thisValue);
    if (event === null) {
      return binding.typeError("Invalid CustomEvent receiver");
    }
    return normal(
      binding.customEventDetails.get(event) ??
        binding.engine.fromPrimitive(null),
    );
  });
  for (const name of ["message", "filename", "lineno", "colno"] as const) {
    binding.attribute(binding.errorEventPrototype, name, (thisValue) => {
      const event = binding.errorEvent(thisValue);
      return event === null
        ? binding.typeError(`Invalid ErrorEvent receiver for ${name}`)
        : binding.primitive(event[name]);
    });
  }
  binding.attribute(binding.errorEventPrototype, "error", (thisValue) => {
    const event = binding.errorEvent(thisValue);
    if (event === null) {
      return binding.typeError("Invalid ErrorEvent receiver for error");
    }
    return normal(
      binding.errorEventErrors.get(event) ??
        binding.engine.fromPrimitive(undefined),
    );
  });
  binding.attribute(
    binding.promiseRejectionEventPrototype,
    "promise",
    (thisValue) => {
      const event = binding.promiseRejectionEvent(thisValue);
      if (event === null) {
        return binding.typeError(
          "Invalid PromiseRejectionEvent receiver for promise",
        );
      }
      return normal(
        binding.promiseRejectionEventPromises.get(event) ??
          binding.engine.fromPrimitive(undefined),
      );
    },
  );
  binding.attribute(
    binding.promiseRejectionEventPrototype,
    "reason",
    (thisValue) => {
      const event = binding.promiseRejectionEvent(thisValue);
      if (event === null) {
        return binding.typeError(
          "Invalid PromiseRejectionEvent receiver for reason",
        );
      }
      return normal(
        binding.promiseRejectionEventReasons.get(event) ??
          binding.engine.fromPrimitive(undefined),
      );
    },
  );
  binding.method(
    binding.customEventPrototype,
    "initCustomEvent",
    1,
    (thisValue, argumentsList) => {
      const event = binding.customEvent(thisValue);
      if (event === null) {
        return binding.typeError("Invalid CustomEvent receiver");
      }
      const type = binding.stringArgument(argumentsList, 0, "initCustomEvent");
      if (type.type === "throw") {
        return type;
      }
      if (eventImplementation(event).dispatching) {
        return binding.undefined();
      }
      const detail = argumentsList[3] ?? binding.engine.fromPrimitive(null);
      event.initCustomEvent(
        type.value,
        argumentsList[1] === undefined
          ? false
          : binding.engine.toBoolean(argumentsList[1]),
        argumentsList[2] === undefined
          ? false
          : binding.engine.toBoolean(argumentsList[2]),
        detail,
      );
      binding.customEventDetails.set(event, detail);
      return binding.undefined();
    },
  );
}
