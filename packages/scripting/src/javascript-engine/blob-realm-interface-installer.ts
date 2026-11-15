import { Blob, blobBytes, blobText, File } from "@palim/window";

import type {
  EngineCallable,
  EngineObject,
  EngineResult,
  EngineValue,
} from "./adapter.js";
import { normal } from "./adapter.js";
import type { BlobRealmBindingContext } from "./blob-realm-binding-context.js";
import type { RealmBindingContext } from "./realm-binding-context.js";

interface InstallationState {
  readonly context: RealmBindingContext;
  readonly domain: BlobRealmBindingContext;
}

export function installBlobInterfaces(
  context: RealmBindingContext,
  domain: BlobRealmBindingContext,
): void {
  const state = { context, domain };
  installBlobInterface(state);
  installFileInterface(state);
  installBlobMembers(state);
  installFileMembers(state);
}

function installBlobInterface(state: InstallationState): void {
  const constructor = state.context.createConstructor(
    "Blob",
    0,
    (_thisValue, argumentsList) => {
      const parts = blobParts(state, argumentsList[0]);
      if (parts.type === "throw") {
        return parts;
      }
      const endings = dictionaryEndings(state, argumentsList[1]);
      if (endings.type === "throw") {
        return endings;
      }
      const type = dictionaryString(state, argumentsList[1], "type", "");
      return type.type === "throw"
        ? type
        : normal(
            state.domain.wrap(
              new Blob(parts.value, {
                endings: endings.value,
                type: type.value,
              }),
            ),
          );
    },
  );
  state.context.installInterface(
    "Blob",
    constructor,
    state.domain.blobPrototype,
  );
  state.context.tag(state.domain.blobPrototype, "Blob");
}

function installFileInterface(state: InstallationState): void {
  const constructor = state.context.createConstructor(
    "File",
    2,
    (_thisValue, argumentsList) => {
      if (argumentsList[0] === undefined || argumentsList[1] === undefined) {
        return state.context.typeError("File requires 2 argument(s)");
      }
      const parts = blobParts(state, argumentsList[0]);
      if (parts.type === "throw") {
        return parts;
      }
      const name = state.context.string(argumentsList[1], true);
      if (name.type === "throw") {
        return name;
      }
      const endings = dictionaryEndings(state, argumentsList[2]);
      if (endings.type === "throw") {
        return endings;
      }
      const lastModified = dictionaryNumber(
        state,
        argumentsList[2],
        "lastModified",
      );
      if (lastModified.type === "throw") {
        return lastModified;
      }
      const type = dictionaryString(state, argumentsList[2], "type", "");
      if (type.type === "throw") {
        return type;
      }
      return normal(
        state.domain.wrap(
          new File(
            parts.value,
            name.value,
            lastModified.value === undefined
              ? { endings: endings.value, type: type.value }
              : {
                  endings: endings.value,
                  type: type.value,
                  lastModified: lastModified.value,
                },
          ),
        ),
      );
    },
  );
  state.context.installInterface(
    "File",
    constructor,
    state.domain.filePrototype,
  );
  state.context.tag(state.domain.filePrototype, "File");
}

