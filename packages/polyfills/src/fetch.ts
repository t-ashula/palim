import { createWindowExtension, hostService, realmNormal } from "./index.js";
import type { WindowExtension } from "./index.js";
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

type HostAbortSignal = object;

interface HostAbortController {
  readonly signal: HostAbortSignal;
  abort(): void;
}

interface HostFetchInit {
  readonly method: string;
  readonly headers: readonly (readonly [string, string])[];
  readonly body?: Uint8Array;
  readonly signal: HostAbortSignal;
}

interface HostFetchPlatform {
  fetch(input: string, init: HostFetchInit): Promise<HostFetchResponse>;
  AbortController: new () => HostAbortController;
}

interface SerializedFetchRequest {
  readonly url: string;
  readonly method: string;
  readonly headers: readonly (readonly [string, string])[];
  readonly body: readonly number[] | null;
  readonly aborted: boolean;
}

let nextBridgeId = 0;

export function fetchPolyfill(): WindowExtension {
  const network = new HostFetchNetwork(
    globalThis as unknown as HostFetchPlatform,
  );
  return createWindowExtension(
    (context) => {
      const network = context.host.require(hostNetworkService);
      const bridgeName = `__palim_fetch_${String(nextBridgeId)}`;
      nextBridgeId += 1;
      const bridge = context.realm.function(
        "hostFetch",
        1,
        (_thisValue, argumentsList) => {
          const argument = argumentsList[0];
          if (argument === undefined) {
            return {
              type: "throw",
              value: context.realm.createTypeError(
                "The fetch host operation requires a request",
              ),
            };
          }
          const text = context.realm.string(argument);
          if (text.type === "throw") {
            return text;
          }
          let request: SerializedFetchRequest;
          try {
            request = parseRequest(text.value);
          } catch (error) {
            return {
              type: "throw",
              value: context.realm.createTypeError(errorMessage(error)),
            };
          }
          const capability = context.realm.promise();
          const cancellation = new FetchCancellation(request.aborted);
          const hostRequest: HostNetworkRequest = {
            url: request.url,
            method: request.method,
            headers: request.headers,
            body: request.body === null ? null : Uint8Array.from(request.body),
            cancellation,
          };
          void network.request(hostRequest).then(
            (response) => {
              if (!context.window.isActive()) {
                cancellation.abort();
                return;
              }
              context.tasks.enqueue(() =>
                capability.resolve(
                  context.realm.primitive(
                    JSON.stringify(serializeResponse(response)),
                  ),
                ),
              );
            },
            (error: unknown) => {
              if (!context.window.isActive()) {
                cancellation.abort();
                return;
              }
              context.tasks.enqueue(() =>
                capability.reject(
                  context.realm.createTypeError(errorMessage(error)),
                ),
              );
            },
          );
          return realmNormal(capability.promise);
        },
      );
      context.realm.defineGlobal(bridgeName, bridge);
      const installed = context.realm.evaluate(fetchRealmSource(bridgeName));
      if (installed.type === "throw") {
        throw new TypeError("Could not install the Fetch polyfill");
      }
    },
    [hostService(hostNetworkService, network)],
  );
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
        headers: Array.from(response.headers, ([name, value]) => [name, value]),
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
    return () => {
      this.#callbacks.delete(callback);
    };
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

function parseRequest(serialized: string): SerializedFetchRequest {
  const value: unknown = JSON.parse(serialized);
  if (typeof value !== "object" || value === null) {
    throw new TypeError("Invalid fetch request");
  }
  const record = value as Record<string, unknown>;
  if (
    typeof record.url !== "string" ||
    typeof record.method !== "string" ||
    !Array.isArray(record.headers) ||
    typeof record.aborted !== "boolean" ||
    !(record.body === null || Array.isArray(record.body))
  ) {
    throw new TypeError("Invalid fetch request");
  }
  const headers = record.headers.map((entry) => {
    if (
      !Array.isArray(entry) ||
      entry.length !== 2 ||
      typeof entry[0] !== "string" ||
      typeof entry[1] !== "string"
    ) {
      throw new TypeError("Invalid fetch request headers");
    }
    return [entry[0], entry[1]] as const;
  });
  const body =
    record.body === null
      ? null
      : record.body.map((byte) => {
          if (
            typeof byte !== "number" ||
            !Number.isInteger(byte) ||
            byte < 0 ||
            byte > 255
          ) {
            throw new TypeError("Invalid fetch request body");
          }
          return byte;
        });
  return {
    url: record.url,
    method: record.method,
    headers,
    body,
    aborted: record.aborted,
  };
}

function serializeResponse(response: HostNetworkResponse): {
  readonly url: string;
  readonly status: number;
  readonly statusText: string;
  readonly headers: readonly (readonly [string, string])[];
  readonly body: readonly number[];
} {
  return {
    url: response.url,
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
    body: Array.from(response.body),
  };
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function fetchRealmSource(bridgeName: string): string {
  const bridgeProperty = JSON.stringify(bridgeName);
  return `(() => {
    "use strict";
    const hostFetch = globalThis[${bridgeProperty}];
    delete globalThis[${bridgeProperty}];

    const headerLists = new WeakMap();
    const requestStates = new WeakMap();
    const responseStates = new WeakMap();
    const tokenPattern = /^[!#$%&'*+.^_|~0-9A-Za-z-]+$/;

    function headerName(value) {
      const name = String(value);
      if (!tokenPattern.test(name)) throw new TypeError("Invalid header name");
      return name.toLowerCase();
    }

    function headerValue(value) {
      const text = String(value);
      if (/[\\0\\r\\n]/.test(text)) throw new TypeError("Invalid header value");
      return text.replace(/^[\\t ]+|[\\t ]+$/g, "");
    }

    function headersState(value, operation) {
      const state = headerLists.get(value);
      if (state === undefined) throw new TypeError("Invalid Headers receiver for " + operation);
      return state;
    }

    function fillHeaders(target, init) {
      if (init === undefined) return;
      if ((typeof init !== "object" && typeof init !== "function") || init === null) {
        throw new TypeError("Headers initializer must be an object");
      }
      const iterator = init[Symbol.iterator];
      if (iterator != null) {
        for (const pair of init) {
          if ((typeof pair !== "object" && typeof pair !== "function") || pair === null) {
            throw new TypeError("Header pair must be iterable");
          }
          const values = Array.from(pair);
          if (values.length !== 2) throw new TypeError("Header pair must contain two items");
          target.append(values[0], values[1]);
        }
        return;
      }
      for (const name of Object.keys(init)) target.append(name, init[name]);
    }

    class Headers {
      constructor(init = undefined) {
        headerLists.set(this, new Map());
        fillHeaders(this, init);
      }
      append(name, value) {
        const state = headersState(this, "append");
        const key = headerName(name);
        const item = headerValue(value);
        state.set(key, state.has(key) ? state.get(key) + ", " + item : item);
      }
      delete(name) {
        headersState(this, "delete").delete(headerName(name));
      }
      get(name) {
        const state = headersState(this, "get");
        const value = state.get(headerName(name));
        return value === undefined ? null : value;
      }
      has(name) {
        return headersState(this, "has").has(headerName(name));
      }
      set(name, value) {
        headersState(this, "set").set(headerName(name), headerValue(value));
      }
      *entries() {
        const state = headersState(this, "entries");
        const names = Array.from(state.keys()).sort();
        for (const name of names) if (state.has(name)) yield [name, state.get(name)];
      }
      *keys() {
        for (const pair of this.entries()) yield pair[0];
      }
      *values() {
        for (const pair of this.entries()) yield pair[1];
      }
      forEach(callback, thisArg = undefined) {
        if (typeof callback !== "function") throw new TypeError("callback must be callable");
        for (const pair of this.entries()) callback.call(thisArg, pair[1], pair[0], this);
      }
      [Symbol.iterator]() {
        return this.entries();
      }
    }

    function encodeUTF8(text) {
      const bytes = [];
      for (const character of String(text)) {
        const point = character.codePointAt(0);
        if (point <= 0x7f) bytes.push(point);
        else if (point <= 0x7ff) bytes.push(0xc0 | (point >> 6), 0x80 | (point & 0x3f));
        else if (point <= 0xffff) bytes.push(0xe0 | (point >> 12), 0x80 | ((point >> 6) & 0x3f), 0x80 | (point & 0x3f));
        else bytes.push(0xf0 | (point >> 18), 0x80 | ((point >> 12) & 0x3f), 0x80 | ((point >> 6) & 0x3f), 0x80 | (point & 0x3f));
      }
      return new Uint8Array(bytes);
    }

    function decodeUTF8(bytes) {
      let result = "";
      for (let index = 0; index < bytes.length;) {
        const first = bytes[index++];
        if (first <= 0x7f) {
          result += String.fromCodePoint(first);
          continue;
        }
        let point;
        let remaining;
        if ((first & 0xe0) === 0xc0) { point = first & 0x1f; remaining = 1; }
        else if ((first & 0xf0) === 0xe0) { point = first & 0x0f; remaining = 2; }
        else if ((first & 0xf8) === 0xf0) { point = first & 0x07; remaining = 3; }
        else { result += "\\ufffd"; continue; }
        let valid = true;
        for (let offset = 0; offset < remaining; offset += 1) {
          const next = bytes[index++];
          if (next === undefined || (next & 0xc0) !== 0x80) { valid = false; break; }
          point = (point << 6) | (next & 0x3f);
        }
        result += valid ? String.fromCodePoint(point) : "\\ufffd";
      }
      return result;
    }

    function bodyBytes(body) {
      if (body === null || body === undefined) return null;
      if (body instanceof Uint8Array) return new Uint8Array(body);
      if (body instanceof ArrayBuffer) return new Uint8Array(body.slice(0));
      if (ArrayBuffer.isView(body)) return new Uint8Array(body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength));
      return encodeUTF8(String(body));
    }

    function addBodyContentType(headers, body) {
      if (body !== null && body !== undefined && typeof body === "string" && !headers.has("content-type")) {
        headers.set("content-type", "text/plain;charset=UTF-8");
      }
    }

    async function consumeBody(owner, states, kind) {
      const state = states.get(owner);
      if (state === undefined) throw new TypeError("Invalid body receiver");
      if (state.bodyUsed) throw new TypeError("Body has already been consumed");
      state.bodyUsed = true;
      const bytes = state.body === null ? new Uint8Array() : new Uint8Array(state.body);
      if (kind === "arrayBuffer") return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
      const text = decodeUTF8(bytes);
      return kind === "json" ? JSON.parse(text) : text;
    }

    function normalizedMethod(value) {
      const method = String(value);
      if (!tokenPattern.test(method)) throw new TypeError("Invalid request method");
      const upper = method.toUpperCase();
      if (upper === "CONNECT" || upper === "TRACE" || upper === "TRACK") throw new TypeError("Forbidden request method");
      return ["DELETE", "GET", "HEAD", "OPTIONS", "POST", "PUT"].includes(upper) ? upper : method;
    }

    class Request {
      constructor(input, init = {}) {
        if (arguments.length === 0) throw new TypeError("Request requires an input");
        if (init === null || typeof init !== "object") throw new TypeError("Request init must be an object");
        const source = requestStates.get(input);
        const url = source === undefined ? new URL(String(input), document.baseURI).href : source.url;
        const method = normalizedMethod(init.method === undefined ? (source === undefined ? "GET" : source.method) : init.method);
        const headers = new Headers(init.headers === undefined ? (source === undefined ? undefined : source.headers) : init.headers);
        const suppliedBody = Object.prototype.hasOwnProperty.call(init, "body");
        const rawBody = suppliedBody ? init.body : (source === undefined ? null : source.body);
        const body = bodyBytes(rawBody);
        if ((method === "GET" || method === "HEAD") && body !== null) throw new TypeError("GET and HEAD requests cannot have a body");
        addBodyContentType(headers, suppliedBody ? init.body : null);
        const controller = new AbortController();
        requestStates.set(this, {
          url,
          method,
          headers,
          body,
          bodyUsed: false,
          signal: init.signal === undefined ? (source === undefined ? controller.signal : source.signal) : init.signal,
          referrer: init.referrer === undefined ? (source === undefined ? "about:client" : source.referrer) : (init.referrer === "" ? "" : new URL(String(init.referrer), document.baseURI).href),
          referrerPolicy: init.referrerPolicy === undefined ? (source === undefined ? "" : source.referrerPolicy) : String(init.referrerPolicy),
          mode: init.mode === undefined ? (source === undefined ? "cors" : source.mode) : String(init.mode),
          credentials: init.credentials === undefined ? (source === undefined ? "same-origin" : source.credentials) : String(init.credentials),
          cache: init.cache === undefined ? (source === undefined ? "default" : source.cache) : String(init.cache),
          redirect: init.redirect === undefined ? (source === undefined ? "follow" : source.redirect) : String(init.redirect),
          integrity: init.integrity === undefined ? (source === undefined ? "" : source.integrity) : String(init.integrity),
          keepalive: init.keepalive === undefined ? (source === undefined ? false : source.keepalive) : Boolean(init.keepalive)
        });
      }
      get method() { return requestStates.get(this).method; }
      get url() { return requestStates.get(this).url; }
      get headers() { return requestStates.get(this).headers; }
      get destination() { return ""; }
      get referrer() { return requestStates.get(this).referrer; }
      get referrerPolicy() { return requestStates.get(this).referrerPolicy; }
      get mode() { return requestStates.get(this).mode; }
      get credentials() { return requestStates.get(this).credentials; }
      get cache() { return requestStates.get(this).cache; }
      get redirect() { return requestStates.get(this).redirect; }
      get integrity() { return requestStates.get(this).integrity; }
      get keepalive() { return requestStates.get(this).keepalive; }
      get signal() { return requestStates.get(this).signal; }
      get body() { return null; }
      get bodyUsed() { return requestStates.get(this).bodyUsed; }
      clone() {
        const state = requestStates.get(this);
        if (state.bodyUsed) throw new TypeError("Body has already been consumed");
        return new Request(this);
      }
      text() { return consumeBody(this, requestStates, "text"); }
      json() { return consumeBody(this, requestStates, "json"); }
      arrayBuffer() { return consumeBody(this, requestStates, "arrayBuffer"); }
    }

    class Response {
      constructor(body = null, init = {}) {
        if (init === null || typeof init !== "object") throw new TypeError("Response init must be an object");
        const status = init.status === undefined ? 200 : Number(init.status);
        if (!Number.isInteger(status) || status < 200 || status > 599) throw new RangeError("Invalid response status");
        if ((status === 204 || status === 205 || status === 304) && body !== null) throw new TypeError("This status cannot have a body");
        const statusText = init.statusText === undefined ? "" : String(init.statusText);
        if (/[\\0\\r\\n]/.test(statusText)) throw new TypeError("Invalid response status text");
        const headers = new Headers(init.headers);
        addBodyContentType(headers, body);
        responseStates.set(this, {
          type: "default",
          url: "",
          redirected: false,
          status,
          statusText,
          headers,
          body: bodyBytes(body),
          bodyUsed: false
        });
      }
      get type() { return responseStates.get(this).type; }
      get url() { return responseStates.get(this).url; }
      get redirected() { return responseStates.get(this).redirected; }
      get status() { return responseStates.get(this).status; }
      get ok() { const status = this.status; return status >= 200 && status <= 299; }
      get statusText() { return responseStates.get(this).statusText; }
      get headers() { return responseStates.get(this).headers; }
      get body() { return null; }
      get bodyUsed() { return responseStates.get(this).bodyUsed; }
      clone() {
        const state = responseStates.get(this);
        if (state.bodyUsed) throw new TypeError("Body has already been consumed");
        const clone = new Response(state.body, { status: state.status, statusText: state.statusText, headers: state.headers });
        const target = responseStates.get(clone);
        target.type = state.type;
        target.url = state.url;
        target.redirected = state.redirected;
        return clone;
      }
      text() { return consumeBody(this, responseStates, "text"); }
      json() { return consumeBody(this, responseStates, "json"); }
      arrayBuffer() { return consumeBody(this, responseStates, "arrayBuffer"); }
      static error() {
        const response = new Response();
        const state = responseStates.get(response);
        state.type = "error";
        state.status = 0;
        return response;
      }
      static redirect(url, status = 302) {
        const code = Number(status);
        if (![301, 302, 303, 307, 308].includes(code)) throw new RangeError("Invalid redirect status");
        return new Response(null, { status: code, headers: { location: new URL(String(url), document.baseURI).href } });
      }
      static json(data, init = {}) {
        const headers = new Headers(init.headers);
        if (!headers.has("content-type")) headers.set("content-type", "application/json");
        return new Response(JSON.stringify(data), { ...init, headers });
      }
    }

    function responseFromNetwork(data) {
      const response = new Response(new Uint8Array(data.body), {
        status: data.status,
        statusText: data.statusText,
        headers: data.headers
      });
      const state = responseStates.get(response);
      state.url = String(data.url);
      return response;
    }

    async function fetch(input, init = undefined) {
      const request = new Request(input, init === undefined ? {} : init);
      const state = requestStates.get(request);
      if (state.signal && state.signal.aborted) throw new TypeError("The operation was aborted");
      const serialized = JSON.stringify({
        url: state.url,
        method: state.method,
        headers: Array.from(state.headers),
        body: state.body === null ? null : Array.from(state.body),
        aborted: Boolean(state.signal && state.signal.aborted)
      });
      const response = JSON.parse(await hostFetch(serialized));
      return responseFromNetwork(response);
    }

    Object.defineProperties(globalThis, {
      Headers: { configurable: true, writable: true, value: Headers },
      Request: { configurable: true, writable: true, value: Request },
      Response: { configurable: true, writable: true, value: Response },
      fetch: { configurable: true, writable: true, value: fetch }
    });
  })()`;
}
