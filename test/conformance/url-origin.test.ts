import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { URL } from "@palim/core/internal/url/index.js";
import type { ConformanceCaseMetadata } from "../../tools/conformance/report.js";

interface OriginCase {
  readonly input: string;
  readonly base: string | null;
  readonly origin?: string;
}

const fixtureDirectory = resolve(
  import.meta.dirname,
  "../../conformance/wpt/wpt/url/resources/",
);

describe("WPT URL origin", () => {
  for (const file of ["urltestdata.json", "urltestdata-javascript-only.json"]) {
    const entries = JSON.parse(
      readFileSync(join(fixtureDirectory, file), "utf8"),
    ) as (string | OriginCase)[];
    for (const entry of entries) {
      if (typeof entry === "string" || entry.origin === undefined) {
        continue;
      }
      const metadata: ConformanceCaseMetadata = {
        caseId: createHash("sha256")
          .update(JSON.stringify([file, entry.input, entry.base, entry.origin]))
          .digest("hex"),
        suite: "wpt-url-origin",
        profile: "url",
        fixtureFile: `url/resources/${file}`,
      };
      it(entry.input, { meta: { conformance: metadata } }, () => {
        const url =
          entry.base === null
            ? new URL(entry.input)
            : new URL(entry.input, entry.base);
        expect(url.origin).toBe(entry.origin);
      });
    }
  }
});
