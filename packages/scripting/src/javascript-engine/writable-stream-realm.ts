import type {
  EngineCallable,
  EngineObject,
  EngineResult,
  EngineValue,
} from "./adapter.js";
import { normal, thrown } from "./adapter.js";
import type { RealmBindingContext } from "./realm-binding-context.js";

interface PromiseCapability {
  readonly promise: EngineObject;
  readonly resolve: EngineCallable;
  readonly reject: EngineCallable;
  settled: boolean;
}

interface SinkAlgorithms {
  readonly object: EngineObject;
  start: EngineCallable | undefined;
  write: EngineCallable | undefined;
  close: EngineCallable | undefined;
  abort: EngineCallable | undefined;
}

interface QueueEntry {
  readonly chunk: EngineValue;
  readonly size: number;
  readonly capability: PromiseCapability;
}

interface StreamState {
  readonly binding: RealmBindingContext;
  readonly stream: EngineObject;
  readonly sink: SinkAlgorithms;
  readonly controller: EngineObject;
  readonly abortController: EngineObject;
  readonly controllerAbort: EngineCallable;
  readonly signal: EngineObject;
  readonly size: EngineCallable | undefined;
  readonly queue: QueueEntry[];
  highWaterMark: number;
  queueTotalSize: number;
  status: "writable" | "erroring" | "errored" | "closed";
  error: EngineValue;
  writer: EngineObject | undefined;
  closeRequest: PromiseCapability | undefined;
  pendingAbort: PromiseCapability | undefined;
  pendingAbortReason: EngineValue | undefined;
  abortSink: boolean;
  abortingSink: boolean;
  errorReady: PromiseCapability | undefined;
  started: boolean;
  inFlight: boolean;
  inFlightClose: boolean;
  backpressure: boolean;
}

interface WriterState {
  stream: StreamState | undefined;
  ready: PromiseCapability;
  closed: PromiseCapability;
}

export interface WritableStreamRealmInterfaces {
  readonly constructor: EngineCallable;
  readonly prototype: EngineObject;
  readonly writerPrototype: EngineObject;
}

const streamStates = new WeakMap<EngineObject, StreamState>();
const writerStates = new WeakMap<EngineObject, WriterState>();
const controllerStates = new WeakMap<EngineObject, StreamState>();
const queuingStrategyWaterMarks = new WeakMap<EngineObject, number>();
const realmInterfaces = new WeakMap<
  RealmBindingContext,
  WritableStreamRealmInterfaces
>();

export function installWritableStreamRealm(
  binding: RealmBindingContext,
): WritableStreamRealmInterfaces {
  const existing = realmInterfaces.get(binding);
  if (existing !== undefined) {
    return existing;
  }

  const prototype = binding.engine.createObject(
    binding.realm,
    binding.engine.objectPrototype(binding.realm),
  );
  const writerPrototype = binding.engine.createObject(
    binding.realm,
    binding.engine.objectPrototype(binding.realm),
  );
  const controllerPrototype = binding.engine.createObject(
    binding.realm,
    binding.engine.objectPrototype(binding.realm),
  );

  const constructor = binding.createConstructor(
    "WritableStream",
    0,
    (thisValue, argumentsList) =>
      constructStream(binding, thisValue, argumentsList),
  );
  const writerConstructor = binding.createConstructor(
    "WritableStreamDefaultWriter",
    1,
    (thisValue, argumentsList) =>
      constructWriter(binding, thisValue, argumentsList[0]),
  );
  const controllerConstructor = binding.createConstructor(
    "WritableStreamDefaultController",
    0,
    () => binding.typeError("Illegal constructor"),
  );
  binding.installInterface("WritableStream", constructor, prototype);
  binding.installInterface(
    "WritableStreamDefaultWriter",
    writerConstructor,
    writerPrototype,
  );
  installQueuingStrategies(binding);
  binding.installInterface(
    "WritableStreamDefaultController",
    controllerConstructor,
    controllerPrototype,
  );

  installStreamMembers(binding, prototype, writerPrototype);
  installWriterMembers(binding, writerPrototype);
  binding.method(
    controllerPrototype,
    "error",
    1,
    (thisValue, argumentsList) => {
      const controller = binding.engine.asObject(thisValue);
      const state =
        controller === null ? undefined : controllerStates.get(controller);
      if (state === undefined) {
        return binding.invalidReceiver(
          "WritableStreamDefaultController",
          "error",
        );
      }
      startErroring(
        state,
        argumentsList[0] ?? binding.engine.fromPrimitive(undefined),
      );
      return binding.undefined();
    },
  );
  binding.attribute(controllerPrototype, "signal", (thisValue) => {
    const controller = binding.engine.asObject(thisValue);
    const state =
      controller === null ? undefined : controllerStates.get(controller);
    return state === undefined
      ? binding.invalidReceiver("WritableStreamDefaultController", "signal")
      : normal(state.signal);
  });
  binding.tag(prototype, "WritableStream");
  binding.tag(writerPrototype, "WritableStreamDefaultWriter");
  binding.tag(controllerPrototype, "WritableStreamDefaultController");

  const result = { constructor, prototype, writerPrototype };
  realmInterfaces.set(binding, result);
  return result;
}

