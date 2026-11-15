export type BlobPart = string | Blob | ArrayBuffer | ArrayBufferView;

export interface BlobPropertyBag {
  readonly endings?: "transparent" | "native";
  readonly type?: string;
}

export interface FilePropertyBag extends BlobPropertyBag {
  readonly lastModified?: number;
}

const BYTES = new WeakMap<Blob, Uint8Array>();
const TYPES = new WeakMap<Blob, string>();

export class Blob {
  constructor(
    blobParts: Iterable<BlobPart> = [],
    options: BlobPropertyBag = {},
  ) {
    const endings = options.endings ?? "transparent";
    const parts = Array.from(blobParts, (part) => partBytes(part, endings));
    const size = parts.reduce((total, part) => total + part.byteLength, 0);
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const part of parts) {
      bytes.set(part, offset);
      offset += part.byteLength;
    }
    BYTES.set(this, bytes);
    TYPES.set(this, normalizeType(options.type ?? ""));
  }

  get size(): number {
    return bytesOf(this).byteLength;
  }

  get type(): string {
    return typeOf(this);
  }

  slice(start = 0, end = this.size, contentType = ""): Blob {
    const size = this.size;
    const relativeStart = normalizeIndex(start, size);
    const relativeEnd = normalizeIndex(end, size);
    const span = Math.max(relativeEnd - relativeStart, 0);
    return new Blob(
      [bytesOf(this).slice(relativeStart, relativeStart + span)],
      { type: contentType },
    );
  }

  arrayBuffer(): Promise<ArrayBuffer> {
    return Promise.resolve(bytesOf(this).slice().buffer);
  }

  text(): Promise<string> {
    return Promise.resolve(decodeUTF8(bytesOf(this)));
  }
}

export class File extends Blob {
  readonly name: string;
  readonly lastModified: number;
  readonly webkitRelativePath = "";

  constructor(
    fileBits: Iterable<BlobPart>,
    fileName: string,
    options: FilePropertyBag = {},
  ) {
    super(fileBits, options);
    this.name = fileName;
    this.lastModified = options.lastModified ?? Date.now();
  }
}

export function blobBytes(blob: Blob): Uint8Array {
  return bytesOf(blob).slice();
}

export function blobText(blob: Blob): string {
  return decodeUTF8(bytesOf(blob));
}

function bytesOf(blob: Blob): Uint8Array {
  const bytes = BYTES.get(blob);
  if (bytes === undefined) {
    throw new TypeError("Invalid Blob receiver");
  }
  return bytes;
}

function typeOf(blob: Blob): string {
  const type = TYPES.get(blob);
  if (type === undefined) {
    throw new TypeError("Invalid Blob receiver");
  }
  return type;
}

function partBytes(
  part: BlobPart,
  endings: "transparent" | "native",
): Uint8Array {
  if (part instanceof Blob) {
    return blobBytes(part);
  }
  if (typeof part === "string") {
    const value = toUSVString(part);
    return encodeUTF8(
      endings === "native" ? value.replace(/\r\n?|\n/g, "\n") : value,
    );
  }
  if (ArrayBuffer.isView(part)) {
    return new Uint8Array(
      part.buffer.slice(part.byteOffset, part.byteOffset + part.byteLength),
    );
  }
  return new Uint8Array(part.slice(0));
}

function normalizeIndex(value: number, size: number): number {
  const integer = Number.isNaN(value) ? 0 : Math.trunc(value);
  return integer < 0 ? Math.max(size + integer, 0) : Math.min(integer, size);
}

function normalizeType(type: string): string {
  for (const character of type) {
    const code = character.codePointAt(0) ?? 0;
    if (code < 0x20 || code > 0x7e) {
      return "";
    }
  }
  return type.toLowerCase();
}

function toUSVString(value: string): string {
  return value.toWellFormed();
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
  let index = 0;
  while (index < bytes.length) {
    const first = bytes[index];
    if (first === undefined) {
      break;
    }
    if (first <= 0x7f) {
      output += String.fromCodePoint(first);
      index += 1;
      continue;
    }
    let point = 0;
    let remaining = 0;
    let lower = 0x80;
    let upper = 0xbf;
    if (first >= 0xc2 && first <= 0xdf) {
      point = first & 0x1f;
      remaining = 1;
    } else if (first >= 0xe0 && first <= 0xef) {
      point = first & 0x0f;
      remaining = 2;
      if (first === 0xe0) {
        lower = 0xa0;
      }
      if (first === 0xed) {
        upper = 0x9f;
      }
    } else if (first >= 0xf0 && first <= 0xf4) {
      point = first & 0x07;
      remaining = 3;
      if (first === 0xf0) {
        lower = 0x90;
      }
      if (first === 0xf4) {
        upper = 0x8f;
      }
    } else {
      output += "\ufffd";
      index += 1;
      continue;
    }
    index += 1;
    let valid = true;
    for (let offset = 0; offset < remaining; offset += 1) {
      const next = bytes[index];
      if (next === undefined || next < lower || next > upper) {
        valid = false;
        break;
      }
      index += 1;
      point = (point << 6) | (next & 0x3f);
      lower = 0x80;
      upper = 0xbf;
    }
    output += valid ? String.fromCodePoint(point) : "\ufffd";
  }
  return output.startsWith("\ufeff") ? output.slice(1) : output;
}
