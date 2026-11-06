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
import {
  asciiLowercase,
  domString,
  normalizeNamespace,
} from "./conversions.js";
import { bindDOMInterface, implementationFor } from "./binding.js";

interface LegacyPlatformObjectConfiguration {
  readonly indexedValues: () => readonly unknown[];
  readonly namedNames?: () => readonly string[];
  readonly namedValue?: (name: string) => unknown;
  readonly namedEnumerable?: boolean;
}

function legacyPlatformObject<T extends object>(
  object: T,
  configuration: LegacyPlatformObjectConfiguration,
): T {
  const supportedIndex = (property: string | symbol): number | null => {
    const index = indexedPropertyIndex(property);
    return index !== null && index < configuration.indexedValues().length
      ? index
      : null;
  };
  const supportedName = (property: string | symbol): string | null =>
    typeof property === "string" &&
    indexedPropertyIndex(property) === null &&
    (configuration.namedNames?.() ?? []).includes(property) &&
    !Reflect.has(object, property)
      ? property
      : null;

  const proxy = new Proxy(object, {
    get(target, property, receiver): unknown {
      const index = supportedIndex(property);
      if (index !== null) {
        return configuration.indexedValues()[index];
      }
      const name = supportedName(property);
      return name === null
        ? Reflect.get(target, property, receiver)
        : configuration.namedValue?.(name);
    },
    has(target, property): boolean {
      return (
        supportedIndex(property) !== null ||
        supportedName(property) !== null ||
        Reflect.has(target, property)
      );
    },
    ownKeys(target): ArrayLike<string | symbol> {
      const targetKeys = Reflect.ownKeys(target);
      const indices = configuration
        .indexedValues()
        .map((_value, index) => String(index));
      const names = (configuration.namedNames?.() ?? []).filter(
        (name) =>
          indexedPropertyIndex(name) === null && !Reflect.has(target, name),
      );
      const virtualKeys = new Set([...indices, ...names]);
      return [
        ...indices,
        ...names,
        ...targetKeys.filter(
          (key) => typeof key === "symbol" || !virtualKeys.has(key),
        ),
      ];
    },
    getOwnPropertyDescriptor(target, property): PropertyDescriptor | undefined {
      const index = supportedIndex(property);
      if (index !== null) {
        return {
          configurable: true,
          enumerable: true,
          value: configuration.indexedValues()[index],
          writable: false,
        };
      }
      const name = supportedName(property);
      return name === null
        ? Reflect.getOwnPropertyDescriptor(target, property)
        : {
            configurable: true,
            enumerable: configuration.namedEnumerable ?? false,
            value: configuration.namedValue?.(name),
            writable: false,
          };
    },
    set(target, property, value, receiver): boolean {
      if (receiver !== proxy) {
        return Reflect.set(target, property, value, receiver);
      }
      if (indexedPropertyIndex(property) !== null) {
        return false;
      }
      return supportedName(property) === null
        ? Reflect.set(target, property, value, receiver)
        : false;
    },
    defineProperty(target, property, attributes): boolean {
      if (
        indexedPropertyIndex(property) !== null ||
        supportedName(property) !== null
      ) {
        return false;
      }
      return Reflect.defineProperty(target, property, attributes);
    },
    deleteProperty(target, property): boolean {
      if (
        supportedIndex(property) !== null ||
        supportedName(property) !== null
      ) {
        return false;
      }
      return Reflect.deleteProperty(target, property);
    },
  });
  return proxy;
}

function indexedPropertyIndex(property: string | symbol): number | null {
  return typeof property === "string" &&
    /^(0|[1-9]\d*)$/.test(property) &&
    Number(property) < 4_294_967_295
    ? Number(property)
    : null;
}

function toUnsignedLong(value: unknown): number {
  const number = Number(value);
  if (!Number.isFinite(number) || number === 0) {
    return 0;
  }
  const integer = Math.trunc(number);
  return ((integer % 4_294_967_296) + 4_294_967_296) % 4_294_967_296;
}

export class NodeList<T extends Node = Node> implements Iterable<T> {
  readonly [index: number]: T | undefined;

  constructor(implementation?: unknown) {
    if (!(implementation instanceof CollectionImplementation)) {
      throw new TypeError("Illegal constructor");
    }
    bindDOMInterface(this, implementation);
    const proxy = legacyPlatformObject(this, {
      indexedValues: implementation.values,
    });
    bindDOMInterface(proxy, implementation);
    return proxy;
  }

  get length(): number {
    return nodeListValues(this).length;
  }

  item(index: number): T | null {
    requireArguments(arguments.length, 1);
    return nodeListValues(this)[toUnsignedLong(index)] ?? null;
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
    const proxy = legacyPlatformObject(this, {
      indexedValues: implementation.values,
      namedNames: () => htmlCollectionSupportedPropertyNames(this),
      namedValue: (name) => this.namedItem(name),
    });
    bindDOMInterface(proxy, implementation);
    return proxy;
  }

  get length(): number {
    return htmlCollectionValues(this).length;
  }

  item(index: number): T | null {
    requireArguments(arguments.length, 1);
    return htmlCollectionValues(this)[toUnsignedLong(index)] ?? null;
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
  collection: HTMLCollection<Element, unknown>,
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
    const proxy = legacyPlatformObject(this, {
      indexedValues: () => attributeNodes(implementation.element),
      namedNames: () => namedNodeMapSupportedPropertyNames(this),
      namedValue: (name) => this.getNamedItem(name),
      namedEnumerable: true,
    });
    bindDOMInterface(proxy, implementation);
    return proxy;
  }

  get length(): number {
    return attributeNodes(namedNodeMapElement(this)).length;
  }

  item(index: number): Attr | null {
    requireArguments(arguments.length, 1);
    return (
      attributeNodes(namedNodeMapElement(this))[toUnsignedLong(index)] ?? null
    );
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
  const element = namedNodeMapElement(attributes);
  const lowercaseOnly =
    element.namespaceURI === HTML_NAMESPACE &&
    element.ownerDocument?.contentType === "text/html";
  for (const attribute of attributes) {
    const name = attribute.name;
    if (
      !names.includes(name) &&
      (!lowercaseOnly || name === asciiLowercase(name))
    ) {
      names.push(name);
    }
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
