export const classifications = [
  "pass",
  "fail",
  "unsupported",
  "skip",
  "error",
  "timeout",
] as const;

export type Classification = (typeof classifications)[number];

export interface ConformanceCaseMetadata {
  readonly caseId: string;
  readonly suite: string;
  readonly profile: string;
  readonly fixtureFile: string;
  readonly fixtureLine?: number;
  readonly excludedAs?: "unsupported" | "skip";
  readonly reason?: string;
}

export interface RawError {
  readonly name?: string;
  readonly message: string;
  readonly stack?: string;
}

export interface RawCaseResult extends ConformanceCaseMetadata {
  readonly schemaVersion: 1;
  readonly classification: Classification;
  readonly testFile: string;
  readonly testName: string;
  readonly durationMilliseconds?: number;
  readonly errors?: readonly RawError[];
  readonly failureKind?: string;
}

export type ClassificationTotals = Record<Classification, number> & {
  total: number;
};

export interface FinalCaseResult {
  readonly caseId: string;
  readonly file: string;
  readonly line?: number;
  readonly classification: Classification;
  readonly failureKind?: string;
  readonly errors?: readonly ReportedError[];
  readonly reason?: string;
}

export interface ReportedError {
  readonly name?: string;
  readonly message: string;
}

export interface ErrorSummary extends ReportedError {
  readonly count: number;
}

export interface ProfileReport {
  readonly name: string;
  readonly totals: ClassificationTotals;
  readonly nonPassingCases: readonly FinalCaseResult[];
}

export interface SuiteReport {
  readonly name: string;
  readonly source: {
    readonly name: string;
    readonly revision: string;
  };
  readonly totals: ClassificationTotals;
  readonly profiles: readonly ProfileReport[];
  readonly failureKinds?: Readonly<Record<string, number>>;
  readonly errors?: readonly ErrorSummary[];
  readonly implementation?: SuiteImplementation;
}

export interface SuiteImplementation {
  readonly name: string;
  readonly version: string;
  readonly integrity: string;
}

export interface ConformanceReport {
  readonly schemaVersion: 1;
  readonly runStatus: "passed" | "failed" | "interrupted";
  readonly unhandledErrorCount: number;
  readonly totals: ClassificationTotals;
  readonly suites: readonly SuiteReport[];
}

export interface FixtureRevision {
  readonly repository: string;
  readonly revision: string;
}

export type FixtureRevisions = Readonly<Record<string, FixtureRevision>>;

export type CaseState = "passed" | "failed" | "skipped" | "pending";

const suiteSources: Readonly<Record<string, string>> = {
  "html5lib-tokenizer": "html5lib/html5lib-tests",
  "html5lib-tree-construction": "wpt/wpt",
  readability: "readability/readability",
  "wpt-url-constructor": "wpt/wpt",
  "wpt-url-idna": "wpt/wpt",
  "wpt-url-origin": "wpt/wpt",
  "wpt-url-setters": "wpt/wpt",
  "wpt-window": "wpt/wpt",
  "w3c-xml-parser": "w3c/xml-test-suite",
};

function isTimeout(error: RawError): boolean {
  return (
    error.name === "TimeoutError" ||
    /(?:timed out|timeout)/iu.test(error.message)
  );
}

function isAssertion(error: RawError): boolean {
  return error.name === "AssertionError";
}

export function classifyResult(
  state: CaseState,
  excludedAs: ConformanceCaseMetadata["excludedAs"],
  errors: readonly RawError[],
): Classification {
  switch (state) {
    case "passed":
      return "pass";
    case "skipped":
      return excludedAs ?? "skip";
    case "failed":
      return errors.some(isTimeout)
        ? "timeout"
        : errors.length > 0 && errors.every(isAssertion)
          ? "fail"
          : "error";
    case "pending":
      return "error";
  }
}

export function classifyFailureKind(
  classification: Classification,
  errors: readonly RawError[],
): string | undefined {
  if (
    classification === "pass" ||
    classification === "skip" ||
    classification === "unsupported" ||
    classification === "timeout"
  ) {
    return undefined;
  }
  for (const error of errors) {
    const marker = /\[conformance-failure:([^\]]+)\]/u.exec(error.message);
    if (marker?.[1] !== undefined) {
      return marker[1];
    }
  }
  return undefined;
}

export function emptyTotals(): ClassificationTotals {
  return {
    total: 0,
    pass: 0,
    fail: 0,
    unsupported: 0,
    skip: 0,
    error: 0,
    timeout: 0,
  };
}

