export type PercentEncodePredicate = (byte: number) => boolean;

export const c0ControlPercentEncode: PercentEncodePredicate = (byte) =>
  byte <= 0x1f || byte > 0x7e;

export const fragmentPercentEncode: PercentEncodePredicate = (byte) =>
  c0ControlPercentEncode(byte) ||
  byte === 0x20 ||
  byte === 0x22 ||
  byte === 0x3c ||
  byte === 0x3e ||
  byte === 0x60;

export const queryPercentEncode: PercentEncodePredicate = (byte) =>
  c0ControlPercentEncode(byte) ||
  byte === 0x20 ||
  byte === 0x22 ||
  byte === 0x23 ||
  byte === 0x3c ||
  byte === 0x3e;

export const specialQueryPercentEncode: PercentEncodePredicate = (byte) =>
  queryPercentEncode(byte) || byte === 0x27;

export const pathPercentEncode: PercentEncodePredicate = (byte) =>
  queryPercentEncode(byte) ||
  byte === 0x3f ||
  byte === 0x5e ||
  byte === 0x60 ||
  byte === 0x7b ||
  byte === 0x7d;

export const userinfoPercentEncode: PercentEncodePredicate = (byte) =>
  pathPercentEncode(byte) ||
  byte === 0x2f ||
  byte === 0x3a ||
  byte === 0x3b ||
  byte === 0x3d ||
  byte === 0x40 ||
  byte === 0x5b ||
  byte === 0x5c ||
  byte === 0x5d ||
  byte === 0x7c;

export function utf8Encode(value: string): number[] {
  const bytes: number[] = [];
  for (const character of value.toWellFormed()) {
    const point = character.codePointAt(0) ?? 0xfffd;
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
  return bytes;
}

function hex(byte: number): string {
  return byte.toString(16).toUpperCase().padStart(2, "0");
}

export function utf8PercentEncode(
  value: string,
  predicate: PercentEncodePredicate,
  spaceAsPlus = false,
): string {
  let output = "";
  for (const byte of utf8Encode(value)) {
    output +=
      spaceAsPlus && byte === 0x20
        ? "+"
        : predicate(byte)
          ? `%${hex(byte)}`
          : String.fromCharCode(byte);
  }
  return output;
}

function hexValue(code: number): number | null {
  if (code >= 0x30 && code <= 0x39) {
    return code - 0x30;
  }
  if (code >= 0x41 && code <= 0x46) {
    return code - 0x41 + 10;
  }
  if (code >= 0x61 && code <= 0x66) {
    return code - 0x61 + 10;
  }
  return null;
}

export function percentDecodeBytes(bytes: readonly number[]): number[] {
  const output: number[] = [];
  for (let index = 0; index < bytes.length; index += 1) {
    const first = bytes[index] ?? 0;
    const high = hexValue(bytes[index + 1] ?? -1);
    const low = hexValue(bytes[index + 2] ?? -1);
    if (first === 0x25 && high !== null && low !== null) {
      output.push(high * 16 + low);
      index += 2;
    } else {
      output.push(first);
    }
  }
  return output;
}

export function percentDecode(value: string): number[] {
  return percentDecodeBytes(utf8Encode(value));
}

export function utf8DecodeWithoutBOM(bytes: readonly number[]): string {
  let output = "";
  for (let index = 0; index < bytes.length;) {
    const first = bytes[index] ?? 0;
    let length = 0;
    let minimum = 0;
    let point = 0;
    if (first <= 0x7f) {
      length = 1;
      point = first;
    } else if (first >= 0xc2 && first <= 0xdf) {
      length = 2;
      minimum = 0x80;
      point = first & 0x1f;
    } else if (first >= 0xe0 && first <= 0xef) {
      length = 3;
      minimum = 0x800;
      point = first & 0x0f;
    } else if (first >= 0xf0 && first <= 0xf4) {
      length = 4;
      minimum = 0x10000;
      point = first & 0x07;
    } else {
      output += "\uFFFD";
      index += 1;
      continue;
    }
    let valid = index + length <= bytes.length;
    for (let offset = 1; valid && offset < length; offset += 1) {
      const continuation = bytes[index + offset] ?? 0;
      valid = continuation >= 0x80 && continuation <= 0xbf;
      point = (point << 6) | (continuation & 0x3f);
    }
    if (
      !valid ||
      point < minimum ||
      point > 0x10ffff ||
      (point >= 0xd800 && point <= 0xdfff)
    ) {
      output += "\uFFFD";
      index += 1;
      continue;
    }
    output += String.fromCodePoint(point);
    index += length;
  }
  return output;
}
