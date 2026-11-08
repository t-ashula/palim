interface TextDecoderInstance {
  readonly encoding: string;
  decode(input?: Uint8Array): string;
}

type TextDecoderConstructor = new (label?: string) => TextDecoderInstance;

interface DecodingEncoding {
  readonly decoder: TextDecoderInstance;
  readonly name: string;
}

interface Attribute {
  readonly name: string;
  readonly value: string;
}

interface AttributeResult {
  readonly attribute: Attribute | null;
  readonly position: number;
}

interface TagResult {
  readonly attributes: ReadonlyMap<string, string>;
  readonly position: number;
}

type EncodingCandidate = DecodingEncoding | "failure" | null;

const PRESCAN_LIMIT = 1024;
const REPLACEMENT_ENCODING_LABELS = new Set([
  "csiso2022kr",
  "hz-gb-2312",
  "iso-2022-cn",
  "iso-2022-cn-ext",
  "iso-2022-kr",
  "replacement",
]);

const platform = globalThis as typeof globalThis & {
  readonly TextDecoder: TextDecoderConstructor;
};

export function decodeHTMLBytes(
  input: Uint8Array,
  options: {
    readonly transportEncoding?: string;
    readonly fallbackEncoding?: string;
  } = {},
): {
  readonly text: string;
  readonly encoding: string;
} {
  if (!(input instanceof Uint8Array)) {
    throw new TypeError("input must be a Uint8Array");
  }

  const encoding = determineEncoding(
    input,
    options.transportEncoding,
    options.fallbackEncoding,
  );
  return {
    text: encoding.decoder.decode(input),
    encoding: encoding.name,
  };
}

function determineEncoding(
  input: Uint8Array,
  transportEncoding: string | undefined,
  fallbackEncoding: string | undefined,
): DecodingEncoding {
  const bomEncoding = sniffBom(input);
  if (bomEncoding !== null) {
    return requireEncoding(bomEncoding);
  }

  if (transportEncoding !== undefined) {
    const encoding = getEncoding(transportEncoding);
    if (encoding !== null) {
      return encoding;
    }
  }

  const prescanEncoding = prescan(input.subarray(0, PRESCAN_LIMIT));
  if (prescanEncoding !== null) {
    return prescanEncoding;
  }

  const fallback = fallbackEncoding ?? "utf-8";
  const encoding = getEncoding(fallback);
  if (encoding === null) {
    throw new TypeError(`Unsupported fallback encoding: ${fallback}`);
  }
  return encoding;
}

function sniffBom(input: Uint8Array): string | null {
  if (input[0] === 0xef && input[1] === 0xbb && input[2] === 0xbf) {
    return "utf-8";
  }
  if (input[0] === 0xfe && input[1] === 0xff) {
    return "utf-16be";
  }
  if (input[0] === 0xff && input[1] === 0xfe) {
    return "utf-16le";
  }
  return null;
}

function getEncoding(label: string): DecodingEncoding | null {
  const encoding = resolveEncodingLabel(label);
  return encoding === null
    ? null
    : {
        decoder: createDecoder(encoding),
        name: encodingName(encoding),
      };
}

function resolveEncodingLabel(label: string): string | null {
  if (REPLACEMENT_ENCODING_LABELS.has(normalizeLabel(label))) {
    return "replacement";
  }
  try {
    return new platform.TextDecoder(label).encoding;
  } catch (error) {
    if (error instanceof RangeError) {
      return null;
    }
    throw error;
  }
}

function createDecoder(encoding: string): TextDecoderInstance {
  if (encoding === "replacement") {
    return {
      encoding,
      decode(input = new Uint8Array()): string {
        return input.length === 0 ? "" : "\uFFFD";
      },
    };
  }
  return new platform.TextDecoder(encoding);
}

function normalizeLabel(label: string): string {
  return label.replace(/^[\t\n\f\r ]+|[\t\n\f\r ]+$/gu, "").toLowerCase();
}

