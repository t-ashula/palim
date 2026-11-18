import { DOMException } from "../dom-exception.js";
import { requireArguments } from "../web-idl.js";
import { bindDOMInterface } from "./binding.js";
import type { Document, Node } from "./nodes.js";
import type { Range } from "./range.js";
import {
  compareBoundaryPointPositions,
  createRange,
  createStaticRange,
  isRange,
  setRangeBoundaryPoints,
} from "./range-implementation.js";
import type { GetComposedRangesOptions, Selection } from "./selection.js";

type Direction = "directionless" | "forward" | "backward";

class SelectionImplementation implements Selection {
  #range: Range | null = null;
  #direction: Direction = "directionless";

  constructor(readonly document: Document) {
    bindDOMInterface(this, this);
  }

  get anchorNode(): Node | null {
    if (this.#range === null) {
      return null;
    }
    return this.#direction === "backward"
      ? this.#range.endContainer
      : this.#range.startContainer;
  }

  get anchorOffset(): number {
    if (this.#range === null) {
      return 0;
    }
    return this.#direction === "backward"
      ? this.#range.endOffset
      : this.#range.startOffset;
  }

  get focusNode(): Node | null {
    if (this.#range === null) {
      return null;
    }
    return this.#direction === "backward"
      ? this.#range.startContainer
      : this.#range.endContainer;
  }

  get focusOffset(): number {
    if (this.#range === null) {
      return 0;
    }
    return this.#direction === "backward"
      ? this.#range.startOffset
      : this.#range.endOffset;
  }

  get isCollapsed(): boolean {
    return this.#range === null || this.#range.collapsed;
  }

  get rangeCount(): number {
    return this.#range === null ? 0 : 1;
  }

  get type(): string {
    return this.#range === null
      ? "None"
      : this.#range.collapsed
        ? "Caret"
        : "Range";
  }

  get direction(): string {
    return this.#direction;
  }

  getRangeAt(index: number): Range {
    requireArguments(arguments.length, 1);
    if (toUnsignedLong(index) !== 0 || this.#range === null) {
      throw new DOMException(
        "Selection range index is invalid",
        "IndexSizeError",
      );
    }
    return this.#range;
  }

  addRange(range: Range): void {
    requireArguments(arguments.length, 1);
    if (!isRange(range)) {
      throw new TypeError("Selection requires a Range");
    }
    if (documentForNode(range.startContainer) !== this.document) {
      return;
    }
    if (this.#range === null) {
      this.#range = range;
      this.#direction = "directionless";
    }
  }

  removeRange(range: Range): void {
    requireArguments(arguments.length, 1);
    if (!isRange(range)) {
      throw new TypeError("Selection requires a Range");
    }
    if (this.#range !== range) {
      throw new DOMException("Range is not in the Selection", "NotFoundError");
    }
    this.removeAllRanges();
  }

  removeAllRanges(): void {
    this.#range = null;
    this.#direction = "directionless";
  }

  empty(): void {
    this.removeAllRanges();
  }

  getComposedRanges(_options: GetComposedRangesOptions = {}) {
    if (this.#range === null) {
      return [];
    }
    return [
      createStaticRange({
        startContainer: this.#range.startContainer,
        startOffset: this.#range.startOffset,
        endContainer: this.#range.endContainer,
        endOffset: this.#range.endOffset,
      }),
    ];
  }

  collapse(node: Node | null, offset = 0): void {
    requireArguments(arguments.length, 1);
    if (node === null) {
      this.removeAllRanges();
      return;
    }
    this.#requireDocument(node);
    const range = createRange(this.document);
    range.setStart(node, toUnsignedLong(offset));
    range.collapse(true);
    this.#range = range;
    this.#direction = "directionless";
  }

  setPosition(node: Node | null, offset = 0): void {
    this.collapse(node, offset);
  }

