import {
  decodeUTF8,
  defaultHostNetwork,
  encodeUTF8,
  resolveURL,
} from "./fetch.js";
import type {
  HostCancellation,
  HostNetwork,
  RealmCallable,
  RealmFormDataEntry,
  RealmObject,
  RealmResult,
  RealmValue,
  WindowExtension,
  WindowExtensionContext,
} from "./index.js";
import { createWindowExtension, hostService, realmNormal } from "./index.js";
import { hostNetworkService } from "./network.js";

interface XMLHttpRequestState {
  readonly object: RealmObject;
  readonly handlers: Map<string, RealmCallable | null>;
  readyState: number;
  method: string;
  url: string;
  requestHeaders: Map<string, string>;
  responseHeaders: readonly (readonly [string, string])[];
  responseBytes: Uint8Array;
  responseText: string;
  responseURL: string;
  status: number;
  statusText: string;
  responseType: string;
  responseDocument: RealmObject | null;
  overrideMimeType: string | null;
  sendGeneration: number;
  cancellation: RequestCancellation | null;
}

const xhrMethods = new Set(["DELETE", "GET", "HEAD", "OPTIONS", "POST", "PUT"]);

export function xmlHttpRequestPolyfill(
  network: HostNetwork = defaultHostNetwork,
): WindowExtension {
  return createWindowExtension(
    (context) => {
      installXMLHttpRequest(context, context.host.require(hostNetworkService));
    },
    [hostService(hostNetworkService, network)],
  );
}