function encodingName(lowercaseName: string): string {
  if (/^(?:utf|ibm|iso|koi|euc)(?:[-_]|\d)/.test(lowercaseName)) {
    return lowercaseName.toUpperCase();
  }
  if (/^[a-z]{2,3}$/.test(lowercaseName)) {
    return lowercaseName.toUpperCase();
  }
  if (/^[a-z]+\d$/.test(lowercaseName)) {
    return `${lowercaseName[0]?.toUpperCase() ?? ""}${lowercaseName.slice(1)}`;
  }
  if (/^[a-z]+_[a-z]+$/.test(lowercaseName)) {
    return lowercaseName
      .split("_")
      .map((part) =>
        part.length <= 3
          ? part.toUpperCase()
          : `${part[0]?.toUpperCase() ?? ""}${part.slice(1)}`,
      )
      .join("_");
  }
  return lowercaseName;
}

function requireEncoding(label: string): DecodingEncoding {
  const encoding = getEncoding(label);
  if (encoding === null) {
    throw new TypeError(`Unsupported encoding: ${label}`);
  }
  return encoding;
}

function normalizeMetaEncoding(encoding: DecodingEncoding): DecodingEncoding {
  if (
    encoding.decoder.encoding === "utf-16be" ||
    encoding.decoder.encoding === "utf-16le"
  ) {
    return requireEncoding("utf-8");
  }
  if (encoding.decoder.encoding === "x-user-defined") {
    return requireEncoding("windows-1252");
  }
  return encoding;
}

function prescan(input: Uint8Array): DecodingEncoding | null {
  if (matchesBytes(input, 0, [0x3c, 0x00, 0x3f, 0x00, 0x78, 0x00])) {
    return requireEncoding("utf-16le");
  }
  if (matchesBytes(input, 0, [0x00, 0x3c, 0x00, 0x3f, 0x00, 0x78])) {
    return requireEncoding("utf-16be");
  }

  let position = 0;
  while (position < input.length) {
    if (matchesBytes(input, position, [0x3c, 0x21, 0x2d, 0x2d])) {
      const end = findBytes(input, position + 4, [0x2d, 0x2d, 0x3e]);
      if (end < 0) {
        return getXmlEncoding(input);
      }
      position = end + 3;
      continue;
    }

    if (
      input[position] === 0x3c &&
      matchesAsciiCaseInsensitive(input, position + 1, "meta") &&
      isMetaDelimiter(input[position + 5])
    ) {
      const tag = readTag(input, position + 5);
      if (tag === null) {
        return getXmlEncoding(input);
      }
      const encoding = encodingFromMetaAttributes(tag.attributes);
      if (encoding !== null) {
        return encoding;
      }
      position = tag.position;
      continue;
    }

    if (input[position] === 0x3c) {
      let namePosition = position + 1;
      if (input[namePosition] === 0x2f) {
        namePosition += 1;
      }
      if (isAsciiAlpha(input[namePosition])) {
        while (
          namePosition < input.length &&
          !isAsciiWhitespace(input[namePosition]) &&
          input[namePosition] !== 0x3e
        ) {
          namePosition += 1;
        }
        if (namePosition >= input.length) {
          return getXmlEncoding(input);
        }
        const tag = readTag(input, namePosition);
        if (tag === null) {
          return getXmlEncoding(input);
        }
        position = tag.position;
        continue;
      }

      if (
        input[position + 1] === 0x21 ||
        input[position + 1] === 0x2f ||
        input[position + 1] === 0x3f
      ) {
        const end = input.indexOf(0x3e, position + 2);
        if (end < 0) {
          return getXmlEncoding(input);
        }
        position = end + 1;
        continue;
      }
    }

    position += 1;
  }

  return getXmlEncoding(input);
}

