import type { Attr, Element, Node } from "./nodes.js";
import { DOMException } from "../dom-exception.js";
import { requireArguments } from "../web-idl.js";
import { domString, normalizeNamespace } from "./conversions.js";

function indexed<T extends object>(
  collection: T,
  values: () => readonly unknown[],
): T {
  return new Proxy(collection, {
    get(target, property): unknown {
      if (typeof property === "string" && /^(0|[1-9]\d*)$/.test(property)) {
        return values()[Number(property)];
      }
      const value: unknown = Reflect.get(target, property, target);
      return typeof value === "function"
        ? (value as (...arguments_: unknown[]) => unknown).bind(target)
        : value;
    },
  });
}

export class NodeList<T extends Node = Node> implements Iterable<T> {
  readonly [index: number]: T | undefined;
  readonly #values: () => readonly T[];

  constructor(values: () => readonly T[]) {
    this.#values = values;
    return indexed(this, values);
  }

  get length(): number {
    return this.#values().length;
  }

  item(index: number): T | null {
    return this.#values()[index] ?? null;
  }

  [Symbol.iterator](): Iterator<T> {
    return this.#values()[Symbol.iterator]();
  }
}

export class HTMLCollection<
  T extends Element = Element,
  N = T,
> implements Iterable<T> {
  readonly [index: number]: T | undefined;
  readonly #values: () => readonly T[];

  constructor(values: () => readonly T[]) {
    this.#values = values;
    return indexed(this, values);
  }

  get length(): number {
    return this.#values().length;
  }

  item(index: number): T | null {
    return this.#values()[index] ?? null;
  }

  namedItem(name: string): N | null {
    const converted = domString(name);
    if (converted === "") {
      return null;
    }
    return (this.#values().find(
      (element) =>
        element.getAttribute("id") === converted ||
        element.getAttribute("name") === converted,
    ) ?? null) as N | null;
  }

  [Symbol.iterator](): Iterator<T> {
    return this.#values()[Symbol.iterator]();
  }
}

export class NamedNodeMap implements Iterable<Attr> {
  readonly [index: number]: Attr | undefined;
  readonly #element: Element;

  constructor(element: Element) {
    this.#element = element;
    return indexed(this, () => this.#element._attributeNodes);
  }

  get length(): number {
    return this.#element._attributeNodes.length;
  }

  item(index: number): Attr | null {
    return this.#element._attributeNodes[index] ?? null;
  }

  getNamedItem(qualifiedName: string): Attr | null {
    requireArguments(arguments.length, 1);
    return this.#element._getAttributeByName(domString(qualifiedName));
  }

  getNamedItemNS(namespace: string | null, localName: string): Attr | null {
    requireArguments(arguments.length, 2);
    return this.#element._getAttributeByNamespace(
      normalizeNamespace(namespace),
      domString(localName),
    );
  }

  setNamedItem(attribute: Attr): Attr | null {
    requireArguments(arguments.length, 1);
    return this.#element._setAttributeNode(attribute);
  }

  setNamedItemNS(attribute: Attr): Attr | null {
    requireArguments(arguments.length, 1);
    return this.#element._setAttributeNode(attribute);
  }

  removeNamedItem(qualifiedName: string): Attr {
    requireArguments(arguments.length, 1);
    const attribute = this.#element._removeAttributeByName(
      domString(qualifiedName),
    );
    if (attribute === null) {
      throw new DOMException("The attribute was not found", "NotFoundError");
    }
    return attribute;
  }

  removeNamedItemNS(namespace: string | null, localName: string): Attr {
    requireArguments(arguments.length, 2);
    const attribute = this.#element._removeAttributeByNamespace(
      normalizeNamespace(namespace),
      domString(localName),
    );
    if (attribute === null) {
      throw new DOMException("The attribute was not found", "NotFoundError");
    }
    return attribute;
  }

  [Symbol.iterator](): Iterator<Attr> {
    return this.#element._attributeNodes[Symbol.iterator]();
  }
}
