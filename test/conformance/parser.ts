import { createHash } from "node:crypto";

import {
  Comment,
  Document,
  DocumentFragment,
  DocumentType,
  Element,
  HTMLTemplateElement,
  ProcessingInstruction,
  Text,
} from "../../src/index.js";
import type { Node } from "../../src/index.js";

export type ScriptingMode = "disabled" | "enabled";

export interface FragmentContext {
  readonly namespaceURI: string;
  readonly localName: string;
}

export interface TreeConstructionCase {
  readonly description?: string;
  readonly data: string;
  readonly expectedErrorCount: number;
  readonly fragment?: FragmentContext;
  readonly scriptingModes: readonly ScriptingMode[];
  readonly document: string;
}

type Sections = Record<string, string>;

const HTML_NAMESPACE = "http://www.w3.org/1999/xhtml";
const MATHML_NAMESPACE = "http://www.w3.org/1998/Math/MathML";
const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
const XLINK_NAMESPACE = "http://www.w3.org/1999/xlink";
const XML_NAMESPACE = "http://www.w3.org/XML/1998/namespace";
const XMLNS_NAMESPACE = "http://www.w3.org/2000/xmlns/";

const NAMESPACE_DESIGNATORS: Readonly<Record<string, string>> = {
  [HTML_NAMESPACE]: "",
  [MATHML_NAMESPACE]: "math ",
  [SVG_NAMESPACE]: "svg ",
  [XLINK_NAMESPACE]: "xlink ",
  [XML_NAMESPACE]: "xml ",
  [XMLNS_NAMESPACE]: "xmlns ",
};

function sectionHeading(line: string): string | null {
  if (!line.startsWith("#")) {
    return null;
  }
  const heading = line.slice(1).trim();
  return heading === "" ? null : heading;
}

function normalizeSections(sections: Sections): Sections {
  return Object.fromEntries(
    Object.entries(sections).map(([key, value]) => [
      key,
      value.endsWith("\n") ? value.slice(0, -1) : value,
    ]),
  );
}

function parseSections(source: string): Sections[] {
  const text = source.endsWith("\n") ? source.slice(0, -1) : source;
  const lines = text.split("\n");
  const cases: Sections[] = [];
  let sections: Sections | null = null;
  let key: string | null = null;

  for (const [index, value] of lines.entries()) {
    const line = `${value}${index === lines.length - 1 ? "" : "\n"}`;
    const heading = sectionHeading(line);
    if (heading !== null) {
      if (
        sections !== null &&
        (heading === "description" ||
          (heading === "data" && key !== "description"))
      ) {
        const value = key === null ? undefined : sections[key];
        if (key !== null && value !== undefined && value !== "") {
          sections[key] = value.slice(0, -1);
        }
        cases.push(normalizeSections(sections));
        sections = null;
      }
      sections ??= {};
      key = heading;
      sections[key] = "";
    } else if (sections !== null && key !== null) {
      sections[key] = (sections[key] ?? "") + line;
    }
  }

  if (sections !== null) {
    cases.push(normalizeSections(sections));
  }
  return cases;
}

function requiredSection(
  sections: Sections,
  name: "data" | "document",
  index: number,
): string {
  if (!Object.hasOwn(sections, name)) {
    throw new Error(`tree construction case ${String(index)} lacks #${name}`);
  }
  return sections[name] ?? "";
}

function fragmentContext(value: string): FragmentContext {
  if (value.startsWith("svg ")) {
    return { namespaceURI: SVG_NAMESPACE, localName: value.slice(4) };
  }
  if (value.startsWith("math ")) {
    return { namespaceURI: MATHML_NAMESPACE, localName: value.slice(5) };
  }
  return { namespaceURI: HTML_NAMESPACE, localName: value };
}

function sectionLineCount(value: string | undefined): number {
  return value === undefined || value === "" ? 0 : value.split("\n").length;
}

