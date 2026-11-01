import type { DocumentFragment, Node } from "./nodes.js";

export interface Range {
  readonly startContainer: Node;
  readonly startOffset: number;
  readonly endContainer: Node;
  readonly endOffset: number;
  readonly collapsed: boolean;
  readonly commonAncestorContainer: Node;
  readonly START_TO_START: 0;
  readonly START_TO_END: 1;
  readonly END_TO_END: 2;
  readonly END_TO_START: 3;
  setStart(node: Node, offset: number): void;
  setEnd(node: Node, offset: number): void;
  setStartBefore(node: Node): void;
  setStartAfter(node: Node): void;
  setEndBefore(node: Node): void;
  setEndAfter(node: Node): void;
  collapse(toStart?: boolean): void;
  selectNode(node: Node): void;
  selectNodeContents(node: Node): void;
  compareBoundaryPoints(how: number, sourceRange: Range): number;
  deleteContents(): void;
  extractContents(): DocumentFragment;
  cloneContents(): DocumentFragment;
  insertNode(node: Node): void;
  surroundContents(newParent: Node): void;
  cloneRange(): Range;
  detach(): void;
  isPointInRange(node: Node, offset: number): boolean;
  comparePoint(node: Node, offset: number): number;
  intersectsNode(node: Node): boolean;
  toString(): string;
}
