import { describe, expect, it } from "vitest";

import {
  AbortController,
  Attr,
  CDATASection,
  Comment,
  CustomEvent,
  DOMParser,
  Document,
  DocumentFragment,
  DocumentType,
  Element,
  Event,
  EventTarget,
  HTMLElement,
  HTMLSpanElement,
  HTMLTemplateElement,
  HTMLUnknownElement,
  Node,
  ProcessingInstruction,
  Text,
} from "../src/index.js";
import { setDocumentURL } from "../src/dom/nodes.js";
import { documentImplementation } from "../src/dom/node-implementation.js";
import { expectDOMException } from "./helper/assertions.js";

const HTML_NAMESPACE = "http://www.w3.org/1999/xhtml";
const XML_NAMESPACE = "http://www.w3.org/XML/1998/namespace";
const XMLNS_NAMESPACE = "http://www.w3.org/2000/xmlns/";
const XLINK_NAMESPACE = "http://www.w3.org/1999/xlink";

function parse(input: string): Document {
  return new DOMParser().parseFromString(input, "text/html");
}

function select(document: Document, selector: string): Element {
  const element = document.querySelector(selector);
  if (element === null) {
    throw new Error(`missing test element: ${selector}`);
  }
  return element;
}

describe("DOM interface binding", () => {
  it("does not expose implementation members on DOM objects", () => {
    const document = parse('<main id="root">content</main>');
    const element = select(document, "main");
    const attribute = element.attributes.item(0);
    const text = element.firstChild;

    for (const object of [document, element, attribute, text]) {
      if (object === null) {
        throw new Error("missing DOM object");
      }
      expect(
        implementationMemberNames(object),
        object.constructor.name,
      ).toEqual([]);
    }
  });
});

describe("EventTarget", () => {
  it("constructs custom events with detail", () => {
    const event = new CustomEvent("custom", {
      bubbles: true,
      cancelable: true,
      detail: { value: 54 },
    });

    expect(event.type).toBe("custom");
    expect(event.bubbles).toBe(true);
    expect(event.cancelable).toBe(true);
    expect(event.detail).toEqual({ value: 54 });
  });

  it("ignores cancellation from passive listeners", () => {
    const target = new EventTarget();
    target.addEventListener(
      "passive",
      (event) => {
        event.preventDefault();
        event.returnValue = false;
      },
      { passive: true },
    );
    const passiveEvent = new Event("passive", { cancelable: true });

    expect(target.dispatchEvent(passiveEvent)).toBe(true);
    expect(passiveEvent.defaultPrevented).toBe(false);

    target.addEventListener("active", (event) => {
      event.preventDefault();
    });
    const activeEvent = new Event("active", { cancelable: true });

    expect(target.dispatchEvent(activeEvent)).toBe(false);
    expect(activeEvent.defaultPrevented).toBe(true);
  });

  it("removes signal-bound listeners when aborted", () => {
    const target = new EventTarget();
    const controller = new AbortController();
    let calls = 0;
    const listener = (): void => {
      calls += 1;
    };

    target.addEventListener("signal", listener, {
      signal: controller.signal,
    });
    target.dispatchEvent(new Event("signal"));
    controller.abort();
    target.dispatchEvent(new Event("signal"));
    target.addEventListener("signal", listener, {
      signal: controller.signal,
    });
    target.dispatchEvent(new Event("signal"));

    expect(calls).toBe(1);
    expect(controller.signal.aborted).toBe(true);
  });

  it("skips later listeners removed by an abort during dispatch", () => {
    const target = new EventTarget();
    const controller = new AbortController();
    let laterCalls = 0;

    target.addEventListener(
      "signal",
      () => {
        controller.abort();
      },
      { signal: controller.signal },
    );
    target.addEventListener(
      "signal",
      () => {
        laterCalls += 1;
      },
      { signal: controller.signal },
    );
    target.dispatchEvent(new Event("signal"));

    expect(laterCalls).toBe(0);
  });
});

function implementationMemberNames(value: object): string[] {
  const names = new Set<string>();
  let current: object | null = value;
  while (current !== null && current !== Object.prototype) {
    for (const name of Object.getOwnPropertyNames(current)) {
      if (name.startsWith("_")) {
        names.add(name);
      }
    }
    current = Object.getPrototypeOf(current) as object | null;
  }
  return [...names];
}

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
    const html = document.implementation.createHTMLDocument("title");

    expect(cdata).toBeInstanceOf(CDATASection);
    expect(cdata.ownerDocument).toBe(document);
    expect(instruction).toBeInstanceOf(ProcessingInstruction);
    expect(instruction.ownerDocument).toBe(document);
    expect(xml.doctype).toBe(doctype);
    expect(doctype.ownerDocument).toBe(xml);
    expect(html.contentType).toBe("text/html");
    expect(html.doctype?.name).toBe("html");
    expect(html.head?.textContent).toBe("title");
    expect(html.body).not.toBeNull();
  });
});