function installXMLHttpRequest(
  context: WindowExtensionContext,
  network: HostNetwork,
): void {
  const { realm } = context;
  const states = new WeakMap<RealmObject, XMLHttpRequestState>();
  const state = (value: RealmValue, operation: string): XMLHttpRequestState => {
    const object = realm.object(value);
    const result = object === null ? undefined : states.get(object);
    if (result === undefined) {
      throw new RealmThrown(
        realm.createTypeError(
          `Invalid XMLHttpRequest receiver for ${operation}`,
        ),
      );
    }
    return result;
  };
  const eventTargetInterface = realm.defineInterface(
    "XMLHttpRequestEventTarget",
    0,
    () => ({
      type: "throw",
      value: realm.createTypeError("Illegal constructor"),
    }),
    "EventTarget",
  );
  const xhrInterface = realm.defineInterface(
    "XMLHttpRequest",
    0,
    () => {
      const object = xhrInterface.create();
      realm.initializeEventTarget(object);
      states.set(object, {
        object,
        handlers: new Map(),
        readyState: 0,
        method: "GET",
        url: context.window.url,
        requestHeaders: new Map(),
        responseHeaders: [],
        responseBytes: new Uint8Array(),
        responseText: "",
        responseURL: "",
        status: 0,
        statusText: "",
        responseType: "",
        responseDocument: null,
        overrideMimeType: null,
        sendGeneration: 0,
        cancellation: null,
      });
      return realmNormal(object);
    },
    eventTargetInterface,
  );

  xhrInterface.method("open", 2, (thisValue, args) =>
    operation(context, () => {
      const xhr = state(thisValue, "open");
      const method = requiredString(context, args, 0, "open").toUpperCase();
      if (!xhrMethods.has(method)) {
        throw new RealmThrown(
          realm.createDOMException("The HTTP method is invalid", "SyntaxError"),
        );
      }
      const input = requiredString(context, args, 1, "open");
      let url: string;
      try {
        url = resolveURL(input, context.window.url);
      } catch {
        throw new RealmThrown(
          realm.createDOMException("The URL is invalid", "SyntaxError"),
        );
      }
      xhr.cancellation?.abort();
      xhr.sendGeneration += 1;
      xhr.method = method;
      xhr.url = url;
      xhr.requestHeaders = new Map();
      xhr.overrideMimeType = null;
      clearResponse(xhr);
      xhr.readyState = 1;
      dispatch(context, xhr, "readystatechange");
      return realm.primitive(undefined);
    }),
  );
  xhrInterface.method("setRequestHeader", 2, (thisValue, args) =>
    operation(context, () => {
      const xhr = state(thisValue, "setRequestHeader");
      if (xhr.readyState !== 1) {
        throw new RealmThrown(
          realm.createDOMException(
            "The object is not opened",
            "InvalidStateError",
          ),
        );
      }
      const name = requiredString(
        context,
        args,
        0,
        "setRequestHeader",
      ).toLowerCase();
      const value = requiredString(context, args, 1, "setRequestHeader").trim();
      const previous = xhr.requestHeaders.get(name);
      xhr.requestHeaders.set(
        name,
        previous === undefined ? value : `${previous}, ${value}`,
      );
      return realm.primitive(undefined);
    }),
  );
  xhrInterface.method("send", 1, (thisValue, args) =>
    operation(context, () => {
      const xhr = state(thisValue, "send");
      if (xhr.readyState !== 1 || xhr.cancellation !== null) {
        throw new RealmThrown(
          realm.createDOMException(
            "The object is not ready to send",
            "InvalidStateError",
          ),
        );
      }
      const cancellation = new RequestCancellation();
      xhr.cancellation = cancellation;
      const generation = ++xhr.sendGeneration;
      const bodyValue = args[0];
      const body = requestBody(context, xhr, bodyValue);
      void network
        .request({
          url: xhr.url,
          method: xhr.method,
          headers: Array.from(xhr.requestHeaders),
          body: body.bytes,
          cancellation,
        })
        .then(
          (response) => {
            context.tasks.enqueue(() => {
              if (xhr.sendGeneration !== generation || cancellation.aborted) {
                return realmNormal(realm.primitive(undefined));
              }
              xhr.responseURL = response.url;
              xhr.status = response.status;
              xhr.statusText = response.statusText;
              xhr.responseHeaders = response.headers;
              xhr.responseBytes = response.body;
              xhr.responseText = decodeUTF8(response.body);
              const contentType =
                xhr.overrideMimeType ??
                response.headers.find(
                  ([name]) => name.toLowerCase() === "content-type",
                )?.[1];
              if (
                xhr.responseType === "document" ||
                (xhr.responseType === "" && contentType !== undefined)
              ) {
                xhr.responseDocument = unwrap(
                  realm.documentResponse(
                    response.body,
                    contentType ?? "",
                    response.url,
                  ),
                );
              }
              xhr.readyState = 2;
              dispatch(context, xhr, "readystatechange");
              xhr.readyState = 3;
              dispatch(context, xhr, "readystatechange");
              xhr.readyState = 4;
              xhr.cancellation = null;
              dispatch(context, xhr, "readystatechange");
              dispatch(context, xhr, "load");
              dispatch(context, xhr, "loadend");
              return realmNormal(realm.primitive(undefined));
            });
          },
          () => {
            context.tasks.enqueue(() => {
              if (xhr.sendGeneration !== generation || cancellation.aborted) {
                return realmNormal(realm.primitive(undefined));
              }
              clearResponse(xhr);
              xhr.readyState = 4;
              xhr.cancellation = null;
              dispatch(context, xhr, "readystatechange");
              dispatch(context, xhr, "error");
              dispatch(context, xhr, "loadend");
              return realmNormal(realm.primitive(undefined));
            });
          },
        );
      return realm.primitive(undefined);
    }),
  );
  xhrInterface.method("abort", 0, (thisValue) =>
    operation(context, () => {
      const xhr = state(thisValue, "abort");
      const active = xhr.cancellation !== null;
      xhr.cancellation?.abort();
      xhr.cancellation = null;
      xhr.sendGeneration += 1;
      clearResponse(xhr);
      xhr.readyState = 0;
      if (active) {
        dispatch(context, xhr, "readystatechange");
        dispatch(context, xhr, "abort");
        dispatch(context, xhr, "loadend");
      }
      return realm.primitive(undefined);
    }),
  );
  xhrInterface.method("getResponseHeader", 1, (thisValue, args) =>
    operation(context, () => {
      const xhr = state(thisValue, "getResponseHeader");
      const name = requiredString(
        context,
        args,
        0,
        "getResponseHeader",
      ).toLowerCase();
      const values = xhr.responseHeaders
        .filter(([header]) => header.toLowerCase() === name)
        .map(([, value]) => value);
      return realm.primitive(values.length === 0 ? null : values.join(", "));
    }),
  );
  xhrInterface.method("getAllResponseHeaders", 0, (thisValue) =>
    operation(context, () => {
      const xhr = state(thisValue, "getAllResponseHeaders");
      return realm.primitive(
        xhr.responseHeaders
          .map(([name, value]) => `${name}: ${value}\r\n`)
          .join(""),
      );
    }),
  );
  xhrInterface.method("overrideMimeType", 1, (thisValue, args) =>
    operation(context, () => {
      const xhr = state(thisValue, "overrideMimeType");
      if (xhr.readyState === 3 || xhr.readyState === 4) {
        throw new RealmThrown(
          realm.createDOMException(
            "The response is already being received",
            "InvalidStateError",
          ),
        );
      }
      xhr.overrideMimeType = requiredString(
        context,
        args,
        0,
        "overrideMimeType",
      );
      return realm.primitive(undefined);
    }),
  );

  for (const [name, getter] of [
    ["readyState", (xhr: XMLHttpRequestState) => xhr.readyState],
    ["status", (xhr: XMLHttpRequestState) => xhr.status],
    ["statusText", (xhr: XMLHttpRequestState) => xhr.statusText],
    ["responseURL", (xhr: XMLHttpRequestState) => xhr.responseURL],
    ["responseText", (xhr: XMLHttpRequestState) => xhr.responseText],
  ] as const) {
    xhrInterface.attribute(name, (thisValue) =>
      operation(context, () => realm.primitive(getter(state(thisValue, name)))),
    );
  }
  xhrInterface.attribute(
    "responseType",
    (thisValue) =>
      operation(context, () =>
        realm.primitive(state(thisValue, "responseType").responseType),
      ),
    (thisValue, args) =>
      operation(context, () => {
        const xhr = state(thisValue, "responseType");
        xhr.responseType =
          args[0] === undefined ? "" : unwrap(realm.string(args[0]));
        return realm.primitive(undefined);
      }),
  );
  xhrInterface.attribute("response", (thisValue) =>
    operation(context, () => {
      const xhr = state(thisValue, "response");
      if (xhr.responseType === "arraybuffer") {
        return unwrap(realm.arrayBuffer(xhr.responseBytes));
      }
      if (xhr.responseType === "json") {
        return xhr.responseText === ""
          ? realm.primitive(null)
          : unwrap(realm.parseJSON(xhr.responseText));
      }
      if (xhr.responseType === "document") {
        return xhr.responseDocument ?? realm.primitive(null);
      }
      return realm.primitive(xhr.responseText);
    }),
  );
  xhrInterface.attribute("responseXML", (thisValue) =>
    operation(context, () => {
      const document = state(thisValue, "responseXML").responseDocument;
      return document ?? realm.primitive(null);
    }),
  );
  for (const type of [
    "readystatechange",
    "load",
    "error",
    "abort",
    "loadend",
  ] as const) {
    const name = `on${type}`;
    xhrInterface.attribute(
      name,
      (thisValue) =>
        operation(
          context,
          () =>
            state(thisValue, name).handlers.get(type) ?? realm.primitive(null),
        ),
      (thisValue, args) =>
        operation(context, () => {
          const xhr = state(thisValue, name);
          const value = args[0];
          xhr.handlers.set(
            type,
            value === undefined || realm.isNull(value)
              ? null
              : realm.callable(value),
          );
          return realm.primitive(undefined);
        }),
    );
  }
  for (const [name, value] of [
    ["UNSENT", 0],
    ["OPENED", 1],
    ["HEADERS_RECEIVED", 2],
    ["LOADING", 3],
    ["DONE", 4],
  ] as const) {
    xhrInterface.constant(name, value);
  }
}

