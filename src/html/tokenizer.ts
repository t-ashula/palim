import NAMED_CHARACTER_REFERENCES from "./entities.json" with { type: "json" };

export type TokenizerState =
  | "Data state"
  | "PLAINTEXT state"
  | "RCDATA state"
  | "RAWTEXT state"
  | "Script data state"
  | "CDATA section state";

export interface TokenizerOptions {
  readonly initialState?: TokenizerState;
  readonly lastStartTag?: string;
}

export interface ParseError {
  readonly code: string;
  readonly line: number;
  readonly column: number;
}

export type Token =
  | {
      readonly type: "DOCTYPE";
      readonly name: string | null;
      readonly publicId: string | null;
      readonly systemId: string | null;
      readonly forceQuirks: boolean;
    }
  | {
      readonly type: "StartTag";
      readonly name: string;
      readonly attributes: Record<string, string>;
      readonly selfClosing: boolean;
    }
  | { readonly type: "EndTag"; readonly name: string }
  | { readonly type: "Comment"; readonly data: string }
  | {
      readonly type: "ProcessingInstruction";
      readonly target: string;
      readonly data: string;
    }
  | { readonly type: "Character"; readonly data: string };

export interface TokenizerResult {
  readonly tokens: Token[];
  readonly errors: ParseError[];
}

type State =
  | "data"
  | "rcdata"
  | "rawtext"
  | "script-data"
  | "plaintext"
  | "tag-open"
  | "end-tag-open"
  | "tag-name"
  | "rcdata-less-than"
  | "rcdata-end-tag-open"
  | "rcdata-end-tag-name"
  | "rawtext-less-than"
  | "rawtext-end-tag-open"
  | "rawtext-end-tag-name"
  | "script-less-than"
  | "script-end-tag-open"
  | "script-end-tag-name"
  | "script-escape-start"
  | "script-escape-start-dash"
  | "script-escaped"
  | "script-escaped-dash"
  | "script-escaped-dash-dash"
  | "script-escaped-less-than"
  | "script-escaped-end-tag-open"
  | "script-escaped-end-tag-name"
  | "script-double-escape-start"
  | "script-double-escaped"
  | "script-double-escaped-dash"
  | "script-double-escaped-dash-dash"
  | "script-double-escaped-less-than"
  | "script-double-escape-end"
  | "before-attribute-name"
  | "attribute-name"
  | "after-attribute-name"
  | "before-attribute-value"
  | "attribute-value-double"
  | "attribute-value-single"
  | "attribute-value-unquoted"
  | "after-attribute-value-quoted"
  | "self-closing-start-tag"
  | "markup-declaration-open"
  | "comment-start"
  | "comment-start-dash"
  | "comment"
  | "comment-less-than"
  | "comment-less-than-bang"
  | "comment-less-than-bang-dash"
  | "comment-less-than-bang-dash-dash"
  | "comment-end-dash"
  | "comment-end"
  | "comment-end-bang"
  | "bogus-comment"
  | "before-doctype-name"
  | "doctype-name"
  | "after-doctype-name"
  | "after-doctype-public-keyword"
  | "before-doctype-public-identifier"
  | "doctype-public-double"
  | "doctype-public-single"
  | "after-doctype-public-identifier"
  | "between-doctype-public-and-system-identifiers"
  | "after-doctype-system-keyword"
  | "before-doctype-system-identifier"
  | "doctype-system-double"
  | "doctype-system-single"
  | "after-doctype-system-identifier"
  | "bogus-doctype"
  | "cdata"
  | "processing-instruction-open"
  | "processing-instruction-target"
  | "after-processing-instruction-target"
  | "processing-instruction-data"
  | "processing-instruction-questionable";

interface MutableTagToken {
  type: "StartTag" | "EndTag";
  name: string;
  attributes: Record<string, string>;
  selfClosing: boolean;
}

interface MutableDoctypeToken {
  type: "DOCTYPE";
  name: string | null;
  publicId: string | null;
  systemId: string | null;
  forceQuirks: boolean;
}

interface MutableProcessingInstructionToken {
  type: "ProcessingInstruction";
  target: string;
  data: string;
}

const NUMERIC_REPLACEMENTS: Readonly<Record<number, number>> = {
  0x80: 0x20ac,
  0x82: 0x201a,
  0x83: 0x0192,
  0x84: 0x201e,
  0x85: 0x2026,
  0x86: 0x2020,
  0x87: 0x2021,
  0x88: 0x02c6,
  0x89: 0x2030,
  0x8a: 0x0160,
  0x8b: 0x2039,
  0x8c: 0x0152,
  0x8e: 0x017d,
  0x91: 0x2018,
  0x92: 0x2019,
  0x93: 0x201c,
  0x94: 0x201d,
  0x95: 0x2022,
  0x96: 0x2013,
  0x97: 0x2014,
  0x98: 0x02dc,
  0x99: 0x2122,
  0x9a: 0x0161,
  0x9b: 0x203a,
  0x9c: 0x0153,
  0x9e: 0x017e,
  0x9f: 0x0178,
};

const INITIAL_STATES: Readonly<Record<TokenizerState, State>> = {
  "Data state": "data",
  "PLAINTEXT state": "plaintext",
  "RCDATA state": "rcdata",
  "RAWTEXT state": "rawtext",
  "Script data state": "script-data",
  "CDATA section state": "cdata",
};

function isAsciiAlpha(character: string): boolean {
  return /^[A-Za-z]$/.test(character);
}

function isAsciiUpper(character: string): boolean {
  return /^[A-Z]$/.test(character);
}

function isWhitespace(character: string): boolean {
  return (
    character === "\t" ||
    character === "\n" ||
    character === "\f" ||
    character === " "
  );
}

export class HTMLTokenizer {
  readonly #input: string;
  readonly #tokens: Token[] = [];
  readonly #errors: ParseError[] = [];
  #state: State;
  #position = 0;
  #lastConsumedLength = 1;
  #currentToken:
    | MutableTagToken
    | MutableDoctypeToken
    | MutableProcessingInstructionToken
    | null = null;
  #currentAttributeName = "";
  #currentAttributeValue = "";
  #currentAttributeEnd = 0;
  #comment = "";
  #temporaryBuffer = "";
  #processingInstructionTargetEnd = 0;
  #lastStartTag: string | undefined;
  #allowCdata = false;
  readonly #inputErrorPositions = new Set<number>();