describe("Node cloning and adoption", () => {
  it("clones elements shallowly or with their subtree", () => {
    const document = parse(
      '<main data-value="source"><span>text</span><!--note--></main>',
    );
    const source = select(document, "main");
    const shallow = source.cloneNode();
    const deep = source.cloneNode(true);

    expect(shallow).toBeInstanceOf(source.constructor);
    expect(shallow).toBeInstanceOf(Element);
    expect(shallow).not.toBe(source);
    expect(shallow.ownerDocument).toBe(document);
    expect(shallow.parentNode).toBeNull();
    expect((shallow as Element).getAttribute("data-value")).toBe("source");
    expect(shallow.childNodes.length).toBe(0);

    expect(deep).toBeInstanceOf(Element);
    expect((deep as Element).querySelector("span")?.textContent).toBe("text");
    expect(deep.lastChild).toBeInstanceOf(Comment);
    expect(deep.firstChild).not.toBe(source.firstChild);
    expect(deep.ownerDocument).toBe(document);
  });

  it("clones document fragments with their descendants", () => {
    const document = parse("");
    const source = document.createDocumentFragment();
    const element = document.createElement("span");
    element.appendChild(document.createTextNode("content"));
    source.appendChild(element);

    const shallow = source.cloneNode();
    const deep = source.cloneNode(true);

    expect(shallow).toBeInstanceOf(DocumentFragment);
    expect(shallow.childNodes.length).toBe(0);
    expect(deep).toBeInstanceOf(DocumentFragment);
    expect((deep as DocumentFragment).querySelector("span")?.textContent).toBe(
      "content",
    );
    expect(deep.firstChild).not.toBe(source.firstChild);
  });

  it("clones documents, doctypes, attributes, CDATA, and instructions", () => {
    const parser = new DOMParser();
    const document = parser.parseFromString(
      '<!DOCTYPE root PUBLIC "public-id" "system-id"><root key="value"><![CDATA[data]]><?target content?></root>',
      "application/xml",
    );
    const clone = document.cloneNode(true);

    expect(clone).toBeInstanceOf(Document);
    expect(clone).not.toBe(document);
    expect(clone.ownerDocument).toBeNull();
    expect((clone as Document).contentType).toBe("application/xml");
    expect((clone as Document).doctype).toBeInstanceOf(DocumentType);
    expect((clone as Document).doctype?.publicId).toBe("public-id");
    expect((clone as Document).doctype?.systemId).toBe("system-id");

    const root = (clone as Document).documentElement;
    expect(root?.firstChild).toBeInstanceOf(CDATASection);
    expect(root?.lastChild).toBeInstanceOf(ProcessingInstruction);
    expect((root?.lastChild as ProcessingInstruction).target).toBe("target");
    expect((root?.lastChild as ProcessingInstruction).data).toBe("content");

    const attribute = document.documentElement?.attributes.item(0);
    if (attribute === null || attribute === undefined) {
      throw new Error("missing test attribute");
    }
    const attributeClone = attribute.cloneNode();
    expect(attributeClone).toBeInstanceOf(Attr);
    expect((attributeClone as Attr).ownerElement).toBeNull();
    expect((attributeClone as Attr).value).toBe("value");
    expect(attributeClone.ownerDocument).toBe(document);
  });

  it("clones template contents only as part of a subtree clone", () => {
    const document = parse(
      '<template id="template"><section><span>content</span></section></template>',
    );
    const source = select(document, "template");
    if (!(source instanceof HTMLTemplateElement)) {
      throw new Error("missing template element");
    }

    const shallow = source.cloneNode();
    const deep = source.cloneNode(true);
    expect(shallow).toBeInstanceOf(HTMLTemplateElement);
    expect(deep).toBeInstanceOf(HTMLTemplateElement);
    expect((shallow as HTMLTemplateElement).content.childNodes.length).toBe(0);
    expect(
      (deep as HTMLTemplateElement).content.querySelector("span")?.textContent,
    ).toBe("content");
    expect((deep as HTMLTemplateElement).content.firstChild).not.toBe(
      source.content.firstChild,
    );
  });

  it("imports shallow and deep copies into the target document", () => {
    const sourceDocument = parse(
      '<main data-value="source"><span>content</span></main>',
    );
    const targetDocument = parse("");
    const source = select(sourceDocument, "main");

    const shallow = targetDocument.importNode(source);
    const deep = targetDocument.importNode(source, true);
    const dictionaryDeep = targetDocument.importNode(source, {});
    const dictionaryShallow = targetDocument.importNode(source, {
      selfOnly: true,
    });

    expect(shallow.ownerDocument).toBe(targetDocument);
    expect(shallow.childNodes.length).toBe(0);
    expect(shallow.attributes.item(0)?.ownerDocument).toBe(targetDocument);
    expect(deep.querySelector("span")?.ownerDocument).toBe(targetDocument);
    expect(dictionaryDeep.querySelector("span")?.textContent).toBe("content");
    expect(dictionaryShallow.childNodes.length).toBe(0);
    expect(source.ownerDocument).toBe(sourceDocument);
    expect(source.parentNode).not.toBeNull();
  });

  it("imports template contents into the target template owner document", () => {
    const sourceDocument = parse(
      '<template id="source"><span>content</span></template>',
    );
    const targetDocument = parse("");
    const source = select(sourceDocument, "template");
    if (!(source instanceof HTMLTemplateElement)) {
      throw new Error("missing template element");
    }

    const imported = targetDocument.importNode(source, true);
    expect(imported).toBeInstanceOf(HTMLTemplateElement);
    const content = imported.content;
    expect(content.ownerDocument).not.toBe(source.content.ownerDocument);
    expect(content.ownerDocument).not.toBe(targetDocument);
    expect(content.querySelector("span")?.ownerDocument).toBe(
      content.ownerDocument,
    );
  });

  it("adopts a node, attributes, descendants, and template contents", () => {
    const sourceDocument = parse(
      '<main data-value="source"><span></span><template><b>content</b></template></main>',
    );
    const targetDocument = parse("");
    const source = select(sourceDocument, "main");
    const template = source.querySelector("template");
    if (!(template instanceof HTMLTemplateElement)) {
      throw new Error("missing template element");
    }
    const oldTemplateDocument = template.content.ownerDocument;

    const adopted = targetDocument.adoptNode(source);

    expect(adopted).toBe(source);
    expect(adopted.parentNode).toBeNull();
    expect(adopted.ownerDocument).toBe(targetDocument);
    expect(adopted.attributes.item(0)?.ownerDocument).toBe(targetDocument);
    expect(adopted.querySelector("span")?.ownerDocument).toBe(targetDocument);
    expect(sourceDocument.querySelector("main")).toBeNull();
    expect(template.content.ownerDocument).not.toBe(oldTemplateDocument);
    expect(template.content.ownerDocument).not.toBe(targetDocument);
    expect(template.content.querySelector("b")?.ownerDocument).toBe(
      template.content.ownerDocument,
    );
  });

  it("rejects invalid import and adoption inputs", () => {
    const document = parse("");
    const importNode = document.importNode.bind(document) as unknown as (
      node?: unknown,
    ) => Node;
    const adoptNode = document.adoptNode.bind(document) as unknown as (
      node?: unknown,
    ) => Node;

    expect(() => importNode()).toThrow(TypeError);
    expect(() => importNode(null)).toThrow(TypeError);
    expect(() => adoptNode()).toThrow(TypeError);
    expect(() => adoptNode(null)).toThrow(TypeError);
    expectDOMException(
      () => document.importNode(document),
      "NotSupportedError",
    );
    expectDOMException(() => document.adoptNode(document), "NotSupportedError");
  });
});

describe("Node normalization", () => {
  it("removes empty text nodes and merges adjacent text recursively", () => {
    const document = parse("");
    const parent = document.createElement("div");
    const first = document.createTextNode("first");
    const empty = document.createTextNode("");
    const second = document.createTextNode("second");
    const comment = document.createComment("boundary");
    const trailingEmpty = document.createTextNode("");
    const third = document.createTextNode("third");
    const nested = document.createElement("span");
    const nestedEmpty = document.createTextNode("");
    const nestedFirst = document.createTextNode("nested");
    const nestedSecond = document.createTextNode(" text");

    parent.appendChild(first);
    parent.appendChild(empty);
    parent.appendChild(second);
    parent.appendChild(comment);
    parent.appendChild(trailingEmpty);
    parent.appendChild(third);
    nested.appendChild(nestedEmpty);
    nested.appendChild(nestedFirst);
    nested.appendChild(nestedSecond);
    parent.appendChild(nested);

    parent.normalize();

    expect(Array.from(parent.childNodes)).toEqual([
      first,
      comment,
      third,
      nested,
    ]);
    expect(first.data).toBe("firstsecond");
    expect(first.parentNode).toBe(parent);
    expect(empty.parentNode).toBeNull();
    expect(second.parentNode).toBeNull();
    expect(third.data).toBe("third");
    expect(Array.from(nested.childNodes)).toEqual([nestedFirst]);
    expect(nestedFirst.data).toBe("nested text");
    expect(nestedEmpty.parentNode).toBeNull();
    expect(nestedSecond.parentNode).toBeNull();

    parent.normalize();
    expect(Array.from(parent.childNodes)).toEqual([
      first,
      comment,
      third,
      nested,
    ]);
  });

  it("keeps CDATA sections as boundaries between text nodes", () => {
    const document = new DOMParser().parseFromString(
      "<root>left<![CDATA[middle]]>right</root>",
      "application/xml",
    );
    const root = document.documentElement;
    if (root === null) {
      throw new Error("missing root element");
    }
    const children = Array.from(root.childNodes);

    root.normalize();

    expect(Array.from(root.childNodes)).toEqual(children);
    expect(root.childNodes.item(0)).toBeInstanceOf(Text);
    expect(root.childNodes.item(1)).toBeInstanceOf(CDATASection);
    expect(root.childNodes.item(2)).toBeInstanceOf(Text);
    expect(root.textContent).toBe("leftmiddleright");
  });
});

