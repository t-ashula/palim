import { describe, expect, it } from "vitest";

import { convertWPTReport } from "../tools/conformance/wpt-report.js";

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
});
