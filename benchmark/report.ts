import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { format } from "prettier";

export type SpeedMode = "cold-start" | "end-to-end" | "warm";
export type MemoryMode = "peak" | "retained";
export type SpeedInputRepresentation = "utf8-bytes" | "utf8-string";
export type MemoryInputRepresentation = "utf8-string";
export type MemoryOutputKind = "dom-tree";
export type MemoryRole = "baseline" | "parse";
export type MemoryWorkload = "concurrent" | "scaling" | "sequential" | "single";

export interface MeasurementIdentity {
  readonly runId: string;
  readonly environmentId: string;
  readonly revision: string;
  readonly treeState: "clean" | "dirty";
  readonly sourceDigest: string;
  readonly corpusDigest: string;
  readonly profile: "text/html";
  readonly capabilities: readonly ["html-parsing", "dom-tree"];
}

export interface SpeedRawRecord extends MeasurementIdentity {
  readonly schemaVersion: 1;
  readonly domain: "speed";
  readonly mode: SpeedMode;
  readonly caseName: string;
  readonly sample: number;
  readonly inputRepresentation: SpeedInputRepresentation;
  readonly inputBytes: number;
  readonly operations: number;
  readonly durationNanoseconds: number;
  readonly verified: boolean;
}

export interface MemorySnapshot {
  readonly rss: number;
  readonly heapTotal: number;
  readonly heapUsed: number;
  readonly external: number;
  readonly arrayBuffers: number;
}

export interface MemoryProgress {
  readonly completed: number;
  readonly snapshot: MemorySnapshot;
}

export interface MemoryRawRecord extends MeasurementIdentity {
  readonly schemaVersion: 1;
  readonly domain: "memory";
  readonly mode: MemoryMode;
  readonly role: MemoryRole;
  readonly pairId: string;
  readonly workload: MemoryWorkload;
  readonly caseName: string;
  readonly name: string;
  readonly count: number;
  readonly sample: number;
  readonly inputBytes: number;
  readonly inputRepresentation: MemoryInputRepresentation;
  readonly nodeCount: number;
  readonly outputKind: MemoryOutputKind;
  readonly gcMode: "explicit" | "none";
  readonly gcCount: number;
  readonly heldCount: number;
  readonly checkpoints: {
    readonly ready: MemorySnapshot;
    readonly held: MemorySnapshot;
    readonly heldAfterGc?: MemorySnapshot;
    readonly releasedAfterGc?: MemorySnapshot;
  };
  readonly progress: readonly MemoryProgress[];
  readonly maxRssBytes: number;
  readonly verified: boolean;
}

export interface Summary {
  readonly count: number;
  readonly minimum: number;
  readonly p50: number;
  readonly p95: number;
  readonly maximum: number;
  readonly mean: number;
  readonly standardDeviation: number;
}

export interface SpeedCaseReport {
  readonly name: string;
  readonly inputRepresentation: SpeedInputRepresentation;
  readonly inputBytes: number;
  readonly sampleCount: number;
  readonly operationsPerSample: number;
  readonly latencyNanoseconds: Summary;
  readonly throughputBytesPerSecond: Summary;
}

export interface SpeedSeriesReport {
  readonly mode: SpeedMode;
  readonly cases: readonly SpeedCaseReport[];
}

export interface MemoryProgressReport {
  readonly completed: number;
  readonly baselineHeapUsedBytes: Summary;
  readonly parseHeapUsedBytes: Summary;
  readonly incrementalHeapUsedBytes: Summary;
}

export interface MemoryCaseReport {
  readonly name: string;
  readonly inputRepresentation: MemoryInputRepresentation;
  readonly outputKind: MemoryOutputKind;
  readonly inputBytes: number;
  readonly nodeCount: number;
  readonly sampleCount: number;
  readonly baselinePeakRssBytes: Summary;
  readonly parsePeakRssBytes: Summary;
  readonly incrementalPeakRssBytes: Summary;
  readonly peakAmplification: Summary;
  readonly retainedHeapBytes?: Summary;
  readonly retainedExternalBytes?: Summary;
  readonly retainedArrayBuffersBytes?: Summary;
  readonly releasedHeapBytes?: Summary;
  readonly bytesPerNode?: Summary;
  readonly noiseSampleCount: number;
  readonly progress?: readonly MemoryProgressReport[];
}

export interface MemorySeriesReport {
  readonly mode: MemoryMode;
  readonly workload: MemoryWorkload;
  readonly cases: readonly MemoryCaseReport[];
}

