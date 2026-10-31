import {
  closest as closestSelector,
  matches as matchesSelector,
  querySelector as selectFirst,
  querySelectorAll as selectAll,
} from "./selectors.js";
import { DOMException } from "./dom-exception.js";
import {
  HTML_NAMESPACE,
  XML_NAMESPACE,
  XMLNS_NAMESPACE,
} from "./namespaces.js";

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

export interface EventInit {
  readonly bubbles?: boolean;
  readonly cancelable?: boolean;
  readonly composed?: boolean;
}

export class Event {
  static readonly NONE = 0;
  static readonly CAPTURING_PHASE = 1;
  static readonly AT_TARGET = 2;
  static readonly BUBBLING_PHASE = 3;
  readonly NONE = 0;
  readonly CAPTURING_PHASE = 1;
  readonly AT_TARGET = 2;
  readonly BUBBLING_PHASE = 3;
  readonly type: string;
  readonly bubbles: boolean;
  readonly cancelable: boolean;
  readonly composed: boolean;
  readonly isTrusted = false;
  readonly timeStamp = Date.now();
  _target: EventTarget | null = null;
  _currentTarget: EventTarget | null = null;
  _eventPhase = Event.NONE;
  _defaultPrevented = false;
  _stopPropagation = false;
  _stopImmediatePropagation = false;
  _path: EventTarget[] = [];

  constructor(type: string, eventInit: EventInit = {}) {
    this.type = domString(type);
    this.bubbles = Boolean(eventInit.bubbles);
    this.cancelable = Boolean(eventInit.cancelable);
    this.composed = Boolean(eventInit.composed);
  }

  get target(): EventTarget | null {
    return this._target;
  }

  get srcElement(): EventTarget | null {
    return this._target;
  }

  get currentTarget(): EventTarget | null {
    return this._currentTarget;
  }

  get eventPhase(): number {
    return this._eventPhase;
  }

  get defaultPrevented(): boolean {
    return this._defaultPrevented;
  }

  get cancelBubble(): boolean {
    return this._stopPropagation;
  }

  set cancelBubble(value: boolean) {
    if (value) {
      this._stopPropagation = true;
    }
  }

  get returnValue(): boolean {
    return !this._defaultPrevented;
  }

  set returnValue(value: boolean) {
    if (!value) {
      this.preventDefault();
    }
  }

  composedPath(): EventTarget[] {
    return [...this._path];
  }

  stopPropagation(): void {
    this._stopPropagation = true;
  }

  stopImmediatePropagation(): void {
    this._stopPropagation = true;
    this._stopImmediatePropagation = true;
  }

  preventDefault(): void {
    if (this.cancelable) {
      this._defaultPrevented = true;
    }
  }
}

export type EventListener = (event: Event) => void;

export interface EventListenerObject {
  handleEvent(event: Event): void;
}

export interface AddEventListenerOptions {
  readonly capture?: boolean;
  readonly once?: boolean;
  readonly passive?: boolean;
}

interface RegisteredEventListener {
  readonly callback: EventListener | EventListenerObject;
  readonly capture: boolean;
  readonly once: boolean;
}

export class EventTarget {
  readonly #listeners = new Map<string, RegisteredEventListener[]>();

  addEventListener(
    type: string,
    callback: EventListener | EventListenerObject | null,
    options: boolean | AddEventListenerOptions = false,
  ): void {
    if (callback === null) {
      return;
    }
    const convertedType = domString(type);
    const capture =
      typeof options === "boolean" ? options : Boolean(options.capture);
    const listeners = this.#listeners.get(convertedType) ?? [];
    if (
      listeners.some(
        (listener) =>
          listener.callback === callback && listener.capture === capture,
      )
    ) {
      return;
    }
    listeners.push({
      callback,
      capture,
      once: typeof options === "object" && Boolean(options.once),
    });
    this.#listeners.set(convertedType, listeners);
  }

  removeEventListener(
    type: string,
    callback: EventListener | EventListenerObject | null,
    options: boolean | { readonly capture?: boolean } = false,
  ): void {
    if (callback === null) {
      return;
    }
    const capture =
      typeof options === "boolean" ? options : Boolean(options.capture);
    const convertedType = domString(type);
    const listeners = this.#listeners.get(convertedType);
    if (listeners === undefined) {
      return;
    }
    const index = listeners.findIndex(
      (listener) =>
        listener.callback === callback && listener.capture === capture,
    );
    if (index >= 0) {
      listeners.splice(index, 1);
    }
  }

