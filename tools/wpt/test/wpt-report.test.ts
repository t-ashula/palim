import { describe, expect, it } from "vitest";

import { convertWPTReport } from "../../conformance/wpt-report.js";
import {
  buildWPTProgressReport,
  isTentativeWPTURL,
  renderWPTProgressMarkdown,
  selectWPTURLs,
} from "../../conformance/wpt-progress.js";

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
    const failureMessage = "expected <main> | got `null`\nsecond line & detail";
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
              {
                name: "failure",
                status: "FAIL",
                message: failureMessage,
              },
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
    expect(progress.schemaVersion).toBe(2);
    expect(progress.nonTentative.nonPassingTests).toEqual([
      { url: "/dom/fail.html", status: "fail", message: failureMessage },
    ]);
    expect(progress.tentative.totals.total).toBe(0);
    const markdown = renderWPTProgressMarkdown(progress);
    expect(markdown).toContain(
      "| All | 3 | 2 | 1 | 1 | 0 | 0 | 0 | 1 | 66.67% | 50.00% |",
    );
    expect(markdown).toContain(
      "| /dom/fail.html | fail | <code>expected &lt;main&gt; &#124; got `null`<br>second line &amp; detail</code> |",
    );
  });

  it("separates tentative URLs from current standard results", () => {
    const progress = buildWPTProgressReport(
      {
        results: [
          {
            test: "/dom/pass.html",
            status: "OK",
            subtests: [{ name: "passes", status: "PASS" }],
          },
          {
            test: "/dom/proposal.tentative.html",
            status: "OK",
            subtests: [
              { name: "proposed behavior", status: "FAIL", message: "draft" },
            ],
          },
          {
            test: "/dom/tentative/directory-test.html?variant=1",
            status: "OK",
            subtests: [{ name: "passes", status: "PASS" }],
          },
        ],
      },
      [
        "/dom/pass.html",
        "/dom/proposal.tentative.html",
        "/dom/tentative/directory-test.html?variant=1",
      ],
      ["/dom/"],
      [],
      "fixture-revision",
      "failed",
    );

    expect(progress.totals).toMatchObject({ total: 3, pass: 2, fail: 1 });
    expect(progress.nonTentative.totals).toMatchObject({
      total: 1,
      pass: 1,
      fail: 0,
    });
    expect(progress.nonTentative.nonPassingTests).toEqual([]);
    expect(progress.nonTentative.subtests).toMatchObject({
      total: 1,
      pass: 1,
      fail: 0,
    });
    expect(progress.tentative.totals).toMatchObject({
      total: 2,
      pass: 1,
      fail: 1,
    });
    expect(progress.tentative.nonPassingTests).toEqual([
      {
        url: "/dom/proposal.tentative.html",
        status: "fail",
        message: "draft",
      },
    ]);
    expect(progress.tentative.subtests).toMatchObject({
      total: 2,
      pass: 1,
      fail: 1,
    });

    const markdown = renderWPTProgressMarkdown(progress);
    expect(markdown).toContain("## Non-tentative WPT results");
    expect(markdown).toContain("## Tentative WPT results");
    expect(markdown).toContain(
      "These tests track proposed behavior and do not determine current Living Standard conformance.",
    );
  });

  it("recognizes both WPT tentative naming conventions", () => {
    expect(isTentativeWPTURL("/dom/example.tentative.html")).toBe(true);
    expect(
      isTentativeWPTURL("/dom/tentative/example.html?variant=window"),
    ).toBe(true);
    expect(isTentativeWPTURL("/dom/example.html")).toBe(false);
    expect(isTentativeWPTURL("/dom/tentatively/example.html")).toBe(false);
  });
});