function encodingFromMetaAttributes(
  attributes: ReadonlyMap<string, string>,
): DecodingEncoding | null {
  let gotPragma = false;
  let needPragma: boolean | null = null;
  let charset: EncodingCandidate = null;

  for (const [name, value] of attributes) {
    if (name === "http-equiv") {
      if (asciiLowercase(value) === "content-type") {
        gotPragma = true;
      }
    } else if (name === "content") {
      const encoding = extractEncoding(value);
      if (encoding !== null && charset === null) {
        charset = encoding;
        needPragma = true;
      }
    } else if (name === "charset") {
      charset = getEncoding(value) ?? "failure";
      needPragma = false;
    }
  }

  if (
    needPragma === null ||
    (needPragma && !gotPragma) ||
    charset === null ||
    charset === "failure"
  ) {
    return null;
  }
  return normalizeMetaEncoding(charset);
}

function extractEncoding(value: string): DecodingEncoding | null {
  const lowerValue = asciiLowercase(value);
  let position = 0;

  while (position < value.length) {
    const charsetPosition = lowerValue.indexOf("charset", position);
    if (charsetPosition < 0) {
      return null;
    }
    position = charsetPosition + "charset".length;
    while (isAsciiWhitespaceCode(value.charCodeAt(position))) {
      position += 1;
    }
    if (value[position] !== "=") {
      continue;
    }
    position += 1;
    while (isAsciiWhitespaceCode(value.charCodeAt(position))) {
      position += 1;
    }

    const quote = value[position];
    if (quote === '"' || quote === "'") {
      const end = value.indexOf(quote, position + 1);
      if (end < 0) {
        return null;
      }
      return getEncoding(value.slice(position + 1, end));
    }
    if (quote === undefined) {
      return null;
    }

    let end = position;
    while (
      end < value.length &&
      !isAsciiWhitespaceCode(value.charCodeAt(end)) &&
      value[end] !== ";"
    ) {
      end += 1;
    }
    return getEncoding(value.slice(position, end));
  }

  return null;
}

function getXmlEncoding(input: Uint8Array): DecodingEncoding | null {
  if (!matchesBytes(input, 0, [0x3c, 0x3f, 0x78, 0x6d, 0x6c])) {
    return null;
  }

  const declarationEnd = input.indexOf(0x3e, 5);
  if (declarationEnd < 0) {
    return null;
  }

  const marker = [0x65, 0x6e, 0x63, 0x6f, 0x64, 0x69, 0x6e, 0x67];
  let position = findBytes(input, 0, marker);
  if (position < 0 || position + marker.length > declarationEnd) {
    return null;
  }
  position += marker.length;

  while (position < declarationEnd && (input[position] ?? 0xff) <= 0x20) {
    position += 1;
  }
  if (input[position] !== 0x3d) {
    return null;
  }
  position += 1;
  while (position < declarationEnd && (input[position] ?? 0xff) <= 0x20) {
    position += 1;
  }

  const quote = input[position];
  if (quote !== 0x22 && quote !== 0x27) {
    return null;
  }
  position += 1;
  const end = input.indexOf(quote, position);
  if (end < 0 || end > declarationEnd) {
    return null;
  }
  for (let index = position; index < end; index += 1) {
    if ((input[index] ?? 0xff) <= 0x20) {
      return null;
    }
  }

  const encoding = getEncoding(isomorphicDecode(input, position, end));
  if (encoding === null) {
    return null;
  }
  if (
    encoding.decoder.encoding === "utf-16be" ||
    encoding.decoder.encoding === "utf-16le"
  ) {
    return requireEncoding("utf-8");
  }
  return encoding;
}

function readTag(input: Uint8Array, position: number): TagResult | null {
  const attributes = new Map<string, string>();

  for (;;) {
    const result = readAttribute(input, position);
    if (result === null) {
      return null;
    }
    position = result.position;
    if (result.attribute === null) {
      return { attributes, position };
    }
    if (!attributes.has(result.attribute.name)) {
      attributes.set(result.attribute.name, result.attribute.value);
    }
  }
}

