import {
  percentDecode,
  utf8DecodeWithoutBOM,
  utf8PercentEncode,
} from "./encoding.js";

type Pair = [name: string, value: string];

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

function scalarString(value: unknown): string {
  if (typeof value === "symbol") {
    throw new TypeError("Cannot convert a Symbol value to a string");
  }
  return String(value).toWellFormed();
}

function parse(input: string): Pair[] {
  if (input === "") {
    return [];
  }
  return input
    .split("&")
    .filter((sequence) => sequence !== "")
    .map((sequence): Pair => {
      const equals = sequence.indexOf("=");
      const name = equals < 0 ? sequence : sequence.slice(0, equals);
      const value = equals < 0 ? "" : sequence.slice(equals + 1);
      return [
        utf8DecodeWithoutBOM(percentDecode(name.replaceAll("+", " "))),
        utf8DecodeWithoutBOM(percentDecode(value.replaceAll("+", " "))),
      ];
    });
}

function serialize(list: readonly Pair[]): string {
  return list
    .map(
      ([name, value]) =>
        `${utf8PercentEncode(name, formPercentEncode, true)}=${utf8PercentEncode(value, formPercentEncode, true)}`,
    )
    .join("&");
}

export class URLSearchParams implements Iterable<Pair> {
  constructor(
    init:
      | string
      | Record<string, unknown>
      | Iterable<readonly [unknown, unknown]>
      | null
      | number
      | boolean = "",
  ) {
    if (typeof init === "string") {
      LISTS.set(this, parse(init.startsWith("?") ? init.slice(1) : init));
    } else if (
      init === null ||
      (typeof init !== "object" && typeof init !== "function")
    ) {
      LISTS.set(this, parse(scalarString(init)));
    } else if (Symbol.iterator in init) {
      const list: Pair[] = [];
      LISTS.set(this, list);
      for (const pair of init) {
        const items = Array.from(pair);
        if (items.length !== 2) {
          throw new TypeError("Each query pair must contain two items");
        }
        list.push([scalarString(items[0]), scalarString(items[1])]);
      }
    } else {
      const record = new Map<string, string>();
      for (const [name, value] of Object.entries(init)) {
        record.set(scalarString(name), scalarString(value));
      }
      LISTS.set(this, [...record]);
    }
  }

  get size(): number {
    return listFor(this).length;
  }

  append(name: unknown, value: unknown): void {
    listFor(this).push([scalarString(name), scalarString(value)]);
    this.#updated();
  }

  delete(name: unknown, value?: unknown): void {
    const key = scalarString(name);
    const expected = value === undefined ? null : scalarString(value);
    const list = listFor(this);
    for (let index = list.length - 1; index >= 0; index -= 1) {
      const pair = list[index];
      if (pair?.[0] === key && (expected === null || pair[1] === expected)) {
        list.splice(index, 1);
      }
    }
    this.#updated();
  }

  get(name: unknown): string | null {
    const key = scalarString(name);
    return listFor(this).find(([candidate]) => candidate === key)?.[1] ?? null;
  }

  getAll(name: unknown): string[] {
    const key = scalarString(name);
    return listFor(this)
      .filter(([candidate]) => candidate === key)
      .map(([, value]) => value);
  }

  has(name: unknown, value?: unknown): boolean {
    const key = scalarString(name);
    const expected = value === undefined ? null : scalarString(value);
    return listFor(this).some(
      ([candidate, candidateValue]) =>
        candidate === key && (expected === null || candidateValue === expected),
    );
  }

  set(name: unknown, value: unknown): void {
    const key = scalarString(name);
    const replacement = scalarString(value);
    const list = listFor(this);
    const first = list.findIndex(([candidate]) => candidate === key);
    if (first < 0) {
      list.push([key, replacement]);
    } else {
      list[first] = [key, replacement];
      for (let index = list.length - 1; index > first; index -= 1) {
        if (list[index]?.[0] === key) {
          list.splice(index, 1);
        }
      }
    }
    this.#updated();
  }

  sort(): void {
    listFor(this).sort(([left], [right]) =>
      left < right ? -1 : left > right ? 1 : 0,
    );
    this.#updated();
  }

  forEach(
    callback: (value: string, key: string, parent: URLSearchParams) => void,
    thisArg?: unknown,
  ): void {
    for (const [key, value] of listFor(this)) {
      callback.call(thisArg, value, key, this);
    }
  }

  *keys(): IterableIterator<string> {
    for (const [key] of listFor(this)) {
      yield key;
    }
  }

  *values(): IterableIterator<string> {
    for (const [, value] of listFor(this)) {
      yield value;
    }
  }

  *entries(): IterableIterator<Pair> {
    for (const [name, value] of listFor(this)) {
      yield [name, value];
    }
  }

  [Symbol.iterator](): IterableIterator<Pair> {
    return this.entries();
  }

  toString(): string {
    return serialize(listFor(this));
  }

  #updated(): void {
    UPDATES.get(this)?.(this.toString());
  }
}

const LISTS = new WeakMap<URLSearchParams, Pair[]>();
const UPDATES = new WeakMap<URLSearchParams, (value: string) => void>();

function listFor(params: URLSearchParams): Pair[] {
  const list = LISTS.get(params);
  if (list === undefined) {
    throw new TypeError("Invalid URLSearchParams receiver");
  }
  return list;
}

export function replaceURLSearchParams(
  params: URLSearchParams,
  value: string,
): void {
  const list = listFor(params);
  list.splice(0, list.length, ...parse(value));
}

export function setURLSearchParamsUpdate(
  params: URLSearchParams,
  callback: (value: string) => void,
): void {
  listFor(params);
  UPDATES.set(params, callback);
}