  dispatchEvent(event: Event): boolean {
    if (!(event instanceof Event)) {
      throw new TypeError("The event is not an Event");
    }
    if (event.type === "") {
      throw new DOMException("The event has no type", "InvalidStateError");
    }
    const path: EventTarget[] = [this];
    if (event.bubbles) {
      let parent = this._eventParent();
      while (parent !== null) {
        path.push(parent);
        parent = parent._eventParent();
      }
    }
    event._target = this;
    event._path = path;
    for (const [index, target] of path.entries()) {
      if (event._stopPropagation && index > 0) {
        break;
      }
      event._currentTarget = target;
      event._eventPhase = index === 0 ? Event.AT_TARGET : Event.BUBBLING_PHASE;
      target._invoke(event);
    }
    event._currentTarget = null;
    event._eventPhase = Event.NONE;
    return !event.defaultPrevented;
  }

  _eventParent(): EventTarget | null {
    return null;
  }

  _invoke(event: Event): void {
    const listeners = [...(this.#listeners.get(event.type) ?? [])];
    for (const listener of listeners) {
      if (listener.once) {
        this.removeEventListener(
          event.type,
          listener.callback,
          listener.capture,
        );
      }
      if (typeof listener.callback === "function") {
        listener.callback.call(this, event);
      } else {
        listener.callback.handleEvent(event);
      }
      if (event._stopImmediatePropagation) {
        break;
      }
    }
    if (!event._stopImmediatePropagation) {
      const handler: unknown = Reflect.get(this, `on${event.type}`);
      if (typeof handler === "function") {
        handler.call(this, event);
      }
    }
  }
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

export class Node extends EventTarget {
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

export class Document extends Node {
  readonly contentType = "text/html";
  readonly characterSet = "UTF-8";
  _templateContentsOwnerDocument: Document | null = null;
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
  readonly localName: string;
  prefix: string | null;
  name: string;
  value: string;
  _ownerElement: Element | null;

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

  getAttribute(qualifiedName: string): string | null {
    const name = this.#attributeName(domString(qualifiedName));
    return (
      this._attributeNodes.find((attribute) => attribute.name === name)
        ?.value ?? null
    );
  }

  getAttributeNS(namespace: string | null, localName: string): string | null {
    const normalizedNamespace = normalizeNamespace(namespace);
    const name = domString(localName);
    return (
      this._attributeNodes.find(
        (attribute) =>
          attribute.namespaceURI === normalizedNamespace &&
          attribute.localName === name,
      )?.value ?? null
    );
  }

  getAttributeNames(): string[] {
    return this._attributeNodes.map((attribute) => attribute.name);
  }

  hasAttribute(qualifiedName: string): boolean {
    const name = this.#attributeName(domString(qualifiedName));
    return this._attributeNodes.some((attribute) => attribute.name === name);
  }

  hasAttributeNS(namespace: string | null, localName: string): boolean {
    const normalizedNamespace = normalizeNamespace(namespace);
    const name = domString(localName);
    return this._attributeNodes.some(
      (attribute) =>
        attribute.namespaceURI === normalizedNamespace &&
        attribute.localName === name,
    );
  }

  setAttribute(qualifiedName: string, value: string): void {
    if (arguments.length < 2) {
      throw new TypeError("2 arguments required");
    }
    const name = this.#attributeName(domString(qualifiedName));
    validateName(name);
    const convertedValue = domString(value);
    const attribute = this._attributeNodes.find(
      (candidate) => candidate.namespaceURI === null && candidate.name === name,
    );
    if (attribute !== undefined) {
      attribute.value = convertedValue;
      return;
    }
    this._attributeNodes.push(
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
    const attribute = this._attributeNodes.find(
      (candidate) =>
        candidate.namespaceURI === normalizedNamespace &&
        candidate.localName === extracted.localName,
    );
    if (attribute !== undefined) {
      attribute.prefix = extracted.prefix;
      attribute.name = extracted.qualifiedName;
      attribute.value = convertedValue;
      return;
    }
    this._attributeNodes.push(
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
    const name = this.#attributeName(domString(qualifiedName));
    const index = this._attributeNodes.findIndex(
      (attribute) => attribute.name === name,
    );
    this.#removeAttribute(index);
  }

  removeAttributeNS(namespace: string | null, localName: string): void {
    const normalizedNamespace = normalizeNamespace(namespace);
    const name = domString(localName);
    const index = this._attributeNodes.findIndex(
      (attribute) =>
        attribute.namespaceURI === normalizedNamespace &&
        attribute.localName === name,
    );
    this.#removeAttribute(index);
  }

  toggleAttribute(qualifiedName: string, force?: boolean): boolean {
    if (arguments.length === 0) {
      throw new TypeError("1 argument required");
    }
    const name = this.#attributeName(domString(qualifiedName));
    validateName(name);
    const index = this._attributeNodes.findIndex(
      (attribute) => attribute.namespaceURI === null && attribute.name === name,
    );
    if (index < 0) {
      if (arguments.length < 2 || Boolean(force)) {
        this._attributeNodes.push(new Attr(this.#document(), this, name, ""));
        return true;
      }
      return false;
    }
    if (arguments.length < 2 || !Boolean(force)) {
      this.#removeAttribute(index);
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

  #removeAttribute(index: number): void {
    if (index < 0) {
      return;
    }
    const [attribute] = this._attributeNodes.splice(index, 1);
    if (attribute !== undefined) {
      attribute._ownerElement = null;
    }
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
    inserted._remove();
    if (document !== null && inserted.ownerDocument !== document) {
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
  node._ownerDocument = document;
  if (node instanceof Element) {
    for (const attribute of node._attributeNodes) {
      attribute._ownerDocument = document;
    }
    if (node._templateContents !== null) {
      adopt(node._templateContents, document);
    }
  }
  for (const child of node._childNodes) {
    adopt(child, document);
  }
}

function domString(value: unknown): string {
  if (typeof value === "symbol") {
    throw new TypeError("Cannot convert a Symbol value to a string");
  }
  return String(value);
}

function asciiLowercase(value: string): string {
  return value.replaceAll(/[A-Z]/g, (character) => character.toLowerCase());
}

function normalizeNamespace(namespace: unknown): string | null {
  const converted = domString(namespace);
  return converted === "" || namespace === null ? null : converted;
}

function validateName(name: string): void {
  if (
    !/^[\p{L}_:][\p{L}\p{N}_.:\-\u00B7\u0300-\u036F\u203F-\u2040]*$/u.test(name)
  ) {
    throw new DOMException(
      `Invalid character in attribute name: ${name}`,
      "InvalidCharacterError",
    );
  }
}

interface ExtractedQualifiedName {
  readonly namespace: string | null;
  readonly prefix: string | null;
  readonly localName: string;
  readonly qualifiedName: string;
}

function validateAndExtract(
  namespace: string | null,
  qualifiedName: string,
): ExtractedQualifiedName {
  validateName(qualifiedName);
  const parts = qualifiedName.split(":");
  if (parts.length > 2 || parts.some((part) => part === "")) {
    throw new DOMException(
      `Invalid qualified name: ${qualifiedName}`,
      "NamespaceError",
    );
  }
  const prefix = parts.length === 2 ? (parts[0] ?? null) : null;
  const localName = parts.at(-1) ?? qualifiedName;
  if (prefix !== null && namespace === null) {
    throw new DOMException("A prefix requires a namespace", "NamespaceError");
  }
  if (prefix === "xml" && namespace !== XML_NAMESPACE) {
    throw new DOMException(
      "The xml prefix requires the XML namespace",
      "NamespaceError",
    );
  }
  if (
    (qualifiedName === "xmlns" || prefix === "xmlns") &&
    namespace !== XMLNS_NAMESPACE
  ) {
    throw new DOMException(
      "The xmlns name requires the XMLNS namespace",
      "NamespaceError",
    );
  }
  if (
    namespace === XMLNS_NAMESPACE &&
    qualifiedName !== "xmlns" &&
    prefix !== "xmlns"
  ) {
    throw new DOMException(
      "The XMLNS namespace requires the xmlns name or prefix",
      "NamespaceError",
    );
  }
  return { namespace, prefix, localName, qualifiedName };
}
