import type { Classification } from "./report.js";

export interface WPTSubtestResult {
  readonly name: string;
  readonly status: string;
  readonly message?: string | null;
}

export interface WPTTestResult {
  readonly test: string;
  readonly status: string;
  readonly message?: string | null;
  readonly duration?: number;
  readonly subtests: readonly WPTSubtestResult[];
}

export interface WPTReport {
  readonly results: readonly WPTTestResult[];
}

export type WPTURLStatus =
  "pass" | "fail" | "skip" | "error" | "timeout" | "pending";

export interface WPTProgressTotals {
  readonly total: number;
  readonly executed: number;
  readonly pass: number;
  readonly fail: number;
  readonly skip: number;
  readonly error: number;
  readonly timeout: number;
  readonly pending: number;
}

export interface WPTSubtestTotals {
  readonly total: number;
  readonly pass: number;
  readonly fail: number;
  readonly skip: number;
  readonly error: number;
  readonly timeout: number;
}

export interface WPTCampaignReport {
  readonly id: string;
  readonly state: "running" | "interrupted" | "completed";
  readonly palim: {
    readonly revision: string;
    readonly dirty: boolean;
    readonly imageId: string;
  };
  readonly lastAttemptSequence: number;
  readonly snapshotAt: string;
  readonly workerFailures: number;
  readonly retries: number;
}

export interface WPTProgressReport {
  readonly schemaVersion: 1;
  readonly runStatus: "passed" | "failed" | "interrupted";
  readonly source: {
    readonly name: "wpt/wpt";
    readonly revision: string;
  };
  readonly campaign?: WPTCampaignReport;
  readonly selection: {
    readonly include: readonly string[];
    readonly exclude: readonly string[];
  };
  readonly totals: WPTProgressTotals;
  readonly areas: readonly {
    readonly prefix: string;
    readonly totals: WPTProgressTotals;
  }[];
  readonly subtests: WPTSubtestTotals;
  readonly nonPassingTests: readonly {
    readonly url: string;
    readonly status: Exclude<WPTURLStatus, "pass" | "pending">;
    readonly message?: string;
  }[];
}

function classification(status: string): Classification {
  switch (status) {
    case "OK":
    case "PASS":
      return "pass";
    case "FAIL":
      return "fail";
    case "TIMEOUT":
      return "timeout";
    case "SKIP":
      return "skip";
    default:
      return "error";
  }
}

function urlStatus(test: WPTTestResult): Exclude<WPTURLStatus, "pending"> {
  const harnessStatus = classification(test.status);
  if (harnessStatus !== "pass") {
    return harnessStatus === "unsupported" ? "error" : harnessStatus;
  }
  const subtestStatuses = test.subtests.map(({ status }) =>
    classification(status),
  );
  if (subtestStatuses.includes("timeout")) {
    return "timeout";
  }
  if (
    subtestStatuses.includes("error") ||
    subtestStatuses.includes("unsupported")
  ) {
    return "error";
  }
  if (subtestStatuses.includes("fail")) {
    return "fail";
  }
  if (
    subtestStatuses.length > 0 &&
    subtestStatuses.every((status) => status === "skip")
  ) {
    return "skip";
  }
  return "pass";
}

function emptyProgressTotals(): WPTProgressTotals {
  return {
    total: 0,
    executed: 0,
    pass: 0,
    fail: 0,
    skip: 0,
    error: 0,
    timeout: 0,
    pending: 0,
  };
}

function addURLStatus(
  totals: WPTProgressTotals,
  status: WPTURLStatus,
): WPTProgressTotals {
  const next = { ...totals };
  next.total += 1;
  if (status !== "pending") {
    next.executed += 1;
  }
  next[status] += 1;
  return next;
}

function emptySubtestTotals(): WPTSubtestTotals {
  return {
    total: 0,
    pass: 0,
    fail: 0,
    skip: 0,
    error: 0,
    timeout: 0,
  };
}

function addSubtestStatus(
  totals: WPTSubtestTotals,
  status: Classification,
): WPTSubtestTotals {
  const normalized = status === "unsupported" ? "error" : status;
  const next = { ...totals };
  next.total += 1;
  next[normalized] += 1;
  return next;
}

function resultMessage(test: WPTTestResult): string | undefined {
  if (test.message !== undefined && test.message !== null) {
    return test.message;
  }
  return (
    test.subtests.find(({ status }) => classification(status) !== "pass")
      ?.message ?? undefined
  );
}