function installQueuingStrategies(binding: RealmBindingContext): void {
  for (const [name, size] of [
    ["CountQueuingStrategy", () => binding.primitive(1)],
    [
      "ByteLengthQueuingStrategy",
      (chunk: EngineValue) => {
        const object = binding.engine.asObject(chunk);
        if (object === null) {
          return binding.typeError("Chunk must have a byteLength");
        }
        const result = binding.engine.get(binding.realm, object, "byteLength");
        if (result.type === "throw") {
          return result;
        }
        const converted = binding.engine.toNumber(binding.realm, result.value);
        return converted.type === "throw"
          ? converted
          : binding.primitive(converted.value);
      },
    ],
  ] as const) {
    const prototype = binding.engine.createObject(
      binding.realm,
      binding.engine.objectPrototype(binding.realm),
    );
    const constructor = binding.createConstructor(
      name,
      1,
      (thisValue, argumentsList) => {
        const object = binding.engine.asObject(thisValue);
        if (object === null) {
          return binding.typeError(`Invalid ${name} receiver`);
        }
        const init = dictionary(binding, argumentsList[0], "init");
        if (init.type === "throw") {
          return init;
        }
        const highWaterMark = numberProperty(
          binding,
          init.value,
          "highWaterMark",
          Number.NaN,
        );
        if (highWaterMark.type === "throw") {
          return highWaterMark;
        }
        queuingStrategyWaterMarks.set(object, highWaterMark.value);
        return normal(object);
      },
    );
    binding.installInterface(name, constructor, prototype);
    binding.attribute(prototype, "highWaterMark", (thisValue) => {
      const object = binding.engine.asObject(thisValue);
      const value =
        object === null ? undefined : queuingStrategyWaterMarks.get(object);
      return value === undefined
        ? binding.invalidReceiver(name, "highWaterMark")
        : binding.primitive(value);
    });
    const sizeFunction = binding.function("size", 1, (_thisValue, args) =>
      size(args[0] ?? binding.engine.fromPrimitive(undefined)),
    );
    binding.attribute(prototype, "size", (thisValue) => {
      const object = binding.engine.asObject(thisValue);
      return object === null || !queuingStrategyWaterMarks.has(object)
        ? binding.invalidReceiver(name, "size")
        : normal(sizeFunction);
    });
    binding.tag(prototype, name);
  }
}

