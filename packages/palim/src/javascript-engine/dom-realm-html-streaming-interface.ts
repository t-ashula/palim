import { DOMException as HostDOMException } from "@palim/core/internal/dom-exception.js";
import { createHTMLStreamingSink } from "@palim/core/internal/dom/nodes.js";
import type {
  CharacterData,
  Element,
  HTMLParsingOptions,
  HTMLStreamingOperation,
  ShadowRoot,
} from "@palim/core/internal/dom/nodes.js";
import { WritableStreamState } from "@palim/core/internal/writable-stream-state.js";
import { normal, thrown } from "./adapter.js";
import type { EngineObject, EngineResult, EngineValue } from "./adapter.js";
import type { DOMRealmBindingContext } from "./dom-realm-binding-context.js";

interface WriterState {
  readonly stream: EngineObject;
}

const writableStates = new WeakMap<EngineObject, WritableStreamState<string>>();
const writerStates = new WeakMap<EngineObject, WriterState>();
const realmErrors = new WeakMap<WritableStreamState<string>, EngineValue>();

export function installHTMLStreamingInterfaces(
  binding: DOMRealmBindingContext,
): void {
  const writableConstructor = binding.context.createConstructor(
    "WritableStream",
    0,
    () => binding.typeError("WritableStream construction is not implemented"),
  );
  binding.context.installInterface(
    "WritableStream",
    writableConstructor,
    binding.writableStreamPrototype,
  );

  const writerConstructor = binding.context.createConstructor(
    "WritableStreamDefaultWriter",
    1,
    () =>
      binding.typeError(
        "WritableStreamDefaultWriter construction is not implemented",
      ),
  );
  binding.context.installInterface(
    "WritableStreamDefaultWriter",
    writerConstructor,
    binding.writableStreamDefaultWriterPrototype,
  );

  binding.attribute(binding.writableStreamPrototype, "locked", (thisValue) => {
    const state = writableState(binding, thisValue);
    return state === null
      ? binding.typeError("Invalid WritableStream receiver")
      : binding.primitive(state.locked);
  });
  binding.method(
    binding.writableStreamPrototype,
    "getWriter",
    0,
    (thisValue) => {
      const stream = binding.engine.asObject(thisValue);
      const state = stream === null ? null : writableStates.get(stream);
      if (stream === null || state === undefined || state === null) {
        return binding.typeError("Invalid WritableStream receiver");
      }
      if (state.locked) {
        return binding.typeError("The WritableStream is locked");
      }
      state.acquireWriter();
      const writer = binding.engine.createObject(
        binding.realm,
        binding.writableStreamDefaultWriterPrototype,
      );
      writerStates.set(writer, { stream });
      return normal(writer);
    },
  );
  binding.method(
    binding.writableStreamPrototype,
    "abort",
    1,
    (thisValue, argumentsList) => {
      const state = writableState(binding, thisValue);
      if (state === null) {
        return binding.typeError("Invalid WritableStream receiver");
      }
      if (state.locked) {
        return rejectedTypeError(binding, "The WritableStream is locked");
      }
      const reason =
        argumentsList[0] ?? binding.engine.fromPrimitive(undefined);
      if (state.status === "writable") {
        realmErrors.set(state, reason);
      }
      return streamOperation(binding, state, () => {
        state.abort(reason, true);
      });
    },
  );
  binding.method(binding.writableStreamPrototype, "close", 0, (thisValue) => {
    const state = writableState(binding, thisValue);
    if (state === null) {
      return binding.typeError("Invalid WritableStream receiver");
    }
    return streamOperation(binding, state, () => {
      state.close(true);
    });
  });

  binding.attribute(
    binding.writableStreamDefaultWriterPrototype,
    "closed",
    (thisValue) => {
      const state = stateForWriter(binding, thisValue);
      if (state === null) {
        return binding.typeError(
          "Invalid WritableStreamDefaultWriter receiver",
        );
      }
      return state.status === "errored"
        ? promise(binding, "reject", errorValue(binding, state))
        : promise(binding, "resolve", binding.engine.fromPrimitive(undefined));
    },
  );
  binding.attribute(
    binding.writableStreamDefaultWriterPrototype,
    "ready",
    (thisValue) => {
      const state = stateForWriter(binding, thisValue);
      return state === null
        ? binding.typeError("Invalid WritableStreamDefaultWriter receiver")
        : promise(binding, "resolve", binding.engine.fromPrimitive(undefined));
    },
  );
  binding.attribute(
    binding.writableStreamDefaultWriterPrototype,
    "desiredSize",
    (thisValue) => {
      const state = stateForWriter(binding, thisValue);
      return state === null
        ? binding.typeError("Invalid WritableStreamDefaultWriter receiver")
        : binding.primitive(state.desiredSize);
    },
  );
  binding.method(
    binding.writableStreamDefaultWriterPrototype,
    "write",
    1,
    (thisValue, argumentsList) => {
      const state = stateForWriter(binding, thisValue);
      if (state === null) {
        return binding.typeError(
          "Invalid WritableStreamDefaultWriter receiver",
        );
      }
      if (state.status !== "writable") {
        return state.status === "errored"
          ? promise(binding, "reject", errorValue(binding, state))
          : rejectedTypeError(binding, "The HTML stream is closed");
      }
      const converted = binding.context.string(
        argumentsList[0] ?? binding.engine.fromPrimitive(undefined),
      );
      if (converted.type === "throw") {
        state.fail(converted.value);
        realmErrors.set(state, converted.value);
        return promise(binding, "reject", converted.value);
      }
      return streamOperation(binding, state, () => {
        state.write(converted.value);
      });
    },
  );
  binding.method(
    binding.writableStreamDefaultWriterPrototype,
    "close",
    0,
    (thisValue) => {
      const state = stateForWriter(binding, thisValue);
      if (state === null) {
        return binding.typeError(
          "Invalid WritableStreamDefaultWriter receiver",
        );
      }
      return streamOperation(binding, state, () => {
        state.close();
      });
    },
  );
  binding.method(
    binding.writableStreamDefaultWriterPrototype,
    "abort",
    1,
    (thisValue, argumentsList) => {
      const state = stateForWriter(binding, thisValue);
      if (state === null) {
        return binding.typeError(
          "Invalid WritableStreamDefaultWriter receiver",
        );
      }
      const reason =
        argumentsList[0] ?? binding.engine.fromPrimitive(undefined);
      if (state.status === "writable") {
        realmErrors.set(state, reason);
      }
      return streamOperation(binding, state, () => {
        state.abort(reason);
      });
    },
  );
  binding.method(
    binding.writableStreamDefaultWriterPrototype,
    "releaseLock",
    0,
    (thisValue) => {
      const writer = binding.engine.asObject(thisValue);
      const writerState =
        writer === null ? undefined : writerStates.get(writer);
      if (writer === null || writerState === undefined) {
        return binding.typeError(
          "Invalid WritableStreamDefaultWriter receiver",
        );
      }
      const state = writableStates.get(writerState.stream);
      if (state !== undefined) {
        state.releaseWriter();
      }
      writerStates.delete(writer);
      return binding.undefined();
    },
  );

  binding.interfaceTag(binding.writableStreamPrototype, "WritableStream");
  binding.interfaceTag(
    binding.writableStreamDefaultWriterPrototype,
    "WritableStreamDefaultWriter",
  );
}