export function parseTreeConstructionFixture(
  source: string,
): TreeConstructionCase[] {
  return parseSections(source).map((sections, index) => {
    const scriptOn = Object.hasOwn(sections, "script-on");
    const scriptOff = Object.hasOwn(sections, "script-off");
    if (scriptOn && scriptOff) {
      throw new Error(
        `tree construction case ${String(index)} has both scripting modes`,
      );
    }

    const fragment = sections["document-fragment"];
    const description = sections.description;
    return {
      ...(description === undefined ? {} : { description }),
      data: requiredSection(sections, "data", index),
      expectedErrorCount:
        sectionLineCount(sections.errors) +
        sectionLineCount(sections["new-errors"]),
      ...(fragment === undefined
        ? {}
        : { fragment: fragmentContext(fragment) }),
      scriptingModes: scriptOn
        ? ["enabled"]
        : scriptOff
          ? ["disabled"]
          : ["disabled", "enabled"],
      document: requiredSection(sections, "document", index),
    };
  });
}

function namespaceDesignator(namespaceURI: string | null): string {
  if (namespaceURI === null) {
    return "";
  }
  const designator = NAMESPACE_DESIGNATORS[namespaceURI];
  if (designator === undefined) {
    throw new Error(`unsupported namespace in canonical tree: ${namespaceURI}`);
  }
  return designator;
}

function appendNode(lines: string[], node: Node, depth: number): void {
  const padding = depth > 0 ? " ".repeat(2 * depth - 1) : "";
  const childPadding = " ".repeat(2 * depth + 1);

  if (node instanceof Document) {
    lines.push("#document");
  } else if (node instanceof DocumentFragment) {
    lines.push("#document-fragment");
  } else if (node instanceof DocumentType) {
    const identifiers =
      node.publicId === "" && node.systemId === ""
        ? ""
        : ` "${node.publicId}" "${node.systemId}"`;
    lines.push(`|${padding}<!DOCTYPE ${node.name}${identifiers}>`);
  } else if (node instanceof Comment) {
    lines.push(`|${padding}<!-- ${node.data} -->`);
  } else if (node instanceof ProcessingInstruction) {
    lines.push(`|${padding}<?${node.target} ${node.data}?>`);
  } else if (node instanceof Text) {
    lines.push(`|${padding}"${node.data}"`);
  } else if (node instanceof Element) {
    const name = `${namespaceDesignator(node.namespaceURI)}${node.localName}`;
    lines.push(`|${padding}<${name}>`);

    const attributes = [...node.attributes]
      .map((attribute) => ({
        name: `${namespaceDesignator(attribute.namespaceURI)}${attribute.localName}`,
        value: attribute.value,
      }))
      .sort((left, right) =>
        left.name === right.name ? 0 : left.name < right.name ? -1 : 1,
      );
    for (const attribute of attributes) {
      lines.push(`|${childPadding}${attribute.name}="${attribute.value}"`);
    }

    if (node instanceof HTMLTemplateElement) {
      lines.push(`|${childPadding}content`);
      for (const child of node.content.childNodes) {
        appendNode(lines, child, depth + 2);
      }
    }
  } else {
    throw new Error(`unsupported node in canonical tree: ${node.nodeName}`);
  }

  for (const child of node.childNodes) {
    appendNode(lines, child, depth + 1);
  }
}

export function canonicalTree(root: Node): string {
  const lines: string[] = [];
  appendNode(lines, root, 0);
  return lines.join("\n");
}

export function treeConstructionCaseId(
  file: string,
  fixture: TreeConstructionCase,
  scripting: ScriptingMode,
): string {
  const input = {
    data: fixture.data,
    scripting,
    ...(fixture.fragment === undefined ? {} : { fragment: fixture.fragment }),
  };
  const expected = {
    tree: `${fixture.fragment === undefined ? "#document" : "#document-fragment"}\n${fixture.document}`,
  };
  return createHash("sha256")
    .update(JSON.stringify([file, input, expected]))
    .digest("hex");
}
