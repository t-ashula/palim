export interface PalimParseError {
  readonly source: "tokenizer" | "tree-construction";
  readonly code: string;
  readonly line: number | null;
  readonly column: number | null;
}

export const GET_PARSE_ERRORS = Symbol("get palim parse errors");

export interface ParseErrorSource {
  [GET_PARSE_ERRORS](): readonly PalimParseError[];
}

export function parseErrors(
  source: ParseErrorSource,
): readonly PalimParseError[] {
  return Object.freeze([...source[GET_PARSE_ERRORS]()]);
}
