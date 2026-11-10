import { DOMException } from "../dom-exception.js";
import { bindDOMInterface } from "./binding.js";
import { Node } from "./nodes.js";
import type { Document, Element } from "./nodes.js";

export const NodeFilter = Object.freeze({
  FILTER_ACCEPT: 1,
  FILTER_REJECT: 2,
  FILTER_SKIP: 3,
  SHOW_ALL: 0xffffffff,
  SHOW_ELEMENT: 0x1,
  SHOW_ATTRIBUTE: 0x2,
  SHOW_TEXT: 0x4,
  SHOW_CDATA_SECTION: 0x8,
  SHOW_ENTITY_REFERENCE: 0x10,
  SHOW_ENTITY: 0x20,
  SHOW_PROCESSING_INSTRUCTION: 0x40,
  SHOW_COMMENT: 0x80,
  SHOW_DOCUMENT: 0x100,
  SHOW_DOCUMENT_TYPE: 0x200,
  SHOW_DOCUMENT_FRAGMENT: 0x400,
  SHOW_NOTATION: 0x800,
} as const);

export type NodeFilter =
  ((node: Node) => number) | { acceptNode(node: Node): number };

export type TraversalResult<T> =
  | { readonly type: "normal"; readonly value: T }
  | { readonly type: "abrupt"; readonly token: object };

export type TraversalFilterCallback = (node: Node) => TraversalResult<number>;

export function traversalNormal<T>(value: T): TraversalResult<T> {
  return { type: "normal", value };
}

export function traversalAbrupt(token: object): TraversalResult<never> {
  return { type: "abrupt", token };
}

function traversalValue<T>(result: TraversalResult<T>): T {
  if (result.type === "abrupt") {
    throw new TypeError("Unexpected internal traversal interruption");
  }
  return result.value;
}

export interface NodeIterator {
  readonly root: Node;
  readonly referenceNode: Node;
  readonly pointerBeforeReferenceNode: boolean;
  readonly whatToShow: number;
  readonly filter: NodeFilter | null;
  nextNode(): Node | null;
  previousNode(): Node | null;
  detach(): void;
}

export interface TreeWalker {
  readonly root: Node;
  readonly whatToShow: number;
  readonly filter: NodeFilter | null;
  currentNode: Node;
  parentNode(): Node | null;
  firstChild(): Node | null;
  lastChild(): Node | null;
  previousSibling(): Node | null;
  nextSibling(): Node | null;
  previousNode(): Node | null;
  nextNode(): Node | null;
}

interface NodePointer {
  readonly node: Node;
  readonly before: boolean;
}

const descendantElementCache = new WeakMap<Node, Element[]>();

class TraversalFilter {
  readonly root: Node;
  readonly whatToShow: number;
  readonly filter: NodeFilter | null;
  readonly #callback: TraversalFilterCallback | null;
  #active = false;

  constructor(
    root: Node,
    whatToShow: unknown,
    filter: unknown,
    callback: TraversalFilterCallback | null,
  ) {
    this.root = root;
    this.whatToShow = toUnsignedLong(whatToShow);
    this.filter = toNodeFilter(filter);
    this.#callback = callback;
  }

  evaluate(node: Node): TraversalResult<number> {
    if (this.#active) {
      throw new DOMException(
        "The traversal filter is already active",
        "InvalidStateError",
      );
    }
    const mask = 2 ** (node.nodeType - 1);
    if ((this.whatToShow & mask) === 0) {
      return traversalNormal(NodeFilter.FILTER_SKIP);
    }
    if (this.filter === null && this.#callback === null) {
      return traversalNormal(NodeFilter.FILTER_ACCEPT);
    }

    this.#active = true;
    try {
      const result =
        this.#callback !== null
          ? this.#callback(node)
          : traversalNormal(
              this.filter === null
                ? NodeFilter.FILTER_ACCEPT
                : typeof this.filter === "function"
                  ? this.filter(node)
                  : this.filter.acceptNode(node),
            );
      return result.type === "abrupt"
        ? result
        : traversalNormal(toUnsignedShort(result.value));
    } finally {
      this.#active = false;
    }
  }
}