  collapseToStart(): void {
    if (this.#range === null) {
      this.#emptyError();
    }
    this.collapse(this.#range.startContainer, this.#range.startOffset);
  }

  collapseToEnd(): void {
    if (this.#range === null) {
      this.#emptyError();
    }
    this.collapse(this.#range.endContainer, this.#range.endOffset);
  }

  extend(node: Node, offset = 0): void {
    requireArguments(arguments.length, 1);
    if (this.#range === null) {
      this.#emptyError();
    }
    this.#requireDocument(node);
    const anchorNode = this.anchorNode;
    if (anchorNode === null) {
      this.#emptyError();
    }
    this.#setBaseAndExtent(
      anchorNode,
      this.anchorOffset,
      node,
      toUnsignedLong(offset),
    );
  }

  setBaseAndExtent(
    anchorNode: Node,
    anchorOffset: number,
    focusNode: Node,
    focusOffset: number,
  ): void {
    requireArguments(arguments.length, 4);
    this.#requireDocument(anchorNode);
    this.#requireDocument(focusNode);
    this.#setBaseAndExtent(
      anchorNode,
      toUnsignedLong(anchorOffset),
      focusNode,
      toUnsignedLong(focusOffset),
    );
  }

  selectAllChildren(node: Node): void {
    requireArguments(arguments.length, 1);
    this.#requireDocument(node);
    const range = createRange(this.document);
    range.selectNodeContents(node);
    this.#range = range;
    this.#direction = "forward";
  }

  modify(_alter = "", _direction = "", _granularity = ""): void {
    return;
  }

  deleteFromDocument(): void {
    this.#range?.deleteContents();
  }

  containsNode(node: Node, allowPartialContainment = false): boolean {
    requireArguments(arguments.length, 1);
    if (this.#range === null || documentForNode(node) !== this.document) {
      return false;
    }
    if (allowPartialContainment) {
      return this.#range.intersectsNode(node);
    }
    const candidate = createRange(this.document);
    candidate.selectNode(node);
    return (
      this.#range.compareBoundaryPoints(
        this.#range.START_TO_START,
        candidate,
      ) <= 0 &&
      this.#range.compareBoundaryPoints(this.#range.END_TO_END, candidate) >= 0
    );
  }

  toString(): string {
    return this.#range?.toString() ?? "";
  }

  #setBaseAndExtent(
    anchorNode: Node,
    anchorOffset: number,
    focusNode: Node,
    focusOffset: number,
  ): void {
    const order = compareBoundaryPointPositions(
      anchorNode,
      anchorOffset,
      focusNode,
      focusOffset,
    );
    const range = createRange(this.document);
    if (order <= 0) {
      setRangeBoundaryPoints(
        range,
        anchorNode,
        anchorOffset,
        focusNode,
        focusOffset,
      );
      this.#direction = "forward";
    } else {
      setRangeBoundaryPoints(
        range,
        focusNode,
        focusOffset,
        anchorNode,
        anchorOffset,
      );
      this.#direction = "backward";
    }
    this.#range = range;
  }

  #requireDocument(node: Node): void {
    if (documentForNode(node) !== this.document) {
      throw new DOMException(
        "Node belongs to another document",
        "WrongDocumentError",
      );
    }
  }

  #emptyError(): never {
    throw new DOMException("Selection has no range", "InvalidStateError");
  }
}

const SELECTIONS = new WeakMap<Document, SelectionImplementation>();

export function selectionForDocument(document: Document): Selection {
  let selection = SELECTIONS.get(document);
  if (selection === undefined) {
    selection = new SelectionImplementation(document);
    SELECTIONS.set(document, selection);
  }
  return selection;
}

export function isSelection(value: object): value is Selection {
  return value instanceof SelectionImplementation;
}

function documentForNode(node: Node): Document | null {
  return node.nodeType === 9 ? (node as Document) : node.ownerDocument;
}

function toUnsignedLong(value: unknown): number {
  const number = Number(value);
  if (!Number.isFinite(number) || number === 0) {
    return 0;
  }
  const integer = Math.trunc(number);
  return ((integer % 0x1_0000_0000) + 0x1_0000_0000) % 0x1_0000_0000;
}
