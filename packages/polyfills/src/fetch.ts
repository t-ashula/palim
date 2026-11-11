import { createWindowExtension, hostService } from "./index.js";
import type {
  RealmInterface,
  RealmObject,
  RealmPromiseCapability,
  RealmResult,
  RealmValue,
  WindowExtension,
  WindowExtensionContext,
} from "./index.js";
import { hostNetworkService } from "./network.js";
import type {
  HostCancellation,
  HostNetwork,
  HostNetworkRequest,
  HostNetworkResponse,
} from "./network.js";

interface HostFetchResponse {
  readonly url: string;
  readonly status: number;
  readonly statusText: string;
  readonly headers: Iterable<readonly [string, string]>;
  arrayBuffer(): Promise<ArrayBuffer>;
}

interface HostFetchPlatform {
  fetch(
    input: string,
    init: {
      readonly method: string;
      readonly headers: readonly (readonly [string, string])[];
      readonly body?: Uint8Array;
      readonly signal: object;
    },
  ): Promise<HostFetchResponse>;
  AbortController: new () => { readonly signal: object; abort(): void };
  URL: new (input: string, base?: string) => { readonly href: string };
}

interface HeadersState {
  readonly values: Map<string, string>;
}

interface BodyState {
  readonly body: Uint8Array | null;
  bodyUsed: boolean;
}

interface RequestState extends BodyState {
  readonly url: string;
  readonly method: string;
  readonly headers: RealmObject;
  readonly signal: RealmValue;
  readonly referrer: string;
  readonly referrerPolicy: string;
  readonly mode: string;
  readonly credentials: string;
  readonly cache: string;
  readonly redirect: string;
  readonly integrity: string;
  readonly keepalive: boolean;
}

interface ResponseState extends BodyState {
  type: string;
  url: string;
  redirected: boolean;
  status: number;
  readonly statusText: string;
  readonly headers: RealmObject;
}

