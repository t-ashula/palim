import { describe, expect, it } from "vitest";

import { expectDOMException } from "../../helper/assertions.js";
import {
  parseHTML as parse,
  requireElement as select,
} from "../../helper/dom.js";
import {
  CDATASection,
  Comment,
  Document,
  DocumentFragment,
  DOMParser,
  Element,
  HTMLElement,
  HTMLSpanElement,
  HTMLUnknownElement,
  ProcessingInstruction,
  Text,
  XMLDocument,
} from "../../public-test-api.js";

const HTML_NAMESPACE = "http://www.w3.org/1999/xhtml";
const XML_NAMESPACE = "http://www.w3.org/XML/1998/namespace";
const XMLNS_NAMESPACE = "http://www.w3.org/2000/xmlns/";

describe("Node child access", () => {
  it("reports child presence and converts collection item indexes", () => {
    const document = parse("<main><span></span></main>");
    const main = select(document, "main");
    const text = document.createTextNode("text");

    expect(main.hasChildNodes()).toBe(true);
    expect(text.hasChildNodes()).toBe(false);
    expect(main.children.item("not-a-number" as unknown as number)).toBe(
      main.firstElementChild,
    );
  });
});

describe("Document element creation", () => {
  it("creates HTML elements with normalized names and matching interfaces", () => {
    const document = parse("");
    const element = document.createElement("SpAn");
    const unknown = document.createElement("unregistered");
    const custom = document.createElement("palim-widget");
    const parsed = parse("<span></span>").querySelector("span");

    expect(element).toBeInstanceOf(HTMLSpanElement);
    expect(element.localName).toBe("span");
    expect(element.tagName).toBe("SPAN");
    expect(element.prefix).toBeNull();
    expect(element.namespaceURI).toBe(HTML_NAMESPACE);
    expect(element.ownerDocument).toBe(document);
    expect(element.parentNode).toBeNull();
    expect(unknown).toBeInstanceOf(HTMLUnknownElement);
    expect(custom).toBeInstanceOf(HTMLElement);
    expect(custom).not.toBeInstanceOf(HTMLUnknownElement);
    expect(element.constructor).toBe(parsed?.constructor);
  });

  it("uses the document type when createElement selects a namespace", () => {
    const parser = new DOMParser();
    const xml = parser.parseFromString("<root />", "application/xml");
    const xhtml = parser.parseFromString(
      `<html xmlns="${HTML_NAMESPACE}" />`,
      "application/xhtml+xml",
    );
    const standalone = new Document();

    const xmlElement = xml.createElement("MixedCase");
    const xhtmlElement = xhtml.createElement("span");
    const standaloneElement = standalone.createElement("MixedCase");

    expect(xmlElement).toBeInstanceOf(Element);
    expect(xmlElement).not.toBeInstanceOf(HTMLElement);
    expect(xmlElement.localName).toBe("MixedCase");
    expect(xmlElement.tagName).toBe("MixedCase");
    expect(xmlElement.namespaceURI).toBeNull();

    expect(xhtmlElement).toBeInstanceOf(HTMLSpanElement);
    expect(xhtmlElement.localName).toBe("span");
    expect(xhtmlElement.tagName).toBe("span");
    expect(xhtmlElement.namespaceURI).toBe(HTML_NAMESPACE);

    expect(standalone.contentType).toBe("application/xml");
    expect(standaloneElement.namespaceURI).toBeNull();
    expect(standaloneElement.localName).toBe("MixedCase");
  });

  it("converts and validates createElement local names", () => {
    const document = parse("");
    const createElement = document.createElement.bind(document) as unknown as (
      localName?: unknown,
    ) => Element;

    expect(createElement(null).localName).toBe("null");
    expect(createElement(undefined).localName).toBe("undefined");
    expect(createElement("article<draft").localName).toBe("article<draft");

    for (const invalidName of ["", "1article", "article draft", "a/b", "a>b"]) {
      expectDOMException(
        () => document.createElement(invalidName),
        "InvalidCharacterError",
      );
    }
    expect(() => createElement()).toThrow(TypeError);
  });

  it("creates namespaced elements and preserves qualified names", () => {
    const document = parse("");
    const html = document.createElementNS(HTML_NAMESPACE, "html:span");
    const foreign = document.createElementNS("urn:example", "p:item:part");
    const noNamespace = document.createElementNS("", "item");
    const createElementNS = document.createElementNS.bind(
      document,
    ) as unknown as (namespace?: unknown, qualifiedName?: unknown) => Element;

    expect(html).toBeInstanceOf(HTMLSpanElement);
    expect(html.prefix).toBe("html");
    expect(html.localName).toBe("span");
    expect(html.tagName).toBe("HTML:SPAN");
    expect(html.namespaceURI).toBe(HTML_NAMESPACE);

    expect(foreign).toBeInstanceOf(Element);
    expect(foreign).not.toBeInstanceOf(HTMLElement);
    expect(foreign.prefix).toBe("p");
    expect(foreign.localName).toBe("item:part");
    expect(foreign.tagName).toBe("p:item:part");
    expect(foreign.namespaceURI).toBe("urn:example");

    expect(noNamespace.namespaceURI).toBeNull();
    expect(createElementNS(undefined, "item").namespaceURI).toBeNull();
  });

  it("uses ASCII uppercase for HTML element qualified names", () => {
    const document = parse("");
    const element = document.createElementNS(HTML_NAMESPACE, "p:tıtle");

    expect(element.tagName).toBe("P:TıTLE");
    expect(element.nodeName).toBe("P:TıTLE");
  });

  it("reports element name and namespace errors", () => {
    const document = parse("");

    expectDOMException(
      () => document.createElementNS("urn:example", "bad prefix:item"),
      "InvalidCharacterError",
    );
    expectDOMException(
      () => document.createElementNS("urn:example", "p:1item"),
      "InvalidCharacterError",
    );
    expectDOMException(
      () => document.createElementNS(null, "p:item"),
      "NamespaceError",
    );
    expectDOMException(
      () => document.createElementNS("urn:example", "xml:item"),
      "NamespaceError",
    );
    expectDOMException(
      () => document.createElementNS("urn:example", "xmlns"),
      "NamespaceError",
    );
    expectDOMException(
      () => document.createElementNS(XMLNS_NAMESPACE, "item"),
      "NamespaceError",
    );

    expect(
      document.createElementNS(XML_NAMESPACE, "xml:item").namespaceURI,
    ).toBe(XML_NAMESPACE);
    expect(
      document.createElementNS(XMLNS_NAMESPACE, "xmlns").namespaceURI,
    ).toBe(XMLNS_NAMESPACE);

    const createElementNS = document.createElementNS.bind(
      document,
    ) as unknown as (...arguments_: unknown[]) => Element;
    expect(() => createElementNS("urn:example")).toThrow(TypeError);
  });
});

