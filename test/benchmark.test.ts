import { describe, expect, it } from "vitest";

import { inspectDocument, loadCorpus } from "../benchmark/corpus.js";
import { aggregateMemory, aggregateSpeed } from "../benchmark/report.js";
import type {
  MemoryRawRecord,
  MemoryRole,
  MemorySnapshot,
  SpeedRawRecord,
} from "../benchmark/report.js";
import { DOMParser } from "../src/index.js";

function snapshot(heapUsed: number): MemorySnapshot {
  return {
    arrayBuffers: 0,
    external: 0,
    heapTotal: heapUsed * 2,
    heapUsed,
    rss: heapUsed * 3,
  };
}

function speedRecord(
  sample: number,
  durationNanoseconds: number,
): SpeedRawRecord {
  return {
    runId: "speed-warm",
    environmentId: "test-environment",
    revision: "revision",
    treeState: "clean",
    sourceDigest: "source",
    corpusDigest: "corpus",
    profile: "text/html",
    capabilities: ["html-parsing", "dom-tree"],
    schemaVersion: 1,
    domain: "speed",
    mode: "warm",
    caseName: "document",
    sample,
    inputRepresentation: "utf8-string",
    inputBytes: 100,
    operations: 2,
    durationNanoseconds,
    verified: true,
  };
}

function memoryRecord(
  role: MemoryRole,
  overrides: Partial<MemoryRawRecord> = {},
): MemoryRawRecord {
  return {
    runId: "memory-retained-single",
    environmentId: "test-environment",
    revision: "revision",
    treeState: "clean",
    sourceDigest: "source",
    corpusDigest: "corpus",
    profile: "text/html",
    capabilities: ["html-parsing", "dom-tree"],
    schemaVersion: 1,
    domain: "memory",
    mode: "retained",
    role,
    pairId: "single-document-1",
    workload: "single",
    caseName: "document",
    name: "document",
    count: 1,
    sample: 1,
    inputBytes: 100,
    inputRepresentation: "utf8-string",
    nodeCount: 10,
    outputKind: "dom-tree",
    gcMode: "explicit",
    gcCount: 9,
    heldCount: role === "parse" ? 1 : 0,
    checkpoints: {
      ready: snapshot(1_000),
      held: snapshot(role === "parse" ? 1_600 : 1_100),
      heldAfterGc: snapshot(role === "parse" ? 1_400 : 1_050),
      releasedAfterGc: snapshot(role === "parse" ? 1_100 : 1_025),
    },
    progress: [],
    maxRssBytes: role === "parse" ? 10_500_000 : 10_000_000,
    verified: true,
    ...overrides,
  };
}

describe("benchmark measurement", () => {
  it("loads corpus files and verifies DOMParser output", () => {
    const corpus = loadCorpus();

    expect(corpus.schemaVersion).toBe(1);
    expect(corpus.cases.map(({ name }) => name)).toEqual([
      "document",
      "table",
      "list-1",
      "list-16",
      "list-64",
    ]);

    for (const fixture of corpus.cases) {
      const document = new DOMParser().parseFromString(
        fixture.input,
        "text/html",
      );
      expect(inspectDocument(document)).toEqual(fixture.expected);
    }
  });

  it("counts fresh-process speed records instead of inner operations", () => {
    const report = aggregateSpeed([
      speedRecord(1, 4_000),
      speedRecord(2, 6_000),
    ]);

    expect(report).toEqual([
      {
        mode: "warm",
        cases: [
          {
            name: "document",
            inputRepresentation: "utf8-string",
            inputBytes: 100,
            sampleCount: 2,
            operationsPerSample: 2,
            latencyNanoseconds: {
              count: 2,
              minimum: 2_000,
              p50: 2_000,
              p95: 3_000,
              maximum: 3_000,
              mean: 2_500,
              standardDeviation: 500,
            },
            throughputBytesPerSecond: {
              count: 2,
              minimum: 33_333_333.333333332,
              p50: 33_333_333.333333332,
              p95: 50_000_000,
              maximum: 50_000_000,
              mean: 41_666_666.666666664,
              standardDeviation: 8_333_333.333333334,
            },
          },
        ],
      },
    ]);
  });

  it("pairs equivalent memory processes and keeps absolute peak RSS", () => {
    const report = aggregateMemory([
      memoryRecord("baseline"),
      memoryRecord("parse"),
    ]);

    expect(report).toMatchObject([
      {
        mode: "retained",
        workload: "single",
        cases: [
          {
            name: "document",
            inputRepresentation: "utf8-string",
            outputKind: "dom-tree",
            sampleCount: 1,
            baselinePeakRssBytes: { p50: 10_000_000 },
            parsePeakRssBytes: { p50: 10_500_000 },
            incrementalPeakRssBytes: { p50: 500_000 },
            retainedHeapBytes: { p50: 350 },
            releasedHeapBytes: { p50: 75 },
            bytesPerNode: { p50: 35 },
            noiseSampleCount: 1,
          },
        ],
      },
    ]);
  });

  it("rejects a memory pair measured under different conditions", () => {
    expect(() =>
      aggregateMemory([
        memoryRecord("baseline"),
        memoryRecord("parse", { gcMode: "none" }),
      ]),
    ).toThrow("memory pair conditions differ: single-document-1");
  });
});