class NodeIteratorImplementation implements NodeIterator {
  readonly #traversal: TraversalFilter;
  #reference: NodePointer;
  #candidate: NodePointer | null = null;

  constructor(
    root: Node,
    whatToShow: unknown,
    filter: unknown,
    callback: TraversalFilterCallback | null,
  ) {
    bindDOMInterface(this, this);
    this.#traversal = new TraversalFilter(root, whatToShow, filter, callback);
    this.#reference = { node: root, before: true };
    registerNodeIterator(this);
  }

  get root(): Node {
    return this.#traversal.root;
  }

  get referenceNode(): Node {
    return this.#reference.node;
  }

  get pointerBeforeReferenceNode(): boolean {
    return this.#reference.before;
  }

  get whatToShow(): number {
    return this.#traversal.whatToShow;
  }

  get filter(): NodeFilter | null {
    return this.#traversal.filter;
  }

  nextNode(): Node | null {
    return traversalValue(this.traverse("next"));
  }

  previousNode(): Node | null {
    return traversalValue(this.traverse("previous"));
  }

  detach(): void {
    return;
  }

  preRemove(node: Node): void {
    this.#reference = adjustNodePointer(this.#reference, this, node);
    if (this.#candidate !== null) {
      this.#candidate = adjustNodePointer(this.#candidate, this, node);
    }
  }

  traverse(direction: "next" | "previous"): TraversalResult<Node | null> {
    let node = this.#reference.node;
    let before = this.#reference.before;

    for (;;) {
      if (direction === "next") {
        if (before) {
          before = false;
        } else {
          const next = followingNode(node, this.root);
          if (next === null) {
            return traversalNormal(null);
          }
          node = next;
        }
      } else if (before) {
        const previous = precedingNode(node, this.root);
        if (previous === null) {
          return traversalNormal(null);
        }
        node = previous;
      } else {
        before = true;
      }

      this.#candidate = { node, before };
      const filteredNode = node;
      let result: TraversalResult<number>;
      try {
        result = this.#traversal.evaluate(filteredNode);
      } catch (error: unknown) {
        this.#candidate = null;
        throw error;
      }
      if (result.type === "abrupt") {
        this.#candidate = null;
        return result;
      }
      node = this.#candidate.node;
      before = this.#candidate.before;
      if (result.value === NodeFilter.FILTER_ACCEPT) {
        this.#reference = this.#candidate;
        this.#candidate = null;
        return traversalNormal(filteredNode);
      }
      this.#candidate = null;
    }
  }
}

class TreeWalkerImplementation implements TreeWalker {
  readonly #traversal: TraversalFilter;
  #current: Node;

  constructor(
    root: Node,
    whatToShow: unknown,
    filter: unknown,
    callback: TraversalFilterCallback | null,
  ) {
    bindDOMInterface(this, this);
    this.#traversal = new TraversalFilter(root, whatToShow, filter, callback);
    this.#current = root;
  }

  get root(): Node {
    return this.#traversal.root;
  }

  get whatToShow(): number {
    return this.#traversal.whatToShow;
  }

  get filter(): NodeFilter | null {
    return this.#traversal.filter;
  }

  get currentNode(): Node {
    return this.#current;
  }

  set currentNode(node: Node) {
    if (!(node instanceof Node)) {
      throw new TypeError("currentNode must be a Node");
    }
    this.#current = node;
  }

  parentNode(): Node | null {
    return traversalValue(this.traverseParent());
  }

  firstChild(): Node | null {
    return traversalValue(this.traverseChildren("first"));
  }

  lastChild(): Node | null {
    return traversalValue(this.traverseChildren("last"));
  }

  previousSibling(): Node | null {
    return traversalValue(this.traverseSiblings("previous"));
  }

  nextSibling(): Node | null {
    return traversalValue(this.traverseSiblings("next"));
  }

  previousNode(): Node | null {
    return traversalValue(this.traversePrevious());
  }

  nextNode(): Node | null {
    return traversalValue(this.traverseNext());
  }