interface RunMetadata extends MeasurementIdentity {
  readonly schemaVersion: 1;
  readonly runId: string;
  readonly domain: "memory" | "speed";
  readonly mode: string;
  readonly sampleCount: number;
  readonly environmentId: string;
  readonly environment: {
    readonly node: string;
    readonly v8: string;
    readonly platform: string;
    readonly architecture: string;
    readonly kernel: string;
    readonly cpu: string;
  };
  readonly warmupOperations?: number;
  readonly measuredOperations?: number;
}

const noiseFloorBytes = 1024 * 1024;

function summarize(values: readonly number[]): Summary {
  if (values.length === 0) {
    throw new Error("cannot summarize an empty sample");
  }
  const sorted = [...values].sort((left, right) => left - right);
  const at = (index: number): number => {
    const value = sorted[index];
    if (value === undefined) {
      throw new Error(`sample index out of range: ${String(index)}`);
    }
    return value;
  };
  const percentile = (fraction: number): number =>
    at(Math.ceil(fraction * sorted.length) - 1);
  const mean = sorted.reduce((sum, value) => sum + value, 0) / sorted.length;
  const variance =
    sorted.reduce((sum, value) => sum + (value - mean) ** 2, 0) / sorted.length;
  return {
    count: sorted.length,
    minimum: at(0),
    p50: percentile(0.5),
    p95: percentile(0.95),
    maximum: at(sorted.length - 1),
    mean,
    standardDeviation: Math.sqrt(variance),
  };
}

function groupBy<T>(
  values: readonly T[],
  key: (value: T) => string,
): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const value of values) {
    const name = key(value);
    const group = groups.get(name) ?? [];
    group.push(value);
    groups.set(name, group);
  }
  return groups;
}

const speedModeOrder: readonly SpeedMode[] = [
  "cold-start",
  "warm",
  "end-to-end",
];

export function aggregateSpeed(
  records: readonly SpeedRawRecord[],
): readonly SpeedSeriesReport[] {
  if (records.some(({ verified }) => !verified)) {
    throw new Error("speed records contain an unverified result");
  }
  const byMode = groupBy(records, ({ mode }) => mode);
  return speedModeOrder.flatMap((mode) => {
    const modeRecords = byMode.get(mode);
    if (modeRecords === undefined) {
      return [];
    }
    const cases = [...groupBy(modeRecords, ({ caseName }) => caseName)].map(
      ([name, caseRecords]): SpeedCaseReport => {
        const first = caseRecords[0];
        if (first === undefined) {
          throw new Error(`missing speed records for ${name}`);
        }
        if (
          caseRecords.some(
            ({ inputBytes, inputRepresentation, operations }) =>
              inputBytes !== first.inputBytes ||
              inputRepresentation !== first.inputRepresentation ||
              operations !== first.operations,
          )
        ) {
          throw new Error(`speed sample conditions differ: ${mode}/${name}`);
        }
        const latency = caseRecords.map(
          ({ durationNanoseconds, operations }) =>
            durationNanoseconds / operations,
        );
        return {
          name,
          inputRepresentation: first.inputRepresentation,
          inputBytes: first.inputBytes,
          sampleCount: caseRecords.length,
          operationsPerSample: first.operations,
          latencyNanoseconds: summarize(latency),
          throughputBytesPerSecond: summarize(
            latency.map(
              (nanoseconds) => first.inputBytes / (nanoseconds / 1_000_000_000),
            ),
          ),
        };
      },
    );
    return [{ mode, cases }];
  });
}

interface MemoryPair {
  readonly baseline: MemoryRawRecord;
  readonly parse: MemoryRawRecord;
}