function readAttribute(
  input: Uint8Array,
  initialPosition: number,
): AttributeResult | null {
  let position = initialPosition;
  while (isAsciiWhitespace(input[position]) || input[position] === 0x2f) {
    position += 1;
  }
  if (position >= input.length) {
    return null;
  }
  if (input[position] === 0x3e) {
    return { attribute: null, position: position + 1 };
  }

  let name = "";
  for (;;) {
    const byte = input[position];
    if (byte === undefined) {
      return null;
    }
    if (byte === 0x3d && name !== "") {
      position += 1;
      break;
    }
    if (isAsciiWhitespace(byte)) {
      while (isAsciiWhitespace(input[position])) {
        position += 1;
      }
      if (position >= input.length) {
        return null;
      }
      if (input[position] !== 0x3d) {
        return {
          attribute: { name, value: "" },
          position,
        };
      }
      position += 1;
      break;
    }
    if (byte === 0x2f || byte === 0x3e) {
      return {
        attribute: { name, value: "" },
        position,
      };
    }
    name += String.fromCharCode(asciiLowercaseByte(byte));
    position += 1;
  }

  while (isAsciiWhitespace(input[position])) {
    position += 1;
  }
  if (position >= input.length) {
    return null;
  }

  const quote = input[position];
  if (quote === 0x22 || quote === 0x27) {
    position += 1;
    const start = position;
    while (position < input.length && input[position] !== quote) {
      position += 1;
    }
    if (position >= input.length) {
      return null;
    }
    return {
      attribute: { name, value: isomorphicDecode(input, start, position) },
      position: position + 1,
    };
  }

  const start = position;
  while (
    position < input.length &&
    !isAsciiWhitespace(input[position]) &&
    input[position] !== 0x3e
  ) {
    position += 1;
  }
  if (position >= input.length) {
    return null;
  }
  return {
    attribute: { name, value: isomorphicDecode(input, start, position) },
    position,
  };
}

function matchesAsciiCaseInsensitive(
  input: Uint8Array,
  position: number,
  expected: string,
): boolean {
  if (position + expected.length > input.length) {
    return false;
  }
  for (let index = 0; index < expected.length; index += 1) {
    const byte = input[position + index];
    if (
      byte === undefined ||
      asciiLowercaseByte(byte) !== expected.charCodeAt(index)
    ) {
      return false;
    }
  }
  return true;
}

function matchesBytes(
  input: Uint8Array,
  position: number,
  expected: readonly number[],
): boolean {
  return expected.every((byte, index) => input[position + index] === byte);
}

function findBytes(
  input: Uint8Array,
  position: number,
  expected: readonly number[],
): number {
  const end = input.length - expected.length;
  for (let index = position; index <= end; index += 1) {
    if (matchesBytes(input, index, expected)) {
      return index;
    }
  }
  return -1;
}

function isomorphicDecode(
  input: Uint8Array,
  start: number,
  end: number,
): string {
  let result = "";
  for (let index = start; index < end; index += 1) {
    const byte = input[index];
    if (byte !== undefined) {
      result += String.fromCharCode(byte);
    }
  }
  return result;
}

function asciiLowercase(value: string): string {
  let result = "";
  for (let index = 0; index < value.length; index += 1) {
    result += String.fromCharCode(asciiLowercaseByte(value.charCodeAt(index)));
  }
  return result;
}

function asciiLowercaseByte(byte: number): number {
  return byte >= 0x41 && byte <= 0x5a ? byte + 0x20 : byte;
}

function isAsciiAlpha(byte: number | undefined): boolean {
  return (
    byte !== undefined &&
    ((byte >= 0x41 && byte <= 0x5a) || (byte >= 0x61 && byte <= 0x7a))
  );
}

function isMetaDelimiter(byte: number | undefined): boolean {
  return isAsciiWhitespace(byte) || byte === 0x2f;
}

function isAsciiWhitespace(byte: number | undefined): boolean {
  return (
    byte === 0x09 ||
    byte === 0x0a ||
    byte === 0x0c ||
    byte === 0x0d ||
    byte === 0x20
  );
}

function isAsciiWhitespaceCode(code: number): boolean {
  return isAsciiWhitespace(Number.isNaN(code) ? undefined : code);
}