  traverseParent(): TraversalResult<Node | null> {
    let node = this.#current;
    while (node !== this.root) {
      const parent = node.parentNode;
      if (parent === null) {
        return traversalNormal(null);
      }
      node = parent;
      const result = this.#traversal.evaluate(node);
      if (result.type === "abrupt") {
        return result;
      }
      if (result.value === NodeFilter.FILTER_ACCEPT) {
        this.#current = node;
        return traversalNormal(node);
      }
    }
    return traversalNormal(null);
  }

  traverseChildren(direction: "first" | "last"): TraversalResult<Node | null> {
    return this.#traverseChildren(direction);
  }

  traverseSiblings(
    direction: "next" | "previous",
  ): TraversalResult<Node | null> {
    return this.#traverseSiblings(direction);
  }

  traversePrevious(): TraversalResult<Node | null> {
    let node = this.#current;
    while (node !== this.root) {
      let sibling = node.previousSibling;
      while (sibling !== null) {
        node = sibling;
        let result = this.#traversal.evaluate(node);
        if (result.type === "abrupt") {
          return result;
        }
        while (
          result.value !== NodeFilter.FILTER_REJECT &&
          node.lastChild !== null
        ) {
          node = node.lastChild;
          result = this.#traversal.evaluate(node);
          if (result.type === "abrupt") {
            return result;
          }
        }
        if (result.value === NodeFilter.FILTER_ACCEPT) {
          this.#current = node;
          return traversalNormal(node);
        }
        sibling = node.previousSibling;
      }
      const parent = node.parentNode;
      if (parent === null) {
        return traversalNormal(null);
      }
      node = parent;
      const result = this.#traversal.evaluate(node);
      if (result.type === "abrupt") {
        return result;
      }
      if (result.value === NodeFilter.FILTER_ACCEPT) {
        this.#current = node;
        return traversalNormal(node);
      }
    }
    return traversalNormal(null);
  }

  traverseNext(): TraversalResult<Node | null> {
    let node = this.#current;
    let result: number = NodeFilter.FILTER_ACCEPT;
    for (;;) {
      while (result !== NodeFilter.FILTER_REJECT && node.firstChild !== null) {
        node = node.firstChild;
        const evaluation = this.#traversal.evaluate(node);
        if (evaluation.type === "abrupt") {
          return evaluation;
        }
        result = evaluation.value;
        if (result === NodeFilter.FILTER_ACCEPT) {
          this.#current = node;
          return traversalNormal(node);
        }
      }

      let sibling: Node | null = null;
      while (sibling === null) {
        if (node === this.root) {
          return traversalNormal(null);
        }
        sibling = node.nextSibling;
        if (sibling === null) {
          const parent = node.parentNode;
          if (parent === null) {
            return traversalNormal(null);
          }
          node = parent;
        }
      }

      node = sibling;
      const evaluation = this.#traversal.evaluate(node);
      if (evaluation.type === "abrupt") {
        return evaluation;
      }
      result = evaluation.value;
      if (result === NodeFilter.FILTER_ACCEPT) {
        this.#current = node;
        return traversalNormal(node);
      }
    }
  }

