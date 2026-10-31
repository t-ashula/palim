import { globSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { Document, DOMParser, parseErrors } from "../../src/index.js";
import type { ConformanceCaseMetadata } from "../../tools/conformance/report.js";
import {
  canonicalTree,
  parseTreeConstructionFixture,
  treeConstructionCaseId,
} from "./parser.js";

const fixtureDirectory = fileURLToPath(
  new URL(
    "../../conformance/wpt/wpt/html/syntax/parsing/resources/",
    import.meta.url,
  ),
);

function testName(value: string): string {
  return value.replaceAll(/[\x00-\x1f]/g, (character) => {
    switch (character) {
      case "\n":
        return "\\n";
      case "\r":
        return "\\r";
      case "\t":
        return "\\t";
      default:
        return `\\x${character.charCodeAt(0).toString(16).padStart(2, "0")}`;
    }
  });
}

function caseLines(source: string): number[] {
  return source
    .split("\n")
    .flatMap((line, index) => (line === "#data" ? [index + 1] : []));
}

describe("html5lib tree construction", () => {
  function registerCases(kind: "document" | "fragment"): void {
    describe(`${kind} parse`, () => {
      for (const file of globSync("*.dat", { cwd: fixtureDirectory }).sort()) {
        const source = readFileSync(join(fixtureDirectory, file), "utf8");
        const fixtures = parseTreeConstructionFixture(source);
        const lines = caseLines(source);

        for (const [index, fixture] of fixtures.entries()) {
          const line = lines[index];
          if (line === undefined) {
            throw new Error(
              `${file} fixture ${String(index)} has no #data line`,
            );
          }
          const fixtureKind =
            fixture.fragment === undefined ? "document" : "fragment";
          if (fixtureKind !== kind) {
            continue;
          }
          for (const scripting of fixture.scriptingModes) {
            const caseId = treeConstructionCaseId(file, fixture, scripting);
            const description =
              fixture.description === undefined
                ? testName(fixture.data)
                : testName(fixture.description);
            const skipped = scripting === "enabled";
            const reason =
              "DOMParser does not expose an enabled scripting mode.";
            const metadata: ConformanceCaseMetadata = {
              caseId,
              suite: "html5lib-tree-construction",
              profile: kind,
              fixtureFile: file,
              ...(skipped
                ? {
                    fixtureLine: line,
                    excludedAs: "skip",
                    reason,
                  }
                : {}),
            };
            const test = skipped ? it.skip : it;

            test(
              `${caseId} ${file}:${String(index)} ${description} [scripting ${scripting}]`,
              { meta: { conformance: metadata } },
              () => {
                const parser = new DOMParser();
                const tree =
                  fixture.fragment === undefined
                    ? parser.parseFromString(fixture.data, "text/html")
                    : parser.parseFragment(fixture.data, fixture.fragment);
                const root =
                  fixture.fragment === undefined
                    ? "#document"
                    : "#document-fragment";
                expect(canonicalTree(tree)).toBe(
                  `${root}\n${fixture.document}`,
                );
                if (
                  tree instanceof Document &&
                  fixture.expectedErrorCount > 0
                ) {
                  expect(parseErrors(tree).length).toBeGreaterThan(0);
                }
              },
            );
          }
        }
      }
    });
  }

  registerCases("document");
  registerCases("fragment");
});
