import { DOMException } from "../dom-exception.js";
import { HTML_NAMESPACE } from "../namespaces.js";
import { requireArguments } from "../web-idl.js";
import { bindDOMInterface } from "./binding.js";
import { domString } from "./conversions.js";
import type { Range, StaticRange, StaticRangeInit } from "./range.js";
import {
  Attr,
  CharacterData,
  Comment,
  Document,
  DocumentFragment,
  DocumentType,
  Element,
  Node,
  ProcessingInstruction,
  Text,
  appendNode,
  childNodes,
  cloneNodeIntoDocument,
  createDocumentFragment,
  createElementForDocument,
  fragmentParserForDocument,
  removeNode,
  replaceCharacterData,
  validatePreInsertion,
} from "./nodes.js";

const START_TO_START = 0;
const START_TO_END = 1;
const END_TO_END = 2;
const END_TO_START = 3;

interface BoundaryPoint {
  readonly node: Node;
  readonly offset: number;
}

class RangeImplementation implements Range {
  readonly START_TO_START = START_TO_START;
  readonly START_TO_END = START_TO_END;
  readonly END_TO_END = END_TO_END;
  readonly END_TO_START = END_TO_START;
  readonly #registration: WeakRef<RangeImplementation>;
  #document: Document;
  #start: BoundaryPoint;
  #end: BoundaryPoint;