  #traverseChildren(direction: "first" | "last"): TraversalResult<Node | null> {
    const current = this.#current;
    let node = direction === "first" ? current.firstChild : current.lastChild;
    while (node !== null) {
      const result = this.#traversal.evaluate(node);
      if (result.type === "abrupt") {
        return result;
      }
      if (result.value === NodeFilter.FILTER_ACCEPT) {
        this.#current = node;
        return traversalNormal(node);
      }
      if (result.value === NodeFilter.FILTER_SKIP) {
        const child = direction === "first" ? node.firstChild : node.lastChild;
        if (child !== null) {
          node = child;
          continue;
        }
      }
      for (;;) {
        const sibling =
          direction === "first" ? node.nextSibling : node.previousSibling;
        if (sibling !== null) {
          node = sibling;
          break;
        }
        const parent: Node | null = node.parentNode;
        if (parent === null || parent === this.root || parent === current) {
          return traversalNormal(null);
        }
        node = parent;
      }
    }
    return traversalNormal(null);
  }

  #traverseSiblings(
    direction: "next" | "previous",
  ): TraversalResult<Node | null> {
    let node = this.#current;
    if (node === this.root) {
      return traversalNormal(null);
    }
    for (;;) {
      let sibling =
        direction === "next" ? node.nextSibling : node.previousSibling;
      while (sibling !== null) {
        node = sibling;
        const result = this.#traversal.evaluate(node);
        if (result.type === "abrupt") {
          return result;
        }
        if (result.value === NodeFilter.FILTER_ACCEPT) {
          this.#current = node;
          return traversalNormal(node);
        }
        sibling =
          result.value === NodeFilter.FILTER_REJECT
            ? null
            : direction === "next"
              ? node.firstChild
              : node.lastChild;
        sibling ??=
          direction === "next" ? node.nextSibling : node.previousSibling;
      }

      const parent = node.parentNode;
      if (parent === null || parent === this.root) {
        return traversalNormal(null);
      }
      node = parent;
      const result = this.#traversal.evaluate(node);
      if (result.type === "abrupt") {
        return result;
      }
      if (result.value === NodeFilter.FILTER_ACCEPT) {
        return traversalNormal(null);
      }
    }
  }
}

const iteratorsByDocument = new WeakMap<
  Document,
  Set<WeakRef<NodeIteratorImplementation>>
>();

export function createNodeIterator(
  root: Node,
  whatToShow: unknown,
  filter: unknown,
  callback: TraversalFilterCallback | null = null,
): NodeIterator {
  return new NodeIteratorImplementation(root, whatToShow, filter, callback);
}

export function createTreeWalker(
  root: Node,
  whatToShow: unknown,
  filter: unknown,
  callback: TraversalFilterCallback | null = null,
): TreeWalker {
  return new TreeWalkerImplementation(root, whatToShow, filter, callback);
}

export function traverseNodeIterator(
  iterator: NodeIterator,
  direction: "next" | "previous",
): TraversalResult<Node | null> {
  if (!(iterator instanceof NodeIteratorImplementation)) {
    throw new TypeError("Invalid NodeIterator implementation");
  }
  return iterator.traverse(direction);
}

export function traverseTreeWalker(
  walker: TreeWalker,
  operation:
    | "parentNode"
    | "firstChild"
    | "lastChild"
    | "previousSibling"
    | "nextSibling"
    | "previousNode"
    | "nextNode",
): TraversalResult<Node | null> {
  if (!(walker instanceof TreeWalkerImplementation)) {
    throw new TypeError("Invalid TreeWalker implementation");
  }
  switch (operation) {
    case "parentNode":
      return walker.traverseParent();
    case "firstChild":
      return walker.traverseChildren("first");
    case "lastChild":
      return walker.traverseChildren("last");
    case "previousSibling":
      return walker.traverseSiblings("previous");
    case "nextSibling":
      return walker.traverseSiblings("next");
    case "previousNode":
      return walker.traversePrevious();
    case "nextNode":
      return walker.traverseNext();
  }
}

export function isNodeIterator(value: object): value is NodeIterator {
  return value instanceof NodeIteratorImplementation;
}

export function isTreeWalker(value: object): value is TreeWalker {
  return value instanceof TreeWalkerImplementation;
}

export function preRemoveNodeIterators(node: Node): void {
  const document = nodeDocument(node);
  if (document === null) {
    return;
  }
  const references = iteratorsByDocument.get(document);
  if (references === undefined) {
    return;
  }
  for (const reference of references) {
    const iterator = reference.deref();
    if (iterator === undefined) {
      references.delete(reference);
    } else {
      iterator.preRemove(node);
    }
  }
}

export function transferNodeIterators(node: Node, document: Document): void {
  const oldDocument = nodeDocument(node);
  if (oldDocument === null || oldDocument === document) {
    return;
  }
  const references = iteratorsByDocument.get(oldDocument);
  if (references === undefined) {
    return;
  }
  for (const reference of references) {
    const iterator = reference.deref();
    if (iterator === undefined) {
      references.delete(reference);
    } else if (isInclusiveAncestor(node, iterator.root)) {
      references.delete(reference);
      iteratorReferences(document).add(reference);
    }
  }
}

