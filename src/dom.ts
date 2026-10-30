import {
  closest as closestSelector,
  matches as matchesSelector,
  querySelector as selectFirst,
  querySelectorAll as selectAll,
} from "./selectors.js";
import { HTML_NAMESPACE } from "./namespaces.js";

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

  [Symbol.iterator](): Iterator<T> {
    return this.#values()[Symbol.iterator]();
  }
}

export class NamedNodeMap implements Iterable<Attr> {
  readonly [index: number]: Attr | undefined;
  readonly #values: () => readonly Attr[];

  constructor(values: () => readonly Attr[]) {
    this.#values = values;
    return indexed(this, values);
  }

  get length(): number {
    return this.#values().length;
  }

  item(index: number): Attr | null {
    return this.#values()[index] ?? null;
  }

  [Symbol.iterator](): Iterator<Attr> {
    return this.#values()[Symbol.iterator]();
  }
}

export class Node {
  static readonly ELEMENT_NODE = 1;
  static readonly ATTRIBUTE_NODE = 2;
  static readonly TEXT_NODE = 3;
  static readonly COMMENT_NODE = 8;
  static readonly PROCESSING_INSTRUCTION_NODE = 7;
  static readonly DOCUMENT_NODE = 9;
  static readonly DOCUMENT_TYPE_NODE = 10;
  static readonly DOCUMENT_FRAGMENT_NODE = 11;

  readonly nodeType: number;
  readonly nodeName: string;
  readonly ownerDocument: Document | null;
  readonly childNodes: NodeList;
  readonly _childNodes: Node[] = [];
  _parentNode: Node | null = null;

  constructor(
    nodeType: number,
    nodeName: string,
    ownerDocument: Document | null,
  ) {
    this.nodeType = nodeType;
    this.nodeName = nodeName;
    this.ownerDocument = ownerDocument;
    this.childNodes = new NodeList(() => this._childNodes);
  }

  get parentNode(): Node | null {
    return this._parentNode;
  }

  get parentElement(): Element | null {
    return this._parentNode instanceof Element ? this._parentNode : null;
  }

  get firstChild(): Node | null {
    return this._childNodes[0] ?? null;
  }

  get lastChild(): Node | null {
    return this._childNodes.at(-1) ?? null;
  }

  get previousSibling(): Node | null {
    if (this._parentNode === null) {
      return null;
    }
    const index = this._parentNode._childNodes.indexOf(this);
    return index > 0 ? (this._parentNode._childNodes[index - 1] ?? null) : null;
  }

  get nextSibling(): Node | null {
    if (this._parentNode === null) {
      return null;
    }
    const index = this._parentNode._childNodes.indexOf(this);
    return index < 0 ? null : (this._parentNode._childNodes[index + 1] ?? null);
  }

  get textContent(): string | null {
    return descendantText(this);
  }

  _append(node: Node): void {
    node._remove();
    node._parentNode = this;
    this._childNodes.push(node);
  }

  _insertBefore(node: Node, reference: Node): void {
    node._remove();
    const index = this._childNodes.indexOf(reference);
    node._parentNode = this;
    if (index < 0) {
      this._childNodes.push(node);
    } else {
      this._childNodes.splice(index, 0, node);
    }
  }

  _remove(): void {
    if (this._parentNode === null) {
      return;
    }
    const index = this._parentNode._childNodes.indexOf(this);
    if (index >= 0) {
      this._parentNode._childNodes.splice(index, 1);
    }
    this._parentNode = null;
  }
}

export class Document extends Node {
  readonly contentType = "text/html";
  readonly characterSet = "UTF-8";
  _quirks = true;

  constructor() {
    super(Node.DOCUMENT_NODE, "#document", null);
  }

  get doctype(): DocumentType | null {
    return (
      this._childNodes.find(
        (node): node is DocumentType => node instanceof DocumentType,
      ) ?? null
    );
  }

  get documentElement(): Element | null {
    return (
      this._childNodes.find(
        (node): node is Element => node instanceof Element,
      ) ?? null
    );
  }

  get head(): Element | null {
    return (
      this.documentElement?._childNodes.find(
        (node): node is Element =>
          node instanceof Element && node.localName === "head",
      ) ?? null
    );
  }

  get body(): Element | null {
    return (
      this.documentElement?._childNodes.find(
        (node): node is Element =>
          node instanceof Element &&
          (node.localName === "body" || node.localName === "frameset"),
      ) ?? null
    );
  }

  get compatMode(): "BackCompat" | "CSS1Compat" {
    return this._quirks ? "BackCompat" : "CSS1Compat";
  }

  override get textContent(): null {
    return null;
  }

  querySelector(selectors: string): Element | null {
    return selectFirst(this, selectorArgument(selectors, arguments.length));
  }

  querySelectorAll(selectors: string): NodeList<Element> {
    const result = selectAll(
      this,
      selectorArgument(selectors, arguments.length),
    );
    return new NodeList(() => result);
  }
}

export class DocumentType extends Node {
  readonly name: string;
  readonly publicId: string;
  readonly systemId: string;

  constructor(
    document: Document,
    name: string,
    publicId: string,
    systemId: string,
  ) {
    super(Node.DOCUMENT_TYPE_NODE, name, document);
    this.name = name;
    this.publicId = publicId;
    this.systemId = systemId;
  }

  override get textContent(): null {
    return null;
  }
}