  constructor(
    document: Document,
    start: BoundaryPoint = { node: document, offset: 0 },
    end: BoundaryPoint = start,
  ) {
    this.#document = document;
    this.#start = start;
    this.#end = end;
    this.#registration = new WeakRef(this);
    rangeReferences(document).add(this.#registration);
    bindDOMInterface(this, this);
  }

  get startContainer(): Node {
    return this.#start.node;
  }

  get startOffset(): number {
    return this.#start.offset;
  }

  get endContainer(): Node {
    return this.#end.node;
  }

  get endOffset(): number {
    return this.#end.offset;
  }

  get collapsed(): boolean {
    return sameBoundaryPoint(this.#start, this.#end);
  }

  get commonAncestorContainer(): Node {
    let container = this.#start.node;
    while (!isInclusiveAncestor(container, this.#end.node)) {
      const parent = container.parentNode;
      if (parent === null) {
        throw new TypeError("Range boundary points have no common ancestor");
      }
      container = parent;
    }
    return container;
  }

  setStart(node: Node, offset: number): void {
    requireArguments(arguments.length, 2);
    this.#setBoundary("start", requiredBoundaryPoint(node, offset));
  }

  setEnd(node: Node, offset: number): void {
    requireArguments(arguments.length, 2);
    this.#setBoundary("end", requiredBoundaryPoint(node, offset));
  }

  setStartBefore(node: Node): void {
    requireArguments(arguments.length, 1);
    this.#setBoundary("start", boundaryBefore(requiredNode(node)));
  }

  setStartAfter(node: Node): void {
    requireArguments(arguments.length, 1);
    this.#setBoundary("start", boundaryAfter(requiredNode(node)));
  }

  setEndBefore(node: Node): void {
    requireArguments(arguments.length, 1);
    this.#setBoundary("end", boundaryBefore(requiredNode(node)));
  }

  setEndAfter(node: Node): void {
    requireArguments(arguments.length, 1);
    this.#setBoundary("end", boundaryAfter(requiredNode(node)));
  }

  collapse(toStart = false): void {
    if (toStart) {
      this.#end = this.#start;
    } else {
      this.#start = this.#end;
    }
  }

  selectNode(node: Node): void {
    requireArguments(arguments.length, 1);
    const selected = requiredNode(node);
    const start = boundaryBefore(selected);
    const end = boundaryAfter(selected);
    this.#relocate(nodeDocument(start.node));
    this.#start = start;
    this.#end = end;
  }

  selectNodeContents(node: Node): void {
    requireArguments(arguments.length, 1);
    const selected = requiredNode(node);
    if (selected instanceof DocumentType) {
      throw new DOMException(
        "DocumentType cannot be a range boundary",
        "InvalidNodeTypeError",
      );
    }
    this.#relocate(nodeDocument(selected));
    this.#start = { node: selected, offset: 0 };
    this.#end = { node: selected, offset: nodeLength(selected) };
  }

  compareBoundaryPoints(how: number, sourceRange: Range): number {
    requireArguments(arguments.length, 2);
    const type = toUnsignedShort(how);
    const source = requireRange(sourceRange);
    if (
      ![START_TO_START, START_TO_END, END_TO_END, END_TO_START].includes(type)
    ) {
      throw new DOMException(
        "Unsupported boundary comparison type",
        "NotSupportedError",
      );
    }
    if (nodeRoot(this.#start.node) !== nodeRoot(source.#start.node)) {
      throw new DOMException(
        "Ranges belong to different trees",
        "WrongDocumentError",
      );
    }
    const thisPoint =
      type === START_TO_START || type === END_TO_START
        ? this.#start
        : this.#end;
    const sourcePoint =
      type === START_TO_START || type === START_TO_END
        ? source.#start
        : source.#end;
    return compareBoundaryPoints(thisPoint, sourcePoint);
  }

  deleteContents(): void {
    if (this.collapsed) {
      return;
    }
    const originalStart = this.#start;
    const originalEnd = this.#end;
    if (
      originalStart.node === originalEnd.node &&
      originalStart.node instanceof CharacterData
    ) {
      replaceCharacterData(
        originalStart.node,
        originalStart.offset,
        originalEnd.offset - originalStart.offset,
        "",
      );
      return;
    }

    const nodes = topLevelContainedNodes(this);
    const collapse = collapsePointAfterContents(originalStart, originalEnd);
    this.#start = collapse;
    this.#end = collapse;
    if (originalStart.node instanceof CharacterData) {
      replaceCharacterData(
        originalStart.node,
        originalStart.offset,
        originalStart.node.length - originalStart.offset,
        "",
      );
    }
    for (const node of nodes) {
      removeNode(node);
    }
    if (originalEnd.node instanceof CharacterData) {
      replaceCharacterData(originalEnd.node, 0, originalEnd.offset, "");
    }
  }

  extractContents(): DocumentFragment {
    return extractRange(this);
  }

  cloneContents(): DocumentFragment {
    return cloneRangeContents(this);
  }

  createContextualFragment(fragment: string): DocumentFragment {
    requireArguments(arguments.length, 1);
    const input = domString(fragment);
    const node = this.#start.node;
    const document = nodeDocument(node);
    let context =
      node instanceof Element
        ? node
        : node instanceof Text || node instanceof Comment
          ? node.parentElement
          : null;
    if (
      context === null ||
      (document.contentType === "text/html" &&
        context.namespaceURI === HTML_NAMESPACE &&
        context.localName === "html")
    ) {
      context = createElementForDocument(document, "body", HTML_NAMESPACE);
    }
    const parser = fragmentParserForDocument(document);
    if (parser === null) {
      throw new TypeError("Document has no fragment parser");
    }
    return document.adoptNode(parser.parse(input, context));
  }

  insertNode(node: Node): void {
    requireArguments(arguments.length, 1);
    const inserted = requiredNode(node);
    const startNode = this.#start.node;
    if (
      startNode instanceof ProcessingInstruction ||
      startNode instanceof Comment ||
      (startNode instanceof Text && startNode.parentNode === null) ||
      startNode === inserted
    ) {
      throw new DOMException(
        "The node cannot be inserted at the range start",
        "HierarchyRequestError",
      );
    }

    let reference =
      startNode instanceof Text
        ? startNode
        : (startNode.childNodes.item(this.#start.offset) ?? null);
    const parent = reference === null ? startNode : reference.parentNode;
    if (parent === null) {
      throw new DOMException(
        "The range start has no insertion parent",
        "HierarchyRequestError",
      );
    }
    validatePreInsertion(inserted, parent, reference);
    if (startNode instanceof Text) {
      reference = splitTextNode(startNode, this.#start.offset);
    }
    if (inserted === reference) {
      reference = reference.nextSibling;
    }
    if (inserted.parentNode !== null) {
      removeNode(inserted);
    }
    let newOffset =
      reference === null ? nodeLength(parent) : nodeIndex(reference);
    newOffset +=
      inserted instanceof DocumentFragment ? nodeLength(inserted) : 1;
    const wasCollapsed = this.collapsed;
    parent.insertBefore(inserted, reference);
    if (wasCollapsed) {
      this.#end = { node: parent, offset: newOffset };
    }
  }

  surroundContents(newParent: Node): void {
    requireArguments(arguments.length, 1);
    const parent = requiredNode(newParent);
    if (
      allNodes(nodeRoot(this.#start.node)).some(
        (node) => !(node instanceof Text) && isPartiallyContained(node, this),
      )
    ) {
      throw new DOMException(
        "A non-Text node is partially contained",
        "InvalidStateError",
      );
    }
    if (
      parent instanceof Document ||
      parent instanceof DocumentType ||
      parent instanceof DocumentFragment
    ) {
      throw new DOMException(
        "The new parent has an invalid node type",
        "InvalidNodeTypeError",
      );
    }

    const fragment = this.extractContents();
    while (parent.firstChild !== null) {
      removeNode(parent.firstChild);
    }
    this.insertNode(parent);
    parent.appendChild(fragment);
    this.selectNode(parent);
  }

  cloneRange(): Range {
    return new RangeImplementation(this.#document, this.#start, this.#end);
  }

  detach(): void {
    return;
  }

  isPointInRange(node: Node, offset: number): boolean {
    requireArguments(arguments.length, 2);
    const container = requiredNode(node);
    const convertedOffset = toUnsignedLong(offset);
    if (nodeRoot(container) !== nodeRoot(this.#start.node)) {
      return false;
    }
    const point = validatedBoundaryPoint(container, convertedOffset);
    return (
      compareBoundaryPoints(point, this.#start) >= 0 &&
      compareBoundaryPoints(point, this.#end) <= 0
    );
  }

  comparePoint(node: Node, offset: number): number {
    requireArguments(arguments.length, 2);
    const container = requiredNode(node);
    const convertedOffset = toUnsignedLong(offset);
    if (nodeRoot(container) !== nodeRoot(this.#start.node)) {
      throw new DOMException(
        "The point belongs to a different tree",
        "WrongDocumentError",
      );
    }
    const point = validatedBoundaryPoint(container, convertedOffset);
    if (compareBoundaryPoints(point, this.#start) < 0) {
      return -1;
    }
    if (compareBoundaryPoints(point, this.#end) > 0) {
      return 1;
    }
    return 0;
  }

  intersectsNode(node: Node): boolean {
    requireArguments(arguments.length, 1);
    const compared = requiredNode(node);
    if (nodeRoot(compared) !== nodeRoot(this.#start.node)) {
      return false;
    }
    const parent = compared.parentNode;
    if (parent === null) {
      return true;
    }
    const offset = nodeIndex(compared);
    return (
      compareBoundaryPoints({ node: parent, offset }, this.#end) < 0 &&
      compareBoundaryPoints({ node: parent, offset: offset + 1 }, this.#start) >
        0
    );
  }

  toString(): string {
    if (
      this.#start.node === this.#end.node &&
      this.#start.node instanceof Text
    ) {
      return this.#start.node.data.slice(this.#start.offset, this.#end.offset);
    }
    let result = "";
    if (this.#start.node instanceof Text) {
      result += this.#start.node.data.slice(this.#start.offset);
    }
    for (const node of allNodes(nodeRoot(this.#start.node))) {
      if (node instanceof Text && isContained(node, this)) {
        result += node.data;
      }
    }
    if (this.#end.node instanceof Text) {
      result += this.#end.node.data.slice(0, this.#end.offset);
    }
    return result;
  }

  adjustForRemoval(node: Node, parent: Node, index: number): void {
    if (isInclusiveAncestor(node, this.#start.node)) {
      this.#start = { node: parent, offset: index };
    } else if (this.#start.node === parent && this.#start.offset > index) {
      this.#start = { node: parent, offset: this.#start.offset - 1 };
    }
    if (isInclusiveAncestor(node, this.#end.node)) {
      this.#end = { node: parent, offset: index };
    } else if (this.#end.node === parent && this.#end.offset > index) {
      this.#end = { node: parent, offset: this.#end.offset - 1 };
    }
  }

  adjustForInsertion(parent: Node, index: number, count: number): void {
    if (this.#start.node === parent && this.#start.offset > index) {
      this.#start = { node: parent, offset: this.#start.offset + count };
    }
    if (this.#end.node === parent && this.#end.offset > index) {
      this.#end = { node: parent, offset: this.#end.offset + count };
    }
  }

  adjustForData(
    node: CharacterData,
    offset: number,
    count: number,
    dataLength: number,
  ): void {
    this.#start = adjustedDataPoint(
      this.#start,
      node,
      offset,
      count,
      dataLength,
    );
    this.#end = adjustedDataPoint(this.#end, node, offset, count, dataLength);
  }

  adjustForTextMerge(
    source: Text,
    target: Text,
    targetLength: number,
    parent: Node,
    sourceIndex: number,
  ): void {
    this.#start = adjustedMergePoint(
      this.#start,
      source,
      target,
      targetLength,
      parent,
      sourceIndex,
    );
    this.#end = adjustedMergePoint(
      this.#end,
      source,
      target,
      targetLength,
      parent,
      sourceIndex,
    );
  }

  adjustForTextSplit(
    source: Text,
    split: Text,
    offset: number,
    parent: Node | null,
    insertionOffset: number,
  ): void {
    this.#start = adjustedSplitPoint(
      this.#start,
      source,
      split,
      offset,
      parent,
      insertionOffset,
    );
    this.#end = adjustedSplitPoint(
      this.#end,
      source,
      split,
      offset,
      parent,
      insertionOffset,
    );
  }

  relocateForAdoption(node: Node, document: Document): void {
    if (isInclusiveAncestor(node, this.#start.node)) {
      this.#relocate(document);
    }
  }

  setPoints(start: BoundaryPoint, end: BoundaryPoint): void {
    this.#relocate(nodeDocument(start.node));
    this.#start = start;
    this.#end = end;
  }

  #setBoundary(type: "start" | "end", point: BoundaryPoint): void {
    if (type === "start") {
      if (
        nodeRoot(this.#end.node) !== nodeRoot(point.node) ||
        compareBoundaryPoints(point, this.#end) > 0
      ) {
        this.#end = point;
      }
      this.#start = point;
    } else {
      if (
        nodeRoot(this.#start.node) !== nodeRoot(point.node) ||
        compareBoundaryPoints(point, this.#start) < 0
      ) {
        this.#start = point;
      }
      this.#end = point;
    }
    this.#relocate(nodeDocument(point.node));
  }

  #relocate(document: Document): void {
    if (this.#document === document) {
      return;
    }
    rangeReferences(this.#document).delete(this.#registration);
    this.#document = document;
    rangeReferences(document).add(this.#registration);
  }
}

const rangesByDocument = new WeakMap<
  Document,
  Set<WeakRef<RangeImplementation>>
>();

export function createRange(document: Document): Range {
  return new RangeImplementation(document);
}

class StaticRangeImplementation implements StaticRange {
  readonly startContainer: Node;
  readonly startOffset: number;
  readonly endContainer: Node;
  readonly endOffset: number;

  constructor(init: StaticRangeInit) {
    if (
      init.startContainer instanceof DocumentType ||
      init.startContainer instanceof Attr ||
      init.endContainer instanceof DocumentType ||
      init.endContainer instanceof Attr
    ) {
      throw new DOMException(
        "StaticRange boundaries cannot be Attr or DocumentType nodes",
        "InvalidNodeTypeError",
      );
    }
    this.startContainer = init.startContainer;
    this.startOffset = init.startOffset;
    this.endContainer = init.endContainer;
    this.endOffset = init.endOffset;
    bindDOMInterface(this, this);
  }

  get collapsed(): boolean {
    return (
      this.startContainer === this.endContainer &&
      this.startOffset === this.endOffset
    );
  }
}

export function createStaticRange(init: StaticRangeInit): StaticRange {
  return new StaticRangeImplementation(init);
}

export function isRange(value: object): value is Range {
  return value instanceof RangeImplementation;
}

export function isStaticRange(value: object): value is StaticRange {
  return value instanceof StaticRangeImplementation;
}

export function preRemoveLiveRanges(node: Node): void {
  const parent = node.parentNode;
  const document = nodeDocument(node);
  if (parent === null) {
    return;
  }
  const index = nodeIndex(node);
  forEachRange(document, (range) => {
    range.adjustForRemoval(node, parent, index);
  });
}

export function adjustLiveRangesForInsertion(
  parent: Node,
  index: number,
  count: number,
): void {
  forEachRange(nodeDocument(parent), (range) => {
    range.adjustForInsertion(parent, index, count);
  });
}

export function adjustLiveRangesForData(
  node: CharacterData,
  offset: number,
  count: number,
  dataLength: number,
): void {
  forEachRange(nodeDocument(node), (range) => {
    range.adjustForData(node, offset, count, dataLength);
  });
}

export function adjustLiveRangesForTextMerge(
  source: Text,
  target: Text,
  targetLength: number,
): void {
  const parent = source.parentNode;
  if (parent === null) {
    return;
  }
  const index = nodeIndex(source);
  forEachRange(nodeDocument(source), (range) => {
    range.adjustForTextMerge(source, target, targetLength, parent, index);
  });
}

export function adjustLiveRangesForTextSplit(
  source: Text,
  split: Text,
  offset: number,
  parent: Node | null,
  insertionOffset: number,
): void {
  forEachRange(nodeDocument(source), (range) => {
    range.adjustForTextSplit(source, split, offset, parent, insertionOffset);
  });
}

export function transferLiveRanges(node: Node, document: Document): void {
  const oldDocument = nodeDocument(node);
  if (oldDocument === document) {
    return;
  }
  forEachRange(oldDocument, (range) => {
    range.relocateForAdoption(node, document);
  });
}

function extractRange(range: RangeImplementation): DocumentFragment {
  const document = nodeDocument(range.startContainer);
  const fragment = createDocumentFragment(document);
  if (range.collapsed) {
    return fragment;
  }
  const originalStart: BoundaryPoint = {
    node: range.startContainer,
    offset: range.startOffset,
  };
  const originalEnd: BoundaryPoint = {
    node: range.endContainer,
    offset: range.endOffset,
  };
  if (
    originalStart.node === originalEnd.node &&
    originalStart.node instanceof CharacterData
  ) {
    appendNode(
      fragment,
      cloneCharacterData(
        originalStart.node,
        originalStart.offset,
        originalEnd.offset,
        document,
      ),
    );
    replaceCharacterData(
      originalStart.node,
      originalStart.offset,
      originalEnd.offset - originalStart.offset,
      "",
    );
    return fragment;
  }

  const common = commonAncestor(originalStart.node, originalEnd.node);
  const firstPartial = firstPartiallyContainedChild(
    common,
    originalStart,
    originalEnd,
  );
  const lastPartial = lastPartiallyContainedChild(
    common,
    originalStart,
    originalEnd,
  );
  const contained = containedChildren(common, originalStart, originalEnd);
  if (contained.some((node) => node instanceof DocumentType)) {
    throw new DOMException(
      "A contained DocumentType cannot be extracted",
      "HierarchyRequestError",
    );
  }

  const collapse = collapsePointAfterContents(originalStart, originalEnd);
  range.setPoints(collapse, collapse);

  if (firstPartial instanceof CharacterData) {
    appendNode(
      fragment,
      cloneCharacterData(
        firstPartial,
        originalStart.offset,
        firstPartial.length,
        document,
      ),
    );
    replaceCharacterData(
      firstPartial,
      originalStart.offset,
      firstPartial.length - originalStart.offset,
      "",
    );
  } else if (firstPartial !== null) {
    const clone = cloneNodeIntoDocument(firstPartial, document, false);
    appendNode(fragment, clone);
    const subrange = new RangeImplementation(document, originalStart, {
      node: firstPartial,
      offset: nodeLength(firstPartial),
    });
    appendFragment(clone, extractRange(subrange));
  }

  for (const node of contained) {
    appendNode(fragment, node);
  }

  if (lastPartial instanceof CharacterData) {
    appendNode(
      fragment,
      cloneCharacterData(lastPartial, 0, originalEnd.offset, document),
    );
    replaceCharacterData(lastPartial, 0, originalEnd.offset, "");
  } else if (lastPartial !== null) {
    const clone = cloneNodeIntoDocument(lastPartial, document, false);
    appendNode(fragment, clone);
    const subrange = new RangeImplementation(
      document,
      { node: lastPartial, offset: 0 },
      originalEnd,
    );
    appendFragment(clone, extractRange(subrange));
  }
  return fragment;
}

function cloneRangeContents(range: RangeImplementation): DocumentFragment {
  const document = nodeDocument(range.startContainer);
  const fragment = createDocumentFragment(document);
  if (range.collapsed) {
    return fragment;
  }
  const start: BoundaryPoint = {
    node: range.startContainer,
    offset: range.startOffset,
  };
  const end: BoundaryPoint = {
    node: range.endContainer,
    offset: range.endOffset,
  };
  if (start.node === end.node && start.node instanceof CharacterData) {
    appendNode(
      fragment,
      cloneCharacterData(start.node, start.offset, end.offset, document),
    );
    return fragment;
  }

  const common = commonAncestor(start.node, end.node);
  const firstPartial = firstPartiallyContainedChild(common, start, end);
  const lastPartial = lastPartiallyContainedChild(common, start, end);
  const contained = containedChildren(common, start, end);
  if (contained.some((node) => node instanceof DocumentType)) {
    throw new DOMException(
      "A contained DocumentType cannot be cloned",
      "HierarchyRequestError",
    );
  }

  if (firstPartial instanceof CharacterData) {
    appendNode(
      fragment,
      cloneCharacterData(
        firstPartial,
        start.offset,
        firstPartial.length,
        document,
      ),
    );
  } else if (firstPartial !== null) {
    const clone = cloneNodeIntoDocument(firstPartial, document, false);
    appendNode(fragment, clone);
    const subrange = new RangeImplementation(document, start, {
      node: firstPartial,
      offset: nodeLength(firstPartial),
    });
    appendFragment(clone, cloneRangeContents(subrange));
  }

  for (const node of contained) {
    appendNode(fragment, cloneNodeIntoDocument(node, document, true));
  }

  if (lastPartial instanceof CharacterData) {
    appendNode(
      fragment,
      cloneCharacterData(lastPartial, 0, end.offset, document),
    );
  } else if (lastPartial !== null) {
    const clone = cloneNodeIntoDocument(lastPartial, document, false);
    appendNode(fragment, clone);
    const subrange = new RangeImplementation(
      document,
      { node: lastPartial, offset: 0 },
      end,
    );
    appendFragment(clone, cloneRangeContents(subrange));
  }
  return fragment;
}

function splitTextNode(node: Text, offset: number): Text {
  return node.splitText(offset);
}

function cloneCharacterData(
  node: CharacterData,
  start: number,
  end: number,
  document: Document,
): CharacterData {
  const clone = cloneNodeIntoDocument(node, document, false);
  if (!(clone instanceof CharacterData)) {
    throw new TypeError("CharacterData clone has an invalid type");
  }
  replaceCharacterData(clone, 0, clone.length, node.data.slice(start, end));
  return clone;
}

function appendFragment(parent: Node, fragment: DocumentFragment): void {
  while (fragment.firstChild !== null) {
    appendNode(parent, fragment.firstChild);
  }
}

function topLevelContainedNodes(range: RangeImplementation): Node[] {
  return allNodes(nodeRoot(range.startContainer)).filter(
    (node) =>
      isContained(node, range) &&
      (node.parentNode === null || !isContained(node.parentNode, range)),
  );
}

function containedChildren(
  common: Node,
  start: BoundaryPoint,
  end: BoundaryPoint,
): Node[] {
  return [...common.childNodes].filter((node) =>
    isNodeContained(node, start, end),
  );
}

function firstPartiallyContainedChild(
  common: Node,
  start: BoundaryPoint,
  end: BoundaryPoint,
): Node | null {
  if (isInclusiveAncestor(start.node, end.node)) {
    return null;
  }
  return (
    [...common.childNodes].find((node) =>
      isNodePartiallyContained(node, start, end),
    ) ?? null
  );
}

function lastPartiallyContainedChild(
  common: Node,
  start: BoundaryPoint,
  end: BoundaryPoint,
): Node | null {
  if (isInclusiveAncestor(end.node, start.node)) {
    return null;
  }
  return (
    [...common.childNodes]
      .reverse()
      .find((node) => isNodePartiallyContained(node, start, end)) ?? null
  );
}

function collapsePointAfterContents(
  start: BoundaryPoint,
  end: BoundaryPoint,
): BoundaryPoint {
  if (isInclusiveAncestor(start.node, end.node)) {
    return start;
  }
  let reference = start.node;
  while (
    reference.parentNode !== null &&
    !isInclusiveAncestor(reference.parentNode, end.node)
  ) {
    reference = reference.parentNode;
  }
  const parent = reference.parentNode;
  if (parent === null) {
    throw new TypeError("Range boundary points have no common ancestor");
  }
  return { node: parent, offset: nodeIndex(reference) + 1 };
}

function isContained(node: Node, range: RangeImplementation): boolean {
  return isNodeContained(
    node,
    { node: range.startContainer, offset: range.startOffset },
    { node: range.endContainer, offset: range.endOffset },
  );
}

function isNodeContained(
  node: Node,
  start: BoundaryPoint,
  end: BoundaryPoint,
): boolean {
  return (
    nodeRoot(node) === nodeRoot(start.node) &&
    compareBoundaryPoints({ node, offset: 0 }, start) > 0 &&
    compareBoundaryPoints({ node, offset: nodeLength(node) }, end) < 0
  );
}

function isPartiallyContained(node: Node, range: RangeImplementation): boolean {
  return isNodePartiallyContained(
    node,
    { node: range.startContainer, offset: range.startOffset },
    { node: range.endContainer, offset: range.endOffset },
  );
}

function isNodePartiallyContained(
  node: Node,
  start: BoundaryPoint,
  end: BoundaryPoint,
): boolean {
  return (
    isInclusiveAncestor(node, start.node) !==
    isInclusiveAncestor(node, end.node)
  );
}

function compareBoundaryPoints(a: BoundaryPoint, b: BoundaryPoint): number {
  if (a.node === b.node) {
    return Math.sign(a.offset - b.offset);
  }
  if (isInclusiveAncestor(a.node, b.node)) {
    const child = childUnderAncestor(b.node, a.node);
    return nodeIndex(child) < a.offset ? 1 : -1;
  }
  if (isInclusiveAncestor(b.node, a.node)) {
    const child = childUnderAncestor(a.node, b.node);
    return nodeIndex(child) < b.offset ? -1 : 1;
  }
  const common = commonAncestor(a.node, b.node);
  const aChild = childUnderAncestor(a.node, common);
  const bChild = childUnderAncestor(b.node, common);
  return nodeIndex(aChild) < nodeIndex(bChild) ? -1 : 1;
}

function sameBoundaryPoint(a: BoundaryPoint, b: BoundaryPoint): boolean {
  return a.node === b.node && a.offset === b.offset;
}

function requiredBoundaryPoint(node: unknown, offset: unknown): BoundaryPoint {
  const container = requiredNode(node);
  return validatedBoundaryPoint(container, toUnsignedLong(offset));
}

function validatedBoundaryPoint(node: Node, offset: number): BoundaryPoint {
  if (node instanceof DocumentType) {
    throw new DOMException(
      "DocumentType cannot be a range boundary",
      "InvalidNodeTypeError",
    );
  }
  if (offset > nodeLength(node)) {
    throw new DOMException(
      "The offset exceeds the node length",
      "IndexSizeError",
    );
  }
  return { node, offset };
}

function boundaryBefore(node: Node): BoundaryPoint {
  const parent = node.parentNode;
  if (parent === null) {
    throw new DOMException("The node has no parent", "InvalidNodeTypeError");
  }
  return { node: parent, offset: nodeIndex(node) };
}

function boundaryAfter(node: Node): BoundaryPoint {
  const point = boundaryBefore(node);
  return { node: point.node, offset: point.offset + 1 };
}

function requiredNode(value: unknown): Node {
  if (!(value instanceof Node)) {
    throw new TypeError("The argument is not a Node");
  }
  return value;
}

function requireRange(value: unknown): RangeImplementation {
  if (!(value instanceof RangeImplementation)) {
    throw new TypeError("The argument is not a Range");
  }
  return value;
}

function nodeLength(node: Node): number {
  return node instanceof CharacterData ? node.length : node.childNodes.length;
}

function nodeIndex(node: Node): number {
  const parent = node.parentNode;
  return parent === null ? 0 : childNodes(parent).indexOf(node);
}

function nodeRoot(node: Node): Node {
  let root = node;
  while (root.parentNode !== null) {
    root = root.parentNode;
  }
  return root;
}

function nodeDocument(node: Node): Document {
  if (node instanceof Document) {
    return node;
  }
  if (node.ownerDocument === null) {
    throw new TypeError("Node has no owner document");
  }
  return node.ownerDocument;
}

function commonAncestor(a: Node, b: Node): Node {
  let ancestor = a;
  while (!isInclusiveAncestor(ancestor, b)) {
    const parent = ancestor.parentNode;
    if (parent === null) {
      throw new TypeError("Nodes have no common ancestor");
    }
    ancestor = parent;
  }
  return ancestor;
}

function childUnderAncestor(node: Node, ancestor: Node): Node {
  let child = node;
  while (child.parentNode !== ancestor) {
    const parent = child.parentNode;
    if (parent === null) {
      throw new TypeError("Node is not a descendant of ancestor");
    }
    child = parent;
  }
  return child;
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

function allNodes(root: Node): Node[] {
  const nodes: Node[] = [];
  const visit = (node: Node): void => {
    nodes.push(node);
    for (const child of node.childNodes) {
      visit(child);
    }
  };
  visit(root);
  return nodes;
}

function adjustedDataPoint(
  point: BoundaryPoint,
  node: CharacterData,
  offset: number,
  count: number,
  dataLength: number,
): BoundaryPoint {
  if (point.node !== node || point.offset <= offset) {
    return point;
  }
  if (point.offset <= offset + count) {
    return { node, offset };
  }
  return { node, offset: point.offset + dataLength - count };
}

function adjustedMergePoint(
  point: BoundaryPoint,
  source: Text,
  target: Text,
  targetLength: number,
  parent: Node,
  sourceIndex: number,
): BoundaryPoint {
  if (point.node === source) {
    return { node: target, offset: targetLength + point.offset };
  }
  if (point.node === parent && point.offset === sourceIndex) {
    return { node: target, offset: targetLength };
  }
  return point;
}

function adjustedSplitPoint(
  point: BoundaryPoint,
  source: Text,
  split: Text,
  offset: number,
  parent: Node | null,
  insertionOffset: number,
): BoundaryPoint {
  if (point.node === source && point.offset > offset) {
    return { node: split, offset: point.offset - offset };
  }
  if (point.node === parent && point.offset === insertionOffset) {
    return { node: parent, offset: point.offset + 1 };
  }
  return point;
}

function rangeReferences(
  document: Document,
): Set<WeakRef<RangeImplementation>> {
  let references = rangesByDocument.get(document);
  if (references === undefined) {
    references = new Set();
    rangesByDocument.set(document, references);
  }
  return references;
}

function forEachRange(
  document: Document,
  callback: (range: RangeImplementation) => void,
): void {
  const references = rangesByDocument.get(document);
  if (references === undefined) {
    return;
  }
  for (const reference of references) {
    const range = reference.deref();
    if (range === undefined) {
      references.delete(reference);
    } else {
      callback(range);
    }
  }
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
