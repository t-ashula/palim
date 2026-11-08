import {
  c0ControlPercentEncode,
  percentDecode,
  utf8DecodeWithoutBOM,
  utf8PercentEncode,
} from "./encoding.js";
import { domainToASCII } from "./idna.js";
import type { URLHost } from "./record.js";

function forbiddenDomainCodePoint(character: string): boolean {
  const point = character.codePointAt(0) ?? 0;
  return (
    point <= 0x20 ||
    point === 0x23 ||
    point === 0x25 ||
    point === 0x2f ||
    point === 0x3a ||
    point === 0x3c ||
    point === 0x3e ||
    point === 0x3f ||
    point === 0x40 ||
    point === 0x5b ||
    point === 0x5c ||
    point === 0x5d ||
    point === 0x5e ||
    point === 0x7c ||
    point === 0x7f
  );
}

function forbiddenOpaqueHostCodePoint(character: string): boolean {
  return /[\u0000\u0009\u000A\u000D #/:<>?@[\]\\^|]/u.test(character);
}

function parseIPv4Number(input: string): number | null {
  let source = input;
  let radix = 10;
  let hadPrefix = false;
  if (/^0[xX]/u.test(source)) {
    source = source.slice(2);
    radix = 16;
    hadPrefix = true;
  } else if (source.length >= 2 && source.startsWith("0")) {
    source = source.slice(1);
    radix = 8;
    hadPrefix = true;
  }
  if (source === "") {
    return hadPrefix ? 0 : null;
  }
  const pattern =
    radix === 16 ? /^[0-9A-Fa-f]+$/u : radix === 8 ? /^[0-7]+$/u : /^\d+$/u;
  if (!pattern.test(source)) {
    return null;
  }
  const value = Number.parseInt(source, radix);
  return Number.isSafeInteger(value) ? value : null;
}

function endsInNumber(input: string): boolean {
  const pieces = input.split(".");
  if (pieces.at(-1) === "") {
    pieces.pop();
  }
  const last = pieces.at(-1);
  return (
    last !== undefined &&
    (/^\d+$/u.test(last) || /^0[xX][0-9A-Fa-f]*$/u.test(last))
  );
}

export function parseIPv4(input: string): number | null {
  const pieces = input.split(".");
  if (pieces.at(-1) === "") {
    pieces.pop();
  }
  if (pieces.length > 4 || pieces.length === 0) {
    return null;
  }
  if (pieces.length > 1 && pieces.some((piece) => piece === "")) {
    return null;
  }
  const numbers = pieces.map(parseIPv4Number);
  if (numbers.some((value) => value === null)) {
    return null;
  }
  const values = numbers as number[];
  if (values.slice(0, -1).some((value) => value > 255)) {
    return null;
  }
  const last = values.at(-1) ?? 0;
  if (last >= 256 ** (5 - values.length)) {
    return null;
  }
  let ipv4 = last;
  for (const [index, value] of values.slice(0, -1).entries()) {
    ipv4 += value * 256 ** (3 - index);
  }
  return ipv4;
}

function parseIPv4Tail(input: string): number[] | null {
  const pieces = input.split(".");
  if (pieces.length !== 4) {
    return null;
  }
  const values = pieces.map((piece) =>
    /^\d+$/u.test(piece) && !(piece.length > 1 && piece.startsWith("0"))
      ? Number(piece)
      : Number.NaN,
  );
  return values.some((value) => !Number.isInteger(value) || value > 255)
    ? null
    : [
        (values[0] ?? 0) * 256 + (values[1] ?? 0),
        (values[2] ?? 0) * 256 + (values[3] ?? 0),
      ];
}

function parseIPv6Pieces(source: string): number[] | null {
  if (source === "") {
    return [];
  }
  const pieces = source.split(":");
  const output: number[] = [];
  for (const [index, piece] of pieces.entries()) {
    if (piece.includes(".")) {
      if (index !== pieces.length - 1) {
        return null;
      }
      const tail = parseIPv4Tail(piece);
      if (tail === null) {
        return null;
      }
      output.push(...tail);
    } else {
      if (!/^[0-9A-Fa-f]{1,4}$/u.test(piece)) {
        return null;
      }
      output.push(Number.parseInt(piece, 16));
    }
  }
  return output;
}

export function parseIPv6(input: string): number[] | null {
  const compression = input.indexOf("::");
  if (compression !== input.lastIndexOf("::")) {
    return null;
  }
  if (compression < 0) {
    const pieces = parseIPv6Pieces(input);
    return pieces?.length === 8 ? pieces : null;
  }
  if (input.slice(0, compression).includes(".")) {
    return null;
  }
  const left = parseIPv6Pieces(input.slice(0, compression));
  const right = parseIPv6Pieces(input.slice(compression + 2));
  if (left === null || right === null || left.length + right.length >= 8) {
    return null;
  }
  return [
    ...left,
    ...Array<number>(8 - left.length - right.length).fill(0),
    ...right,
  ];
}

export function parseHost(input: string, opaque: boolean): URLHost | null {
  if (input === "") {
    return { type: "domain", value: "" };
  }
  if (input.startsWith("[")) {
    if (!input.endsWith("]")) {
      return null;
    }
    const address = parseIPv6(input.slice(1, -1));
    return address === null ? null : { type: "ipv6", value: address };
  }
  if (opaque) {
    if (Array.from(input).some(forbiddenOpaqueHostCodePoint)) {
      return null;
    }
    return {
      type: "opaque",
      value: utf8PercentEncode(input, c0ControlPercentEncode),
    };
  }
  const decoded = utf8DecodeWithoutBOM(percentDecode(input));
  const domain = domainToASCII(decoded);
  if (
    domain === null ||
    domain === "" ||
    Array.from(domain).some(forbiddenDomainCodePoint)
  ) {
    return null;
  }
  if (endsInNumber(domain)) {
    const value = parseIPv4(domain);
    return value === null ? null : { type: "ipv4", value };
  }
  return { type: "domain", value: domain };
}

function serializeIPv6(address: readonly number[]): string {
  let bestStart = -1;
  let bestLength = 1;
  for (let index = 0; index < address.length;) {
    if (address[index] !== 0) {
      index += 1;
      continue;
    }
    let end = index;
    while (end < address.length && address[end] === 0) {
      end += 1;
    }
    if (end - index > bestLength) {
      bestStart = index;
      bestLength = end - index;
    }
    index = end;
  }
  const parts: string[] = [];
  for (let index = 0; index < address.length; index += 1) {
    if (index === bestStart) {
      parts.push("");
      index += bestLength - 1;
      if (index === address.length - 1) {
        parts.push("");
      }
    } else {
      parts.push((address[index] ?? 0).toString(16));
    }
  }
  const output = parts.join(":");
  return output.startsWith(":") ? `:${output}` : output;
}

export function serializeHost(host: URLHost): string {
  switch (host.type) {
    case "domain":
    case "opaque":
      return host.value;
    case "ipv4":
      return [24, 16, 8, 0]
        .map((shift) => String((host.value >>> shift) & 0xff))
        .join(".");
    case "ipv6":
      return `[${serializeIPv6(host.value)}]`;
  }
}
