import { describe, expect, it } from "vitest";

import { convertWPTReport } from "../tools/conformance/wpt-report.js";
import {
  buildWPTProgressReport,
  renderWPTProgressMarkdown,
  selectWPTURLs,
} from "../tools/conformance/wpt-progress.js";

describe("WPT conformance report conversion", () => {
  it("records subtests and a failing harness in the conformance format", () => {
    const results = convertWPTReport({
      results: [
        {
          test: "/dom/example.html",
          status: "ERROR",
          message: "harness failed",
          duration: 25,
          subtests: [
            { name: "passes", status: "PASS" },
            { name: "fails", status: "FAIL", message: "not equal" },
          ],
        },
      ],
    });

    expect(
      results.map(({ caseId, classification }) => [caseId, classification]),
    ).toEqual([
      ["/dom/example.html#harness", "error"],
      ["/dom/example.html#passes", "pass"],
      ["/dom/example.html#fails", "fail"],
    ]);
    expect(results[0]?.suite).toBe("wpt-window");
    expect(results[0]?.profile).toBe("window");
    expect(results[0]?.errors).toEqual([{ message: "harness failed" }]);
  });

  it("uses the harness result when a test has no subtests", () => {
    expect(
      convertWPTReport({
        results: [
          {
            test: "/dom/empty.html",
            status: "TIMEOUT",
            subtests: [],
          },
        ],
      })[0]?.classification,
    ).toBe("timeout");
  });

  it("selects manifest URLs with include and exclude prefixes", () => {
    const manifest = {
      items: {
        testharness: {
          dom: {
            "example.any.js": [
              "hash",
              ["dom/example.any.html", {}],
              ["dom/example.any.worker.html", {}],
            ],
            "excluded.html": ["hash", [null, {}]],
          },
          url: {
            "outside.html": ["hash", [null, {}]],
          },
        },
      },
    };

    expect(selectWPTURLs(manifest, ["/dom/"], ["/dom/excluded.html"])).toEqual([
      "/dom/example.any.html",
      "/dom/example.any.worker.html",
    ]);
  });

  it("reports pending URLs and executed subtests separately", () => {
    const progress = buildWPTProgressReport(
      {
        results: [
          {
            test: "/dom/pass.html",
            status: "OK",
            subtests: [
              { name: "first", status: "PASS" },
              { name: "second", status: "PASS" },
            ],
          },
          {
            test: "/dom/fail.html",
            status: "OK",
            subtests: [
              { name: "failure", status: "FAIL", message: "not equal" },
            ],
          },
        ],
      },
      ["/dom/pass.html", "/dom/fail.html", "/dom/pending.html"],
      ["/dom/"],
      [],
      "fixture-revision",
      "failed",
    );

    expect(progress.totals).toEqual({
      total: 3,
      executed: 2,
      pass: 1,
      fail: 1,
      skip: 0,
      error: 0,
      timeout: 0,
      pending: 1,
    });
    expect(progress.areas[0]?.totals).toEqual(progress.totals);
    expect(progress.subtests).toEqual({
      total: 3,
      pass: 2,
      fail: 1,
      skip: 0,
      error: 0,
      timeout: 0,
    });
    expect(progress.nonPassingTests).toEqual([
      { url: "/dom/fail.html", status: "fail", message: "not equal" },
    ]);
    expect(renderWPTProgressMarkdown(progress)).toContain(
      "| All | 3 | 2 | 1 | 1 | 0 | 0 | 0 | 1 | 66.67% | 50.00% |",
    );
  });
});
