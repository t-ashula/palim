import { spawn } from "node:child_process";
import { globSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, it } from "vitest";

import type { ConformanceCaseMetadata } from "../../../../tools/conformance/report.js";
import type { ReadabilityCaseResult } from "./support/readability-case.js";

const fixtureRoot = fileURLToPath(
  new URL(
    "../../../../conformance/readability/readability/test/test-pages/",
    import.meta.url,
  ),
);
const runner = fileURLToPath(
  new URL("./support/readability-case-runner.ts", import.meta.url),
);
const caseTimeoutMilliseconds = 30_000;

function executeCase(fixtureDirectory: string): Promise<ReadabilityCaseResult> {
  return new Promise((resolve, reject) => {
    const temporaryDirectory = mkdtempSync(
      join(tmpdir(), "palim-readability-"),
    );
    const output = join(temporaryDirectory, "result.json");
    const child = spawn(
      process.execPath,
      ["--import", "tsx", runner, fixtureDirectory, output],
      { stdio: ["ignore", "ignore", "pipe"] },
    );
    let stderr = "";
    let timedOut = false;
    let spawnFailed = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, caseTimeoutMilliseconds);
    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (chunk: string) => {
      stderr += chunk;
    });
    child.on("error", (error) => {
      spawnFailed = true;
      clearTimeout(timeout);
      rmSync(temporaryDirectory, { recursive: true, force: true });
      reject(error);
    });
    child.on("close", (code, signal) => {
      clearTimeout(timeout);
      if (spawnFailed) {
        return;
      }
      if (timedOut) {
        rmSync(temporaryDirectory, { recursive: true, force: true });
        const error = new Error(
          `Readability case timed out after ${String(caseTimeoutMilliseconds)} ms`,
        );
        error.name = "TimeoutError";
        reject(error);
        return;
      }
      if (code !== 0) {
        rmSync(temporaryDirectory, { recursive: true, force: true });
        reject(
          new Error(
            `Readability case process exited with ${String(code)} (${signal ?? "no signal"}): ${stderr}`,
          ),
        );
        return;
      }
      try {
        resolve(
          JSON.parse(readFileSync(output, "utf8")) as ReadabilityCaseResult,
        );
      } catch (error) {
        reject(
          new Error(`Invalid Readability case result: ${stderr}`, {
            cause: error,
          }),
        );
      } finally {
        rmSync(temporaryDirectory, { recursive: true, force: true });
      }
    });
  });
}

function fail(kind: string, detail: unknown): never {
  const error = new Error(
    `[conformance-failure:${kind}] ${JSON.stringify(detail)}`,
  );
  error.name = "AssertionError";
  throw error;
}

describe("Mozilla Readability corpus with palim Document", () => {
  for (const directory of globSync("*", {
    cwd: fixtureRoot,
    withFileTypes: true,
  })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()) {
    const metadata: ConformanceCaseMetadata = {
      caseId: directory,
      suite: "readability",
      profile: "text/html",
      fixtureFile: `${directory}/source.html`,
    };

    it.concurrent(
      directory,
      {
        meta: { conformance: metadata },
        timeout: caseTimeoutMilliseconds + 5_000,
      },
      async () => {
        const result = await executeCase(join(fixtureRoot, directory));
        if (result.status === "failure") {
          fail(result.kind, result.detail);
        }
        if (result.status === "error") {
          const error = new Error(result.error.message);
          error.name = result.error.name ?? "Error";
          if (result.error.stack !== undefined) {
            error.stack = result.error.stack;
          }
          throw error;
        }
      },
    );
  }
});