describe("Node relationships and comparison", () => {
  it("locates namespace prefixes and namespace URIs", () => {
    const document = new Document();
    const root = document.createElementNS("urn:root", "r:root");
    const child = document.createElementNS(null, "child");
    const comment = document.createComment("content");
    root.setAttributeNS(XMLNS_NAMESPACE, "xmlns", "urn:default");
    root.setAttributeNS(XMLNS_NAMESPACE, "xmlns:p", "urn:prefix");
    root.append(child);
    child.append(comment);
    document.append(root);

    expect(root.lookupPrefix("urn:root")).toBe("r");
    expect(child.lookupPrefix("urn:prefix")).toBe("p");
    expect(comment.lookupPrefix("urn:prefix")).toBe("p");
    expect(document.lookupPrefix("urn:prefix")).toBe("p");
    expect(child.lookupPrefix("")).toBeNull();

    expect(child.lookupNamespaceURI(null)).toBe("urn:default");
    expect(child.lookupNamespaceURI("")).toBe("urn:default");
    expect(comment.lookupNamespaceURI("p")).toBe("urn:prefix");
    expect(document.lookupNamespaceURI("r")).toBe("urn:root");
    expect(child.lookupNamespaceURI("xml")).toBe(XML_NAMESPACE);
    expect(child.lookupNamespaceURI("xmlns")).toBe(XMLNS_NAMESPACE);
    expect(child.isDefaultNamespace("urn:default")).toBe(true);
    expect(child.isDefaultNamespace("urn:prefix")).toBe(false);
    expect(document.createDocumentFragment().isDefaultNamespace(null)).toBe(
      true,
    );

    const declaration = root.getAttributeNodeNS(XMLNS_NAMESPACE, "p");
    expect(declaration?.lookupNamespaceURI("p")).toBe("urn:prefix");
    expect(
      document.createAttribute("detached").lookupNamespaceURI("xml"),
    ).toBeNull();
    expect(
      document.createDocumentFragment().lookupNamespaceURI("xml"),
    ).toBeNull();

    const xhtml = new DOMParser().parseFromString(
      '<html xmlns="http://www.w3.org/1999/xhtml" xmlns:x="urn:test"><body xmlns:s="urn:test"><x xmlns:t="urn:test"><!--content--></x></body></html>',
      "application/xhtml+xml",
    );
    const x = xhtml.getElementsByTagName("x").item(0);
    if (x === null) {
      throw new Error("missing XHTML element");
    }
    expect(xhtml.lookupPrefix("urn:test")).toBe("x");
    expect(x.parentElement?.lookupPrefix("urn:test")).toBe("s");
    expect(x.lookupPrefix("urn:test")).toBe("t");
    expect(x.firstChild?.lookupPrefix("urn:test")).toBe("t");
  });

  it("exposes legacy node type constants", () => {
    expect(Node.ENTITY_REFERENCE_NODE).toBe(5);
    expect(Node.ENTITY_NODE).toBe(6);
    expect(Node.NOTATION_NODE).toBe(12);
  });

  it("finds roots and inclusive descendants", () => {
    const document = parse('<main id="root"><span></span></main>');
    const main = select(document, "main");
    const span = select(document, "span");
    const detached = document.createElement("section");
    const detachedChild = document.createElement("b");
    detached.appendChild(detachedChild);
    const attribute = main.attributes.item(0);
    if (attribute === null) {
      throw new Error("missing attribute");
    }

    expect(span.getRootNode()).toBe(document);
    expect(span.getRootNode({ composed: true })).toBe(document);
    expect(detachedChild.getRootNode()).toBe(detached);
    expect(attribute.getRootNode()).toBe(attribute);
    expect(main.contains(main)).toBe(true);
    expect(main.contains(span)).toBe(true);
    expect(span.contains(main)).toBe(false);
    expect(main.contains(null)).toBe(false);
    expect(main.contains(attribute)).toBe(false);
  });

  it("compares connected nodes and attributes", () => {
    const document = parse(
      '<main first="1" second="2"><span></span><b></b></main>',
    );
    const main = select(document, "main");
    const span = select(document, "span");
    const bold = select(document, "b");
    const first = main.attributes.item(0);
    const second = main.attributes.item(1);
    if (first === null || second === null) {
      throw new Error("missing attributes");
    }

    expect(main.compareDocumentPosition(main)).toBe(0);
    expect(main.compareDocumentPosition(span)).toBe(
      Node.DOCUMENT_POSITION_CONTAINED_BY | Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(span.compareDocumentPosition(main)).toBe(
      Node.DOCUMENT_POSITION_CONTAINS | Node.DOCUMENT_POSITION_PRECEDING,
    );
    expect(span.compareDocumentPosition(bold)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(bold.compareDocumentPosition(span)).toBe(
      Node.DOCUMENT_POSITION_PRECEDING,
    );
    expect(first.compareDocumentPosition(second)).toBe(
      Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC |
        Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(main.compareDocumentPosition(first)).toBe(
      Node.DOCUMENT_POSITION_CONTAINED_BY | Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(first.compareDocumentPosition(span)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  it("keeps a consistent order for disconnected nodes", () => {
    const document = parse("");
    const first = document.createElement("div");
    const second = document.createElement("div");

    const forward = first.compareDocumentPosition(second);
    const repeated = first.compareDocumentPosition(second);
    const reverse = second.compareDocumentPosition(first);

    expect(forward).toBe(repeated);
    expect(forward & Node.DOCUMENT_POSITION_DISCONNECTED).not.toBe(0);
    expect(forward & Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC).not.toBe(
      0,
    );
    expect(Boolean(forward & Node.DOCUMENT_POSITION_PRECEDING)).toBe(
      Boolean(reverse & Node.DOCUMENT_POSITION_FOLLOWING),
    );
    expect(Boolean(forward & Node.DOCUMENT_POSITION_FOLLOWING)).toBe(
      Boolean(reverse & Node.DOCUMENT_POSITION_PRECEDING),
    );
  });

  it("compares node identity and structure", () => {
    const document = new DOMParser().parseFromString(
      '<!DOCTYPE root PUBLIC "public-id" "system-id"><root first="1" second="2"><![CDATA[data]]><?target content?><!--comment--></root>',
      "application/xml",
    );
    const clone = document.cloneNode(true);

    expect(document.isSameNode(document)).toBe(true);
    expect(document.isSameNode(clone)).toBe(false);
    expect(document.isSameNode(null)).toBe(false);
    expect(document.isEqualNode(clone)).toBe(true);

    const cloneRoot = (clone as Document).documentElement;
    if (cloneRoot === null) {
      throw new Error("missing cloned root");
    }
    cloneRoot.setAttribute("first", "changed");
    expect(document.isEqualNode(clone)).toBe(false);

    const first = document.createElement("item");
    first.setAttribute("first", "1");
    first.setAttribute("second", "2");
    const second = document.createElement("item");
    second.setAttribute("second", "2");
    second.setAttribute("first", "1");
    expect(first.isEqualNode(second)).toBe(true);
  });

  it("converts nullable arguments and rejects non-node arguments", () => {
    const document = parse("");
    const element = document.createElement("div");
    const contains = element.contains.bind(element) as unknown as (
      other?: unknown,
    ) => boolean;
    const isEqualNode = element.isEqualNode.bind(element) as unknown as (
      other?: unknown,
    ) => boolean;
    const isSameNode = element.isSameNode.bind(element) as unknown as (
      other?: unknown,
    ) => boolean;
    const compareDocumentPosition = element.compareDocumentPosition.bind(
      element,
    ) as unknown as (other?: unknown) => number;

    expect(contains()).toBe(false);
    expect(isEqualNode()).toBe(false);
    expect(isSameNode()).toBe(false);
    expect(() => contains("div")).toThrow(TypeError);
    expect(() => isEqualNode("div")).toThrow(TypeError);
    expect(() => isSameNode("div")).toThrow(TypeError);
    expect(() => compareDocumentPosition()).toThrow(TypeError);
    expect(() => compareDocumentPosition(null)).toThrow(TypeError);
  });
});

describe("DOM tree lookup", () => {
  it("finds descendant elements by qualified name with live results", () => {
    const document = parse(
      "<!doctype html><main><section><span></span></section></main>",
    );
    const main = select(document, "main");
    const documentSpans = document.getElementsByTagName("SPAN");
    const descendants = main.getElementsByTagName("*");

    expect([...documentSpans].map((element) => element.localName)).toEqual([
      "span",
    ]);
    expect([...descendants].map((element) => element.localName)).toEqual([
      "section",
      "span",
    ]);

    const added = document.createElement("span");
    main.appendChild(added);
    expect(Array.from(documentSpans)).toEqual([
      select(document, "section span"),
      added,
    ]);
    expect(descendants.item(descendants.length - 1)).toBe(added);
  });

  it("finds elements by namespace and preserves foreign name case", () => {
    const document = parse("<!doctype html><main></main>");
    const main = select(document, "main");
    const foreign = document.createElementNS("urn:example", "p:MixedCase");
    main.appendChild(foreign);

    expect(document.getElementsByTagName("p:MixedCase").item(0)).toBe(foreign);
    expect(document.getElementsByTagName("p:mixedcase").length).toBe(0);
    expect(
      document.getElementsByTagNameNS("urn:example", "MixedCase").item(0),
    ).toBe(foreign);
    expect(document.getElementsByTagNameNS("*", "MixedCase").item(0)).toBe(
      foreign,
    );
    expect(document.getElementsByTagNameNS("urn:example", "*").item(0)).toBe(
      foreign,
    );
    expect(document.getElementsByTagNameNS("*", "*").length).toBe(5);
  });

  it("finds all requested classes and keeps the collection live", () => {
    const document = parse(
      '<!doctype html><main><p id="first" class="alpha beta"></p><p id="second" class="alpha"></p></main>',
    );
    const collection = document.getElementsByClassName(" beta  alpha alpha ");
    const first = select(document, "#first");
    const second = select(document, "#second");

    expect(Array.from(collection)).toEqual([first]);
    second.className = "alpha beta";
    expect(Array.from(collection)).toEqual([first, second]);
    first.classList.remove("beta");
    expect(Array.from(collection)).toEqual([second]);
    expect(document.getElementsByClassName(" ").length).toBe(0);
  });

  it("uses document mode for class name comparison", () => {
    const quirks = parse('<main><p class="Mixed"></p></main>');
    const standards = parse(
      '<!doctype html><main><p class="Mixed"></p></main>',
    );

    expect(quirks.getElementsByClassName("mixed").length).toBe(1);
    expect(standards.getElementsByClassName("mixed").length).toBe(0);
    expect(standards.getElementsByClassName("Mixed").length).toBe(1);
  });

  it("finds HTML elements by name with live results", () => {
    const document = parse(
      '<!doctype html><main><p name="target"></p><svg name="target"></svg><p id="target"></p></main>',
    );
    const collection = document.getElementsByName("target");
    const first = select(document, 'p[name="target"]');

    expect(Array.from(collection)).toEqual([first]);
    const added = document.createElement("section");
    added.setAttribute("name", "target");
    document.body?.appendChild(added);
    expect(Array.from(collection)).toEqual([first, added]);
    added.setAttribute("name", "other");
    expect(Array.from(collection)).toEqual([first]);
  });

  it("finds the first ID in tree order in documents and fragments", () => {
    const document = parse(
      '<!doctype html><main><p id="a:b"></p><section id="duplicate"></section><aside id="duplicate"></aside></main>',
    );
    const section = select(document, "section");
    const aside = select(document, "aside");

    expect(document.getElementById("a:b")?.localName).toBe("p");
    expect(document.getElementById("duplicate")).toBe(section);
    section.remove();
    expect(document.getElementById("duplicate")).toBe(aside);

    const fragment = document.createDocumentFragment();
    const nested = document.createElement("div");
    nested.id = "fragment-id";
    fragment.appendChild(nested);
    expect(fragment.getElementById("fragment-id")).toBe(nested);
    expect(document.getElementById("fragment-id")).toBeNull();
  });

  it("keeps XML qualified-name lookup case-sensitive", () => {
    const document = new DOMParser().parseFromString(
      '<Root><Item class="Mixed" /></Root>',
      "application/xml",
    );

    expect(document.getElementsByTagName("Item").length).toBe(1);
    expect(document.getElementsByTagName("item").length).toBe(0);
    expect(document.getElementsByClassName("Mixed").length).toBe(1);
    expect(document.getElementsByClassName("mixed").length).toBe(0);
  });

  it("requires lookup arguments", () => {
    const document = parse("");
    const getElementById = document.getElementById.bind(
      document,
    ) as unknown as (id?: unknown) => Element | null;
    const getElementsByTagName = document.getElementsByTagName.bind(
      document,
    ) as unknown as (name?: unknown) => unknown;
    const getElementsByTagNameNS = document.getElementsByTagNameNS.bind(
      document,
    ) as unknown as (namespace?: unknown, localName?: unknown) => unknown;
    const getElementsByName = document.getElementsByName.bind(
      document,
    ) as unknown as (name?: unknown) => unknown;

    expect(() => getElementById()).toThrow(TypeError);
    expect(() => getElementsByTagName()).toThrow(TypeError);
    expect(() => getElementsByTagNameNS("urn:example")).toThrow(TypeError);
    expect(() => getElementsByName()).toThrow(TypeError);
    expect(() => getElementById(Symbol("id"))).toThrow(TypeError);
  });
});

describe("Element attributes", () => {
  it("reflects id and class attributes", () => {
    const element = select(
      parse('<main id="initial" class="first second"></main>'),
      "main",
    );

    expect(element.id).toBe("initial");
    expect(element.className).toBe("first second");

    element.id = "updated";
    element.className = "third";
    expect(element.getAttribute("id")).toBe("updated");
    expect(element.getAttribute("class")).toBe("third");

    element.removeAttribute("id");
    element.removeAttribute("class");
    expect(element.id).toBe("");
    expect(element.className).toBe("");
  });

  it("gets, sets, toggles, and removes attributes", () => {
    const document = parse('<main id="root" data-value="initial"></main>');
    const element = select(document, "main");
    const attribute = element.attributes.item(1);

    expect(element.getAttributeNames()).toEqual(["id", "data-value"]);
    expect(element.getAttribute("DATA-VALUE")).toBe("initial");
    expect(element.hasAttribute("DATA-VALUE")).toBe(true);

    element.setAttribute("DATA-VALUE", "updated");
    expect(element.getAttribute("data-value")).toBe("updated");
    expect(element.attributes.item(1)).toBe(attribute);
    expect(attribute?.value).toBe("updated");

    element.setAttribute("hidden", "");
    expect(element.getAttributeNames()).toEqual(["id", "data-value", "hidden"]);
    expect(element.toggleAttribute("hidden")).toBe(false);
    expect(element.hasAttribute("hidden")).toBe(false);
    expect(element.toggleAttribute("hidden", true)).toBe(true);
    expect(element.getAttribute("hidden")).toBe("");
    expect(element.toggleAttribute("hidden", false)).toBe(false);

    element.removeAttribute("DATA-VALUE");
    expect(element.getAttribute("data-value")).toBeNull();
    expect(attribute?.ownerElement).toBeNull();
  });

  it("converts attribute values and rejects invalid names", () => {
    const element = select(parse("<main></main>"), "main");
    const value = {
      toString(): string {
        return "converted";
      },
    };
    const setAttribute = element.setAttribute.bind(element) as unknown as (
      name: unknown,
      value: unknown,
    ) => void;

    setAttribute("data-value", value);
    expect(element.getAttribute("data-value")).toBe("converted");
    expectDOMException(() => {
      element.setAttribute("not valid", "value");
    }, "InvalidCharacterError");
  });

  it("operates on namespaced attributes by namespace and local name", () => {
    const document = parse('<svg><a id="link" xlink:href="before"></a></svg>');
    const element = select(document, "#link");
    const attribute = element.attributes.item(1);

    expect(element.getAttributeNS(XLINK_NAMESPACE, "href")).toBe("before");
    expect(element.getAttributeNodeNS(XLINK_NAMESPACE, "href")).toBe(attribute);
    expect(element.hasAttributeNS(XLINK_NAMESPACE, "href")).toBe(true);

    element.setAttributeNS(XLINK_NAMESPACE, "replacement:href", "after");
    expect(element.getAttribute("xlink:href")).toBe("after");
    expect(element.getAttribute("replacement:href")).toBeNull();
    expect(element.attributes.item(1)).toBe(attribute);

    element.removeAttributeNS(XLINK_NAMESPACE, "href");
    expect(element.getAttributeNS(XLINK_NAMESPACE, "href")).toBeNull();
    expect(attribute?.ownerElement).toBeNull();
  });

  it("creates namespaced attribute nodes", () => {
    const document = parse("<main></main>");
    const attribute = document.createAttributeNS("urn:test", "p:name");

    expect(attribute.ownerDocument).toBe(document);
    expect(attribute.ownerElement).toBeNull();
    expect(attribute.namespaceURI).toBe("urn:test");
    expect(attribute.prefix).toBe("p");
    expect(attribute.localName).toBe("name");
    expect(attribute.name).toBe("p:name");
    expect(attribute.value).toBe("");
    expectDOMException(
      () => document.createAttributeNS("urn:test", "p:"),
      "InvalidCharacterError",
    );
  });

  it("creates non-namespaced attribute nodes", () => {
    const document = parse("<main></main>");
    const attribute = document.createAttribute("DATA^VALUE");

    expect(attribute.ownerDocument).toBe(document);
    expect(attribute.namespaceURI).toBeNull();
    expect(attribute.name).toBe("data^value");
    expect(attribute.localName).toBe("data^value");
    expectDOMException(
      () => document.createAttribute("not valid"),
      "InvalidCharacterError",
    );
  });

  it("gets, replaces, and removes attributes through NamedNodeMap", () => {
    const document = parse(
      '<main id="target" data-value="old"></main><aside data-value="new" title="in-use"></aside>',
    );
    const target = select(document, "main");
    const donor = select(document, "aside");
    const attributes = target.attributes;
    const oldAttribute = attributes.getNamedItem("DATA-VALUE");
    const replacement = donor.attributes.removeNamedItem("data-value");

    expect(oldAttribute?.value).toBe("old");
    expect(attributes.setNamedItem(replacement)).toBe(oldAttribute);
    expect(oldAttribute?.ownerElement).toBeNull();
    expect(replacement.ownerElement).toBe(target);
    expect(attributes.getNamedItem("data-value")).toBe(replacement);
    expect(attributes.setNamedItem(replacement)).toBe(replacement);

    const removed = attributes.removeNamedItem("DATA-VALUE");
    expect(removed).toBe(replacement);
    expect(removed.ownerElement).toBeNull();
    expect(attributes.getNamedItem("data-value")).toBeNull();

    const inUse = donor.attributes.getNamedItem("title");
    if (inUse === null) {
      throw new Error("missing in-use attribute");
    }
    expectDOMException(
      () => attributes.setNamedItem(inUse),
      "InUseAttributeError",
    );
    expectDOMException(
      () => attributes.removeNamedItem("missing"),
      "NotFoundError",
    );
  });

  it("exposes collection indexes to generic array iteration", () => {
    const document = parse('<main id="first"></main><main id="second"></main>');
    const elements = document.querySelectorAll("main");
    const liveElements = document.getElementsByTagName("main");
    const attributes = elements[0]?.attributes;

    expect(0 in elements).toBe(true);
    expect(2 in elements).toBe(false);
    expect(
      Array.prototype.map.call(elements, (element: Element) => element.id),
    ).toEqual(["first", "second"]);
    expect(
      Array.prototype.map.call(liveElements, (element: Element) => element.id),
    ).toEqual(["first", "second"]);
    document.body?.appendChild(document.createElement("main"));
    expect(liveElements).toHaveLength(3);
    if (attributes === undefined) {
      throw new Error("missing attributes");
    }
    expect(0 in attributes).toBe(true);
    expect(
      Array.prototype.map.call(attributes, (attribute: Attr) => attribute.name),
    ).toEqual(["id"]);
  });

  it("gets, replaces, and removes attribute nodes through Element", () => {
    const document = parse(
      '<main data-value="old"></main><aside data-value="new"></aside>',
    );
    const target = select(document, "main");
    const donor = select(document, "aside");
    const oldAttribute = target.attributes.getNamedItem("data-value");
    const replacement = donor.attributes.removeNamedItem("data-value");

    expect(target.setAttributeNode(replacement)).toBe(oldAttribute);
    expect(oldAttribute?.ownerElement).toBeNull();
    expect(replacement.ownerElement).toBe(target);
    expect(target.setAttributeNodeNS(replacement)).toBe(replacement);
    expect(target.removeAttributeNode(replacement)).toBe(replacement);
    expect(replacement.ownerElement).toBeNull();
    expectDOMException(
      () => target.removeAttributeNode(replacement),
      "NotFoundError",
    );
  });

  it("changes an inserted attribute node to the element's node document", () => {
    const source = parse('<aside data-value="source"></aside>');
    const target = parse("<main></main>");
    const attribute = select(source, "aside").attributes.removeNamedItem(
      "data-value",
    );
    const main = select(target, "main");

    expect(attribute.ownerDocument).toBe(source);
    expect(main.setAttributeNode(attribute)).toBeNull();
    expect(attribute.ownerDocument).toBe(target);
    expect(attribute.ownerElement).toBe(main);
  });

  it("uses namespace and local name through NamedNodeMap", () => {
    const element = select(
      parse('<svg><a id="link" xlink:href="value"></a></svg>'),
      "#link",
    );
    const attributes = element.attributes;
    const attribute = attributes.getNamedItemNS(XLINK_NAMESPACE, "href");
    if (attribute === null) {
      throw new Error("missing namespaced attribute");
    }

    expect(attributes.removeNamedItemNS(XLINK_NAMESPACE, "href")).toBe(
      attribute,
    );
    expect(attribute.ownerElement).toBeNull();
    expect(attributes.setNamedItemNS(attribute)).toBeNull();
    expect(attribute.ownerElement).toBe(element);
    expect(attributes.getNamedItemNS(XLINK_NAMESPACE, "href")).toBe(attribute);
  });
});

describe("Node mutation", () => {
  it("validates replaceChild hierarchy before child membership", () => {
    const document = new Document();
    const text = document.createTextNode("parent");

    expectDOMException(() => {
      text.replaceChild(
        document.createElement("replacement"),
        document.createElement("missing"),
      );
    }, "HierarchyRequestError");

    const target = document.implementation.createHTMLDocument("target");
    const source = document.implementation.createHTMLDocument("source");
    const oldDoctype = target.doctype;
    const newDoctype = source.doctype;
    if (oldDoctype === null || newDoctype === null) {
      throw new Error("missing doctype");
    }
    expect(target.replaceChild(newDoctype, oldDoctype)).toBe(oldDoctype);
    expect(target.doctype).toBe(newDoctype);

    const constrained = document.implementation.createHTMLDocument("title");
    const constrainedElement = constrained.documentElement;
    if (constrainedElement === null) {
      throw new Error("missing document element");
    }
    constrained.removeChild(constrainedElement);
    const comment = constrained.insertBefore(
      constrained.createComment("before"),
      constrained.doctype,
    );
    expectDOMException(() => {
      constrained.replaceChild(constrained.createElement("root"), comment);
    }, "HierarchyRequestError");
  });

  it("finds adjacent element siblings across non-element nodes", () => {
    const document = parse(
      "<main><section id=first></section>text<!--comment--><section id=second></section></main>",
    );
    const first = select(document, "#first");
    const second = select(document, "#second");
    const text = first.nextSibling;

    expect(first.previousElementSibling).toBeNull();
    expect(first.nextElementSibling).toBe(second);
    expect(second.previousElementSibling).toBe(first);
    expect(second.nextElementSibling).toBeNull();
    expect(text).toBeInstanceOf(Text);
    expect((text as Text).previousElementSibling).toBe(first);
    expect((text as Text).nextElementSibling).toBe(second);
  });

  it("appends nodes and strings to ParentNode objects", () => {
    const document = parse("<main><span></span></main>");
    const main = select(document, "main");
    const span = select(document, "span");
    const fragment = document.createDocumentFragment();

    fragment.append("fragment");
    main.append("before", span, fragment, "after");

    expect(main.textContent).toBe("beforefragmentafter");
    expect(main.children).toHaveLength(1);
    expect(main.firstElementChild).toBe(span);
    expect(fragment.childNodes).toHaveLength(0);

    const detached = new Document();
    const root = detached.createElement("root");
    detached.append(root);
    expect(detached.documentElement).toBe(root);
  });

  it("mutates ParentNode and ChildNode objects with nodes and strings", () => {
    const document = parse("<main><a></a><b></b><c></c></main>");
    const main = select(document, "main");
    const first = select(document, "a");
    const second = select(document, "b");
    const third = select(document, "c");

    second.before(third, second);
    expect(Array.from(main.children)).toEqual([first, third, second]);
    second.after(first, second);
    expect(Array.from(main.children)).toEqual([third, first, second]);
    second.replaceWith(first, "tail");
    expect(Array.from(main.children)).toEqual([third, first]);
    expect(main.textContent).toBe("tail");

    main.prepend("head");
    main.append("foot");
    expect(main.textContent).toBe("headtailfoot");
    main.replaceChildren(first, "replacement");
    expect(Array.from(main.childNodes)).toEqual([first, main.lastChild]);
    expect(main.textContent).toBe("replacement");
    first.remove();
    expect(main.children).toHaveLength(0);
  });

  it("moves Element and CharacterData nodes within the same tree", () => {
    const document = parse(
      "<main><section id=first></section><section id=second>text</section><section id=third></section></main>",
    );
    const main = select(document, "main");
    const first = select(document, "#first");
    const second = select(document, "#second");
    const third = select(document, "#third");
    const text = second.firstChild;
    if (!(text instanceof Text)) {
      throw new Error("missing text node");
    }

    expect(document.isConnected).toBe(true);
    expect(main.isConnected).toBe(true);
    main.moveBefore(third, first);
    expect(Array.from(main.children)).toEqual([third, first, second]);
    main.moveBefore(third, third);
    expect(Array.from(main.children)).toEqual([third, first, second]);
    main.moveBefore(text, null);
    expect(main.lastChild).toBe(text);
    expect(second.textContent).toBe("");

    const detachedRoot = document.createElement("div");
    const destination = detachedRoot.appendChild(
      document.createElement("section"),
    );
    const moved = detachedRoot.appendChild(document.createElement("p"));
    expect(detachedRoot.isConnected).toBe(false);
    destination.moveBefore(moved, null);
    expect(destination.firstChild).toBe(moved);

    const unrelated = document.createElement("div");
    expectDOMException(() => {
      unrelated.moveBefore(moved, null);
    }, "HierarchyRequestError");
    const hierarchyDocument = new Document();
    const doctype = hierarchyDocument.implementation.createDocumentType(
      "root",
      "",
      "",
    );
    const hierarchyRoot = hierarchyDocument.createElement("root");
    hierarchyDocument.appendChild(doctype);
    hierarchyDocument.appendChild(hierarchyRoot);
    expectDOMException(() => {
      hierarchyRoot.moveBefore(doctype, null);
    }, "HierarchyRequestError");
    expectDOMException(() => {
      first.moveBefore(second, third);
    }, "NotFoundError");
  });

  it("applies live Range and NodeIterator pre-remove updates during moves", () => {
    const document = parse(
      "<main><section id=old><i id=before></i><div id=target><b id=inner></b></div><i id=after></i></section><section id=destination></section></main>",
    );
    const oldParent = select(document, "#old");
    const target = select(document, "#target");
    const inner = select(document, "#inner");
    const after = select(document, "#after");
    const destination = select(document, "#destination");
    const range = document.createRange();
    range.setStart(inner, 0);
    range.setEnd(after, 0);
    const iterator = document.createNodeIterator(oldParent);
    expect(iterator.nextNode()).toBe(oldParent);
    expect(iterator.nextNode()).toBe(select(document, "#before"));
    expect(iterator.nextNode()).toBe(target);
    expect(iterator.nextNode()).toBe(inner);

    destination.moveBefore(target, null);

    expect(range.startContainer).toBe(oldParent);
    expect(range.endContainer).toBe(after);
    expect(iterator.nextNode()).toBe(after);
  });

  it("validates and replaces all Document children", () => {
    const document = new Document();
    const doctype = document.implementation.createDocumentType("root", "", "");
    const first = document.createElement("first");
    const second = document.createElement("second");
    document.appendChild(doctype);
    document.appendChild(first);

    document.replaceChildren(second);

    expect(document.childNodes).toHaveLength(1);
    expect(document.documentElement).toBe(second);
    expect(doctype.parentNode).toBeNull();
    expectDOMException(() => {
      document.append(document.createElement("third"));
    }, "HierarchyRequestError");
    expect(document.documentElement).toBe(second);
  });

  it("moves nodes with appendChild and updates live collections", () => {
    const document = parse(
      '<main><section id="first"><p></p></section><section id="second"></section></main>',
    );
    const main = select(document, "main");
    const first = select(document, "#first");
    const second = select(document, "#second");
    const paragraph = select(document, "p");
    const mainChildren = main.children;
    const firstChildren = first.childNodes;

    expect(second.appendChild(paragraph)).toBe(paragraph);
    expect(paragraph.parentNode).toBe(second);
    expect(firstChildren).toHaveLength(0);
    expect(second.firstChild).toBe(paragraph);
    expect(mainChildren).toHaveLength(2);
  });

  it("inserts, replaces, and removes child nodes", () => {
    const document = parse(
      '<main><section id="first"></section><section id="second"></section><section id="third"></section></main>',
    );
    const main = select(document, "main");
    const first = select(document, "#first");
    const second = select(document, "#second");
    const third = select(document, "#third");

    expect(main.insertBefore(third, first)).toBe(third);
    expect(Array.from(main.children)).toEqual([third, first, second]);

    expect(main.replaceChild(first, third)).toBe(third);
    expect(Array.from(main.children)).toEqual([first, second]);
    expect(third.parentNode).toBeNull();

    expect(main.removeChild(second)).toBe(second);
    expect(Array.from(main.children)).toEqual([first]);
    expect(second.parentNode).toBeNull();
  });

  it("adopts an inserted node and its descendants", () => {
    const targetDocument = parse("<main></main>");
    const sourceDocument = parse("<section><span></span></section>");
    const main = select(targetDocument, "main");
    const section = select(sourceDocument, "section");
    const span = select(sourceDocument, "span");

    main.appendChild(section);

    expect(section.ownerDocument).toBe(targetDocument);
    expect(span.ownerDocument).toBe(targetDocument);
    expect(sourceDocument.querySelector("section")).toBeNull();
  });

  it("runs insertion and post-connection steps in tree order", () => {
    const document = parse("<main></main>");
    const main = select(document, "main");
    const fragment = document.createDocumentFragment();
    const section = document.createElement("section");
    const span = document.createElement("span");
    const aside = document.createElement("aside");
    section.id = "section";
    span.id = "span";
    aside.id = "aside";
    section.append(span);
    fragment.append(section, aside);
    const events: string[] = [];
    const implementation = documentImplementation(document);
    implementation.insertionSteps = (node) => {
      events.push(`insert:${(node as Element).id}`);
      if (node === section) {
        expect(section.parentNode).toBe(main);
        expect(aside.parentNode).toBeNull();
      }
    };
    implementation.postConnectionSteps = (node) => {
      events.push(`post:${(node as Element).id}`);
    };

    main.append(fragment);

    expect(events).toEqual([
      "insert:section",
      "insert:span",
      "insert:aside",
      "post:section",
      "post:span",
      "post:aside",
    ]);
  });

  it("runs removing steps in tree order after detaching the subtree", () => {
    const document = parse(
      "<main><section><span></span></section><aside></aside></main>",
    );
    const main = select(document, "main");
    const section = select(document, "section");
    const span = select(document, "span");
    const events: string[] = [];
    documentImplementation(document).removingSteps = (
      node,
      isSubtreeRoot,
      oldAncestor,
    ) => {
      events.push(
        `${node.nodeName}:${String(isSubtreeRoot)}:${oldAncestor.nodeName}`,
      );
      if (node === section) {
        expect(section.parentNode).toBeNull();
      }
      if (node === span) {
        expect(span.parentNode).toBe(section);
      }
    };

    section.remove();

    expect(events).toEqual(["SECTION:true:MAIN", "SPAN:false:MAIN"]);
    expect(main.firstElementChild?.localName).toBe("aside");
  });

  it("does not run insertion or removing steps for an atomic move", () => {
    const document = parse("<main><section></section><aside></aside></main>");
    const main = select(document, "main");
    const section = select(document, "section");
    const aside = select(document, "aside");
    const events: string[] = [];
    const implementation = documentImplementation(document);
    implementation.insertionSteps = () => events.push("insert");
    implementation.removingSteps = () => events.push("remove");
    implementation.postConnectionSteps = () => events.push("post");

    main.moveBefore(aside, section);

    expect(Array.from(main.children)).toEqual([aside, section]);
    expect(events).toEqual([]);
  });

  it("rejects invalid tree mutations", () => {
    const document = parse(
      '<main><section id="first"></section><section id="second"></section></main>',
    );
    const main = select(document, "main");
    const first = select(document, "#first");
    const body = document.body;
    if (body === null) {
      throw new Error("missing body");
    }

    expectDOMException(() => first.appendChild(main), "HierarchyRequestError");
    expectDOMException(() => main.insertBefore(first, body), "NotFoundError");
    expectDOMException(() => main.removeChild(body), "NotFoundError");
  });
});

describe("Document metadata", () => {
  it("gets and sets the document title", () => {
    const document = parse(
      "<title>  Initial\n title\u00a0 </title><main></main>",
    );

    expect(document.title).toBe("Initial title\u00a0");
    document.title = "Updated title";
    expect(document.title).toBe("Updated title");
    expect(document.querySelector("title")?.textContent).toBe("Updated title");
  });

  it("uses only the HTML title element in an HTML document", () => {
    const document = parse(
      "<svg><title>SVG title</title></svg><title>HTML title</title>",
    );

    expect(document.title).toBe("HTML title");
  });

  it("gets, creates, and sets a direct SVG title child", () => {
    const document = new DOMParser().parseFromString(
      '<svg xmlns="http://www.w3.org/2000/svg"><g><title>nested</title></g></svg>',
      "image/svg+xml",
    );

    expect(document.title).toBe("");
    document.title = "SVG title";
    expect(document.title).toBe("SVG title");
    expect(document.documentElement?.firstElementChild?.localName).toBe(
      "title",
    );
    expect(document.documentElement?.firstElementChild?.namespaceURI).toBe(
      "http://www.w3.org/2000/svg",
    );
  });

  it("ignores title assignment for a non-HTML, non-SVG root", () => {
    const document = new DOMParser().parseFromString(
      "<root><title>unchanged</title></root>",
      "application/xml",
    );

    expect(document.title).toBe("");
    document.title = "ignored";
    expect(document.querySelector("title")?.textContent).toBe("unchanged");
  });

  it("uses the frozen URL of the first base element with an href", () => {
    const document = parse("<main></main>");
    const head = document.head;
    if (head === null) {
      throw new Error("missing head");
    }
    setDocumentURL(document, "https://old.example/news/page.html");
    const firstWithoutHref = document.createElement("base");
    const firstWithHref = document.createElement("base");
    firstWithHref.setAttribute("href", "../articles/");
    const secondWithHref = document.createElement("base");
    secondWithHref.setAttribute("href", "../ignored/");
    head.append(firstWithoutHref, firstWithHref, secondWithHref);

    expect(document.baseURI).toBe("https://old.example/articles/");
    expect(select(document, "main").baseURI).toBe(
      "https://old.example/articles/",
    );

    setDocumentURL(document, "https://new.example/path/page.html");
    expect(document.baseURI).toBe("https://old.example/articles/");

    firstWithHref.setAttribute("href", "../updated/");
    expect(document.baseURI).toBe("https://new.example/updated/");

    firstWithoutHref.setAttribute("href", "/first/");
    expect(document.baseURI).toBe("https://new.example/first/");

    setDocumentURL(document, "https://latest.example/root/page.html");
    firstWithoutHref.remove();
    expect(document.baseURI).toBe("https://latest.example/updated/");
  });

  it("falls back to the document URL for invalid and forbidden base URLs", () => {
    const document = parse("<main></main>");
    const head = document.head;
    if (head === null) {
      throw new Error("missing head");
    }
    setDocumentURL(document, "https://example.test/path/page.html");
    const base = document.createElement("base");
    head.appendChild(base);

    expect(document.baseURI).toBe("https://example.test/path/page.html");
    base.setAttribute("href", "data:text/plain,base");
    expect(document.baseURI).toBe("https://example.test/path/page.html");
    base.setAttribute("href", "javascript:void(0)");
    expect(document.baseURI).toBe("https://example.test/path/page.html");
    base.setAttribute("href", "http://[");
    expect(document.baseURI).toBe("https://example.test/path/page.html");
  });

  it("preserves the source base URL as a document clone override", () => {
    const document = parse("<main></main>");
    const head = document.head;
    if (head === null) {
      throw new Error("missing head");
    }
    setDocumentURL(document, "https://example.test/path/page.html");
    const base = document.createElement("base");
    base.setAttribute("href", "../articles/");
    head.appendChild(base);

    const clone = document.cloneNode() as Document;
    setDocumentURL(clone, "https://other.test/changed/page.html");

    expect(clone.baseURI).toBe("https://example.test/articles/");
  });
});

describe("HTMLElement inline style", () => {
  it("reflects a CSS declaration block and preserves priority", () => {
    const element = select(
      parse(
        '<main style="unknown: value; display: none; visibility: hidden !important; display: block"></main>',
      ),
      "main",
    ) as HTMLElement;

    expect(element.style).toBe(element.style);
    expect(element.style.display).toBe("block");
    expect(element.style.visibility).toBe("hidden");
    expect(element.style.getPropertyPriority("visibility")).toBe("important");
    expect(element.style.length).toBe(2);
    expect(element.style.item(0)).toBe("visibility");
    expect(element.style[1]).toBe("display");

    expect(element.style.removeProperty("visibility")).toBe("hidden");
    expect(element.getAttribute("style")).toBe("display: block;");
  });

  it("keeps the declaration object synchronized with the style attribute", () => {
    const element = select(parse("<main></main>"), "main") as HTMLElement;
    const style = element.style;

    element.setAttribute("style", "display: none; --theme: dark;");
    expect(style.display).toBe("none");
    expect(style.getPropertyValue("--theme")).toBe("dark");

    style.setProperty("visibility", "hidden", "IMPORTANT");
    style.setProperty("display", "invalid-value");
    expect(style.display).toBe("none");
    expect(style.getPropertyPriority("visibility")).toBe("important");

    style.cssText = "float: left; display: grid;";
    expect(style.cssFloat).toBe("left");
    expect(style.float).toBe("left");
    expect(style.display).toBe("grid");
    expect(element.getAttribute("style")).toBe("float: left; display: grid;");

    element.style = "display: flex;";
    expect(style.display).toBe("flex");

    style.cssText = "";
    expect(element.getAttribute("style")).toBe("");
  });
});

describe("HTML fragment insertion", () => {
  it("sets innerHTML using the element and its ancestors as context", () => {
    const document = parse(
      "<!doctype html><form><div id=target><span></span></div></form>",
    );
    const target = select(document, "#target");

    target.innerHTML = "<form id=nested></form><input id=control>";

    expect(target.querySelector("#nested")).toBeNull();
    expect(target.querySelector("#control")?.parentElement).toBe(target);
    expect(target.firstChild?.ownerDocument).toBe(document);

    const tableDocument = parse("<table id=table></table>");
    const table = select(tableDocument, "#table");
    table.innerHTML = "<tr id=row><td>cell</td></tr>";

    expect(table.firstElementChild?.localName).toBe("tbody");
    expect(table.querySelector("#row")?.parentElement?.localName).toBe("tbody");
    expect(table.textContent).toBe("cell");
  });

  it("sets innerHTML on template contents without executing scripts", () => {
    const document = parse("<template id=target><p>old</p></template>");
    const target = select(document, "#target");
    expect(target).toBeInstanceOf(HTMLTemplateElement);
    if (!(target instanceof HTMLTemplateElement)) {
      throw new Error("missing template element");
    }

    target.innerHTML =
      '<script id="script">globalThis.executed = true</script><button onclick="run()">button</button>';

    expect(target.childNodes).toHaveLength(0);
    expect(target.content.querySelector("#script")?.textContent).toBe(
      "globalThis.executed = true",
    );
    expect(
      target.content.querySelector("button")?.getAttribute("onclick"),
    ).toBe("run()");
  });

  it("parses innerHTML with scripting enabled without executing scripts", () => {
    const document = parse("<main id=target></main>");
    const target = select(document, "#target");

    target.innerHTML =
      '<noscript><p id="fallback">fallback</p></noscript><script>globalThis.palimConformanceExecuted = true</script>';

    expect(target.querySelector("#fallback")).toBeNull();
    expect(target.querySelector("noscript")?.textContent).toBe(
      '<p id="fallback">fallback</p>',
    );
    expect(target.querySelector("script")?.textContent).toBe(
      "globalThis.palimConformanceExecuted = true",
    );
    expect("palimConformanceExecuted" in globalThis).toBe(false);
  });

  it("sets outerHTML using the parent element as context", () => {
    const document = parse(
      "<table><tbody><tr id=old><td>old</td></tr></tbody></table>",
    );
    const oldRow = select(document, "#old");

    oldRow.outerHTML = '<tr id="new"><td>new</td></tr>';

    expect(oldRow.parentNode).toBeNull();
    const newRow = select(document, "#new");
    expect(newRow.parentElement?.localName).toBe("tbody");
    expect(newRow.textContent).toBe("new");
  });

  it("inserts HTML at each adjacent position", () => {
    const document = parse("<main><section id=target><i></i></section></main>");
    const target = select(document, "#target");

    target.insertAdjacentHTML("beforebegin", '<p id="before"></p>');
    target.insertAdjacentHTML("afterbegin", '<b id="first"></b>');
    target.insertAdjacentHTML("beforeend", '<b id="last"></b>');
    target.insertAdjacentHTML("afterend", '<p id="after"></p>');

    expect(
      [...select(document, "main").children].map((element) =>
        element.getAttribute("id"),
      ),
    ).toEqual(["before", "target", "after"]);
    expect([...target.children].map(({ localName }) => localName)).toEqual([
      "b",
      "i",
      "b",
    ]);
    expect(target.firstElementChild?.getAttribute("id")).toBe("first");
    expect(target.lastElementChild?.getAttribute("id")).toBe("last");
  });

  it("rejects invalid adjacent insertion", () => {
    const document = parse("<main><section></section></main>");
    const section = select(document, "section");

    expectDOMException(() => {
      section.insertAdjacentHTML("invalid", "<p></p>");
    }, "SyntaxError");

    section.remove();
    expectDOMException(() => {
      section.insertAdjacentHTML("beforebegin", "<p></p>");
    }, "NoModificationAllowedError");

    const html = document.documentElement;
    if (html === null) {
      throw new Error("missing document element");
    }
    expectDOMException(() => {
      html.outerHTML = "<html></html>";
    }, "NoModificationAllowedError");
  });
});