function memoryPairs(
  records: readonly MemoryRawRecord[],
): readonly MemoryPair[] {
  const grouped = groupBy(records, ({ pairId }) => pairId);
  return [...grouped].map(([pairId, pairRecords]) => {
    const baseline = pairRecords.filter(({ role }) => role === "baseline");
    const parse = pairRecords.filter(({ role }) => role === "parse");
    if (baseline.length !== 1 || parse.length !== 1) {
      throw new Error(`memory pair is incomplete or duplicated: ${pairId}`);
    }
    const baselineRecord = baseline[0];
    const parseRecord = parse[0];
    if (baselineRecord === undefined || parseRecord === undefined) {
      throw new Error(`memory pair is incomplete: ${pairId}`);
    }
    const conditions = (record: MemoryRawRecord): string =>
      JSON.stringify({
        mode: record.mode,
        workload: record.workload,
        caseName: record.caseName,
        name: record.name,
        count: record.count,
        sample: record.sample,
        inputBytes: record.inputBytes,
        inputRepresentation: record.inputRepresentation,
        nodeCount: record.nodeCount,
        outputKind: record.outputKind,
        gcMode: record.gcMode,
        runId: record.runId,
        environmentId: record.environmentId,
        revision: record.revision,
        treeState: record.treeState,
        sourceDigest: record.sourceDigest,
        corpusDigest: record.corpusDigest,
        profile: record.profile,
        capabilities: record.capabilities,
      });
    if (conditions(baselineRecord) !== conditions(parseRecord)) {
      throw new Error(`memory pair conditions differ: ${pairId}`);
    }
    if (!baselineRecord.verified || !parseRecord.verified) {
      throw new Error(`memory pair is not verified: ${pairId}`);
    }
    return { baseline: baselineRecord, parse: parseRecord };
  });
}

function requiredCheckpoint(
  value: MemorySnapshot | undefined,
  pairId: string,
  name: string,
): MemorySnapshot {
  if (value === undefined) {
    throw new Error(`missing ${name} checkpoint: ${pairId}`);
  }
  return value;
}

function aggregateProgress(
  pairs: readonly MemoryPair[],
): MemoryProgressReport[] {
  const completedValues = new Set<number>();
  for (const { baseline, parse } of pairs) {
    for (const value of [...baseline.progress, ...parse.progress]) {
      completedValues.add(value.completed);
    }
  }
  return [...completedValues]
    .sort((left, right) => left - right)
    .map((completed) => {
      const baselineValues: number[] = [];
      const parseValues: number[] = [];
      for (const pair of pairs) {
        const baseline = pair.baseline.progress.find(
          (value) => value.completed === completed,
        );
        const parse = pair.parse.progress.find(
          (value) => value.completed === completed,
        );
        if (baseline === undefined || parse === undefined) {
          throw new Error(
            `memory progress conditions differ: ${pair.parse.pairId}/${String(completed)}`,
          );
        }
        baselineValues.push(baseline.snapshot.heapUsed);
        parseValues.push(parse.snapshot.heapUsed);
      }
      return {
        completed,
        baselineHeapUsedBytes: summarize(baselineValues),
        parseHeapUsedBytes: summarize(parseValues),
        incrementalHeapUsedBytes: summarize(
          parseValues.map(
            (value, index) => value - (baselineValues[index] ?? 0),
          ),
        ),
      };
    });
}

