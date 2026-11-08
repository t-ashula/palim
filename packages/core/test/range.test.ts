import { describe, expect, it } from "vitest";

import { DOMParser, Document, Element, Text } from "./public-test-api.js";
import type { Node, Range } from "./public-test-api.js";
import { expectDOMException } from "./helper/assertions.js";

function parse(input: string): Document {
  return new DOMParser().parseFromString(input, "text/html");
}

function element(document: Document, selector: string): Element {
  const result = document.querySelector(selector);
  if (result === null) {
    throw new Error(`missing test element: ${selector}`);
  }
  return result;
}

function text(node: Node | null): Text {
  if (!(node instanceof Text)) {
    throw new Error("missing test text node");
  }
  return node;
}

describe("Range boundaries", () => {
  it("creates a collapsed range associated with its document", () => {
    const document = parse("<main></main>");
    const range: Range = document.createRange();

    expect(range.startContainer).toBe(document);
    expect(range.startOffset).toBe(0);
    expect(range.endContainer).toBe(document);
    expect(range.endOffset).toBe(0);
    expect(range.collapsed).toBe(true);
    expect(range.commonAncestorContainer).toBe(document);
    expect(range.START_TO_START).toBe(0);
    expect(range.START_TO_END).toBe(1);
    expect(range.END_TO_END).toBe(2);
    expect(range.END_TO_START).toBe(3);
  });

  it("sets boundary points and selects nodes and contents", () => {
    const document = parse("<main><p>text</p><aside></aside></main>");
    const main = element(document, "main");
    const paragraph = element(document, "p");
    const data = text(paragraph.firstChild);
    const range = document.createRange();

    range.setStart(data, 1);
    range.setEnd(data, 3);
    expect(range.toString()).toBe("ex");
    expect(range.commonAncestorContainer).toBe(data);

    range.setStartBefore(paragraph);
    range.setEndAfter(paragraph);
    expect(range.startContainer).toBe(main);
    expect(range.startOffset).toBe(0);
    expect(range.endOffset).toBe(1);

    range.selectNodeContents(paragraph);
    expect(range.startContainer).toBe(paragraph);
    expect(range.endOffset).toBe(1);
    range.selectNode(paragraph);
    expect(range.startContainer).toBe(main);
    expect(range.endOffset).toBe(1);

    range.collapse();
    expect(range.collapsed).toBe(true);
    expect(range.startOffset).toBe(1);
    range.selectNode(paragraph);
    range.collapse(true);
    expect(range.startOffset).toBe(0);
    expect(range.endOffset).toBe(0);
  });

  it("validates boundary nodes and offsets", () => {
    const document = parse("<!doctype html><root></root>");
    const doctype = document.doctype;
    if (doctype === null) {
      throw new Error("missing document type");
    }
    const root = element(document, "root");
    const range = document.createRange();

    expectDOMException(() => {
      range.setStart(doctype, 0);
    }, "InvalidNodeTypeError");
    expectDOMException(() => {
      range.setStart(root, 1);
    }, "IndexSizeError");
    expectDOMException(() => {
      range.setStartBefore(document);
    }, "InvalidNodeTypeError");
  });

  it("compares ranges and points", () => {
    const document = parse("<main><a></a><b></b><c></c></main>");
    const main = element(document, "main");
    const a = element(document, "a");
    const b = element(document, "b");
    const c = element(document, "c");
    const first = document.createRange();
    const second = document.createRange();
    first.selectNode(b);
    second.selectNode(c);

    expect(first.compareBoundaryPoints(first.START_TO_START, second)).toBe(-1);
    expect(first.comparePoint(main, 0)).toBe(-1);
    expect(first.comparePoint(main, 1)).toBe(0);
    expect(first.comparePoint(main, 3)).toBe(1);
    expect(first.isPointInRange(main, 2)).toBe(true);
    expect(first.intersectsNode(a)).toBe(false);
    expect(first.intersectsNode(b)).toBe(true);
    expect(first.intersectsNode(c)).toBe(false);

    const clone = first.cloneRange();
    expect(clone.startContainer).toBe(first.startContainer);
    expect(clone.startOffset).toBe(first.startOffset);
    expect(clone.endContainer).toBe(first.endContainer);
    expect(clone.endOffset).toBe(first.endOffset);
    clone.detach();
  });

  it("validates comparison modes, roots, and point offsets", () => {
    const document = parse("<main><a></a><b></b></main>");
    const main = element(document, "main");
    const range = document.createRange();
    range.selectNode(element(document, "b"));
    const foreignDocument = parse("<main></main>");
    const foreignRange = foreignDocument.createRange();

    expectDOMException(() => {
      range.compareBoundaryPoints(4, range);
    }, "NotSupportedError");
    expectDOMException(() => {
      range.compareBoundaryPoints(range.START_TO_START, foreignRange);
    }, "WrongDocumentError");
    expectDOMException(() => {
      range.comparePoint(foreignDocument, 0);
    }, "WrongDocumentError");
    expectDOMException(() => {
      range.comparePoint(main, 3);
    }, "IndexSizeError");
    expect(range.isPointInRange(foreignDocument, 0)).toBe(false);
  });
});