export function buildWPTProgressReport(
  rawReport: WPTReport,
  selectedURLs: readonly string[],
  include: readonly string[],
  exclude: readonly string[],
  revision: string,
  runStatus: WPTProgressReport["runStatus"],
  campaign?: WPTCampaignReport,
): WPTProgressReport {
  const results = new Map(
    rawReport.results.map((result) => [result.test, result]),
  );
  const statuses = new Map<string, WPTURLStatus>();
  let totals = emptyProgressTotals();
  for (const url of selectedURLs) {
    const result = results.get(url);
    const status = result === undefined ? "pending" : urlStatus(result);
    statuses.set(url, status);
    totals = addURLStatus(totals, status);
  }

  const areas = include.map((prefix) => {
    let areaTotals = emptyProgressTotals();
    for (const [url, status] of statuses) {
      if (url.startsWith(prefix)) {
        areaTotals = addURLStatus(areaTotals, status);
      }
    }
    return { prefix, totals: areaTotals };
  });

  let subtests = emptySubtestTotals();
  for (const test of rawReport.results) {
    if (!statuses.has(test.test)) {
      continue;
    }
    if (test.subtests.length === 0) {
      subtests = addSubtestStatus(subtests, classification(test.status));
    } else {
      for (const subtest of test.subtests) {
        subtests = addSubtestStatus(subtests, classification(subtest.status));
      }
    }
  }

  const nonPassingTests = rawReport.results.flatMap((test) => {
    if (!statuses.has(test.test)) {
      return [];
    }
    const status = urlStatus(test);
    if (status === "pass") {
      return [];
    }
    const message = resultMessage(test);
    return [
      {
        url: test.test,
        status,
        ...(message === undefined ? {} : { message }),
      },
    ];
  });

  return {
    schemaVersion: 1,
    runStatus,
    source: { name: "wpt/wpt", revision },
    ...(campaign === undefined ? {} : { campaign }),
    selection: { include, exclude },
    totals,
    areas,
    subtests,
    nonPassingTests,
  };
}

function record(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export function selectWPTURLs(
  manifest: unknown,
  include: readonly string[],
  exclude: readonly string[],
): string[] {
  const root = record(manifest);
  const items = record(root?.items);
  const testharness = record(items?.testharness);
  if (testharness === null) {
    throw new TypeError("WPT manifest has no testharness items");
  }
  const urls = new Set<string>();
  collectManifestURLs(testharness, "", urls);
  return [...urls]
    .filter(
      (url) =>
        include.some((prefix) => url.startsWith(prefix)) &&
        !exclude.some((prefix) => url.startsWith(prefix)),
    )
    .sort();
}

function collectManifestURLs(
  node: Record<string, unknown>,
  sourcePath: string,
  urls: Set<string>,
): void {
  for (const [name, value] of Object.entries(node)) {
    const path = sourcePath === "" ? name : `${sourcePath}/${name}`;
    if (Array.isArray(value)) {
      for (const test of value.slice(1)) {
        if (!Array.isArray(test)) {
          continue;
        }
        const rawURL: unknown = test[0] ?? path;
        if (typeof rawURL === "string") {
          urls.add(rawURL.startsWith("/") ? rawURL : `/${rawURL}`);
        }
      }
      continue;
    }
    const child = record(value);
    if (child !== null) {
      collectManifestURLs(child, path, urls);
    }
  }
}

function percentage(numerator: number, denominator: number): string {
  return denominator === 0
    ? "0.00%"
    : `${((numerator / denominator) * 100).toFixed(2)}%`;
}

function progressRow(name: string, totals: WPTProgressTotals): string {
  return `| ${name} | ${String(totals.total)} | ${String(totals.executed)} | ${String(totals.pass)} | ${String(totals.fail)} | ${String(totals.skip)} | ${String(totals.error)} | ${String(totals.timeout)} | ${String(totals.pending)} | ${percentage(totals.executed, totals.total)} | ${percentage(totals.pass, totals.executed)} |`;
}

export function renderWPTProgressMarkdown(report: WPTProgressReport): string {
  const lines = [
    "# WPT progress report",
    "",
    `Run status: ${report.runStatus}`,
    "",
    `Source: ${report.source.name}@${report.source.revision}`,
  ];
  if (report.campaign !== undefined) {
    lines.push(
      "",
      `Campaign: ${report.campaign.id}`,
      "",
      `Campaign state: ${report.campaign.state}`,
      "",
      `Palim: ${report.campaign.palim.revision}${report.campaign.palim.dirty ? " (dirty)" : ""}`,
      "",
      `Container image: ${report.campaign.palim.imageId}`,
      "",
      `Snapshot: ${report.campaign.snapshotAt}`,
      "",
      `Attempts: ${String(report.campaign.lastAttemptSequence)}; worker failures: ${String(report.campaign.workerFailures)}; retries: ${String(report.campaign.retries)}`,
    );
  }
  lines.push(
    "",
    "## URL progress",
    "",
    "| Area | Total | Executed | Pass | Fail | Skip | Error | Timeout | Pending | Progress | Pass rate |",
    "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
    progressRow("All", report.totals),
  );
  for (const area of report.areas) {
    lines.push(progressRow(area.prefix, area.totals));
  }
  lines.push(
    "",
    "## Executed subtests",
    "",
    "| Total | Pass | Fail | Skip | Error | Timeout | Pass rate |",
    "| ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
    `| ${String(report.subtests.total)} | ${String(report.subtests.pass)} | ${String(report.subtests.fail)} | ${String(report.subtests.skip)} | ${String(report.subtests.error)} | ${String(report.subtests.timeout)} | ${percentage(report.subtests.pass, report.subtests.total)} |`,
    "",
    "## Non-passing executed tests",
    "",
  );
  if (report.nonPassingTests.length === 0) {
    lines.push("None.");
  } else {
    lines.push("| URL | Status | Message |", "| --- | --- | --- |");
    for (const test of report.nonPassingTests) {
      lines.push(
        `| ${test.url} | ${test.status} | ${(test.message ?? "").replaceAll("|", "\\|").replaceAll("\n", " ")} |`,
      );
    }
  }
  lines.push("");
  return lines.join("\n");
}
