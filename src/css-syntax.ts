export type CSSToken =
  | { readonly type: "whitespace"; readonly raw: string }
  | { readonly type: "ident"; readonly value: string; readonly raw: string }
  | { readonly type: "function"; readonly value: string; readonly raw: string }
  | { readonly type: "hash"; readonly value: string; readonly raw: string }
  | { readonly type: "string"; readonly value: string; readonly raw: string }
  | { readonly type: "bad-string"; readonly raw: string }
  | { readonly type: "number"; readonly value: number; readonly raw: string }
  | {
      readonly type: "dimension";
      readonly value: number;
      readonly unit: string;
      readonly raw: string;
    }
  | {
      readonly type: "percentage";
      readonly value: number;
      readonly raw: string;
    }
  | {
      readonly type: "at-keyword";
      readonly value: string;
      readonly raw: string;
    }
  | { readonly type: "colon"; readonly raw: ":" }
  | { readonly type: "semicolon"; readonly raw: ";" }
  | { readonly type: "comma"; readonly raw: "," }
  | { readonly type: "open-square"; readonly raw: "[" }
  | { readonly type: "close-square"; readonly raw: "]" }
  | { readonly type: "open-paren"; readonly raw: "(" }
  | { readonly type: "close-paren"; readonly raw: ")" }
  | { readonly type: "open-curly"; readonly raw: "{" }
  | { readonly type: "close-curly"; readonly raw: "}" }
  | { readonly type: "delim"; readonly value: string; readonly raw: string };

const REPLACEMENT_CHARACTER = "\uFFFD";

export function tokenizeCSS(input: string): readonly CSSToken[] {
  return new CSSTokenizer(preprocess(input)).tokenize();
}

function preprocess(input: string): string {
  const normalized = input.replace(/\r\n?|\f/g, "\n");
  let result = "";
  for (const character of normalized) {
    const codePoint = character.codePointAt(0) ?? 0;
    result +=
      codePoint === 0 || (codePoint >= 0xd800 && codePoint <= 0xdfff)
        ? REPLACEMENT_CHARACTER
        : character;
  }
  return result;
}

class CSSTokenizer {
  readonly #input: string;
  #position = 0;

  constructor(input: string) {
    this.#input = input;
  }

  tokenize(): readonly CSSToken[] {
    const tokens: CSSToken[] = [];
    while (!this.#done()) {
      const token = this.#consumeToken();
      if (token !== null) {
        tokens.push(token);
      }
    }
    return tokens;
  }

  #consumeToken(): CSSToken | null {
    const start = this.#position;
    const character = this.#peek();