function constructStream(
  binding: RealmBindingContext,
  thisValue: EngineValue,
  argumentsList: readonly EngineValue[],
): EngineResult<EngineValue> {
  const stream = binding.engine.asObject(thisValue);
  if (stream === null) {
    return binding.typeError("Invalid WritableStream receiver");
  }
  const strategyResult = dictionary(binding, argumentsList[1], "strategy");
  if (strategyResult.type === "throw") {
    return strategyResult;
  }
  const size = optionalMethod(binding, strategyResult.value, "size");
  if (size.type === "throw") {
    return size;
  }
  const highWaterMark = numberProperty(
    binding,
    strategyResult.value,
    "highWaterMark",
    1,
  );
  if (highWaterMark.type === "throw") {
    return highWaterMark;
  }
  if (Number.isNaN(highWaterMark.value) || highWaterMark.value < 0) {
    return thrown(
      binding.engine.createRangeError(binding.realm, "Invalid highWaterMark"),
    );
  }
  const sinkResult = dictionary(binding, argumentsList[0], "underlyingSink");
  if (sinkResult.type === "throw") {
    return sinkResult;
  }
  const type = binding.engine.get(binding.realm, sinkResult.value, "type");
  if (type.type === "throw") {
    return type;
  }
  if (!binding.engine.isUndefined(type.value)) {
    return thrown(
      binding.engine.createRangeError(
        binding.realm,
        "WritableStream does not support an underlying sink type",
      ),
    );
  }
  const sink = algorithms(binding, sinkResult.value);
  if (sink.type === "throw") {
    return sink;
  }
  const controller = binding.engine.createObject(
    binding.realm,
    objectPrototype(binding, "WritableStreamDefaultController"),
  );
  const abortControllerConstructor = globalCallable(binding, "AbortController");
  const abortController = binding.engine.construct(
    binding.realm,
    abortControllerConstructor,
    [],
  );
  if (abortController.type === "throw") {
    return abortController;
  }
  const signalResult = binding.engine.get(
    binding.realm,
    abortController.value,
    "signal",
  );
  if (signalResult.type === "throw") {
    return signalResult;
  }
  const signal = binding.engine.asObject(signalResult.value);
  const controllerAbort = optionalMethod(
    binding,
    abortController.value,
    "abort",
  );
  if (
    signal === null ||
    controllerAbort.type === "throw" ||
    controllerAbort.value === undefined
  ) {
    return binding.typeError("AbortController is incomplete");
  }
  const state: StreamState = {
    binding,
    stream,
    sink: sink.value,
    controller,
    abortController: abortController.value,
    controllerAbort: controllerAbort.value,
    signal,
    size: size.value,
    queue: [],
    highWaterMark: highWaterMark.value,
    queueTotalSize: 0,
    status: "writable",
    error: binding.engine.fromPrimitive(undefined),
    writer: undefined,
    closeRequest: undefined,
    pendingAbort: undefined,
    pendingAbortReason: undefined,
    abortSink: false,
    abortingSink: false,
    errorReady: undefined,
    started: false,
    inFlight: false,
    inFlightClose: false,
    backpressure: highWaterMark.value === 0,
  };
  streamStates.set(stream, state);
  controllerStates.set(controller, state);
  const startResult = callOptional(state, sink.value.start, [controller]);
  if (startResult.type === "throw") {
    return startResult;
  }
  uponPromise(binding, startResult.value, {
    fulfilled: () => {
      state.started = true;
      const writer =
        state.writer === undefined ? undefined : writerStates.get(state.writer);
      if (writer !== undefined && !state.backpressure) {
        settle(state, writer.ready, "resolve");
      }
      if (state.status === "erroring") {
        finishErroring(state);
      } else if (state.status === "errored") {
        finishAbort(state);
      } else {
        advance(state);
      }
    },
    rejected: (reason) => {
      state.started = true;
      if (state.pendingAbort !== undefined) {
        finishErroring(state);
      } else {
        startErroring(state, reason);
      }
    },
  });
  return normal(stream);
}

function installStreamMembers(
  binding: RealmBindingContext,
  prototype: EngineObject,
  writerPrototype: EngineObject,
): void {
  binding.attribute(prototype, "locked", (thisValue) => {
    const state = streamState(binding, thisValue, "locked");
    return state.type === "throw"
      ? state
      : binding.primitive(state.value.writer !== undefined);
  });
  binding.method(prototype, "getWriter", 0, (thisValue) => {
    const state = streamState(binding, thisValue, "getWriter");
    if (state.type === "throw") {
      return state;
    }
    const writer = binding.engine.createObject(binding.realm, writerPrototype);
    return acquireWriter(state.value, writer);
  });
  binding.method(prototype, "abort", 1, (thisValue, argumentsList) => {
    const state = streamState(binding, thisValue, "abort");
    if (state.type === "throw") {
      return state;
    }
    if (state.value.writer !== undefined) {
      return rejectedTypeError(binding, "The WritableStream is locked");
    }
    return abort(
      state.value,
      argumentsList[0] ?? binding.engine.fromPrimitive(undefined),
    );
  });
  binding.method(prototype, "close", 0, (thisValue) => {
    const state = streamState(binding, thisValue, "close");
    if (state.type === "throw") {
      return state;
    }
    if (state.value.writer !== undefined) {
      return rejectedTypeError(binding, "The WritableStream is locked");
    }
    if (state.value.status === "errored") {
      return rejectedTypeError(binding, "The WritableStream is errored");
    }
    if (state.value.status === "erroring") {
      return rejected(binding, state.value.error);
    }
    const writer = binding.engine.createObject(binding.realm, writerPrototype);
    const acquired = acquireWriter(state.value, writer);
    if (acquired.type === "throw") {
      return acquired;
    }
    const writerRecord = writerStates.get(writer);
    if (writerRecord === undefined) {
      return binding.typeError("Could not acquire the WritableStream writer");
    }
    const result = closeWriter(state.value, writerRecord);
    releaseWriter(writer);
    return result;
  });
}