function installBlobMembers(state: InstallationState): void {
  state.context.attribute(state.domain.blobPrototype, "size", (thisValue) => {
    const blob = state.domain.value(thisValue);
    return blob === null
      ? state.context.invalidReceiver("Blob", "size")
      : state.context.primitive(blob.size);
  });
  state.context.attribute(state.domain.blobPrototype, "type", (thisValue) => {
    const blob = state.domain.value(thisValue);
    return blob === null
      ? state.context.invalidReceiver("Blob", "type")
      : state.context.primitive(blob.type);
  });
  state.context.method(
    state.domain.blobPrototype,
    "slice",
    0,
    (thisValue, argumentsList) => {
      const blob = state.domain.value(thisValue);
      if (blob === null) {
        return state.context.invalidReceiver("Blob", "slice");
      }
      const start = optionalNumber(state, argumentsList[0], 0);
      if (start.type === "throw") {
        return start;
      }
      const end = optionalNumber(state, argumentsList[1], blob.size);
      if (end.type === "throw") {
        return end;
      }
      const contentType = state.context.optionalString(
        argumentsList[2],
        "",
        true,
      );
      return contentType.type === "throw"
        ? contentType
        : normal(
            state.domain.wrap(
              blob.slice(start.value, end.value, contentType.value),
            ),
          );
    },
  );
  state.context.method(
    state.domain.blobPrototype,
    "arrayBuffer",
    0,
    (thisValue) => {
      const blob = state.domain.value(thisValue);
      if (blob === null) {
        return state.context.invalidReceiver("Blob", "arrayBuffer");
      }
      const arrayBuffer = createRealmArrayBuffer(state, blobBytes(blob));
      return arrayBuffer.type === "throw"
        ? arrayBuffer
        : resolvedPromise(state, arrayBuffer.value);
    },
  );
  state.context.method(state.domain.blobPrototype, "text", 0, (thisValue) => {
    const blob = state.domain.value(thisValue);
    if (blob === null) {
      return state.context.invalidReceiver("Blob", "text");
    }
    return resolvedPromise(
      state,
      state.context.engine.fromPrimitive(blobText(blob)),
    );
  });
}

function installFileMembers(state: InstallationState): void {
  for (const name of ["name", "webkitRelativePath"] as const) {
    state.context.attribute(state.domain.filePrototype, name, (thisValue) => {
      const file = state.domain.file(thisValue);
      return file === null
        ? state.context.invalidReceiver("File", name)
        : state.context.primitive(file[name]);
    });
  }
  state.context.attribute(
    state.domain.filePrototype,
    "lastModified",
    (thisValue) => {
      const file = state.domain.file(thisValue);
      return file === null
        ? state.context.invalidReceiver("File", "lastModified")
        : state.context.primitive(file.lastModified);
    },
  );
}

function blobParts(
  state: InstallationState,
  value: EngineValue | undefined,
): EngineResult<(string | Blob | Uint8Array)[]> {
  if (value === undefined || state.context.engine.isUndefined(value)) {
    return normal([]);
  }
  const iterator = state.domain.iterator(value);
  if (iterator.type === "throw") {
    return iterator;
  }
  const next = state.context.engine.asCallable(iterator.value);
  if (next === null) {
    return state.context.typeError("Blob iterator is not callable");
  }
  const parts: (string | Blob | Uint8Array)[] = [];
  for (;;) {
    const result = state.context.call(
      next,
      state.context.engine.fromPrimitive(undefined),
      [],
    );
    if (result.type === "throw") {
      return result;
    }
    const resultObject = state.context.engine.asObject(result.value);
    if (resultObject === null) {
      return state.context.typeError("Blob iterator result is not an object");
    }
    const done = state.context.engine.get(
      state.context.realm,
      resultObject,
      "done",
    );
    if (done.type === "throw") {
      return done;
    }
    if (state.context.engine.toBoolean(done.value)) {
      break;
    }
    const item = state.context.engine.get(
      state.context.realm,
      resultObject,
      "value",
    );
    if (item.type === "throw") {
      return item;
    }
    const blob = state.domain.value(item.value);
    if (blob !== null) {
      parts.push(blob);
      continue;
    }
    const bytes = state.context.engine.bufferSourceBytes(item.value);
    if (bytes !== null) {
      parts.push(bytes);
      continue;
    }
    const string = state.context.string(item.value, true);
    if (string.type === "throw") {
      return string;
    }
    parts.push(string.value);
  }
  return normal(parts);
}

