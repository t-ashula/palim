import { documentImplementation } from "../dom/node-implementation.js";
import type { Document } from "../dom/nodes.js";

export interface PalimParseError {
  readonly source: "tokenizer" | "tree-construction";
  readonly code: string;
  readonly line: number | null;
  readonly column: number | null;
}

export function parseErrors(document: Document): readonly PalimParseError[] {
  return Object.freeze([...documentImplementation(document).parseErrors]);
}
