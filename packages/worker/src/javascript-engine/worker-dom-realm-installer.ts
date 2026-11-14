import {
  AbortController,
  CustomEvent,
  ErrorEvent,
  Event,
  EventTarget,
  MessageEvent,
  PromiseRejectionEvent,
} from "@palim/core/internal/dom.js";
import { DOM_EXCEPTION_CONSTANTS } from "@palim/core/internal/dom-exception.js";
import { normal } from "@palim/scripting/internal/javascript-engine/adapter.js";
import type { DOMRealmBindingContext } from "@palim/scripting/internal/javascript-engine/dom-realm-binding-context.js";
import {
  installAbortMembers,
  installEventMembers,
  installEventTargetMembers,
} from "@palim/scripting/internal/javascript-engine/dom-realm-interface-installers.js";

export function installWorkerDOMRealmInterfaces(
  binding: DOMRealmBindingContext,
): void {
  installWorkerInterfaces(binding);
  installEventTargetMembers(binding);
  installAbortMembers(binding);
  installEventMembers(binding);
}

function installWorkerInterfaces(binding: DOMRealmBindingContext): void {
  binding.installInterface("EventTarget", binding.eventTargetPrototype, 0, () =>
    normal(binding.wrap(new EventTarget())),
  );
  binding.installInterface("AbortSignal", binding.abortSignalPrototype);
  binding.installInterface(
    "AbortController",
    binding.abortControllerPrototype,
    0,
    () => normal(binding.wrap(new AbortController())),
  );
  installDOMExceptionInterface(binding);
  installEventInterfaces(binding);
}

function installDOMExceptionInterface(binding: DOMRealmBindingContext): void {
  const constructor = binding.installInterface(
    "DOMException",
    binding.domExceptionPrototype,
    0,
    (_thisValue, argumentsList) => {
      const message = binding.optionalStringArgument(argumentsList[0], "");
      if (message.type === "throw") {
        return message;
      }
      const name = binding.optionalStringArgument(argumentsList[1], "Error");
      return name.type === "throw"
        ? name
        : normal(binding.createDOMException(message.value, name.value));
    },
  );
  for (const name of ["name", "message", "code"] as const) {
    binding.attribute(binding.domExceptionPrototype, name, (thisValue) => {
      const exception = binding.domExceptionState(thisValue);
      return exception === null
        ? binding.typeError(`Invalid DOMException receiver for ${name}`)
        : binding.primitive(exception[name]);
    });
  }
  for (const [name, value] of Object.entries(DOM_EXCEPTION_CONSTANTS)) {
    for (const target of [constructor, binding.domExceptionPrototype]) {
      binding.engine.initializeDataProperty(
        target,
        name,
        binding.engine.fromPrimitive(value),
        { configurable: false, enumerable: true, writable: false },
      );
    }
  }
  binding.interfaceTag(binding.domExceptionPrototype, "DOMException");
}

function installEventInterfaces(binding: DOMRealmBindingContext): void {
  const eventConstructor = binding.installInterface(
    "Event",
    binding.eventPrototype,
    1,
    (_thisValue, argumentsList) => {
      const type = binding.stringArgument(argumentsList, 0, "Event");
      if (type.type === "throw") {
        return type;
      }
      const eventInit = binding.eventInit(argumentsList[1]);
      return eventInit.type === "throw"
        ? eventInit
        : normal(binding.wrap(new Event(type.value, eventInit.value)));
    },
  );
  for (const [name, value] of [
    ["NONE", Event.NONE],
    ["CAPTURING_PHASE", Event.CAPTURING_PHASE],
    ["AT_TARGET", Event.AT_TARGET],
    ["BUBBLING_PHASE", Event.BUBBLING_PHASE],
  ] as const) {
    for (const target of [eventConstructor, binding.eventPrototype]) {
      binding.engine.initializeDataProperty(
        target,
        name,
        binding.engine.fromPrimitive(value),
        { configurable: false, enumerable: true, writable: false },
      );
    }
  }
  binding.installInterface(
    "ErrorEvent",
    binding.errorEventPrototype,
    1,
    (_thisValue, argumentsList) => {
      const type = binding.stringArgument(argumentsList, 0, "ErrorEvent");
      if (type.type === "throw") {
        return type;
      }
      const eventInit = binding.errorEventInit(argumentsList[1]);
      if (eventInit.type === "throw") {
        return eventInit;
      }
      const { error, ...hostInit } = eventInit.value;
      const event = new ErrorEvent(type.value, hostInit);
      binding.errorEventErrors.set(event, error);
      return normal(binding.wrap(event));
    },
  );
  binding.installInterface(
    "PromiseRejectionEvent",
    binding.promiseRejectionEventPrototype,
    1,
    (_thisValue, argumentsList) => {
      const type = binding.stringArgument(
        argumentsList,
        0,
        "PromiseRejectionEvent",
      );
      if (type.type === "throw") {
        return type;
      }
      const eventInit = binding.promiseRejectionEventInit(argumentsList[1]);
      if (eventInit.type === "throw") {
        return eventInit;
      }
      const { promise, reason, ...hostInit } = eventInit.value;
      const event = new PromiseRejectionEvent(type.value, {
        ...hostInit,
        promise: undefined,
        reason: undefined,
      });
      binding.promiseRejectionEventPromises.set(event, promise);
      binding.promiseRejectionEventReasons.set(event, reason);
      return normal(binding.wrap(event));
    },
  );
  binding.installInterface(
    "CustomEvent",
    binding.customEventPrototype,
    1,
    (_thisValue, argumentsList) => {
      const type = binding.stringArgument(argumentsList, 0, "CustomEvent");
      if (type.type === "throw") {
        return type;
      }
      const eventInit = binding.customEventInit(argumentsList[1]);
      if (eventInit.type === "throw") {
        return eventInit;
      }
      const event = new CustomEvent(type.value, eventInit.value);
      binding.customEventDetails.set(event, eventInit.value.detail);
      return normal(binding.wrap(event));
    },
  );
  binding.installInterface(
    "MessageEvent",
    binding.messageEventPrototype,
    1,
    (_thisValue, argumentsList) => {
      const type = binding.stringArgument(argumentsList, 0, "MessageEvent");
      if (type.type === "throw") {
        return type;
      }
      const eventInit = binding.eventInit(argumentsList[1]);
      if (eventInit.type === "throw") {
        return eventInit;
      }
      const event = new MessageEvent(type.value, eventInit.value);
      const init = binding.engine.asObject(
        argumentsList[1] ?? binding.engine.fromPrimitive(undefined),
      );
      if (init !== null) {
        const data = binding.engine.get(binding.realm, init, "data");
        if (data.type === "throw") {
          return data;
        }
        binding.messageEventData.set(event, data.value);
      }
      return normal(binding.wrap(event));
    },
  );
}
