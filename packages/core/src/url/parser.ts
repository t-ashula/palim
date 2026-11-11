import {
  c0ControlPercentEncode,
  fragmentPercentEncode,
  pathPercentEncode,
  queryPercentEncode,
  specialQueryPercentEncode,
  userinfoPercentEncode,
  utf8PercentEncode,
} from "./encoding.js";
import { parseHost, serializeHost } from "./host.js";
import {
  cloneURLRecord,
  defaultPort,
  emptyURLRecord,
  hasOpaquePath,
  isSpecialScheme,
} from "./record.js";
import type { URLRecord } from "./record.js";

function preprocess(input: string): string {
  return input
    .toWellFormed()
    .replaceAll(/[\t\n\r]/gu, "")
    .replace(/^[\u0000-\u0020]+|[\u0000-\u0020]+$/gu, "");
}

function splitFragment(input: string): [string, string | null] {
  const index = input.indexOf("#");
  return index < 0
    ? [input, null]
    : [input.slice(0, index), input.slice(index + 1)];
}

function splitQuery(input: string): [string, string | null] {
  const index = input.indexOf("?");
  return index < 0
    ? [input, null]
    : [input.slice(0, index), input.slice(index + 1)];
}

function encodeQuery(value: string, special: boolean): string {
  return utf8PercentEncode(
    value,
    special ? specialQueryPercentEncode : queryPercentEncode,
  );
}

function isSingleDot(value: string): boolean {
  return value === "." || value.toLowerCase() === "%2e";
}

function isDoubleDot(value: string): boolean {
  const lower = value.toLowerCase();
  return (
    value === ".." || lower === ".%2e" || lower === "%2e." || lower === "%2e%2e"
  );
}

function isWindowsDriveLetter(value: string): boolean {
  return /^[A-Za-z][:|]$/u.test(value);
}

function normalizedDriveLetter(value: string): string {
  return `${value[0] ?? ""}:`;
}

function shortenPath(url: URLRecord): void {
  if (typeof url.path === "string" || url.path.length === 0) {
    return;
  }
  if (
    url.scheme === "file" &&
    url.path.length === 1 &&
    isWindowsDriveLetter(url.path[0] ?? "")
  ) {
    return;
  }
  url.path.pop();
}

function parsePath(url: URLRecord, source: string, absolute: boolean): void {
  const special = isSpecialScheme(url.scheme);
  const normalized = special ? source.replaceAll("\\", "/") : source;
  if (typeof url.path === "string") {
    url.path = [];
  }
  if (absolute) {
    url.path = [];
  } else {
    shortenPath(url);
  }
  const pieces = normalized.split("/");
  if (absolute && pieces[0] === "") {
    pieces.shift();
  }
  for (const [index, rawPiece] of pieces.entries()) {
    const piece = utf8PercentEncode(rawPiece, pathPercentEncode);
    const last = index === pieces.length - 1;
    if (isDoubleDot(piece)) {
      shortenPath(url);
      if (last) {
        url.path.push("");
      }
    } else if (isSingleDot(piece)) {
      if (last) {
        url.path.push("");
      }
    } else {
      url.path.push(
        url.scheme === "file" &&
          url.path.length === 0 &&
          isWindowsDriveLetter(piece)
          ? normalizedDriveLetter(piece)
          : piece,
      );
    }
  }
}

export function setURLPathname(url: URLRecord, value: string): void {
  if (!hasOpaquePath(url)) {
    parsePath(url, value, true);
    if (
      url.path.length === 0 &&
      (isSpecialScheme(url.scheme) || url.host === null)
    ) {
      url.path = [""];
    }
  }
}

export function setURLQuery(url: URLRecord, value: string | null): void {
  url.query =
    value === null ? null : encodeQuery(value, isSpecialScheme(url.scheme));
}

export function setURLFragment(url: URLRecord, value: string | null): void {
  url.fragment =
    value === null ? null : utf8PercentEncode(value, fragmentPercentEncode);
}