    if (isWhitespace(character)) {
      this.#consumeWhile(isWhitespace);
      return { type: "whitespace", raw: this.#slice(start) };
    }

    if (character === "/" && this.#peek(1) === "*") {
      this.#position += 2;
      while (!this.#done()) {
        if (this.#peek() === "*" && this.#peek(1) === "/") {
          this.#position += 2;
          return null;
        }
        this.#position += 1;
      }
      return null;
    }

    if (character === '"' || character === "'") {
      return this.#consumeString(character, start);
    }

    if (character === "#") {
      this.#position += 1;
      if (this.#wouldStartIdent()) {
        return {
          type: "hash",
          value: this.#consumeName(),
          raw: this.#slice(start),
        };
      }
      return { type: "delim", value: "#", raw: "#" };
    }

    if (character === "@") {
      this.#position += 1;
      if (this.#wouldStartIdent()) {
        return {
          type: "at-keyword",
          value: this.#consumeName(),
          raw: this.#slice(start),
        };
      }
      return { type: "delim", value: "@", raw: "@" };
    }

    if (this.#wouldStartNumber()) {
      return this.#consumeNumeric(start);
    }

    if (this.#wouldStartIdent()) {
      const value = this.#consumeName();
      if (this.#peek() === "(") {
        this.#position += 1;
        return { type: "function", value, raw: this.#slice(start) };
      }
      return { type: "ident", value, raw: this.#slice(start) };
    }

    this.#position += 1;
    switch (character) {
      case ":":
        return { type: "colon", raw: ":" };
      case ";":
        return { type: "semicolon", raw: ";" };
      case ",":
        return { type: "comma", raw: "," };
      case "[":
        return { type: "open-square", raw: "[" };
      case "]":
        return { type: "close-square", raw: "]" };
      case "(":
        return { type: "open-paren", raw: "(" };
      case ")":
        return { type: "close-paren", raw: ")" };
      case "{":
        return { type: "open-curly", raw: "{" };
      case "}":
        return { type: "close-curly", raw: "}" };
      default:
        return { type: "delim", value: character, raw: character };
    }
  }

  #consumeString(ending: string, start: number): CSSToken {
    this.#position += 1;
    let value = "";
    while (!this.#done()) {
      const character = this.#peek();
      if (character === ending) {
        this.#position += 1;
        return { type: "string", value, raw: this.#slice(start) };
      }
      if (character === "\n") {
        return { type: "bad-string", raw: this.#slice(start) };
      }
      if (character === "\\") {
        if (this.#peek(1) === "\n") {
          this.#position += 2;
          continue;
        }
        if (this.#peek(1) === "") {
          this.#position += 1;
          continue;
        }
        value += this.#consumeEscape();
        continue;
      }
      value += character;
      this.#position += 1;
    }
    return { type: "string", value, raw: this.#slice(start) };
  }

  #consumeNumeric(start: number): CSSToken {
    const representation = this.#consumeNumber();
    const value = Number(representation);
    if (this.#wouldStartIdent()) {
      const unit = this.#consumeName();
      return {
        type: "dimension",
        value,
        unit,
        raw: this.#slice(start),
      };
    }
    if (this.#peek() === "%") {
      this.#position += 1;
      return { type: "percentage", value, raw: this.#slice(start) };
    }
    return { type: "number", value, raw: this.#slice(start) };
  }

  #consumeNumber(): string {
    const start = this.#position;
    if (this.#peek() === "+" || this.#peek() === "-") {
      this.#position += 1;
    }
    this.#consumeWhile(isDigit);
    if (this.#peek() === "." && isDigit(this.#peek(1))) {
      this.#position += 1;
      this.#consumeWhile(isDigit);
    }
    if (
      (this.#peek() === "e" || this.#peek() === "E") &&
      (isDigit(this.#peek(1)) ||
        ((this.#peek(1) === "+" || this.#peek(1) === "-") &&
          isDigit(this.#peek(2))))
    ) {
      this.#position += 1;
      if (this.#peek() === "+" || this.#peek() === "-") {
        this.#position += 1;
      }
      this.#consumeWhile(isDigit);
    }
    return this.#input.slice(start, this.#position);
  }

  #consumeName(): string {
    let result = "";
    while (!this.#done()) {
      const character = this.#peek();
      if (isName(character)) {
        result += character;
        this.#position += 1;
      } else if (character === "\\" && this.#validEscape()) {
        result += this.#consumeEscape();
      } else {
        break;
      }
    }
    return result;
  }

  #consumeEscape(): string {
    this.#position += 1;
    const character = this.#peek();
    if (isHexDigit(character)) {
      const start = this.#position;
      let count = 0;
      while (count < 6 && isHexDigit(this.#peek())) {
        this.#position += 1;
        count += 1;
      }
      const value = Number.parseInt(
        this.#input.slice(start, this.#position),
        16,
      );
      if (isWhitespace(this.#peek())) {
        this.#position += 1;
      }
      return value === 0 || value > 0x10ffff || isSurrogate(value)
        ? REPLACEMENT_CHARACTER
        : String.fromCodePoint(value);
    }
    if (character === "") {
      return REPLACEMENT_CHARACTER;
    }
    this.#position += 1;
    return character;
  }

  #wouldStartIdent(offset = 0): boolean {
    const first = this.#peek(offset);
    const second = this.#peek(offset + 1);
    if (first === "-") {
      return (
        isNameStart(second) || second === "-" || this.#validEscape(offset + 1)
      );
    }
    return isNameStart(first) || this.#validEscape(offset);
  }

  #wouldStartNumber(): boolean {
    const first = this.#peek();
    const second = this.#peek(1);
    const third = this.#peek(2);
    if (first === "+" || first === "-") {
      return isDigit(second) || (second === "." && isDigit(third));
    }
    return isDigit(first) || (first === "." && isDigit(second));
  }

  #validEscape(offset = 0): boolean {
    return (
      this.#peek(offset) === "\\" &&
      !["", "\n"].includes(this.#peek(offset + 1))
    );
  }

  #consumeWhile(predicate: (character: string) => boolean): void {
    while (predicate(this.#peek())) {
      this.#position += 1;
    }
  }

  #peek(offset = 0): string {
    return this.#input[this.#position + offset] ?? "";
  }

  #slice(start: number): string {
    return this.#input.slice(start, this.#position);
  }

  #done(): boolean {
    return this.#position >= this.#input.length;
  }
}

function isWhitespace(character: string): boolean {
  return character === "\n" || character === "\t" || character === " ";
}

function isDigit(character: string): boolean {
  return character >= "0" && character <= "9";
}

function isHexDigit(character: string): boolean {
  return (
    isDigit(character) ||
    (character >= "a" && character <= "f") ||
    (character >= "A" && character <= "F")
  );
}

function isNameStart(character: string): boolean {
  const codePoint = character.codePointAt(0) ?? 0;
  return (
    character === "_" ||
    (character >= "a" && character <= "z") ||
    (character >= "A" && character <= "Z") ||
    codePoint >= 0x80
  );
}

function isName(character: string): boolean {
  return isNameStart(character) || isDigit(character) || character === "-";
}

function isSurrogate(codePoint: number): boolean {
  return codePoint >= 0xd800 && codePoint <= 0xdfff;
}