export function aggregateMemory(
  records: readonly MemoryRawRecord[],
): readonly MemorySeriesReport[] {
  const pairs = memoryPairs(records);
  return [
    ...groupBy(pairs, ({ parse }) => `${parse.mode}\t${parse.workload}`),
  ].map(([key, seriesPairs]) => {
    const [mode, workload] = key.split("\t") as [MemoryMode, MemoryWorkload];
    const cases = [...groupBy(seriesPairs, ({ parse }) => parse.name)].map(
      ([name, casePairs]): MemoryCaseReport => {
        const first = casePairs[0];
        if (first === undefined) {
          throw new Error(`missing memory records for ${name}`);
        }
        const baselinePeak = casePairs.map(
          ({ baseline }) => baseline.maxRssBytes,
        );
        const parsePeak = casePairs.map(({ parse }) => parse.maxRssBytes);
        const incrementalPeak = casePairs.map(
          ({ baseline, parse }) => parse.maxRssBytes - baseline.maxRssBytes,
        );
        const base: MemoryCaseReport = {
          name,
          inputRepresentation: first.parse.inputRepresentation,
          outputKind: first.parse.outputKind,
          inputBytes: first.parse.inputBytes,
          nodeCount: first.parse.nodeCount,
          sampleCount: casePairs.length,
          baselinePeakRssBytes: summarize(baselinePeak),
          parsePeakRssBytes: summarize(parsePeak),
          incrementalPeakRssBytes: summarize(incrementalPeak),
          peakAmplification: summarize(
            incrementalPeak.map((value) => value / first.parse.inputBytes),
          ),
          noiseSampleCount: incrementalPeak.filter(
            (value) => Math.abs(value) < noiseFloorBytes,
          ).length,
          ...(workload === "sequential"
            ? { progress: aggregateProgress(casePairs) }
            : {}),
        };
        if (mode === "peak") {
          return base;
        }
        const retainedHeap = casePairs.map(({ baseline, parse }) => {
          const baselineHeld = requiredCheckpoint(
            baseline.checkpoints.heldAfterGc,
            parse.pairId,
            "baseline held-after-gc",
          );
          const parseHeld = requiredCheckpoint(
            parse.checkpoints.heldAfterGc,
            parse.pairId,
            "parse held-after-gc",
          );
          return parseHeld.heapUsed - baselineHeld.heapUsed;
        });
        const releasedHeap = casePairs.map(({ baseline, parse }) => {
          const baselineReleased = requiredCheckpoint(
            baseline.checkpoints.releasedAfterGc,
            parse.pairId,
            "baseline released-after-gc",
          );
          const parseReleased = requiredCheckpoint(
            parse.checkpoints.releasedAfterGc,
            parse.pairId,
            "parse released-after-gc",
          );
          return parseReleased.heapUsed - baselineReleased.heapUsed;
        });
        const retainedExternal = casePairs.map(({ baseline, parse }) => {
          const baselineHeld = requiredCheckpoint(
            baseline.checkpoints.heldAfterGc,
            parse.pairId,
            "baseline held-after-gc",
          );
          const parseHeld = requiredCheckpoint(
            parse.checkpoints.heldAfterGc,
            parse.pairId,
            "parse held-after-gc",
          );
          return parseHeld.external - baselineHeld.external;
        });
        const retainedArrayBuffers = casePairs.map(({ baseline, parse }) => {
          const baselineHeld = requiredCheckpoint(
            baseline.checkpoints.heldAfterGc,
            parse.pairId,
            "baseline held-after-gc",
          );
          const parseHeld = requiredCheckpoint(
            parse.checkpoints.heldAfterGc,
            parse.pairId,
            "parse held-after-gc",
          );
          return parseHeld.arrayBuffers - baselineHeld.arrayBuffers;
        });
        return {
          ...base,
          retainedHeapBytes: summarize(retainedHeap),
          retainedExternalBytes: summarize(retainedExternal),
          retainedArrayBuffersBytes: summarize(retainedArrayBuffers),
          releasedHeapBytes: summarize(releasedHeap),
          bytesPerNode: summarize(
            retainedHeap.map((value) => value / first.parse.nodeCount),
          ),
        };
      },
    );
    return { mode, workload, cases };
  });
}

type TableValue = number | string;

function markdownCell(value: TableValue): string {
  return String(value).replaceAll("|", "\\|").replaceAll(/\r?\n/g, "<br>");
}

function table(rows: readonly (readonly TableValue[])[]): string {
  const [heading, ...body] = rows;
  if (heading === undefined) {
    throw new Error("table requires a heading");
  }
  return [
    `| ${heading.map(markdownCell).join(" | ")} |`,
    `| ${heading.map(() => "---").join(" | ")} |`,
    ...body.map((row) => `| ${row.map(markdownCell).join(" | ")} |`),
  ].join("\n");
}

function decimal(value: number, digits = 3): string {
  return value.toFixed(digits);
}

function renderMetadata(
  schemaVersion: number,
  domain: string,
  metadata: readonly RunMetadata[],
): string[] {
  const first = metadata[0];
  if (first === undefined) {
    throw new Error("report requires run metadata");
  }
  return [
    `- Schema version: ${String(schemaVersion)}`,
    `- Domain: \`${domain}\``,
    `- Revision: \`${first.revision}\` (${first.treeState})`,
    `- Source digest: \`${first.sourceDigest}\``,
    `- Corpus digest: \`${first.corpusDigest}\``,
    `- Profile: \`${first.profile}\``,
    `- Capabilities: ${first.capabilities.map((value) => `\`${value}\``).join(", ")}`,
    `- Environment: \`${first.environmentId}\``,
    "",
    "## Runs",
    "",
    table([
      [
        "Run",
        "Mode",
        "Samples",
        "Warmup operations",
        "Measured operations",
        "Node",
        "V8",
        "Platform",
        "Architecture",
        "Kernel",
        "CPU",
      ],
      ...metadata.map((value) => [
        value.runId,
        value.mode,
        value.sampleCount,
        value.warmupOperations ?? "n/a",
        value.measuredOperations ?? "n/a",
        value.environment.node,
        value.environment.v8,
        value.environment.platform,
        value.environment.architecture,
        value.environment.kernel,
        value.environment.cpu,
      ]),
    ]),
  ];
}

