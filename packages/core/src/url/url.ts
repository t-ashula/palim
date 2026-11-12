import { userinfoPercentEncode, utf8PercentEncode } from "./encoding.js";
import { parseHost, serializeHost } from "./host.js";
import {
  parseURL,
  serializeOrigin,
  serializeURL,
  setURLFragment,
  setURLPathname,
  setURLQuery,
} from "./parser.js";
import type { URLRecord } from "./record.js";
import {
  cloneURLRecord,
  defaultPort,
  hasOpaquePath,
  isSpecialScheme,
} from "./record.js";
import {
  replaceURLSearchParams,
  setURLSearchParamsUpdate,
  URLSearchParams,
} from "./url-search-params.js";

function scalarString(value: unknown): string {
  if (typeof value === "symbol") {
    throw new TypeError("Cannot convert a Symbol value to a string");
  }
  return String(value).toWellFormed();
}

function parserString(value: unknown): string {
  return scalarString(value).replaceAll(/[\t\n\r]/gu, "");
}

function isEmptyHost(record: URLRecord): boolean {
  return (
    record.host === null ||
    ((record.host.type === "domain" || record.host.type === "opaque") &&
      record.host.value === "")
  );
}

function hostInputEnd(value: string, special: boolean): number {
  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];
    if (
      character === "/" ||
      character === "?" ||
      character === "#" ||
      (special && character === "\\")
    ) {
      return index;
    }
  }
  return value.length;
}

function splitHostAndPort(
  value: string,
): { readonly host: string; readonly port: string | null } | null {
  if (value.startsWith("[")) {
    const closing = value.indexOf("]");
    if (closing < 0) {
      return null;
    }
    if (closing === value.length - 1) {
      return { host: value, port: null };
    }
    if (value[closing + 1] !== ":") {
      return null;
    }
    return {
      host: value.slice(0, closing + 1),
      port: value.slice(closing + 2),
    };
  }
  const colon = value.indexOf(":");
  return colon < 0
    ? { host: value, port: null }
    : { host: value.slice(0, colon), port: value.slice(colon + 1) };
}

function parsedPort(value: string): number | null | undefined {
  const digits = /^\d+/u.exec(value)?.[0];
  if (digits === undefined) {
    return undefined;
  }
  const port = Number(digits);
  return port <= 65535 ? port : undefined;
}

function setHost(
  record: URLRecord,
  value: unknown,
  includePort: boolean,
): void {
  if (hasOpaquePath(record)) {
    return;
  }
  const special = isSpecialScheme(record.scheme);
  const source = parserString(value);
  const input = source.slice(0, hostInputEnd(source, special));
  const parts = splitHostAndPort(input);
  if (parts === null) {
    return;
  }
  const hostSource = parts.host;
  const portSource = includePort ? parts.port : null;
  if (
    (!includePort && parts.port !== null) ||
    (hostSource === "" && parts.port !== null)
  ) {
    return;
  }
  if (
    hostSource === "" &&
    ((special && record.scheme !== "file") ||
      record.username !== "" ||
      record.password !== "" ||
      record.port !== null)
  ) {
    return;
  }
  if (record.scheme === "file" && portSource !== null) {
    return;
  }
  const host = parseHost(hostSource, !special);
  if (host === null) {
    return;
  }
  record.host =
    record.scheme === "file" &&
    host.type === "domain" &&
    host.value === "localhost"
      ? { type: "domain", value: "" }
      : host;
  if (portSource !== null && portSource !== "") {
    const port = parsedPort(portSource);
    if (port !== undefined) {
      record.port = port === defaultPort(record.scheme) ? null : port;
    }
  }
}

const RECORDS = new WeakMap<URL, URLRecord>();

function recordFor(url: URL): URLRecord {
  const record = RECORDS.get(url);
  if (record === undefined) {
    throw new TypeError("Invalid URL receiver");
  }
  return record;
}

export class URL {
  readonly #searchParams: URLSearchParams;

  constructor(input: unknown, base?: unknown) {
    const baseRecord =
      base === undefined ? null : parseURL(scalarString(base), null);
    if (base !== undefined && baseRecord === null) {
      throw new TypeError("Invalid base URL");
    }
    const record = parseURL(scalarString(input), baseRecord);
    if (record === null) {
      throw new TypeError("Invalid URL");
    }
    RECORDS.set(this, record);
    this.#searchParams = new URLSearchParams();
    replaceURLSearchParams(this.#searchParams, record.query ?? "");
    setURLSearchParamsUpdate(this.#searchParams, (value) => {
      recordFor(this).query = value === "" ? null : value;
    });
  }

  static canParse(input: unknown, base?: unknown): boolean {
    const baseRecord =
      base === undefined ? null : parseURL(scalarString(base), null);
    return (
      (base === undefined || baseRecord !== null) &&
      parseURL(scalarString(input), baseRecord) !== null
    );
  }

