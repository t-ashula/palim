import {
  buildWPTProgressReport,
  renderWPTProgressMarkdown,
} from "../conformance/wpt-progress.js";
import type {
  WPTProgressReport,
  WPTReport,
  WPTSubtestResult,
  WPTTestResult,
} from "../conformance/wpt-progress.js";

import {
  DOM_SHELL_SOURCE_PREFIXES,
  isPassingDOMShellResult,
} from "./model.js";
import type {
  DOMShellCompletedResult,
  DOMShellHarnessStatus,
  DOMShellSourceResult,
  DOMShellSubtestResult,
  DOMShellSubtestStatus,
} from "./model.js";

function testId(source: string): string {
  return `/${source}`;
}

function harnessStatus(status: DOMShellHarnessStatus): string {
  switch (status) {
    case "ok":
      return "OK";
    case "error":
      return "ERROR";
    case "timeout":
      return "TIMEOUT";
    case "precondition-failed":
      return "PRECONDITION_FAILED";
  }
}

function subtestStatus(status: DOMShellSubtestStatus): string {
  switch (status) {
    case "pass":
      return "PASS";
    case "fail":
      return "FAIL";
    case "timeout":
      return "TIMEOUT";
    case "not-run":
      return "NOTRUN";
    case "precondition-failed":
      return "PRECONDITION_FAILED";
  }
}

function wptSubtest(result: DOMShellSubtestResult): WPTSubtestResult {
  return {
    name: result.name,
    status: subtestStatus(result.status),
    message: result.message,
  };
}

function completedResult(result: DOMShellCompletedResult): WPTTestResult {
  return {
    test: testId(result.source),
    status: harnessStatus(result.harness.status),
    message: result.harness.message,
    subtests: result.subtests.map(wptSubtest),
  };
}

function wptResult(result: DOMShellSourceResult): WPTTestResult {
  if (result.result === "complete") {
    return completedResult(result);
  }
  return {
    test: testId(result.source),
    status: "ERROR",
    message: result.message,
    subtests: [],
  };
}

export function buildDOMShellReport(
  results: readonly DOMShellSourceResult[],
  selectedSources: readonly string[],
  revision: string,
): WPTProgressReport {
  const rawReport: WPTReport = { results: results.map(wptResult) };
  return buildWPTProgressReport(
    rawReport,
    selectedSources.map(testId),
    DOM_SHELL_SOURCE_PREFIXES.map(testId),
    [],
    revision,
    results.every(isPassingDOMShellResult) ? "passed" : "failed",
  );
}

export function renderDOMShellMarkdown(report: WPTProgressReport): string {
  return renderWPTProgressMarkdown(report);
}