function summaryTable(
  values: readonly { readonly name: string; readonly summary: Summary }[],
  scale = 1,
  digits = 3,
): string {
  return table([
    ["Case", "Count", "Minimum", "p50", "p95", "Maximum", "Mean", "Stddev"],
    ...values.map(({ name, summary }) => [
      name,
      summary.count,
      decimal(summary.minimum / scale, digits),
      decimal(summary.p50 / scale, digits),
      decimal(summary.p95 / scale, digits),
      decimal(summary.maximum / scale, digits),
      decimal(summary.mean / scale, digits),
      decimal(summary.standardDeviation / scale, digits),
    ]),
  ]);
}

function renderSpeedReport(report: {
  readonly schemaVersion: number;
  readonly domain: string;
  readonly sourceRuns: readonly RunMetadata[];
  readonly series: readonly SpeedSeriesReport[];
  readonly unsupported: readonly { mode: string; reason: string }[];
}): string {
  const lines = [
    "# Speed benchmark",
    "",
    ...renderMetadata(report.schemaVersion, report.domain, report.sourceRuns),
  ];
  for (const series of report.series) {
    lines.push(
      "",
      `## ${series.mode}`,
      "",
      table([
        [
          "Case",
          "Input representation",
          "Input bytes",
          "Samples",
          "Operations/sample",
        ],
        ...series.cases.map((value) => [
          value.name,
          value.inputRepresentation,
          value.inputBytes,
          value.sampleCount,
          value.operationsPerSample,
        ]),
      ]),
      "",
      `### ${series.mode}: latency (μs/op)`,
      "",
      summaryTable(
        series.cases.map(({ latencyNanoseconds, name }) => ({
          name,
          summary: latencyNanoseconds,
        })),
        1_000,
      ),
      "",
      `### ${series.mode}: throughput (bytes/s)`,
      "",
      summaryTable(
        series.cases.map(({ name, throughputBytesPerSecond }) => ({
          name,
          summary: throughputBytesPerSecond,
        })),
        1,
        0,
      ),
    );
  }
  lines.push(
    "",
    "## Unsupported",
    "",
    ...report.unsupported.map(({ mode, reason }) => `- \`${mode}\`: ${reason}`),
    "",
  );
  return lines.join("\n");
}

function renderMemoryReport(report: {
  readonly schemaVersion: number;
  readonly domain: string;
  readonly sourceRuns: readonly RunMetadata[];
  readonly noiseFloorBytes: number;
  readonly series: readonly MemorySeriesReport[];
}): string {
  const lines = [
    "# Memory benchmark",
    "",
    ...renderMetadata(report.schemaVersion, report.domain, report.sourceRuns),
    "",
    `- Incremental Peak RSS noise floor: ${String(report.noiseFloorBytes)} bytes`,
  ];
  for (const series of report.series) {
    lines.push(
      "",
      `## ${series.mode}: ${series.workload}`,
      "",
      table([
        [
          "Case",
          "Input representation",
          "Output",
          "Input bytes",
          "Nodes",
          "Samples",
          "Noise samples",
        ],
        ...series.cases.map((value) => [
          value.name,
          value.inputRepresentation,
          value.outputKind,
          value.inputBytes,
          value.nodeCount,
          value.sampleCount,
          value.noiseSampleCount,
        ]),
      ]),
    );
    const metrics: readonly {
      readonly heading: string;
      readonly value: (item: MemoryCaseReport) => Summary | undefined;
      readonly digits?: number;
    }[] = [
      {
        heading: "Baseline Peak RSS (bytes)",
        value: (item) => item.baselinePeakRssBytes,
        digits: 0,
      },
      {
        heading: "Parse Peak RSS (bytes)",
        value: (item) => item.parsePeakRssBytes,
        digits: 0,
      },
      {
        heading: "Incremental Peak RSS (bytes)",
        value: (item) => item.incrementalPeakRssBytes,
        digits: 0,
      },
      {
        heading: "Peak amplification (bytes/input byte)",
        value: (item) => item.peakAmplification,
      },
      {
        heading: "Retained heap (bytes)",
        value: (item) => item.retainedHeapBytes,
        digits: 0,
      },
      {
        heading: "Retained external memory (bytes)",
        value: (item) => item.retainedExternalBytes,
        digits: 0,
      },
      {
        heading: "Retained ArrayBuffers (bytes)",
        value: (item) => item.retainedArrayBuffersBytes,
        digits: 0,
      },
      {
        heading: "Released heap delta (bytes)",
        value: (item) => item.releasedHeapBytes,
        digits: 0,
      },
      {
        heading: "Retained bytes/node",
        value: (item) => item.bytesPerNode,
      },
    ];
    for (const metric of metrics) {
      const values = series.cases.flatMap((item) => {
        const summary = metric.value(item);
        return summary === undefined ? [] : [{ name: item.name, summary }];
      });
      if (values.length > 0) {
        lines.push(
          "",
          `### ${metric.heading}`,
          "",
          summaryTable(values, 1, metric.digits),
        );
      }
    }
    for (const value of series.cases) {
      if (value.progress === undefined) {
        continue;
      }
      lines.push(
        "",
        `### ${value.name}: sequential checkpoints`,
        "",
        table([
          [
            "Metric",
            "Completed",
            "Count",
            "Minimum",
            "p50",
            "p95",
            "Maximum",
            "Mean",
            "Stddev",
          ],
          ...value.progress.flatMap((progress) =>
            [
              ["Baseline heap", progress.baselineHeapUsedBytes],
              ["Parse heap", progress.parseHeapUsedBytes],
              ["Incremental heap", progress.incrementalHeapUsedBytes],
            ].map(([name, summary]) => {
              const typedSummary = summary as Summary;
              return [
                name as string,
                progress.completed,
                typedSummary.count,
                decimal(typedSummary.minimum, 0),
                decimal(typedSummary.p50, 0),
                decimal(typedSummary.p95, 0),
                decimal(typedSummary.maximum, 0),
                decimal(typedSummary.mean, 0),
                decimal(typedSummary.standardDeviation, 0),
              ];
            }),
          ),
        ]),
      );
    }
  }
  lines.push(
    "",
    `Incremental Peak RSS values with an absolute value below ${String(report.noiseFloorBytes)} bytes are counted as noise; signed raw values remain in JSON and JSONL.`,
    "",
  );
  return lines.join("\n");
}

