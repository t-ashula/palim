import { spawn } from "node:child_process";
import { cpus } from "node:os";
import { fileURLToPath } from "node:url";
import { hrtime, memoryUsage, resourceUsage, versions } from "node:process";

import {
  inspectDocument,
  loadCorpus,
  loadCorpusBytes,
  loadCorpusCase,
  verifyDocument,
} from "./corpus.js";
import type { CorpusCase } from "./corpus.js";
import type {
  MeasurementIdentity,
  MemoryMode,
  MemoryProgress,
  MemoryRawRecord,
  MemoryRole,
  MemorySnapshot,
  MemoryWorkload,
  SpeedMode,
  SpeedRawRecord,
} from "./report.js";
import { DOMParser } from "../src/index.js";
import type { Document } from "../src/dom.js";

function requiredEnvironment(name: string): string {
  const value = process.env[name];
  if (value === undefined || value.length === 0) {
    throw new Error(`${name} is required`);
  }
  return value;
}

function positiveInteger(value: string | undefined, name: string): number {
  const result = Number.parseInt(value ?? "", 10);
  if (!Number.isSafeInteger(result) || result < 1) {
    throw new Error(`${name} must be a positive integer`);
  }
  return result;
}

function identity(): MeasurementIdentity {
  const treeState = requiredEnvironment("PALIM_TREE_STATE");
  if (treeState !== "clean" && treeState !== "dirty") {
    throw new Error("PALIM_TREE_STATE must be clean or dirty");
  }
  return {
    runId: requiredEnvironment("PALIM_RUN_ID"),
    environmentId: requiredEnvironment("PALIM_ENVIRONMENT_ID"),
    revision: requiredEnvironment("PALIM_REVISION"),
    treeState,
    sourceDigest: requiredEnvironment("PALIM_SOURCE_DIGEST"),
    corpusDigest: requiredEnvironment("PALIM_CORPUS_DIGEST"),
    profile: "text/html",
    capabilities: ["html-parsing", "dom-tree"],
  };
}

function nanosecondsSince(start: bigint): number {
  return Number(hrtime.bigint() - start);
}

function snapshot(): MemorySnapshot {
  const value = memoryUsage();
  return {
    rss: value.rss,
    heapTotal: value.heapTotal,
    heapUsed: value.heapUsed,
    external: value.external,
    arrayBuffers: value.arrayBuffers,
  };
}

async function collectGarbage(): Promise<number> {
  if (globalThis.gc === undefined) {
    throw new Error("explicit garbage collection is not available");
  }
  const count = 3;
  for (let index = 0; index < count; index += 1) {
    globalThis.gc();
    await new Promise<void>((resolve) => {
      setImmediate(resolve);
    });
  }
  return count;
}

function parseAndVerify(fixture: CorpusCase, parser: DOMParser): Document {
  const document = parser.parseFromString(fixture.input, "text/html");
  verifyDocument(fixture.name, inspectDocument(document), fixture.expected);
  return document;
}

function speedRecord(
  mode: SpeedMode,
  fixture: CorpusCase,
  sample: number,
  operations: number,
  durationNanoseconds: number,
): SpeedRawRecord {
  return {
    ...identity(),
    schemaVersion: 1,
    domain: "speed",
    mode,
    caseName: fixture.name,
    sample,
    inputRepresentation: mode === "end-to-end" ? "utf8-bytes" : "utf8-string",
    inputBytes: Buffer.byteLength(fixture.input),
    operations,
    durationNanoseconds,
    verified: true,
  };
}

async function measureColdStart(
  fixture: CorpusCase,
  sample: number,
): Promise<SpeedRawRecord> {
  const started = hrtime.bigint();
  const child = spawn(
    process.execPath,
    [
      "--import",
      "tsx",
      fileURLToPath(import.meta.url),
      "cold-child",
      fixture.name,
    ],
    { stdio: ["ignore", "pipe", "inherit"] },
  );
  let buffer = "";
  let completedNanoseconds: number | undefined;
  child.stdout.setEncoding("utf8");
  child.stdout.on("data", (chunk: string) => {
    buffer += chunk;
    let newline = buffer.indexOf("\n");
    while (newline >= 0) {
      const line = buffer.slice(0, newline);
      buffer = buffer.slice(newline + 1);
      const event = JSON.parse(line) as { readonly event: string };
      if (event.event === "completed" && completedNanoseconds === undefined) {
        completedNanoseconds = nanosecondsSince(started);
      }
      newline = buffer.indexOf("\n");
    }
  });
  const exitCode = await new Promise<number | null>((resolve, reject) => {
    child.once("error", reject);
    child.once("close", resolve);
  });
  if (exitCode !== 0 || completedNanoseconds === undefined) {
    throw new Error(`cold-start worker failed for ${fixture.name}`);
  }
  return speedRecord("cold-start", fixture, sample, 1, completedNanoseconds);
}

