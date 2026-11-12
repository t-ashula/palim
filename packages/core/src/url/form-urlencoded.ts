import {
  percentDecodeBytes,
  utf8DecodeWithoutBOM,
  utf8Encode,
  utf8PercentEncode,
} from "./encoding.js";

export type FormUrlEncodedPair = [name: string, value: string];

const formPercentEncode = (byte: number): boolean =>
  !(
    (byte >= 0x30 && byte <= 0x39) ||
    (byte >= 0x41 && byte <= 0x5a) ||
    (byte >= 0x61 && byte <= 0x7a) ||
    byte === 0x2a ||
    byte === 0x2d ||
    byte === 0x2e ||
    byte === 0x5f
  );

export function parseFormUrlEncoded(
  input: ArrayLike<number>,
): FormUrlEncodedPair[] {
  if (input.length === 0) {
    return [];
  }
  return split(Array.from(input), 0x26)
    .filter((sequence) => sequence.length !== 0)
    .map((sequence): FormUrlEncodedPair => {
      const equals = sequence.indexOf(0x3d);
      const name = equals < 0 ? sequence : sequence.slice(0, equals);
      const value = equals < 0 ? [] : sequence.slice(equals + 1);
      return [decode(name), decode(value)];
    });
}

export function parseFormUrlEncodedString(input: string): FormUrlEncodedPair[] {
  return parseFormUrlEncoded(utf8Encode(input));
}

export function serializeFormUrlEncoded(
  list: readonly FormUrlEncodedPair[],
): string {
  return list
    .map(
      ([name, value]) =>
        `${utf8PercentEncode(name, formPercentEncode, true)}=${utf8PercentEncode(value, formPercentEncode, true)}`,
    )
    .join("&");
}

function decode(input: readonly number[]): string {
  return utf8DecodeWithoutBOM(
    percentDecodeBytes(input.map((byte) => (byte === 0x2b ? 0x20 : byte))),
  );
}

function split(input: readonly number[], separator: number): number[][] {
  const output: number[][] = [];
  let start = 0;
  for (let index = 0; index <= input.length; index += 1) {
    if (index === input.length || input[index] === separator) {
      output.push(input.slice(start, index));
      start = index + 1;
    }
  }
  return output;
}
