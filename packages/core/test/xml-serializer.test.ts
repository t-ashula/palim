import { describe, expect, it } from "vitest";

import { DOMParser, Document, XMLSerializer } from "./public-test-api.js";
import type { Element } from "./public-test-api.js";
import { expectDOMException } from "./helper/assertions.js";

const XHTML_NAMESPACE = "http://www.w3.org/1999/xhtml";

function parse(input: string): Document {
  return new DOMParser().parseFromString(input, "application/xml");
}

function root(document: Document): Element {
  const element = document.documentElement;
  if (element === null) {
    throw new Error("missing document element");
  }
  return element;
}

describe("XML fragment serialization", () => {
  it("serializes XML contents through the existing markup getters", () => {
    const element = root(
      parse(
        '<root xmlns="urn:root"><child value="&quot;&amp;">&lt;&amp;</child><empty /></root>',
      ),
    );

    expect(element.innerHTML).toBe(
      '<child xmlns="urn:root" value="&quot;&amp;">&lt;&amp;</child><empty xmlns="urn:root"/>',
    );
    expect(element.outerHTML).toBe(
      '<root xmlns="urn:root"><child value="&quot;&amp;">&lt;&amp;</child><empty/></root>',
    );
  });

  it("parses innerHTML with the context namespace", () => {
    const element = root(parse('<root xmlns="urn:root" />'));

    element.innerHTML =
      '<child /><html:span xmlns:html="http://www.w3.org/1999/xhtml">text</html:span>';

    expect(element.firstElementChild?.namespaceURI).toBe("urn:root");
    expect(element.children.item(1)?.namespaceURI).toBe(XHTML_NAMESPACE);
    expect(element.innerHTML).toBe(
      '<child xmlns="urn:root"/><html:span xmlns:html="http://www.w3.org/1999/xhtml">text</html:span>',
    );
  });

  it("uses XML fragment parsing for outerHTML and insertAdjacentHTML", () => {
    const element = root(parse("<root><before /><target /><after /></root>"));
    const target = element.querySelector("target");
    if (target === null) {
      throw new Error("missing target");
    }

    target.insertAdjacentHTML("beforebegin", "<inserted />");
    target.outerHTML = "<replacement />";

    expect(element.innerHTML).toBe(
      "<before/><inserted/><replacement/><after/>",
    );
  });

  it("throws SyntaxError without changing children for malformed fragments", () => {
    const element = root(parse("<root><existing /></root>"));

    expectDOMException(() => {
      element.innerHTML = "<unclosed>";
    }, "SyntaxError");
    expect(element.innerHTML).toBe("<existing/>");
  });
});