export class Attr extends Node {
  readonly namespaceURI: string | null;
  readonly prefix: string | null;
  readonly localName: string;
  readonly name: string;
  readonly value: string;
  readonly ownerElement: Element;

  constructor(
    document: Document,
    element: Element,
    name: string,
    value: string,
    namespaceURI: string | null = null,
    prefix: string | null = null,
    localName = name,
  ) {
    super(Node.ATTRIBUTE_NODE, name, document);
    this.namespaceURI = namespaceURI;
    this.prefix = prefix;
    this.localName = localName;
    this.name = name;
    this.value = value;
    this.ownerElement = element;
  }

  override get textContent(): string {
    return this.value;
  }
}

export interface AttributeData {
  readonly name: string;
  readonly value: string;
  readonly namespaceURI?: string | null;
  readonly prefix?: string | null;
  readonly localName?: string;
}

export class Element extends Node {
  readonly namespaceURI: string | null;
  readonly prefix: string | null;
  readonly localName: string;
  readonly tagName: string;
  readonly attributes: NamedNodeMap;
  readonly children: HTMLCollection;
  readonly _attributeNodes: Attr[] = [];
  _templateContents: DocumentFragment | null = null;

  constructor(
    document: Document,
    localName: string,
    namespaceURI: string | null = HTML_NAMESPACE,
    prefix: string | null = null,
  ) {
    const qualifiedName =
      prefix === null ? localName : `${prefix}:${localName}`;
    const tagName =
      namespaceURI === HTML_NAMESPACE
        ? qualifiedName.toUpperCase()
        : qualifiedName;
    super(Node.ELEMENT_NODE, tagName, document);
    this.namespaceURI = namespaceURI;
    this.prefix = prefix;
    this.localName = localName;
    this.tagName = tagName;
    this.attributes = new NamedNodeMap(() => this._attributeNodes);
    this.children = new HTMLCollection(() =>
      this._childNodes.filter(
        (node): node is Element => node instanceof Element,
      ),
    );
  }

  get firstElementChild(): Element | null {
    return this.children.item(0);
  }

  get lastElementChild(): Element | null {
    return this.children.item(this.children.length - 1);
  }

  get childElementCount(): number {
    return this.children.length;
  }

  querySelector(selectors: string): Element | null {
    return selectFirst(this, selectorArgument(selectors, arguments.length));
  }

  querySelectorAll(selectors: string): NodeList<Element> {
    const result = selectAll(
      this,
      selectorArgument(selectors, arguments.length),
    );
    return new NodeList(() => result);
  }

  matches(selectors: string): boolean {
    return matchesSelector(this, selectorArgument(selectors, arguments.length));
  }

  closest(selectors: string): Element | null {
    return closestSelector(this, selectorArgument(selectors, arguments.length));
  }

  _setAttributes(attributes: readonly AttributeData[]): void {
    const document = this.ownerDocument;
    if (document === null) {
      throw new TypeError("Element has no owner document");
    }
    for (const attribute of attributes) {
      if (this._attributeNodes.some((item) => item.name === attribute.name)) {
        continue;
      }
      this._attributeNodes.push(
        new Attr(
          document,
          this,
          attribute.name,
          attribute.value,
          attribute.namespaceURI ?? null,
          attribute.prefix ?? null,
          attribute.localName ?? attribute.name,
        ),
      );
    }
  }
}

export class DocumentFragment extends Node {
  readonly children: HTMLCollection;

  constructor(document: Document) {
    super(Node.DOCUMENT_FRAGMENT_NODE, "#document-fragment", document);
    this.children = new HTMLCollection(() =>
      this._childNodes.filter(
        (node): node is Element => node instanceof Element,
      ),
    );
  }

  querySelector(selectors: string): Element | null {
    return selectFirst(this, selectorArgument(selectors, arguments.length));
  }

  querySelectorAll(selectors: string): NodeList<Element> {
    const result = selectAll(
      this,
      selectorArgument(selectors, arguments.length),
    );
    return new NodeList(() => result);
  }
}

export class CharacterData extends Node {
  readonly data: string;

  constructor(
    nodeType: number,
    nodeName: string,
    document: Document,
    data: string,
  ) {
    super(nodeType, nodeName, document);
    this.data = data;
  }

  get length(): number {
    return this.data.length;
  }

  override get textContent(): string {
    return this.data;
  }
}

export class Text extends CharacterData {
  constructor(document: Document, data: string) {
    super(Node.TEXT_NODE, "#text", document, data);
  }
}

export class Comment extends CharacterData {
  constructor(document: Document, data: string) {
    super(Node.COMMENT_NODE, "#comment", document, data);
  }
}

export class ProcessingInstruction extends CharacterData {
  readonly target: string;

  constructor(document: Document, target: string, data: string) {
    super(Node.PROCESSING_INSTRUCTION_NODE, target, document, data);
    this.target = target;
  }
}

function descendantText(node: Node): string {
  let result = "";
  for (const child of node._childNodes) {
    if (child.nodeType === Node.TEXT_NODE) {
      result += (child as CharacterData).data;
    } else {
      result += descendantText(child);
    }
  }
  return result;
}

function selectorArgument(value: unknown, length: number): string {
  if (length === 0) {
    throw new TypeError("1 argument required, but only 0 present");
  }
  if (typeof value === "symbol") {
    throw new TypeError("Cannot convert a Symbol value to a string");
  }
  return String(value);
}
