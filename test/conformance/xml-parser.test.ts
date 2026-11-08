import { globSync, readFileSync } from "node:fs";
import { dirname, relative, resolve, sep } from "node:path";
import { TextDecoder } from "node:util";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { DOMParser } from "../../packages/palim/src/index.js";
import type { ConformanceCaseMetadata } from "../../tools/conformance/report.js";

const PARSER_ERROR_NAMESPACE =
  "http://www.mozilla.org/newlayout/xml/parsererror.xml";
const fixtureDirectory = fileURLToPath(
  new URL("../../conformance/w3c/xml-test-suite/", import.meta.url),
);

type TestType = "valid" | "invalid" | "not-wf" | "error";

interface XMLTestCase {
  readonly id: string;
  readonly type: TestType;
  readonly entities: "none" | "general" | "parameter" | "both";
  readonly recommendation: string;
  readonly version: string;
  readonly editions: readonly string[];
  readonly inputFile: string;
}

interface Exclusion {
  readonly classification: "unsupported" | "skip";
  readonly reason: string;
}

interface DecodedInput {
  readonly input?: string;
  readonly exclusion?: Exclusion;
}

function decodeAttribute(value: string): string {
  return value
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&");
}

function attributes(tag: string): Readonly<Record<string, string>> {
  const result: Record<string, string> = {};
  const expression = /([A-Za-z][A-Za-z0-9:._-]*)\s*=\s*(['"])(.*?)\2/gsu;
  for (const match of tag.matchAll(expression)) {
    const name = match[1];
    const value = match[3];
    if (name !== undefined && value !== undefined) {
      result[name.toUpperCase()] = decodeAttribute(value);
    }
  }
  return result;
}

function testTags(source: string): string[] {
  const result: string[] = [];
  let position = 0;
  while (position < source.length) {
    const start = source.indexOf("<TEST", position);
    if (start < 0) {
      break;
    }
    const next = source[start + 5];
    if (next === undefined || !/\s/u.test(next)) {
      position = start + 5;
      continue;
    }
    let quote: string | null = null;
    let end = start + 5;
    for (; end < source.length; end += 1) {
      const character = source[end] ?? "";
      if (quote !== null) {
        if (character === quote) {
          quote = null;
        }
      } else if (character === '"' || character === "'") {
        quote = character;
      } else if (character === ">") {
        break;
      }
    }
    if (end >= source.length) {
      throw new Error("unclosed TEST element in XML test-suite manifest");
    }
    result.push(source.slice(start, end + 1));
    position = end + 1;
  }
  return result;
}

function isTestType(value: string): value is TestType {
  return (
    value === "valid" ||
    value === "invalid" ||
    value === "not-wf" ||
    value === "error"
  );
}

function manifestCases(): XMLTestCase[] {
  const cases: XMLTestCase[] = [];
  for (const entry of globSync("**/*.xml", { cwd: fixtureDirectory }).sort()) {
    const manifest = resolve(fixtureDirectory, entry);
    const source = readFileSync(manifest, "utf8");
    if (!source.includes("<TESTCASES")) {
      continue;
    }
    for (const tag of testTags(source)) {
      const values = attributes(tag);
      const id = values.ID;
      const type = values.TYPE;
      const uri = values.URI;
      if (id === undefined || type === undefined || uri === undefined) {
        continue;
      }
      if (!isTestType(type)) {
        throw new Error(`unknown W3C XML test type: ${type}`);
      }
      const entities = values.ENTITIES ?? "none";
      if (
        entities !== "none" &&
        entities !== "general" &&
        entities !== "parameter" &&
        entities !== "both"
      ) {
        throw new Error(`unknown W3C XML entity profile: ${entities}`);
      }
      const inputFile = resolve(dirname(manifest), uri);
      const fixturePrefix = `${resolve(fixtureDirectory)}${sep}`;
      if (!inputFile.startsWith(fixturePrefix)) {
        throw new Error(`test URI escapes fixture directory: ${uri}`);
      }
      cases.push({
        id,
        type,
        entities,
        recommendation: values.RECOMMENDATION ?? "XML1.0",
        version: values.VERSION ?? "1.0",
        editions: (values.EDITION ?? "").split(/\s+/u).filter(Boolean),
        inputFile,
      });
    }
  }
  return cases;
}

function encoding(bytes: Buffer): string {
  if (bytes.subarray(0, 3).equals(Buffer.from([0xef, 0xbb, 0xbf]))) {
    return "utf-8";
  }
  if (bytes.subarray(0, 2).equals(Buffer.from([0xfe, 0xff]))) {
    return "utf-16be";
  }
  if (bytes.subarray(0, 2).equals(Buffer.from([0xff, 0xfe]))) {
    return "utf-16le";
  }
  if (bytes.subarray(0, 4).equals(Buffer.from([0x00, 0x3c, 0x00, 0x3f]))) {
    return "utf-16be";
  }
  if (bytes.subarray(0, 4).equals(Buffer.from([0x3c, 0x00, 0x3f, 0x00]))) {
    return "utf-16le";
  }
  if (bytes.subarray(0, 4).equals(Buffer.from([0x4c, 0x6f, 0xa7, 0x94]))) {
    return "ibm037";
  }
  const prefix = bytes.subarray(0, 512).toString("latin1");
  return (
    /<\?xml[\s\S]*?\bencoding\s*=\s*['"]([^'"]+)['"]/iu.exec(prefix)?.[1] ??
    "utf-8"
  );
}

function decodeInput(file: string): DecodedInput {
  const bytes = readFileSync(file);
  const label = encoding(bytes);
  try {
    const input = new TextDecoder(label, { fatal: true }).decode(bytes);
    const declared = /<\?xml[\s\S]*?\bencoding\s*=\s*['"]([^'"]+)['"]/iu.exec(
      input,
    )?.[1];
    const actualFamily = label.toLowerCase().replaceAll(/[^a-z0-9]/gu, "");
    const declaredFamily = declared
      ?.toLowerCase()
      .replaceAll(/[^a-z0-9]/gu, "");
    const compatibleUTF16 =
      actualFamily.startsWith("utf16") && declaredFamily === "utf16";
    if (
      declaredFamily !== undefined &&
      declaredFamily !== actualFamily &&
      !compatibleUTF16
    ) {
      return {
        exclusion: {
          classification: "unsupported",
          reason:
            "The fixture tests byte encoding and its XML declaration, which is not observable through DOMParser string input.",
        },
      };
    }
    return { input };
  } catch (error: unknown) {
    const detail = error instanceof Error ? error.message : String(error);
    return {
      exclusion: {
        classification: "unsupported",
        reason: `The DOMParser string adapter cannot decode ${label}: ${detail}`,
      },
    };
  }
}

function exclusion(
  fixture: XMLTestCase,
  decoded: DecodedInput,
): Exclusion | null {
  if (
    fixture.version === "1.1" ||
    fixture.recommendation === "XML1.1" ||
    fixture.recommendation.startsWith("NS1.1")
  ) {
    return {
      classification: "unsupported",
      reason: `XML ${fixture.version} / ${fixture.recommendation} is outside the XML 1.0 and Namespaces in XML 1.0 profile.`,
    };
  }
  if (fixture.editions.length > 0 && !fixture.editions.includes("5")) {
    return {
      classification: "skip",
      reason: "The fixture does not apply to XML 1.0 Fifth Edition.",
    };
  }
  if (fixture.type === "error") {
    return {
      classification: "skip",
      reason:
        "The XML recommendation does not prescribe whether this optional error is accepted.",
    };
  }
  if (
    fixture.type === "not-wf" &&
    fixture.entities !== "none" &&
    !externallyClassifiedButDeterministicCases.has(fixture.id)
  ) {
    return {
      classification: "skip",
      reason:
        "The W3C matrix does not prescribe one result when the error depends on external entities that this processor does not read.",
    };
  }
  if (xmlOnlyNamespaceCases.has(fixture.id)) {
    return {
      classification: "unsupported",
      reason:
        "The XML-only fixture permits a name that is not namespace-well-formed, while DOMParser always performs namespace processing.",
    };
  }
  return decoded.exclusion ?? null;
}

const xmlOnlyNamespaceCases = new Set([
  "x-ibm-1-0.5-valid-P04-ibm04v01.xml",
  "x-ibm-1-0.5-valid-P05-ibm05v01.xml",
  "x-ibm-1-0.5-valid-P05-ibm05v03.xml",
  "x-ibm-1-0.5-valid-P05-ibm05v02.xml",
  "x-ibm-1-0.5-valid-P05-ibm05v05.xml",
  "o-p04pass1",
  "o-p05pass1",
  "valid-sa-012",
]);

const externallyClassifiedButDeterministicCases = new Set([
  "not-wf-sa-081",
  "not-wf-not-sa-002",
]);

function profile(fixture: XMLTestCase): string {
  if (fixture.recommendation.startsWith("NS1.1")) {
    return "namespaces-1.1";
  }
  if (fixture.recommendation.startsWith("NS1.0")) {
    return "namespaces-1.0-third-edition";
  }
  if (fixture.recommendation === "XML1.1") {
    return "xml-1.1";
  }
  return "xml-1.0-fifth-edition";
}

function expectedAcceptance(fixture: XMLTestCase): boolean {
  return fixture.type === "valid" || fixture.type === "invalid";
}

describe("W3C XML conformance", () => {
  for (const fixture of manifestCases()) {
    const decoded = decodeInput(fixture.inputFile);
    const excluded = exclusion(fixture, decoded);
    const file = relative(fixtureDirectory, fixture.inputFile);
    const metadata: ConformanceCaseMetadata = {
      caseId: fixture.id,
      suite: "w3c-xml-parser",
      profile: profile(fixture),
      fixtureFile: file,
      ...(excluded === null
        ? {}
        : {
            fixtureLine: 1,
            excludedAs: excluded.classification,
            reason: excluded.reason,
          }),
    };
    const test = excluded === null ? it : it.skip;

    test(`${fixture.id} ${file}`, { meta: { conformance: metadata } }, () => {
      const input = decoded.input;
      if (input === undefined) {
        throw new Error(`missing decoded input for ${fixture.id}`);
      }
      const document = new DOMParser().parseFromString(
        input,
        "application/xml",
      );
      const accepted =
        document.documentElement?.namespaceURI !== PARSER_ERROR_NAMESPACE;
      expect(accepted).toBe(expectedAcceptance(fixture));
    });
  }
});