function authorityEnd(input: string, special: boolean): number {
  for (let index = 0; index < input.length; index += 1) {
    const character = input[index] ?? "";
    if (
      character === "/" ||
      character === "?" ||
      character === "#" ||
      (special && character === "\\")
    ) {
      return index;
    }
  }
  return input.length;
}

function parseAuthority(url: URLRecord, authority: string): boolean {
  let hostAndPort = authority;
  const at = authority.lastIndexOf("@");
  if (at >= 0) {
    const userinfo = authority.slice(0, at).replaceAll("@", "%40");
    hostAndPort = authority.slice(at + 1);
    const colon = userinfo.indexOf(":");
    const username = colon < 0 ? userinfo : userinfo.slice(0, colon);
    const password = colon < 0 ? "" : userinfo.slice(colon + 1);
    url.username = utf8PercentEncode(username, userinfoPercentEncode);
    url.password = utf8PercentEncode(password, userinfoPercentEncode);
  }
  let hostSource = hostAndPort;
  let portSource: string | null = null;
  if (hostAndPort.startsWith("[")) {
    const closing = hostAndPort.indexOf("]");
    if (closing < 0) {
      return false;
    }
    hostSource = hostAndPort.slice(0, closing + 1);
    if (hostAndPort.length > closing + 1) {
      if (hostAndPort[closing + 1] !== ":") {
        return false;
      }
      portSource = hostAndPort.slice(closing + 2);
    }
  } else {
    const colon = hostAndPort.lastIndexOf(":");
    if (colon >= 0) {
      hostSource = hostAndPort.slice(0, colon);
      portSource = hostAndPort.slice(colon + 1);
    }
  }
  if (
    hostSource === "" &&
    ((isSpecialScheme(url.scheme) && url.scheme !== "file") ||
      at >= 0 ||
      portSource !== null)
  ) {
    return false;
  }
  const host = parseHost(hostSource, !isSpecialScheme(url.scheme));
  if (host === null) {
    return false;
  }
  url.host =
    url.scheme === "file" &&
    host.type === "domain" &&
    host.value === "localhost"
      ? { type: "domain", value: "" }
      : host;
  if (portSource !== null && url.scheme === "file") {
    return false;
  }
  if (portSource !== null && portSource !== "") {
    if (!/^\d+$/u.test(portSource)) {
      return false;
    }
    const port = Number(portSource);
    if (port > 65535) {
      return false;
    }
    url.port = port === defaultPort(url.scheme) ? null : port;
  }
  return true;
}

function parseAfterAuthority(url: URLRecord, input: string): URLRecord {
  const [withoutFragment, fragment] = splitFragment(input);
  const [path, query] = splitQuery(withoutFragment);
  if (path !== "" || isSpecialScheme(url.scheme)) {
    parsePath(url, path, true);
    if (path === "" && isSpecialScheme(url.scheme)) {
      url.path = [""];
    }
  }
  url.query =
    query === null ? null : encodeQuery(query, isSpecialScheme(url.scheme));
  url.fragment =
    fragment === null
      ? null
      : utf8PercentEncode(fragment, fragmentPercentEncode);
  return url;
}

function applyQueryAndFragment(
  url: URLRecord,
  query: string | null,
  fragment: string | null,
): URLRecord {
  url.query = query === null ? null : encodeQuery(query, true);
  url.fragment =
    fragment === null
      ? null
      : utf8PercentEncode(fragment, fragmentPercentEncode);
  return url;
}

