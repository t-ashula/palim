import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { URL } from "@palim/core/internal/url/index.js";
import { describe, expect, it } from "vitest";

import type { ConformanceCaseMetadata } from "../../../../tools/conformance/report.js";

interface URLCase {
  readonly input: string;
  readonly base: string | null;
  readonly failure?: boolean;
  readonly href?: string;
  readonly protocol?: string;
  readonly username?: string;
  readonly password?: string;
  readonly host?: string;
  readonly hostname?: string;
  readonly port?: string;
  readonly pathname?: string;
  readonly search?: string;
  readonly searchParams?: string;
  readonly hash?: string;
}

const fixtureDirectory = resolve(
  import.meta.dirname,
  "../../../../conformance/wpt/wpt/url/resources/",
);
const fixtureFiles = [
  "urltestdata.json",
  "urltestdata-javascript-only.json",
] as const;

function caseId(file: string, testCase: URLCase): string {
  return createHash("sha256")
    .update(JSON.stringify([file, testCase]))
    .digest("hex");
}

function display(value: string): string {
  return value.replaceAll(
    /[\x00-\x1f\x7f]/gu,
    (character) =>
      `\\u${character.charCodeAt(0).toString(16).padStart(4, "0")}`,
  );
}

describe("WPT URL constructor", () => {
  for (const file of fixtureFiles) {
    const entries = JSON.parse(
      readFileSync(join(fixtureDirectory, file), "utf8"),
    ) as (string | URLCase)[];
    for (const entry of entries) {
      if (typeof entry === "string") {
        continue;
      }
      const metadata: ConformanceCaseMetadata = {
        caseId: caseId(file, entry),
        suite: "wpt-url-constructor",
        profile: "url",
        fixtureFile: `url/resources/${file}`,
      };
      it(
        `${display(entry.input)} against ${entry.base === null ? "no base" : display(entry.base)}`,
        { meta: { conformance: metadata } },
        () => {
          const construct = (): URL =>
            entry.base === null
              ? new URL(entry.input)
              : new URL(entry.input, entry.base);
          if (entry.failure === true) {
            expect(construct).toThrow(TypeError);
            return;
          }
          const url = construct();
          expect(url.href).toBe(entry.href);
          expect(url.protocol).toBe(entry.protocol);
          expect(url.username).toBe(entry.username);
          expect(url.password).toBe(entry.password);
          expect(url.host).toBe(entry.host);
          expect(url.hostname).toBe(entry.hostname);
          expect(url.port).toBe(entry.port);
          expect(url.pathname).toBe(entry.pathname);
          expect(url.search).toBe(entry.search);
          if (entry.searchParams !== undefined) {
            expect(url.searchParams.toString()).toBe(entry.searchParams);
          }
          expect(url.hash).toBe(entry.hash);
        },
      );
    }
  }
});