function readJsonLines<T>(path: string): T[] {
  return readFileSync(path, "utf8")
    .split("\n")
    .filter((line) => line.length > 0)
    .map((line) => JSON.parse(line) as T);
}

function readRuns(rawDirectory: string): readonly {
  readonly metadata: RunMetadata;
  readonly samplesPath: string;
}[] {
  return readdirSync(rawDirectory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map(({ name }) => ({
      metadata: JSON.parse(
        readFileSync(join(rawDirectory, name, "run.json"), "utf8"),
      ) as RunMetadata,
      samplesPath: join(rawDirectory, name, "samples.jsonl"),
    }));
}

async function writeReport(path: string, value: unknown): Promise<void> {
  writeFileSync(path, await format(JSON.stringify(value), { parser: "json" }));
}

async function main(): Promise<void> {
  const domain = process.argv[2];
  const rawDirectory = process.argv[3];
  const reportDirectory = process.argv[4];
  if (
    (domain !== "speed" && domain !== "memory") ||
    rawDirectory === undefined ||
    reportDirectory === undefined
  ) {
    throw new Error(
      "usage: report.ts <speed|memory> <raw-directory> <report-directory>",
    );
  }
  mkdirSync(reportDirectory, { recursive: true });
  const runs = readRuns(rawDirectory);
  const metadata = runs.map(({ metadata: value }) => value);
  if (domain === "speed") {
    const report = {
      schemaVersion: 1,
      domain,
      sourceRuns: metadata,
      series: aggregateSpeed(
        runs.flatMap(({ samplesPath }) =>
          readJsonLines<SpeedRawRecord>(samplesPath),
        ),
      ),
      unsupported: [
        {
          mode: "streaming",
          reason: "DOMParser does not expose a streaming input API.",
        },
      ],
    } as const;
    const jsonPath = join(reportDirectory, "report.json");
    await writeReport(jsonPath, report);
    const persisted = JSON.parse(
      readFileSync(jsonPath, "utf8"),
    ) as typeof report;
    writeFileSync(
      join(reportDirectory, "report.md"),
      renderSpeedReport(persisted),
    );
    return;
  }
  const report = {
    schemaVersion: 1,
    domain,
    sourceRuns: metadata,
    noiseFloorBytes,
    series: aggregateMemory(
      runs.flatMap(({ samplesPath }) =>
        readJsonLines<MemoryRawRecord>(samplesPath),
      ),
    ),
  } as const;
  const jsonPath = join(reportDirectory, "report.json");
  await writeReport(jsonPath, report);
  const persisted = JSON.parse(readFileSync(jsonPath, "utf8")) as typeof report;
  writeFileSync(
    join(reportDirectory, "report.md"),
    renderMemoryReport(persisted),
  );
}

if (import.meta.main) {
  await main();
}