function parseFile(input: string, base: URLRecord | null): URLRecord | null {
  if (base !== null && input === "") {
    const result = cloneURLRecord(base);
    result.fragment = null;
    return result;
  }
  if (base !== null && input.startsWith("#")) {
    const result = cloneURLRecord(base);
    result.fragment = utf8PercentEncode(input.slice(1), fragmentPercentEncode);
    return result;
  }
  if (base !== null && input.startsWith("?")) {
    const result = cloneURLRecord(base);
    const [query, fragment] = splitFragment(input.slice(1));
    return applyQueryAndFragment(result, query, fragment);
  }
  const [withoutFragment, fragment] = splitFragment(input);
  const [pathSource, query] = splitQuery(withoutFragment);
  const path = pathSource.replaceAll("\\", "/");
  const url = base === null ? emptyURLRecord() : cloneURLRecord(base);
  url.scheme = "file";
  url.username = "";
  url.password = "";
  url.port = null;
  url.query = null;
  url.fragment = null;

  const driveAtStart = /^[A-Za-z][:|](?:\/|$)/u.test(path);
  const leadingSlashes = /^\/*/u.exec(path)?.[0].length ?? 0;
  if (leadingSlashes >= 2) {
    const afterTwo = path.slice(2);
    const first = afterTwo.split("/", 1)[0] ?? "";
    if (leadingSlashes === 2 && !isWindowsDriveLetter(first)) {
      const end = authorityEnd(afterTwo, true);
      if (!parseAuthority(url, afterTwo.slice(0, end))) {
        return null;
      }
      parsePath(url, afterTwo.slice(end), true);
      if (url.path.length === 0) {
        url.path = [""];
      }
    } else {
      url.host = { type: "domain", value: "" };
      parsePath(url, afterTwo, true);
    }
  } else if (leadingSlashes === 1) {
    url.host ??= { type: "domain", value: "" };
    const remainder = path.slice(1);
    const currentDrive =
      Array.isArray(url.path) && isWindowsDriveLetter(url.path[0] ?? "")
        ? (url.path[0] ?? null)
        : null;
    if (
      currentDrive !== null &&
      !isWindowsDriveLetter(remainder.split("/", 1)[0] ?? "")
    ) {
      url.path = remainder === "" ? [currentDrive, ""] : [currentDrive];
      if (remainder !== "") {
        parsePath(url, remainder, false);
      }
    } else {
      parsePath(url, remainder, true);
      if (remainder === "") {
        url.path = [""];
      }
    }
  } else if (driveAtStart) {
    url.host ??= { type: "domain", value: "" };
    parsePath(url, path, true);
  } else if (base !== null) {
    parsePath(url, path, false);
  } else {
    url.host = { type: "domain", value: "" };
    parsePath(url, path, true);
    if (path === "") {
      url.path = [""];
    }
  }
  return applyQueryAndFragment(url, query, fragment);
}

function parseAbsolute(scheme: string, rest: string): URLRecord | null {
  const url = emptyURLRecord();
  url.scheme = scheme;
  const special = isSpecialScheme(scheme);
  if (scheme === "file") {
    return parseFile(rest, null);
  }
  if (special) {
    let source = rest;
    let slashes = 0;
    while (source[slashes] === "/" || source[slashes] === "\\") {
      slashes += 1;
    }
    source = source.slice(slashes);
    const end = authorityEnd(source, true);
    if (!parseAuthority(url, source.slice(0, end))) {
      return null;
    }
    return parseAfterAuthority(url, source.slice(end));
  }
  if (rest.startsWith("//")) {
    const source = rest.slice(2);
    const end = authorityEnd(source, false);
    if (!parseAuthority(url, source.slice(0, end))) {
      return null;
    }
    return parseAfterAuthority(url, source.slice(end));
  }
  if (rest.startsWith("/")) {
    return parseAfterAuthority(url, rest);
  }
  const [withoutFragment, fragment] = splitFragment(rest);
  const [path, query] = splitQuery(withoutFragment);
  let opaquePath = utf8PercentEncode(path, c0ControlPercentEncode);
  if ((query !== null || fragment !== null) && opaquePath.endsWith(" ")) {
    opaquePath = `${opaquePath.slice(0, -1)}%20`;
  }
  url.path = opaquePath;
  url.query = query === null ? null : encodeQuery(query, false);
  url.fragment =
    fragment === null
      ? null
      : utf8PercentEncode(fragment, fragmentPercentEncode);
  return url;
}

function parseRelative(input: string, base: URLRecord): URLRecord | null {
  if (base.scheme === "file") {
    return parseFile(input, base);
  }
  const url = cloneURLRecord(base);
  url.fragment = null;
  if (input.startsWith("#")) {
    url.fragment = utf8PercentEncode(input.slice(1), fragmentPercentEncode);
    return url;
  }
  if (hasOpaquePath(url)) {
    return null;
  }
  if (input === "") {
    return url;
  }
  if (input.startsWith("?")) {
    const [query, fragment] = splitFragment(input.slice(1));
    url.query = encodeQuery(query, isSpecialScheme(url.scheme));
    url.fragment =
      fragment === null
        ? null
        : utf8PercentEncode(fragment, fragmentPercentEncode);
    return url;
  }
  const special = isSpecialScheme(url.scheme);
  if (input.startsWith("//") || (special && /^[\\/]{2}/u.test(input))) {
    url.username = "";
    url.password = "";
    url.host = null;
    url.port = null;
    const source = special ? input.replace(/^[\\/]+/u, "") : input.slice(2);
    const end = authorityEnd(source, special);
    if (!parseAuthority(url, source.slice(0, end))) {
      return null;
    }
    return parseAfterAuthority(url, source.slice(end));
  }
  const [withoutFragment, fragment] = splitFragment(input);
  const [path, query] = splitQuery(withoutFragment);
  if (path !== "") {
    const absolute = path.startsWith("/") || (special && path.startsWith("\\"));
    parsePath(url, path, absolute);
    url.query = null;
  }
  if (query !== null) {
    url.query = encodeQuery(query, special);
  }
  url.fragment =
    fragment === null
      ? null
      : utf8PercentEncode(fragment, fragmentPercentEncode);
  return url;
}

export function parseURL(
  input: string,
  base: URLRecord | null = null,
): URLRecord | null {
  const source = preprocess(input);
  const schemeMatch = /^([A-Za-z][A-Za-z0-9+.-]*):(.*)$/su.exec(source);
  if (schemeMatch !== null) {
    const scheme = (schemeMatch[1] ?? "").toLowerCase();
    const rest = schemeMatch[2] ?? "";
    if (scheme === "file") {
      return parseFile(rest, base?.scheme === "file" ? base : null);
    }
    if (
      base !== null &&
      base.scheme === scheme &&
      isSpecialScheme(scheme) &&
      !/^[\\/]{2}/u.test(rest)
    ) {
      return parseRelative(rest, base);
    }
    return parseAbsolute(scheme, rest);
  }
  return base === null ? null : parseRelative(source, base);
}

export function serializeURL(url: URLRecord, excludeFragment = false): string {
  let output = `${url.scheme}:`;
  if (url.host !== null) {
    output += "//";
    if (url.username !== "" || url.password !== "") {
      output += url.username;
      if (url.password !== "") {
        output += `:${url.password}`;
      }
      output += "@";
    }
    output += serializeHost(url.host);
    if (url.port !== null) {
      output += `:${String(url.port)}`;
    }
  } else if (url.scheme === "file") {
    output += "//";
  } else if (
    Array.isArray(url.path) &&
    url.path.length > 1 &&
    url.path[0] === ""
  ) {
    output += "/.";
  }
  output +=
    typeof url.path === "string"
      ? url.path
      : url.path.map((segment) => `/${segment}`).join("");
  if (url.query !== null) {
    output += `?${url.query}`;
  }
  if (!excludeFragment && url.fragment !== null) {
    output += `#${url.fragment}`;
  }
  return output;
}

export function serializeOrigin(url: URLRecord): string {
  if (url.scheme === "blob" && typeof url.path === "string") {
    const inner = parseURL(url.path);
    return inner !== null && ["http", "https"].includes(inner.scheme)
      ? serializeOrigin(inner)
      : "null";
  }
  if (
    url.host === null ||
    !["ftp", "http", "https", "ws", "wss"].includes(url.scheme)
  ) {
    return "null";
  }
  return `${url.scheme}://${serializeHost(url.host)}${url.port === null ? "" : `:${String(url.port)}`}`;
}