function runColdChild(caseName: string): void {
  const fixture = loadCorpusCase(caseName);
  const parser = new DOMParser();
  const document = parser.parseFromString(fixture.input, "text/html");
  process.stdout.write('{"event":"completed"}\n');
  verifyDocument(fixture.name, inspectDocument(document), fixture.expected);
}

function measureWarm(
  fixture: CorpusCase,
  sample: number,
  operations: number,
  warmupOperations: number,
): SpeedRawRecord {
  const parser = new DOMParser();
  for (let index = 0; index < warmupOperations; index += 1) {
    parser.parseFromString(fixture.input, "text/html");
  }
  let document: Document | undefined;
  const started = hrtime.bigint();
  for (let index = 0; index < operations; index += 1) {
    document = parser.parseFromString(fixture.input, "text/html");
  }
  const durationNanoseconds = nanosecondsSince(started);
  if (document === undefined) {
    throw new Error("warm measurement produced no document");
  }
  verifyDocument(fixture.name, inspectDocument(document), fixture.expected);
  return speedRecord("warm", fixture, sample, operations, durationNanoseconds);
}

function measureEndToEnd(fixture: CorpusCase, sample: number): SpeedRawRecord {
  const bytes = loadCorpusBytes(fixture.name);
  const parser = new DOMParser();
  const started = hrtime.bigint();
  const input = bytes.toString("utf8");
  const document = parser.parseFromString(input, "text/html");
  const durationNanoseconds = nanosecondsSince(started);
  verifyDocument(fixture.name, inspectDocument(document), fixture.expected);
  return speedRecord("end-to-end", fixture, sample, 1, durationNanoseconds);
}

function memoryRows(): readonly (readonly [
  MemoryWorkload,
  string,
  number,
  string,
])[] {
  const corpus = loadCorpus();
  const document = corpus.cases.find(({ name }) => name === "document");
  if (document === undefined) {
    throw new Error("benchmark corpus requires the document case");
  }
  return [
    ...corpus.cases.map(
      ({ name, workload }) => [workload, name, 1, name] as const,
    ),
    ["sequential", document.name, 16, `${document.name}-16`],
    ...[1, 2, 4, 8, 16].map(
      (count) =>
        [
          "concurrent",
          document.name,
          count,
          `${document.name}-${String(count)}`,
        ] as const,
    ),
  ];
}

async function measureMemory(
  mode: MemoryMode,
  role: MemoryRole,
  workload: MemoryWorkload,
  fixture: CorpusCase,
  count: number,
  name: string,
  sample: number,
  pairId: string,
): Promise<MemoryRawRecord> {
  const parser = new DOMParser();
  let gcCount = 0;
  if (mode === "retained") {
    gcCount += await collectGarbage();
  }
  const ready = snapshot();
  const progress: MemoryProgress[] = [];
  let held: Document[] = [];
  const checkpoints = [1, 2, 4, 8, 16].filter((value) => value <= count);

  if (workload === "sequential") {
    for (let completed = 1; completed <= count; completed += 1) {
      if (role === "parse") {
        parseAndVerify(fixture, parser);
      }
      if (checkpoints.includes(completed)) {
        if (mode === "retained") {
          gcCount += await collectGarbage();
        }
        progress.push({ completed, snapshot: snapshot() });
      }
    }
  } else if (role === "parse") {
    held = Array.from({ length: count }, () => parseAndVerify(fixture, parser));
  }

  const heldSnapshot = snapshot();
  const heldCount = held.length;
  let heldAfterGc: MemorySnapshot | undefined;
  let releasedAfterGc: MemorySnapshot | undefined;
  if (mode === "retained") {
    gcCount += await collectGarbage();
    heldAfterGc = snapshot();
    held = [];
    gcCount += await collectGarbage();
    releasedAfterGc = snapshot();
  }
  if (mode === "peak") {
    held = [];
  }

  return {
    ...identity(),
    schemaVersion: 1,
    domain: "memory",
    mode,
    role,
    pairId,
    workload,
    caseName: fixture.name,
    name,
    count,
    sample,
    inputBytes: Buffer.byteLength(fixture.input) * count,
    inputRepresentation: "utf8-string",
    nodeCount: fixture.expected.nodeCount * count,
    outputKind: "dom-tree",
    gcMode: mode === "retained" ? "explicit" : "none",
    gcCount,
    heldCount,
    checkpoints: {
      ready,
      held: heldSnapshot,
      ...(heldAfterGc === undefined ? {} : { heldAfterGc }),
      ...(releasedAfterGc === undefined ? {} : { releasedAfterGc }),
    },
    progress,
    maxRssBytes: resourceUsage().maxRSS * 1024,
    verified: true,
  };
}