function installWriterMembers(
  binding: RealmBindingContext,
  prototype: EngineObject,
): void {
  binding.attribute(prototype, "closed", (value) =>
    writerCapability(binding, value, "closed"),
  );
  binding.attribute(prototype, "ready", (value) =>
    writerCapability(binding, value, "ready"),
  );
  binding.attribute(prototype, "desiredSize", (value) => {
    const writer = writerState(binding, value, "desiredSize");
    if (writer.type === "throw") {
      return writer;
    }
    if (writer.value.stream === undefined) {
      return binding.typeError("The writer has been released");
    }
    const state = writer.value.stream;
    return binding.primitive(
      state.status === "errored" || state.status === "erroring"
        ? null
        : state.status === "closed"
          ? 0
          : state.highWaterMark - state.queueTotalSize,
    );
  });
  binding.method(prototype, "write", 1, (value, argumentsList) => {
    const writer = activeWriter(binding, value, "write");
    if (writer.type === "throw") {
      return rejected(binding, writer.value);
    }
    const stream = writer.value.stream;
    if (stream === undefined) {
      return rejectedTypeError(binding, "The writer has been released");
    }
    return write(
      stream,
      writer.value,
      argumentsList[0] ?? binding.engine.fromPrimitive(undefined),
    );
  });
  binding.method(prototype, "close", 0, (value) => {
    const writer = activeWriter(binding, value, "close");
    if (writer.type === "throw") {
      return rejected(binding, writer.value);
    }
    const stream = writer.value.stream;
    return stream === undefined
      ? rejectedTypeError(binding, "The writer has been released")
      : closeWriter(stream, writer.value);
  });
  binding.method(prototype, "abort", 1, (value, argumentsList) => {
    const writer = activeWriter(binding, value, "abort");
    if (writer.type === "throw") {
      return rejected(binding, writer.value);
    }
    const stream = writer.value.stream;
    if (stream === undefined) {
      return rejectedTypeError(binding, "The writer has been released");
    }
    return abort(
      stream,
      argumentsList[0] ?? binding.engine.fromPrimitive(undefined),
    );
  });
  binding.method(prototype, "releaseLock", 0, (value) => {
    const object = binding.engine.asObject(value);
    if (object === null || !writerStates.has(object)) {
      return binding.invalidReceiver(
        "WritableStreamDefaultWriter",
        "releaseLock",
      );
    }
    releaseWriter(object);
    return binding.undefined();
  });
}

function constructWriter(
  binding: RealmBindingContext,
  thisValue: EngineValue,
  streamValue: EngineValue | undefined,
): EngineResult<EngineValue> {
  const writer = binding.engine.asObject(thisValue);
  if (writer === null) {
    return binding.typeError("Invalid WritableStreamDefaultWriter receiver");
  }
  const state = streamState(binding, streamValue, "constructor");
  return state.type === "throw" ? state : acquireWriter(state.value, writer);
}

function acquireWriter(
  state: StreamState,
  writer: EngineObject,
): EngineResult<EngineValue> {
  if (state.writer !== undefined) {
    return state.binding.typeError("The WritableStream is locked");
  }
  const record: WriterState = {
    stream: state,
    ready: capability(state.binding),
    closed: capability(state.binding),
  };
  writerStates.set(writer, record);
  state.writer = writer;
  if (state.status === "writable" && !state.backpressure) {
    settle(state, record.ready, "resolve");
  }
  if (state.status === "closed") {
    settle(state, record.ready, "resolve");
    settle(state, record.closed, "resolve");
  }
  if (state.status === "errored") {
    settle(state, record.ready, "reject", state.error);
    settle(state, record.closed, "reject", state.error);
  }
  if (state.status === "erroring") {
    settle(state, record.ready, "reject", state.error);
    state.errorReady = record.ready;
  }
  return normal(writer);
}

function releaseWriter(writer: EngineObject): void {
  const record = writerStates.get(writer);
  if (record?.stream === undefined) {
    return;
  }
  const state = record.stream;
  const error = state.binding.engine.createTypeError(
    state.binding.realm,
    "The writer has been released",
  );
  if (record.ready.settled) {
    record.ready = capability(state.binding);
  }
  if (record.closed.settled) {
    record.closed = capability(state.binding);
  }
  settle(state, record.ready, "reject", error);
  settle(state, record.closed, "reject", error);
  state.writer = undefined;
  record.stream = undefined;
}

function write(
  state: StreamState,
  writer: WriterState,
  chunk: EngineValue,
): EngineResult<EngineValue> {
  if (state.status !== "writable" || state.closeRequest !== undefined) {
    return rejected(
      state.binding,
      state.status === "errored" || state.status === "erroring"
        ? state.error
        : state.binding.engine.createTypeError(
            state.binding.realm,
            "The stream is closing or closed",
          ),
    );
  }
  let size = 1;
  if (state.size !== undefined) {
    const result = state.binding.call(
      state.size,
      state.binding.engine.fromPrimitive(undefined),
      [chunk],
    );
    if (result.type === "throw") {
      startErroring(state, result.value);
      return rejected(state.binding, result.value);
    }
    const converted = state.binding.engine.toNumber(
      state.binding.realm,
      result.value,
    );
    if (converted.type === "throw") {
      return converted;
    }
    size = converted.value;
  }
  if (writer.stream !== state) {
    return rejectedTypeError(
      state.binding,
      "The writer was released while computing the chunk size",
    );
  }
  const current = currentWriteState(state);
  if (current.status !== "writable") {
    return rejected(state.binding, state.error);
  }
  if (current.closeRequested) {
    return rejectedTypeError(state.binding, "The stream is closing");
  }
  if (!Number.isFinite(size) || size < 0) {
    const error = state.binding.engine.createRangeError(
      state.binding.realm,
      "Invalid chunk size",
    );
    startErroring(state, error);
    return rejected(state.binding, error);
  }
  const request = capability(state.binding);
  state.queue.push({ chunk, size, capability: request });
  state.queueTotalSize += size;
  updateBackpressure(state);
  advance(state);
  return normal(request.promise);
}

