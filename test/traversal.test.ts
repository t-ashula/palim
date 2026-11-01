import { describe, expect, it } from "vitest";

import { DOMException, DOMParser, Document, NodeFilter } from "../src/index.js";
import type {
  Element,
  Node,
  NodeFilter as NodeFilterCallback,
  NodeIterator,
} from "../src/index.js";

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

function elementNames(iterator: NodeIterator): string[] {
  const names: string[] = [];
  let node = iterator.nextNode();
  while (node !== null) {
    names.push(node.nodeName);
    node = iterator.nextNode();
  }
  return names;
}

describe("NodeIterator", () => {
  it("traverses accepted nodes in both directions", () => {
    const document = parse(
      "<main><section><span></span></section><p></p></main>",
    );
    const root = element(document, "main");
    const iterator = document.createNodeIterator(root, NodeFilter.SHOW_ELEMENT);

    expect(iterator.root).toBe(root);
    expect(iterator.whatToShow).toBe(NodeFilter.SHOW_ELEMENT);
    expect(iterator.filter).toBeNull();
    expect(iterator.referenceNode).toBe(root);
    expect(iterator.pointerBeforeReferenceNode).toBe(true);
    expect(elementNames(iterator)).toEqual(["MAIN", "SECTION", "SPAN", "P"]);
    expect(iterator.previousNode()?.nodeName).toBe("P");
    expect(iterator.pointerBeforeReferenceNode).toBe(true);
    iterator.detach();
  });

  it("applies whatToShow and a filter without pruning rejected subtrees", () => {
    const document = parse(
      "<main><section><span></span></section><p></p></main>",
    );
    const root = element(document, "main");
    const filter: NodeFilterCallback = {
      acceptNode(node: Node): number {
        return node.nodeName === "SECTION"
          ? NodeFilter.FILTER_REJECT
          : NodeFilter.FILTER_ACCEPT;
      },
    };
    const iterator = document.createNodeIterator(
      root,
      NodeFilter.SHOW_ELEMENT,
      filter,
    );

    expect(iterator.filter).toBe(filter);
    expect(elementNames(iterator)).toEqual(["MAIN", "SPAN", "P"]);
  });

  it("rejects recursive filter invocation", () => {
    const document = parse("<main><p></p></main>");
    const root = element(document, "main");
    const iterator: NodeIterator = document.createNodeIterator(
      root,
      NodeFilter.SHOW_ALL,
      () => {
        iterator.nextNode();
        return NodeFilter.FILTER_ACCEPT;
      },
    );

    try {
      iterator.nextNode();
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(DOMException);
      expect((error as DOMException).name).toBe("InvalidStateError");
      return;
    }
    throw new Error("expected InvalidStateError");
  });

  it("adjusts its reference before a traversed subtree is removed", () => {
    const document = parse("<main><a></a><b><i></i></b><c></c></main>");
    const root = element(document, "main");
    const removed = element(document, "b");
    const iterator = document.createNodeIterator(root, NodeFilter.SHOW_ELEMENT);

    expect(iterator.nextNode()?.nodeName).toBe("MAIN");
    expect(iterator.nextNode()?.nodeName).toBe("A");
    expect(iterator.nextNode()?.nodeName).toBe("B");
    expect(iterator.nextNode()?.nodeName).toBe("I");
    removed.remove();

    expect(iterator.referenceNode.nodeName).toBe("A");
    expect(iterator.nextNode()?.nodeName).toBe("C");
  });

  it("moves a before-reference past a removed subtree", () => {
    const document = parse("<main><a></a><b><i></i></b><c></c></main>");
    const root = element(document, "main");
    const removed = element(document, "b");
    const iterator = document.createNodeIterator(root, NodeFilter.SHOW_ELEMENT);

    expect(iterator.nextNode()?.nodeName).toBe("MAIN");
    expect(iterator.nextNode()?.nodeName).toBe("A");
    expect(iterator.nextNode()?.nodeName).toBe("B");
    expect(iterator.nextNode()?.nodeName).toBe("I");
    expect(iterator.previousNode()?.nodeName).toBe("I");
    removed.remove();

    expect(iterator.referenceNode.nodeName).toBe("C");
    expect(iterator.pointerBeforeReferenceNode).toBe(true);
    expect(iterator.nextNode()?.nodeName).toBe("C");
  });

  it("returns the filtered node when its candidate moves during filtering", () => {
    const document = parse("<main><a></a><b></b><c></c></main>");
    const root = element(document, "main");
    const removed = element(document, "b");
    const iterator = document.createNodeIterator(
      root,
      NodeFilter.SHOW_ELEMENT,
      (node) => {
        if (node === removed) {
          removed.remove();
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    );

    expect(iterator.nextNode()?.nodeName).toBe("MAIN");
    expect(iterator.nextNode()?.nodeName).toBe("A");
    expect(iterator.nextNode()).toBe(removed);
    expect(iterator.referenceNode.nodeName).toBe("A");
    expect(iterator.nextNode()?.nodeName).toBe("C");
  });

  it("keeps removal tracking after its root is adopted", () => {
    const source = parse("<main><span></span></main>");
    const root = element(source, "main");
    const child = element(source, "span");
    const iterator = source.createNodeIterator(root, NodeFilter.SHOW_ELEMENT);
    const target = new Document();

    target.adoptNode(root);
    target.appendChild(root);
    expect(iterator.nextNode()).toBe(root);
    expect(iterator.nextNode()).toBe(child);
    child.remove();

    expect(iterator.referenceNode).toBe(root);
    expect(iterator.previousNode()).toBe(root);
  });
});

describe("TreeWalker", () => {
  it("navigates parents, children, siblings, and tree order", () => {
    const document = parse(
      "<main><section><span></span></section><p></p></main>",
    );
    const root = element(document, "main");
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);

    expect(walker.root).toBe(root);
    expect(walker.currentNode).toBe(root);
    expect(walker.firstChild()?.nodeName).toBe("SECTION");
    expect(walker.firstChild()?.nodeName).toBe("SPAN");
    expect(walker.parentNode()?.nodeName).toBe("SECTION");
    expect(walker.nextSibling()?.nodeName).toBe("P");
    expect(walker.previousSibling()?.nodeName).toBe("SECTION");
    expect(walker.lastChild()?.nodeName).toBe("SPAN");
    expect(walker.previousNode()?.nodeName).toBe("SECTION");
    expect(walker.nextNode()?.nodeName).toBe("SPAN");

    walker.currentNode = element(document, "p");
    expect(walker.previousNode()?.nodeName).toBe("SPAN");
  });

  it("distinguishes rejected and skipped subtrees", () => {
    const document = parse(
      "<main><section><span></span></section><aside><em></em></aside><p></p></main>",
    );
    const root = element(document, "main");
    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_ELEMENT,
      (node) => {
        if (node.nodeName === "SECTION") {
          return NodeFilter.FILTER_REJECT;
        }
        if (node.nodeName === "ASIDE") {
          return NodeFilter.FILTER_SKIP;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    );

    expect(walker.nextNode()?.nodeName).toBe("EM");
    expect(walker.nextNode()?.nodeName).toBe("P");
    expect(walker.nextNode()).toBeNull();
  });

  it("validates roots, filters, and currentNode", () => {
    const document = parse("<main></main>");
    const root = element(document, "main");
    const createTreeWalker = document.createTreeWalker.bind(
      document,
    ) as unknown as (
      root?: unknown,
      whatToShow?: unknown,
      filter?: unknown,
    ) => unknown;

    expect(() => createTreeWalker()).toThrow(TypeError);
    expect(() => createTreeWalker(root, NodeFilter.SHOW_ALL, 1)).toThrow(
      TypeError,
    );

    const walker = document.createTreeWalker(root, -1);
    expect(walker.whatToShow).toBe(NodeFilter.SHOW_ALL);
    expect(() => {
      walker.currentNode = null as unknown as Node;
    }).toThrow(TypeError);
  });
});