function dictionaryString(
  state: InstallationState,
  dictionary: EngineValue | undefined,
  name: string,
  fallback: string,
): EngineResult<string> {
  if (
    dictionary === undefined ||
    state.context.engine.isUndefined(dictionary) ||
    state.context.engine.isNull(dictionary)
  ) {
    return normal(fallback);
  }
  const object = state.context.engine.asObject(dictionary);
  if (object === null) {
    return state.context.typeError("Blob options are not an object");
  }
  const value = state.context.engine.get(state.context.realm, object, name);
  return value.type === "throw"
    ? value
    : state.context.optionalString(value.value, fallback, true);
}

function dictionaryNumber(
  state: InstallationState,
  dictionary: EngineValue | undefined,
  name: string,
): EngineResult<number | undefined> {
  if (
    dictionary === undefined ||
    state.context.engine.isUndefined(dictionary) ||
    state.context.engine.isNull(dictionary)
  ) {
    return normal(undefined);
  }
  const object = state.context.engine.asObject(dictionary);
  if (object === null) {
    return state.context.typeError("File options are not an object");
  }
  const value = state.context.engine.get(state.context.realm, object, name);
  if (value.type === "throw") {
    return value;
  }
  return state.context.engine.isUndefined(value.value)
    ? normal(undefined)
    : state.context.engine.toNumber(state.context.realm, value.value);
}

function dictionaryEndings(
  state: InstallationState,
  dictionary: EngineValue | undefined,
): EngineResult<"transparent" | "native"> {
  const converted = dictionaryString(
    state,
    dictionary,
    "endings",
    "transparent",
  );
  if (converted.type === "throw") {
    return converted;
  }
  return converted.value === "transparent" || converted.value === "native"
    ? normal(converted.value)
    : state.context.typeError(
        `Invalid Blob endings value ${JSON.stringify(converted.value)}`,
      );
}

function optionalNumber(
  state: InstallationState,
  value: EngineValue | undefined,
  fallback: number,
): EngineResult<number> {
  return value === undefined || state.context.engine.isUndefined(value)
    ? normal(fallback)
    : state.context.engine.toNumber(state.context.realm, value);
}

function createRealmArrayBuffer(
  state: InstallationState,
  bytes: Uint8Array,
): EngineResult<EngineObject> {
  const constructor = globalCallable(state, "Uint8Array");
  if (constructor.type === "throw") {
    return constructor;
  }
  const values = state.context.engine.createArray(
    state.context.realm,
    Array.from(bytes, (byte) => state.context.engine.fromPrimitive(byte)),
  );
  const typedArray = state.context.engine.construct(
    state.context.realm,
    constructor.value,
    [values],
  );
  if (typedArray.type === "throw") {
    return typedArray;
  }
  const buffer = state.context.engine.get(
    state.context.realm,
    typedArray.value,
    "buffer",
  );
  if (buffer.type === "throw") {
    return buffer;
  }
  const object = state.context.engine.asObject(buffer.value);
  return object === null
    ? state.context.typeError("Uint8Array buffer is not an object")
    : normal(object);
}

function resolvedPromise(
  state: InstallationState,
  value: EngineValue,
): EngineResult<EngineValue> {
  const constructor = globalCallable(state, "Promise");
  if (constructor.type === "throw") {
    return constructor;
  }
  const resolve = state.context.engine.get(
    state.context.realm,
    constructor.value,
    "resolve",
  );
  if (resolve.type === "throw") {
    return resolve;
  }
  const callable = state.context.engine.asCallable(resolve.value);
  return callable === null
    ? state.context.typeError("Promise.resolve is not callable")
    : state.context.call(callable, constructor.value, [value]);
}

function globalCallable(
  state: InstallationState,
  name: string,
): EngineResult<EngineCallable> {
  const value = state.context.engine.get(
    state.context.realm,
    state.context.engine.globalObject(state.context.realm),
    name,
  );
  if (value.type === "throw") {
    return value;
  }
  const callable = state.context.engine.asCallable(value.value);
  return callable === null
    ? state.context.typeError(`${name} is not callable`)
    : normal(callable);
}