describe("XMLSerializer", () => {
  it("serializes a document and its standalone node types", () => {
    const document = parse(
      '<?before data?><!DOCTYPE root SYSTEM "urn:test"><root xmlns="urn:root"><![CDATA[a<b]]><!--comment--><?target value?></root><?after data?>',
    );
    const serializer = new XMLSerializer();
    const documentElement = root(document);
    const cdata = documentElement.childNodes.item(0);
    const namespaceAttribute = documentElement.attributes.item(0);
    if (cdata === null || namespaceAttribute === null) {
      throw new Error("missing serialized nodes");
    }

    expect(serializer.serializeToString(document)).toBe(
      '<?before data?><!DOCTYPE root SYSTEM "urn:test"><root xmlns="urn:root"><![CDATA[a<b]]><!--comment--><?target value?></root><?after data?>',
    );
    expect(serializer.serializeToString(cdata)).toBe("<![CDATA[a<b]]>");
    expect(serializer.serializeToString(namespaceAttribute)).toBe("");

    const fragment = document.createDocumentFragment();
    fragment.appendChild(document.createTextNode("<&"));
    fragment.appendChild(document.createComment("ok"));
    expect(serializer.serializeToString(fragment)).toBe("&lt;&amp;<!--ok-->");
  });

  it("preserves element and attribute namespaces", () => {
    const document = new Document();
    const element = document.createElementNS("urn:root", "r:root");
    element.setAttributeNS("urn:attribute", "value", "content");
    document.appendChild(element);

    expect(new XMLSerializer().serializeToString(element)).toBe(
      '<r:root xmlns:r="urn:root" xmlns:ns1="urn:attribute" ns1:value="content"/>',
    );
  });

  it("escapes XML attribute values", () => {
    const document = new Document();
    const element = document.createElement("root");
    element.setAttribute("value", '<>&"\t\n\r');

    expect(new XMLSerializer().serializeToString(element)).toBe(
      '<root value="&lt;&gt;&amp;&quot;&#x9;&#xA;&#xD;"/>',
    );
  });

  it("uses the nearest prefix retained by the namespace prefix map", () => {
    const element = root(
      parse('<root xmlns:p="u1" xmlns:q="u1"><child xmlns:q="u2"/></root>'),
    );
    const child = element.firstElementChild;
    if (child === null) {
      throw new Error("missing child element");
    }
    child.setAttributeNS("u1", "name", "value");

    expect(new XMLSerializer().serializeToString(element)).toBe(
      '<root xmlns:p="u1" xmlns:q="u1"><child xmlns:q="u2" q:name="value"/></root>',
    );
  });

  it("preserves attribute prefixes that are not declared locally", () => {
    const document = new Document();
    const documentRoot = document.createElement("root");
    documentRoot.setAttributeNS("urn:attribute", "p:name", "value");
    document.appendChild(documentRoot);

    expect(new XMLSerializer().serializeToString(documentRoot)).toBe(
      '<root xmlns:p="urn:attribute" p:name="value"/>',
    );

    const parsed = parse('<root xmlns:p="u1"><child/></root>');
    const parsedRoot = root(parsed);
    const child = parsedRoot.firstElementChild;
    if (child === null) {
      throw new Error("missing prefix-rebinding child");
    }
    child.setAttributeNS("u2", "p:name", "value");
    expect(new XMLSerializer().serializeToString(parsedRoot)).toBe(
      '<root xmlns:p="u1"><child xmlns:p="u2" p:name="value"/></root>',
    );
  });

  it("generates prefixes from the serialization prefix index", () => {
    const parsed = parse('<root xmlns:ns2="u2"><child xmlns:ns1="u1"/></root>');
    const parsedRoot = root(parsed);
    const child = parsedRoot.firstElementChild;
    if (child === null) {
      throw new Error("missing generated-prefix child");
    }
    child.setAttributeNS("u3", "name", "value");
    expect(new XMLSerializer().serializeToString(parsedRoot)).toBe(
      '<root xmlns:ns2="u2"><child xmlns:ns1="u1" xmlns:ns1="u3" ns1:name="value"/></root>',
    );
  });

  it("uses explicit end tags for empty non-void HTML elements", () => {
    const document = new Document();
    const element = document.createElementNS(XHTML_NAMESPACE, "div");

    expect(new XMLSerializer().serializeToString(element)).toBe(
      `<div xmlns="${XHTML_NAMESPACE}"></div>`,
    );
  });

  it("keeps XMLSerializer permissive while markup getters require well-formed XML", () => {
    const document = parse("<root />");
    const element = root(document);
    const comment = document.createComment("invalid--comment");
    element.appendChild(comment);

    expect(new XMLSerializer().serializeToString(comment)).toBe(
      "<!--invalid--comment-->",
    );
    expectDOMException(() => element.innerHTML, "InvalidStateError");
  });

  it("requires a Node argument", () => {
    const serializer = new XMLSerializer();
    const serialize = serializer.serializeToString.bind(
      serializer,
    ) as unknown as (root?: unknown) => string;

    expect(() => serialize()).toThrow(TypeError);
    expect(() => serialize("<root />")).toThrow(TypeError);
  });
});
