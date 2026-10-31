import { globSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, describe, expect, it } from "vitest";

import { Document, DOMParser, parseErrors } from "../../src/index.js";
import type { ConformanceCaseMetadata } from "../../tools/conformance/report.js";
import {
  canonicalTree,
  parseTreeConstructionFixture,
  treeConstructionCaseId,
} from "./html5lib-tree-construction.js";

const fixtureDirectory = fileURLToPath(
  new URL(
    "../../conformance/wpt/wpt/html/syntax/parsing/resources/",
    import.meta.url,
  ),
);

interface Exclusion {
  readonly caseId: string;
  readonly file: string;
  readonly line: number;
  readonly description: string;
  readonly classification: "unsupported";
  readonly reason: string;
}

const exclusions: Exclusion[] = [
  {
    caseId: "3669d5990ac8f84c45569e8ef3ccf0509ead155265edb801423f995879f256e4",
    file: "scripted_adoption01.dat",
    line: 1,
    description: "script mutates an active formatting element",
    classification: "unsupported",
    reason: "The fixture requires executing script during tree construction.",
  },
  {
    caseId: "24ae5777d69c9057f81ac70cb4cabc64f60b8edb1943d0aaafef8e10c4218d9c",
    file: "scripted_ark.dat",
    line: 1,
    description: "script mutates a formatting element attribute",
    classification: "unsupported",
    reason: "The fixture requires executing script during tree construction.",
  },
  {
    caseId: "137c8e00641691ab75d2b4e5e339c748a09a79558fd69b09c2b75105041824b3",
    file: "scripted_foster01.dat",
    line: 1,
    description: "script moves the table before a formatting token",
    classification: "unsupported",
    reason: "The fixture requires executing script during tree construction.",
  },
  {
    caseId: "83e6ba1440d5f2117a8178d0e72f56707df024556524384f0ea4bd44c0d8773b",
    file: "scripted_foster01.dat",
    line: 12,
    description: "script moves the table before foster-parented text",
    classification: "unsupported",
    reason: "The fixture requires executing script during tree construction.",
  },
  {
    caseId: "10e9a03eeca440ffbff3357fb7fafc7634bbd5782a02a2efb36101c613e9c8f6",
    file: "scripted_webkit01.dat",
    line: 1,
    description: "document.write inserts text",
    classification: "unsupported",
    reason: "The fixture requires executing script during tree construction.",
  },
  {
    caseId: "6fe1aab417068dc47c259292d486d20c4e21c8a1138c0277e10ada675a7db708",
    file: "scripted_webkit01.dat",
    line: 14,
    description: "document.write inserts scripts",
    classification: "unsupported",
    reason: "The fixture requires executing script during tree construction.",
  },
];

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

describe("html5lib tree construction", () => {
  const matchedExclusions = new Set<string>();

  function registerCases(kind: "document" | "fragment"): void {
    describe(`${kind} parse`, () => {
      for (const file of globSync("*.dat", { cwd: fixtureDirectory }).sort()) {
        const source = readFileSync(join(fixtureDirectory, file), "utf8");
        const fixtures = parseTreeConstructionFixture(source);

        for (const [index, fixture] of fixtures.entries()) {
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
            const prefix = `${caseId} ${file}:${String(index)} ${description} [scripting ${scripting}]`;
            const exclusion = exclusions.find(
              (candidate) => candidate.caseId === caseId,
            );
            if (exclusion !== undefined) {
              matchedExclusions.add(caseId);
            }
            const test = exclusion === undefined ? it : it.skip;
            const reason =
              exclusion === undefined ? "" : ` [excluded: ${exclusion.reason}]`;
            const metadata: ConformanceCaseMetadata = {
              caseId,
              suite: "html5lib-tree-construction",
              profile: kind,
              fixtureFile: file,
              ...(exclusion === undefined
                ? {}
                : {
                    fixtureLine: exclusion.line,
                    excludedAs: exclusion.classification,
                    reason: exclusion.reason,
                  }),
            };

            test(
              `${prefix}${reason}`,
              { meta: { conformance: metadata } },
              () => {
                const parser = new DOMParser();
                const tree =
                  fixture.fragment === undefined
                    ? parser.parseFromString(fixture.data, "text/html", {
                        scripting: scripting === "enabled",
                      })
                    : parser.parseFragment(fixture.data, fixture.fragment, {
                        scripting: scripting === "enabled",
                      });
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

  afterAll(() => {
    const unknownExclusions = exclusions
      .map(({ caseId }) => caseId)
      .filter((caseId) => !matchedExclusions.has(caseId));
    if (unknownExclusions.length > 0) {
      throw new Error(
        `unknown exclusion case IDs: ${unknownExclusions.join(", ")}`,
      );
    }
  });
});
