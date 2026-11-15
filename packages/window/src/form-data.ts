import type { Blob } from "./blob.js";
import { blobBytes, File } from "./blob.js";

export type FormDataEntryValue = string | File;
export type FormDataEntry = [name: string, value: FormDataEntryValue];

export class FormData implements Iterable<FormDataEntry> {
  constructor(entries: Iterable<readonly [string, FormDataEntryValue]> = []) {
    ENTRY_LISTS.set(
      this,
      Array.from(entries, ([name, value]): FormDataEntry => [name, value]),
    );
  }

  append(name: string, value: string | Blob, filename?: string): void {
    entryList(this).push([name, entryValue(value, filename)]);
  }

  delete(name: string): void {
    const entries = entryList(this);
    for (let index = entries.length - 1; index >= 0; index -= 1) {
      if (entries[index]?.[0] === name) {
        entries.splice(index, 1);
      }
    }
  }

  get(name: string): FormDataEntryValue | null {
    return (
      entryList(this).find(([candidate]) => candidate === name)?.[1] ?? null
    );
  }

  getAll(name: string): FormDataEntryValue[] {
    return entryList(this)
      .filter(([candidate]) => candidate === name)
      .map(([, value]) => value);
  }

  has(name: string): boolean {
    return entryList(this).some(([candidate]) => candidate === name);
  }

  set(name: string, value: string | Blob, filename?: string): void {
    const entries = entryList(this);
    const first = entries.findIndex(([candidate]) => candidate === name);
    if (first === -1) {
      entries.push([name, entryValue(value, filename)]);
      return;
    }
    entries[first] = [name, entryValue(value, filename)];
    for (let index = entries.length - 1; index > first; index -= 1) {
      if (entries[index]?.[0] === name) {
        entries.splice(index, 1);
      }
    }
  }

  forEach(
    callback: (
      value: FormDataEntryValue,
      key: string,
      parent: FormData,
    ) => void,
    thisArg?: unknown,
  ): void {
    for (const [name, value] of entryList(this)) {
      callback.call(thisArg, value, name, this);
    }
  }

  *keys(): IterableIterator<string> {
    for (const [name] of entryList(this)) {
      yield name;
    }
  }

  *values(): IterableIterator<FormDataEntryValue> {
    for (const [, value] of entryList(this)) {
      yield value;
    }
  }

  *entries(): IterableIterator<FormDataEntry> {
    for (const [name, value] of entryList(this)) {
      yield [name, value];
    }
  }

  [Symbol.iterator](): IterableIterator<FormDataEntry> {
    return this.entries();
  }
}

function entryValue(
  value: string | Blob,
  filename?: string,
): FormDataEntryValue {
  if (typeof value === "string") {
    return value;
  }
  if (filename === undefined && value instanceof File) {
    return value;
  }
  return new File(
    [blobBytes(value)],
    filename ?? "blob",
    value instanceof File
      ? { type: value.type, lastModified: value.lastModified }
      : { type: value.type },
  );
}

const ENTRY_LISTS = new WeakMap<FormData, FormDataEntry[]>();

function entryList(formData: FormData): FormDataEntry[] {
  const entries = ENTRY_LISTS.get(formData);
  if (entries === undefined) {
    throw new TypeError("Invalid FormData receiver");
  }
  return entries;
}
