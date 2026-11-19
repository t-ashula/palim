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
      const body =
        bodyValue === undefined ||
        realm.isNull(bodyValue) ||
        realm.isUndefined(bodyValue)
          ? null
          : encodeUTF8(unwrap(realm.string(bodyValue)));
      void network
        .request({
          url: xhr.url,
          method: xhr.method,
          headers: Array.from(xhr.requestHeaders),
          body,
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
      return realm.primitive(xhr.responseText);
    }),
  );
  xhrInterface.attribute("responseXML", () =>
    realmNormal(realm.primitive(null)),
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
