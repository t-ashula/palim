import {
  closest as closestSelector,
  matches as matchesSelector,
  querySelector as selectFirst,
  querySelectorAll as selectAll,
} from "../selectors.js";
import { DOMException } from "../dom-exception.js";
import { HTML_NAMESPACE } from "../namespaces.js";
import { HTMLCollection, NamedNodeMap, NodeList } from "./collections.js";
import {
  asciiLowercase,
  domString,
  normalizeNamespace,
  validateAndExtract,
  validateAndExtractElement,
  validateElementLocalName,
  validateName,
} from "./conversions.js";
import { EventTarget } from "./events.js";
import { DOMTokenList } from "./token-list.js";
import { GET_PARSE_ERRORS } from "../html/parse-errors.js";
import type {
  PalimParseError,
  ParseErrorSource,
} from "../html/parse-errors.js";
import {
  serializeHTMLFragment,
  serializeHTMLElement,
} from "../html/serializer.js";
import {
  serializeXMLFragment,
  serializeXMLElement,
} from "../xml/serializer.js";

const DOCUMENT_PARSE_ERRORS = Symbol("document parse errors");

export interface FragmentParser {
  parse(input: string, context: Element): DocumentFragment;
}

export interface ElementCreationOptions {
  readonly customElementRegistry?: unknown;
  readonly is?: string;
}

export interface ImportNodeOptions {
  readonly customElementRegistry?: unknown;
  readonly selfOnly?: boolean;
}

export interface GetRootNodeOptions {
  readonly composed?: boolean;
}

type CreateElementArguments = [
  localName?: string,
  options?: string | ElementCreationOptions,
];

type CreateElementNSArguments = [
  namespace?: string | null,
  qualifiedName?: string,
  options?: string | ElementCreationOptions,
];

type CreateCharacterDataArguments = [data?: string];

export type ElementFactory = (
  document: Document,
  localName: string,
  namespaceURI: string | null,
  prefix: string | null,
) => Element;

export class Node extends EventTarget {
  static readonly ELEMENT_NODE = 1;
  static readonly ATTRIBUTE_NODE = 2;
  static readonly TEXT_NODE = 3;
  static readonly CDATA_SECTION_NODE = 4;
  static readonly COMMENT_NODE = 8;
  static readonly PROCESSING_INSTRUCTION_NODE = 7;
  static readonly DOCUMENT_NODE = 9;
  static readonly DOCUMENT_TYPE_NODE = 10;
  static readonly DOCUMENT_FRAGMENT_NODE = 11;

  static readonly DOCUMENT_POSITION_DISCONNECTED = 0x01;
  static readonly DOCUMENT_POSITION_PRECEDING = 0x02;
  static readonly DOCUMENT_POSITION_FOLLOWING = 0x04;
  static readonly DOCUMENT_POSITION_CONTAINS = 0x08;
  static readonly DOCUMENT_POSITION_CONTAINED_BY = 0x10;
  static readonly DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC = 0x20;

  readonly nodeType: number;
  readonly nodeName: string;
  readonly childNodes: NodeList;
  readonly _childNodes: Node[] = [];
  _ownerDocument: Document | null;
  _parentNode: Node | null = null;

  constructor(
    nodeType: number,
    nodeName: string,
    ownerDocument: Document | null,
  ) {
    super();
    this.nodeType = nodeType;
    this.nodeName = nodeName;
    this._ownerDocument = ownerDocument;
    this.childNodes = new NodeList(() => this._childNodes);
  }

  override _eventParent(): EventTarget | null {
    return this._parentNode;
  }

