import {
  appendFileSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { relative, resolve } from "node:path";

import type { Reporter, TestCase, TestRunEndReason } from "vitest/node";

import {
  buildReport,
  classifyResult,
  renderMarkdown,
  type ConformanceCaseMetadata,
  type FixtureRevisions,
  type RawCaseResult,
  type RawError,
} from "./report.js";

interface ConformanceManifest {
  readonly schemaVersion: number;
  readonly fixtures: FixtureRevisions;
}

function requiredEnvironment(name: string): string {
  const value = process.env[name];
  if (value === undefined || value === "") {
    throw new Error(`${name} is required by the conformance reporter`);
  }
  return value;
}

function metadata(testCase: TestCase): ConformanceCaseMetadata {
  const value: unknown = (testCase.meta() as Record<string, unknown>)
    .conformance;
  if (value === null || typeof value !== "object") {
    throw new Error(`missing conformance metadata: ${testCase.fullName}`);
  }
  const candidate = value as Record<string, unknown>;
  if (
    typeof candidate.caseId !== "string" ||
    typeof candidate.suite !== "string" ||
    typeof candidate.profile !== "string" ||
    typeof candidate.fixtureFile !== "string"
  ) {
    throw new Error(`invalid conformance metadata: ${testCase.fullName}`);
  }
  const excludedAs = candidate.excludedAs;
  if (
    excludedAs !== undefined &&
    excludedAs !== "unsupported" &&
    excludedAs !== "skip"
  ) {
    throw new Error(`invalid conformance exclusion: ${testCase.fullName}`);
  }
  const reason = candidate.reason;
  if (reason !== undefined && typeof reason !== "string") {
    throw new Error(
      `invalid conformance exclusion reason: ${testCase.fullName}`,
    );
  }
  const fixtureLine = candidate.fixtureLine;
  if (
    fixtureLine !== undefined &&
    (typeof fixtureLine !== "number" ||
      !Number.isInteger(fixtureLine) ||
      fixtureLine < 1)
  ) {
    throw new Error(`invalid conformance fixture line: ${testCase.fullName}`);
  }
  return {
    caseId: candidate.caseId,
    suite: candidate.suite,
    profile: candidate.profile,
    fixtureFile: candidate.fixtureFile,
    ...(fixtureLine === undefined ? {} : { fixtureLine }),
    ...(excludedAs === undefined ? {} : { excludedAs }),
    ...(reason === undefined ? {} : { reason }),
  };
}

function rawError(value: unknown): RawError {
  if (value !== null && typeof value === "object") {
    const candidate = value as Record<string, unknown>;
    const name = candidate.name;
    const message = candidate.message;
    const stack = candidate.stack;
    return {
      ...(typeof name === "string" ? { name } : {}),
      message:
        typeof message === "string" ? message : JSON.stringify(candidate),
      ...(typeof stack === "string" ? { stack } : {}),
    };
  }
  return { message: String(value) };
}

export default class ConformanceReporter implements Reporter {
  readonly #rawDirectory = resolve(
    requiredEnvironment("PALIM_CONFORMANCE_RAW_DIRECTORY"),
  );
  readonly #reportDirectory = resolve(
    requiredEnvironment("PALIM_CONFORMANCE_REPORT_DIRECTORY"),
  );
  readonly #manifestPath = resolve(
    process.env.PALIM_CONFORMANCE_MANIFEST ?? "conformance/conformance.json",
  );
  readonly #resultsPath = resolve(this.#rawDirectory, "results.jsonl");
  readonly #results: RawCaseResult[] = [];

  constructor() {
    mkdirSync(this.#rawDirectory, { recursive: true });
    mkdirSync(this.#reportDirectory, { recursive: true });
    writeFileSync(this.#resultsPath, "");
  }

  onTestCaseResult(testCase: TestCase): void {
    const meta = metadata(testCase);
    const result = testCase.result();
    const errors = (result.errors ?? []).map(rawError);
    const diagnostic = testCase.diagnostic();
    const raw: RawCaseResult = {
      schemaVersion: 1,
      ...meta,
      classification: classifyResult(result.state, meta.excludedAs, errors),
      testFile: relative(process.cwd(), testCase.module.moduleId),
      testName: testCase.fullName,
      ...(diagnostic?.duration === undefined
        ? {}
        : { durationMilliseconds: diagnostic.duration }),
      ...(errors.length === 0 ? {} : { errors }),
    };
    this.#results.push(raw);
    appendFileSync(this.#resultsPath, `${JSON.stringify(raw)}\n`);
  }

  onTestRunEnd(
    _testModules: Parameters<NonNullable<Reporter["onTestRunEnd"]>>[0],
    unhandledErrors: Parameters<NonNullable<Reporter["onTestRunEnd"]>>[1],
    reason: TestRunEndReason,
  ): void {
    const manifest = JSON.parse(
      readFileSync(this.#manifestPath, "utf8"),
    ) as ConformanceManifest;
    if (manifest.schemaVersion !== 1) {
      throw new Error(
        `unsupported conformance manifest schema ${String(manifest.schemaVersion)}`,
      );
    }
    const report = buildReport(
      this.#results,
      manifest.fixtures,
      reason,
      unhandledErrors.length,
    );
    writeFileSync(
      resolve(this.#reportDirectory, "report.json"),
      `${JSON.stringify(report, null, 2)}\n`,
    );
    writeFileSync(
      resolve(this.#reportDirectory, "report.md"),
      renderMarkdown(report),
    );
    writeFileSync(
      resolve(this.#rawDirectory, "run.json"),
      `${JSON.stringify(
        {
          schemaVersion: 1,
          runStatus: reason,
          resultCount: this.#results.length,
          fixtures: manifest.fixtures,
          unhandledErrors,
          reportFiles: [
            relative(
              process.cwd(),
              resolve(this.#reportDirectory, "report.json"),
            ),
            relative(
              process.cwd(),
              resolve(this.#reportDirectory, "report.md"),
            ),
          ],
        },
        null,
        2,
      )}\n`,
    );
  }
}
