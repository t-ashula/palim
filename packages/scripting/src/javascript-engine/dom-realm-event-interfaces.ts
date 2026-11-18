import { eventImplementation, FocusEvent, MouseEvent } from "@palim/core";

import { normal, thrown } from "./adapter.js";
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
  binding.attribute(binding.abortSignalPrototype, "reason", (thisValue) => {
    const signal = binding.abortSignal(thisValue);
    if (signal === null) {
      return binding.typeError("Invalid AbortSignal receiver");
    }
    return normal(
      binding.abortSignalReasons.get(signal) ??
        binding.engine.fromPrimitive(undefined),
    );
  });
  binding.method(
    binding.abortSignalPrototype,
    "throwIfAborted",
    0,
    (thisValue) => {
      const signal = binding.abortSignal(thisValue);
      if (signal === null) {
        return binding.typeError("Invalid AbortSignal receiver");
      }
      if (!signal.aborted) {
        return binding.undefined();
      }
      return thrown(
        binding.abortSignalReasons.get(signal) ??
          binding.engine.fromPrimitive(undefined),
      );
    },
  );
  binding.attribute(binding.abortControllerPrototype, "signal", (thisValue) => {
    const controller = binding.abortController(thisValue);
    return controller === null
      ? binding.typeError("Invalid AbortController receiver")
      : binding.platformValue(controller.signal);
  });
  binding.method(
    binding.abortControllerPrototype,
    "abort",
    1,
    (thisValue, argumentsList) => {
      const controller = binding.abortController(thisValue);
      if (controller === null) {
        return binding.typeError("Invalid AbortController receiver");
      }
      if (controller.signal.aborted) {
        return binding.undefined();
      }
      const reason =
        argumentsList.length === 0
          ? binding.createDOMException(
              "This operation was aborted",
              "AbortError",
            )
          : argumentsList[0];
      if (reason === undefined) {
        return binding.typeError("Missing abort reason");
      }
      binding.abortSignalReasons.set(controller.signal, reason);
      controller.abort();
      return binding.undefined();
    },
  );
}