function currentWriteState(state: StreamState): {
  readonly status: StreamState["status"];
  readonly closeRequested: boolean;
} {
  return {
    status: state.status,
    closeRequested: state.closeRequest !== undefined,
  };
}

function closeWriter(
  state: StreamState,
  writer: WriterState,
): EngineResult<EngineValue> {
  if (state.status === "errored") {
    return state.pendingAbortReason === undefined
      ? rejectedTypeError(state.binding, "The WritableStream is errored")
      : rejected(state.binding, state.error);
  }
  if (state.status === "closed" || state.closeRequest !== undefined) {
    return rejectedTypeError(state.binding, "The stream is closing or closed");
  }
  if (state.status === "erroring") {
    const result = capability(state.binding);
    uponPromise(state.binding, writer.closed.promise, {
      fulfilled: () => {
        settle(state, result, "resolve");
      },
      rejected: (reason) => {
        settle(state, result, "reject", reason);
      },
    });
    return normal(result.promise);
  }
  settle(state, writer.ready, "resolve");
  state.backpressure = false;
  state.closeRequest = capability(state.binding);
  advance(state);
  return normal(state.closeRequest.promise);
}

function abort(
  state: StreamState,
  reason: EngineValue,
): EngineResult<EngineValue> {
  const recursiveAbort = pendingAbort(state);
  if (recursiveAbort !== undefined) {
    return normal(recursiveAbort.promise);
  }
  if (state.status === "closed") {
    return resolved(state.binding);
  }
  if (state.status === "errored") {
    return resolved(state.binding);
  }
  const signalResult = state.binding.call(
    state.controllerAbort,
    state.abortController,
    state.binding.engine.isUndefined(reason) ? [] : [reason],
  );
  if (signalResult.type === "throw") {
    return signalResult;
  }
  const signalAbort = pendingAbort(state);
  if (signalAbort !== undefined) {
    return normal(signalAbort.promise);
  }
  const request = capability(state.binding);
  state.pendingAbort = request;
  state.pendingAbortReason = reason;
  if (state.status === "erroring") {
    state.abortSink = false;
    return normal(request.promise);
  }
  state.abortSink = !state.inFlightClose;
  if (state.inFlightClose) {
    rejectWriterReady(state, reason);
  }
  startErroring(state, reason);
  finishErroring(state);
  return normal(request.promise);
}

function pendingAbort(state: StreamState): PromiseCapability | undefined {
  return state.pendingAbort;
}

function advance(state: StreamState): void {
  if (!state.started || state.inFlight || state.status !== "writable") {
    return;
  }
  const entry = state.queue[0];
  if (entry !== undefined) {
    state.inFlight = true;
    const result = callOptional(state, state.sink.write, [
      entry.chunk,
      state.controller,
    ]);
    if (result.type === "throw") {
      completeWrite(state, entry, result.value);
      return;
    }
    uponPromise(state.binding, result.value, {
      fulfilled: () => {
        completeWrite(state, entry);
      },
      rejected: (reason) => {
        completeWrite(state, entry, reason);
      },
    });
    return;
  }
  if (state.closeRequest === undefined) {
    return;
  }
  state.inFlight = true;
  state.inFlightClose = true;
  const request = state.closeRequest;
  const result = callOptional(state, state.sink.close, []);
  if (result.type === "throw") {
    completeClose(state, request, result.value);
    return;
  }
  uponPromise(state.binding, result.value, {
    fulfilled: () => {
      completeClose(state, request);
    },
    rejected: (reason) => {
      completeClose(state, request, reason);
    },
  });
}

function completeWrite(
  state: StreamState,
  entry: QueueEntry,
  error?: EngineValue,
): void {
  state.inFlight = false;
  if (state.queue[0] === entry) {
    state.queue.shift();
    state.queueTotalSize = Math.max(0, state.queueTotalSize - entry.size);
  }
  if (error === undefined) {
    settle(state, entry.capability, "resolve");
  } else {
    settle(state, entry.capability, "reject", error);
    startErroring(state, error);
  }
  updateBackpressure(state);
  if (state.status === "erroring") {
    finishErroring(state);
  } else {
    advance(state);
  }
}