const tokenPattern = /^[!#$%&'*+.^_|~0-9A-Za-z-]+$/;

export function fetchPolyfill(): WindowExtension {
  const network = new HostFetchNetwork(
    globalThis as unknown as HostFetchPlatform,
  );
  return createWindowExtension(
    (context) => {
      installFetch(context, context.host.require(hostNetworkService));
    },
    [hostService(hostNetworkService, network)],
  );
}

function installFetch(
  context: WindowExtensionContext,
  network: HostNetwork,
): void {
  const { realm } = context;
  const headersStates = new WeakMap<RealmObject, HeadersState>();
  const requestStates = new WeakMap<RealmObject, RequestState>();
  const responseStates = new WeakMap<RealmObject, ResponseState>();

  const headersObject = (value: RealmValue, operationName: string) =>
    brandedObject(realm.object(value), headersStates, "Headers", operationName);
  const requestObject = (value: RealmValue, operationName: string) =>
    brandedObject(realm.object(value), requestStates, "Request", operationName);
  const responseObject = (value: RealmValue, operationName: string) =>
    brandedObject(
      realm.object(value),
      responseStates,
      "Response",
      operationName,
    );

  const createHeaders = (init?: RealmValue): RealmObject => {
    const object = headersInterface.create();
    const state: HeadersState = { values: new Map() };
    headersStates.set(object, state);
    if (init === undefined || realm.isUndefined(init)) {
      return object;
    }
    const source = realm.object(init);
    if (source === null) {
      throw typeError(context, "Headers initializer must be an object");
    }
    const existing = headersStates.get(source);
    if (existing !== undefined) {
      for (const [name, value] of existing.values) {
        state.values.set(name, value);
      }
      return object;
    }
    const entries = unwrap(realm.iterableValues(source));
    if (entries !== null) {
      for (const entry of entries) {
        const pairObject = realm.object(entry);
        if (pairObject === null) {
          throw typeError(context, "Header pair must be iterable");
        }
        const pair = unwrap(realm.iterableValues(pairObject));
        if (pair?.length !== 2) {
          throw typeError(context, "Header pair must contain two items");
        }
        const [nameValue, headerValueInput] = pair as readonly [
          RealmValue,
          RealmValue,
        ];
        appendHeader(
          state,
          string(context, nameValue),
          string(context, headerValueInput),
        );
      }
      return object;
    }
    for (const name of unwrap(realm.ownEnumerablePropertyNames(source))) {
      appendHeader(
        state,
        name,
        string(context, unwrap(realm.get(source, name))),
      );
    }
    return object;
  };

  const headerEntries = (object: RealmObject) =>
    Array.from(headersStates.get(object)?.values ?? []).sort(
      ([left], [right]) => left.localeCompare(right),
    );

  const headersInterface = realm.defineInterface(
    "Headers",
    0,
    (_thisValue, args) => operation(context, () => createHeaders(args[0])),
  );
  headersInterface.method("append", 2, (thisValue, args) =>
    operation(context, () => {
      const object = headersObject(thisValue, "append");
      appendHeader(
        stateFor(headersStates, object),
        requiredString(context, args, 0, "append"),
        requiredString(context, args, 1, "append"),
      );
      return realm.primitive(undefined);
    }),
  );
  headersInterface.method("delete", 1, (thisValue, args) =>
    operation(context, () => {
      const object = headersObject(thisValue, "delete");
      stateFor(headersStates, object).values.delete(
        headerName(requiredString(context, args, 0, "delete")),
      );
      return realm.primitive(undefined);
    }),
  );
  headersInterface.method("get", 1, (thisValue, args) =>
    operation(context, () => {
      const object = headersObject(thisValue, "get");
      return realm.primitive(
        stateFor(headersStates, object).values.get(
          headerName(requiredString(context, args, 0, "get")),
        ) ?? null,
      );
    }),
  );
  headersInterface.method("has", 1, (thisValue, args) =>
    operation(context, () => {
      const object = headersObject(thisValue, "has");
      return realm.primitive(
        stateFor(headersStates, object).values.has(
          headerName(requiredString(context, args, 0, "has")),
        ),
      );
    }),
  );
  headersInterface.method("set", 2, (thisValue, args) =>
    operation(context, () => {
      const object = headersObject(thisValue, "set");
      stateFor(headersStates, object).values.set(
        headerName(requiredString(context, args, 0, "set")),
        headerValue(requiredString(context, args, 1, "set")),
      );
      return realm.primitive(undefined);
    }),
  );
  for (const kind of ["entries", "keys", "values"] as const) {
    headersInterface.method(kind, 0, (thisValue) =>
      operation(context, () => {
        const object = headersObject(thisValue, kind);
        const values = headerEntries(object).map(([name, value]) =>
          kind === "entries"
            ? realm.array([realm.primitive(name), realm.primitive(value)])
            : realm.primitive(kind === "keys" ? name : value),
        );
        return unwrap(realm.iterator(values));
      }),
    );
  }
  headersInterface.iterator((thisValue) =>
    operation(context, () => {
      const object = headersObject(thisValue, "iterator");
      return unwrap(
        realm.iterator(
          headerEntries(object).map(([name, value]) =>
            realm.array([realm.primitive(name), realm.primitive(value)]),
          ),
        ),
      );
    }),
  );
  headersInterface.method("forEach", 1, (thisValue, args) =>
    operation(context, () => {
      const object = headersObject(thisValue, "forEach");
      const callback = args[0] === undefined ? null : realm.callable(args[0]);
      if (callback === null) {
        throw typeError(context, "callback must be callable");
      }
      const thisArg = args[1] ?? realm.primitive(undefined);
      for (const [name, value] of headerEntries(object)) {
        unwrap(
          realm.call(callback, thisArg, [
            realm.primitive(value),
            realm.primitive(name),
            object,
          ]),
        );
      }
      return realm.primitive(undefined);
    }),
  );

  const createRequest = (
    input?: RealmValue,
    init?: RealmValue,
  ): RealmObject => {
    if (input === undefined) {
      throw typeError(context, "Request requires an input");
    }
    const inputObject = realm.object(input);
    const source =
      inputObject === null ? undefined : requestStates.get(inputObject);
    const initObject = dictionary(
      context,
      init,
      "Request init must be an object",
    );
    const option = (name: string) =>
      initObject === null ? undefined : unwrap(realm.get(initObject, name));
    const url =
      source?.url ?? resolveURL(string(context, input), context.window.url);
    const method = normalizedMethod(
      optionalString(context, option("method"), source?.method ?? "GET"),
    );
    const headersInit = option("headers");
    const headers = createHeaders(
      headersInit === undefined || realm.isUndefined(headersInit)
        ? source?.headers
        : headersInit,
    );
    const bodyValue = option("body");
    const body =
      bodyValue === undefined || realm.isUndefined(bodyValue)
        ? copyBytes(source?.body ?? null)
        : encodeUTF8(string(context, bodyValue));
    if ((method === "GET" || method === "HEAD") && body !== null) {
      throw typeError(context, "GET and HEAD requests cannot have a body");
    }
    if (
      bodyValue !== undefined &&
      !realm.isUndefined(bodyValue) &&
      !stateFor(headersStates, headers).values.has("content-type")
    ) {
      stateFor(headersStates, headers).values.set(
        "content-type",
        "text/plain;charset=UTF-8",
      );
    }
    const keepalive = option("keepalive");
    const object = requestInterface.create();
    requestStates.set(object, {
      url,
      method,
      headers,
      body,
      signal: option("signal") ?? source?.signal ?? realm.primitive(undefined),
      referrer: optionalString(
        context,
        option("referrer"),
        source?.referrer ?? "about:client",
      ),
      referrerPolicy: optionalString(
        context,
        option("referrerPolicy"),
        source?.referrerPolicy ?? "",
      ),
      mode: optionalString(context, option("mode"), source?.mode ?? "cors"),
      credentials: optionalString(
        context,
        option("credentials"),
        source?.credentials ?? "same-origin",
      ),
      cache: optionalString(
        context,
        option("cache"),
        source?.cache ?? "default",
      ),
      redirect: optionalString(
        context,
        option("redirect"),
        source?.redirect ?? "follow",
      ),
      integrity: optionalString(
        context,
        option("integrity"),
        source?.integrity ?? "",
      ),
      keepalive:
        keepalive === undefined || realm.isUndefined(keepalive)
          ? (source?.keepalive ?? false)
          : realm.boolean(keepalive),
      bodyUsed: false,
    });
    return object;
  };

  const requestInterface = realm.defineInterface(
    "Request",
    1,
    (_thisValue, args) =>
      operation(context, () => createRequest(args[0], args[1])),
  );
  for (const name of [
    "url",
    "method",
    "headers",
    "signal",
    "referrer",
    "referrerPolicy",
    "mode",
    "credentials",
    "cache",
    "redirect",
    "integrity",
    "keepalive",
    "bodyUsed",
  ] as const) {
    requestInterface.attribute(name, (thisValue) =>
      operation(context, () => {
        const object = requestObject(thisValue, name);
        return value(context, stateFor(requestStates, object)[name]);
      }),
    );
  }
  requestInterface.attribute("destination", (thisValue) =>
    operation(context, () => {
      requestObject(thisValue, "destination");
      return realm.primitive("");
    }),
  );
  requestInterface.attribute("body", (thisValue) =>
    operation(context, () => {
      requestObject(thisValue, "body");
      return realm.primitive(null);
    }),
  );
  installBodyMethods(context, requestInterface, requestStates, requestObject);
  requestInterface.method("clone", 0, (thisValue) =>
    operation(context, () => {
      const object = requestObject(thisValue, "clone");
      if (stateFor(requestStates, object).bodyUsed) {
        throw typeError(context, "Body has already been consumed");
      }
      return createRequest(object);
    }),
  );

  const createResponseObject = (state: ResponseState): RealmObject => {
    const object = responseInterface.create();
    responseStates.set(object, state);
    return object;
  };
  const createResponse = (
    bodyValue?: RealmValue,
    init?: RealmValue,
  ): RealmObject => {
    const initObject = dictionary(
      context,
      init,
      "Response init must be an object",
    );
    const option = (name: string) =>
      initObject === null ? undefined : unwrap(realm.get(initObject, name));
    const statusValue = option("status");
    const status =
      statusValue === undefined || realm.isUndefined(statusValue)
        ? 200
        : unwrap(realm.number(statusValue));
    if (!Number.isInteger(status) || status < 200 || status > 599) {
      throw rangeError(context, "Invalid response status");
    }
    const statusText = optionalString(context, option("statusText"), "");
    if (/[\0\r\n]/.test(statusText)) {
      throw typeError(context, "Invalid response status text");
    }
    const body =
      bodyValue === undefined ||
      realm.isUndefined(bodyValue) ||
      realm.isNull(bodyValue)
        ? null
        : encodeUTF8(string(context, bodyValue));
    if ([204, 205, 304].includes(status) && body !== null) {
      throw typeError(context, "This status cannot have a body");
    }
    const headers = createHeaders(option("headers"));
    if (
      body !== null &&
      !stateFor(headersStates, headers).values.has("content-type")
    ) {
      stateFor(headersStates, headers).values.set(
        "content-type",
        "text/plain;charset=UTF-8",
      );
    }
    return createResponseObject({
      type: "default",
      url: "",
      redirected: false,
      status,
      statusText,
      headers,
      body,
      bodyUsed: false,
    });
  };

  const responseInterface = realm.defineInterface(
    "Response",
    0,
    (_thisValue, args) =>
      operation(context, () => createResponse(args[0], args[1])),
  );
  for (const name of [
    "type",
    "url",
    "redirected",
    "status",
    "statusText",
    "headers",
    "bodyUsed",
  ] as const) {
    responseInterface.attribute(name, (thisValue) =>
      operation(context, () => {
        const object = responseObject(thisValue, name);
        return value(context, stateFor(responseStates, object)[name]);
      }),
    );
  }
  responseInterface.attribute("ok", (thisValue) =>
    operation(context, () => {
      const status = stateFor(
        responseStates,
        responseObject(thisValue, "ok"),
      ).status;
      return realm.primitive(status >= 200 && status <= 299);
    }),
  );
  responseInterface.attribute("body", (thisValue) =>
    operation(context, () => {
      responseObject(thisValue, "body");
      return realm.primitive(null);
    }),
  );
  installBodyMethods(
    context,
    responseInterface,
    responseStates,
    responseObject,
  );
  responseInterface.method("clone", 0, (thisValue) =>
    operation(context, () => {
      const state = stateFor(
        responseStates,
        responseObject(thisValue, "clone"),
      );
      if (state.bodyUsed) {
        throw typeError(context, "Body has already been consumed");
      }
      return createResponseObject({
        ...state,
        headers: createHeaders(state.headers),
        body: copyBytes(state.body),
        bodyUsed: false,
      });
    }),
  );
  responseInterface.staticMethod("error", 0, () =>
    operation(context, () =>
      createResponseObject({
        type: "error",
        url: "",
        redirected: false,
        status: 0,
        statusText: "",
        headers: createHeaders(),
        body: null,
        bodyUsed: false,
      }),
    ),
  );
  responseInterface.staticMethod("redirect", 1, (_thisValue, args) =>
    operation(context, () => {
      const status =
        args[1] === undefined ? 302 : unwrap(realm.number(args[1]));
      if (![301, 302, 303, 307, 308].includes(status)) {
        throw rangeError(context, "Invalid redirect status");
      }
      const headers = createHeaders();
      stateFor(headersStates, headers).values.set(
        "location",
        resolveURL(
          requiredString(context, args, 0, "redirect"),
          context.window.url,
        ),
      );
      return createResponseObject({
        type: "default",
        url: "",
        redirected: false,
        status,
        statusText: "",
        headers,
        body: null,
        bodyUsed: false,
      });
    }),
  );
  responseInterface.staticMethod("json", 1, (_thisValue, args) =>
    operation(context, () => {
      if (args[0] === undefined) {
        throw typeError(context, "Response.json requires data");
      }
      const response = createResponse(
        realm.primitive(unwrap(realm.stringifyJSON(args[0]))),
        args[1],
      );
      const headers = stateFor(responseStates, response).headers;
      stateFor(headersStates, headers).values.set(
        "content-type",
        "application/json",
      );
      return response;
    }),
  );

  realm.defineGlobalFunction("fetch", 1, (_thisValue, args) =>
    operation(context, () => {
      const request = createRequest(args[0], args[1]);
      const state = stateFor(requestStates, request);
      if (signalAborted(context, state.signal)) {
        throw typeError(context, "The operation was aborted");
      }
      const capability = realm.promise();
      const cancellation = new FetchCancellation(false);
      void network
        .request({
          url: state.url,
          method: state.method,
          headers: headerEntries(state.headers),
          body: state.body,
          cancellation,
        })
        .then(
          (response) => {
            if (!context.window.isActive()) {
              cancellation.abort();
              return;
            }
            context.tasks.enqueue(() =>
              operation(context, () => {
                const headers = createHeaders();
                for (const [name, headerValueInput] of response.headers) {
                  appendHeader(
                    stateFor(headersStates, headers),
                    name,
                    headerValueInput,
                  );
                }
                return unwrap(
                  capability.resolve(
                    createResponseObject({
                      type: "default",
                      url: response.url,
                      redirected: false,
                      status: response.status,
                      statusText: response.statusText,
                      headers,
                      body: copyBytes(response.body),
                      bodyUsed: false,
                    }),
                  ),
                );
              }),
            );
          },
          (error: unknown) => {
            if (!context.window.isActive()) {
              cancellation.abort();
              return;
            }
            context.tasks.enqueue(() =>
              capability.reject(realm.createTypeError(errorMessage(error))),
            );
          },
        );
      return capability.promise;
    }),
  );
}

function installBodyMethods<T extends BodyState>(
  context: WindowExtensionContext,
  interfaceObject: RealmInterface,
  states: WeakMap<RealmObject, T>,
  branded: (value: RealmValue, operationName: string) => RealmObject,
): void {
  for (const kind of ["text", "json", "arrayBuffer"] as const) {
    interfaceObject.method(kind, 0, (thisValue) =>
      operation(context, () => {
        const state = stateFor(states, branded(thisValue, kind));
        if (state.bodyUsed) {
          throw typeError(context, "Body has already been consumed");
        }
        state.bodyUsed = true;
        const bytes = state.body ?? new Uint8Array();
        const result =
          kind === "arrayBuffer"
            ? unwrap(context.realm.arrayBuffer(bytes))
            : kind === "json"
              ? unwrap(context.realm.parseJSON(decodeUTF8(bytes)))
              : context.realm.primitive(decodeUTF8(bytes));
        return resolvedPromise(context, result).promise;
      }),
    );
  }
}

function resolvedPromise(
  context: WindowExtensionContext,
  result: RealmValue,
): RealmPromiseCapability {
  const capability = context.realm.promise();
  unwrap(capability.resolve(result));
  return capability;
}

function value(
  context: WindowExtensionContext,
  input: RealmValue | string | number | boolean,
): RealmValue {
  return typeof input === "object" ? input : context.realm.primitive(input);
}

function dictionary(
  context: WindowExtensionContext,
  input: RealmValue | undefined,
  message: string,
): RealmObject | null {
  if (input === undefined || context.realm.isUndefined(input)) {
    return null;
  }
  const object = context.realm.object(input);
  if (object === null) {
    throw typeError(context, message);
  }
  return object;
}

function brandedObject<T>(
  object: RealmObject | null,
  states: WeakMap<RealmObject, T>,
  name: string,
  operationName: string,
): RealmObject {
  if (object === null || !states.has(object)) {
    throw new TypeError(`Invalid ${name} receiver for ${operationName}`);
  }
  return object;
}

function operation(
  context: WindowExtensionContext,
  callback: () => RealmValue,
): RealmResult<RealmValue> {
  try {
    return { type: "normal", value: callback() };
  } catch (error: unknown) {
    return error instanceof RealmThrown
      ? { type: "throw", value: error.value }
      : {
          type: "throw",
          value: context.realm.createTypeError(errorMessage(error)),
        };
  }
}

class RealmThrown extends Error {
  constructor(readonly value: RealmValue) {
    super("Window realm operation threw");
  }
}

function stateFor<T>(states: WeakMap<RealmObject, T>, object: RealmObject): T {
  const state = states.get(object);
  if (state === undefined) {
    throw new TypeError("Realm object state is unavailable");
  }
  return state;
}

function unwrap<T>(result: RealmResult<T>): T {
  if (result.type === "throw") {
    throw new RealmThrown(result.value);
  }
  return result.value;
}

function typeError(
  context: WindowExtensionContext,
  message: string,
): RealmThrown {
  return new RealmThrown(context.realm.createTypeError(message));
}

function rangeError(
  context: WindowExtensionContext,
  message: string,
): RealmThrown {
  return new RealmThrown(context.realm.createRangeError(message));
}

function string(context: WindowExtensionContext, input: RealmValue): string {
  return unwrap(context.realm.string(input));
}

function requiredString(
  context: WindowExtensionContext,
  args: readonly RealmValue[],
  index: number,
  operationName: string,
): string {
  const input = args[index];
  if (input === undefined) {
    throw typeError(
      context,
      `${operationName} requires ${String(index + 1)} argument(s)`,
    );
  }
  return string(context, input);
}

function optionalString(
  context: WindowExtensionContext,
  input: RealmValue | undefined,
  fallback: string,
): string {
  return input === undefined || context.realm.isUndefined(input)
    ? fallback
    : string(context, input);
}

function headerName(input: string): string {
  if (!tokenPattern.test(input)) {
    throw new TypeError("Invalid header name");
  }
  return input.toLowerCase();
}

function headerValue(input: string): string {
  if (/[\0\r\n]/.test(input)) {
    throw new TypeError("Invalid header value");
  }
  return input.replace(/^[\t ]+|[\t ]+$/g, "");
}

function appendHeader(
  state: HeadersState,
  nameInput: string,
  valueInput: string,
): void {
  const name = headerName(nameInput);
  const value = headerValue(valueInput);
  const current = state.values.get(name);
  state.values.set(
    name,
    current === undefined ? value : `${current}, ${value}`,
  );
}

function normalizedMethod(input: string): string {
  if (!tokenPattern.test(input)) {
    throw new TypeError("Invalid request method");
  }
  const upper = input.toUpperCase();
  if (["CONNECT", "TRACE", "TRACK"].includes(upper)) {
    throw new TypeError("Forbidden request method");
  }
  return ["DELETE", "GET", "HEAD", "OPTIONS", "POST", "PUT"].includes(upper)
    ? upper
    : input;
}

function signalAborted(
  context: WindowExtensionContext,
  signal: RealmValue,
): boolean {
  if (context.realm.isUndefined(signal) || context.realm.isNull(signal)) {
    return false;
  }
  const object = context.realm.object(signal);
  return (
    object !== null &&
    context.realm.boolean(unwrap(context.realm.get(object, "aborted")))
  );
}

function copyBytes(input: Uint8Array | null): Uint8Array | null {
  return input === null ? null : new Uint8Array(input);
}

function resolveURL(input: string, base: string): string {
  const platform = globalThis as unknown as HostFetchPlatform;
  return new platform.URL(input, base).href;
}

function encodeUTF8(input: string): Uint8Array {
  const bytes: number[] = [];
  for (const character of input) {
    const point = character.codePointAt(0);
    if (point === undefined) {
      continue;
    }
    if (point <= 0x7f) {
      bytes.push(point);
    } else if (point <= 0x7ff) {
      bytes.push(0xc0 | (point >> 6), 0x80 | (point & 0x3f));
    } else if (point <= 0xffff) {
      bytes.push(
        0xe0 | (point >> 12),
        0x80 | ((point >> 6) & 0x3f),
        0x80 | (point & 0x3f),
      );
    } else {
      bytes.push(
        0xf0 | (point >> 18),
        0x80 | ((point >> 12) & 0x3f),
        0x80 | ((point >> 6) & 0x3f),
        0x80 | (point & 0x3f),
      );
    }
  }
  return Uint8Array.from(bytes);
}

function decodeUTF8(bytes: Uint8Array): string {
  let output = "";
  for (let index = 0; index < bytes.length;) {
    const first = bytes[index++];
    if (first === undefined) {
      break;
    }
    if (first <= 0x7f) {
      output += String.fromCodePoint(first);
      continue;
    }
    let point: number;
    let remaining: number;
    if ((first & 0xe0) === 0xc0) {
      point = first & 0x1f;
      remaining = 1;
    } else if ((first & 0xf0) === 0xe0) {
      point = first & 0x0f;
      remaining = 2;
    } else if ((first & 0xf8) === 0xf0) {
      point = first & 0x07;
      remaining = 3;
    } else {
      output += "\ufffd";
      continue;
    }
    let valid = true;
    for (let offset = 0; offset < remaining; offset += 1) {
      const next = bytes[index++];
      if (next === undefined || (next & 0xc0) !== 0x80) {
        valid = false;
        break;
      }
      point = (point << 6) | (next & 0x3f);
    }
    output += valid ? String.fromCodePoint(point) : "\ufffd";
  }
  return output;
}

class HostFetchNetwork implements HostNetwork {
  constructor(readonly platform: HostFetchPlatform) {}

  async request(request: HostNetworkRequest): Promise<HostNetworkResponse> {
    const controller = new this.platform.AbortController();
    const unsubscribe = request.cancellation.onAbort(() => {
      controller.abort();
    });
    if (request.cancellation.aborted) {
      controller.abort();
    }
    try {
      const response = await this.platform.fetch(request.url, {
        method: request.method,
        headers: request.headers,
        ...(request.body === null ? {} : { body: request.body }),
        signal: controller.signal,
      });
      return {
        url: response.url,
        status: response.status,
        statusText: response.statusText,
        headers: Array.from(response.headers, ([name, headerValueInput]) => [
          name,
          headerValueInput,
        ]),
        body: new Uint8Array(await response.arrayBuffer()),
      };
    } finally {
      unsubscribe();
    }
  }
}

class FetchCancellation implements HostCancellation {
  readonly #callbacks = new Set<() => void>();
  #aborted: boolean;

  constructor(aborted: boolean) {
    this.#aborted = aborted;
  }

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
    this.#callbacks.clear();
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