export function installEventMembers(binding: DOMRealmBindingContext): void {
  binding.method(binding.eventPrototype, "composedPath", 0, (thisValue) => {
    const event = binding.event(thisValue);
    if (event === null) {
      return binding.typeError("Invalid Event receiver");
    }
    return normal(
      binding.engine.createArray(
        binding.realm,
        event.composedPath().map((target) => binding.platformObject(target)),
      ),
    );
  });
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
  binding.attribute(
    binding.focusEventPrototype,
    "relatedTarget",
    (thisValue) => {
      const event = binding.event(thisValue);
      return !(event instanceof FocusEvent)
        ? binding.typeError("Invalid FocusEvent receiver")
        : binding.platformValue(event.relatedTarget);
    },
  );
  binding.attribute(binding.mouseEventPrototype, "view", (thisValue) => {
    const event = binding.event(thisValue);
    if (!(event instanceof MouseEvent)) {
      return binding.typeError("Invalid MouseEvent receiver");
    }
    return normal(
      binding.mouseEventViews.get(event) ?? binding.engine.fromPrimitive(null),
    );
  });
  for (const name of [
    "detail",
    "screenX",
    "screenY",
    "clientX",
    "clientY",
    "button",
    "buttons",
  ] as const) {
    binding.attribute(binding.mouseEventPrototype, name, (thisValue) => {
      const event = binding.event(thisValue);
      return !(event instanceof MouseEvent)
        ? binding.typeError("Invalid MouseEvent receiver")
        : binding.primitive(event[name]);
    });
  }
  for (const name of ["ctrlKey", "shiftKey", "altKey", "metaKey"] as const) {
    binding.attribute(binding.mouseEventPrototype, name, (thisValue) => {
      const event = binding.event(thisValue);
      return !(event instanceof MouseEvent)
        ? binding.typeError("Invalid MouseEvent receiver")
        : binding.primitive(event[name]);
    });
  }
  binding.attribute(
    binding.mouseEventPrototype,
    "relatedTarget",
    (thisValue) => {
      const event = binding.event(thisValue);
      return !(event instanceof MouseEvent)
        ? binding.typeError("Invalid MouseEvent receiver")
        : binding.platformValue(event.relatedTarget);
    },
  );
  binding.method(
    binding.mouseEventPrototype,
    "getModifierState",
    1,
    (thisValue, argumentsList) => {
      const event = binding.event(thisValue);
      if (!(event instanceof MouseEvent)) {
        return binding.typeError("Invalid MouseEvent receiver");
      }
      const keyArg = binding.stringArgument(
        argumentsList,
        0,
        "getModifierState",
      );
      return keyArg.type === "throw"
        ? keyArg
        : binding.primitive(event.getModifierState(keyArg.value));
    },
  );
  binding.method(
    binding.mouseEventPrototype,
    "initMouseEvent",
    1,
    (thisValue, argumentsList) => {
      const event = binding.event(thisValue);
      if (!(event instanceof MouseEvent)) {
        return binding.typeError("Invalid MouseEvent receiver");
      }
      const type = binding.stringArgument(argumentsList, 0, "initMouseEvent");
      if (type.type === "throw") {
        return type;
      }
      const numbers = [];
      for (const [index, bits, signed] of [
        [4, 32, true],
        [5, 32, true],
        [6, 32, true],
        [7, 32, true],
        [8, 32, true],
        [13, 16, true],
      ] as const) {
        const converted = binding.integer(argumentsList[index], bits, signed);
        if (converted.type === "throw") {
          return converted;
        }
        numbers.push(converted.value);
      }
      const relatedTargetValue = argumentsList[14];
      const relatedTarget =
        relatedTargetValue === undefined ||
        binding.engine.isNull(relatedTargetValue) ||
        binding.engine.isUndefined(relatedTargetValue)
          ? null
          : binding.eventTarget(relatedTargetValue);
      if (
        relatedTarget === null &&
        relatedTargetValue !== undefined &&
        !binding.engine.isNull(relatedTargetValue) &&
        !binding.engine.isUndefined(relatedTargetValue)
      ) {
        return binding.typeError(
          "initMouseEvent relatedTarget is not an EventTarget",
        );
      }
      const view =
        argumentsList[3] === undefined ||
        binding.engine.isUndefined(argumentsList[3])
          ? binding.engine.fromPrimitive(null)
          : argumentsList[3];
      event.initMouseEvent(
        type.value,
        argumentsList[1] === undefined
          ? false
          : binding.engine.toBoolean(argumentsList[1]),
        argumentsList[2] === undefined
          ? false
          : binding.engine.toBoolean(argumentsList[2]),
        null,
        numbers[0],
        numbers[1],
        numbers[2],
        numbers[3],
        numbers[4],
        argumentsList[9] === undefined
          ? false
          : binding.engine.toBoolean(argumentsList[9]),
        argumentsList[10] === undefined
          ? false
          : binding.engine.toBoolean(argumentsList[10]),
        argumentsList[11] === undefined
          ? false
          : binding.engine.toBoolean(argumentsList[11]),
        argumentsList[12] === undefined
          ? false
          : binding.engine.toBoolean(argumentsList[12]),
        numbers[5],
        relatedTarget,
      );
      binding.mouseEventViews.set(event, view);
      return binding.undefined();
    },
  );
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
  binding.attribute(binding.messageEventPrototype, "data", (thisValue) => {
    const event = binding.messageEvent(thisValue);
    if (event === null) {
      return binding.typeError("Invalid MessageEvent receiver for data");
    }
    return normal(
      binding.messageEventData.get(event) ??
        binding.engine.fromPrimitive(undefined),
    );
  });
  for (const name of ["origin", "lastEventId"] as const) {
    binding.attribute(binding.messageEventPrototype, name, (thisValue) => {
      const event = binding.messageEvent(thisValue);
      return event === null
        ? binding.typeError(`Invalid MessageEvent receiver for ${name}`)
        : binding.primitive(event[name]);
    });
  }
  binding.attribute(binding.messageEventPrototype, "source", (thisValue) => {
    const event = binding.messageEvent(thisValue);
    return event === null
      ? binding.typeError("Invalid MessageEvent receiver for source")
      : binding.platformValue(event.source);
  });
  binding.attribute(binding.messageEventPrototype, "ports", (thisValue) => {
    const event = binding.messageEvent(thisValue);
    return event === null
      ? binding.typeError("Invalid MessageEvent receiver for ports")
      : normal(
          binding.engine.createArray(
            binding.realm,
            event.ports.map((port) => binding.platformObject(port)),
          ),
        );
  });
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