function completeClose(
  state: StreamState,
  request: PromiseCapability,
  error?: EngineValue,
): void {
  state.inFlight = false;
  state.inFlightClose = false;
  if (error !== undefined) {
    settle(state, request, "reject", error);
    if (state.pendingAbort !== undefined) {
      const abortRequest = state.pendingAbort;
      const abortReason =
        state.pendingAbortReason ??
        state.binding.engine.fromPrimitive(undefined);
      state.pendingAbort = undefined;
      state.status = "errored";
      state.error = abortReason;
      settle(state, abortRequest, "reject", error);
      if (state.writer !== undefined) {
        const writer = writerStates.get(state.writer);
        if (writer !== undefined) {
          settle(state, writer.closed, "reject", abortReason);
        }
      }
      return;
    }
    startErroring(state, error);
    finishErroring(state);
    return;
  }
  state.status = "closed";
  settle(state, request, "resolve");
  if (state.pendingAbort === undefined) {
    settleWriterClosed(state);
  }
  finishAbort(state);
}

function settleWriterClosed(state: StreamState): void {
  if (state.writer === undefined) {
    return;
  }
  const writer = writerStates.get(state.writer);
  if (writer !== undefined) {
    settle(state, writer.closed, "resolve");
  }
}

function startErroring(state: StreamState, reason: EngineValue): void {
  if (state.status !== "writable") {
    return;
  }
  state.status = "erroring";
  state.error = reason;
  rejectWriterReady(state, reason);
  if (!state.inFlight) {
    finishErroring(state);
  }
}

function rejectWriterReady(state: StreamState, reason: EngineValue): void {
  if (state.writer === undefined) {
    return;
  }
  const writer = writerStates.get(state.writer);
  if (writer === undefined) {
    return;
  }
  if (writer.ready.settled) {
    writer.ready = capability(state.binding);
  }
  settle(state, writer.ready, "reject", reason);
  state.errorReady = writer.ready;
}

function finishErroring(state: StreamState): void {
  if (state.status !== "erroring" || !state.started || state.inFlight) {
    return;
  }
  state.status = "errored";
  const writer =
    state.writer === undefined ? undefined : writerStates.get(state.writer);
  if (writer !== undefined) {
    if (writer.ready !== state.errorReady && writer.ready.settled) {
      writer.ready = capability(state.binding);
    }
    if (writer.ready !== state.errorReady) {
      settle(state, writer.ready, "reject", state.error);
    }
  }
  for (const entry of state.queue.splice(0)) {
    settle(state, entry.capability, "reject", state.error);
  }
  state.queueTotalSize = 0;
  if (state.closeRequest !== undefined) {
    settle(state, state.closeRequest, "reject", state.error);
  }
  if (writer !== undefined && state.pendingAbort === undefined) {
    settle(state, writer.closed, "reject", state.error);
  }
  finishAbort(state);
}

function finishAbort(state: StreamState): void {
  const request = state.pendingAbort;
  if (request === undefined || state.abortingSink) {
    return;
  }
  if (!state.started) {
    return;
  }
  if (state.status === "closed") {
    state.pendingAbort = undefined;
    settle(state, request, "resolve");
    settleWriterClosed(state);
    return;
  }
  if (!state.abortSink) {
    state.pendingAbort = undefined;
    settle(state, request, "reject", state.error);
    settleWriterErrored(state);
    return;
  }
  const reason =
    state.pendingAbortReason ?? state.binding.engine.fromPrimitive(undefined);
  state.abortingSink = true;
  const result = callOptional(state, state.sink.abort, [reason]);
  if (result.type === "throw") {
    settle(state, request, "reject", result.value);
    uponPromise(state.binding, request.promise, {
      fulfilled: () => {
        if (state.pendingAbort === request) {
          state.pendingAbort = undefined;
        }
        state.abortingSink = false;
        settleWriterErrored(state);
      },
      rejected: () => {
        if (state.pendingAbort === request) {
          state.pendingAbort = undefined;
        }
        state.abortingSink = false;
        settleWriterErrored(state);
      },
    });
    return;
  }
  uponPromise(state.binding, result.value, {
    fulfilled: () => {
      state.pendingAbort = undefined;
      state.abortingSink = false;
      settle(state, request, "resolve");
      if (state.status === "closed") {
        settleWriterClosed(state);
      } else {
        settleWriterErrored(state);
      }
    },
    rejected: (reason) => {
      state.pendingAbort = undefined;
      state.abortingSink = false;
      settle(state, request, "reject", reason);
      if (state.status === "closed") {
        settleWriterClosed(state);
      } else {
        settleWriterErrored(state);
      }
    },
  });
}