  static parse(input: unknown, base?: unknown): URL | null {
    try {
      return base === undefined ? new URL(input) : new URL(input, base);
    } catch {
      return null;
    }
  }

  get href(): string {
    return serializeURL(recordFor(this));
  }

  set href(value: string) {
    const parsed = parseURL(scalarString(value));
    if (parsed === null) {
      throw new TypeError("Invalid URL");
    }
    RECORDS.set(this, parsed);
    replaceURLSearchParams(this.#searchParams, parsed.query ?? "");
  }

  get origin(): string {
    return serializeOrigin(recordFor(this));
  }

  get protocol(): string {
    return `${recordFor(this).scheme}:`;
  }

  set protocol(value: string) {
    const source = parserString(value);
    const schemeSource = source.split(":", 1)[0] ?? "";
    if (!/^[A-Za-z][A-Za-z0-9+.-]*$/u.test(schemeSource)) {
      return;
    }
    const record = recordFor(this);
    const replacement = schemeSource.toLowerCase();
    if (isSpecialScheme(record.scheme) !== isSpecialScheme(replacement)) {
      return;
    }
    if (
      (replacement === "file" &&
        (record.username !== "" ||
          record.password !== "" ||
          record.port !== null)) ||
      (record.scheme === "file" && isEmptyHost(record))
    ) {
      return;
    }
    record.scheme = replacement;
    if (record.port === defaultPort(replacement)) {
      record.port = null;
    }
  }

  get username(): string {
    return recordFor(this).username;
  }

  set username(value: string) {
    const record = recordFor(this);
    if (
      !isEmptyHost(record) &&
      !hasOpaquePath(record) &&
      record.scheme !== "file"
    ) {
      record.username = utf8PercentEncode(
        scalarString(value),
        userinfoPercentEncode,
      );
    }
  }

  get password(): string {
    return recordFor(this).password;
  }

  set password(value: string) {
    const record = recordFor(this);
    if (
      !isEmptyHost(record) &&
      !hasOpaquePath(record) &&
      record.scheme !== "file"
    ) {
      record.password = utf8PercentEncode(
        scalarString(value),
        userinfoPercentEncode,
      );
    }
  }

  get host(): string {
    const record = recordFor(this);
    return record.host === null
      ? ""
      : `${serializeHost(record.host)}${record.port === null ? "" : `:${String(record.port)}`}`;
  }

  set host(value: string) {
    setHost(recordFor(this), value, true);
  }

  get hostname(): string {
    const host = recordFor(this).host;
    return host === null ? "" : serializeHost(host);
  }

  set hostname(value: string) {
    setHost(recordFor(this), value, false);
  }

  get port(): string {
    return recordFor(this).port?.toString() ?? "";
  }

  set port(value: string) {
    const record = recordFor(this);
    if (
      isEmptyHost(record) ||
      record.scheme === "file" ||
      hasOpaquePath(record)
    ) {
      return;
    }
    const raw = scalarString(value);
    const source = raw.replaceAll(/[\t\n\r]/gu, "");
    if (raw === "") {
      record.port = null;
      return;
    }
    const port = parsedPort(source);
    if (port !== undefined) {
      record.port = port === defaultPort(record.scheme) ? null : port;
    }
  }

  get pathname(): string {
    const path = recordFor(this).path;
    return typeof path === "string"
      ? path
      : path.map((segment) => `/${segment}`).join("");
  }

  set pathname(value: string) {
    const record = recordFor(this);
    setURLPathname(record, parserString(value));
  }

  get search(): string {
    const query = recordFor(this).query;
    return query === null || query === "" ? "" : `?${query}`;
  }

  set search(value: string) {
    const record = recordFor(this);
    const source = parserString(value);
    if (source === "") {
      setURLQuery(record, null);
    } else {
      setURLQuery(record, source.startsWith("?") ? source.slice(1) : source);
    }
    replaceURLSearchParams(this.#searchParams, record.query ?? "");
  }

  get searchParams(): URLSearchParams {
    return this.#searchParams;
  }

  get hash(): string {
    const fragment = recordFor(this).fragment;
    return fragment === null || fragment === "" ? "" : `#${fragment}`;
  }

  set hash(value: string) {
    const record = recordFor(this);
    const source = parserString(value);
    if (source === "") {
      setURLFragment(record, null);
      return;
    }
    setURLFragment(record, source.startsWith("#") ? source.slice(1) : source);
  }

  toJSON(): string {
    return this.href;
  }

  toString(): string {
    return this.href;
  }
}

export function urlRecord(url: URL): URLRecord {
  return cloneURLRecord(recordFor(url));
}
