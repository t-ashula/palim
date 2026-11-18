import type { Node } from "./nodes.js";
import type { Range, StaticRange } from "./range.js";

export interface GetComposedRangesOptions {
  readonly shadowRoots?: readonly object[];
}

export interface Selection {
  readonly anchorNode: Node | null;
  readonly anchorOffset: number;
  readonly focusNode: Node | null;
  readonly focusOffset: number;
  readonly isCollapsed: boolean;
  readonly rangeCount: number;
  readonly type: string;
  readonly direction: string;
  getRangeAt(index: number): Range;
  addRange(range: Range): void;
  removeRange(range: Range): void;
  removeAllRanges(): void;
  empty(): void;
  getComposedRanges(options?: GetComposedRangesOptions): StaticRange[];
  collapse(node: Node | null, offset?: number): void;
  setPosition(node: Node | null, offset?: number): void;
  collapseToStart(): void;
  collapseToEnd(): void;
  extend(node: Node, offset?: number): void;
  setBaseAndExtent(
    anchorNode: Node,
    anchorOffset: number,
    focusNode: Node,
    focusOffset: number,
  ): void;
  selectAllChildren(node: Node): void;
  modify(alter?: string, direction?: string, granularity?: string): void;
  deleteFromDocument(): void;
  containsNode(node: Node, allowPartialContainment?: boolean): boolean;
  toString(): string;
}