function settleWriterErrored(state: StreamState): void {
  if (state.writer === undefined) {
    return;
  }
  const writer = writerStates.get(state.writer);
  if (writer !== undefined) {
    settle(state, writer.closed, "reject", state.error);
  }
}

function updateBackpressure(state: StreamState): void {
  const backpressure = state.highWaterMark - state.queueTotalSize <= 0;
  if (state.writer !== undefined) {
    const writer = writerStates.get(state.writer);
    if (writer !== undefined) {
      if (backpressure && !state.backpressure) {
        writer.ready = capability(state.binding);
      }
      if (!backpressure && state.backpressure) {
        settle(state, writer.ready, "resolve");
      }
    }
  }
  state.backpressure = backpressure;
}

function capability(binding: RealmBindingContext): PromiseCapability {
  let resolve: EngineCallable | undefined;
  let reject: EngineCallable | undefined;
  const executor = binding.function("", 2, (_value, argumentsList) => {
    const resolveValue = argumentsList[0];
    const rejectValue = argumentsList[1];
    resolve =
      resolveValue === undefined
        ? undefined
        : (binding.engine.asCallable(resolveValue) ?? undefined);
    reject =
      rejectValue === undefined
        ? undefined
        : (binding.engine.asCallable(rejectValue) ?? undefined);
    return binding.undefined();
  });
  const constructor = globalCallable(binding, "Promise");
  const promise = binding.engine.construct(binding.realm, constructor, [
    executor,
  ]);
  if (
    promise.type === "throw" ||
    resolve === undefined ||
    reject === undefined
  ) {
    throw new TypeError("Could not create realm Promise");
  }
  markPromiseHandled(binding, promise.value);
  return { promise: promise.value, resolve, reject, settled: false };
}

function markPromiseHandled(
  binding: RealmBindingContext,
  promise: EngineObject,
): void {
  const then = optionalMethod(binding, promise, "then");
  if (then.type === "normal" && then.value !== undefined) {
    binding.call(then.value, promise, [
      binding.engine.fromPrimitive(undefined),
      binding.function("", 0, () => binding.undefined()),
    ]);
  }
}

function settle(
  state: StreamState,
  request: PromiseCapability,
  operation: "resolve" | "reject",
  value = state.binding.engine.fromPrimitive(undefined),
): void {
  if (request.settled) {
    return;
  }
  request.settled = true;
  state.binding.call(
    request[operation],
    state.binding.engine.fromPrimitive(undefined),
    [value],
  );
}

function uponPromise(
  binding: RealmBindingContext,
  value: EngineValue,
  handlers: {
    fulfilled: (value: EngineValue) => void;
    rejected: (reason: EngineValue) => void;
  },
): void {
  const promiseResult = callStaticPromise(binding, "resolve", value);
  if (promiseResult.type === "throw") {
    handlers.rejected(promiseResult.value);
    return;
  }
  const promise = binding.engine.asObject(promiseResult.value);
  if (promise === null) {
    handlers.rejected(
      binding.engine.createTypeError(
        binding.realm,
        "Promise.resolve did not return an object",
      ),
    );
    return;
  }
  const then = optionalMethod(binding, promise, "then");
  if (then.type === "throw" || then.value === undefined) {
    handlers.rejected(
      then.type === "throw"
        ? then.value
        : binding.engine.createTypeError(
            binding.realm,
            "Promise.then is unavailable",
          ),
    );
    return;
  }
  binding.call(then.value, promise, [
    binding.function("", 1, (_value, args) => {
      handlers.fulfilled(args[0] ?? binding.engine.fromPrimitive(undefined));
      return binding.undefined();
    }),
    binding.function("", 1, (_value, args) => {
      handlers.rejected(args[0] ?? binding.engine.fromPrimitive(undefined));
      return binding.undefined();
    }),
  ]);
}

function resolved(binding: RealmBindingContext): EngineResult<EngineValue> {
  return callStaticPromise(
    binding,
    "resolve",
    binding.engine.fromPrimitive(undefined),
  );
}
function rejected(
  binding: RealmBindingContext,
  reason: EngineValue,
): EngineResult<EngineValue> {
  const result = callStaticPromise(binding, "reject", reason);
  if (result.type === "normal") {
    const promise = binding.engine.asObject(result.value);
    if (promise !== null) {
      markPromiseHandled(binding, promise);
    }
  }
  return result;
}
function rejectedTypeError(
  binding: RealmBindingContext,
  message: string,
): EngineResult<EngineValue> {
  return rejected(
    binding,
    binding.engine.createTypeError(binding.realm, message),
  );
}
function callStaticPromise(
  binding: RealmBindingContext,
  name: "resolve" | "reject",
  value: EngineValue,
): EngineResult<EngineValue> {
  const constructor = globalCallable(binding, "Promise");
  const method = optionalMethod(binding, constructor, name);
  return method.type === "throw"
    ? method
    : method.value === undefined
      ? binding.typeError(`Promise.${name} is unavailable`)
      : binding.call(method.value, constructor, [value]);
}