  get ownerDocument(): Document | null {
    return this._ownerDocument;
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

  normalize(): void {
    normalizeDescendantText(this);
  }

  getRootNode(_options: GetRootNodeOptions = {}): Node {
    return nodeRoot(this);
  }

  contains(other: Node | null): boolean {
    const node = nullableNode(other);
    return node !== null && isInclusiveAncestor(this, node);
  }

  compareDocumentPosition(other: Node): number {
    requireNodeArgument(other, arguments.length);
    return compareNodePosition(this, other);
  }

  isEqualNode(otherNode: Node | null): boolean {
    const node = nullableNode(otherNode);
    return node !== null && equalNodes(this, node);
  }

  isSameNode(otherNode: Node | null): boolean {
    return nullableNode(otherNode) === this;
  }

  cloneNode(subtree = false): Node {
    const document = this instanceof Document ? this : this.ownerDocument;
    if (document === null) {
      throw new TypeError("Node has no owner document");
    }
    return cloneNodeIntoDocument(this, document, subtree);
  }

  appendChild<T extends Node>(node: T): T {
    requireNodeArgument(node, arguments.length);
    preInsert(node, this, null);
    return node;
  }

  insertBefore<T extends Node>(node: T, child: Node | null): T {
    requireNodeArgument(node, arguments.length);
    if (child !== null && !(child instanceof Node)) {
      throw new TypeError("The child is not a Node");
    }
    preInsert(node, this, child);
    return node;
  }

  replaceChild<T extends Node>(node: Node, child: T): T {
    if (arguments.length < 2) {
      throw new TypeError("2 arguments required");
    }
    if (!(node instanceof Node) || !(child instanceof Node)) {
      throw new TypeError("The argument is not a Node");
    }
    if (child._parentNode !== this) {
      throw new DOMException(
        "The node to be replaced is not a child of this node",
        "NotFoundError",
      );
    }
    if (node === child) {
      return child;
    }

    let reference = child.nextSibling;
    if (reference === node) {
      reference = node.nextSibling;
    }
    ensurePreInsertionValidity(node, this, reference, child);
    child._remove();
    insertNodes(node, this, reference);
    return child;
  }

  removeChild<T extends Node>(child: T): T {
    requireNodeArgument(child, arguments.length);
    if (child._parentNode !== this) {
      throw new DOMException(
        "The node to be removed is not a child of this node",
        "NotFoundError",
      );
    }
    child._remove();
    return child;
  }

  remove(): void {
    this._remove();
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

export class Document extends Node implements ParseErrorSource {
  readonly contentType: string;
  readonly characterSet = "UTF-8";
  readonly _fragmentParser: FragmentParser | null;
  readonly _elementFactory: ElementFactory;
  _templateContentsOwnerDocument: Document | null = null;
  _quirks = true;
  [DOCUMENT_PARSE_ERRORS]: readonly PalimParseError[] = [];

  constructor(
    fragmentParser: FragmentParser | null = null,
    contentType = "application/xml",
    elementFactory: ElementFactory = defaultElementFactory,
  ) {
    super(Node.DOCUMENT_NODE, "#document", null);
    this._fragmentParser = fragmentParser;
    this.contentType = contentType;
    this._elementFactory = elementFactory;
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

  createElement(
    localName: string,
    options?: string | ElementCreationOptions,
  ): Element;
  createElement(...parameters: CreateElementArguments): Element {
    if (parameters.length < 1) {
      throw new TypeError("1 argument required");
    }
    const [localName, options] = parameters;
    let convertedName = domString(localName);
    convertElementCreationOptions(options);
    validateElementLocalName(convertedName);
    if (this.contentType === "text/html") {
      convertedName = asciiLowercase(convertedName);
    }
    const namespaceURI =
      this.contentType === "text/html" ||
      this.contentType === "application/xhtml+xml"
        ? HTML_NAMESPACE
        : null;
    return this._createElement(convertedName, namespaceURI, null);
  }

  createElementNS(
    namespace: string | null,
    qualifiedName: string,
    options?: string | ElementCreationOptions,
  ): Element;
  createElementNS(...parameters: CreateElementNSArguments): Element {
    if (parameters.length < 2) {
      throw new TypeError("2 arguments required");
    }
    const [namespace, qualifiedName, options] = parameters;
    const convertedNamespace = normalizeNamespace(namespace);
    const convertedName = domString(qualifiedName);
    convertElementCreationOptions(options);
    const extracted = validateAndExtractElement(
      convertedNamespace,
      convertedName,
    );
    return this._createElement(
      extracted.localName,
      extracted.namespace,
      extracted.prefix,
    );
  }

  createDocumentFragment(): DocumentFragment {
    return new DocumentFragment(this);
  }

  createTextNode(data: string): Text;
  createTextNode(...parameters: CreateCharacterDataArguments): Text {
    if (parameters.length < 1) {
      throw new TypeError("1 argument required");
    }
    const [data] = parameters;
    return new Text(this, domString(data));
  }

  createComment(data: string): Comment;
  createComment(...parameters: CreateCharacterDataArguments): Comment {
    if (parameters.length < 1) {
      throw new TypeError("1 argument required");
    }
    const [data] = parameters;
    return new Comment(this, domString(data));
  }

  importNode<T extends Node>(
    node: T,
    options: boolean | ImportNodeOptions = false,
  ): T {
    requireNode(node);
    if (node instanceof Document) {
      throw new DOMException(
        "A document cannot be imported",
        "NotSupportedError",
      );
    }
    return cloneNodeIntoDocument(node, this, importNodeSubtree(options)) as T;
  }

  adoptNode<T extends Node>(node: T): T {
    requireNode(node);
    if (node instanceof Document) {
      throw new DOMException(
        "A document cannot be adopted",
        "NotSupportedError",
      );
    }
    adopt(node, this);
    return node;
  }

  _createElement(
    localName: string,
    namespaceURI: string | null,
    prefix: string | null = null,
  ): Element {
    return this._elementFactory(this, localName, namespaceURI, prefix);
  }

  _templateContentsDocument(): Document {
    this._templateContentsOwnerDocument ??= new Document(
      this._fragmentParser,
      this.contentType,
      this._elementFactory,
    );
    return this._templateContentsOwnerDocument;
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

  [GET_PARSE_ERRORS](): readonly PalimParseError[] {
    return this[DOCUMENT_PARSE_ERRORS];
  }
}

export function setDocumentParseErrors(
  document: Document,
  errors: readonly PalimParseError[],
): void {
  document[DOCUMENT_PARSE_ERRORS] = Object.freeze(
    errors.map((error) => Object.freeze({ ...error })),
  );
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
  readonly localName: string;
  prefix: string | null;
  name: string;
  value: string;
  _ownerElement: Element | null;

  constructor(
    document: Document,
    element: Element | null,
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
    this._ownerElement = element;
  }

  get ownerElement(): Element | null {
    return this._ownerElement;
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
  #classList: DOMTokenList | null = null;

  constructor(
    document: Document,
    localName: string,
    namespaceURI: string | null = HTML_NAMESPACE,
    prefix: string | null = null,
  ) {
    const qualifiedName =
      prefix === null ? localName : `${prefix}:${localName}`;
    const tagName =
      namespaceURI === HTML_NAMESPACE && document.contentType === "text/html"
        ? qualifiedName.toUpperCase()
        : qualifiedName;
    super(Node.ELEMENT_NODE, tagName, document);
    this.namespaceURI = namespaceURI;
    this.prefix = prefix;
    this.localName = localName;
    this.tagName = tagName;
    this.attributes = new NamedNodeMap(this);
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

  get id(): string {
    return this.getAttribute("id") ?? "";
  }

  set id(value: string) {
    this.setAttribute("id", domString(value));
  }

  get className(): string {
    return this.getAttribute("class") ?? "";
  }

  set className(value: string) {
    this.setAttribute("class", domString(value));
  }

  get classList(): DOMTokenList {
    this.#classList ??= new DOMTokenList(this, "class");
    return this.#classList;
  }

  get innerHTML(): string {
    return this.#isHTMLDocument()
      ? serializeHTMLFragment(this)
      : serializeXMLFragment(this);
  }

  set innerHTML(value: string) {
    const fragment = this.#parseFragment(domString(value), this);
    const target = this._templateContents ?? this;
    while (target.firstChild !== null) {
      target.removeChild(target.firstChild);
    }
    target.appendChild(fragment);
  }

  get outerHTML(): string {
    return this.#isHTMLDocument()
      ? serializeHTMLElement(this)
      : serializeXMLElement(this);
  }

  set outerHTML(value: string) {
    const parent = this.parentNode;
    if (parent === null) {
      return;
    }
    if (parent instanceof Document) {
      throw new DOMException(
        "The element's parent is a document",
        "NoModificationAllowedError",
      );
    }
    const context =
      parent instanceof Element ? parent : this.#bodyFragmentContext();
    const fragment = this.#parseFragment(domString(value), context);
    parent.replaceChild(fragment, this);
  }

  insertAdjacentHTML(position: string, text: string): void {
    const normalizedPosition = asciiLowercase(domString(position));
    const input = domString(text);
    if (
      normalizedPosition !== "beforebegin" &&
      normalizedPosition !== "afterbegin" &&
      normalizedPosition !== "beforeend" &&
      normalizedPosition !== "afterend"
    ) {
      throw new DOMException(
        `Invalid insertAdjacentHTML position: ${normalizedPosition}`,
        "SyntaxError",
      );
    }

    if (
      normalizedPosition === "beforebegin" ||
      normalizedPosition === "afterend"
    ) {
      const parent = this.parentNode;
      if (parent === null || parent instanceof Document) {
        throw new DOMException(
          "The element has no modifiable parent",
          "NoModificationAllowedError",
        );
      }
      const context =
        parent instanceof Element &&
        !(parent.namespaceURI === HTML_NAMESPACE && parent.localName === "html")
          ? parent
          : this.#bodyFragmentContext();
      const fragment = this.#parseFragment(input, context);
      parent.insertBefore(
        fragment,
        normalizedPosition === "beforebegin" ? this : this.nextSibling,
      );
      return;
    }

    const context =
      this.namespaceURI === HTML_NAMESPACE && this.localName === "html"
        ? this.#bodyFragmentContext()
        : this;
    const fragment = this.#parseFragment(input, context);
    this.insertBefore(
      fragment,
      normalizedPosition === "afterbegin" ? this.firstChild : null,
    );
  }

  getAttribute(qualifiedName: string): string | null {
    return this._getAttributeByName(domString(qualifiedName))?.value ?? null;
  }

  getAttributeNS(namespace: string | null, localName: string): string | null {
    return (
      this._getAttributeByNamespace(
        normalizeNamespace(namespace),
        domString(localName),
      )?.value ?? null
    );
  }

  getAttributeNames(): string[] {
    return this._attributeNodes.map((attribute) => attribute.name);
  }

  hasAttribute(qualifiedName: string): boolean {
    return this._getAttributeByName(domString(qualifiedName)) !== null;
  }

  hasAttributeNS(namespace: string | null, localName: string): boolean {
    return (
      this._getAttributeByNamespace(
        normalizeNamespace(namespace),
        domString(localName),
      ) !== null
    );
  }

  setAttribute(qualifiedName: string, value: string): void {
    if (arguments.length < 2) {
      throw new TypeError("2 arguments required");
    }
    const name = this.#attributeName(domString(qualifiedName));
    validateName(name);
    const convertedValue = domString(value);
    const attribute = this._getAttributeByName(name);
    if (attribute !== null) {
      attribute.value = convertedValue;
      return;
    }
    this._setAttributeNode(
      new Attr(this.#document(), this, name, convertedValue),
    );
  }

  setAttributeNS(
    namespace: string | null,
    qualifiedName: string,
    value: string,
  ): void {
    if (arguments.length < 3) {
      throw new TypeError("3 arguments required");
    }
    const normalizedNamespace = normalizeNamespace(namespace);
    const extracted = validateAndExtract(
      normalizedNamespace,
      domString(qualifiedName),
    );
    const convertedValue = domString(value);
    const attribute = this._getAttributeByNamespace(
      normalizedNamespace,
      extracted.localName,
    );
    if (attribute !== null) {
      attribute.prefix = extracted.prefix;
      attribute.name = extracted.qualifiedName;
      attribute.value = convertedValue;
      return;
    }
    this._setAttributeNode(
      new Attr(
        this.#document(),
        this,
        extracted.qualifiedName,
        convertedValue,
        normalizedNamespace,
        extracted.prefix,
        extracted.localName,
      ),
    );
  }

  removeAttribute(qualifiedName: string): void {
    this._removeAttributeByName(domString(qualifiedName));
  }

  removeAttributeNS(namespace: string | null, localName: string): void {
    this._removeAttributeByNamespace(
      normalizeNamespace(namespace),
      domString(localName),
    );
  }

  toggleAttribute(qualifiedName: string, force?: boolean): boolean {
    if (arguments.length === 0) {
      throw new TypeError("1 argument required");
    }
    const name = this.#attributeName(domString(qualifiedName));
    validateName(name);
    const attribute = this._getAttributeByName(name);
    if (attribute === null) {
      if (arguments.length < 2 || Boolean(force)) {
        this._setAttributeNode(new Attr(this.#document(), this, name, ""));
        return true;
      }
      return false;
    }
    if (arguments.length < 2 || !Boolean(force)) {
      this._removeAttribute(attribute);
      return false;
    }
    return true;
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

  #attributeName(name: string): string {
    return this.namespaceURI === HTML_NAMESPACE &&
      this.ownerDocument?.contentType === "text/html"
      ? asciiLowercase(name)
      : name;
  }

  #document(): Document {
    const document = this.ownerDocument;
    if (document === null) {
      throw new TypeError("Element has no owner document");
    }
    return document;
  }

  #bodyFragmentContext(): Element {
    return this.#document()._createElement("body", HTML_NAMESPACE);
  }

  #isHTMLDocument(): boolean {
    return this.#document().contentType === "text/html";
  }

  #parseFragment(input: string, context: Element): DocumentFragment {
    const parser = this.#document()._fragmentParser;
    if (parser === null) {
      throw new TypeError("Document has no fragment parser");
    }
    return parser.parse(input, context);
  }

  _getAttributeByName(qualifiedName: string): Attr | null {
    const name = this.#attributeName(qualifiedName);
    return (
      this._attributeNodes.find((attribute) => attribute.name === name) ?? null
    );
  }

  _getAttributeByNamespace(
    namespace: string | null,
    localName: string,
  ): Attr | null {
    return (
      this._attributeNodes.find(
        (attribute) =>
          attribute.namespaceURI === namespace &&
          attribute.localName === localName,
      ) ?? null
    );
  }

  _setAttributeNode(value: unknown): Attr | null {
    if (!(value instanceof Attr)) {
      throw new TypeError("The argument is not an Attr");
    }
    if (value._ownerElement !== null && value._ownerElement !== this) {
      throw new DOMException(
        "The attribute is already in use",
        "InUseAttributeError",
      );
    }
    const oldAttribute = this._getAttributeByNamespace(
      value.namespaceURI,
      value.localName,
    );
    if (oldAttribute === value) {
      return value;
    }
    value._ownerElement = this;
    if (oldAttribute === null) {
      this._attributeNodes.push(value);
      return null;
    }
    const index = this._attributeNodes.indexOf(oldAttribute);
    this._attributeNodes[index] = value;
    oldAttribute._ownerElement = null;
    return oldAttribute;
  }

  _removeAttributeByName(qualifiedName: string): Attr | null {
    const attribute = this._getAttributeByName(qualifiedName);
    if (attribute !== null) {
      this._removeAttribute(attribute);
    }
    return attribute;
  }

  _removeAttributeByNamespace(
    namespace: string | null,
    localName: string,
  ): Attr | null {
    const attribute = this._getAttributeByNamespace(namespace, localName);
    if (attribute !== null) {
      this._removeAttribute(attribute);
    }
    return attribute;
  }

  _removeAttribute(attribute: Attr): void {
    const index = this._attributeNodes.indexOf(attribute);
    if (index < 0) {
      return;
    }
    this._attributeNodes.splice(index, 1);
    attribute._ownerElement = null;
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
      this._setAttributeNode(
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
  _data: string;

  constructor(
    nodeType: number,
    nodeName: string,
    document: Document,
    data: string,
  ) {
    super(nodeType, nodeName, document);
    this._data = data;
  }

  get data(): string {
    return this._data;
  }

  get length(): number {
    return this.data.length;
  }

  override get textContent(): string {
    return this.data;
  }

  _replaceData(offset: number, count: number, data: string): void {
    if (offset > this.length) {
      throw new DOMException(
        "The offset exceeds the data length",
        "IndexSizeError",
      );
    }
    const removed = Math.min(count, this.length - offset);
    this._data =
      this._data.slice(0, offset) + data + this._data.slice(offset + removed);
  }

  _appendData(data: string): void {
    this._replaceData(this.length, 0, data);
  }
}

export class Text extends CharacterData {
  constructor(document: Document, data: string) {
    super(Node.TEXT_NODE, "#text", document, data);
  }
}

export class CDATASection extends CharacterData {
  constructor(document: Document, data: string) {
    super(Node.CDATA_SECTION_NODE, "#cdata-section", document, data);
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

export function cloneNodeIntoDocument(
  node: Node,
  document: Document,
  subtree: boolean,
): Node {
  const copy = cloneSingleNode(node, document);
  const childDocument = copy instanceof Document ? copy : document;

  if (
    subtree &&
    node instanceof Element &&
    copy instanceof Element &&
    node._templateContents !== null &&
    copy._templateContents !== null
  ) {
    const templateDocument = copy._templateContents.ownerDocument;
    if (templateDocument === null) {
      throw new TypeError("Template contents have no owner document");
    }
    for (const child of node._templateContents._childNodes) {
      copy._templateContents._append(
        cloneNodeIntoDocument(child, templateDocument, true),
      );
    }
  }

  if (subtree) {
    for (const child of node._childNodes) {
      copy._append(cloneNodeIntoDocument(child, childDocument, true));
    }
  }
  return copy;
}

function cloneSingleNode(node: Node, document: Document): Node {
  if (node instanceof Element) {
    const copy = document._createElement(
      node.localName,
      node.namespaceURI,
      node.prefix,
    );
    copy._setAttributes(
      node._attributeNodes.map((attribute) => ({
        name: attribute.name,
        value: attribute.value,
        namespaceURI: attribute.namespaceURI,
        prefix: attribute.prefix,
        localName: attribute.localName,
      })),
    );
    return copy;
  }
  if (node instanceof Document) {
    const copy = new Document(
      node._fragmentParser,
      node.contentType,
      node._elementFactory,
    );
    copy._quirks = node._quirks;
    return copy;
  }
  if (node instanceof DocumentType) {
    return new DocumentType(document, node.name, node.publicId, node.systemId);
  }
  if (node instanceof Attr) {
    return new Attr(
      document,
      null,
      node.name,
      node.value,
      node.namespaceURI,
      node.prefix,
      node.localName,
    );
  }
  if (node instanceof Text) {
    return new Text(document, node.data);
  }
  if (node instanceof CDATASection) {
    return new CDATASection(document, node.data);
  }
  if (node instanceof Comment) {
    return new Comment(document, node.data);
  }
  if (node instanceof ProcessingInstruction) {
    return new ProcessingInstruction(document, node.target, node.data);
  }
  if (node instanceof DocumentFragment) {
    return new DocumentFragment(document);
  }
  if (node instanceof CharacterData) {
    return new CharacterData(node.nodeType, node.nodeName, document, node.data);
  }
  return new Node(node.nodeType, node.nodeName, document);
}

function defaultElementFactory(
  document: Document,
  localName: string,
  namespaceURI: string | null,
  prefix: string | null,
): Element {
  return new Element(document, localName, namespaceURI, prefix);
}

function convertElementCreationOptions(options: unknown): void {
  if (options === undefined) {
    return;
  }
  if (typeof options !== "object" || options === null) {
    domString(options);
    return;
  }
  const isValue: unknown = (options as ElementCreationOptions).is;
  if (isValue !== undefined) {
    domString(isValue);
  }
}

function importNodeSubtree(options: unknown): boolean {
  if (
    (typeof options === "object" && options !== null) ||
    typeof options === "function"
  ) {
    return !Boolean((options as ImportNodeOptions).selfOnly);
  }
  return Boolean(options);
}

function descendantText(node: Node): string {
  let result = "";
  for (const child of node._childNodes) {
    if (
      child.nodeType === Node.TEXT_NODE ||
      child.nodeType === Node.CDATA_SECTION_NODE
    ) {
      result += (child as CharacterData).data;
    } else {
      result += descendantText(child);
    }
  }
  return result;
}

function normalizeDescendantText(node: Node): void {
  let index = 0;
  while (index < node._childNodes.length) {
    const child = node._childNodes[index];
    if (child === undefined) {
      break;
    }
    if (child instanceof Text) {
      if (child.length === 0) {
        child._remove();
        continue;
      }

      let data = "";
      let sibling = child.nextSibling;
      while (sibling instanceof Text) {
        data += sibling.data;
        sibling = sibling.nextSibling;
      }
      child._appendData(data);
      while (child.nextSibling instanceof Text) {
        child.nextSibling._remove();
      }
    } else {
      normalizeDescendantText(child);
    }
    index += 1;
  }
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

function requireNodeArgument(
  value: unknown,
  argumentCount: number,
): asserts value is Node {
  if (argumentCount === 0) {
    throw new TypeError("1 argument required");
  }
  if (!(value instanceof Node)) {
    throw new TypeError("The argument is not a Node");
  }
}

function requireNode(value: unknown): asserts value is Node {
  if (!(value instanceof Node)) {
    throw new TypeError("The argument is not a Node");
  }
}

function nullableNode(value: unknown): Node | null {
  if (value === null || value === undefined) {
    return null;
  }
  requireNode(value);
  return value;
}

function preInsert(node: Node, parent: Node, child: Node | null): void {
  if (child !== null && child._parentNode !== parent) {
    throw new DOMException(
      "The reference node is not a child of this node",
      "NotFoundError",
    );
  }
  let reference = child;
  if (reference === node) {
    reference = node.nextSibling;
  }
  ensurePreInsertionValidity(node, parent, reference);
  insertNodes(node, parent, reference);
}

function ensurePreInsertionValidity(
  node: Node,
  parent: Node,
  child: Node | null,
  replacedChild: Node | null = null,
): void {
  if (
    !(parent instanceof Document) &&
    !(parent instanceof DocumentFragment) &&
    !(parent instanceof Element)
  ) {
    throw new DOMException(
      "This node type cannot have children",
      "HierarchyRequestError",
    );
  }
  if (isInclusiveAncestor(node, parent)) {
    throw new DOMException(
      "The new child is an ancestor of this node",
      "HierarchyRequestError",
    );
  }
  if (child !== null && child._parentNode !== parent) {
    throw new DOMException(
      "The reference node is not a child of this node",
      "NotFoundError",
    );
  }
  if (!isInsertableNode(node)) {
    throw new DOMException(
      "This node type cannot be inserted",
      "HierarchyRequestError",
    );
  }
  if (node instanceof Text && parent instanceof Document) {
    throw new DOMException(
      "Text nodes cannot be children of a document",
      "HierarchyRequestError",
    );
  }
  if (node instanceof DocumentType && !(parent instanceof Document)) {
    throw new DOMException(
      "DocumentType nodes can only be children of a document",
      "HierarchyRequestError",
    );
  }
  if (parent instanceof Document) {
    validateDocumentInsertion(node, parent, child, replacedChild);
  }
}

function isInsertableNode(node: Node): boolean {
  return (
    node instanceof DocumentFragment ||
    node instanceof DocumentType ||
    node instanceof Element ||
    node instanceof CharacterData
  );
}

function isInclusiveAncestor(ancestor: Node, node: Node): boolean {
  let current: Node | null = node;
  while (current !== null) {
    if (current === ancestor) {
      return true;
    }
    current = current._parentNode;
  }
  return false;
}

function nodeRoot(node: Node): Node {
  let root = node;
  while (root._parentNode !== null) {
    root = root._parentNode;
  }
  return root;
}

const disconnectedNodeIds = new WeakMap<Node, number>();
let nextDisconnectedNodeId = 1;

function disconnectedNodeId(node: Node): number {
  const existing = disconnectedNodeIds.get(node);
  if (existing !== undefined) {
    return existing;
  }
  const id = nextDisconnectedNodeId;
  nextDisconnectedNodeId += 1;
  disconnectedNodeIds.set(node, id);
  return id;
}

function compareNodePosition(node: Node, other: Node): number {
  if (node === other) {
    return 0;
  }

  let node1: Node | null = other;
  let node2: Node | null = node;
  const attribute1 = node1 instanceof Attr ? node1 : null;
  const attribute2 = node2 instanceof Attr ? node2 : null;

  if (attribute1 !== null) {
    node1 = attribute1._ownerElement;
  }
  if (attribute2 !== null) {
    const ownerElement = attribute2._ownerElement;
    node2 = ownerElement;
    if (
      attribute1 !== null &&
      ownerElement !== null &&
      node1 === ownerElement
    ) {
      for (const attribute of ownerElement._attributeNodes) {
        if (attribute === attribute1) {
          return (
            Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC |
            Node.DOCUMENT_POSITION_PRECEDING
          );
        }
        if (attribute === attribute2) {
          return (
            Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC |
            Node.DOCUMENT_POSITION_FOLLOWING
          );
        }
      }
    }
  }

  if (node1 === null || node2 === null || nodeRoot(node1) !== nodeRoot(node2)) {
    const relativePosition =
      disconnectedNodeId(other) < disconnectedNodeId(node)
        ? Node.DOCUMENT_POSITION_PRECEDING
        : Node.DOCUMENT_POSITION_FOLLOWING;
    return (
      Node.DOCUMENT_POSITION_DISCONNECTED |
      Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC |
      relativePosition
    );
  }

  if (
    (attribute1 === null && isInclusiveAncestor(node1, node2)) ||
    (node1 === node2 && attribute2 !== null)
  ) {
    return Node.DOCUMENT_POSITION_CONTAINS | Node.DOCUMENT_POSITION_PRECEDING;
  }

  if (
    (attribute2 === null && isInclusiveAncestor(node2, node1)) ||
    (node1 === node2 && attribute1 !== null)
  ) {
    return (
      Node.DOCUMENT_POSITION_CONTAINED_BY | Node.DOCUMENT_POSITION_FOLLOWING
    );
  }

  return treePrecedes(node1, node2)
    ? Node.DOCUMENT_POSITION_PRECEDING
    : Node.DOCUMENT_POSITION_FOLLOWING;
}

function treePrecedes(node1: Node, node2: Node): boolean {
  if (isInclusiveAncestor(node1, node2)) {
    return true;
  }
  if (isInclusiveAncestor(node2, node1)) {
    return false;
  }

  const ancestors1 = ancestorPath(node1);
  const ancestors2 = ancestorPath(node2);
  let index = 0;
  while (
    ancestors1[index] !== undefined &&
    ancestors1[index] === ancestors2[index]
  ) {
    index += 1;
  }
  const parent = ancestors1[index - 1];
  const child1 = ancestors1[index];
  const child2 = ancestors2[index];
  if (parent === undefined || child1 === undefined || child2 === undefined) {
    throw new TypeError("Cannot compare nodes from different trees");
  }
  return (
    parent._childNodes.indexOf(child1) < parent._childNodes.indexOf(child2)
  );
}

function ancestorPath(node: Node): Node[] {
  const path: Node[] = [];
  let current: Node | null = node;
  while (current !== null) {
    path.push(current);
    current = current._parentNode;
  }
  path.reverse();
  return path;
}

function equalNodes(node: Node, other: Node): boolean {
  if (!sameNodeInterface(node, other) || !sameNodeData(node, other)) {
    return false;
  }
  if (node._childNodes.length !== other._childNodes.length) {
    return false;
  }
  return node._childNodes.every((child, index) => {
    const otherChild = other._childNodes[index];
    return otherChild !== undefined && equalNodes(child, otherChild);
  });
}

function sameNodeInterface(node: Node, other: Node): boolean {
  if (node instanceof Document) {
    return other instanceof Document;
  }
  if (node instanceof DocumentType) {
    return other instanceof DocumentType;
  }
  if (node instanceof Attr) {
    return other instanceof Attr;
  }
  if (node instanceof Element) {
    return other instanceof Element;
  }
  if (node instanceof DocumentFragment) {
    return other instanceof DocumentFragment;
  }
  if (node instanceof CDATASection) {
    return other instanceof CDATASection;
  }
  if (node instanceof Text) {
    return other instanceof Text;
  }
  if (node instanceof Comment) {
    return other instanceof Comment;
  }
  if (node instanceof ProcessingInstruction) {
    return other instanceof ProcessingInstruction;
  }
  return node.constructor === other.constructor;
}

function sameNodeData(node: Node, other: Node): boolean {
  if (node instanceof DocumentType && other instanceof DocumentType) {
    return (
      node.name === other.name &&
      node.publicId === other.publicId &&
      node.systemId === other.systemId
    );
  }
  if (node instanceof Element && other instanceof Element) {
    return (
      node.namespaceURI === other.namespaceURI &&
      node.prefix === other.prefix &&
      node.localName === other.localName &&
      equalAttributes(node, other)
    );
  }
  if (node instanceof Attr && other instanceof Attr) {
    return (
      node.namespaceURI === other.namespaceURI &&
      node.localName === other.localName &&
      node.value === other.value
    );
  }
  if (
    node instanceof ProcessingInstruction &&
    other instanceof ProcessingInstruction
  ) {
    return node.target === other.target && node.data === other.data;
  }
  if (node instanceof CharacterData && other instanceof CharacterData) {
    return node.data === other.data;
  }
  return true;
}

function equalAttributes(node: Element, other: Element): boolean {
  if (node._attributeNodes.length !== other._attributeNodes.length) {
    return false;
  }
  return node._attributeNodes.every((attribute) =>
    other._attributeNodes.some((candidate) => equalNodes(attribute, candidate)),
  );
}

function insertionNodes(node: Node): Node[] {
  return node instanceof DocumentFragment ? [...node._childNodes] : [node];
}

function validateDocumentInsertion(
  node: Node,
  document: Document,
  child: Node | null,
  replacedChild: Node | null,
): void {
  const inserted = insertionNodes(node);
  if (inserted.some((candidate) => candidate instanceof Text)) {
    throw new DOMException(
      "Text nodes cannot be children of a document",
      "HierarchyRequestError",
    );
  }

  const children = document._childNodes.filter(
    (candidate) => candidate !== replacedChild && !inserted.includes(candidate),
  );
  const referenceIndex =
    child === null ? children.length : children.indexOf(child);
  const index = referenceIndex < 0 ? children.length : referenceIndex;
  children.splice(index, 0, ...inserted);

  if (children.filter((candidate) => candidate instanceof Element).length > 1) {
    throw new DOMException(
      "A document cannot have more than one document element",
      "HierarchyRequestError",
    );
  }
  if (
    children.filter((candidate) => candidate instanceof DocumentType).length > 1
  ) {
    throw new DOMException(
      "A document cannot have more than one doctype",
      "HierarchyRequestError",
    );
  }
  const elementIndex = children.findIndex(
    (candidate) => candidate instanceof Element,
  );
  const doctypeIndex = children.findIndex(
    (candidate) => candidate instanceof DocumentType,
  );
  if (elementIndex >= 0 && doctypeIndex > elementIndex) {
    throw new DOMException(
      "A document type must precede the document element",
      "HierarchyRequestError",
    );
  }
}

function insertNodes(node: Node, parent: Node, child: Node | null): void {
  const nodes = insertionNodes(node);
  const document = parent instanceof Document ? parent : parent.ownerDocument;
  for (const inserted of nodes) {
    if (document === null) {
      inserted._remove();
    } else {
      adopt(inserted, document);
    }
    const index = child === null ? -1 : parent._childNodes.indexOf(child);
    inserted._parentNode = parent;
    if (index < 0) {
      parent._childNodes.push(inserted);
    } else {
      parent._childNodes.splice(index, 0, inserted);
    }
  }
}

function adopt(node: Node, document: Document): void {
  node._remove();
  if (node._ownerDocument === document) {
    return;
  }
  updateNodeDocument(node, document);
}

function updateNodeDocument(node: Node, document: Document): void {
  node._ownerDocument = document;
  if (node instanceof Element) {
    for (const attribute of node._attributeNodes) {
      attribute._ownerDocument = document;
    }
    if (node._templateContents !== null) {
      updateNodeDocument(
        node._templateContents,
        document._templateContentsDocument(),
      );
    }
  }
  for (const child of node._childNodes) {
    updateNodeDocument(child, document);
  }
}
