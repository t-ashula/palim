import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import {
  buildReport,
  renderMarkdown,
  type Classification,
  type FixtureRevisions,
  type RawCaseResult,
} from "./report.js";

interface WPTSubtestResult {
  readonly name: string;
  readonly status: string;
  readonly message?: string | null;
}

interface WPTTestResult {
  readonly test: string;
  readonly status: string;
  readonly message?: string | null;
  readonly duration?: number;
  readonly subtests: readonly WPTSubtestResult[];
}

interface WPTReport {
  readonly results: readonly WPTTestResult[];
}

interface ConformanceManifest {
  readonly schemaVersion: number;
  readonly fixtures: FixtureRevisions;
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

function rawResult(
  test: WPTTestResult,
  caseId: string,
  testName: string,
  status: string,
  message?: string | null,
): RawCaseResult {
  const resultClassification = classification(status);
  return {
    schemaVersion: 1,
    caseId,
    suite: "wpt-window",
    profile: "window",
    fixtureFile: test.test,
    classification: resultClassification,
    testFile: `conformance/wpt/wpt${test.test}`,
    testName,
    ...(test.duration === undefined
      ? {}
      : { durationMilliseconds: test.duration }),
    ...(resultClassification === "pass" ||
    message === null ||
    message === undefined
      ? {}
      : { errors: [{ message }] }),
  };
}

export function convertWPTReport(report: WPTReport): RawCaseResult[] {
  const results: RawCaseResult[] = [];
  for (const test of report.results) {
    if (test.subtests.length === 0 || classification(test.status) !== "pass") {
      results.push(
        rawResult(
          test,
          `${test.test}#harness`,
          test.test,
          test.status,
          test.message,
        ),
      );
    }
    for (const subtest of test.subtests) {
      results.push(
        rawResult(
          test,
          `${test.test}#${subtest.name}`,
          `${test.test} — ${subtest.name}`,
          subtest.status,
          subtest.message,
        ),
      );
    }
  }
  return results;
}

function requiredEnvironment(name: string): string {
  const value = process.env[name];
  if (value === undefined || value === "") {
    throw new Error(`${name} is required by the WPT report converter`);
  }
  return value;
}

function main(): void {
  const wptReportPath = process.argv[2];
  const exitCode = Number(process.argv[3]);
  if (wptReportPath === undefined || !Number.isInteger(exitCode)) {
    throw new TypeError("usage: wpt-report.ts WPT_REPORT EXIT_CODE");
  }
  const rawDirectory = resolve(
    requiredEnvironment("PALIM_CONFORMANCE_RAW_DIRECTORY"),
  );
  const reportDirectory = resolve(
    requiredEnvironment("PALIM_CONFORMANCE_REPORT_DIRECTORY"),
  );
  const manifestPath = resolve(
    requiredEnvironment("PALIM_CONFORMANCE_MANIFEST"),
  );
  const wptReport = JSON.parse(
    readFileSync(wptReportPath, "utf8"),
  ) as WPTReport;
  const manifest = JSON.parse(
    readFileSync(manifestPath, "utf8"),
  ) as ConformanceManifest;
  if (manifest.schemaVersion !== 1) {
    throw new Error(
      `unsupported conformance manifest schema ${String(manifest.schemaVersion)}`,
    );
  }
  const results = convertWPTReport(wptReport);
  const runStatus = exitCode === 0 ? "passed" : "failed";
  const report = buildReport(results, manifest.fixtures, runStatus, 0);
  mkdirSync(rawDirectory, { recursive: true });
  mkdirSync(reportDirectory, { recursive: true });
  writeFileSync(
    resolve(rawDirectory, "results.jsonl"),
    results.map((result) => JSON.stringify(result)).join("\n") + "\n",
  );
  writeFileSync(
    resolve(reportDirectory, "report.json"),
    `${JSON.stringify(report, null, 2)}\n`,
  );
  writeFileSync(resolve(reportDirectory, "report.md"), renderMarkdown(report));
  writeFileSync(
    resolve(rawDirectory, "run.json"),
    `${JSON.stringify(
      {
        schemaVersion: 1,
        runStatus,
        resultCount: results.length,
        fixtures: manifest.fixtures,
        wptReport: relative(process.cwd(), wptReportPath),
        reportFiles: [
          relative(process.cwd(), resolve(reportDirectory, "report.json")),
          relative(process.cwd(), resolve(reportDirectory, "report.md")),
        ],
      },
      null,
      2,
    )}\n`,
  );
}

const entryPath = process.argv[1];
if (
  entryPath !== undefined &&
  import.meta.url === pathToFileURL(entryPath).href
) {
  main();
}
