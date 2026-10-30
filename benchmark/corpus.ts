import { readFileSync } from "node:fs";

import { Node } from "../src/dom.js";
import type { Document } from "../src/dom.js";

export interface DocumentInspection {
  readonly nodeCount: number;
  readonly elementCount: number;
  readonly textLength: number;
}

export type CorpusWorkload = "scaling" | "single";

export interface CorpusCase {
  readonly name: string;
  readonly file: string;
  readonly input: string;
  readonly workload: CorpusWorkload;
  readonly expected: DocumentInspection;
}

export interface Corpus {
  readonly schemaVersion: number;
  readonly cases: readonly CorpusCase[];
}

interface CorpusManifest {
  readonly schemaVersion: number;
  readonly cases: readonly {
    readonly name: string;
    readonly file: string;
    readonly workload: CorpusWorkload;
    readonly expected: DocumentInspection;
  }[];
}

const manifestUrl = new URL("./corpus/manifest.json", import.meta.url);

function manifest(): CorpusManifest {
  return JSON.parse(readFileSync(manifestUrl, "utf8")) as CorpusManifest;
}

function withoutStorageNewline(input: string): string {
  return input.replace(/\r?\n$/, "");
}

export function loadCorpus(): Corpus {
  const value = manifest();
  return {
    schemaVersion: value.schemaVersion,
    cases: value.cases.map(({ expected, file, name, workload }) => ({
      name,
      file,
      workload,
      expected,
      input: withoutStorageNewline(
        readFileSync(new URL(file, manifestUrl), "utf8"),
      ),
    })),
  };
}

export function loadCorpusCase(name: string): CorpusCase {
  const fixture = loadCorpus().cases.find(
    (candidate) => candidate.name === name,
  );
  if (fixture === undefined) {
    throw new Error(`unknown corpus case: ${name}`);
  }
  return fixture;
}

export function loadCorpusBytes(name: string): Buffer {
  const entry = manifest().cases.find((candidate) => candidate.name === name);
  if (entry === undefined) {
    throw new Error(`unknown corpus case: ${name}`);
  }
  const bytes = readFileSync(new URL(entry.file, manifestUrl));
  if (bytes.subarray(-1).equals(Buffer.from("\n"))) {
    return bytes.subarray(0, bytes.at(-2) === 13 ? -2 : -1);
  }
  return bytes;
}

export function inspectDocument(document: Document): DocumentInspection {
  let nodeCount = 0;
  let elementCount = 0;
  let textLength = 0;
  const pending: Node[] = [document];

  while (pending.length > 0) {
    const node = pending.pop();
    if (node === undefined) {
      continue;
    }
    nodeCount += 1;
    if (node.nodeType === Node.ELEMENT_NODE) {
      elementCount += 1;
    }
    if (node.nodeType === Node.TEXT_NODE) {
      textLength += node.textContent?.length ?? 0;
    }
    pending.push(...node.childNodes);
  }

  return { nodeCount, elementCount, textLength };
}

export function verifyDocument(
  name: string,
  actual: DocumentInspection,
  expected: DocumentInspection,
): void {
  if (
    actual.nodeCount !== expected.nodeCount ||
    actual.elementCount !== expected.elementCount ||
    actual.textLength !== expected.textLength
  ) {
    throw new Error(
      `unexpected parse result for ${name}: ${JSON.stringify(actual)}`,
    );
  }
}