export function createRealmHTMLWritableStream(
  binding: DOMRealmBindingContext,
  receiver: Element | ShadowRoot | CharacterData,
  operation: HTMLStreamingOperation,
  options: HTMLParsingOptions,
  unsafe: boolean,
): EngineResult<EngineValue> {
  return binding.domOperationResult(() => {
    const sink = createHTMLStreamingSink(receiver, operation, options, unsafe);
    const stream = binding.engine.createObject(
      binding.realm,
      binding.writableStreamPrototype,
    );
    writableStates.set(stream, new WritableStreamState(sink));
    return normal(stream);
  });
}

function writableState(
  binding: DOMRealmBindingContext,
  value: EngineValue,
): WritableStreamState<string> | null {
  const object = binding.engine.asObject(value);
  return object === null ? null : (writableStates.get(object) ?? null);
}

function stateForWriter(
  binding: DOMRealmBindingContext,
  value: EngineValue,
): WritableStreamState<string> | null {
  const writer = binding.engine.asObject(value);
  const writerState = writer === null ? undefined : writerStates.get(writer);
  return writerState === undefined
    ? null
    : (writableStates.get(writerState.stream) ?? null);
}

function streamOperation(
  binding: DOMRealmBindingContext,
  state: WritableStreamState<string>,
  callback: () => void,
): EngineResult<EngineValue> {
  try {
    callback();
    return promise(binding, "resolve", binding.engine.fromPrimitive(undefined));
  } catch (error: unknown) {
    const value =
      error instanceof HostDOMException
        ? binding.createDOMException(error.message, error.name)
        : binding.engine.createTypeError(
            binding.realm,
            error instanceof Error ? error.message : String(error),
          );
    realmErrors.set(state, value);
    return promise(binding, "reject", value);
  }
}

function errorValue(
  binding: DOMRealmBindingContext,
  state: WritableStreamState<string>,
): EngineValue {
  const existing = realmErrors.get(state);
  if (existing !== undefined) {
    return existing;
  }
  const error = state.error;
  const value =
    error instanceof HostDOMException
      ? binding.createDOMException(error.message, error.name)
      : binding.engine.createTypeError(
          binding.realm,
          error instanceof Error ? error.message : String(error),
        );
  realmErrors.set(state, value);
  return value;
}

function rejectedTypeError(
  binding: DOMRealmBindingContext,
  message: string,
): EngineResult<EngineValue> {
  return promise(
    binding,
    "reject",
    binding.engine.createTypeError(binding.realm, message),
  );
}

function promise(
  binding: DOMRealmBindingContext,
  methodName: "resolve" | "reject",
  value: EngineValue,
): EngineResult<EngineValue> {
  const constructorResult = binding.engine.get(
    binding.realm,
    binding.engine.globalObject(binding.realm),
    "Promise",
  );
  if (constructorResult.type === "throw") {
    return constructorResult;
  }
  const constructor = binding.engine.asObject(constructorResult.value);
  if (constructor === null) {
    return thrown(
      binding.engine.createTypeError(binding.realm, "Promise is unavailable"),
    );
  }
  const methodResult = binding.engine.get(
    binding.realm,
    constructor,
    methodName,
  );
  if (methodResult.type === "throw") {
    return methodResult;
  }
  const method = binding.engine.asCallable(methodResult.value);
  if (method === null) {
    return thrown(
      binding.engine.createTypeError(
        binding.realm,
        `Promise.${methodName} is not callable`,
      ),
    );
  }
  return binding.engine.call(binding.realm, method, constructor, [value]);
}