function globalCallable(
  binding: RealmBindingContext,
  name: string,
): EngineCallable {
  const result = binding.engine.get(
    binding.realm,
    binding.engine.globalObject(binding.realm),
    name,
  );
  const callable =
    result.type === "normal" ? binding.engine.asCallable(result.value) : null;
  if (callable === null) {
    throw new TypeError(`${name} is unavailable in the realm`);
  }
  return callable;
}

function objectPrototype(
  binding: RealmBindingContext,
  constructorName: string,
): EngineObject {
  const constructor = globalCallable(binding, constructorName);
  const result = binding.engine.get(binding.realm, constructor, "prototype");
  const object =
    result.type === "normal" ? binding.engine.asObject(result.value) : null;
  if (object === null) {
    throw new TypeError(`${constructorName}.prototype is unavailable`);
  }
  return object;
}

function dictionary(
  binding: RealmBindingContext,
  value: EngineValue | undefined,
  name: string,
): EngineResult<EngineObject> {
  if (
    value === undefined ||
    binding.engine.isUndefined(value) ||
    binding.engine.isNull(value)
  ) {
    return normal(
      binding.engine.createObject(
        binding.realm,
        binding.engine.objectPrototype(binding.realm),
      ),
    );
  }
  const object = binding.engine.asObject(value);
  return object === null
    ? binding.typeError(`${name} must be an object`)
    : normal(object);
}

function algorithms(
  binding: RealmBindingContext,
  object: EngineObject,
): EngineResult<SinkAlgorithms> {
  const result: SinkAlgorithms = {
    object,
    start: undefined,
    write: undefined,
    close: undefined,
    abort: undefined,
  };
  for (const name of ["start", "write", "close", "abort"] as const) {
    const method = optionalMethod(binding, object, name);
    if (method.type === "throw") {
      return method;
    }
    result[name] = method.value;
  }
  return normal(result);
}

function optionalMethod(
  binding: RealmBindingContext,
  object: EngineObject,
  name: string,
): EngineResult<EngineCallable | undefined> {
  const result = binding.engine.get(binding.realm, object, name);
  if (result.type === "throw") {
    return result;
  }
  if (binding.engine.isUndefined(result.value)) {
    return normal(undefined);
  }
  const callable = binding.engine.asCallable(result.value);
  return callable === null
    ? binding.typeError(`${name} must be callable`)
    : normal(callable);
}

function numberProperty(
  binding: RealmBindingContext,
  object: EngineObject,
  name: string,
  fallback: number,
): EngineResult<number> {
  const result = binding.engine.get(binding.realm, object, name);
  if (result.type === "throw") {
    return result;
  }
  return binding.engine.isUndefined(result.value)
    ? normal(fallback)
    : binding.engine.toNumber(binding.realm, result.value);
}

function callOptional(
  state: StreamState,
  callable: EngineCallable | undefined,
  argumentsList: readonly EngineValue[],
): EngineResult<EngineValue> {
  return callable === undefined
    ? state.binding.undefined()
    : state.binding.call(callable, state.sink.object, argumentsList);
}

function streamState(
  binding: RealmBindingContext,
  value: EngineValue | undefined,
  member: string,
): EngineResult<StreamState> {
  const object = value === undefined ? null : binding.engine.asObject(value);
  const state = object === null ? undefined : streamStates.get(object);
  return state === undefined
    ? binding.invalidReceiver("WritableStream", member)
    : normal(state);
}

function writerState(
  binding: RealmBindingContext,
  value: EngineValue,
  member: string,
): EngineResult<WriterState> {
  const object = binding.engine.asObject(value);
  const state = object === null ? undefined : writerStates.get(object);
  return state === undefined
    ? binding.invalidReceiver("WritableStreamDefaultWriter", member)
    : normal(state);
}

function activeWriter(
  binding: RealmBindingContext,
  value: EngineValue,
  member: string,
): EngineResult<WriterState> {
  const result = writerState(binding, value, member);
  return result.type === "throw" || result.value.stream !== undefined
    ? result
    : binding.typeError("The writer has been released");
}

function writerCapability(
  binding: RealmBindingContext,
  value: EngineValue,
  member: "ready" | "closed",
): EngineResult<EngineValue> {
  const state = writerState(binding, value, member);
  return state.type === "throw" ? state : normal(state.value[member].promise);
}
