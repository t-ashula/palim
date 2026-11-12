import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { URL } from "@palim/core/internal/url/index.js";
import { describe, expect, it } from "vitest";

import type { ConformanceCaseMetadata } from "../../../../tools/conformance/report.js";

interface IDNACase {
  readonly comment?: string;
  readonly input: string;
  readonly output: string | null;
}

const fixtureDirectory = resolve(
  import.meta.dirname,
  "../../../../conformance/wpt/wpt/url/resources",
);
const fixtureFiles = [
  "toascii.json",
  "IdnaTestV2.json",
  "IdnaTestV2-removed.json",
] as const;

describe("WPT URL domain to ASCII", () => {
  for (const file of fixtureFiles) {
    const entries = JSON.parse(
      readFileSync(resolve(fixtureDirectory, file), "utf8"),
    ) as (string | IDNACase)[];
    for (const entry of entries) {
      if (typeof entry === "string" || entry.input === "") {
        continue;
      }
      const metadata: ConformanceCaseMetadata = {
        caseId: createHash("sha256")
          .update(JSON.stringify([file, entry]))
          .digest("hex"),
        suite: "wpt-url-idna",
        profile: "url",
        fixtureFile: `url/resources/${file}`,
      };
      it(
        `${file}: ${entry.input}${entry.comment === undefined ? "" : ` (${entry.comment})`}`,
        { meta: { conformance: metadata } },
        () => {
          const construct = (): URL => new URL(`https://${entry.input}/x`);
          if (entry.output === null) {
            expect(construct).toThrow(TypeError);
            return;
          }
          const url = construct();
          expect(url.host).toBe(entry.output);
          expect(url.hostname).toBe(entry.output);
          expect(url.pathname).toBe("/x");
          expect(url.href).toBe(`https://${entry.output}/x`);
        },
      );
    }
  }
});
