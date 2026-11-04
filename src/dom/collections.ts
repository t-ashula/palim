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
import { HTML_NAMESPACE } from "../namespaces.js";
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

  constructor(implementation?: unknown) {
    if (!(implementation instanceof CollectionImplementation)) {
      throw new TypeError("Illegal constructor");
    }
    bindDOMInterface(this, implementation);
    const proxy = indexed(this, implementation.values);
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

  constructor(implementation?: unknown) {
    if (!(implementation instanceof CollectionImplementation)) {
      throw new TypeError("Illegal constructor");
    }
    bindDOMInterface(this, implementation);
    const proxy = indexed(this, implementation.values);
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
        (element.namespaceURI === HTML_NAMESPACE &&
          element.getAttribute("name") === converted),
    ) ?? null) as N | null;
  }

  [Symbol.iterator](): Iterator<T> {
    return htmlCollectionValues(this)[Symbol.iterator]();
  }
}

export function htmlCollectionSupportedPropertyNames(
  collection: HTMLCollection,
): string[] {
  const names: string[] = [];
  for (const element of htmlCollectionValues(collection)) {
    const id = element.getAttribute("id");
    if (id !== null && id !== "" && !names.includes(id)) {
      names.push(id);
    }
    if (element.namespaceURI !== HTML_NAMESPACE) {
      continue;
    }
    const name = element.getAttribute("name");
    if (name !== null && name !== "" && !names.includes(name)) {
      names.push(name);
    }
  }
  return names;
}

export class NamedNodeMap implements Iterable<Attr> {
  readonly [index: number]: Attr | undefined;

  constructor(implementation?: unknown) {
    if (!(implementation instanceof NamedNodeMapImplementation)) {
      throw new TypeError("Illegal constructor");
    }
    bindDOMInterface(this, implementation);
    const proxy = indexed(this, () => attributeNodes(implementation.element));
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

export function namedNodeMapSupportedPropertyNames(
  attributes: NamedNodeMap,
): string[] {
  const names: string[] = [];
  for (const attribute of attributes) {
    names.push(attribute.name);
  }
  return names;
}

class CollectionImplementation<T> {
  constructor(readonly values: () => readonly T[]) {}
}

export function createCollectionImplementation(
  values: () => readonly unknown[],
): object {
  return new CollectionImplementation(values);
}

export function createNodeList<T extends Node>(
  values: () => readonly T[],
): NodeList<T> {
  return new NodeList<T>(createCollectionImplementation(values));
}

export function createHTMLCollection<T extends Element = Element, N = T>(
  values: () => readonly T[],
): HTMLCollection<T, N> {
  return new HTMLCollection<T, N>(createCollectionImplementation(values));
}

export function createNamedNodeMap(element: Element): NamedNodeMap {
  return new NamedNodeMap(new NamedNodeMapImplementation(element));
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
