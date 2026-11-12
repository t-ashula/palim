import { describe, expect, it } from "vitest";

import type { DOMParserSupportedType } from "./public-test-api.js";
import {
  CDATASection,
  Comment,
  Document,
  DocumentType,
  DOMParser,
  Element,
  ProcessingInstruction,
  Text,
  XMLDocument,
} from "./public-test-api.js";

const HTML_NAMESPACE = "http://www.w3.org/1999/xhtml";
const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
const PARSER_ERROR_NAMESPACE =
  "http://www.mozilla.org/newlayout/xml/parsererror.xml";

function parse(input: string, type: DOMParserSupportedType = "text/xml") {
  return new DOMParser().parseFromString(input, type);
}

describe("DOMParser XML parsing", () => {
  it.each([
    "text/xml",
    "application/xml",
    "application/xhtml+xml",
    "image/svg+xml",
  ] as const)("parses %s documents", (type) => {
    const document = parse('<root attr="value" />', type);

    expect(document).toBeInstanceOf(Document);
    expect(document).not.toBeInstanceOf(XMLDocument);
    expect(document.contentType).toBe(type);
    expect(document.characterSet).toBe("UTF-8");
    expect(document.documentElement?.localName).toBe("root");
    expect(document.documentElement?.getAttribute("attr")).toBe("value");
  });

  it("rejects MIME types outside the DOMParser XML and HTML set", () => {
    const parser = new DOMParser();

    expect(() =>
      parser.parseFromString("<root />", "text/plain" as "text/xml"),
    ).toThrow(TypeError);
  });

  it("preserves XML name case and resolves element namespaces", () => {
    const document = parse(
      `<html xmlns="${HTML_NAMESPACE}"><Body><svg xmlns="${SVG_NAMESPACE}"><path /></svg></Body></html>`,
      "application/xhtml+xml",
    );
    const root = document.documentElement;
    const body = document.querySelector("Body");
    const svg = document.querySelector("svg");

    expect(root?.tagName).toBe("html");
    expect(root?.namespaceURI).toBe(HTML_NAMESPACE);
    expect(body?.tagName).toBe("Body");
    expect(body?.namespaceURI).toBe(HTML_NAMESPACE);
    expect(svg?.namespaceURI).toBe(SVG_NAMESPACE);
  });

  it("creates XML document node types and expands internal entities", () => {
    const document = parse(
      `<?xml version="1.0" encoding="ISO-8859-1"?><?before data?><!DOCTYPE root [<!ENTITY greeting "hello">]><root><!--comment--><![CDATA[<raw>]]>&greeting;&#x20;world</root>`,
    );
    const nodes = [...document.childNodes];
    const root = document.documentElement;

    expect(nodes[0]).toBeInstanceOf(ProcessingInstruction);
    expect(nodes[1]).toBeInstanceOf(DocumentType);
    expect(root).toBeInstanceOf(Element);
    expect(root?.childNodes[0]).toBeInstanceOf(Comment);
    expect(root?.childNodes[1]).toBeInstanceOf(CDATASection);
    expect(root?.childNodes[2]).toBeInstanceOf(Text);
    expect(root?.textContent).toBe("<raw>hello world");
    expect(document.characterSet).toBe("UTF-8");
  });

  it("applies default attributes from internal ATTLIST declarations", () => {
    const document = parse(`<!DOCTYPE root [
      <!ENTITY greeting "hello">
      <!ATTLIST item
        label CDATA "&greeting; &#65; &amp; &lt;"
        tokens NMTOKENS " first   second "
      >
      <!ATTLIST item label CDATA "ignored">
    ]><root><item/><item label="explicit"/></root>`);
    const items = document.querySelectorAll("item");

    expect(items.item(0)?.getAttribute("label")).toBe("hello A & <");
    expect(items.item(0)?.getAttribute("tokens")).toBe("first second");
    expect(items.item(1)?.getAttribute("label")).toBe("explicit");
    expect(items.item(1)?.getAttribute("tokens")).toBe("first second");
  });

  it("normalizes line endings and attribute whitespace", () => {
    const document = parse('<root value="a\r\nb\tc">x\ry\r\nz</root>');

    expect(document.documentElement?.getAttribute("value")).toBe("a b c");
    expect(document.documentElement?.textContent).toBe("x\ny\nz");
  });

  it("ignores a leading byte order mark before an XML declaration", () => {
    const document = parse('\uFEFF<?xml version="1.0"?><root />');

    expect(document.documentElement?.localName).toBe("root");
    expect(document.querySelector("parsererror")).toBeNull();
  });

  it("replaces lone surrogates before parsing", () => {
    const document = parse("<root>\uD800</root>");

    expect(document.documentElement?.localName).toBe("root");
    expect(document.documentElement?.textContent).toBe("\uFFFD");
    expect(document.querySelector("parsererror")).toBeNull();
  });

  it.each([
    "<root><child></root>",
    "<first /><second />",
    "<p:root />",
    '<root xmlns:a="urn:a" xmlns:b="urn:a" a:value="1" b:value="2" />',
    "<root><!-- invalid -- comment --></root>",
    "<root>&undefined;</root>",
    "text<root />",
  ])("returns a parsererror document for malformed XML: %s", (input) => {
    const document = parse(input);
    const error = document.documentElement;

    expect(document).toBeInstanceOf(Document);
    expect(document).not.toBeInstanceOf(XMLDocument);
    expect(error?.localName).toBe("parsererror");
    expect(error?.namespaceURI).toBe(PARSER_ERROR_NAMESPACE);
    expect(error?.textContent).not.toBe("");
  });
});
