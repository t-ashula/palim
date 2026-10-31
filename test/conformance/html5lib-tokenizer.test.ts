import { createHash } from "node:crypto";
import { globSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { tokenize } from "../../src/html/tokenizer.js";
import type {
  ParseError,
  Token,
  TokenizerState,
} from "../../src/html/tokenizer.js";
import type { ConformanceCaseMetadata } from "../../tools/conformance/report.js";

type FixtureToken =
  | ["DOCTYPE", string | null, string | null, string | null, boolean]
  | ["StartTag", string, Record<string, string>, true?]
  | ["EndTag", string]
  | ["Comment", string]
  | ["ProcessingInstruction", string, string]
  | ["Character", string];

interface FixtureError {
  readonly code: string;
  readonly line: number;
  readonly col: number;
}

interface FixtureCase {
  readonly description: string;
  readonly input: string;
  readonly output: FixtureToken[];
  readonly initialStates?: TokenizerState[];
  readonly lastStartTag?: string;
  readonly errors?: FixtureError[];
  readonly doubleEscaped?: boolean;
}

type Fixture = Record<string, FixtureCase[]>;

interface Exclusion {
  readonly caseId: string;
  readonly file: string;
  readonly line: number;
  readonly description: string;
  readonly classification: "skip";
  readonly reason: string;
}

const fixtureDirectory = fileURLToPath(
  new URL(
    "../../conformance/html5lib/html5lib-tests/tokenizer/",
    import.meta.url,
  ),
);

const exclusions: Exclusion[] = [
  {
    caseId: "bd0e46e6e8d7d619b48d216d4fb1a411d8c7ba0f3021e70e93c0f122c06d19be",
    file: "domjs.test",
    line: 3,
    description: "CR in bogus comment state",
    classification: "skip",
    reason:
      "The fixture expects the parse error from before processing-instruction states were added and does not match the current HTML tokenizer algorithm.",
  },
  {
    caseId: "5faab453628218551d267c93d4e0d539f8afdf330d2dde8ee5883768c07221d6",
    file: "domjs.test",
    line: 11,
    description: "CRLF in bogus comment state",
    classification: "skip",
    reason:
      "The fixture expects the parse error from before processing-instruction states were added and does not match the current HTML tokenizer algorithm.",
  },
  {
    caseId: "2dafa2280fcd2eabd9a92da056068b1431bf3036ce6857acdd5e66ddb816760f",
    file: "domjs.test",
    line: 19,
    description: "CRLFLF in bogus comment state",
    classification: "skip",
    reason:
      "The fixture expects the parse error from before processing-instruction states were added and does not match the current HTML tokenizer algorithm.",
  },
  {
    caseId: "e86f73b07553153fb88073cf641e5fac0a8af79bd8f501eac6697f96544757e7",
    file: "xmlViolation.test",
    line: 3,
    description: "Non-XML character",
    classification: "skip",
    reason:
      "The fixture expects output after applying Coercing an HTML DOM into an infoset, not the tokenizer tokens themselves.",
  },
  {
    caseId: "cfa1eea9521bbb24d4f2d62f97697baf8f855b55abfe8f3e3d38312c79effe16",
    file: "xmlViolation.test",
    line: 7,
    description: "Non-XML space",
    classification: "skip",
    reason:
      "The fixture expects output after applying Coercing an HTML DOM into an infoset, not the tokenizer tokens themselves.",
  },
  {
    caseId: "609f416545ac5b8bf017df13ba41f431555c4dea933ac96ffb0a74636c5606a1",
    file: "xmlViolation.test",
    line: 11,
    description: "Double hyphen in comment",
    classification: "skip",
    reason:
      "The fixture expects output after applying Coercing an HTML DOM into an infoset, not the tokenizer tokens themselves.",
  },
];

function unescape(value: string): string {
  return value.replaceAll(/\\u([0-9a-fA-F]{4})/g, (_, digits: string) =>
    String.fromCodePoint(Number.parseInt(digits, 16)),
  );
}

function unescapeToken(token: FixtureToken): FixtureToken {
  return token.map((part) => {
    if (typeof part === "string") {
      return unescape(part);
    }
    if (part !== null && typeof part === "object") {
      return Object.fromEntries(
        Object.entries(part).map(([name, value]) => [
          unescape(name),
          unescape(value),
        ]),
      );
    }
    return part;
  }) as FixtureToken;
}

function toFixtureToken(token: Token): FixtureToken {
  switch (token.type) {
    case "DOCTYPE":
      return [
        "DOCTYPE",
        token.name,
        token.publicId,
        token.systemId,
        !token.forceQuirks,
      ];
    case "StartTag": {
      const result: FixtureToken = ["StartTag", token.name, token.attributes];
      if (token.selfClosing) {
        result.push(true);
      }
      return result;
    }
    case "EndTag":
      return ["EndTag", token.name];
    case "Comment":
      return ["Comment", token.data];
    case "ProcessingInstruction":
      return ["ProcessingInstruction", token.target, token.data];
    case "Character":
      return ["Character", token.data];
  }
}

function toFixtureError(error: ParseError): FixtureError {
  return { code: error.code, line: error.line, col: error.column };
}

function createCaseId(
  file: string,
  input: {
    readonly data: string;
    readonly initialState: TokenizerState;
    readonly lastStartTag?: string;
  },
  expected: {
    readonly tokens: FixtureToken[];
    readonly errors?: FixtureError[];
  },
): string {
  return createHash("sha256")
    .update(JSON.stringify([file, input, expected]))
    .digest("hex");
}

describe("html5lib tokenizer", () => {
  const matchedExclusions = new Set<string>();

  for (const file of globSync("*.test", { cwd: fixtureDirectory }).sort()) {
    const source = readFileSync(join(fixtureDirectory, file), "utf8");

    for (const cases of Object.values(JSON.parse(source) as Fixture)) {
      for (const [index, fixture] of cases.entries()) {
        const input = fixture.doubleEscaped
          ? unescape(fixture.input)
          : fixture.input;
        const output = fixture.doubleEscaped
          ? fixture.output.map(unescapeToken)
          : fixture.output;

        for (const state of fixture.initialStates ?? ["Data state"]) {
          const caseInput = {
            data: input,
            initialState: state,
            ...(fixture.lastStartTag === undefined
              ? {}
              : { lastStartTag: fixture.lastStartTag }),
          };
          const expected = {
            tokens: output,
            ...(fixture.errors === undefined ? {} : { errors: fixture.errors }),
          };
          const caseId = createCaseId(file, caseInput, expected);
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
            suite: "html5lib-tokenizer",
            profile: state,
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
            `${caseId} ${file}:${String(index)} ${fixture.description} [${state}]${reason}`,
            { meta: { conformance: metadata } },
            () => {
              const actual = tokenize(input, {
                initialState: state,
                ...(fixture.lastStartTag === undefined
                  ? {}
                  : { lastStartTag: fixture.lastStartTag }),
              });

              expect(actual.tokens.map(toFixtureToken)).toEqual(output);

              if (fixture.errors !== undefined) {
                expect(actual.errors.map(toFixtureError)).toEqual(
                  fixture.errors,
                );
              }
            },
          );
        }
      }
    }
  }

  const unknownExclusions = exclusions
    .map(({ caseId }) => caseId)
    .filter((caseId) => !matchedExclusions.has(caseId));
  if (unknownExclusions.length > 0) {
    throw new Error(
      `unknown exclusion case IDs: ${unknownExclusions.join(", ")}`,
    );
  }
});