  constructor(input: string, options: TokenizerOptions = {}) {
    this.#input = input.replace(/\r\n?/g, "\n");
    this.#state = INITIAL_STATES[options.initialState ?? "Data state"];
    this.#lastStartTag = options.lastStartTag;
  }

  run(): TokenizerResult {
    while (this.#position <= this.#input.length) {
      this.#step();
    }
    return { tokens: this.#tokens, errors: this.#errors };
  }

  nextToken(): Token | null {
    while (this.#tokens.length === 0 && this.#position <= this.#input.length) {
      this.#step();
    }
    return this.#tokens.shift() ?? null;
  }

  setState(state: TokenizerState, lastStartTag?: string): void {
    this.#state = INITIAL_STATES[state];
    this.#lastStartTag = lastStartTag;
  }

  setAllowCdata(value: boolean): void {
    this.#allowCdata = value;
  }

  get errors(): readonly ParseError[] {
    return this.#errors;
  }

  #step(): void {
    const character = this.#consume();
    switch (this.#state) {
      case "data":
        if (character === "&") {
          this.#consumeReference(false);
        } else if (character === "<") {
          this.#state = "tag-open";
        } else if (character === "\0") {
          this.#error("unexpected-null-character");
          this.#characters(character);
        } else if (character !== null) {
          this.#characters(character);
        }
        break;
      case "rcdata":
        if (character === "&") {
          this.#consumeReference(false);
        } else if (character === "<") {
          this.#state = "rcdata-less-than";
        } else if (character === "\0") {
          this.#error("unexpected-null-character");
          this.#characters("\ufffd");
        } else if (character !== null) {
          this.#characters(character);
        }
        break;
      case "rawtext":
        if (character === "<") {
          this.#state = "rawtext-less-than";
        } else if (character === "\0") {
          this.#error("unexpected-null-character");
          this.#characters("\ufffd");
        } else if (character !== null) {
          this.#characters(character);
        }
        break;
      case "script-data":
        if (character === "<") {
          this.#state = "script-less-than";
        } else if (character === "\0") {
          this.#error("unexpected-null-character");
          this.#characters("\ufffd");
        } else if (character !== null) {
          this.#characters(character);
        }
        break;
      case "plaintext":
        if (character === "\0") {
          this.#error("unexpected-null-character");
          this.#characters("\ufffd");
        } else if (character !== null) {
          this.#characters(character);
        }
        break;
      case "tag-open":
        if (character === "!") {
          this.#state = "markup-declaration-open";
        } else if (character === "/") {
          this.#state = "end-tag-open";
        } else if (isAsciiAlpha(character ?? "")) {
          this.#currentToken = {
            type: "StartTag",
            name: "",
            attributes: {},
            selfClosing: false,
          };
          this.#state = "tag-name";
          this.#reconsume();
        } else if (character === "?") {
          this.#temporaryBuffer = "";
          this.#state = "processing-instruction-open";
        } else if (character === null) {
          this.#error("eof-before-tag-name");
          this.#characters("<");
        } else {
          this.#error("invalid-first-character-of-tag-name");
          this.#characters("<");
          this.#state = "data";
          this.#reconsume();
        }
        break;
      case "end-tag-open":
        if (isAsciiAlpha(character ?? "")) {
          this.#currentToken = {
            type: "EndTag",
            name: "",
            attributes: {},
            selfClosing: false,
          };
          this.#state = "tag-name";
          this.#reconsume();
        } else if (character === ">") {
          this.#error("missing-end-tag-name");
          this.#state = "data";
        } else if (character === null) {
          this.#error("eof-before-tag-name");
          this.#characters("</");
        } else {
          this.#error("invalid-first-character-of-tag-name");
          this.#comment = "";
          this.#state = "bogus-comment";
          this.#reconsume();
        }
        break;
      case "tag-name":
        if (isWhitespace(character ?? "")) {
          this.#state = "before-attribute-name";
        } else if (character === "/") {
          this.#state = "self-closing-start-tag";
        } else if (character === ">") {
          this.#emitCurrentToken();
          this.#state = "data";
        } else if (character === "\0") {
          this.#error("unexpected-null-character");
          this.#appendTagName("\ufffd");
        } else if (character === null) {
          this.#error("eof-in-tag");
        } else {
          this.#appendTagName(
            isAsciiUpper(character) ? character.toLowerCase() : character,
          );
        }
        break;
      case "rcdata-less-than":
        if (character === "/") {
          this.#temporaryBuffer = "";
          this.#state = "rcdata-end-tag-open";
        } else {
          this.#characters("<");
          this.#state = "rcdata";
          this.#reconsume();
        }
        break;
      case "rcdata-end-tag-open":
        this.#endTagOpen(character, "rcdata-end-tag-name", "rcdata");
        break;
      case "rcdata-end-tag-name":
        this.#endTagName(character, "rcdata");
        break;
      case "rawtext-less-than":
        if (character === "/") {
          this.#temporaryBuffer = "";
          this.#state = "rawtext-end-tag-open";
        } else {
          this.#characters("<");
          this.#state = "rawtext";
          this.#reconsume();
        }
        break;
      case "rawtext-end-tag-open":
        this.#endTagOpen(character, "rawtext-end-tag-name", "rawtext");
        break;
      case "rawtext-end-tag-name":
        this.#endTagName(character, "rawtext");
        break;
      case "script-less-than":
        if (character === "/") {
          this.#temporaryBuffer = "";
          this.#state = "script-end-tag-open";
        } else if (character === "!") {
          this.#characters("<!");
          this.#state = "script-escape-start";
        } else {
          this.#characters("<");
          this.#state = "script-data";
          this.#reconsume();
        }
        break;
      case "script-end-tag-open":
        this.#endTagOpen(character, "script-end-tag-name", "script-data");
        break;
      case "script-end-tag-name":
        this.#endTagName(character, "script-data");
        break;
      case "script-escape-start":
        if (character === "-") {
          this.#characters(character);
          this.#state = "script-escape-start-dash";
        } else {
          this.#state = "script-data";
          this.#reconsume();
        }
        break;
      case "script-escape-start-dash":
        if (character === "-") {
          this.#characters(character);
          this.#state = "script-escaped-dash-dash";
        } else {
          this.#state = "script-data";
          this.#reconsume();
        }
        break;
      case "script-escaped":
        this.#scriptEscaped(character, "script-escaped-dash");
        break;
      case "script-escaped-dash":
        if (character === "-") {
          this.#characters(character);
          this.#state = "script-escaped-dash-dash";
        } else {
          this.#scriptEscaped(character, "script-escaped");
        }
        break;
      case "script-escaped-dash-dash":
        if (character === "-") {
          this.#characters(character);
        } else if (character === ">") {
          this.#characters(character);
          this.#state = "script-data";
        } else {
          this.#scriptEscaped(character, "script-escaped");
        }
        break;
      case "script-escaped-less-than":
        if (character === "/") {
          this.#temporaryBuffer = "";
          this.#state = "script-escaped-end-tag-open";
        } else if (isAsciiAlpha(character ?? "")) {
          this.#temporaryBuffer = "";
          this.#characters("<");
          this.#state = "script-double-escape-start";
          this.#reconsume();
        } else {
          this.#characters("<");
          this.#state = "script-escaped";
          this.#reconsume();
        }
        break;
      case "script-escaped-end-tag-open":
        this.#endTagOpen(
          character,
          "script-escaped-end-tag-name",
          "script-escaped",
        );
        break;
      case "script-escaped-end-tag-name":
        this.#endTagName(character, "script-escaped");
        break;
      case "script-double-escape-start":
        this.#scriptDoubleEscapeTransition(
          character,
          "script-double-escaped",
          "script-escaped",
        );
        break;
      case "script-double-escaped":
        this.#scriptDoubleEscaped(character, "script-double-escaped-dash");
        break;
      case "script-double-escaped-dash":
        if (character === "-") {
          this.#characters(character);
          this.#state = "script-double-escaped-dash-dash";
        } else {
          this.#scriptDoubleEscaped(character, "script-double-escaped");
        }
        break;
      case "script-double-escaped-dash-dash":
        if (character === "-") {
          this.#characters(character);
        } else if (character === ">") {
          this.#characters(character);
          this.#state = "script-data";
        } else {
          this.#scriptDoubleEscaped(character, "script-double-escaped");
        }
        break;
      case "script-double-escaped-less-than":
        if (character === "/") {
          this.#characters(character);
          this.#temporaryBuffer = "";
          this.#state = "script-double-escape-end";
        } else {
          this.#state = "script-double-escaped";
          this.#reconsume();
        }
        break;
      case "script-double-escape-end":
        this.#scriptDoubleEscapeTransition(
          character,
          "script-escaped",
          "script-double-escaped",
        );
        break;
      case "before-attribute-name":
        if (isWhitespace(character ?? "")) {
          break;
        }
        if (character === "/" || character === ">" || character === null) {
          this.#state = "after-attribute-name";
          this.#reconsume();
        } else if (character === "=") {
          this.#error("unexpected-equals-sign-before-attribute-name");
          this.#startAttribute("=");
          this.#state = "attribute-name";
        } else {
          this.#startAttribute("");
          this.#state = "attribute-name";
          this.#reconsume();
        }
        break;
      case "attribute-name":
        if (
          isWhitespace(character ?? "") ||
          character === "/" ||
          character === ">" ||
          character === null
        ) {
          this.#currentAttributeEnd = this.#position - 1;
          this.#finishAttribute();
          this.#state = "after-attribute-name";
          this.#reconsume();
        } else if (character === "=") {
          this.#currentAttributeEnd = this.#position - 1;
          this.#state = "before-attribute-value";
        } else if (character === "\0") {
          this.#error("unexpected-null-character");
          this.#currentAttributeName += "\ufffd";
        } else {
          if (character === '"' || character === "'" || character === "<") {
            this.#error("unexpected-character-in-attribute-name");
          }
          this.#currentAttributeName += isAsciiUpper(character)
            ? character.toLowerCase()
            : character;
        }
        break;
      case "after-attribute-name":
        if (isWhitespace(character ?? "")) {
          break;
        }
        if (character === "/") {
          this.#state = "self-closing-start-tag";
        } else if (character === "=") {
          this.#state = "before-attribute-value";
        } else if (character === ">") {
          this.#emitCurrentToken();
          this.#state = "data";
        } else if (character === null) {
          this.#error("eof-in-tag");
        } else {
          this.#startAttribute("");
          this.#state = "attribute-name";
          this.#reconsume();
        }
        break;
      case "before-attribute-value":
        if (isWhitespace(character ?? "")) {
          break;
        }
        if (character === '"') {
          this.#state = "attribute-value-double";
        } else if (character === "'") {
          this.#state = "attribute-value-single";
        } else if (character === ">") {
          this.#error("missing-attribute-value");
          this.#finishAttribute();
          this.#emitCurrentToken();
          this.#state = "data";
        } else {
          this.#state = "attribute-value-unquoted";
          this.#reconsume();
        }
        break;
      case "attribute-value-double":
        this.#attributeValue(character, '"', "attribute-value-double");
        break;
      case "attribute-value-single":
        this.#attributeValue(character, "'", "attribute-value-single");
        break;
      case "attribute-value-unquoted":
        if (isWhitespace(character ?? "")) {
          this.#finishAttribute();
          this.#state = "before-attribute-name";
        } else if (character === "&") {
          this.#consumeReference(true);
        } else if (character === ">") {
          this.#finishAttribute();
          this.#emitCurrentToken();
          this.#state = "data";
        } else if (character === null) {
          this.#finishAttribute();
          this.#error("eof-in-tag");
        } else if (character === "\0") {
          this.#error("unexpected-null-character");
          this.#currentAttributeValue += "\ufffd";
        } else {
          if (['"', "'", "<", "=", "`"].includes(character)) {
            this.#error("unexpected-character-in-unquoted-attribute-value");
          }
          this.#currentAttributeValue += character;
        }
        break;
      case "after-attribute-value-quoted":
        if (isWhitespace(character ?? "")) {
          this.#state = "before-attribute-name";
        } else if (character === "/") {
          this.#state = "self-closing-start-tag";
        } else if (character === ">") {
          this.#emitCurrentToken();
          this.#state = "data";
        } else if (character === null) {
          this.#error("eof-in-tag");
        } else {
          this.#error("missing-whitespace-between-attributes");
          this.#state = "before-attribute-name";
          this.#reconsume();
        }
        break;
      case "self-closing-start-tag":
        if (character === ">") {
          if (
            this.#currentToken?.type === "StartTag" ||
            this.#currentToken?.type === "EndTag"
          ) {
            this.#currentToken.selfClosing = true;
          }
          this.#emitCurrentToken();
          this.#state = "data";
        } else if (character === null) {
          this.#error("eof-in-tag");
        } else {
          this.#error("unexpected-solidus-in-tag");
          this.#state = "before-attribute-name";
          this.#reconsume();
        }
        break;
      case "markup-declaration-open":
        this.#markupDeclaration();
        break;
      case "comment-start":
        if (character === "-") {
          this.#state = "comment-start-dash";
        } else if (character === ">") {
          this.#error("abrupt-closing-of-empty-comment");
          this.#emitComment();
          this.#state = "data";
        } else {
          this.#state = "comment";
          this.#reconsume();
        }
        break;
      case "comment-start-dash":
        if (character === "-") {
          this.#state = "comment-end";
        } else if (character === ">") {
          this.#error("abrupt-closing-of-empty-comment");
          this.#emitComment();
          this.#state = "data";
        } else if (character === null) {
          this.#error("eof-in-comment");
          this.#emitComment();
        } else {
          this.#comment += "-";
          this.#state = "comment";
          this.#reconsume();
        }
        break;
      case "comment":
        if (character === "<") {
          this.#state = "comment-less-than";
        } else if (character === "-") {
          this.#state = "comment-end-dash";
        } else if (character === "\0") {
          this.#error("unexpected-null-character");
          this.#comment += "\ufffd";
        } else if (character === null) {
          this.#error("eof-in-comment");
          this.#emitComment();
        } else {
          this.#comment += character;
        }
        break;
      case "comment-less-than":
        if (character === "!") {
          this.#comment += "<!";
          this.#state = "comment-less-than-bang";
        } else if (character === "<") {
          this.#comment += "<";
        } else {
          this.#comment += "<";
          this.#state = "comment";
          this.#reconsume();
        }
        break;
      case "comment-less-than-bang":
        if (character === "-") {
          this.#state = "comment-less-than-bang-dash";
        } else {
          this.#state = "comment";
          this.#reconsume();
        }
        break;
      case "comment-less-than-bang-dash":
        if (character === "-") {
          this.#state = "comment-less-than-bang-dash-dash";
        } else {
          this.#state = "comment-end-dash";
          this.#reconsume();
        }
        break;
      case "comment-less-than-bang-dash-dash":
        if (character === null) {
          this.#error("eof-in-comment");
          this.#emitComment();
        } else {
          if (character !== ">") {
            this.#error("nested-comment");
          }
          this.#state = "comment-end";
          this.#reconsume();
        }
        break;
      case "comment-end-dash":
        if (character === "-") {
          this.#state = "comment-end";
        } else if (character === null) {
          this.#error("eof-in-comment");
          this.#emitComment();
        } else {
          this.#comment += `-${character === "\0" ? "\ufffd" : character}`;
          if (character === "\0") {
            this.#error("unexpected-null-character");
          }
          this.#state = "comment";
        }
        break;
      case "comment-end":
        if (character === ">") {
          this.#emitComment();
          this.#state = "data";
        } else if (character === "!") {
          this.#state = "comment-end-bang";
        } else if (character === "-") {
          this.#comment += "-";
        } else if (character === null) {
          this.#error("eof-in-comment");
          this.#emitComment();
        } else {
          this.#comment += "--";
          this.#state = "comment";
          this.#reconsume();
        }
        break;
      case "comment-end-bang":
        if (character === "-") {
          this.#comment += "--!";
          this.#state = "comment-end-dash";
        } else if (character === ">") {
          this.#error("incorrectly-closed-comment");
          this.#emitComment();
          this.#state = "data";
        } else if (character === null) {
          this.#error("eof-in-comment");
          this.#emitComment();
        } else {
          this.#comment += "--!";
          this.#state = "comment";
          this.#reconsume();
        }
        break;
      case "bogus-comment":
        if (character === ">") {
          this.#emitComment();
          this.#state = "data";
        } else if (character === null) {
          this.#emitComment();
        } else if (character === "\0") {
          this.#error("unexpected-null-character");
          this.#comment += "\ufffd";
        } else {
          this.#comment += character;
        }
        break;
      case "before-doctype-name":
        this.#beforeDoctypeName(character);
        break;
      case "doctype-name":
        this.#doctypeName(character);
        break;
      case "after-doctype-name":
        this.#afterDoctypeName(character);
        break;
      case "after-doctype-public-keyword":
        this.#afterDoctypeKeyword(character, true);
        break;
      case "before-doctype-public-identifier":
        this.#beforeDoctypeIdentifier(character, true);
        break;
      case "doctype-public-double":
        this.#doctypeIdentifier(character, true, '"');
        break;
      case "doctype-public-single":
        this.#doctypeIdentifier(character, true, "'");
        break;
      case "after-doctype-public-identifier":
        this.#afterPublicIdentifier(character);
        break;
      case "between-doctype-public-and-system-identifiers":
        this.#betweenDoctypeIdentifiers(character);
        break;
      case "after-doctype-system-keyword":
        this.#afterDoctypeKeyword(character, false);
        break;
      case "before-doctype-system-identifier":
        this.#beforeDoctypeIdentifier(character, false);
        break;
      case "doctype-system-double":
        this.#doctypeIdentifier(character, false, '"');
        break;
      case "doctype-system-single":
        this.#doctypeIdentifier(character, false, "'");
        break;
      case "after-doctype-system-identifier":
        if (isWhitespace(character ?? "")) {
          break;
        }
        if (character === ">") {
          this.#emitCurrentToken();
          this.#state = "data";
        } else if (character === null) {
          this.#error("eof-in-doctype");
          this.#forceQuirks();
          this.#emitCurrentToken();
        } else {
          this.#error("unexpected-character-after-doctype-system-identifier");
          this.#state = "bogus-doctype";
          this.#reconsume();
        }
        break;
      case "bogus-doctype":
        if (character === ">") {
          this.#emitCurrentToken();
          this.#state = "data";
        } else if (character === null) {
          this.#emitCurrentToken();
        } else if (character === "\0") {
          this.#error("unexpected-null-character");
        }
        break;
      case "cdata":
        if (this.#input.startsWith("]]>", this.#position - 1)) {
          this.#position += 2;
          this.#state = "data";
        } else if (character === null) {
          this.#error("eof-in-cdata");
        } else {
          this.#characters(character);
        }
        break;
      case "processing-instruction-open":
        if (isAsciiAlpha(character ?? "") || character === "_") {
          this.#state = "processing-instruction-target";
          this.#reconsume();
        } else if (character === null) {
          this.#error("eof-in-processing-instruction");
        } else {
          this.#errorBeforeInputStreamError(
            "invalid-first-character-of-processing-instruction-target",
          );
          this.#convertTemporaryBufferToComment();
          this.#state = "bogus-comment";
          this.#reconsume();
        }
        break;
      case "processing-instruction-target":
        if (
          isWhitespace(character ?? "") ||
          character === "?" ||
          character === ">"
        ) {
          const target = this.#temporaryBuffer;
          this.#processingInstructionTargetEnd =
            this.#position - this.#lastConsumedLength;
          if (["xml", "xml-stylesheet"].includes(target.toLowerCase())) {
            this.#error("disallowed-processing-instruction-target");
            this.#convertTemporaryBufferToComment();
            this.#state = "bogus-comment";
          } else {
            this.#currentToken = {
              type: "ProcessingInstruction",
              target,
              data: "",
            };
            this.#state = "after-processing-instruction-target";
          }
          this.#reconsume();
        } else if (
          character !== null &&
          (/^[A-Za-z0-9]$/.test(character) ||
            character === "-" ||
            character === "_")
        ) {
          this.#temporaryBuffer += character;
        } else if (character === null) {
          this.#error("eof-in-processing-instruction");
        } else {
          this.#errorBeforeInputStreamError(
            "invalid-processing-instruction-target",
          );
          this.#convertTemporaryBufferToComment();
          this.#state = "bogus-comment";
          this.#reconsume();
        }
        break;
      case "after-processing-instruction-target":
        if (!isWhitespace(character ?? "")) {
          this.#state = "processing-instruction-data";
          this.#reconsume();
        }
        break;
      case "processing-instruction-data":
        if (character === "?") {
          this.#state = "processing-instruction-questionable";
        } else if (character === ">") {
          this.#state = "data";
          this.#emitCurrentToken();
        } else if (character === null) {
          this.#error(
            "eof-in-processing-instruction",
            this.#processingInstructionTargetEnd,
          );
        } else {
          this.#appendProcessingInstructionData(character);
        }
        break;
      case "processing-instruction-questionable":
        if (character === ">") {
          this.#state = "data";
          this.#emitCurrentToken();
        } else if (character === null) {
          this.#error(
            "eof-in-processing-instruction",
            this.#processingInstructionTargetEnd,
          );
        } else {
          this.#appendProcessingInstructionData("?");
          this.#state = "processing-instruction-data";
          this.#reconsume();
        }
        break;
    }
  }

  #consume(): string | null {
    if (this.#position >= this.#input.length) {
      this.#position += 1;
      this.#lastConsumedLength = 1;
      return null;
    }
    const codePoint = this.#input.codePointAt(this.#position);
    if (codePoint === undefined) {
      return null;
    }
    const character = String.fromCodePoint(codePoint);
    this.#lastConsumedLength = character.length;
    this.#inputStreamError(this.#position, codePoint);
    this.#position += character.length;
    return character;
  }

  #reconsume(): void {
    if (this.#position > this.#input.length) {
      this.#position = this.#input.length;
    } else {
      this.#position -= this.#lastConsumedLength;
    }
  }

  #inputStreamError(position: number, codePoint: number): void {
    if (this.#inputErrorPositions.has(position)) {
      return;
    }
    if (codePoint >= 0xd800 && codePoint <= 0xdfff) {
      this.#error("surrogate-in-input-stream", position);
    } else if (
      (codePoint >= 0xfdd0 && codePoint <= 0xfdef) ||
      (codePoint & 0xffff) === 0xfffe ||
      (codePoint & 0xffff) === 0xffff
    ) {
      this.#error("noncharacter-in-input-stream", position);
    } else if (
      (codePoint >= 1 && codePoint <= 8) ||
      codePoint === 0x0b ||
      (codePoint >= 0x0e && codePoint <= 0x1f) ||
      (codePoint >= 0x7f && codePoint <= 0x9f)
    ) {
      this.#error("control-character-in-input-stream", position);
    }
    this.#inputErrorPositions.add(position);
  }

  #characters(data: string): void {
    const previous = this.#tokens.at(-1);
    if (previous?.type === "Character") {
      this.#tokens[this.#tokens.length - 1] = {
        type: "Character",
        data: previous.data + data,
      };
    } else {
      this.#tokens.push({ type: "Character", data });
    }
  }

  #convertTemporaryBufferToComment(): void {
    this.#comment = `?${this.#temporaryBuffer}`;
    this.#currentToken = null;
  }

  #appendProcessingInstructionData(data: string): void {
    if (this.#currentToken?.type === "ProcessingInstruction") {
      this.#currentToken.data += data;
    }
  }

  #error(
    code: string,
    position = this.#position - this.#lastConsumedLength,
  ): void {
    const before = this.#input.slice(0, Math.min(position, this.#input.length));
    const lines = before.split("\n");
    this.#errors.push({
      code,
      line: lines.length,
      column: (lines.at(-1) ?? "").length + 1,
    });
  }

  #errorBeforeInputStreamError(code: string): void {
    const previous = this.#errors.at(-1);
    const current = this.#errorLocation(
      this.#position - this.#lastConsumedLength,
    );
    if (
      previous !== undefined &&
      previous.code.endsWith("-in-input-stream") &&
      previous.line === current.line &&
      previous.column === current.column
    ) {
      this.#errors.pop();
      this.#error(code);
      this.#errors.push(previous);
    } else {
      this.#error(code);
    }
  }

  #errorLocation(position: number): { line: number; column: number } {
    const before = this.#input.slice(0, Math.min(position, this.#input.length));
    const lines = before.split("\n");
    return { line: lines.length, column: (lines.at(-1) ?? "").length + 1 };
  }

  #appendTagName(data: string): void {
    if (
      this.#currentToken?.type === "StartTag" ||
      this.#currentToken?.type === "EndTag"
    ) {
      this.#currentToken.name += data;
    }
  }

  #emitCurrentToken(): void {
    const token = this.#currentToken;
    if (token === null) {
      return;
    }
    if (token.type === "StartTag" || token.type === "EndTag") {
      this.#finishAttribute();
      if (token.type === "StartTag") {
        this.#lastStartTag = token.name;
        this.#tokens.push(token);
      } else {
        if (Object.keys(token.attributes).length > 0) {
          this.#error("end-tag-with-attributes");
        }
        if (token.selfClosing) {
          this.#error("end-tag-with-trailing-solidus");
        }
        this.#tokens.push({ type: "EndTag", name: token.name });
      }
    } else {
      this.#tokens.push(token);
    }
    this.#currentToken = null;
  }

  #startAttribute(initialName: string): void {
    this.#finishAttribute();
    this.#currentAttributeName = initialName;
    this.#currentAttributeValue = "";
    this.#currentAttributeEnd = this.#position;
  }

  #finishAttribute(): void {
    if (this.#currentAttributeName === "") {
      return;
    }
    const token = this.#currentToken;
    if (token?.type === "StartTag" || token?.type === "EndTag") {
      if (Object.hasOwn(token.attributes, this.#currentAttributeName)) {
        this.#error("duplicate-attribute", this.#currentAttributeEnd);
      } else {
        token.attributes[this.#currentAttributeName] =
          this.#currentAttributeValue;
      }
    }
    this.#currentAttributeName = "";
    this.#currentAttributeValue = "";
  }

  #attributeValue(character: string | null, quote: string, state: State): void {
    if (character === quote) {
      this.#finishAttribute();
      this.#state = "after-attribute-value-quoted";
    } else if (character === "&") {
      this.#consumeReference(true);
    } else if (character === "\0") {
      this.#error("unexpected-null-character");
      this.#currentAttributeValue += "\ufffd";
    } else if (character === null) {
      this.#finishAttribute();
      this.#error("eof-in-tag");
    } else {
      this.#currentAttributeValue += character;
      this.#state = state;
    }
  }

  #endTagOpen(character: string | null, next: State, fallback: State): void {
    if (character !== null && isAsciiAlpha(character)) {
      this.#currentToken = {
        type: "EndTag",
        name: "",
        attributes: {},
        selfClosing: false,
      };
      this.#temporaryBuffer = "";
      this.#state = next;
      this.#reconsume();
    } else {
      this.#characters("</");
      this.#state = fallback;
      this.#reconsume();
    }
  }

  #endTagName(character: string | null, fallback: State): void {
    if (character !== null && isAsciiAlpha(character)) {
      this.#appendTagName(character.toLowerCase());
      this.#temporaryBuffer += character;
      return;
    }
    const token = this.#currentToken;
    const appropriate =
      token?.type === "EndTag" && token.name === this.#lastStartTag;
    if (appropriate && isWhitespace(character ?? "")) {
      this.#state = "before-attribute-name";
    } else if (appropriate && character === "/") {
      this.#state = "self-closing-start-tag";
    } else if (appropriate && character === ">") {
      this.#emitCurrentToken();
      this.#state = "data";
    } else {
      this.#characters(`</${this.#temporaryBuffer}`);
      this.#currentToken = null;
      this.#state = fallback;
      this.#reconsume();
    }
  }

  #scriptEscaped(character: string | null, dashState: State): void {
    if (character === "-") {
      this.#characters(character);
      this.#state = dashState;
    } else if (character === "<") {
      this.#state = "script-escaped-less-than";
    } else if (character === "\0") {
      this.#error("unexpected-null-character");
      this.#characters("\ufffd");
      this.#state = "script-escaped";
    } else if (character === null) {
      this.#error("eof-in-script-html-comment-like-text");
    } else {
      this.#characters(character);
      this.#state = "script-escaped";
    }
  }

  #scriptDoubleEscaped(character: string | null, dashState: State): void {
    if (character === "-") {
      this.#characters(character);
      this.#state = dashState;
    } else if (character === "<") {
      this.#characters(character);
      this.#state = "script-double-escaped-less-than";
    } else if (character === "\0") {
      this.#error("unexpected-null-character");
      this.#characters("\ufffd");
      this.#state = "script-double-escaped";
    } else if (character === null) {
      this.#error("eof-in-script-html-comment-like-text");
    } else {
      this.#characters(character);
      this.#state = "script-double-escaped";
    }
  }

  #scriptDoubleEscapeTransition(
    character: string | null,
    scriptState: State,
    otherState: State,
  ): void {
    if (isAsciiAlpha(character ?? "")) {
      this.#temporaryBuffer += character?.toLowerCase() ?? "";
      this.#characters(character ?? "");
    } else if (
      isWhitespace(character ?? "") ||
      character === "/" ||
      character === ">"
    ) {
      this.#state =
        this.#temporaryBuffer === "script" ? scriptState : otherState;
      this.#characters(character ?? "");
    } else {
      this.#state = otherState;
      this.#reconsume();
    }
  }

  #markupDeclaration(): void {
    this.#reconsume();
    const rest = this.#input.slice(this.#position);
    if (rest.startsWith("--")) {
      this.#position += 2;
      this.#comment = "";
      this.#state = "comment-start";
    } else if (rest.slice(0, 7).toLowerCase() === "doctype") {
      this.#position += 7;
      const next = this.#input[this.#position];
      if (next !== undefined) {
        this.#inputStreamError(
          this.#position,
          this.#input.codePointAt(this.#position) ?? next.charCodeAt(0),
        );
      }
      if (next !== undefined && next !== ">" && !isWhitespace(next)) {
        this.#error("missing-whitespace-before-doctype-name", this.#position);
      }
      this.#currentToken = {
        type: "DOCTYPE",
        name: null,
        publicId: null,
        systemId: null,
        forceQuirks: false,
      };
      this.#state = "before-doctype-name";
    } else if (rest.startsWith("[CDATA[") && this.#allowCdata) {
      this.#position += 7;
      this.#state = "cdata";
    } else {
      this.#error(
        rest.startsWith("[CDATA[")
          ? "cdata-in-html-content"
          : "incorrectly-opened-comment",
        rest.startsWith("[CDATA[") ? this.#position + 6 : this.#position,
      );
      this.#comment = "";
      this.#state = "bogus-comment";
    }
  }

  #emitComment(): void {
    this.#tokens.push({ type: "Comment", data: this.#comment });
    this.#comment = "";
  }

  #beforeDoctypeName(character: string | null): void {
    if (isWhitespace(character ?? "")) {
      return;
    }
    if (character === ">") {
      this.#error("missing-doctype-name");
      this.#forceQuirks();
      this.#emitCurrentToken();
      this.#state = "data";
    } else if (character === null) {
      this.#error("eof-in-doctype");
      this.#forceQuirks();
      this.#emitCurrentToken();
    } else {
      if (character === "\0") {
        this.#error("unexpected-null-character");
        character = "\ufffd";
      }
      if (this.#currentToken?.type === "DOCTYPE") {
        this.#currentToken.name = character.toLowerCase();
      }
      this.#state = "doctype-name";
    }
  }

  #doctypeName(character: string | null): void {
    if (isWhitespace(character ?? "")) {
      this.#state = "after-doctype-name";
    } else if (character === ">") {
      this.#emitCurrentToken();
      this.#state = "data";
    } else if (character === null) {
      this.#error("eof-in-doctype");
      this.#forceQuirks();
      this.#emitCurrentToken();
    } else if (this.#currentToken?.type === "DOCTYPE") {
      if (character === "\0") {
        this.#error("unexpected-null-character");
        this.#currentToken.name = (this.#currentToken.name ?? "") + "\ufffd";
      } else {
        this.#currentToken.name =
          (this.#currentToken.name ?? "") + character.toLowerCase();
      }
    }
  }

  #afterDoctypeName(character: string | null): void {
    if (isWhitespace(character ?? "")) {
      return;
    }
    if (character === ">") {
      this.#emitCurrentToken();
      this.#state = "data";
      return;
    }
    if (character === null) {
      this.#error("eof-in-doctype");
      this.#forceQuirks();
      this.#emitCurrentToken();
      return;
    }
    this.#reconsume();
    const rest = this.#input.slice(this.#position);
    if (rest.slice(0, 6).toLowerCase() === "public") {
      this.#position += 6;
      this.#state = "after-doctype-public-keyword";
    } else if (rest.slice(0, 6).toLowerCase() === "system") {
      this.#position += 6;
      this.#state = "after-doctype-system-keyword";
    } else {
      this.#error(
        "invalid-character-sequence-after-doctype-name",
        this.#position,
      );
      this.#forceQuirks();
      this.#state = "bogus-doctype";
    }
  }

  #afterDoctypeKeyword(character: string | null, isPublic: boolean): void {
    if (isWhitespace(character ?? "")) {
      this.#state = isPublic
        ? "before-doctype-public-identifier"
        : "before-doctype-system-identifier";
    } else if (character === '"' || character === "'") {
      this.#error(
        isPublic
          ? "missing-whitespace-after-doctype-public-keyword"
          : "missing-whitespace-after-doctype-system-keyword",
      );
      this.#startDoctypeIdentifier(isPublic, character);
    } else if (character === ">") {
      this.#error(
        isPublic
          ? "missing-doctype-public-identifier"
          : "missing-doctype-system-identifier",
      );
      this.#forceQuirks();
      this.#emitCurrentToken();
      this.#state = "data";
    } else if (character === null) {
      this.#error("eof-in-doctype");
      this.#forceQuirks();
      this.#emitCurrentToken();
    } else {
      this.#error(
        isPublic
          ? "missing-quote-before-doctype-public-identifier"
          : "missing-quote-before-doctype-system-identifier",
      );
      this.#forceQuirks();
      this.#state = "bogus-doctype";
      this.#reconsume();
    }
  }

  #beforeDoctypeIdentifier(character: string | null, isPublic: boolean): void {
    if (isWhitespace(character ?? "")) {
      return;
    }
    if (character === '"' || character === "'") {
      this.#startDoctypeIdentifier(isPublic, character);
    } else if (character === ">") {
      this.#error(
        isPublic
          ? "missing-doctype-public-identifier"
          : "missing-doctype-system-identifier",
      );
      this.#forceQuirks();
      this.#emitCurrentToken();
      this.#state = "data";
    } else if (character === null) {
      this.#error("eof-in-doctype");
      this.#forceQuirks();
      this.#emitCurrentToken();
    } else {
      this.#error(
        isPublic
          ? "missing-quote-before-doctype-public-identifier"
          : "missing-quote-before-doctype-system-identifier",
      );
      this.#forceQuirks();
      this.#state = "bogus-doctype";
      this.#reconsume();
    }
  }

  #startDoctypeIdentifier(isPublic: boolean, quote: string): void {
    if (this.#currentToken?.type === "DOCTYPE") {
      if (isPublic) {
        this.#currentToken.publicId = "";
      } else {
        this.#currentToken.systemId = "";
      }
    }
    this.#state = isPublic
      ? quote === '"'
        ? "doctype-public-double"
        : "doctype-public-single"
      : quote === '"'
        ? "doctype-system-double"
        : "doctype-system-single";
  }

  #doctypeIdentifier(
    character: string | null,
    isPublic: boolean,
    quote: string,
  ): void {
    if (character === quote) {
      this.#state = isPublic
        ? "after-doctype-public-identifier"
        : "after-doctype-system-identifier";
    } else if (character === ">") {
      this.#error(
        isPublic
          ? "abrupt-doctype-public-identifier"
          : "abrupt-doctype-system-identifier",
      );
      this.#forceQuirks();
      this.#emitCurrentToken();
      this.#state = "data";
    } else if (character === null) {
      this.#error("eof-in-doctype");
      this.#forceQuirks();
      this.#emitCurrentToken();
    } else if (this.#currentToken?.type === "DOCTYPE") {
      const value = character === "\0" ? "\ufffd" : character;
      if (character === "\0") {
        this.#error("unexpected-null-character");
      }
      if (isPublic) {
        this.#currentToken.publicId =
          (this.#currentToken.publicId ?? "") + value;
      } else {
        this.#currentToken.systemId =
          (this.#currentToken.systemId ?? "") + value;
      }
    }
  }

  #afterPublicIdentifier(character: string | null): void {
    if (isWhitespace(character ?? "")) {
      this.#state = "between-doctype-public-and-system-identifiers";
    } else if (character === ">") {
      this.#emitCurrentToken();
      this.#state = "data";
    } else if (character === '"' || character === "'") {
      this.#error(
        "missing-whitespace-between-doctype-public-and-system-identifiers",
      );
      this.#startDoctypeIdentifier(false, character);
    } else if (character === null) {
      this.#error("eof-in-doctype");
      this.#forceQuirks();
      this.#emitCurrentToken();
    } else {
      this.#error("missing-quote-before-doctype-system-identifier");
      this.#forceQuirks();
      this.#state = "bogus-doctype";
      this.#reconsume();
    }
  }

  #betweenDoctypeIdentifiers(character: string | null): void {
    if (isWhitespace(character ?? "")) {
      return;
    }
    if (character === ">") {
      this.#emitCurrentToken();
      this.#state = "data";
    } else if (character === '"' || character === "'") {
      this.#startDoctypeIdentifier(false, character);
    } else if (character === null) {
      this.#error("eof-in-doctype");
      this.#forceQuirks();
      this.#emitCurrentToken();
    } else {
      this.#error("missing-quote-before-doctype-system-identifier");
      this.#forceQuirks();
      this.#state = "bogus-doctype";
      this.#reconsume();
    }
  }

  #forceQuirks(): void {
    if (this.#currentToken?.type === "DOCTYPE") {
      this.#currentToken.forceQuirks = true;
    }
  }

  #consumeReference(inAttribute: boolean): void {
    const start = this.#position;
    const next = this.#input[start];
    if (
      next === undefined ||
      isWhitespace(next) ||
      next === "<" ||
      next === "&" ||
      (inAttribute && next === "=")
    ) {
      this.#referenceOutput("&", inAttribute);
      return;
    }

    if (next === "#") {
      let position = start + 1;
      let radix = 10;
      if (this.#input[position] === "x" || this.#input[position] === "X") {
        radix = 16;
        position += 1;
      }
      const digitStart = position;
      const pattern = radix === 16 ? /[0-9A-Fa-f]/ : /[0-9]/;
      while (pattern.test(this.#input[position] ?? "")) {
        position += 1;
      }
      if (position === digitStart) {
        this.#error(
          "absence-of-digits-in-numeric-character-reference",
          position,
        );
        this.#referenceOutput(
          "&#" + (radix === 16 ? (this.#input[start + 1] ?? "") : ""),
          inAttribute,
        );
        this.#position = position;
        return;
      }
      const hasSemicolon = this.#input[position] === ";";
      if (!hasSemicolon) {
        this.#error("missing-semicolon-after-character-reference", position);
      }
      const value = Number.parseInt(
        this.#input.slice(digitStart, position),
        radix,
      );
      this.#position = position + (hasSemicolon ? 1 : 0);
      this.#referenceOutput(this.#numericReference(value), inAttribute);
      return;
    }

    let position = start;
    while (/[A-Za-z0-9]/.test(this.#input[position] ?? "")) {
      position += 1;
    }
    if (position === start) {
      this.#referenceOutput("&", inAttribute);
      return;
    }
    const hasSemicolon = this.#input[position] === ";";
    const candidate = this.#input.slice(
      start,
      position + (hasSemicolon ? 1 : 0),
    );
    let match = "";
    for (let length = candidate.length; length > 0; length -= 1) {
      const name = candidate.slice(0, length);
      if (Object.hasOwn(NAMED_CHARACTER_REFERENCES, `&${name}`)) {
        match = name;
        break;
      }
    }
    if (match === "") {
      if (hasSemicolon) {
        this.#error("unknown-named-character-reference", position);
      }
      this.#referenceOutput(`&${candidate}`, inAttribute);
      this.#position = start + candidate.length;
      return;
    }
    const matchEndsWithSemicolon = match.endsWith(";");
    const following = this.#input[start + match.length];
    if (
      inAttribute &&
      !matchEndsWithSemicolon &&
      (following === "=" || /[A-Za-z0-9]/.test(following ?? ""))
    ) {
      this.#referenceOutput(`&${match}`, true);
      this.#position = start + match.length;
      return;
    }
    if (!matchEndsWithSemicolon) {
      this.#error(
        "missing-semicolon-after-character-reference",
        start + match.length,
      );
    }
    this.#referenceOutput(
      NAMED_CHARACTER_REFERENCES[
        `&${match}` as keyof typeof NAMED_CHARACTER_REFERENCES
      ].characters,
      inAttribute,
    );
    this.#position = start + match.length;
  }

  #referenceOutput(data: string, inAttribute: boolean): void {
    if (inAttribute) {
      this.#currentAttributeValue += data;
    } else {
      this.#characters(data);
    }
  }

  #numericReference(value: number): string {
    let codePoint = value;
    if (codePoint === 0) {
      this.#error("null-character-reference", this.#position);
      codePoint = 0xfffd;
    } else if (codePoint > 0x10ffff) {
      this.#error("character-reference-outside-unicode-range", this.#position);
      codePoint = 0xfffd;
    } else if (codePoint >= 0xd800 && codePoint <= 0xdfff) {
      this.#error("surrogate-character-reference", this.#position);
      codePoint = 0xfffd;
    } else if (
      (codePoint >= 0xfdd0 && codePoint <= 0xfdef) ||
      (codePoint & 0xffff) === 0xfffe ||
      (codePoint & 0xffff) === 0xffff
    ) {
      this.#error("noncharacter-character-reference", this.#position);
    } else if (
      (codePoint >= 1 && codePoint <= 8) ||
      codePoint === 0x0b ||
      (codePoint >= 0x0d && codePoint <= 0x1f) ||
      (codePoint >= 0x7f && codePoint <= 0x9f)
    ) {
      this.#error("control-character-reference", this.#position);
      codePoint = NUMERIC_REPLACEMENTS[codePoint] ?? codePoint;
    }
    return String.fromCodePoint(codePoint);
  }
}

export function tokenize(
  input: string,
  options: TokenizerOptions = {},
): TokenizerResult {
  const result = new HTMLTokenizer(input, options).run();
  const tokens: Token[] = [];
  for (const token of result.tokens) {
    const previous = tokens.at(-1);
    if (token.type === "Character" && previous?.type === "Character") {
      tokens[tokens.length - 1] = {
        type: "Character",
        data: previous.data + token.data,
      };
    } else {
      tokens.push(token);
    }
  }
  return { tokens, errors: result.errors };
}
