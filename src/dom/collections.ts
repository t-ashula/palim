import {
  attributeNodes,
  findAttributeByName,
  findAttributeByNamespace,
  removeAttributeByName,
  removeAttributeByNamespace,
  setAttributeNode,
} from "./nodes.js";
import type { Attr, Element, Node } from "./nodes.js";
import { DOMException } from "../dom-exception.js";
import { requireArguments } from "../web-idl.js";
import { domString, normalizeNamespace } from "./conversions.js";
import { bindDOMInterface, implementationFor } from "./binding.js";

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

  constructor(values: () => readonly T[]) {
    const implementation = new CollectionImplementation(values);
    bindDOMInterface(this, implementation);
    const proxy = indexed(this, values);
    bindDOMInterface(proxy, implementation);
    return proxy;
  }

  get length(): number {
    return nodeListValues(this).length;
  }

  item(index: number): T | null {
    return nodeListValues(this)[index] ?? null;
  }

  [Symbol.iterator](): Iterator<T> {
    return nodeListValues(this)[Symbol.iterator]();
  }
}

export class HTMLCollection<
  T extends Element = Element,
  N = T,
> implements Iterable<T> {
  readonly [index: number]: T | undefined;

  constructor(values: () => readonly T[]) {
    const implementation = new CollectionImplementation(values);
    bindDOMInterface(this, implementation);
    const proxy = indexed(this, values);
    bindDOMInterface(proxy, implementation);
    return proxy;
  }

  get length(): number {
    return htmlCollectionValues(this).length;
  }

  item(index: number): T | null {
    return htmlCollectionValues(this)[index] ?? null;
  }

  namedItem(name: string): N | null {
    const converted = domString(name);
    if (converted === "") {
      return null;
    }
    return (htmlCollectionValues(this).find(
      (element) =>
        element.getAttribute("id") === converted ||
        element.getAttribute("name") === converted,
    ) ?? null) as N | null;
  }

  [Symbol.iterator](): Iterator<T> {
    return htmlCollectionValues(this)[Symbol.iterator]();
  }
}

export class NamedNodeMap implements Iterable<Attr> {
  readonly [index: number]: Attr | undefined;

  constructor(element: Element) {
    const implementation = new NamedNodeMapImplementation(element);
    bindDOMInterface(this, implementation);
    const proxy = indexed(this, () => attributeNodes(element));
    bindDOMInterface(proxy, implementation);
    return proxy;
  }

  get length(): number {
    return attributeNodes(namedNodeMapElement(this)).length;
  }

  item(index: number): Attr | null {
    return attributeNodes(namedNodeMapElement(this))[index] ?? null;
  }

  getNamedItem(qualifiedName: string): Attr | null {
    requireArguments(arguments.length, 1);
    return findAttributeByName(
      namedNodeMapElement(this),
      domString(qualifiedName),
    );
  }

  getNamedItemNS(namespace: string | null, localName: string): Attr | null {
    requireArguments(arguments.length, 2);
    return findAttributeByNamespace(
      namedNodeMapElement(this),
      normalizeNamespace(namespace),
      domString(localName),
    );
  }

  setNamedItem(attribute: Attr): Attr | null {
    requireArguments(arguments.length, 1);
    return setAttributeNode(namedNodeMapElement(this), attribute);
  }

  setNamedItemNS(attribute: Attr): Attr | null {
    requireArguments(arguments.length, 1);
    return setAttributeNode(namedNodeMapElement(this), attribute);
  }

  removeNamedItem(qualifiedName: string): Attr {
    requireArguments(arguments.length, 1);
    const attribute = removeAttributeByName(
      namedNodeMapElement(this),
      domString(qualifiedName),
    );
    if (attribute === null) {
      throw new DOMException("The attribute was not found", "NotFoundError");
    }
    return attribute;
  }

  removeNamedItemNS(namespace: string | null, localName: string): Attr {
    requireArguments(arguments.length, 2);
    const attribute = removeAttributeByNamespace(
      namedNodeMapElement(this),
      normalizeNamespace(namespace),
      domString(localName),
    );
    if (attribute === null) {
      throw new DOMException("The attribute was not found", "NotFoundError");
    }
    return attribute;
  }

  [Symbol.iterator](): Iterator<Attr> {
    return attributeNodes(namedNodeMapElement(this))[Symbol.iterator]();
  }
}

class CollectionImplementation<T> {
  constructor(readonly values: () => readonly T[]) {}
}

function collectionValues(collection: object): readonly unknown[] {
  return (
    implementationFor(collection) as CollectionImplementation<unknown>
  ).values();
}

function nodeListValues<T extends Node>(collection: NodeList<T>): readonly T[] {
  return collectionValues(collection) as readonly T[];
}

function htmlCollectionValues<T extends Element>(
  collection: HTMLCollection<T, unknown>,
): readonly T[] {
  return collectionValues(collection) as readonly T[];
}

class NamedNodeMapImplementation {
  constructor(readonly element: Element) {}
}

function namedNodeMapElement(collection: NamedNodeMap): Element {
  return (implementationFor(collection) as NamedNodeMapImplementation).element;
}