export function descendantElements(root: Node): Element[] {
  const cached = descendantElementCache.get(root);
  if (cached !== undefined) {
    return cached;
  }
  const result: Element[] = [];
  let node = followingNode(root, root);
  while (node !== null) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      result.push(node as Element);
    }
    node = followingNode(node, root);
  }
  descendantElementCache.set(root, result);
  return result;
}

export function invalidateDescendantElements(node: Node): void {
  descendantElementCache.delete(node);
}

function registerNodeIterator(iterator: NodeIteratorImplementation): void {
  const document = nodeDocument(iterator.root);
  if (document === null) {
    return;
  }
  const references = iteratorReferences(document);
  for (const reference of references) {
    if (reference.deref() === undefined) {
      references.delete(reference);
    }
  }
  references.add(new WeakRef(iterator));
}

function iteratorReferences(
  document: Document,
): Set<WeakRef<NodeIteratorImplementation>> {
  let references = iteratorsByDocument.get(document);
  if (references === undefined) {
    references = new Set();
    iteratorsByDocument.set(document, references);
  }
  return references;
}

function adjustNodePointer(
  pointer: NodePointer,
  iterator: NodeIteratorImplementation,
  removedNode: Node,
): NodePointer {
  if (
    !isInclusiveAncestor(removedNode, pointer.node) ||
    isInclusiveAncestor(removedNode, iterator.root)
  ) {
    return pointer;
  }
  if (pointer.before) {
    const next = followingNodeOutsideSubtree(removedNode, iterator.root);
    if (next !== null) {
      return { node: next, before: true };
    }
  }
  const previousSibling = removedNode.previousSibling;
  const node =
    previousSibling === null
      ? removedNode.parentNode
      : lastInclusiveDescendant(previousSibling);
  return node === null ? pointer : { node, before: false };
}

function followingNode(node: Node, root: Node): Node | null {
  if (node.firstChild !== null) {
    return node.firstChild;
  }
  let current = node;
  while (current !== root) {
    if (current.nextSibling !== null) {
      return current.nextSibling;
    }
    const parent = current.parentNode;
    if (parent === null) {
      return null;
    }
    current = parent;
  }
  return null;
}

function followingNodeOutsideSubtree(node: Node, root: Node): Node | null {
  let current = node;
  while (current !== root) {
    if (current.nextSibling !== null) {
      return current.nextSibling;
    }
    const parent = current.parentNode;
    if (parent === null) {
      return null;
    }
    current = parent;
  }
  return null;
}

function precedingNode(node: Node, root: Node): Node | null {
  if (node === root) {
    return null;
  }
  if (node.previousSibling !== null) {
    return lastInclusiveDescendant(node.previousSibling);
  }
  return node.parentNode;
}

function lastInclusiveDescendant(node: Node): Node {
  let result = node;
  while (result.lastChild !== null) {
    result = result.lastChild;
  }
  return result;
}

function isInclusiveAncestor(ancestor: Node, node: Node): boolean {
  let current: Node | null = node;
  while (current !== null) {
    if (current === ancestor) {
      return true;
    }
    current = current.parentNode;
  }
  return false;
}

function nodeDocument(node: Node): Document | null {
  return node.nodeType === Node.DOCUMENT_NODE
    ? (node as Document)
    : node.ownerDocument;
}

function toNodeFilter(value: unknown): NodeFilter | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === "function" || typeof value === "object") {
    return value as NodeFilter;
  }
  throw new TypeError("filter must be an object or function");
}

function toUnsignedLong(value: unknown): number {
  const number = Number(value);
  if (!Number.isFinite(number) || number === 0) {
    return 0;
  }
  const integer = Math.trunc(number);
  return ((integer % 0x1_0000_0000) + 0x1_0000_0000) % 0x1_0000_0000;
}

function toUnsignedShort(value: unknown): number {
  const number = Number(value);
  if (!Number.isFinite(number) || number === 0) {
    return 0;
  }
  const integer = Math.trunc(number);
  return ((integer % 0x1_0000) + 0x1_0000) % 0x1_0000;
}
