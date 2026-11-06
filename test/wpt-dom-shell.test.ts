import { describe, expect, it } from "vitest";

import {
  classifyDOMShellSource,
  isDOMShellSourceResult,
  isPassingDOMShellResult,
  resolveWPTResourcePath,
  resolveWPTSourcePath,
  selectDOMShellSources,
} from "../tools/wpt-dom-shell/model.js";
import {
  buildDOMShellReport,
  renderDOMShellMarkdown,
} from "../tools/wpt-dom-shell/report.js";

describe("WPT DOM shell model", () => {
  it("selects every source below each shell scope", () => {
    const manifest = {
      items: {
        testharness: {
          dom: {
            abort: {
              "abort.any.js": ["hash", ["dom/abort/abort.any.html", {}]],
            },
            collections: {},
            events: {
              "z.any.js": ["hash", ["dom/events/z.any.html", {}]],
              "a.any.js": ["hash", ["dom/events/a.any.html", {}]],
              nested: {
                "ignored.any.js": [
                  "hash",
                  ["dom/events/nested/ignored.any.html", {}],
                ],
              },
            },
            lists: {
              "tokens.html": ["hash", ["dom/lists/tokens.html", {}]],
              "manual.html": {},
            },
            nodes: {},
            ranges: {},
            traversal: {},
          },
          domparsing: {},
          html: {
            dom: {
              documents: { "dom-tree-accessors": {} },
              elements: {},
            },
          },
        },
      },
    };

    expect(selectDOMShellSources(manifest)).toEqual([
      "dom/abort/abort.any.js",
      "dom/events/a.any.js",
      "dom/events/nested/ignored.any.js",
      "dom/events/z.any.js",
      "dom/lists/tokens.html",
    ]);
  });

  it("rejects a manifest without the selected scope", () => {
    expect(() => selectDOMShellSources({ items: {} })).toThrow(
      "WPT manifest has no testharness scope",
    );
  });

  it("classifies sources from required host capabilities", () => {
    expect(
      classifyDOMShellSource("dom/nodes/example.html", "<p>fixture</p>"),
    ).toEqual({ classification: "runnable" });
    expect(
      classifyDOMShellSource("dom/nodes/example.window.js", "test(() => {})"),
    ).toEqual({
      classification: "browser-profile-only",
      message: "generated source requires a Window or Worker global",
    });
    expect(
      classifyDOMShellSource(
        "dom/nodes/example.html",
        "<iframe src='child.html'></iframe>",
      ),
    ).toEqual({
      classification: "browser-profile-only",
      message: "source requires Window, layout, navigation, or network",
    });
  });

  it("keeps selected sources inside the WPT checkout", () => {
    expect(resolveWPTSourcePath("/tmp/wpt", "dom/events/example.any.js")).toBe(
      "/tmp/wpt/dom/events/example.any.js",
    );
    expect(() => resolveWPTSourcePath("/tmp/wpt", "../outside.js")).toThrow(
      "DOM shell source must stay inside the WPT root",
    );
    expect(() => resolveWPTSourcePath("/tmp/wpt", "/tmp/outside.js")).toThrow(
      "DOM shell source must be relative to the WPT root",
    );
  });

  it("resolves metadata scripts without leaving the WPT checkout", () => {
    expect(
      resolveWPTResourcePath(
        "/tmp/wpt",
        "dom/abort/example.any.js",
        "./resources/helper.js",
      ),
    ).toBe("/tmp/wpt/dom/abort/resources/helper.js");
    expect(
      resolveWPTResourcePath(
        "/tmp/wpt",
        "dom/abort/example.any.js",
        "/resources/helper.js",
      ),
    ).toBe("/tmp/wpt/resources/helper.js");
    expect(() =>
      resolveWPTResourcePath(
        "/tmp/wpt",
        "dom/abort/example.any.js",
        "../../../outside.js",
      ),
    ).toThrow("DOM shell source must stay inside the WPT root");
  });

  it("distinguishes passing and non-passing source results", () => {
    const passing = {
      schemaVersion: 1,
      profile: "dom-shell",
      source: "dom/events/example.any.js",
      result: "complete",
      harness: { status: "ok", message: null, stack: null },
      subtests: [
        { name: "example", status: "pass", message: null, stack: null },
      ],
    } as const;
    const failing = {
      ...passing,
      subtests: [
        { name: "example", status: "fail", message: "failure", stack: null },
      ],
    } as const;

    expect(isDOMShellSourceResult(passing)).toBe(true);
    expect(
      isDOMShellSourceResult({
        schemaVersion: 1,
        profile: "dom-shell",
        source: "dom/events/window-only.window.js",
        result: "excluded",
        classification: "browser-profile-only",
        message: "requires Window",
      }),
    ).toBe(true);
    expect(
      isDOMShellSourceResult({
        schemaVersion: 1,
        profile: "dom-shell",
        source: "dom/events/example.any.js",
        result: "complete",
      }),
    ).toBe(false);
    expect(isPassingDOMShellResult(passing)).toBe(true);
    expect(isPassingDOMShellResult(failing)).toBe(false);
  });

  it("summarizes source and subtest results", () => {
    const results = [
      {
        schemaVersion: 1,
        profile: "dom-shell",
        source: "dom/events/pass.any.js",
        result: "complete",
        harness: { status: "ok", message: null, stack: null },
        subtests: [
          { name: "passes", status: "pass", message: null, stack: null },
        ],
      },
      {
        schemaVersion: 1,
        profile: "dom-shell",
        source: "dom/events/fail.any.js",
        result: "complete",
        harness: { status: "ok", message: null, stack: null },
        subtests: [
          {
            name: "fails",
            status: "fail",
            message: "not equal",
            stack: "stack",
          },
        ],
      },
    ] as const;

    const report = buildDOMShellReport(
      results,
      results.map(({ source }) => source),
      "fixture-revision",
    );

    expect(report.totals).toEqual({
      total: 2,
      executed: 2,
      pass: 1,
      fail: 1,
      skip: 0,
      error: 0,
      timeout: 0,
      pending: 0,
    });
    expect(report.subtests).toEqual({
      total: 2,
      pass: 1,
      fail: 1,
      skip: 0,
      error: 0,
      timeout: 0,
    });
    expect(report.selection).toEqual({
      include: [
        "/dom/abort/",
        "/dom/collections/",
        "/dom/events/",
        "/dom/lists/",
        "/dom/nodes/",
        "/dom/ranges/",
        "/dom/traversal/",
        "/domparsing/",
        "/html/dom/documents/dom-tree-accessors/",
        "/html/dom/elements/",
      ],
      exclude: [],
    });
    expect(report.nonPassingTests).toEqual([
      {
        url: "/dom/events/fail.any.js",
        status: "fail",
        message: "not equal",
      },
    ]);
    expect(renderDOMShellMarkdown(report)).toContain(
      "| All | 2 | 2 | 1 | 1 | 0 | 0 | 0 | 0 | 100.00% | 50.00% |",
    );
  });
});