function dispatch(
  context: WindowExtensionContext,
  xhr: XMLHttpRequestState,
  type: string,
): void {
  unwrap(context.realm.dispatchEvent(xhr.object, type));
}

function clearResponse(xhr: XMLHttpRequestState): void {
  xhr.responseHeaders = [];
  xhr.responseBytes = new Uint8Array();
  xhr.responseText = "";
  xhr.responseURL = "";
  xhr.status = 0;
  xhr.statusText = "";
  xhr.responseDocument = null;
}

function requestBody(
  context: WindowExtensionContext,
  xhr: XMLHttpRequestState,
  value: RealmValue | undefined,
): { readonly bytes: Uint8Array | null } {
  if (
    xhr.method === "GET" ||
    xhr.method === "HEAD" ||
    value === undefined ||
    context.realm.isNull(value) ||
    context.realm.isUndefined(value)
  ) {
    return { bytes: null };
  }
  const entries = context.realm.formDataEntries(value);
  if (entries === null) {
    return { bytes: encodeUTF8(unwrap(context.realm.string(value))) };
  }
  const boundary = `----palim-form-data-${String(xhr.sendGeneration)}`;
  if (!xhr.requestHeaders.has("content-type")) {
    xhr.requestHeaders.set(
      "content-type",
      `multipart/form-data; boundary=${boundary}`,
    );
  }
  return { bytes: serializeFormData(entries, boundary) };
}