function writeJson(value: unknown): void {
  process.stdout.write(`${JSON.stringify(value)}\n`);
}

function writeMetadata(domain: "memory" | "speed", mode: string): void {
  writeJson({
    ...identity(),
    schemaVersion: 1,
    domain,
    mode,
    sampleCount: positiveInteger(
      requiredEnvironment("PALIM_BENCHMARK_SAMPLES"),
      "PALIM_BENCHMARK_SAMPLES",
    ),
    environment: {
      node: versions.node,
      v8: versions.v8,
      platform: requiredEnvironment("PALIM_PLATFORM"),
      architecture: requiredEnvironment("PALIM_ARCHITECTURE"),
      kernel: requiredEnvironment("PALIM_KERNEL"),
      cpu: cpus()[0]?.model ?? "unknown",
    },
    ...(domain === "speed" && mode === "warm"
      ? {
          warmupOperations: positiveInteger(
            requiredEnvironment("PALIM_BENCHMARK_WARMUP"),
            "PALIM_BENCHMARK_WARMUP",
          ),
          measuredOperations: positiveInteger(
            requiredEnvironment("PALIM_BENCHMARK_OPERATIONS"),
            "PALIM_BENCHMARK_OPERATIONS",
          ),
        }
      : {}),
  });
}

async function main(): Promise<void> {
  const command = process.argv[2];
  if (command === "cases") {
    const domain = process.argv[3];
    if (domain === "speed") {
      process.stdout.write(
        `${loadCorpus()
          .cases.map(({ name }) => name)
          .join("\n")}\n`,
      );
      return;
    }
    if (domain === "memory") {
      process.stdout.write(
        `${memoryRows()
          .map(([workload, name, count, label]) =>
            [workload, name, String(count), label].join("\t"),
          )
          .join("\n")}\n`,
      );
      return;
    }
  }
  if (command === "metadata") {
    const domain = process.argv[3];
    const mode = process.argv[4];
    if ((domain === "speed" || domain === "memory") && mode !== undefined) {
      writeMetadata(domain, mode);
      return;
    }
  }
  if (command === "cold-child") {
    const caseName = process.argv[3];
    if (caseName === undefined) {
      throw new Error("cold-child requires a case name");
    }
    runColdChild(caseName);
    return;
  }
  if (command === "speed") {
    const mode = process.argv[3] as SpeedMode | undefined;
    const caseName = process.argv[4];
    const sample = positiveInteger(process.argv[5], "sample");
    const operations = positiveInteger(process.argv[6], "operations");
    if (mode === undefined || caseName === undefined) {
      throw new Error("speed requires mode, case, sample, and operations");
    }
    const fixture = loadCorpusCase(caseName);
    if (mode === "cold-start") {
      writeJson(await measureColdStart(fixture, sample));
      return;
    }
    if (mode === "warm") {
      writeJson(
        measureWarm(
          fixture,
          sample,
          operations,
          positiveInteger(
            requiredEnvironment("PALIM_BENCHMARK_WARMUP"),
            "PALIM_BENCHMARK_WARMUP",
          ),
        ),
      );
      return;
    }
    writeJson(measureEndToEnd(fixture, sample));
    return;
  }
  if (command === "memory") {
    const mode = process.argv[3] as MemoryMode | undefined;
    const role = process.argv[4] as MemoryRole | undefined;
    const workload = process.argv[5] as MemoryWorkload | undefined;
    const caseName = process.argv[6];
    const count = positiveInteger(process.argv[7], "count");
    const name = process.argv[8];
    const sample = positiveInteger(process.argv[9], "sample");
    const pairId = process.argv[10];
    if (
      mode === undefined ||
      role === undefined ||
      workload === undefined ||
      caseName === undefined ||
      name === undefined ||
      pairId === undefined
    ) {
      throw new Error("memory worker arguments are incomplete");
    }
    writeJson(
      await measureMemory(
        mode,
        role,
        workload,
        loadCorpusCase(caseName),
        count,
        name,
        sample,
        pairId,
      ),
    );
    return;
  }
  throw new Error(`unknown measurement command: ${String(command)}`);
}

await main();
