import { DOMException } from "../dom-exception.js";
import { bindDOMInterface, implementationFor } from "./binding.js";
import { asciiLowercase, domString } from "./conversions.js";
import type { Element } from "./nodes.js";

export class DOMTokenList implements Iterable<string> {
  readonly [index: number]: string | undefined;

  constructor(implementation?: unknown) {
    if (!(implementation instanceof DOMTokenListImplementation)) {
      throw new TypeError("Illegal constructor");
    }
    bindDOMInterface(this, implementation);
    const proxy = new Proxy(this, {
      get(target, property, receiver): unknown {
        if (typeof property === "string" && /^(0|[1-9]\d*)$/.test(property)) {
          return tokenValues(target)[Number(property)];
        }
        return Reflect.get(target, property, receiver);
      },
      has(target, property): boolean {
        return typeof property === "string" && /^(0|[1-9]\d*)$/.test(property)
          ? Number(property) < tokenValues(target).length
          : Reflect.has(target, property);
      },
    });
    bindDOMInterface(proxy, implementation);
    return proxy;
  }

  get length(): number {
    return tokenValues(this).length;
  }

  get value(): string {
    const implementation = tokenListImplementation(this);
    return (
      implementation.element.getAttribute(implementation.attributeName) ?? ""
    );
  }

  set value(value: string) {
    const implementation = tokenListImplementation(this);
    implementation.element.setAttribute(
      implementation.attributeName,
      domString(value),
    );
  }

  item(index: number): string | null {
    return tokenValues(this)[toUnsignedLong(index)] ?? null;
  }

  contains(token: string): boolean {
    const converted = domString(token);
    return tokenValues(this).includes(converted);
  }

  add(...tokens: string[]): void {
    const converted = validateTokens(tokens);
    const values = tokenValues(this);
    for (const token of converted) {
      if (!values.includes(token)) {
        values.push(token);
      }
    }
    setTokens(this, values);
  }

  remove(...tokens: string[]): void {
    const converted = validateTokens(tokens);
    setTokens(
      this,
      tokenValues(this).filter((token) => !converted.includes(token)),
    );
  }

  toggle(token: string, force?: boolean): boolean {
    const converted = validateToken(token);
    const values = tokenValues(this);
    const index = values.indexOf(converted);
    if (index >= 0) {
      if (arguments.length < 2 || !Boolean(force)) {
        values.splice(index, 1);
        setTokens(this, values);
        return false;
      }
      return true;
    }
    if (arguments.length < 2 || Boolean(force)) {
      values.push(converted);
      setTokens(this, values);
      return true;
    }
    return false;
  }

  replace(token: string, newToken: string): boolean {
    const [converted, replacement] = validateTokens([token, newToken]);
    const values = tokenValues(this);
    const index = values.indexOf(converted);
    if (index < 0) {
      return false;
    }
    const replacementIndex = values.indexOf(replacement);
    if (replacementIndex < 0) {
      values[index] = replacement;
    } else if (replacementIndex === index) {
      // Updating below still serializes the token set without duplicates.
    } else if (index < replacementIndex) {
      values[index] = replacement;
      values.splice(replacementIndex, 1);
    } else {
      values.splice(index, 1);
    }
    setTokens(this, values);
    return true;
  }

  supports(token: string): boolean {
    const supportedTokens = tokenListImplementation(this).supportedTokens;
    if (supportedTokens === null) {
      throw new TypeError("This DOMTokenList has no supported tokens");
    }
    return supportedTokens.has(asciiLowercase(domString(token)));
  }

  entries(): IterableIterator<[number, string]> {
    return tokenValues(this).entries();
  }

  keys(): IterableIterator<number> {
    return tokenValues(this).keys();
  }

  values(): IterableIterator<string> {
    return tokenValues(this).values();
  }

  forEach(
    callback: (value: string, key: number, parent: DOMTokenList) => void,
    thisArgument?: unknown,
  ): void {
    for (const [index, token] of tokenValues(this).entries()) {
      callback.call(thisArgument, token, index, this);
    }
  }

  [Symbol.iterator](): IterableIterator<string> {
    return this.values();
  }

  toString(): string {
    return this.value;
  }
}

Object.defineProperties(DOMTokenList.prototype, {
  entries: {
    configurable: true,
    writable: true,
    value: Array.prototype.entries,
  },
  forEach: {
    configurable: true,
    writable: true,
    value: Array.prototype.forEach,
  },
  keys: { configurable: true, writable: true, value: Array.prototype.keys },
  values: { configurable: true, writable: true, value: Array.prototype.values },
  [Symbol.iterator]: {
    configurable: true,
    writable: true,
    value: Array.prototype[Symbol.iterator],
  },
  [Symbol.toStringTag]: { configurable: true, value: "DOMTokenList" },
});

class DOMTokenListImplementation {
  readonly supportedTokens: ReadonlySet<string> | null;

  constructor(
    readonly element: Element,
    readonly attributeName: string,
    supportedTokens: readonly string[] | null,
  ) {
    this.supportedTokens =
      supportedTokens === null ? null : new Set(supportedTokens);
  }
}

export function createDOMTokenList(
  element: Element,
  attributeName: string,
  supportedTokens: readonly string[] | null = null,
): DOMTokenList {
  return new DOMTokenList(
    new DOMTokenListImplementation(element, attributeName, supportedTokens),
  );
}

function tokenListImplementation(
  tokenList: DOMTokenList,
): DOMTokenListImplementation {
  return implementationFor(tokenList) as DOMTokenListImplementation;
}

function tokenValues(tokenList: DOMTokenList): string[] {
  const implementation = tokenListImplementation(tokenList);
  const value =
    implementation.element.getAttribute(implementation.attributeName) ?? "";
  return [...new Set(value.split(/[\t\n\f\r ]+/).filter(Boolean))];
}

function setTokens(tokenList: DOMTokenList, values: readonly string[]): void {
  const implementation = tokenListImplementation(tokenList);
  if (
    values.length === 0 &&
    !implementation.element.hasAttribute(implementation.attributeName)
  ) {
    return;
  }
  implementation.element.setAttribute(
    implementation.attributeName,
    values.join(" "),
  );
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
  return validateTokens([value])[0];
}

function validateTokens<const Values extends readonly unknown[]>(
  values: Values,
): { [Index in keyof Values]: string } {
  const tokens = values.map(domString) as { [Index in keyof Values]: string };
  if (tokens.includes("")) {
    throw new DOMException("A token cannot be empty", "SyntaxError");
  }
  if (tokens.some((token) => /[\t\n\f\r ]/.test(token))) {
    throw new DOMException(
      "A token cannot contain ASCII whitespace",
      "InvalidCharacterError",
    );
  }
  return tokens;
}
