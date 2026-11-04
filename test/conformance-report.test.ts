import { describe, expect, it } from "vitest";

import {
  buildReport,
  classifyFailureKind,
  renderMarkdown,
  type FixtureRevisions,
  type RawCaseResult,
  type SuiteImplementation,
} from "../tools/conformance/report.js";

const fixtures: FixtureRevisions = {
  "readability/readability": {
    repository: "https://github.com/mozilla/readability.git",
    revision: "readability-revision",
  },
};

const implementation: SuiteImplementation = {
  name: "@mozilla/readability",
  version: "0.6.0",
  integrity: "sha512-example",
};

function result(
  caseId: string,
  classification: RawCaseResult["classification"],
  failureKind?: string,
): RawCaseResult {
  return {
    schemaVersion: 1,
    caseId,
    suite: "readability",
    profile: "text/html",
    fixtureFile: `${caseId}/source.html`,
    classification,
    testFile: "test/conformance/readability.test.ts",
    testName: caseId,
    ...(failureKind === undefined ? {} : { failureKind }),
  };
}

describe("Readability conformance reporting", () => {
  it("classifies only explicit failure markers", () => {
    expect(
      classifyFailureKind("fail", [
        {
          name: "AssertionError",
          message: '[conformance-failure:content-mismatch] {"index":1}',
        },
      ]),
    ).toBe("content-mismatch");
    expect(
      classifyFailureKind("error", [
        { name: "TypeError", message: "missing DOM operation" },
      ]),
    ).toBeUndefined();
    expect(classifyFailureKind("timeout", [])).toBeUndefined();
  });

  it("adds Readability totals and implementation metadata to reports", () => {
    const report = buildReport(
      [
        result("passing", "pass"),
        {
          ...result("connection", "error"),
          errors: [
            { name: "TypeError", message: "missing nextElementSibling" },
          ],
        },
        result("content", "fail", "content-mismatch"),
      ],
      fixtures,
      "failed",
      0,
      { readability: implementation },
    );

    expect(report.suites).toEqual([
      expect.objectContaining({
        name: "readability",
        implementation,
        failureKinds: {
          "content-mismatch": 1,
        },
        errors: [
          {
            name: "TypeError",
            message: "missing nextElementSibling",
            count: 1,
          },
        ],
      }),
    ]);
    const markdown = renderMarkdown(report);
    expect(markdown).toContain("## Failure kinds");
    expect(markdown).toContain("| readability | content-mismatch | 1 |");
    expect(markdown).toContain(
      "| readability | TypeError | missing nextElementSibling | 1 |",
    );
    expect(markdown).toContain("@mozilla/readability");
    expect(markdown).toContain("sha512-example");
  });
});
