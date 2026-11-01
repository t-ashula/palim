import { DOMException } from "../dom-exception.js";
import { asciiLowercase, domString } from "./conversions.js";
import type { Element } from "./nodes.js";

export class DOMTokenList implements Iterable<string> {
  readonly [index: number]: string | undefined;
  readonly _element: Element;
  readonly _attributeName: string;
  readonly _supportedTokens: ReadonlySet<string> | null;

  constructor(
    element: Element,
    attributeName: string,
    supportedTokens: readonly string[] | null = null,
  ) {
    this._element = element;
    this._attributeName = attributeName;
    this._supportedTokens =
      supportedTokens === null ? null : new Set(supportedTokens);
    return new Proxy(this, {
      get(target, property): unknown {
        if (typeof property === "string" && /^(0|[1-9]\d*)$/.test(property)) {
          return target._tokens()[Number(property)];
        }
        const value: unknown = Reflect.get(target, property, target);
        return typeof value === "function"
          ? (value as (...arguments_: unknown[]) => unknown).bind(target)
          : value;
      },
    });
  }

  get length(): number {
    return this._tokens().length;
  }

  get value(): string {
    return this._element.getAttribute(this._attributeName) ?? "";
  }

  set value(value: string) {
    this._element.setAttribute(this._attributeName, domString(value));
  }

  item(index: number): string | null {
    return this._tokens()[toUnsignedLong(index)] ?? null;
  }

  contains(token: string): boolean {
    const converted = validateToken(token);
    return this._tokens().includes(converted);
  }

  add(...tokens: string[]): void {
    const converted = tokens.map(validateToken);
    const values = this._tokens();
    for (const token of converted) {
      if (!values.includes(token)) {
        values.push(token);
      }
    }
    this._setTokens(values);
  }

  remove(...tokens: string[]): void {
    const converted = tokens.map(validateToken);
    this._setTokens(
      this._tokens().filter((token) => !converted.includes(token)),
    );
  }

  toggle(token: string, force?: boolean): boolean {
    const converted = validateToken(token);
    const values = this._tokens();
    const index = values.indexOf(converted);
    if (index >= 0) {
      if (arguments.length < 2 || !Boolean(force)) {
        values.splice(index, 1);
        this._setTokens(values);
        return false;
      }
      return true;
    }
    if (arguments.length < 2 || Boolean(force)) {
      values.push(converted);
      this._setTokens(values);
      return true;
    }
    return false;
  }

  replace(token: string, newToken: string): boolean {
    const converted = validateToken(token);
    const replacement = validateToken(newToken);
    const values = this._tokens();
    const index = values.indexOf(converted);
    if (index < 0) {
      return false;
    }
    const replacementIndex = values.indexOf(replacement);
    if (replacementIndex >= 0) {
      values.splice(index, 1);
    } else {
      values[index] = replacement;
    }
    this._setTokens(values);
    return true;
  }

  supports(token: string): boolean {
    if (this._supportedTokens === null) {
      throw new TypeError("This DOMTokenList has no supported tokens");
    }
    return this._supportedTokens.has(asciiLowercase(domString(token)));
  }

  entries(): IterableIterator<[number, string]> {
    return this._tokens().entries();
  }

  keys(): IterableIterator<number> {
    return this._tokens().keys();
  }

  values(): IterableIterator<string> {
    return this._tokens().values();
  }

  forEach(
    callback: (value: string, key: number, parent: DOMTokenList) => void,
    thisArgument?: unknown,
  ): void {
    for (const [index, token] of this._tokens().entries()) {
      callback.call(thisArgument, token, index, this);
    }
  }

  [Symbol.iterator](): IterableIterator<string> {
    return this.values();
  }

  toString(): string {
    return this.value;
  }

  _tokens(): string[] {
    const value = this._element.getAttribute(this._attributeName) ?? "";
    return [...new Set(value.split(/[\t\n\f\r ]+/).filter(Boolean))];
  }

  _setTokens(tokens: readonly string[]): void {
    if (
      tokens.length === 0 &&
      !this._element.hasAttribute(this._attributeName)
    ) {
      return;
    }
    this._element.setAttribute(this._attributeName, tokens.join(" "));
  }
}

function toUnsignedLong(value: unknown): number {
  const number = Number(value);
  if (!Number.isFinite(number) || number === 0) {
    return 0;
  }
  const integer = Math.trunc(number);
  return ((integer % 4_294_967_296) + 4_294_967_296) % 4_294_967_296;
}

function validateToken(value: unknown): string {
  const token = domString(value);
  if (token === "") {
    throw new DOMException("A token cannot be empty", "SyntaxError");
  }
  if (/[\t\n\f\r ]/.test(token)) {
    throw new DOMException(
      "A token cannot contain ASCII whitespace",
      "InvalidCharacterError",
    );
  }
  return token;
}