describe("Document node creation", () => {
  it("creates text and comment nodes associated with the document", () => {
    const document = parse("");
    const text = document.createTextNode("content");
    const comment = document.createComment("note");

    expect(text).toBeInstanceOf(Text);
    expect(text.nodeType).toBe(3);
    expect(text.nodeName).toBe("#text");
    expect(text.data).toBe("content");
    expect(text.textContent).toBe("content");
    expect(text.ownerDocument).toBe(document);
    expect(text.parentNode).toBeNull();

    expect(comment).toBeInstanceOf(Comment);
    expect(comment.nodeType).toBe(8);
    expect(comment.nodeName).toBe("#comment");
    expect(comment.data).toBe("note");
    expect(comment.textContent).toBe("note");
    expect(comment.ownerDocument).toBe(document);
    expect(comment.parentNode).toBeNull();
  });

  it("converts character data and rejects omitted required arguments", () => {
    const document = parse("");
    const createTextNode = document.createTextNode.bind(
      document,
    ) as unknown as (data?: unknown) => Text;
    const createComment = document.createComment.bind(document) as unknown as (
      data?: unknown,
    ) => Comment;

    expect(createTextNode(null).data).toBe("null");
    expect(createTextNode(undefined).data).toBe("undefined");
    expect(createComment(null).data).toBe("null");
    expect(createComment(undefined).data).toBe("undefined");
    expect(() => createTextNode()).toThrow(TypeError);
    expect(() => createComment()).toThrow(TypeError);
  });

  it("gets and sets nodeValue according to the node type", () => {
    const document = parse('<main data-value="before"></main>');
    const main = select(document, "main");
    const attribute = main.attributes.item(0);
    const text = document.createTextNode("before");
    const comment = document.createComment("before");
    const instruction = document.createProcessingInstruction(
      "target",
      "before",
    );
    if (attribute === null) {
      throw new Error("missing test attribute");
    }

    text.nodeValue = "text";
    comment.nodeValue = "comment";
    instruction.nodeValue = null;
    attribute.nodeValue = "attribute";
    main.nodeValue = "ignored";

    expect(text.data).toBe("text");
    expect(comment.data).toBe("comment");
    expect(instruction.data).toBe("");
    expect(attribute.value).toBe("attribute");
    expect(main.nodeValue).toBeNull();
  });

  it("sets textContent according to the node type", () => {
    const document = parse('<main data-value="before"><span>old</span></main>');
    const main = select(document, "main");
    const attribute = main.attributes.item(0);
    const doctype = document.implementation.createDocumentType("html", "", "");
    if (attribute === null) {
      throw new Error("missing test attribute");
    }

    attribute.textContent = null;
    (main as unknown as { textContent: undefined }).textContent = undefined;
    document.textContent = "ignored";
    doctype.textContent = "ignored";

    expect(attribute.value).toBe("");
    expect(main.textContent).toBe("");
    expect(main.childNodes.length).toBe(0);
    expect(document.textContent).toBeNull();
    expect(doctype.textContent).toBeNull();
  });

  it("reads and mutates CharacterData in UTF-16 code units", () => {
    const text = parse("").createTextNode("🌠 test 🌠 TEST");

    expect(text.substringData(1, 8)).toBe("\uDF20 test \uD83C");
    text.replaceData(1, 4, "--");
    expect(text.data).toBe("\uD83C--st 🌠 TEST");
    text.deleteData(1, 2);
    expect(text.data).toBe("\uD83Cst 🌠 TEST");
    text.insertData(1, "\uDF1F ");
    expect(text.data).toBe("🌟 st 🌠 TEST");
    text.appendData("!");
    expect(text.data).toBe("🌟 st 🌠 TEST!");
    text.data = "reset";
    expect(text.data).toBe("reset");
  });

  it("returns the data of contiguous Text siblings", () => {
    const document = parse("");
    const parent = document.createElement("div");
    const first = document.createTextNode("first");
    const second = document.createTextNode(" second");
    const separated = document.createTextNode("separated");

    parent.append(first, second, document.createComment("boundary"), separated);

    expect(first.wholeText).toBe("first second");
    expect(second.wholeText).toBe("first second");
    expect(separated.wholeText).toBe("separated");
    expect(document.createTextNode("detached").wholeText).toBe("detached");
  });

  it("converts CharacterData arguments and validates offsets", () => {
    const text = parse("").createTextNode("test");
    const substringData = text.substringData.bind(text) as unknown as (
      offset?: unknown,
      count?: unknown,
    ) => string;
    const appendData = text.appendData.bind(text) as unknown as (
      data?: unknown,
    ) => void;

    expect(substringData(-0x1_0000_0000 + 2, 1)).toBe("s");
    expect(substringData("test", 3)).toBe("tes");
    expect(() => substringData(5, 0)).toThrow(
      expect.objectContaining({ name: "IndexSizeError" }),
    );
    expect(() => substringData()).toThrow(TypeError);
    expect(() => substringData(0)).toThrow(TypeError);
    appendData(null);
    appendData(undefined);
    expect(text.data).toBe("testnullundefined");
    expect(() => {
      appendData();
    }).toThrow(TypeError);
  });

  it("creates an empty document fragment associated with the document", () => {
    const document = parse("");
    const fragment = document.createDocumentFragment();

    expect(fragment).toBeInstanceOf(DocumentFragment);
    expect(fragment.nodeType).toBe(11);
    expect(fragment.nodeName).toBe("#document-fragment");
    expect(fragment.ownerDocument).toBe(document);
    expect(fragment.parentNode).toBeNull();
    expect(fragment.childNodes.length).toBe(0);
    expect(fragment.children.length).toBe(0);
  });

  it("creates XML character data and documents through DOMImplementation", () => {
    const document = new Document();
    const cdata = document.createCDATASection("content");
    const instruction = document.createProcessingInstruction("target", "data");
    const doctype = document.implementation.createDocumentType(
      "root",
      "public",
      "system",
    );
    const xml = document.implementation.createDocument(null, null, doctype);
    const xhtml = document.implementation.createDocument(
      HTML_NAMESPACE,
      "html",
    );
    const html = document.implementation.createHTMLDocument("title");

    expect(cdata).toBeInstanceOf(CDATASection);
    expect(cdata.ownerDocument).toBe(document);
    expect(instruction).toBeInstanceOf(ProcessingInstruction);
    expect(instruction.ownerDocument).toBe(document);
    expect(xml.doctype).toBe(doctype);
    expect(xml).toBeInstanceOf(XMLDocument);
    expect(doctype.ownerDocument).toBe(xml);
    expect(xhtml).toBeInstanceOf(XMLDocument);
    expect(xhtml.contentType).toBe("application/xhtml+xml");
    expect(document.implementation.createDocumentType("", "", "").name).toBe(
      "",
    );
    expectDOMException(
      () => document.implementation.createDocumentType("invalid name", "", ""),
      "InvalidCharacterError",
    );
    expect(html.contentType).toBe("text/html");
    expect(html.doctype?.name).toBe("html");
    expect(html.head?.textContent).toBe("title");
    expect(html.body).not.toBeNull();
  });

  it("orders createCDATASection document and data validation", () => {
    const html = parse("");
    const xml = new DOMParser().parseFromString("<root />", "text/xml");

    expectDOMException(
      () => html.createCDATASection("data"),
      "NotSupportedError",
    );
    expectDOMException(
      () => html.createCDATASection("]]>"),
      "NotSupportedError",
    );
    expectDOMException(
      () => xml.createCDATASection("]]>"),
      "InvalidCharacterError",
    );
  });

  it("reports every historical DOM feature as supported", () => {
    const implementation = new Document().implementation;

    expect(implementation.hasFeature()).toBe(true);
  });
});
