import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { URL } from "@palim/core/internal/url/index.js";
import { describe, expect, it } from "vitest";

import type { ConformanceCaseMetadata } from "../../../../tools/conformance/report.js";

interface SetterCase {
  readonly href: string;
  readonly new_value: string;
  readonly expected: Readonly<Record<string, string>>;
}

type SetterFixture = Readonly<Record<string, string | readonly SetterCase[]>>;

const fixtureFile = "url/resources/setters_tests.json";
const fixturePath = resolve(
  import.meta.dirname,
  `../../../../conformance/wpt/wpt/${fixtureFile}`,
);

describe("WPT URL setters", () => {
  const fixture = JSON.parse(
    readFileSync(fixturePath, "utf8"),
  ) as SetterFixture;
  for (const [property, entries] of Object.entries(fixture)) {
    if (property === "comment" || typeof entries === "string") {
      continue;
    }
    for (const entry of entries) {
      const metadata: ConformanceCaseMetadata = {
        caseId: createHash("sha256")
          .update(JSON.stringify([fixtureFile, property, entry]))
          .digest("hex"),
        suite: "wpt-url-setters",
        profile: "url",
        fixtureFile,
      };
      it(
        `${property}: ${entry.href} = ${entry.new_value}`,
        { meta: { conformance: metadata } },
        () => {
          const url = new URL(entry.href);
          Reflect.set(url, property, entry.new_value);
          for (const [name, expected] of Object.entries(entry.expected)) {
            expect(Reflect.get(url, name)).toBe(expected);
          }
        },
      );
    }
  }
});
