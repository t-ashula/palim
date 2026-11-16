import { describe, expect, it } from "vitest";

import { expectDOMException } from "../../helper/assertions.js";
import {
  parseHTML as parse,
  requireElement as select,
} from "../../helper/dom.js";
import {
  Attr,
  CDATASection,
  Comment,
  Document,
  DocumentFragment,
  DocumentType,
  DOMParser,
  Element,
  HTMLTemplateElement,
  Node,
  ProcessingInstruction,
  Text,
} from "../../public-test-api.js";

const XML_NAMESPACE = "http://www.w3.org/XML/1998/namespace";
const XMLNS_NAMESPACE = "http://www.w3.org/2000/xmlns/";
const XLINK_NAMESPACE = "http://www.w3.org/1999/xlink";

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

  it("reuses the template contents owner document for nested templates", () => {
    const sourceDocument = parse(
      "<template><template><span></span></template></template>",
    );
    const targetDocument = parse("");
    const outer = sourceDocument.querySelector("template");
    if (!(outer instanceof HTMLTemplateElement)) {
      throw new Error("missing outer template element");
    }
    const inner = outer.content.querySelector("template");
    if (!(inner instanceof HTMLTemplateElement)) {
      throw new Error("missing template element");
    }

    targetDocument.adoptNode(outer);

    expect(outer.ownerDocument).toBe(targetDocument);
    expect(outer.content.ownerDocument).not.toBe(targetDocument);
    expect(inner.ownerDocument).toBe(outer.content.ownerDocument);
    expect(inner.content.ownerDocument).toBe(outer.content.ownerDocument);
    expect(inner.content.firstChild?.ownerDocument).toBe(
      outer.content.ownerDocument,
    );
  });

  it("derives HTML element names from the current node document", () => {
    const sourceDocument = parse("");
    const targetDocument = new DOMParser().parseFromString(
      "<root />",
      "application/xml",
    );
    const element = sourceDocument.createElement("t");

    expect(element.tagName).toBe("T");
    expect(element.nodeName).toBe("T");

    targetDocument.adoptNode(element);

    expect(element.tagName).toBe("t");
    expect(element.nodeName).toBe("t");

    sourceDocument.adoptNode(element);

    expect(element.tagName).toBe("T");
    expect(element.nodeName).toBe("T");
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

    const host = document.createElement("div");
    const shadowRoot = host.attachShadow({ mode: "closed" });
    const target = parse("");
    expectDOMException(
      () => target.adoptNode(shadowRoot),
      "HierarchyRequestError",
    );
    expect(shadowRoot.ownerDocument).toBe(document);
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

  it("keeps qualified-name collection matching rules after adoption", () => {
    const sourceDocument = parse("");
    const targetDocument = new DOMParser().parseFromString(
      "<root />",
      "application/xml",
    );
    const root = sourceDocument.createElement("main");
    const child = sourceDocument.createElement("x");
    root.appendChild(child);
    const htmlCollection = root.getElementsByTagName("X");

    targetDocument.documentElement?.appendChild(root);

    expect(htmlCollection.item(0)).toBe(child);
    expect(root.getElementsByTagName("X").length).toBe(0);
    expect(root.getElementsByTagName("x").item(0)).toBe(child);
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

  it("exposes the DOMTokenList stringifier and iterable surface", () => {
    const list = select(
      parse('<main class="  alpha alpha beta "></main>'),
      "main",
    ).classList;
    const callbacks: [string, number, object][] = [];
    const descriptorValue = (
      object: object,
      property: PropertyKey,
    ): unknown => {
      const descriptor = Object.getOwnPropertyDescriptor(object, property);
      if (descriptor === undefined) {
        throw new Error(`missing property descriptor: ${String(property)}`);
      }
      return descriptor.value as unknown;
    };
    const listPrototype = Object.getPrototypeOf(list) as object;

    expect(String(list)).toBe("  alpha alpha beta ");
    expect(Object.prototype.toString.call(list)).toBe("[object DOMTokenList]");
    expect(descriptorValue(listPrototype, Symbol.iterator)).toBe(
      descriptorValue(Array.prototype, Symbol.iterator),
    );
    expect(descriptorValue(listPrototype, "keys")).toBe(
      descriptorValue(Array.prototype, "keys"),
    );
    expect(descriptorValue(listPrototype, "values")).toBe(
      descriptorValue(Array.prototype, "values"),
    );
    expect(descriptorValue(listPrototype, "entries")).toBe(
      descriptorValue(Array.prototype, "entries"),
    );
    expect(descriptorValue(listPrototype, "forEach")).toBe(
      descriptorValue(Array.prototype, "forEach"),
    );
    list.forEach((value, key, parent) => {
      callbacks.push([value, key, parent]);
    });
    expect(callbacks).toEqual([
      ["alpha", 0, list],
      ["beta", 1, list],
    ]);

    list.value = " gamma delta gamma ";
    expect(list.value).toBe(" gamma delta gamma ");
    expect([...list]).toEqual(["gamma", "delta"]);
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

  it("ignores empty and namespaced ID attributes", () => {
    const document = parse("");
    const empty = document.createElement("div");
    const namespaced = document.createElement("div");
    empty.id = "";
    namespaced.id = "plain";
    namespaced.setAttributeNS("urn:example", "id", "namespaced");
    document.body?.append(empty, namespaced);

    expect(document.getElementById("")).toBeNull();
    expect(document.getElementById("plain")).toBe(namespaced);
    expect(document.getElementById("namespaced")).toBeNull();

    namespaced.removeAttribute("id");
    expect(document.getElementById("plain")).toBeNull();
    expect(document.getElementById("namespaced")).toBeNull();

    const fragment = document.createDocumentFragment();
    fragment.appendChild(empty);
    expect(fragment.getElementById("")).toBeNull();
  });

  it("keeps XML class lookup namespace-aware and live", () => {
    const document = new DOMParser().parseFromString(
      '<root><item class="a b"/><p:item xmlns:p="urn:element" class="a"/><item xmlns:p="urn:attribute" p:class="a"/></root>',
      "application/xml",
    );
    const root = document.documentElement;
    if (root === null) {
      throw new Error("missing XML class fixture root");
    }
    const first = root.children.item(0);
    const second = root.children.item(1);
    const third = root.children.item(2);
    if (first === null || second === null || third === null) {
      throw new Error("missing XML class fixture");
    }
    const collection = document.getElementsByClassName("a");

    expect(Array.from(collection)).toEqual([first, second]);
    third.setAttribute("class", "a");
    expect(Array.from(collection)).toEqual([first, second, third]);
    first.removeAttribute("class");
    expect(Array.from(collection)).toEqual([second, third]);
    root.removeChild(second);
    expect(Array.from(collection)).toEqual([third]);
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
  it("reports attributes and inserts adjacent nodes", () => {
    const document = parse('<main><section id="target"></section></main>');
    const main = select(document, "main");
    const target = select(document, "#target");
    const before = document.createElement("before");
    const inside = document.createElement("inside");

    expect(main.hasAttributes()).toBe(false);
    expect(target.hasAttributes()).toBe(true);
    expect(target.insertAdjacentElement("BEFOREBEGIN", before)).toBe(before);
    target.insertAdjacentText("afterbegin", "start");
    expect(target.insertAdjacentElement("beforeend", inside)).toBe(inside);
    target.insertAdjacentText("afterend", "end");
    expect(Array.from(main.childNodes)).toEqual([
      before,
      target,
      target.nextSibling,
    ]);
    expect(target.firstChild?.textContent).toBe("start");
    expect(target.lastChild).toBe(inside);

    const detached = document.createElement("detached");
    expect(detached.insertAdjacentElement("beforebegin", inside)).toBeNull();
    expect(inside.parentNode).toBe(target);
    expectDOMException(() => {
      target.insertAdjacentText("invalid", "text");
    }, "SyntaxError");
  });

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
    expect(attribute.specified).toBe(true);
    const astral = document.createAttributeNS("urn:test", "emoji🆖:attr");
    expect(astral.prefix).toBe("emoji🆖");
    expect(astral.localName).toBe("attr");
    expect(astral.namespaceURI).toBe("urn:test");
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

  it("exposes collection indexes and names as read-only own properties", () => {
    const document = parse(
      '<main id="first" name="first-name"></main><main id="second"></main>',
    );
    const nodes = document.querySelectorAll("main");
    const elements = document.getElementsByTagName("main");
    const attributes = nodes[0]?.attributes;
    if (attributes === undefined) {
      throw new Error("missing attributes");
    }

    expect(Object.getOwnPropertyNames(nodes)).toEqual(["0", "1"]);
    expect(Object.getOwnPropertyNames(elements)).toEqual([
      "0",
      "1",
      "first",
      "first-name",
      "second",
    ]);
    expect(Object.getOwnPropertyNames(attributes)).toEqual([
      "0",
      "1",
      "id",
      "name",
    ]);
    expect(Object.getOwnPropertyDescriptor(elements, "0")).toMatchObject({
      configurable: true,
      enumerable: true,
      writable: false,
    });
    expect(Object.getOwnPropertyDescriptor(elements, "first")).toMatchObject({
      configurable: true,
      enumerable: false,
      writable: false,
    });
    expect(Object.getOwnPropertyDescriptor(attributes, "id")).toMatchObject({
      configurable: true,
      enumerable: true,
      writable: false,
    });

    const indexed = elements as unknown as Record<string, unknown>;
    expect(() => {
      indexed["0"] = null;
    }).toThrow(TypeError);
    expect(() => {
      indexed["5"] = null;
    }).toThrow(TypeError);
    expect(() => {
      delete indexed["0"];
    }).toThrow(TypeError);
    expect(() => {
      Object.defineProperty(elements, "first", { value: null });
    }).toThrow(TypeError);

    indexed.expando = "value";
    expect(indexed.expando).toBe("value");
    expect(Object.getOwnPropertyNames(elements)).toContain("expando");
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
