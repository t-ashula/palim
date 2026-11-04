import { describe, expect, it } from "vitest";

import { selectLatestCampaignResults } from "../tools/wpt/campaign.js";
import {
  buildWPTProgressReport,
  renderWPTProgressMarkdown,
} from "../tools/conformance/wpt-progress.js";

describe("WPT campaign reporting", () => {
  it("selects the latest completed valid attempt for each selected URL", () => {
    const results = selectLatestCampaignResults(
      [
        {
          sequence: 1,
          url: "/dom/a.html",
          state: "completed",
          result: {
            test: "/dom/a.html",
            status: "ERROR",
            subtests: [],
          },
        },
        {
          sequence: 2,
          url: "/dom/a.html",
          state: "completed",
          result: {
            test: "/dom/a.html",
            status: "OK",
            subtests: [{ name: "passes", status: "PASS" }],
          },
        },
        {
          sequence: 3,
          url: "/dom/b.html",
          state: "failed",
        },
        {
          sequence: 4,
          url: "/outside.html",
          state: "completed",
          result: {
            test: "/outside.html",
            status: "OK",
            subtests: [],
          },
        },
      ],
      ["/dom/a.html", "/dom/b.html"],
    );

    expect(results).toEqual([
      {
        test: "/dom/a.html",
        status: "OK",
        subtests: [{ name: "passes", status: "PASS" }],
      },
    ]);
  });

  it("renders campaign lifecycle separately from test outcomes", () => {
    const report = buildWPTProgressReport(
      { results: [] },
      ["/dom/pending.html"],
      ["/dom/"],
      [],
      "wpt-revision",
      "interrupted",
      {
        id: "campaign-1",
        state: "running",
        palim: {
          revision: "palim-revision",
          dirty: false,
          imageId: "sha256:image",
        },
        lastAttemptSequence: 3,
        snapshotAt: "2026-11-04T00:00:00.000Z",
        workerFailures: 1,
        retries: 1,
      },
    );

    expect(report.campaign?.state).toBe("running");
    expect(report.totals.pending).toBe(1);
    expect(renderWPTProgressMarkdown(report)).toContain(
      "Campaign state: running",
    );
  });
});