function totals(results: readonly RawCaseResult[]): ClassificationTotals {
  const result = emptyTotals();
  for (const item of results) {
    result.total += 1;
    result[item.classification] += 1;
  }
  return result;
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function finalCase(result: RawCaseResult): FinalCaseResult {
  return {
    caseId: result.caseId,
    file: result.fixtureFile,
    ...(result.fixtureLine === undefined ? {} : { line: result.fixtureLine }),
    classification: result.classification,
    ...(result.failureKind === undefined
      ? {}
      : { failureKind: result.failureKind }),
    ...(result.errors === undefined
      ? {}
      : {
          errors: result.errors.map(({ name, message }) => ({
            ...(name === undefined ? {} : { name }),
            message,
          })),
        }),
    ...(result.reason === undefined ? {} : { reason: result.reason }),
  };
}

function errorSummaries(results: readonly RawCaseResult[]): ErrorSummary[] {
  const summaries = new Map<string, ErrorSummary>();
  for (const error of results.flatMap(({ errors }) => errors ?? [])) {
    const key = JSON.stringify([error.name ?? null, error.message]);
    const summary = summaries.get(key);
    if (summary === undefined) {
      summaries.set(key, {
        ...(error.name === undefined ? {} : { name: error.name }),
        message: error.message,
        count: 1,
      });
    } else {
      summaries.set(key, { ...summary, count: summary.count + 1 });
    }
  }
  return [...summaries.values()].toSorted((left, right) => {
    const countOrder = right.count - left.count;
    if (countOrder !== 0) {
      return countOrder;
    }
    const nameOrder = compareText(left.name ?? "", right.name ?? "");
    return nameOrder === 0
      ? compareText(left.message, right.message)
      : nameOrder;
  });
}

export function buildReport(
  results: readonly RawCaseResult[],
  fixtures: FixtureRevisions,
  runStatus: ConformanceReport["runStatus"],
  unhandledErrorCount: number,
  implementations: Readonly<Record<string, SuiteImplementation>> = {},
): ConformanceReport {
  const suiteNames = [...new Set(results.map(({ suite }) => suite))].sort(
    compareText,
  );
  const suites = suiteNames.map((suiteName): SuiteReport => {
    const suiteResults = results.filter(({ suite }) => suite === suiteName);
    const sourceName = suiteSources[suiteName];
    if (sourceName === undefined) {
      throw new Error(
        `missing fixture source for conformance suite ${suiteName}`,
      );
    }
    const source = fixtures[sourceName];
    if (source === undefined) {
      throw new Error(`missing fixture revision for ${sourceName}`);
    }
    const profileNames = [
      ...new Set(suiteResults.map(({ profile }) => profile)),
    ].sort(compareText);
    const profiles = profileNames.map((profileName): ProfileReport => {
      const profileResults = suiteResults.filter(
        ({ profile }) => profile === profileName,
      );
      const nonPassingResults = profileResults
        .filter(({ classification }) => classification !== "pass")
        .toSorted((left, right) => {
          const fileOrder = compareText(left.fixtureFile, right.fixtureFile);
          if (fileOrder !== 0) {
            return fileOrder;
          }
          const lineOrder =
            (left.fixtureLine ?? Number.MAX_SAFE_INTEGER) -
            (right.fixtureLine ?? Number.MAX_SAFE_INTEGER);
          return lineOrder === 0
            ? compareText(left.caseId, right.caseId)
            : lineOrder;
        });
      return {
        name: profileName,
        totals: totals(profileResults),
        nonPassingCases: nonPassingResults.map(finalCase),
      };
    });
    const failureKindNames = [
      ...new Set(
        suiteResults.flatMap(({ failureKind }) =>
          failureKind === undefined ? [] : [failureKind],
        ),
      ),
    ].sort(compareText);
    const errors = errorSummaries(suiteResults);
    return {
      name: suiteName,
      source: { name: sourceName, revision: source.revision },
      totals: totals(suiteResults),
      profiles,
      ...(failureKindNames.length === 0
        ? {}
        : {
            failureKinds: Object.fromEntries(
              failureKindNames.map((failureKind) => [
                failureKind,
                suiteResults.filter(
                  (result) => result.failureKind === failureKind,
                ).length,
              ]),
            ),
          }),
      ...(errors.length === 0 ? {} : { errors }),
      ...(implementations[suiteName] === undefined
        ? {}
        : { implementation: implementations[suiteName] }),
    };
  });

  return {
    schemaVersion: 1,
    runStatus,
    unhandledErrorCount,
    totals: totals(results),
    suites,
  };
}

function percentage(pass: number, total: number): string {
  return total === 0 ? "0.00%" : `${((pass / total) * 100).toFixed(2)}%`;
}

function totalsRow(name: string, value: ClassificationTotals): string {
  return `| ${name} | ${String(value.total)} | ${String(value.pass)} | ${String(value.fail)} | ${String(value.unsupported)} | ${String(value.skip)} | ${String(value.error)} | ${String(value.timeout)} | ${percentage(value.pass, value.total)} |`;
}

function profileTotalsRow(
  suite: string,
  profile: string,
  value: ClassificationTotals,
): string {
  return `| ${suite} | ${profile} | ${String(value.total)} | ${String(value.pass)} | ${String(value.fail)} | ${String(value.unsupported)} | ${String(value.skip)} | ${String(value.error)} | ${String(value.timeout)} | ${percentage(value.pass, value.total)} |`;
}

function markdownCell(value: string): string {
  return value.replaceAll("|", "\\|").replaceAll(/\r?\n/gu, "<br>");
}

export function renderMarkdown(report: ConformanceReport): string {
  const lines = [
    "# Conformance report",
    "",
    `Run status: ${report.runStatus}`,
    "",
    "## Suite totals",
    "",
    "| Suite | Total | Pass | Fail | Unsupported | Skip | Error | Timeout | Pass rate |",
    "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
    totalsRow("All", report.totals),
  ];

  for (const suite of report.suites) {
    lines.push(totalsRow(suite.name, suite.totals));
  }

  lines.push(
    "",
    "## Suite sources",
    "",
    "| Suite | Fixture | Revision | Implementation | Version | Integrity |",
    "| --- | --- | --- | --- | --- | --- |",
  );
  for (const suite of report.suites) {
    lines.push(
      `| ${suite.name} | ${suite.source.name} | ${suite.source.revision} | ${suite.implementation?.name ?? ""} | ${suite.implementation?.version ?? ""} | ${suite.implementation?.integrity ?? ""} |`,
    );
  }

  lines.push(
    "",
    "## Profile totals",
    "",
    "| Suite | Profile | Total | Pass | Fail | Unsupported | Skip | Error | Timeout | Pass rate |",
    "| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
  );
  for (const suite of report.suites) {
    for (const profile of suite.profiles) {
      lines.push(profileTotalsRow(suite.name, profile.name, profile.totals));
    }
  }

  const failureKinds = report.suites.flatMap((suite) =>
    Object.entries(suite.failureKinds ?? {}).map(([kind, count]) => ({
      suite: suite.name,
      kind,
      count,
    })),
  );
  lines.push("", "## Failure kinds", "");
  if (failureKinds.length === 0) {
    lines.push("None.");
  } else {
    lines.push("| Suite | Failure kind | Count |", "| --- | --- | ---: |");
    for (const { suite, kind, count } of failureKinds) {
      lines.push(`| ${suite} | ${kind} | ${String(count)} |`);
    }
  }

  const errors = report.suites.flatMap((suite) =>
    (suite.errors ?? []).map((error) => ({ suite: suite.name, error })),
  );
  lines.push("", "## Errors", "");
  if (errors.length === 0) {
    lines.push("None.");
  } else {
    lines.push(
      "| Suite | Name | Message | Count |",
      "| --- | --- | --- | ---: |",
    );
    for (const { suite, error } of errors) {
      lines.push(
        `| ${suite} | ${markdownCell(error.name ?? "")} | ${markdownCell(error.message)} | ${String(error.count)} |`,
      );
    }
  }

  const nonPassing = report.suites.flatMap((suite) =>
    suite.profiles.flatMap((profile) =>
      profile.nonPassingCases.map((result) => ({
        suite: suite.name,
        profile: profile.name,
        result,
      })),
    ),
  );
  lines.push("", "## Non-passing cases", "");
  if (nonPassing.length === 0) {
    lines.push("None.");
  } else {
    lines.push(
      "| Suite | Profile | Case ID | File | Line | Classification | Failure kind | Errors | Reason |",
      "| --- | --- | --- | --- | ---: | --- | --- | --- | --- |",
    );
    for (const { suite, profile, result } of nonPassing) {
      const reason = (result.reason ?? "").replaceAll("|", "\\|");
      const line = result.line === undefined ? "" : String(result.line);
      const errors = (result.errors ?? [])
        .map((error) =>
          markdownCell(
            `${error.name === undefined ? "" : `${error.name}: `}${error.message}`,
          ),
        )
        .join("<br>");
      lines.push(
        `| ${suite} | ${profile} | ${result.caseId} | ${result.file} | ${line} | ${result.classification} | ${result.failureKind ?? ""} | ${errors} | ${reason} |`,
      );
    }
  }

  lines.push("");
  return lines.join("\n");
}
