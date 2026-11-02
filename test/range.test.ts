import { describe, expect, it } from "vitest";

import { DOMException, DOMParser, Document, Text } from "../src/index.js";
import type { Node, Range, Element } from "../src/index.js";

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

function expectDOMException(operation: () => unknown, name: string): void {
  try {
    operation();
  } catch (error: unknown) {
    expect(error).toBeInstanceOf(DOMException);
    expect((error as DOMException).name).toBe(name);
    return;
  }
  throw new Error(`expected ${name}`);
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
});

describe("Range contents", () => {
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
});

describe("live Range mutation", () => {
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