function serializeFormData(
  entries: readonly RealmFormDataEntry[],
  boundary: string,
): Uint8Array {
  const parts: Uint8Array[] = [];
  for (const entry of entries) {
    const disposition =
      "value" in entry
        ? `Content-Disposition: form-data; name="${escapeQuoted(entry.name)}"\r\n\r\n`
        : `Content-Disposition: form-data; name="${escapeQuoted(entry.name)}"; filename="${escapeQuoted(entry.filename)}"\r\nContent-Type: ${entry.type || "application/octet-stream"}\r\n\r\n`;
    parts.push(encodeUTF8(`--${boundary}\r\n${disposition}`));
    parts.push("value" in entry ? encodeUTF8(entry.value) : entry.bytes);
    parts.push(encodeUTF8("\r\n"));
  }
  parts.push(encodeUTF8(`--${boundary}--\r\n`));
  const length = parts.reduce((total, part) => total + part.byteLength, 0);
  const result = new Uint8Array(length);
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.byteLength;
  }
  return result;
}

function escapeQuoted(value: string): string {
  return value
    .replaceAll("\r", "%0D")
    .replaceAll("\n", "%0A")
    .replaceAll('"', "%22");
}

function requiredString(
  context: WindowExtensionContext,
  args: readonly RealmValue[],
  index: number,
  operation: string,
): string {
  const value = args[index];
  if (value === undefined) {
    throw new RealmThrown(
      context.realm.createTypeError(
        `${operation} requires argument ${String(index + 1)}`,
      ),
    );
  }
  return unwrap(context.realm.string(value));
}

function operation(
  context: WindowExtensionContext,
  callback: () => RealmValue,
): RealmResult<RealmValue> {
  try {
    return realmNormal(callback());
  } catch (error) {
    return {
      type: "throw",
      value:
        error instanceof RealmThrown
          ? error.value
          : context.realm.createTypeError(
              error instanceof Error ? error.message : String(error),
            ),
    };
  }
}

function unwrap<T>(result: RealmResult<T>): T {
  if (result.type === "throw") {
    throw new RealmThrown(result.value);
  }
  return result.value;
}

class RealmThrown extends Error {
  constructor(readonly value: RealmValue) {
    super("Page realm operation threw");
  }
}

class RequestCancellation implements HostCancellation {
  readonly #callbacks = new Set<() => void>();
  #aborted = false;

  get aborted(): boolean {
    return this.#aborted;
  }

  onAbort(callback: () => void): () => void {
    if (this.#aborted) {
      callback();
      return () => undefined;
    }
    this.#callbacks.add(callback);
    return () => this.#callbacks.delete(callback);
  }

  abort(): void {
    if (this.#aborted) {
      return;
    }
    this.#aborted = true;
    for (const callback of this.#callbacks) {
      callback();
    }
  }
}
