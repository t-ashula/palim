import { readFileSync } from "node:fs";
import { join } from "node:path";

import { Readability } from "@mozilla/readability";

import {
  DOMParser,
  Element,
  Node,
  type Document,
} from "../../../packages/palim/src/index.js";
import {
  documentIsQuirks,
  setDocumentQuirks,
  setDocumentURL,
} from "@palim/core/internal/dom/nodes.js";

interface ExpectedMetadata {
  readonly title: string | null;
  readonly byline: string | null;
  readonly excerpt: string | null;
  readonly siteName: string | null;
  readonly dir?: string | null;
  readonly lang?: string | null;
  readonly publishedTime?: string | null;
}

interface Article {
  readonly title?: string | null;
  readonly byline?: string | null;
  readonly excerpt?: string | null;
  readonly siteName?: string | null;
  readonly dir?: string | null;
  readonly lang?: string | null;
  readonly publishedTime?: string | null;
  readonly content?: string | null;
}

interface CanonicalNode {
  readonly type: number;
  readonly name: string;
  readonly text?: string;
  readonly attributes?: readonly (readonly [string, string])[];
}

export type ReadabilityCaseResult =
  | { readonly status: "pass" }
  | {
      readonly status: "failure";
      readonly kind: "null-result" | "content-mismatch" | "metadata-mismatch";
      readonly detail: unknown;
    }
  | {
      readonly status: "error";
      readonly error: {
        readonly name?: string;
        readonly message: string;
        readonly stack?: string;
      };
    };

function readabilityDocument(document: Document): never {
  return document as never;
}

function removeComments(node: Node): void {
  for (const child of [...node.childNodes]) {
    if (child.nodeType === Node.COMMENT_NODE) {
      node.removeChild(child);
    } else {
      removeComments(child);
    }
  }
}

function parseDocument(source: string): Document {
  const parser = new DOMParser();
  const parsed = parser.parseFromString(source, "text/html");
  const document = parser.parseFromString("", "text/html");
  while (document.firstChild !== null) {
    document.removeChild(document.firstChild);
  }
  setDocumentQuirks(document, documentIsQuirks(parsed));
  setDocumentURL(document, "http://fakehost/test/page.html");
  for (const child of [...parsed.childNodes]) {
    document.appendChild(document.importNode(child, true));
  }
  return document;
}

function canonicalNodes(document: Document): CanonicalNode[] {
  const result: CanonicalNode[] = [];
  const root = document.documentElement ?? document.firstChild;
  if (root === null) {
    return result;
  }

  function visit(node: Node): void {
    if (node.nodeType === Node.TEXT_NODE) {
      let text = (node.textContent ?? "").replace(/\s+/gu, " ");
      if (node.previousSibling === null) {
        text = text.trimStart();
      }
      if (node.nextSibling === null) {
        text = text.trimEnd();
      }
      if (text.trim() === "") {
        return;
      }
      result.push({
        type: node.nodeType,
        name: "#text",
        text,
      });
    } else if (node instanceof Element) {
      const attributes = [...node.attributes]
        .map((attribute) => [attribute.name, attribute.value] as const)
        .toSorted(([left], [right]) =>
          left === right ? 0 : left < right ? -1 : 1,
        );
      result.push({
        type: node.nodeType,
        name: node.localName,
        attributes,
      });
    } else {
      result.push({ type: node.nodeType, name: node.nodeName });
    }
    for (const child of node.childNodes) {
      visit(child);
    }
  }

  visit(root);
  return result;
}

function compareContent(
  actual: string,
  expected: string,
): ReadabilityCaseResult | null {
  const parser = new DOMParser();
  const actualNodes = canonicalNodes(
    parser.parseFromString(actual, "text/html"),
  );
  const expectedNodes = canonicalNodes(
    parser.parseFromString(expected, "text/html"),
  );
  const count = Math.max(actualNodes.length, expectedNodes.length);
  for (let index = 0; index < count; index += 1) {
    if (
      JSON.stringify(actualNodes[index]) !==
      JSON.stringify(expectedNodes[index])
    ) {
      return {
        status: "failure",
        kind: "content-mismatch",
        detail: {
          index,
          actual: actualNodes[index] ?? null,
          expected: expectedNodes[index] ?? null,
        },
      };
    }
  }
  return null;
}

function compareMetadata(
  article: Article,
  expected: ExpectedMetadata,
): ReadabilityCaseResult | null {
  const names = ["title", "byline", "excerpt", "siteName"] as const;
  const conditionalNames = ["dir", "lang", "publishedTime"] as const;
  const mismatches: Record<string, { actual: unknown; expected: unknown }> = {};
  for (const name of names) {
    if (article[name] !== expected[name]) {
      mismatches[name] = { actual: article[name], expected: expected[name] };
    }
  }
  for (const name of conditionalNames) {
    if (expected[name] != null && article[name] !== expected[name]) {
      mismatches[name] = { actual: article[name], expected: expected[name] };
    }
  }
  return Object.keys(mismatches).length === 0
    ? null
    : { status: "failure", kind: "metadata-mismatch", detail: mismatches };
}

function caseError(error: unknown): ReadabilityCaseResult {
  if (error !== null && typeof error === "object") {
    const candidate = error as Record<string, unknown>;
    return {
      status: "error",
      error: {
        ...(typeof candidate.name === "string" ? { name: candidate.name } : {}),
        message:
          typeof candidate.message === "string"
            ? candidate.message
            : JSON.stringify(candidate),
        ...(typeof candidate.stack === "string"
          ? { stack: candidate.stack }
          : {}),
      },
    };
  }
  return { status: "error", error: { message: String(error) } };
}

export function runReadabilityCase(
  fixtureDirectory: string,
): ReadabilityCaseResult {
  try {
    const source = readFileSync(join(fixtureDirectory, "source.html"), "utf8");
    const expectedContent = readFileSync(
      join(fixtureDirectory, "expected.html"),
      "utf8",
    );
    const expectedMetadata = JSON.parse(
      readFileSync(join(fixtureDirectory, "expected-metadata.json"), "utf8"),
    ) as ExpectedMetadata;
    const document = parseDocument(source);
    removeComments(document);

    const article = new Readability(readabilityDocument(document), {
      classesToPreserve: ["caption"],
    }).parse() as Article | null;
    if (article === null || typeof article.content !== "string") {
      return {
        status: "failure",
        kind: "null-result",
        detail: { content: article?.content ?? null },
      };
    }

    return (
      compareContent(article.content, expectedContent) ??
      compareMetadata(article, expectedMetadata) ?? { status: "pass" }
    );
  } catch (error) {
    return caseError(error);
  }
}