describe("Range contents", () => {
  it("parses contextual fragments from the start node", () => {
    const document = parse("<main>text</main>");
    const main = element(document, "main");
    const range = document.createRange();

    range.selectNodeContents(main);
    const contextual = range.createContextualFragment(
      '<p class="first">one</p><p>two</p>',
    );
    expect(contextual.childNodes.length).toBe(2);
    expect(contextual.querySelector(".first")?.textContent).toBe("one");
    expect(contextual.lastChild?.textContent).toBe("two");
    expect(contextual.firstChild?.ownerDocument).toBe(document);

    range.selectNodeContents(element(document, "html"));
    const bodyContext = range.createContextualFragment("<body><b>value</b>");
    expect(bodyContext.childNodes.length).toBe(1);
    expect(bodyContext.firstChild?.nodeName).toBe("B");

    const foreignHTML = document.createElementNS("urn:test", "html");
    range.selectNodeContents(foreignHTML);
    const foreignContext = range.createContextualFragment("<body><p>value");
    const div = document.createElement("div");
    range.selectNodeContents(div);
    const ordinaryContext = range.createContextualFragment("<body><p>value");
    expect(foreignContext.isEqualNode(ordinaryContext)).toBe(true);

    const defaultRange = document.createRange();
    expect(defaultRange.createContextualFragment("plain").textContent).toBe(
      "plain",
    );
    const createWithoutArgument = defaultRange.createContextualFragment.bind(
      defaultRange,
    ) as () => unknown;
    expect(createWithoutArgument).toThrow(TypeError);
  });

  it("strips XHTML document wrappers from contextual fragments", () => {
    const document = new DOMParser().parseFromString(
      '<html xmlns="http://www.w3.org/1999/xhtml"><body/></html>',
      "application/xhtml+xml",
    );
    const documentElement = document.documentElement;
    if (documentElement === null) {
      throw new Error("missing XHTML document element");
    }
    const range = document.createRange();
    range.setStart(documentElement, 0);

    const fragment = range.createContextualFragment(
      '<html xmlns="http://www.w3.org/1999/xhtml"><head><title>title</title></head><html><body><p>body</p></body></html></html>',
    );
    expect(fragment.childNodes.length).toBe(2);
    expect(fragment.firstChild?.nodeName).toBe("title");
    expect(fragment.lastChild?.nodeName).toBe("p");
    expect(fragment.textContent).toBe("titlebody");
    expect(fragment.querySelector("html")).toBeNull();
    expect(fragment.querySelector("head")).toBeNull();
    expect(fragment.querySelector("body")).toBeNull();

    const foreign = range.createContextualFragment(
      '<html xmlns="urn:not-html"><head><title>kept</title></head></html>',
    );
    const foreignRoot = foreign.firstChild;
    expect(foreignRoot).toBeInstanceOf(Element);
    expect((foreignRoot as Element).namespaceURI).toBe("urn:not-html");
    expect((foreignRoot as Element).firstElementChild?.localName).toBe("head");
  });

  it("clones contents without changing the source tree", () => {
    const document = parse("<main><p>one<b>two</b>three</p></main>");
    const paragraph = element(document, "p");
    const start = text(paragraph.firstChild);
    const end = text(paragraph.lastChild);
    const range = document.createRange();
    range.setStart(start, 1);
    range.setEnd(end, 2);

    const fragment = range.cloneContents();

    expect(fragment.textContent).toBe("netwoth");
    expect(fragment.querySelector("b")?.textContent).toBe("two");
    expect(paragraph.textContent).toBe("onetwothree");
    expect(range.toString()).toBe("netwoth");
  });

  it("clones recursively through partially contained elements", () => {
    const document = parse(
      "<main><p><b>one<em>x</em></b><i>two</i></p></main>",
    );
    const bold = element(document, "b");
    const italic = element(document, "i");
    const range = document.createRange();
    range.setStart(text(bold.firstChild), 1);
    range.setEnd(text(italic.firstChild), 1);

    const fragment = range.cloneContents();

    expect(fragment.childNodes.length).toBe(2);
    expect(fragment.querySelector("b")?.textContent).toBe("nex");
    expect(fragment.querySelector("em")?.textContent).toBe("x");
    expect(fragment.querySelector("i")?.textContent).toBe("t");
    expect(element(document, "p").textContent).toBe("onextwo");
  });

  it("extracts contents and collapses at the resulting boundary", () => {
    const document = parse("<main><p>one<b>two</b>three</p></main>");
    const paragraph = element(document, "p");
    const start = text(paragraph.firstChild);
    const end = text(paragraph.lastChild);
    const range = document.createRange();
    range.setStart(start, 1);
    range.setEnd(end, 2);

    const fragment = range.extractContents();

    expect(fragment.textContent).toBe("netwoth");
    expect(fragment.querySelector("b")?.textContent).toBe("two");
    expect(paragraph.textContent).toBe("oree");
    expect(range.collapsed).toBe(true);
    expect(range.startContainer).toBe(paragraph);
    expect(range.startOffset).toBe(1);
  });

  it("deletes character data and cross-node contents", () => {
    const document = parse("<main><p>abcd</p><p>efgh</p></main>");
    const paragraphs = document.querySelectorAll("p");
    const first = paragraphs.item(0);
    const second = paragraphs.item(1);
    if (first === null || second === null) {
      throw new Error("missing paragraphs");
    }
    const firstText = text(first.firstChild);
    const secondText = text(second.firstChild);
    const range = document.createRange();
    range.setStart(firstText, 1);
    range.setEnd(firstText, 3);
    range.deleteContents();
    expect(first.textContent).toBe("ad");

    range.setStart(firstText, 1);
    range.setEnd(secondText, 2);
    range.deleteContents();
    expect(element(document, "main").textContent).toBe("agh");
    expect(range.collapsed).toBe(true);
  });

  it("splits a text boundary when inserting a node", () => {
    const document = parse("<main><p>abcd</p></main>");
    const paragraph = element(document, "p");
    const data = text(paragraph.firstChild);
    const inserted = document.createElement("em");
    inserted.appendChild(document.createTextNode("x"));
    const range = document.createRange();
    range.setStart(data, 2);
    range.collapse(true);

    range.insertNode(inserted);

    expect(paragraph.childNodes.length).toBe(3);
    expect(paragraph.childNodes.item(0)?.textContent).toBe("ab");
    expect(paragraph.childNodes.item(1)).toBe(inserted);
    expect(paragraph.childNodes.item(2)?.textContent).toBe("cd");
    expect(range.startContainer).toBe(data);
    expect(range.startOffset).toBe(2);
    expect(range.endContainer).toBe(paragraph);
    expect(range.endOffset).toBe(2);
  });

  it("surrounds selected contents", () => {
    const document = parse("<main><p>one<b>two</b>three</p></main>");
    const bold = element(document, "b");
    const wrapper = document.createElement("strong");
    const range = document.createRange();
    range.selectNode(bold);

    range.surroundContents(wrapper);

    expect(wrapper.parentNode).toBe(element(document, "p"));
    expect(wrapper.firstChild).toBe(bold);
    expect(wrapper.textContent).toBe("two");
    expect(range.startContainer).toBe(wrapper.parentNode);
    expect(range.endOffset - range.startOffset).toBe(1);
  });

  it("rejects surrounding a partially contained non-Text node", () => {
    const document = parse("<main><p><b>one</b>two</p></main>");
    const bold = element(document, "b");
    const paragraph = element(document, "p");
    const range = document.createRange();
    range.setStart(text(bold.firstChild), 1);
    range.setEnd(text(paragraph.lastChild), 1);

    expectDOMException(() => {
      range.surroundContents(document.createElement("strong"));
    }, "InvalidStateError");
  });

  it("handles collapsed, CharacterData, and fragment boundaries", () => {
    const document = parse("<main><p>abcd</p></main>");
    const paragraph = element(document, "p");
    const data = text(paragraph.firstChild);
    const range = document.createRange();

    range.setStart(data, 1);
    range.setEnd(data, 3);
    expect(range.cloneContents().textContent).toBe("bc");
    const extracted = range.extractContents();
    expect(extracted.textContent).toBe("bc");
    expect(data.data).toBe("ad");
    expect(range.collapsed).toBe(true);
    expect(range.startContainer).toBe(data);
    expect(range.startOffset).toBe(1);

    const emptyClone = range.cloneContents();
    const emptyExtract = range.extractContents();
    range.deleteContents();
    expect(emptyClone.childNodes.length).toBe(0);
    expect(emptyExtract.childNodes.length).toBe(0);
    expect(data.data).toBe("ad");

    const fragment = document.createDocumentFragment();
    fragment.append(document.createElement("i"), document.createElement("b"));
    range.insertNode(fragment);
    expect(paragraph.childNodes.length).toBe(4);
    expect(paragraph.childNodes.item(1)?.nodeName).toBe("I");
    expect(paragraph.childNodes.item(2)?.nodeName).toBe("B");
    expect(range.endContainer).toBe(paragraph);
    expect(range.endOffset).toBe(3);

    const wrapper = document.createElement("strong");
    wrapper.appendChild(document.createElement("s"));
    const inserted = paragraph.childNodes.item(1);
    if (inserted === null) {
      throw new Error("missing inserted node");
    }
    range.selectNode(inserted);
    range.surroundContents(wrapper);
    expect(wrapper.childNodes.length).toBe(1);
    expect(wrapper.firstChild?.nodeName).toBe("I");
  });
});

