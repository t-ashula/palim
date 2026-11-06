import { fork } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  isDOMShellSourceResult,
  isPassingDOMShellResult,
  selectDOMShellSources,
} from "./model.js";
import type {
  DOMShellRunnerErrorResult,
  DOMShellSourceResult,
} from "./model.js";
import {
  buildDOMShellReport,
  renderDOMShellMarkdown,
} from "./report.js";

interface ConformanceManifest {
  readonly schemaVersion: number;
  readonly fixtures: Readonly<
    Record<string, { readonly revision: string } | undefined>
  >;
}

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, "../..");
const defaultWPTRoot = resolve(repositoryRoot, "conformance/wpt/wpt");
const workerPath = resolve(scriptDirectory, "worker.ts");
const conformanceManifestPath = resolve(
  repositoryRoot,
  "conformance/conformance.json",
);

export interface RunDOMShellSourceOptions {
  readonly wptRoot: string;
  readonly source: string;
  readonly timeoutMilliseconds?: number;
}

function runnerError(
  source: string,
  message: string,
  stack?: string,
): DOMShellRunnerErrorResult {
  return {
    schemaVersion: 1,
    profile: "dom-shell",
    source,
    result: "runner-error",
    message,
    ...(stack === undefined ? {} : { stack }),
  };
}

export function runDOMShellSource(
  options: RunDOMShellSourceOptions,
): Promise<DOMShellSourceResult> {
  const timeoutMilliseconds = options.timeoutMilliseconds ?? 10_000;
  return new Promise((resolveResult) => {
    const child = fork(workerPath, [options.wptRoot, options.source], {
      execArgv: ["--import", "tsx"],
      silent: true,
    });
    let settled = false;
    let standardError = "";
    child.stderr?.setEncoding("utf8");
    child.stderr?.on("data", (chunk: string) => {
      standardError += chunk;
    });

    const finish = (result: DOMShellSourceResult): void => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timeout);
      resolveResult(result);
    };

    const timeout = setTimeout(() => {
      child.kill();
      finish(
        runnerError(
          options.source,
          `DOM shell worker exceeded ${String(timeoutMilliseconds)}ms`,
        ),
      );
    }, timeoutMilliseconds);

    child.on("message", (value: unknown) => {
      if (isDOMShellSourceResult(value)) {
        finish(value);
      } else {
        finish(runnerError(options.source, "worker returned an invalid result"));
      }
    });
    child.on("error", (error) => {
      finish(runnerError(options.source, error.message, error.stack));
    });
    child.on("exit", (code, signal) => {
      if (settled) {
        return;
      }
      const detail = standardError.trim();
      finish(
        runnerError(
          options.source,
          `worker exited before reporting a result (code=${String(code)}, signal=${String(signal)})${detail === "" ? "" : `: ${detail}`}`,
        ),
      );
    });
  });
}

function defaultSources(wptRoot: string): string[] {
  const manifest = JSON.parse(
    readFileSync(resolve(wptRoot, "MANIFEST.json"), "utf8"),
  ) as unknown;
  return selectDOMShellSources(manifest);
}

function wptRevision(): string {
  const manifest = JSON.parse(
    readFileSync(conformanceManifestPath, "utf8"),
  ) as ConformanceManifest;
  if (manifest.schemaVersion !== 1) {
    throw new Error(
      `unsupported conformance manifest schema ${String(manifest.schemaVersion)}`,
    );
  }
  const fixture = manifest.fixtures["wpt/wpt"];
  if (fixture === undefined) {
    throw new Error("missing fixture revision for wpt/wpt");
  }
  return fixture.revision;
}

function sessionId(): string {
  return `${new Date().toISOString().replaceAll(/[-:.]/gu, "").toLowerCase()}-${String(process.pid)}`;
}

async function main(): Promise<void> {
  const adHoc = process.argv.length > 2;
  const sources = adHoc
    ? process.argv.slice(2)
    : defaultSources(defaultWPTRoot);
  const results: DOMShellSourceResult[] = [];
  for (const source of sources) {
    results.push(
      await runDOMShellSource({ source, wptRoot: defaultWPTRoot }),
    );
  }
  const rawDirectory = resolve(
    repositoryRoot,
    "tmp/wpt-dom-shell",
    sessionId(),
  );
  const reportDirectory = adHoc
    ? resolve(rawDirectory, "report")
    : resolve(repositoryRoot, "reports/wpt-dom-shell");
  const report = buildDOMShellReport(results, sources, wptRevision());
  mkdirSync(rawDirectory, { recursive: true });
  mkdirSync(reportDirectory, { recursive: true });
  writeFileSync(
    resolve(rawDirectory, "results.jsonl"),
    `${results.map((result) => JSON.stringify(result)).join("\n")}\n`,
  );
  writeFileSync(
    resolve(rawDirectory, "run.json"),
    `${JSON.stringify(
      {
        schemaVersion: 1,
        profile: "dom-shell",
        mode: adHoc ? "ad-hoc" : "full",
        node: process.version,
        resultCount: results.length,
        reportFiles: [
          relative(repositoryRoot, resolve(reportDirectory, "report.json")),
          relative(repositoryRoot, resolve(reportDirectory, "report.md")),
        ],
      },
      null,
      2,
    )}\n`,
  );
  writeFileSync(
    resolve(reportDirectory, "report.json"),
    `${JSON.stringify(report, null, 2)}\n`,
  );
  writeFileSync(
    resolve(reportDirectory, "report.md"),
    renderDOMShellMarkdown(report),
  );
  process.stdout.write(renderDOMShellMarkdown(report));
  process.stdout.write(`Raw results: ${rawDirectory}\n`);
  process.stdout.write(`Report: ${reportDirectory}\n`);
  if (!results.every(isPassingDOMShellResult)) {
    process.exitCode = 1;
  }
}

const entryPath = process.argv[1];
if (
  entryPath !== undefined &&
  import.meta.url === pathToFileURL(entryPath).href
) {
  await main();
}
