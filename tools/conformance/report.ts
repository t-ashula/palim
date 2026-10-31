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
}

export type ClassificationTotals = Record<Classification, number> & {
  total: number;
};

export interface FinalCaseResult {
  readonly file: string;
  readonly line?: number;
  readonly classification: Classification;
  readonly reason?: string;
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
    file: result.fixtureFile,
    ...(result.fixtureLine === undefined ? {} : { line: result.fixtureLine }),
    classification: result.classification,
    ...(result.reason === undefined ? {} : { reason: result.reason }),
  };
}

export function buildReport(
  results: readonly RawCaseResult[],
  fixtures: FixtureRevisions,
  runStatus: ConformanceReport["runStatus"],
  unhandledErrorCount: number,
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
    return {
      name: suiteName,
      source: { name: sourceName, revision: source.revision },
      totals: totals(suiteResults),
      profiles,
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
      "| Suite | Profile | File | Line | Classification | Reason |",
      "| --- | --- | --- | ---: | --- | --- |",
    );
    for (const { suite, profile, result } of nonPassing) {
      const reason = (result.reason ?? "").replaceAll("|", "\\|");
      const line = result.line === undefined ? "" : String(result.line);
      lines.push(
        `| ${suite} | ${profile} | ${result.file} | ${line} | ${result.classification} | ${reason} |`,
      );
    }
  }

  lines.push("");
  return lines.join("\n");
}