describe("live Range mutation", () => {
  it("adjusts CharacterData boundaries for replacement", () => {
    const document = parse("<main>abcdef</main>");
    const data = text(element(document, "main").firstChild);
    const spanning = document.createRange();
    spanning.setStart(data, 1);
    spanning.setEnd(data, 5);
    const removed = document.createRange();
    removed.setStart(data, 3);
    removed.setEnd(data, 4);

    data.replaceData(2, 2, "XYZ");

    expect(data.data).toBe("abXYZef");
    expect(spanning.startOffset).toBe(1);
    expect(spanning.endOffset).toBe(6);
    expect(removed.startOffset).toBe(2);
    expect(removed.endOffset).toBe(2);
  });

  it("moves boundaries across attached and detached text splits", () => {
    const document = parse("<main>abcdef</main>");
    const main = element(document, "main");
    const data = text(main.firstChild);
    const content = document.createRange();
    content.setStart(data, 2);
    content.setEnd(data, 5);
    const parentPoint = document.createRange();
    parentPoint.setStart(main, 1);
    parentPoint.collapse(true);

    const split = data.splitText(3);

    expect(data.data).toBe("abc");
    expect(split.data).toBe("def");
    expect(content.startContainer).toBe(data);
    expect(content.startOffset).toBe(2);
    expect(content.endContainer).toBe(split);
    expect(content.endOffset).toBe(2);
    expect(parentPoint.startOffset).toBe(2);

    const detached = document.createTextNode("wxyz");
    const detachedRange = document.createRange();
    detachedRange.setStart(detached, 3);
    detachedRange.collapse(true);
    const detachedSplit = detached.splitText(2);
    expect(detachedRange.startContainer).toBe(detachedSplit);
    expect(detachedRange.startOffset).toBe(1);
  });

  it("adjusts parent offsets for insertion and removal", () => {
    const document = parse("<main><a></a><b></b><c></c></main>");
    const main = element(document, "main");
    const b = element(document, "b");
    const range = document.createRange();
    range.setStart(main, 2);
    range.setEnd(main, 3);

    main.insertBefore(document.createElement("x"), b);
    expect(range.startOffset).toBe(3);
    expect(range.endOffset).toBe(4);

    b.remove();
    expect(range.startOffset).toBe(2);
    expect(range.endOffset).toBe(3);
  });

  it("moves boundaries out of a removed subtree", () => {
    const document = parse("<main><section><span>text</span></section></main>");
    const main = element(document, "main");
    const section = element(document, "section");
    const data = text(element(document, "span").firstChild);
    const range = document.createRange();
    range.setStart(data, 1);
    range.setEnd(data, 3);

    section.remove();

    expect(range.startContainer).toBe(main);
    expect(range.startOffset).toBe(0);
    expect(range.endContainer).toBe(main);
    expect(range.endOffset).toBe(0);
  });

  it("updates boundaries when a child is replaced with itself", () => {
    const document = parse("<main><p>text</p><aside></aside></main>");
    const main = element(document, "main");
    const paragraph = element(document, "p");
    const descendant = document.createRange();
    descendant.selectNodeContents(paragraph);
    const parentPoint = document.createRange();
    parentPoint.setStart(main, 1);
    parentPoint.collapse(true);

    expect(main.replaceChild(paragraph, paragraph)).toBe(paragraph);

    expect(descendant.startContainer).toBe(main);
    expect(descendant.startOffset).toBe(0);
    expect(descendant.endContainer).toBe(main);
    expect(descendant.endOffset).toBe(0);
    expect(parentPoint.startOffset).toBe(0);
    expect(parentPoint.endOffset).toBe(0);
  });

  it("preserves text boundaries through normalization", () => {
    const document = parse("<main><p></p></main>");
    const paragraph = element(document, "p");
    const first = document.createTextNode("ab");
    const second = document.createTextNode("cd");
    paragraph.appendChild(first);
    paragraph.appendChild(second);
    const range = document.createRange();
    range.setStart(paragraph, 1);
    range.setEnd(second, 1);

    paragraph.normalize();

    expect(paragraph.childNodes.length).toBe(1);
    expect(first.data).toBe("abcd");
    expect(range.startContainer).toBe(first);
    expect(range.startOffset).toBe(2);
    expect(range.endContainer).toBe(first);
    expect(range.endOffset).toBe(3);
  });

  it("keeps tracking a detached tree after adoption", () => {
    const source = parse("<main><span>text</span></main>");
    const root = element(source, "main");
    root.remove();
    const data = text(root.firstChild?.firstChild ?? null);
    const range = source.createRange();
    range.setStart(data, 1);
    range.setEnd(data, 3);
    const target = new Document();

    target.adoptNode(root);
    target.appendChild(root);
    const child = root.firstChild;
    if (child !== null) {
      root.removeChild(child);
    }

    expect(range.startContainer).toBe(root);
    expect(range.startOffset).toBe(0);
    expect(range.endContainer).toBe(root);
    expect(range.endOffset).toBe(0);
  });
});
