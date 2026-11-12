import { DOMException } from "../dom-exception.js";
import type { PalimParseError } from "../html/parse-errors.js";
import {
  serializeHTMLElement,
  serializeHTMLFragment,
} from "../html/serializer.js";
import {
  HTML_NAMESPACE,
  SVG_NAMESPACE,
  XML_NAMESPACE,
  XMLNS_NAMESPACE,
} from "../namespaces.js";
import { originFromURL } from "../origin.js";
import {
  closest as closestSelector,
  matches as matchesSelector,
  querySelector as selectFirst,
  querySelectorAll as selectAll,
} from "../selectors.js";
import { URL } from "../url/index.js";
import { requireArguments } from "../web-idl.js";
import type { Window } from "../window-types.js";
import { WritableStreamState } from "../writable-stream-state.js";
import {
  serializeXMLElement,
  serializeXMLFragment,
} from "../xml/serializer.js";
import { bindDOMInterface } from "./binding.js";
import type { HTMLCollection, NamedNodeMap, NodeList } from "./collections.js";
import {
  createHTMLCollection,
  createNamedNodeMap,
  createNodeList,
} from "./collections.js";
import {
  asciiLowercase,
  asciiUppercase,
  domString,
  normalizeNamespace,
  validateAndExtract,
  validateAndExtractElement,
  validateAttributeLocalName,
  validateDoctypeName,
  validateElementLocalName,
  validateName,
} from "./conversions.js";
import {
  enqueueCustomElementConnectedReaction,
  enqueueCustomElementDisconnectedReaction,
  enqueueCustomElementMoveReaction,
} from "./custom-elements.js";
import { createLegacyEvent, Event, EventTarget } from "./events.js";
import { queueTreeMutationRecord } from "./mutation-observer.js";
import {
  AttrImplementation,
  attrImplementation,
  attrInterface,
  bindNode,
  CharacterDataImplementation,
  characterDataImplementation,
  DocumentImplementation,
  documentImplementation,
  documentInterface,
  DocumentTypeImplementation,
  documentTypeImplementation,
  ElementImplementation,
  elementImplementation,
  elementInterface,
  NodeImplementation,
  nodeImplementation,
  nodeInterface,
  ShadowRootImplementation,
  shadowRootImplementation,
} from "./node-implementation.js";
import type { Range } from "./range.js";
import {
  adjustLiveRangesForData,
  adjustLiveRangesForInsertion,
  adjustLiveRangesForTextMerge,
  adjustLiveRangesForTextSplit,
  createRange,
  preRemoveLiveRanges,
  transferLiveRanges,
} from "./range-implementation.js";
import type {
  CanonicalSanitizerConfig,
  Sanitizer,
  SanitizerConfig,
} from "./sanitizer.js";
import {
  sanitizerAction,
  sanitizerAllowsAttribute,
  sanitizerAllowsComments,
  sanitizerAllowsPI,
  sanitizerConfigForParsing,
} from "./sanitizer.js";
import type { DOMTokenList } from "./token-list.js";
import { createDOMTokenList } from "./token-list.js";
import type {
  NodeFilter as NodeFilterCallback,
  NodeIterator,
  TreeWalker,
} from "./traversal.js";
import {
  createNodeIterator,
  createTreeWalker,
  descendantElements,
  invalidateDescendantElements,
  NodeFilter,
  preRemoveNodeIterators,
  transferNodeIterators,
} from "./traversal.js";

export { Sanitizer } from "./sanitizer.js";
export type {
  SanitizerAttribute,
  SanitizerConfig,
  SanitizerElement,
  SanitizerElementInput,
  SanitizerPI,
} from "./sanitizer.js";

export interface FragmentParseOptions {
  readonly allowDeclarativeShadowRoots?: boolean;
  readonly runScripts?: boolean;
  readonly sanitizerConfig?: CanonicalSanitizerConfig;
}

export interface FragmentParser {
  parse(
    input: string,
    context: Element,
    options?: FragmentParseOptions,
  ): DocumentFragment;
}

export interface HTMLParsingOptions {
  readonly runScripts?: boolean;
  readonly sanitizer?: "default" | Sanitizer | SanitizerConfig;
}

export interface HTMLWritableStreamWriter {
  readonly closed: Promise<void>;
  readonly desiredSize: number | null;
  readonly ready: Promise<void>;
  abort(reason?: unknown): Promise<void>;
  close(): Promise<void>;
  releaseLock(): void;
  write(chunk?: unknown): Promise<void>;
}

export interface HTMLWritableStream {
  readonly locked: boolean;
  abort(reason?: unknown): Promise<void>;
  close(): Promise<void>;
  getWriter(): HTMLWritableStreamWriter;
}

type HTMLDocumentParser = (
  input: string,
  allowDeclarativeShadowRoots: boolean,
  sanitizerConfig: CanonicalSanitizerConfig | null,
) => Document;

export interface HTMLDocumentParserSession {
  readonly finished: Promise<Document>;
  readonly state: "writable" | "closed" | "aborted" | "errored";
  write(input: string): void;
  close(): void;
  abort(): void;
}

export interface HTMLDocumentParserSessionOptions {
  readonly onElement?: (element: Element) => void;
  readonly onScript?: (element: Element) => Promise<void> | void;
  readonly onClosed?: () => Promise<void> | void;
}

interface HTMLStreamingParserSession {
  write(input: string): void;
  close(): void;
  abort(): void;
}

type HTMLDocumentParserSessionFactory = (
  document: Document,
  options: HTMLDocumentParserSessionOptions,
) => HTMLDocumentParserSession;

type HTMLStreamingParserFactory = (
  target: Element | DocumentFragment,
  context: Element,
  reference: Node | null,
  options: FragmentParseOptions,
) => HTMLStreamingParserSession;

let htmlInsertionFragmentParser: FragmentParser | null = null;
let htmlDocumentParser: HTMLDocumentParser | null = null;
let htmlDocumentParserSessionFactory: HTMLDocumentParserSessionFactory | null =
  null;
let htmlStreamingParserFactory: HTMLStreamingParserFactory | null = null;
const activeHTMLDocumentParserSessions = new WeakMap<
  Document,
  HTMLDocumentParserSession
>();

export function setHTMLParsingAlgorithms(
  fragmentParser: FragmentParser,
  documentParser: HTMLDocumentParser,
  documentParserSessionFactory: HTMLDocumentParserSessionFactory,
  streamingParserFactory: HTMLStreamingParserFactory,
): void {
  htmlInsertionFragmentParser = fragmentParser;
  htmlDocumentParser = documentParser;
  htmlDocumentParserSessionFactory = documentParserSessionFactory;
  htmlStreamingParserFactory = streamingParserFactory;
}

export function startHTMLDocumentParserSession(
  document: Document,
  options: HTMLDocumentParserSessionOptions = {},
): HTMLDocumentParserSession {
  if (htmlDocumentParserSessionFactory === null) {
    throw new TypeError("No HTML document parser session is registered");
  }
  const active = activeHTMLDocumentParserSessions.get(document);
  if (active?.state === "writable") {
    active.abort();
  }
  const implementation = documentImplementation(document);
  const onElement = options.onElement ?? implementation.parserElementSteps;
  const onScript = options.onScript ?? implementation.parserScriptSteps;
  const onClosed = options.onClosed ?? implementation.parserClosedSteps;
  const session = htmlDocumentParserSessionFactory(document, {
    ...(onElement === null ? {} : { onElement }),
    ...(onScript === null ? {} : { onScript }),
    ...(onClosed === null ? {} : { onClosed }),
  });
  activeHTMLDocumentParserSessions.set(document, session);
  void session.finished
    .finally(() => {
      if (activeHTMLDocumentParserSessions.get(document) === session) {
        activeHTMLDocumentParserSessions.delete(document);
      }
    })
    .catch(() => undefined);
  return session;
}

export function activeHTMLDocumentParserSession(
  document: Document,
): HTMLDocumentParserSession | null {
  const session = activeHTMLDocumentParserSessions.get(document) ?? null;
  return session?.state === "writable" ? session : null;
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

export interface ShadowRootInit {
  readonly mode: "open" | "closed";
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

type CreateAttributeNSArguments = [
  namespace?: string | null,
  qualifiedName?: string,
];

type CreateAttributeArguments = [localName?: string];

type CreateCharacterDataArguments = [data?: string];

export type ElementFactory = (
  document: Document,
  localName: string,
  namespaceURI: string | null,
  prefix: string | null,
) => Element;

let documentElementFactory: ElementFactory = defaultElementFactory;

export class DOMImplementation {
  constructor(readonly document: Document) {
    bindDOMInterface(this, this);
  }

  hasFeature(): boolean {
    return true;
  }

  createDocumentType(
    qualifiedName: string,
    publicId: string,
    systemId: string,
  ): DocumentType {
    requireArguments(arguments.length, 3);
    const name = domString(qualifiedName);
    validateDoctypeName(name);
    return createDocumentType(
      this.document,
      name,
      domString(publicId),
      domString(systemId),
    );
  }

  createDocument(
    namespace: string | null,
    qualifiedName: string | null,
    doctype: DocumentType | null = null,
  ): Document {
    requireArguments(arguments.length, 2);
    const source = documentImplementation(this.document);
    const normalizedNamespace = normalizeNamespace(namespace);
    const contentType =
      normalizedNamespace === HTML_NAMESPACE
        ? "application/xhtml+xml"
        : normalizedNamespace === SVG_NAMESPACE
          ? "image/svg+xml"
          : "application/xml";
    const document = createDocument(
      source.fragmentParser,
      contentType,
      source.elementFactory,
      XMLDocument,
    );
    documentImplementation(document).relevantRealmDocument =
      source.relevantRealmDocument;
    if (doctype !== null) {
      if (!(doctype instanceof DocumentType)) {
        throw new TypeError("doctype must be a DocumentType");
      }
      nodeImplementation(doctype).ownerDocument =
        documentImplementation(document);
      document.appendChild(doctype);
    }
    const name = qualifiedName === null ? "" : domString(qualifiedName);
    if (name !== "") {
      document.appendChild(document.createElementNS(normalizedNamespace, name));
    }
    return document;
  }

  createHTMLDocument(title?: string): Document {
    const source = documentImplementation(this.document);
    const document = createDocument(
      source.fragmentParser,
      "text/html",
      source.elementFactory,
      Document,
    );
    documentImplementation(document).relevantRealmDocument =
      source.relevantRealmDocument;
    document.appendChild(createDocumentType(document, "html", "", ""));
    const html = document.createElement("html");
    const head = document.createElement("head");
    if (title !== undefined) {
      const titleElement = document.createElement("title");
      titleElement.append(domString(title));
      head.appendChild(titleElement);
    }
    html.appendChild(head);
    html.appendChild(document.createElement("body"));
    document.appendChild(html);
    return document;
  }
}

export class Node extends EventTarget {
  static readonly ELEMENT_NODE = 1;
  static readonly ATTRIBUTE_NODE = 2;
  static readonly TEXT_NODE = 3;
  static readonly CDATA_SECTION_NODE = 4;
  static readonly ENTITY_REFERENCE_NODE = 5;
  static readonly ENTITY_NODE = 6;
  static readonly COMMENT_NODE = 8;
  static readonly PROCESSING_INSTRUCTION_NODE = 7;
  static readonly DOCUMENT_NODE = 9;
  static readonly DOCUMENT_TYPE_NODE = 10;
  static readonly DOCUMENT_FRAGMENT_NODE = 11;
  static readonly NOTATION_NODE = 12;

  static readonly DOCUMENT_POSITION_DISCONNECTED = 0x01;
  static readonly DOCUMENT_POSITION_PRECEDING = 0x02;
  static readonly DOCUMENT_POSITION_FOLLOWING = 0x04;
  static readonly DOCUMENT_POSITION_CONTAINS = 0x08;
  static readonly DOCUMENT_POSITION_CONTAINED_BY = 0x10;
  static readonly DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC = 0x20;

  constructor(implementation?: unknown) {
    super();
    if (!(implementation instanceof NodeImplementation)) {
      throw new TypeError("Illegal constructor");
    }
    bindNode(this, implementation);
  }

  get childNodes(): NodeList {
    const implementation = nodeImplementation(this);
    implementation.childNodes ??= createNodeList(() => childNodes(this));
    return implementation.childNodes;
  }

  get nodeType(): number {
    return nodeImplementation(this).nodeType;
  }

  get nodeName(): string {
    if (this instanceof Element) {
      return this.tagName;
    }
    return nodeImplementation(this).nodeName;
  }

  get nodeValue(): string | null {
    if (this instanceof Attr) {
      return this.value;
    }
    if (this instanceof CharacterData) {
      return this.data;
    }
    return null;
  }

  set nodeValue(value: string | null) {
    const data = nullableDOMStringToString(value);
    if (this instanceof Attr) {
      this.value = data;
    } else if (this instanceof CharacterData) {
      this.data = data;
    }
  }

  hasChildNodes(): boolean {
    return childNodes(this).length > 0;
  }

  get ownerDocument(): Document | null {
    const implementation = nodeImplementation(this).ownerDocument;
    return implementation === null ? null : documentInterface(implementation);
  }

  get baseURI(): string {
    const implementation = nodeImplementation(this);
    const document =
      implementation instanceof DocumentImplementation
        ? implementation
        : implementation.ownerDocument;
    if (document === null) {
      throw new TypeError("Node has no node document");
    }
    return documentBaseURL(document).href;
  }

  get isConnected(): boolean {
    return shadowIncludingRoot(this) instanceof Document;
  }

  get parentNode(): Node | null {
    const implementation = nodeImplementation(this).parent;
    return implementation === null ? null : nodeInterface(implementation);
  }

  get parentElement(): Element | null {
    return this.parentNode instanceof Element ? this.parentNode : null;
  }

  get firstChild(): Node | null {
    return childNodes(this)[0] ?? null;
  }

  get lastChild(): Node | null {
    return childNodes(this).at(-1) ?? null;
  }

  get previousSibling(): Node | null {
    const sibling = nodeImplementation(this).previousSibling;
    return sibling === null ? null : nodeInterface(sibling);
  }

  get nextSibling(): Node | null {
    const sibling = nodeImplementation(this).nextSibling;
    return sibling === null ? null : nodeInterface(sibling);
  }

  get textContent(): string | null {
    return descendantText(this);
  }

  set textContent(value: string | null) {
    if (!(this instanceof Element) && !(this instanceof DocumentFragment)) {
      return;
    }
    const data = nullableDOMStringToString(value);
    while (this.firstChild !== null) {
      removeNode(this.firstChild);
    }
    const document = this.ownerDocument;
    if (data !== "" && document !== null) {
      appendNode(this, createText(document, data));
    }
  }

  normalize(): void {
    normalizeDescendantText(this);
  }

  getRootNode(options: GetRootNodeOptions = {}): Node {
    return options.composed === true
      ? shadowIncludingRoot(this)
      : nodeRoot(this);
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

  lookupPrefix(namespace: string | null): string | null {
    requireArguments(arguments.length, 1);
    const convertedNamespace = normalizeNamespace(namespace);
    if (convertedNamespace === null) {
      return null;
    }
    return lookupNamespacePrefix(this, convertedNamespace);
  }

  lookupNamespaceURI(prefix: string | null): string | null {
    requireArguments(arguments.length, 1);
    return locateNamespace(this, normalizeNamespace(prefix));
  }

  isDefaultNamespace(namespace: string | null): boolean {
    requireArguments(arguments.length, 1);
    const convertedNamespace = normalizeNamespace(namespace);
    return locateNamespace(this, null) === convertedNamespace;
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
    requireArguments(arguments.length, 2);
    if (!(node instanceof Node) || !(child instanceof Node)) {
      throw new TypeError("The argument is not a Node");
    }
    ensurePreInsertionValidity(node, this, child, [child]);

    let reference = child.nextSibling;
    if (reference === node) {
      reference = node.nextSibling;
    }
    removeNode(child);
    insertNodes(node, this, reference);
    return child;
  }

  removeChild<T extends Node>(child: T): T {
    requireNodeArgument(child, arguments.length);
    if (child.parentNode !== this) {
      throw new DOMException(
        "The node to be removed is not a child of this node",
        "NotFoundError",
      );
    }
    removeNode(child);
    return child;
  }
}

export function childNodes(node: Node): Node[] {
  return nodeImplementation(node).children.map(nodeInterface);
}

export function appendNode(parent: Node, node: Node): void {
  removeNode(node);
  const parentImplementation = nodeImplementation(parent);
  const childImplementation = nodeImplementation(node);
  adjustLiveRangesForInsertion(parent, parentImplementation.children.length, 1);
  insertChildImplementation(
    parentImplementation,
    childImplementation,
    parentImplementation.children.length,
  );
  invalidateDescendantText(parentImplementation);
}

export function insertNodeBefore(
  parent: Node,
  node: Node,
  reference: Node,
): void {
  removeNode(node);
  const parentImplementation = nodeImplementation(parent);
  const childImplementation = nodeImplementation(node);
  const index = parentImplementation.children.indexOf(
    nodeImplementation(reference),
  );
  if (index < 0) {
    adjustLiveRangesForInsertion(
      parent,
      parentImplementation.children.length,
      1,
    );
    insertChildImplementation(
      parentImplementation,
      childImplementation,
      parentImplementation.children.length,
    );
  } else {
    adjustLiveRangesForInsertion(parent, index, 1);
    insertChildImplementation(parentImplementation, childImplementation, index);
  }
  invalidateDescendantText(parentImplementation);
}

export function removeNode(node: Node): void {
  const implementation = nodeImplementation(node);
  if (implementation.parent === null) {
    return;
  }
  const removedNodes = inclusiveDescendantNodes(node);
  const disconnectedCustomElements = node.isConnected
    ? shadowIncludingInclusiveDescendantElements(node)
    : [];
  preRemoveLiveRanges(node);
  preRemoveNodeIterators(node);
  const parent = implementation.parent;
  const oldParent = nodeInterface(parent);
  const document = nodeDocumentImplementation(implementation);
  const index = parent.children.indexOf(implementation);
  if (index >= 0) {
    removeChildImplementation(parent, implementation, index);
    invalidateDescendantText(parent);
  }
  for (const [removedIndex, removedNode] of removedNodes.entries()) {
    document.removingSteps?.(removedNode, removedIndex === 0, oldParent);
  }
  for (const element of disconnectedCustomElements) {
    enqueueCustomElementDisconnectedReaction(element);
  }
  document.childrenChangedSteps?.(oldParent);
}

function insertChildImplementation(
  parent: NodeImplementation,
  child: NodeImplementation,
  index: number,
): void {
  const previous = parent.children[index - 1] ?? null;
  const next = parent.children[index] ?? null;
  child.parent = parent;
  child.previousSibling = previous;
  child.nextSibling = next;
  if (previous !== null) {
    previous.nextSibling = child;
  }
  if (next !== null) {
    next.previousSibling = child;
  }
  parent.children.splice(index, 0, child);
  queueTreeMutationRecord(
    nodeInterface(parent),
    [nodeInterface(child)],
    [],
    previous === null ? null : nodeInterface(previous),
    next === null ? null : nodeInterface(next),
  );
  if (subtreeContainsHTMLBaseElement(child)) {
    updateFirstBaseElementWithHref(nodeDocumentImplementation(parent));
  }
  updateSlotAssignmentsAfterTreeMutation(
    nodeInterface(parent),
    nodeInterface(child),
  );
}

function removeChildImplementation(
  parent: NodeImplementation,
  child: NodeImplementation,
  index: number,
): void {
  const previous = child.previousSibling;
  const next = child.nextSibling;
  queueTreeMutationRecord(
    nodeInterface(parent),
    [],
    [nodeInterface(child)],
    previous === null ? null : nodeInterface(previous),
    next === null ? null : nodeInterface(next),
  );
  if (previous !== null) {
    previous.nextSibling = next;
  }
  if (next !== null) {
    next.previousSibling = previous;
  }
  parent.children.splice(index, 1);
  child.parent = null;
  child.previousSibling = null;
  child.nextSibling = null;
  if (subtreeContainsHTMLBaseElement(child)) {
    updateFirstBaseElementWithHref(nodeDocumentImplementation(parent));
  }
  updateSlotAssignmentsAfterTreeMutation(
    nodeInterface(parent),
    nodeInterface(child),
  );
}

function invalidateDescendantText(node: NodeImplementation): void {
  invalidateDocumentNamedProperties(node);
  let current: NodeImplementation | null = node;
  while (current !== null) {
    current.descendantTextCache = null;
    invalidateDescendantElements(nodeInterface(current));
    current = current.parent;
  }
}

function documentTitleElement(document: Document): Element | null {
  return (
    descendantElements(document).find(
      (element) =>
        element.namespaceURI === HTML_NAMESPACE &&
        element.localName === "title",
    ) ?? null
  );
}

function childTextContent(element: Element | null): string {
  if (element === null) {
    return "";
  }
  return childNodes(element)
    .filter((child): child is Text => child instanceof Text)
    .map((child) => child.data)
    .join("");
}

function stripAndCollapseASCIIWhitespace(value: string): string {
  return value
    .replace(/^[\t\n\f\r ]+|[\t\n\f\r ]+$/gu, "")
    .replaceAll(/[\t\n\f\r ]+/gu, " ");
}

export class Document extends Node {
  #forms: HTMLCollection | null = null;
  #images: HTMLCollection | null = null;
  #links: HTMLCollection | null = null;
  #scripts: HTMLCollection | null = null;
  #embeds: HTMLCollection | null = null;

  readonly readyState = "complete";

  static parseHTML(html: string, options: HTMLParsingOptions = {}): Document {
    return parseHTMLDocument(domString(html), options, false);
  }

  static parseHTMLUnsafe(
    html: string,
    options: HTMLParsingOptions = {},
  ): Document {
    return parseHTMLDocument(domString(html), options, true);
  }

  constructor(implementation?: unknown) {
    super(
      implementation instanceof DocumentImplementation
        ? implementation
        : new DocumentImplementation(
            null,
            "application/xml",
            documentElementFactory,
          ),
    );
  }

  open(unused1?: string, unused2?: string): this {
    if (arguments.length > 0) {
      domString(unused1);
    }
    if (arguments.length > 1) {
      domString(unused2);
    }
    if (this.contentType !== "text/html") {
      throw new DOMException(
        "Dynamic markup insertion requires an HTML document",
        "InvalidStateError",
      );
    }
    startHTMLDocumentParserSession(this);
    return this;
  }

  close(): void {
    activeHTMLDocumentParserSession(this)?.close();
  }

  write(...text: string[]): void {
    this.#writeDynamicMarkup(text, false);
  }

  writeln(...text: string[]): void {
    this.#writeDynamicMarkup(text, true);
  }

  #writeDynamicMarkup(text: string[], line: boolean): void {
    if (this.contentType !== "text/html") {
      throw new DOMException(
        "Dynamic markup insertion requires an HTML document",
        "InvalidStateError",
      );
    }
    const input =
      text.map((value) => domString(value)).join("") + (line ? "\n" : "");
    let active = activeHTMLDocumentParserSession(this);
    if (active === null) {
      this.open();
      active = activeHTMLDocumentParserSession(this);
    }
    if (active === null) {
      throw new TypeError("Document parser session did not start");
    }
    active.write(input);
  }

  get implementation(): DOMImplementation {
    const implementation = documentImplementation(this);
    implementation.domImplementation ??= new DOMImplementation(this);
    return implementation.domImplementation;
  }

  get contentType(): string {
    return documentImplementation(this).contentType;
  }

  get characterSet(): string {
    return documentImplementation(this).encoding;
  }

  get charset(): string {
    return this.characterSet;
  }

  get inputEncoding(): string {
    return this.characterSet;
  }

  get URL(): string {
    return documentImplementation(this).url.href;
  }

  get documentURI(): string {
    return this.URL;
  }

  get title(): string {
    const root = this.documentElement;
    const title =
      root?.namespaceURI === SVG_NAMESPACE && root.localName === "svg"
        ? (childNodes(root).find(
            (child): child is Element =>
              child instanceof Element &&
              child.namespaceURI === SVG_NAMESPACE &&
              child.localName === "title",
          ) ?? null)
        : documentTitleElement(this);
    return stripAndCollapseASCIIWhitespace(childTextContent(title));
  }

  set title(value: string) {
    const converted = domString(value);
    const root = this.documentElement;
    if (root?.namespaceURI === SVG_NAMESPACE && root.localName === "svg") {
      let title = childNodes(root).find(
        (child): child is Element =>
          child instanceof Element &&
          child.namespaceURI === SVG_NAMESPACE &&
          child.localName === "title",
      );
      if (title === undefined) {
        title = this.createElementNS(SVG_NAMESPACE, "title");
        root.insertBefore(title, root.firstChild);
      }
      title.textContent = converted;
      return;
    }
    if (root?.namespaceURI !== HTML_NAMESPACE || root.localName !== "html") {
      return;
    }
    let title = documentTitleElement(this);
    if (title === null) {
      const head = childNodes(root).find(
        (child): child is Element =>
          child instanceof Element &&
          child.namespaceURI === HTML_NAMESPACE &&
          child.localName === "head",
      );
      if (head === undefined) {
        return;
      }
      title = this.createElement("title");
      head.appendChild(title);
    }
    title.textContent = converted;
  }

  get dir(): string {
    const root = this.documentElement;
    if (root?.namespaceURI !== HTML_NAMESPACE || root.localName !== "html") {
      return "";
    }
    const value = asciiLowercase(root.getAttribute("dir") ?? "");
    return value === "ltr" || value === "rtl" || value === "auto" ? value : "";
  }

  set dir(value: string) {
    const converted = domString(value);
    const root = this.documentElement;
    if (root?.namespaceURI === HTML_NAMESPACE && root.localName === "html") {
      root.setAttribute("dir", converted);
    }
  }

  readonly location = null;

  get defaultView(): Window | null {
    return documentImplementation(this).defaultView;
  }

  get doctype(): DocumentType | null {
    return (
      childNodes(this).find(
        (node): node is DocumentType => node instanceof DocumentType,
      ) ?? null
    );
  }

  get documentElement(): Element | null {
    return (
      childNodes(this).find(
        (node): node is Element => node instanceof Element,
      ) ?? null
    );
  }

  get rootElement(): Element | null {
    const root = this.documentElement;
    return root?.namespaceURI === SVG_NAMESPACE && root.localName === "svg"
      ? root
      : null;
  }

  get currentScript(): Element | null {
    return documentImplementation(this).currentScript;
  }

  get head(): Element | null {
    const root = this.documentElement;
    if (root?.namespaceURI !== HTML_NAMESPACE || root.localName !== "html") {
      return null;
    }
    return (
      childNodes(root).find(
        (node): node is Element =>
          node instanceof Element &&
          node.namespaceURI === HTML_NAMESPACE &&
          node.localName === "head",
      ) ?? null
    );
  }

  get body(): Element | null {
    const root = this.documentElement;
    if (root?.namespaceURI !== HTML_NAMESPACE || root.localName !== "html") {
      return null;
    }
    return (
      childNodes(root).find(
        (node): node is Element =>
          node instanceof Element &&
          node.namespaceURI === HTML_NAMESPACE &&
          (node.localName === "body" || node.localName === "frameset"),
      ) ?? null
    );
  }

  set body(value: Element | null) {
    if (value !== null && !(value instanceof Element)) {
      throw new TypeError("The value is not an Element or null");
    }
    if (
      value?.namespaceURI !== HTML_NAMESPACE ||
      (value.localName !== "body" && value.localName !== "frameset")
    ) {
      throw new DOMException(
        "The value is not a body or frameset element",
        "HierarchyRequestError",
      );
    }
    const body = this.body;
    if (value === body) {
      return;
    }
    if (body !== null) {
      const parent = body.parentNode;
      if (parent === null) {
        throw new TypeError("The body element has no parent");
      }
      parent.replaceChild(value, body);
      return;
    }
    const root = this.documentElement;
    if (root === null) {
      throw new DOMException(
        "The document has no document element",
        "HierarchyRequestError",
      );
    }
    root.appendChild(value);
  }

  get forms(): HTMLCollection {
    this.#forms ??= createDescendantElementCollection(
      this,
      (element) =>
        element.namespaceURI === HTML_NAMESPACE && element.localName === "form",
    );
    return this.#forms;
  }

  get images(): HTMLCollection {
    this.#images ??= createDescendantElementCollection(
      this,
      (element) =>
        element.namespaceURI === HTML_NAMESPACE && element.localName === "img",
    );
    return this.#images;
  }

  get links(): HTMLCollection {
    this.#links ??= createHTMLCollection(() =>
      descendantElements(this).filter(
        (element) =>
          element.namespaceURI === HTML_NAMESPACE &&
          (element.localName === "a" || element.localName === "area") &&
          element.hasAttribute("href"),
      ),
    );
    return this.#links;
  }

  get scripts(): HTMLCollection {
    this.#scripts ??= createDescendantElementCollection(
      this,
      (element) =>
        element.namespaceURI === HTML_NAMESPACE &&
        element.localName === "script",
    );
    return this.#scripts;
  }

  get embeds(): HTMLCollection {
    this.#embeds ??= createDescendantElementCollection(
      this,
      (element) =>
        element.namespaceURI === HTML_NAMESPACE &&
        element.localName === "embed",
    );
    return this.#embeds;
  }

  get plugins(): HTMLCollection {
    return this.embeds;
  }

  get compatMode(): "BackCompat" | "CSS1Compat" {
    return documentImplementation(this).quirks ? "BackCompat" : "CSS1Compat";
  }

  createElement(
    localName: string,
    options?: string | ElementCreationOptions,
  ): Element;
  createElement(...parameters: CreateElementArguments): Element {
    requireArguments(parameters.length, 1);
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
    return createElementForDocument(this, convertedName, namespaceURI, null);
  }

  createElementNS(
    namespace: string | null,
    qualifiedName: string,
    options?: string | ElementCreationOptions,
  ): Element;
  createElementNS(...parameters: CreateElementNSArguments): Element {
    requireArguments(parameters.length, 2);
    const [namespace, qualifiedName, options] = parameters;
    const convertedNamespace = normalizeNamespace(namespace);
    const convertedName = domString(qualifiedName);
    convertElementCreationOptions(options);
    const extracted = validateAndExtractElement(
      convertedNamespace,
      convertedName,
    );
    return createElementForDocument(
      this,
      extracted.localName,
      extracted.namespace,
      extracted.prefix,
    );
  }

  createDocumentFragment(): DocumentFragment {
    return createDocumentFragment(this);
  }

  createEvent(interfaceName: string): Event;
  createEvent(...parameters: [interfaceName?: string]): Event {
    requireArguments(parameters.length, 1);
    return createLegacyEvent(domString(parameters[0]));
  }

  createAttribute(localName: string): Attr;
  createAttribute(...parameters: CreateAttributeArguments): Attr {
    requireArguments(parameters.length, 1);
    const [localName] = parameters;
    let convertedName = domString(localName);
    validateAttributeLocalName(convertedName);
    if (this.contentType === "text/html") {
      convertedName = asciiLowercase(convertedName);
    }
    return createAttr(this, null, convertedName, "");
  }

  createAttributeNS(namespace: string | null, qualifiedName: string): Attr;
  createAttributeNS(...parameters: CreateAttributeNSArguments): Attr {
    requireArguments(parameters.length, 2);
    const [namespace, qualifiedName] = parameters;
    const extracted = validateAndExtract(
      normalizeNamespace(namespace),
      domString(qualifiedName),
    );
    return createAttr(
      this,
      null,
      extracted.qualifiedName,
      "",
      extracted.namespace,
      extracted.prefix,
      extracted.localName,
    );
  }

  createTextNode(data: string): Text;
  createTextNode(...parameters: CreateCharacterDataArguments): Text {
    requireArguments(parameters.length, 1);
    const [data] = parameters;
    return createText(this, domString(data));
  }

  createComment(data: string): Comment;
  createComment(...parameters: CreateCharacterDataArguments): Comment {
    requireArguments(parameters.length, 1);
    const [data] = parameters;
    return createComment(this, domString(data));
  }

  createCDATASection(data: string): CDATASection;
  createCDATASection(
    ...parameters: CreateCharacterDataArguments
  ): CDATASection {
    requireArguments(parameters.length, 1);
    const [data] = parameters;
    const convertedData = domString(data);
    if (this.contentType === "text/html") {
      throw new DOMException(
        "CDATA sections are not supported for this document",
        "NotSupportedError",
      );
    }
    if (convertedData.includes("]]>")) {
      throw new DOMException(
        'CDATA section data cannot contain "]]>"',
        "InvalidCharacterError",
      );
    }
    return createCDATASection(this, convertedData);
  }

  createProcessingInstruction(
    target: string,
    data: string,
  ): ProcessingInstruction {
    requireArguments(arguments.length, 2);
    const convertedTarget = domString(target);
    validateName(convertedTarget);
    const convertedData = domString(data);
    if (convertedData.includes("?>")) {
      throw new DOMException(
        "Processing instruction data cannot contain ?>",
        "InvalidCharacterError",
      );
    }
    return createProcessingInstruction(this, convertedTarget, convertedData);
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
    if (node instanceof ShadowRoot) {
      throw new DOMException(
        "A shadow root cannot be adopted",
        "HierarchyRequestError",
      );
    }
    adopt(node, this);
    return node;
  }

  createNodeIterator(
    root: Node,
    whatToShow: number = NodeFilter.SHOW_ALL,
    filter: NodeFilterCallback | null = null,
  ): NodeIterator {
    requireNodeArgument(root, arguments.length);
    return createNodeIterator(root, whatToShow, filter);
  }

  createTreeWalker(
    root: Node,
    whatToShow: number = NodeFilter.SHOW_ALL,
    filter: NodeFilterCallback | null = null,
  ): TreeWalker {
    requireNodeArgument(root, arguments.length);
    return createTreeWalker(root, whatToShow, filter);
  }

  createRange(): Range {
    return createRange(this);
  }

  prepend(...nodes: (Node | string)[]): void {
    prependNodes(this, nodes);
  }

  append(...nodes: (Node | string)[]): void {
    appendNodes(this, nodes);
  }

  replaceChildren(...nodes: (Node | string)[]): void {
    replaceChildrenWithNodes(this, nodes);
  }

  moveBefore(node: Node, child: Node | null): void {
    requireArguments(arguments.length, 2);
    requireNode(node);
    moveNodeBefore(this, node, nullableNode(child));
  }

  override get textContent(): null {
    return null;
  }

  override set textContent(value: string | null) {
    nullableDOMStringToString(value);
  }

  querySelector(selectors: string): Element | null {
    return selectFirst(this, selectorArgument(selectors, arguments.length));
  }

  querySelectorAll(selectors: string): NodeList<Element> {
    const result = selectAll(
      this,
      selectorArgument(selectors, arguments.length),
    );
    return createNodeList(() => result);
  }

  getElementById(elementId: string): Element | null {
    return findElementById(
      this,
      requiredDOMString(elementId, arguments.length),
    );
  }

  getElementsByTagName(qualifiedName: string): HTMLCollection {
    return elementsByTagName(
      this,
      requiredDOMString(qualifiedName, arguments.length),
    );
  }

  getElementsByTagNameNS(
    namespace: string | null,
    localName: string,
  ): HTMLCollection {
    requireArguments(arguments.length, 2);
    return elementsByTagNameNS(
      this,
      normalizeNamespace(namespace),
      domString(localName),
    );
  }

  getElementsByClassName(classNames: string): HTMLCollection {
    return elementsByClassName(
      this,
      requiredDOMString(classNames, arguments.length),
    );
  }

  getElementsByName(elementName: string): NodeList<Element> {
    const name = requiredDOMString(elementName, arguments.length);
    return createNodeList(() =>
      descendantElements(this).filter(
        (element) =>
          element.namespaceURI === HTML_NAMESPACE &&
          findAttributeByNamespace(element, null, "name")?.value === name,
      ),
    );
  }
}

export class XMLDocument extends Document {}

export function createElementForDocument(
  document: Document,
  localName: string,
  namespaceURI: string | null,
  prefix: string | null = null,
): Element {
  return documentImplementation(document).elementFactory(
    document,
    localName,
    namespaceURI,
    prefix,
  );
}

export function createDocument(
  fragmentParser: FragmentParser | null,
  contentType: string,
  elementFactory: ElementFactory,
  documentConstructor: typeof Document,
): Document {
  return new documentConstructor(
    new DocumentImplementation(fragmentParser, contentType, elementFactory),
  );
}

export function createDocumentType(
  document: Document,
  name: string,
  publicId: string,
  systemId: string,
): DocumentType {
  return new DocumentType(
    new DocumentTypeImplementation(
      documentImplementation(document),
      name,
      publicId,
      systemId,
    ),
  );
}

export function createAttr(
  document: Document,
  element: Element | null,
  name: string,
  value: string,
  namespaceURI: string | null = null,
  prefix: string | null = null,
  localName = name,
): Attr {
  return new Attr(
    new AttrImplementation(
      documentImplementation(document),
      element === null ? null : elementImplementation(element),
      name,
      value,
      namespaceURI,
      prefix,
      localName,
    ),
  );
}

export function createElementInterface(
  document: Document,
  localName: string,
  namespaceURI: string | null = HTML_NAMESPACE,
  prefix: string | null = null,
): Element {
  return new Element(
    createElementImplementation(document, localName, namespaceURI, prefix),
  );
}

export function createElementImplementation(
  document: Document,
  localName: string,
  namespaceURI: string | null,
  prefix: string | null,
): ElementImplementation {
  return new ElementImplementation(
    documentImplementation(document),
    namespaceURI,
    prefix,
    localName,
  );
}

export function createDocumentFragment(document: Document): DocumentFragment {
  return new DocumentFragment(
    new NodeImplementation(
      Node.DOCUMENT_FRAGMENT_NODE,
      "#document-fragment",
      documentImplementation(document),
    ),
  );
}

export function createText(document: Document, data: string): Text {
  return new Text(
    new CharacterDataImplementation(
      Node.TEXT_NODE,
      "#text",
      documentImplementation(document),
      data,
    ),
  );
}

export function createCDATASection(
  document: Document,
  data: string,
): CDATASection {
  return new CDATASection(
    new CharacterDataImplementation(
      Node.CDATA_SECTION_NODE,
      "#cdata-section",
      documentImplementation(document),
      data,
    ),
  );
}

export function createComment(document: Document, data: string): Comment {
  return new Comment(
    new CharacterDataImplementation(
      Node.COMMENT_NODE,
      "#comment",
      documentImplementation(document),
      data,
    ),
  );
}

export function createProcessingInstruction(
  document: Document,
  target: string,
  data: string,
): ProcessingInstruction {
  return new ProcessingInstruction(
    new CharacterDataImplementation(
      Node.PROCESSING_INSTRUCTION_NODE,
      target,
      documentImplementation(document),
      data,
    ),
  );
}

export function templateContentsDocument(document: Document): Document {
  const implementation = documentImplementation(document);
  implementation.templateContentsOwnerDocument ??= createDocument(
    implementation.fragmentParser,
    implementation.contentType,
    implementation.elementFactory,
    document instanceof XMLDocument ? XMLDocument : Document,
  );
  return implementation.templateContentsOwnerDocument;
}

export function fragmentParserForDocument(
  document: Document,
): FragmentParser | null {
  return documentImplementation(document).fragmentParser;
}

export function documentIsQuirks(document: Document): boolean {
  return documentImplementation(document).quirks;
}

export function setDocumentQuirks(document: Document, quirks: boolean): void {
  documentImplementation(document).quirks = quirks;
}

export function setDocumentURL(document: Document, value: string): void {
  const url = new URL(value);
  const implementation = documentImplementation(document);
  implementation.url = url;
  implementation.origin = originFromURL(url);
}

function nodeDocumentImplementation(
  node: NodeImplementation,
): DocumentImplementation {
  if (node instanceof DocumentImplementation) {
    return node;
  }
  if (node.ownerDocument === null) {
    throw new TypeError("Node has no node document");
  }
  return node.ownerDocument;
}

function invalidateDocumentNamedProperties(node: NodeImplementation): void {
  nodeDocumentImplementation(node).namedPropertyVersion += 1;
}

function notifyAttributeChange(
  element: Element,
  localName: string,
  namespace: string | null,
): void {
  nodeDocumentImplementation(
    nodeImplementation(element),
  ).attributeChangedSteps?.(element, localName, namespace);
}

function fallbackBaseURL(document: DocumentImplementation): URL {
  if (
    (document.url.href === "about:blank" ||
      document.url.href === "about:srcdoc") &&
    document.aboutBaseURL !== null
  ) {
    return document.aboutBaseURL;
  }
  return document.url;
}

function documentBaseURL(document: DocumentImplementation): URL {
  const frozen = document.firstBaseElementWithHref?.frozenBaseURL;
  return frozen ?? document.baseURLOverride ?? fallbackBaseURL(document);
}

function isHTMLBaseElement(element: ElementImplementation): boolean {
  return (
    element.namespaceURI === HTML_NAMESPACE && element.localName === "base"
  );
}

function baseHrefAttribute(
  element: ElementImplementation,
): AttrImplementation | null {
  return (
    element.attributes.find(
      (attribute) =>
        attribute.namespaceURI === null && attribute.localName === "href",
    ) ?? null
  );
}

function subtreeContainsHTMLBaseElement(node: NodeImplementation): boolean {
  if (node instanceof ElementImplementation && isHTMLBaseElement(node)) {
    return true;
  }
  return node.children.some(subtreeContainsHTMLBaseElement);
}

function firstBaseElementWithHref(
  root: NodeImplementation,
): ElementImplementation | null {
  for (const child of root.children) {
    if (
      child instanceof ElementImplementation &&
      isHTMLBaseElement(child) &&
      baseHrefAttribute(child) !== null
    ) {
      return child;
    }
    const descendant = firstBaseElementWithHref(child);
    if (descendant !== null) {
      return descendant;
    }
  }
  return null;
}

function setFrozenBaseURL(
  document: DocumentImplementation,
  element: ElementImplementation,
): void {
  const fallback = fallbackBaseURL(document);
  const href = baseHrefAttribute(element)?.value;
  if (href === undefined) {
    element.frozenBaseURL = null;
    return;
  }
  try {
    const parsed = new URL(href, fallback.href);
    element.frozenBaseURL =
      parsed.protocol === "data:" || parsed.protocol === "javascript:"
        ? new URL(fallback.href)
        : parsed;
  } catch {
    element.frozenBaseURL = new URL(fallback.href);
  }
}

function updateFirstBaseElementWithHref(
  document: DocumentImplementation,
  changedHrefElement: ElementImplementation | null = null,
): void {
  const first = firstBaseElementWithHref(document);
  if (first !== document.firstBaseElementWithHref) {
    document.firstBaseElementWithHref = first;
    if (first !== null) {
      setFrozenBaseURL(document, first);
    }
  } else if (first !== null && first === changedHrefElement) {
    setFrozenBaseURL(document, first);
  }
}

function respondToBaseHrefChange(
  element: ElementImplementation,
  attribute: AttrImplementation,
): void {
  if (
    isHTMLBaseElement(element) &&
    attribute.namespaceURI === null &&
    attribute.localName === "href"
  ) {
    updateFirstBaseElementWithHref(
      nodeDocumentImplementation(element),
      element,
    );
  }
}

function respondToScriptAsyncAttributeAddition(
  element: ElementImplementation,
  attribute: AttrImplementation,
): void {
  if (
    element.namespaceURI === HTML_NAMESPACE &&
    element.localName === "script" &&
    attribute.namespaceURI === null &&
    attribute.localName === "async"
  ) {
    element.scriptForceAsync = false;
  }
}

export function setDocumentParseErrors(
  document: Document,
  errors: readonly PalimParseError[],
): void {
  documentImplementation(document).parseErrors = Object.freeze(
    errors.map((error) => Object.freeze({ ...error })),
  );
}

export class DocumentType extends Node {
  constructor(implementation?: unknown) {
    if (!(implementation instanceof DocumentTypeImplementation)) {
      super();
      return;
    }
    super(implementation);
  }

  get name(): string {
    return documentTypeImplementation(this).name;
  }

  get publicId(): string {
    return documentTypeImplementation(this).publicId;
  }

  get systemId(): string {
    return documentTypeImplementation(this).systemId;
  }

  override get textContent(): null {
    return null;
  }

  override set textContent(value: string | null) {
    nullableDOMStringToString(value);
  }

  before(...nodes: (Node | string)[]): void {
    insertNodesBeforeChild(this, nodes);
  }

  after(...nodes: (Node | string)[]): void {
    insertNodesAfterChild(this, nodes);
  }

  replaceWith(...nodes: (Node | string)[]): void {
    replaceChildWithNodes(this, nodes);
  }

  remove(): void {
    removeNode(this);
  }
}

export class Attr extends Node {
  constructor(implementation?: unknown) {
    if (!(implementation instanceof AttrImplementation)) {
      super();
      return;
    }
    super(implementation);
  }

  get namespaceURI(): string | null {
    return attrImplementation(this).namespaceURI;
  }

  get localName(): string {
    return attrImplementation(this).localName;
  }

  get prefix(): string | null {
    return attrImplementation(this).prefix;
  }

  get name(): string {
    return attrImplementation(this).name;
  }

  get value(): string {
    return attrImplementation(this).value;
  }

  set value(value: string) {
    const implementation = attrImplementation(this);
    implementation.value = value;
    if (implementation.ownerElement !== null) {
      invalidateDocumentNamedProperties(implementation.ownerElement);
      respondToBaseHrefChange(implementation.ownerElement, implementation);
      const element = elementInterface(implementation.ownerElement);
      updateSlotAssignmentsForMutation(element);
      notifyAttributeChange(
        element,
        implementation.localName,
        implementation.namespaceURI,
      );
    }
  }

  get ownerElement(): Element | null {
    const implementation = attrImplementation(this).ownerElement;
    return implementation === null ? null : elementInterface(implementation);
  }

  get specified(): boolean {
    attrImplementation(this);
    return true;
  }

  override get textContent(): string {
    return this.value;
  }

  override set textContent(value: string | null) {
    this.value = nullableDOMStringToString(value);
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
  constructor(implementation?: unknown) {
    if (!(implementation instanceof ElementImplementation)) {
      super();
      return;
    }
    super(implementation);
  }

  get namespaceURI(): string | null {
    return elementImplementation(this).namespaceURI;
  }

  get prefix(): string | null {
    return elementImplementation(this).prefix;
  }

  get localName(): string {
    return elementImplementation(this).localName;
  }

  get tagName(): string {
    const implementation = elementImplementation(this);
    const qualifiedName =
      implementation.prefix === null
        ? implementation.localName
        : `${implementation.prefix}:${implementation.localName}`;
    return implementation.namespaceURI === HTML_NAMESPACE &&
      implementation.ownerDocument?.contentType === "text/html"
      ? asciiUppercase(qualifiedName)
      : qualifiedName;
  }

  get attributes(): NamedNodeMap {
    const implementation = elementImplementation(this);
    implementation.attributeMap ??= createNamedNodeMap(this);
    return implementation.attributeMap;
  }

  get shadowRoot(): ShadowRoot | null {
    const shadowRoot = elementImplementation(this).shadowRoot;
    return shadowRoot === null || shadowRoot.mode === "closed"
      ? null
      : (nodeInterface(shadowRoot) as ShadowRoot);
  }

  attachShadow(init: ShadowRootInit): ShadowRoot {
    requireArguments(arguments.length, 1);
    const implementation = elementImplementation(this);
    if (
      implementation.namespaceURI !== HTML_NAMESPACE ||
      implementation.shadowRoot !== null
    ) {
      throw new DOMException(
        "A shadow root cannot be attached to this element",
        "NotSupportedError",
      );
    }
    const document = this.ownerDocument;
    if (document === null) {
      throw new TypeError("Element has no owner document");
    }
    const shadowRoot = new ShadowRoot(
      new ShadowRootImplementation(
        documentImplementation(document),
        implementation,
        init.mode,
      ),
    );
    implementation.shadowRoot = shadowRootImplementation(shadowRoot);
    return shadowRoot;
  }

  get children(): HTMLCollection {
    const implementation = elementImplementation(this);
    implementation.elementChildren ??= createHTMLCollection(() =>
      childNodes(this).filter(
        (node): node is Element => node instanceof Element,
      ),
    );
    return implementation.elementChildren;
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

  get previousElementSibling(): Element | null {
    return previousElementSibling(this);
  }

  get nextElementSibling(): Element | null {
    return nextElementSibling(this);
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
    const implementation = elementImplementation(this);
    implementation.classList ??= createDOMTokenList(this, "class");
    return implementation.classList;
  }

  before(...nodes: (Node | string)[]): void {
    insertNodesBeforeChild(this, nodes);
  }

  after(...nodes: (Node | string)[]): void {
    insertNodesAfterChild(this, nodes);
  }

  replaceWith(...nodes: (Node | string)[]): void {
    replaceChildWithNodes(this, nodes);
  }

  remove(): void {
    removeNode(this);
  }

  prepend(...nodes: (Node | string)[]): void {
    prependNodes(this, nodes);
  }

  append(...nodes: (Node | string)[]): void {
    appendNodes(this, nodes);
  }

  replaceChildren(...nodes: (Node | string)[]): void {
    replaceChildrenWithNodes(this, nodes);
  }

  moveBefore(node: Node, child: Node | null): void {
    requireArguments(arguments.length, 2);
    requireNode(node);
    moveNodeBefore(this, node, nullableNode(child));
  }

  setHTML(html: string, options: HTMLParsingOptions = {}): void {
    setHTMLContent(this, domString(html), options, false);
  }

  setHTMLUnsafe(html: string, options: HTMLParsingOptions = {}): void {
    setHTMLContent(this, domString(html), options, true);
  }

  streamHTML(options: HTMLParsingOptions = {}): HTMLWritableStream {
    return createHTMLWritableStream(this, "replace", options, false);
  }

  streamHTMLUnsafe(options: HTMLParsingOptions = {}): HTMLWritableStream {
    return createHTMLWritableStream(this, "replace", options, true);
  }

  streamAppendHTML(options: HTMLParsingOptions = {}): HTMLWritableStream {
    return createHTMLWritableStream(this, "append", options, false);
  }

  streamAppendHTMLUnsafe(options: HTMLParsingOptions = {}): HTMLWritableStream {
    return createHTMLWritableStream(this, "append", options, true);
  }

  streamPrependHTML(options: HTMLParsingOptions = {}): HTMLWritableStream {
    return createHTMLWritableStream(this, "prepend", options, false);
  }

  streamPrependHTMLUnsafe(
    options: HTMLParsingOptions = {},
  ): HTMLWritableStream {
    return createHTMLWritableStream(this, "prepend", options, true);
  }

  streamBeforeHTML(options: HTMLParsingOptions = {}): HTMLWritableStream {
    return createHTMLWritableStream(this, "before", options, false);
  }

  streamBeforeHTMLUnsafe(options: HTMLParsingOptions = {}): HTMLWritableStream {
    return createHTMLWritableStream(this, "before", options, true);
  }

  streamAfterHTML(options: HTMLParsingOptions = {}): HTMLWritableStream {
    return createHTMLWritableStream(this, "after", options, false);
  }

  streamAfterHTMLUnsafe(options: HTMLParsingOptions = {}): HTMLWritableStream {
    return createHTMLWritableStream(this, "after", options, true);
  }

  streamReplaceWithHTML(options: HTMLParsingOptions = {}): HTMLWritableStream {
    return createHTMLWritableStream(this, "replace-with", options, false);
  }

  streamReplaceWithHTMLUnsafe(
    options: HTMLParsingOptions = {},
  ): HTMLWritableStream {
    return createHTMLWritableStream(this, "replace-with", options, true);
  }

  appendHTML(html: string, options: HTMLParsingOptions = {}): void {
    insertHTMLContent(this, null, domString(html), options, false);
  }

  appendHTMLUnsafe(html: string, options: HTMLParsingOptions = {}): void {
    insertHTMLContent(this, null, domString(html), options, true);
  }

  prependHTML(html: string, options: HTMLParsingOptions = {}): void {
    const target = targetForHTMLInsertion(this);
    insertHTMLContent(this, target.firstChild, domString(html), options, false);
  }

  prependHTMLUnsafe(html: string, options: HTMLParsingOptions = {}): void {
    const target = targetForHTMLInsertion(this);
    insertHTMLContent(this, target.firstChild, domString(html), options, true);
  }

  beforeHTML(html: string, options: HTMLParsingOptions = {}): void {
    insertRelativeHTML(this, "before", domString(html), options, false);
  }

  beforeHTMLUnsafe(html: string, options: HTMLParsingOptions = {}): void {
    insertRelativeHTML(this, "before", domString(html), options, true);
  }

  afterHTML(html: string, options: HTMLParsingOptions = {}): void {
    insertRelativeHTML(this, "after", domString(html), options, false);
  }

  afterHTMLUnsafe(html: string, options: HTMLParsingOptions = {}): void {
    insertRelativeHTML(this, "after", domString(html), options, true);
  }

  replaceWithHTML(html: string, options: HTMLParsingOptions = {}): void {
    insertRelativeHTML(this, "replace", domString(html), options, false);
  }

  replaceWithHTMLUnsafe(html: string, options: HTMLParsingOptions = {}): void {
    insertRelativeHTML(this, "replace", domString(html), options, true);
  }

  get innerHTML(): string {
    return this.#isHTMLDocument()
      ? serializeHTMLFragment(this)
      : serializeXMLFragment(this);
  }

  set innerHTML(value: string) {
    const fragment = this.#parseFragment(domString(value), this);
    const target = templateContents(this) ?? this;
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
    return findAttributeByName(this, domString(qualifiedName))?.value ?? null;
  }

  getAttributeNS(namespace: string | null, localName: string): string | null {
    return (
      findAttributeByNamespace(
        this,
        normalizeNamespace(namespace),
        domString(localName),
      )?.value ?? null
    );
  }

  getAttributeNode(qualifiedName: string): Attr | null {
    return findAttributeByName(this, domString(qualifiedName));
  }

  getAttributeNodeNS(namespace: string | null, localName: string): Attr | null {
    return findAttributeByNamespace(
      this,
      normalizeNamespace(namespace),
      domString(localName),
    );
  }

  getAttributeNames(): string[] {
    return attributeNodes(this).map((attribute) => attribute.name);
  }

  hasAttribute(qualifiedName: string): boolean {
    return findAttributeByName(this, domString(qualifiedName)) !== null;
  }

  hasAttributeNS(namespace: string | null, localName: string): boolean {
    return (
      findAttributeByNamespace(
        this,
        normalizeNamespace(namespace),
        domString(localName),
      ) !== null
    );
  }

  setAttribute(qualifiedName: string, value: string): void {
    requireArguments(arguments.length, 2);
    const name = this.#attributeName(domString(qualifiedName));
    validateAttributeLocalName(name);
    const convertedValue = domString(value);
    const attribute = findAttributeByName(this, name);
    if (attribute !== null) {
      attribute.value = convertedValue;
      notifyAttributeChange(this, attribute.localName, attribute.namespaceURI);
      return;
    }
    setAttributeNode(
      this,
      createAttr(this.#document(), this, name, convertedValue),
    );
  }

  setAttributeNS(
    namespace: string | null,
    qualifiedName: string,
    value: string,
  ): void {
    requireArguments(arguments.length, 3);
    const normalizedNamespace = normalizeNamespace(namespace);
    const extracted = validateAndExtract(
      normalizedNamespace,
      domString(qualifiedName),
    );
    const convertedValue = domString(value);
    const attribute = findAttributeByNamespace(
      this,
      normalizedNamespace,
      extracted.localName,
    );
    if (attribute !== null) {
      attribute.value = convertedValue;
      notifyAttributeChange(this, attribute.localName, attribute.namespaceURI);
      return;
    }
    setAttributeNode(
      this,
      createAttr(
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

  setAttributeNode(attribute: Attr): Attr | null {
    requireArguments(arguments.length, 1);
    return setAttributeNode(this, attribute);
  }

  setAttributeNodeNS(attribute: Attr): Attr | null {
    requireArguments(arguments.length, 1);
    return setAttributeNode(this, attribute);
  }

  removeAttributeNode(attribute: Attr): Attr {
    requireArguments(arguments.length, 1);
    if (!(attribute instanceof Attr)) {
      throw new TypeError("The argument is not an Attr");
    }
    if (attribute.ownerElement !== this) {
      throw new DOMException(
        "The attribute is not owned by this element",
        "NotFoundError",
      );
    }
    removeAttributeNode(this, attribute);
    return attribute;
  }

  removeAttribute(qualifiedName: string): void {
    removeAttributeByName(this, domString(qualifiedName));
  }

  removeAttributeNS(namespace: string | null, localName: string): void {
    removeAttributeByNamespace(
      this,
      normalizeNamespace(namespace),
      domString(localName),
    );
  }

  toggleAttribute(qualifiedName: string, force?: boolean): boolean {
    requireArguments(arguments.length, 1);
    const name = this.#attributeName(domString(qualifiedName));
    validateAttributeLocalName(name);
    const attribute = findAttributeByName(this, name);
    if (attribute === null) {
      if (arguments.length < 2 || Boolean(force)) {
        setAttributeNode(this, createAttr(this.#document(), this, name, ""));
        return true;
      }
      return false;
    }
    if (arguments.length < 2 || !Boolean(force)) {
      removeAttributeNode(this, attribute);
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
    return createNodeList(() => result);
  }

  matches(selectors: string): boolean {
    return matchesSelector(this, selectorArgument(selectors, arguments.length));
  }

  closest(selectors: string): Element | null {
    return closestSelector(this, selectorArgument(selectors, arguments.length));
  }

  hasAttributes(): boolean {
    return attributeNodes(this).length !== 0;
  }

  insertAdjacentElement(where: string, element: Element): Element | null {
    requireArguments(arguments.length, 2);
    const position = domString(where);
    if (!(element instanceof Element)) {
      throw new TypeError("The argument is not an Element");
    }
    return insertAdjacent(this, position, element) as Element | null;
  }

  insertAdjacentText(where: string, data: string): void {
    requireArguments(arguments.length, 2);
    const position = domString(where);
    const text = createText(this.#document(), domString(data));
    insertAdjacent(this, position, text);
  }

  getElementsByTagName(qualifiedName: string): HTMLCollection {
    return elementsByTagName(
      this,
      requiredDOMString(qualifiedName, arguments.length),
    );
  }

  getElementsByTagNameNS(
    namespace: string | null,
    localName: string,
  ): HTMLCollection {
    requireArguments(arguments.length, 2);
    return elementsByTagNameNS(
      this,
      normalizeNamespace(namespace),
      domString(localName),
    );
  }

  getElementsByClassName(classNames: string): HTMLCollection {
    return elementsByClassName(
      this,
      requiredDOMString(classNames, arguments.length),
    );
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
    return createElementForDocument(this.#document(), "body", HTML_NAMESPACE);
  }

  #isHTMLDocument(): boolean {
    return this.#document().contentType === "text/html";
  }

  #parseFragment(input: string, context: Element): DocumentFragment {
    const parser = fragmentParserForDocument(this.#document());
    if (parser === null) {
      throw new TypeError("Document has no fragment parser");
    }
    return parser.parse(input, context);
  }
}

export function attributeNodes(element: Element): Attr[] {
  return elementImplementation(element).attributes.map(attrInterface);
}

export function templateContents(element: Element): DocumentFragment | null {
  return elementImplementation(element).templateContents;
}

export function setTemplateContents(
  element: Element,
  contents: DocumentFragment | null,
): void {
  elementImplementation(element).templateContents = contents;
  if (contents !== null) {
    nodeImplementation(contents).htmlInsertionHost =
      elementImplementation(element);
  }
}

export function parseHTMLDocument(
  input: string,
  options: HTMLParsingOptions = {},
  unsafe = false,
  sourceDocument: Document | null = null,
): Document {
  if (htmlDocumentParser === null) {
    throw new TypeError("No HTML document parser is registered");
  }
  const config = sanitizerConfigForParsing(options.sanitizer, !unsafe);
  const document = htmlDocumentParser(input, true, config);
  if (sourceDocument !== null) {
    const source = documentImplementation(sourceDocument);
    const implementation = documentImplementation(document);
    implementation.origin = source.origin;
    implementation.relevantRealmDocument = source.relevantRealmDocument;
  }
  sanitizeHTMLTree(document, options, !unsafe);
  for (const element of descendantElements(document)) {
    if (
      element.localName === "script" &&
      (element.namespaceURI === HTML_NAMESPACE ||
        element.namespaceURI === SVG_NAMESPACE)
    ) {
      nodeImplementation(element).scriptAlreadyStarted = true;
    }
  }
  return document;
}

function targetForHTMLInsertion(element: Element): Element | DocumentFragment {
  return templateContents(element) ?? element;
}

function htmlInsertionHost(fragment: DocumentFragment): Element | null {
  if (fragment instanceof ShadowRoot) {
    return fragment.host;
  }
  const host = nodeImplementation(fragment).htmlInsertionHost;
  return host === null ? null : elementInterface(host);
}

function parentForHTMLInsertion(node: Node): {
  readonly parent: Element | DocumentFragment;
  readonly context: Element;
} | null {
  const parent = node.parentNode;
  if (parent === null) {
    return null;
  }
  if (
    parent instanceof Element &&
    parent.namespaceURI === HTML_NAMESPACE &&
    parent.localName === "template"
  ) {
    throw new DOMException(
      "A child of a template element cannot be updated positionally",
      "HierarchyRequestError",
    );
  }
  if (parent instanceof Element) {
    return { parent, context: parent };
  }
  if (parent instanceof DocumentFragment) {
    const context = htmlInsertionHost(parent);
    if (context !== null) {
      return { parent, context };
    }
  }
  throw new DOMException(
    "The parent cannot provide an HTML parser context",
    "HierarchyRequestError",
  );
}

function isHTMLOrSVGScript(element: Element): boolean {
  return (
    element.localName === "script" &&
    (element.namespaceURI === HTML_NAMESPACE ||
      element.namespaceURI === SVG_NAMESPACE)
  );
}

export type HTMLStreamingOperation =
  "replace" | "append" | "prepend" | "before" | "after" | "replace-with";

export class HTMLStreamingSink {
  readonly #target: Element | DocumentFragment;
  readonly #reference: Node | null;
  readonly #parser: HTMLStreamingParserSession;
  #finished = false;

  constructor(
    target: Element | DocumentFragment,
    reference: Node | null,
    parser: HTMLStreamingParserSession,
  ) {
    this.#target = target;
    this.#reference = reference;
    this.#parser = parser;
  }

  write(input: string): void {
    if (this.#finished) {
      throw new TypeError("The HTML stream is closed");
    }
    this.#validateReference();
    this.#parser.write(input);
  }

  close(): void {
    if (this.#finished) {
      return;
    }
    this.#parser.close();
    this.#finished = true;
  }

  abort(): void {
    if (this.#finished) {
      return;
    }
    this.#parser.abort();
    this.#finished = true;
  }

  #validateReference(): void {
    if (
      this.#reference !== null &&
      this.#reference.parentNode !== this.#target
    ) {
      this.#parser.abort();
      this.#finished = true;
      throw new DOMException(
        "The streaming reference child is no longer in its parent",
        "HierarchyRequestError",
      );
    }
  }
}

export function createHTMLStreamingSink(
  receiver: Element | ShadowRoot | CharacterData,
  operation: HTMLStreamingOperation,
  options: HTMLParsingOptions = {},
  unsafe = false,
): HTMLStreamingSink {
  if (htmlStreamingParserFactory === null) {
    throw new TypeError("No streaming HTML parser is registered");
  }

  let target: Element | DocumentFragment;
  let context: Element;
  let reference: Node | null;

  if (
    operation === "replace" ||
    operation === "append" ||
    operation === "prepend"
  ) {
    if (receiver instanceof CharacterData) {
      throw new TypeError("CharacterData is not an HTML stream container");
    }
    target =
      receiver instanceof Element ? targetForHTMLInsertion(receiver) : receiver;
    context = receiver instanceof Element ? receiver : receiver.host;
    if (
      operation !== "replace" &&
      target instanceof Element &&
      target.namespaceURI === HTML_NAMESPACE &&
      target.localName === "html"
    ) {
      throw new DOMException(
        "HTML cannot be streamed into an html element at a position",
        "HierarchyRequestError",
      );
    }
    reference = operation === "prepend" ? target.firstChild : null;
  } else {
    const insertion = parentForHTMLInsertion(receiver);
    if (
      insertion === null ||
      (insertion.parent instanceof Element &&
        insertion.parent.namespaceURI === HTML_NAMESPACE &&
        insertion.parent.localName === "html")
    ) {
      throw new DOMException(
        "The node has no parent suitable for HTML streaming",
        "HierarchyRequestError",
      );
    }
    target = insertion.parent;
    context = insertion.context;
    reference = operation === "before" ? receiver : receiver.nextSibling;
  }

  if (isHTMLOrSVGScript(context)) {
    throw new DOMException(
      "HTML cannot be streamed into a script context",
      "NotSupportedError",
    );
  }

  const config = sanitizerConfigForParsing(options.sanitizer, !unsafe);
  const parser = htmlStreamingParserFactory(target, context, reference, {
    allowDeclarativeShadowRoots: true,
    runScripts: unsafe && options.runScripts === true,
    ...(config === null ? {} : { sanitizerConfig: config }),
  });
  const sink = new HTMLStreamingSink(target, reference, parser);

  if (operation === "replace") {
    while (target.firstChild !== null) {
      target.removeChild(target.firstChild);
    }
  } else if (operation === "replace-with") {
    if (receiver instanceof ShadowRoot) {
      throw new TypeError("A ShadowRoot cannot be replaced positionally");
    }
    receiver.remove();
  }

  return sink;
}

function createHTMLWritableStream(
  receiver: Element | ShadowRoot | CharacterData,
  operation: HTMLStreamingOperation,
  options: HTMLParsingOptions,
  unsafe: boolean,
): HTMLWritableStream {
  const sink = createHTMLStreamingSink(receiver, operation, options, unsafe);
  return new HTMLWritableStreamPlatform(new WritableStreamState(sink));
}

class HTMLWritableStreamPlatform implements HTMLWritableStream {
  readonly #state: WritableStreamState<string>;

  constructor(state: WritableStreamState<string>) {
    this.#state = state;
  }

  get locked(): boolean {
    return this.#state.locked;
  }

  abort(reason?: unknown): Promise<void> {
    return promiseForOperation(() => {
      this.#state.abort(reason, true);
    });
  }

  close(): Promise<void> {
    return promiseForOperation(() => {
      this.#state.close(true);
    });
  }

  getWriter(): HTMLWritableStreamWriter {
    this.#state.acquireWriter();
    return new HTMLWritableStreamWriterPlatform(this.#state);
  }
}

class HTMLWritableStreamWriterPlatform implements HTMLWritableStreamWriter {
  readonly #state: WritableStreamState<string>;
  #released = false;

  constructor(state: WritableStreamState<string>) {
    this.#state = state;
  }

  get closed(): Promise<void> {
    this.#requireActive();
    return this.#state.status === "errored"
      ? Promise.reject(promiseRejection(this.#state.error))
      : Promise.resolve();
  }

  get desiredSize(): number | null {
    this.#requireActive();
    return this.#state.desiredSize;
  }

  get ready(): Promise<void> {
    this.#requireActive();
    return Promise.resolve();
  }

  abort(reason?: unknown): Promise<void> {
    return promiseForOperation(() => {
      this.#requireActive();
      this.#state.abort(reason);
    });
  }

  close(): Promise<void> {
    return promiseForOperation(() => {
      this.#requireActive();
      this.#state.close();
    });
  }

  releaseLock(): void {
    this.#requireActive();
    this.#released = true;
    this.#state.releaseWriter();
  }

  write(chunk?: unknown): Promise<void> {
    return promiseForOperation(() => {
      this.#requireActive();
      let input: string;
      try {
        input = domString(chunk);
      } catch (error: unknown) {
        this.#state.fail(error);
        throw error;
      }
      this.#state.write(input);
    });
  }

  #requireActive(): void {
    if (this.#released) {
      throw new TypeError("The WritableStreamDefaultWriter has been released");
    }
  }
}

function promiseForOperation(operation: () => void): Promise<void> {
  try {
    operation();
    return Promise.resolve();
  } catch (error: unknown) {
    return Promise.reject(promiseRejection(error));
  }
}

function promiseRejection(value: unknown): Error {
  return value instanceof Error ? value : new Error(String(value));
}

function parseHTMLForInsertion(
  context: Element,
  input: string,
  options: HTMLParsingOptions,
  unsafe: boolean,
): DocumentFragment | null {
  if (!unsafe && isHTMLOrSVGScript(context)) {
    return null;
  }
  if (htmlInsertionFragmentParser === null) {
    throw new TypeError("No HTML fragment parser is registered");
  }
  const config = sanitizerConfigForParsing(options.sanitizer, !unsafe);
  const fragment = htmlInsertionFragmentParser.parse(input, context, {
    allowDeclarativeShadowRoots: true,
    runScripts: unsafe && options.runScripts === true,
    ...(config === null ? {} : { sanitizerConfig: config }),
  });
  sanitizeHTMLTree(fragment, options, !unsafe);
  return fragment;
}

function setHTMLContent(
  receiver: Element | ShadowRoot,
  input: string,
  options: HTMLParsingOptions,
  unsafe: boolean,
): void {
  const target =
    receiver instanceof Element ? targetForHTMLInsertion(receiver) : receiver;
  const context = receiver instanceof Element ? receiver : receiver.host;
  const fragment = parseHTMLForInsertion(context, input, options, unsafe);
  if (fragment === null) {
    return;
  }
  while (target.firstChild !== null) {
    target.removeChild(target.firstChild);
  }
  target.appendChild(fragment);
}

function insertHTMLContent(
  receiver: Element | ShadowRoot,
  child: Node | null,
  input: string,
  options: HTMLParsingOptions,
  unsafe: boolean,
): void {
  const target =
    receiver instanceof Element ? targetForHTMLInsertion(receiver) : receiver;
  if (
    target instanceof Element &&
    target.namespaceURI === HTML_NAMESPACE &&
    target.localName === "html"
  ) {
    throw new DOMException(
      "HTML cannot be inserted into an html element at a position",
      "HierarchyRequestError",
    );
  }
  const context = receiver instanceof Element ? receiver : receiver.host;
  const fragment = parseHTMLForInsertion(context, input, options, unsafe);
  if (fragment !== null) {
    target.insertBefore(fragment, child);
  }
}

function insertRelativeHTML(
  node: Element | CharacterData,
  position: "before" | "after" | "replace",
  input: string,
  options: HTMLParsingOptions,
  unsafe: boolean,
): void {
  const insertion = parentForHTMLInsertion(node);
  if (insertion === null) {
    return;
  }
  const { parent, context } = insertion;
  if (
    parent instanceof Element &&
    parent.namespaceURI === HTML_NAMESPACE &&
    parent.localName === "html"
  ) {
    throw new DOMException(
      "HTML cannot be inserted adjacent to a child of html",
      "HierarchyRequestError",
    );
  }
  const fragment = parseHTMLForInsertion(context, input, options, unsafe);
  if (fragment === null) {
    return;
  }
  if (position === "replace") {
    parent.replaceChild(fragment, node);
  } else {
    parent.insertBefore(
      fragment,
      position === "before" ? node : node.nextSibling,
    );
  }
}

function sanitizeHTMLTree(
  root: Node,
  options: HTMLParsingOptions,
  safe: boolean,
): void {
  const config = sanitizerConfigForParsing(options.sanitizer, safe);
  if (config !== null) {
    sanitizeHTMLChildren(root, config);
  }
}

function sanitizeHTMLChildren(
  parent: Node,
  config: CanonicalSanitizerConfig,
): void {
  for (const child of childNodes(parent)) {
    if (child instanceof Comment) {
      if (!sanitizerAllowsComments(config)) {
        removeNode(child);
      }
      continue;
    }
    if (child instanceof ProcessingInstruction) {
      if (!sanitizerAllowsPI(config, child.target)) {
        removeNode(child);
      }
      continue;
    }
    if (!(child instanceof Element)) {
      continue;
    }
    const action = sanitizerAction(config, child.localName, child.namespaceURI);
    if (action === "remove") {
      removeNode(child);
      continue;
    }
    if (action === "replace") {
      replaceElementWithSanitizedChildren(child, config);
      continue;
    }
    for (const attribute of attributeNodes(child)) {
      if (
        !sanitizerAllowsAttribute(
          config,
          attribute.localName,
          attribute.namespaceURI,
          attribute.value,
          child.localName,
          child.namespaceURI,
        )
      ) {
        child.removeAttributeNS(attribute.namespaceURI, attribute.localName);
      }
    }
    sanitizeHTMLChildren(child, config);
    const contents = templateContents(child);
    if (contents !== null) {
      sanitizeHTMLChildren(contents, config);
    }
    const shadow = elementImplementation(child).shadowRoot;
    if (shadow !== null) {
      sanitizeHTMLChildren(nodeInterface(shadow), config);
    }
  }
}

function replaceElementWithSanitizedChildren(
  element: Element,
  config: CanonicalSanitizerConfig,
): void {
  const parent = element.parentNode;
  if (parent === null) {
    return;
  }
  const shadowImplementation = elementImplementation(element).shadowRoot;
  if (shadowImplementation !== null && element.ownerDocument !== null) {
    const shadow = nodeInterface(shadowImplementation) as ShadowRoot;
    const template = element.ownerDocument.createElement("template");
    template.setAttribute("shadowrootmode", shadow.mode);
    const contents = templateContents(template);
    if (contents !== null) {
      while (shadow.firstChild !== null) {
        contents.appendChild(shadow.firstChild);
      }
    }
    element.insertBefore(template, element.firstChild);
  }
  sanitizeHTMLChildren(element, config);
  for (const child of childNodes(element)) {
    parent.insertBefore(child, element);
  }
  removeNode(element);
}

export function findAttributeByName(
  element: Element,
  qualifiedName: string,
): Attr | null {
  const name = attributeName(element, qualifiedName);
  const implementation = elementImplementation(element).attributes.find(
    (attribute) => attribute.name === name,
  );
  return implementation === undefined ? null : attrInterface(implementation);
}

export function findAttributeByNamespace(
  element: Element,
  namespace: string | null,
  localName: string,
): Attr | null {
  const implementation = elementImplementation(element).attributes.find(
    (attribute) =>
      attribute.namespaceURI === namespace && attribute.localName === localName,
  );
  return implementation === undefined ? null : attrInterface(implementation);
}

export function setAttributeNode(
  element: Element,
  value: unknown,
): Attr | null {
  if (!(value instanceof Attr)) {
    throw new TypeError("The argument is not an Attr");
  }
  const valueImplementation = attrImplementation(value);
  const implementation = elementImplementation(element);
  if (
    valueImplementation.ownerElement !== null &&
    valueImplementation.ownerElement !== implementation
  ) {
    throw new DOMException(
      "The attribute is already in use",
      "InUseAttributeError",
    );
  }
  const oldAttribute = findAttributeByNamespace(
    element,
    value.namespaceURI,
    value.localName,
  );
  if (oldAttribute === value) {
    return value;
  }
  valueImplementation.ownerDocument = implementation.ownerDocument;
  valueImplementation.ownerElement = implementation;
  if (oldAttribute === null) {
    implementation.attributes.push(valueImplementation);
    invalidateDocumentNamedProperties(implementation);
    respondToBaseHrefChange(implementation, valueImplementation);
    respondToScriptAsyncAttributeAddition(implementation, valueImplementation);
    updateSlotAssignmentsForMutation(element);
    notifyAttributeChange(element, value.localName, value.namespaceURI);
    return null;
  }
  const oldImplementation = attrImplementation(oldAttribute);
  const index = implementation.attributes.indexOf(oldImplementation);
  implementation.attributes[index] = valueImplementation;
  oldImplementation.ownerElement = null;
  invalidateDocumentNamedProperties(implementation);
  respondToBaseHrefChange(implementation, valueImplementation);
  respondToScriptAsyncAttributeAddition(implementation, valueImplementation);
  updateSlotAssignmentsForMutation(element);
  notifyAttributeChange(element, value.localName, value.namespaceURI);
  return oldAttribute;
}

export function removeAttributeByName(
  element: Element,
  qualifiedName: string,
): Attr | null {
  const attribute = findAttributeByName(element, qualifiedName);
  if (attribute !== null) {
    removeAttributeNode(element, attribute);
  }
  return attribute;
}

export function removeAttributeByNamespace(
  element: Element,
  namespace: string | null,
  localName: string,
): Attr | null {
  const attribute = findAttributeByNamespace(element, namespace, localName);
  if (attribute !== null) {
    removeAttributeNode(element, attribute);
  }
  return attribute;
}

export function removeAttributeNode(element: Element, attribute: Attr): void {
  const implementation = elementImplementation(element);
  const attributeImplementation = attrImplementation(attribute);
  const index = implementation.attributes.indexOf(attributeImplementation);
  if (index < 0) {
    return;
  }
  implementation.attributes.splice(index, 1);
  attributeImplementation.ownerElement = null;
  invalidateDocumentNamedProperties(implementation);
  respondToBaseHrefChange(implementation, attributeImplementation);
  updateSlotAssignmentsForMutation(element);
  notifyAttributeChange(element, attribute.localName, attribute.namespaceURI);
}

export function setAttributes(
  element: Element,
  attributes: readonly AttributeData[],
): void {
  const document = element.ownerDocument;
  if (document === null) {
    throw new TypeError("Element has no owner document");
  }
  for (const attribute of attributes) {
    if (attributeNodes(element).some((item) => item.name === attribute.name)) {
      continue;
    }
    setAttributeNode(
      element,
      createAttr(
        document,
        element,
        attribute.name,
        attribute.value,
        attribute.namespaceURI ?? null,
        attribute.prefix ?? null,
        attribute.localName ?? attribute.name,
      ),
    );
  }
}

function attributeName(element: Element, name: string): string {
  return element.namespaceURI === HTML_NAMESPACE &&
    element.ownerDocument?.contentType === "text/html"
    ? asciiLowercase(name)
    : name;
}

export class DocumentFragment extends Node {
  constructor(implementation?: unknown) {
    if (implementation instanceof NodeImplementation) {
      super(implementation);
      return;
    }
    const document = new Document();
    super(
      new NodeImplementation(
        Node.DOCUMENT_FRAGMENT_NODE,
        "#document-fragment",
        documentImplementation(document),
      ),
    );
  }

  get children(): HTMLCollection {
    const implementation = nodeImplementation(this);
    implementation.elementChildren ??= createHTMLCollection(() =>
      childNodes(this).filter(
        (node): node is Element => node instanceof Element,
      ),
    );
    return implementation.elementChildren;
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

  prepend(...nodes: (Node | string)[]): void {
    prependNodes(this, nodes);
  }

  append(...nodes: (Node | string)[]): void {
    appendNodes(this, nodes);
  }

  replaceChildren(...nodes: (Node | string)[]): void {
    replaceChildrenWithNodes(this, nodes);
  }

  moveBefore(node: Node, child: Node | null): void {
    requireArguments(arguments.length, 2);
    requireNode(node);
    moveNodeBefore(this, node, nullableNode(child));
  }

  querySelector(selectors: string): Element | null {
    return selectFirst(this, selectorArgument(selectors, arguments.length));
  }

  querySelectorAll(selectors: string): NodeList<Element> {
    const result = selectAll(
      this,
      selectorArgument(selectors, arguments.length),
    );
    return createNodeList(() => result);
  }

  getElementById(elementId: string): Element | null {
    return findElementById(
      this,
      requiredDOMString(elementId, arguments.length),
    );
  }
}

export class ShadowRoot extends DocumentFragment {
  constructor(implementation?: unknown) {
    if (!(implementation instanceof ShadowRootImplementation)) {
      super();
      throw new TypeError("Illegal constructor");
    }
    super(implementation);
  }

  get mode(): "open" | "closed" {
    return shadowRootImplementation(this).mode;
  }

  get host(): Element {
    return elementInterface(shadowRootImplementation(this).host);
  }

  get innerHTML(): string {
    return serializeHTMLFragment(this);
  }

  set innerHTML(value: string) {
    const document = this.host.ownerDocument;
    if (document === null) {
      throw new TypeError("ShadowRoot host has no owner document");
    }
    const parser = fragmentParserForDocument(document);
    if (parser === null) {
      throw new TypeError("Document has no fragment parser");
    }
    const fragment = parser.parse(domString(value), this.host);
    while (this.firstChild !== null) {
      this.removeChild(this.firstChild);
    }
    this.appendChild(fragment);
  }

  setHTML(html: string, options: HTMLParsingOptions = {}): void {
    setHTMLContent(this, domString(html), options, false);
  }

  setHTMLUnsafe(html: string, options: HTMLParsingOptions = {}): void {
    setHTMLContent(this, domString(html), options, true);
  }

  streamHTML(options: HTMLParsingOptions = {}): HTMLWritableStream {
    return createHTMLWritableStream(this, "replace", options, false);
  }

  streamHTMLUnsafe(options: HTMLParsingOptions = {}): HTMLWritableStream {
    return createHTMLWritableStream(this, "replace", options, true);
  }

  streamAppendHTML(options: HTMLParsingOptions = {}): HTMLWritableStream {
    return createHTMLWritableStream(this, "append", options, false);
  }

  streamAppendHTMLUnsafe(options: HTMLParsingOptions = {}): HTMLWritableStream {
    return createHTMLWritableStream(this, "append", options, true);
  }

  streamPrependHTML(options: HTMLParsingOptions = {}): HTMLWritableStream {
    return createHTMLWritableStream(this, "prepend", options, false);
  }

  streamPrependHTMLUnsafe(
    options: HTMLParsingOptions = {},
  ): HTMLWritableStream {
    return createHTMLWritableStream(this, "prepend", options, true);
  }

  appendHTML(html: string, options: HTMLParsingOptions = {}): void {
    insertHTMLContent(this, null, domString(html), options, false);
  }

  appendHTMLUnsafe(html: string, options: HTMLParsingOptions = {}): void {
    insertHTMLContent(this, null, domString(html), options, true);
  }

  prependHTML(html: string, options: HTMLParsingOptions = {}): void {
    insertHTMLContent(this, this.firstChild, domString(html), options, false);
  }

  prependHTMLUnsafe(html: string, options: HTMLParsingOptions = {}): void {
    insertHTMLContent(this, this.firstChild, domString(html), options, true);
  }
}

export class CharacterData extends Node {
  constructor(implementation?: unknown) {
    if (!(implementation instanceof CharacterDataImplementation)) {
      super();
      return;
    }
    super(implementation);
  }

  get data(): string {
    return characterDataImplementation(this).data;
  }

  set data(value: string) {
    replaceCharacterData(this, 0, this.length, legacyNullToEmptyString(value));
  }

  get length(): number {
    return this.data.length;
  }

  override get textContent(): string {
    return this.data;
  }

  override set textContent(value: string | null) {
    const data = nullableDOMStringToString(value);
    replaceCharacterData(this, 0, this.length, data);
  }

  beforeHTML(html: string, options: HTMLParsingOptions = {}): void {
    insertRelativeHTML(this, "before", domString(html), options, false);
  }

  beforeHTMLUnsafe(html: string, options: HTMLParsingOptions = {}): void {
    insertRelativeHTML(this, "before", domString(html), options, true);
  }

  afterHTML(html: string, options: HTMLParsingOptions = {}): void {
    insertRelativeHTML(this, "after", domString(html), options, false);
  }

  afterHTMLUnsafe(html: string, options: HTMLParsingOptions = {}): void {
    insertRelativeHTML(this, "after", domString(html), options, true);
  }

  replaceWithHTML(html: string, options: HTMLParsingOptions = {}): void {
    insertRelativeHTML(this, "replace", domString(html), options, false);
  }

  replaceWithHTMLUnsafe(html: string, options: HTMLParsingOptions = {}): void {
    insertRelativeHTML(this, "replace", domString(html), options, true);
  }

  substringData(offset: number, count: number): string {
    requireArguments(arguments.length, 2);
    const convertedOffset = toUnsignedLong(offset);
    const convertedCount = toUnsignedLong(count);
    if (convertedOffset > this.length) {
      throw new DOMException(
        "The offset exceeds the data length",
        "IndexSizeError",
      );
    }
    return this.data.slice(convertedOffset, convertedOffset + convertedCount);
  }

  appendData(data: string): void {
    requireArguments(arguments.length, 1);
    replaceCharacterData(this, this.length, 0, domString(data));
  }

  insertData(offset: number, data: string): void {
    requireArguments(arguments.length, 2);
    const convertedOffset = toUnsignedLong(offset);
    const convertedData = domString(data);
    replaceCharacterData(this, convertedOffset, 0, convertedData);
  }

  deleteData(offset: number, count: number): void {
    requireArguments(arguments.length, 2);
    const convertedOffset = toUnsignedLong(offset);
    const convertedCount = toUnsignedLong(count);
    replaceCharacterData(this, convertedOffset, convertedCount, "");
  }

  replaceData(offset: number, count: number, data: string): void {
    requireArguments(arguments.length, 3);
    const convertedOffset = toUnsignedLong(offset);
    const convertedCount = toUnsignedLong(count);
    const convertedData = domString(data);
    replaceCharacterData(this, convertedOffset, convertedCount, convertedData);
  }

  get previousElementSibling(): Element | null {
    return previousElementSibling(this);
  }

  get nextElementSibling(): Element | null {
    return nextElementSibling(this);
  }

  streamBeforeHTML(options: HTMLParsingOptions = {}): HTMLWritableStream {
    return createHTMLWritableStream(this, "before", options, false);
  }

  streamBeforeHTMLUnsafe(options: HTMLParsingOptions = {}): HTMLWritableStream {
    return createHTMLWritableStream(this, "before", options, true);
  }

  streamAfterHTML(options: HTMLParsingOptions = {}): HTMLWritableStream {
    return createHTMLWritableStream(this, "after", options, false);
  }

  streamAfterHTMLUnsafe(options: HTMLParsingOptions = {}): HTMLWritableStream {
    return createHTMLWritableStream(this, "after", options, true);
  }

  streamReplaceWithHTML(options: HTMLParsingOptions = {}): HTMLWritableStream {
    return createHTMLWritableStream(this, "replace-with", options, false);
  }

  streamReplaceWithHTMLUnsafe(
    options: HTMLParsingOptions = {},
  ): HTMLWritableStream {
    return createHTMLWritableStream(this, "replace-with", options, true);
  }

  before(...nodes: (Node | string)[]): void {
    insertNodesBeforeChild(this, nodes);
  }

  after(...nodes: (Node | string)[]): void {
    insertNodesAfterChild(this, nodes);
  }

  replaceWith(...nodes: (Node | string)[]): void {
    replaceChildWithNodes(this, nodes);
  }

  remove(): void {
    removeNode(this);
  }
}

export function replaceCharacterData(
  node: CharacterData,
  offset: number,
  count: number,
  data: string,
): void {
  if (offset > node.length) {
    throw new DOMException(
      "The offset exceeds the data length",
      "IndexSizeError",
    );
  }
  const removed = Math.min(count, node.length - offset);
  adjustLiveRangesForData(node, offset, removed, data.length);
  const implementation = characterDataImplementation(node);
  implementation.data =
    implementation.data.slice(0, offset) +
    data +
    implementation.data.slice(offset + removed);
  if (implementation.parent !== null) {
    invalidateDescendantText(implementation.parent);
  }
}

export function appendCharacterData(node: CharacterData, data: string): void {
  replaceCharacterData(node, node.length, 0, data);
}

function previousElementSibling(node: Node): Element | null {
  let sibling = node.previousSibling;
  while (sibling !== null && !(sibling instanceof Element)) {
    sibling = sibling.previousSibling;
  }
  return sibling;
}

function nextElementSibling(node: Node): Element | null {
  let sibling = node.nextSibling;
  while (sibling !== null && !(sibling instanceof Element)) {
    sibling = sibling.nextSibling;
  }
  return sibling;
}

export class Text extends CharacterData {
  constructor(dataOrImplementation: unknown = "") {
    if (dataOrImplementation instanceof CharacterDataImplementation) {
      super(dataOrImplementation);
      return;
    }
    const document = new Document();
    super(
      new CharacterDataImplementation(
        Node.TEXT_NODE,
        "#text",
        documentImplementation(document),
        domString(dataOrImplementation),
      ),
    );
  }

  get wholeText(): string {
    const preceding: Text[] = [];
    let sibling = this.previousSibling;
    while (sibling instanceof Text) {
      preceding.unshift(sibling);
      sibling = sibling.previousSibling;
    }
    let result = preceding.map((text) => text.data).join("") + this.data;
    sibling = this.nextSibling;
    while (sibling instanceof Text) {
      result += sibling.data;
      sibling = sibling.nextSibling;
    }
    return result;
  }

  splitText(offset: number): Text {
    requireArguments(arguments.length, 1);
    const convertedOffset = toUnsignedLong(offset);
    if (convertedOffset > this.length) {
      throw new DOMException(
        "The offset exceeds the data length",
        "IndexSizeError",
      );
    }
    const split = createText(
      childNodeDocument(this),
      this.data.slice(convertedOffset),
    );
    const parent = this.parentNode;
    let insertionOffset = 0;
    if (parent !== null) {
      insertionOffset = childNodes(parent).indexOf(this) + 1;
      parent.insertBefore(split, this.nextSibling);
    }
    adjustLiveRangesForTextSplit(
      this,
      split,
      convertedOffset,
      parent,
      insertionOffset,
    );
    replaceCharacterData(
      this,
      convertedOffset,
      this.length - convertedOffset,
      "",
    );
    return split;
  }
}

export class CDATASection extends Text {
  constructor(implementation?: unknown) {
    if (!(implementation instanceof CharacterDataImplementation)) {
      throw new TypeError("Illegal constructor");
    }
    super(implementation);
  }
}

export class Comment extends CharacterData {
  constructor(dataOrImplementation: unknown = "") {
    if (dataOrImplementation instanceof CharacterDataImplementation) {
      super(dataOrImplementation);
      return;
    }
    const document = new Document();
    super(
      new CharacterDataImplementation(
        Node.COMMENT_NODE,
        "#comment",
        documentImplementation(document),
        domString(dataOrImplementation),
      ),
    );
  }
}

export class ProcessingInstruction extends CharacterData {
  constructor(targetOrImplementation?: unknown, data = "") {
    if (targetOrImplementation instanceof CharacterDataImplementation) {
      super(targetOrImplementation);
      return;
    }
    requireArguments(arguments.length, 1);
    const target = domString(targetOrImplementation);
    validateName(target);
    const convertedData = domString(data);
    if (convertedData.includes("?>")) {
      throw new DOMException(
        "Processing instruction data cannot contain ?>",
        "InvalidCharacterError",
      );
    }
    const document = new Document();
    super(
      new CharacterDataImplementation(
        Node.PROCESSING_INSTRUCTION_NODE,
        target,
        documentImplementation(document),
        convertedData,
      ),
    );
  }

  get target(): string {
    return this.nodeName;
  }
}

export function cloneNodeIntoDocument(
  node: Node,
  document: Document,
  subtree: boolean,
): Node {
  const copy = cloneSingleNode(node, document);
  nodeImplementation(copy).scriptAlreadyStarted =
    nodeImplementation(node).scriptAlreadyStarted;
  nodeImplementation(copy).scriptForceAsync =
    nodeImplementation(node).scriptForceAsync;
  const childDocument = copy instanceof Document ? copy : document;

  if (
    subtree &&
    node instanceof Element &&
    copy instanceof Element &&
    templateContents(node) !== null &&
    templateContents(copy) !== null
  ) {
    const sourceContents = templateContents(node);
    const copyContents = templateContents(copy);
    if (sourceContents === null || copyContents === null) {
      throw new TypeError("Template contents are missing");
    }
    const templateDocument = copyContents.ownerDocument;
    if (templateDocument === null) {
      throw new TypeError("Template contents have no owner document");
    }
    for (const child of childNodes(sourceContents)) {
      appendNode(
        copyContents,
        cloneNodeIntoDocument(child, templateDocument, true),
      );
    }
  }

  if (subtree) {
    for (const child of childNodes(node)) {
      appendNode(copy, cloneNodeIntoDocument(child, childDocument, true));
    }
  }
  return copy;
}

function cloneSingleNode(node: Node, document: Document): Node {
  if (node instanceof Element) {
    const copy = createElementForDocument(
      document,
      node.localName,
      node.namespaceURI,
      node.prefix,
    );
    setAttributes(
      copy,
      attributeNodes(node).map((attribute) => ({
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
    const implementation = documentImplementation(node);
    const copy = createDocument(
      implementation.fragmentParser,
      node.contentType,
      implementation.elementFactory,
      node instanceof XMLDocument ? XMLDocument : Document,
    );
    const copyImplementation = documentImplementation(copy);
    copyImplementation.relevantRealmDocument =
      implementation.relevantRealmDocument;
    copyImplementation.encoding = implementation.encoding;
    copyImplementation.url = new URL(implementation.url.href);
    copyImplementation.origin = implementation.origin;
    copyImplementation.aboutBaseURL =
      implementation.aboutBaseURL === null
        ? null
        : new URL(implementation.aboutBaseURL.href);
    copyImplementation.baseURLOverride = new URL(
      documentBaseURL(implementation).href,
    );
    setDocumentQuirks(copy, implementation.quirks);
    return copy;
  }
  if (node instanceof DocumentType) {
    return createDocumentType(
      document,
      node.name,
      node.publicId,
      node.systemId,
    );
  }
  if (node instanceof Attr) {
    return createAttr(
      document,
      null,
      node.name,
      node.value,
      node.namespaceURI,
      node.prefix,
      node.localName,
    );
  }
  if (node instanceof CDATASection) {
    return createCDATASection(document, node.data);
  }
  if (node instanceof Text) {
    return createText(document, node.data);
  }
  if (node instanceof Comment) {
    return createComment(document, node.data);
  }
  if (node instanceof ProcessingInstruction) {
    return createProcessingInstruction(document, node.target, node.data);
  }
  if (node instanceof DocumentFragment) {
    return createDocumentFragment(document);
  }
  if (node instanceof CharacterData) {
    return new CharacterData(
      new CharacterDataImplementation(
        node.nodeType,
        node.nodeName,
        documentImplementation(document),
        node.data,
      ),
    );
  }
  return new Node(
    new NodeImplementation(
      node.nodeType,
      node.nodeName,
      documentImplementation(document),
    ),
  );
}

function defaultElementFactory(
  document: Document,
  localName: string,
  namespaceURI: string | null,
  prefix: string | null,
): Element {
  return createElementInterface(document, localName, namespaceURI, prefix);
}

export function setDocumentElementFactory(factory: ElementFactory): void {
  documentElementFactory = factory;
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
  return descendantImplementationText(nodeImplementation(node));
}

function descendantImplementationText(node: NodeImplementation): string {
  if (node.descendantTextCache !== null) {
    return node.descendantTextCache;
  }
  let result = "";
  for (const child of node.children) {
    if (
      child.nodeType === Node.TEXT_NODE ||
      child.nodeType === Node.CDATA_SECTION_NODE
    ) {
      result += (child as CharacterDataImplementation).data;
    } else {
      result += descendantImplementationText(child);
    }
  }
  node.descendantTextCache = result;
  return result;
}

function normalizeDescendantText(node: Node): void {
  let index = 0;
  while (index < childNodes(node).length) {
    const child = childNodes(node)[index];
    if (child === undefined) {
      break;
    }
    if (child.nodeType === Node.TEXT_NODE) {
      const text = child as Text;
      if (text.length === 0) {
        removeNode(text);
        continue;
      }

      while (text.nextSibling?.nodeType === Node.TEXT_NODE) {
        const sibling = text.nextSibling as Text;
        const length = text.length;
        appendCharacterData(text, sibling.data);
        adjustLiveRangesForTextMerge(sibling, text, length);
        removeNode(sibling);
      }
    } else {
      normalizeDescendantText(child);
    }
    index += 1;
  }
}

type CollectionLookupRoot = Document | Element;

function findElementById(root: Node, elementId: string): Element | null {
  if (elementId === "") {
    return null;
  }
  return (
    descendantElements(root).find(
      (element) =>
        findAttributeByNamespace(element, null, "id")?.value === elementId,
    ) ?? null
  );
}

function elementsByTagName(
  root: CollectionLookupRoot,
  qualifiedName: string,
): HTMLCollection {
  const document = lookupDocument(root);
  const htmlName = asciiLowercase(qualifiedName);
  return createDescendantElementCollection(root, (element) => {
    if (qualifiedName === "*") {
      return true;
    }
    const name = elementQualifiedName(element);
    return document.contentType === "text/html" &&
      element.namespaceURI === HTML_NAMESPACE
      ? name === htmlName
      : name === qualifiedName;
  });
}

function elementsByTagNameNS(
  root: CollectionLookupRoot,
  namespace: string | null,
  localName: string,
): HTMLCollection {
  return createDescendantElementCollection(
    root,
    (element) =>
      (namespace === "*" || element.namespaceURI === namespace) &&
      (localName === "*" || element.localName === localName),
  );
}

function createDescendantElementCollection(
  root: CollectionLookupRoot,
  matches: (element: Element) => boolean,
): HTMLCollection {
  let cachedDescendants: Element[] | null = null;
  let cachedMatches: Element[] = [];
  return createHTMLCollection(() => {
    const descendants = descendantElements(root);
    if (descendants !== cachedDescendants) {
      cachedDescendants = descendants;
      cachedMatches = descendants.filter(matches);
    }
    return cachedMatches;
  });
}

function elementsByClassName(
  root: CollectionLookupRoot,
  classNames: string,
): HTMLCollection {
  const document = lookupDocument(root);
  const classes = orderedSet(classNames);
  const quirks =
    document.contentType === "text/html" && documentIsQuirks(document);
  const requiredClasses = quirks ? classes.map(asciiLowercase) : classes;
  return createHTMLCollection(() => {
    if (requiredClasses.length === 0) {
      return [];
    }
    return descendantElements(root).filter((element) => {
      const elementClasses = orderedSet(
        findAttributeByNamespace(element, null, "class")?.value ?? "",
      );
      const comparedClasses = quirks
        ? elementClasses.map(asciiLowercase)
        : elementClasses;
      return requiredClasses.every((name) => comparedClasses.includes(name));
    });
  });
}

function lookupDocument(root: CollectionLookupRoot): Document {
  if (root instanceof Document) {
    return root;
  }
  const document = root.ownerDocument;
  if (document === null) {
    throw new TypeError("Element has no owner document");
  }
  return document;
}

function elementQualifiedName(element: Element): string {
  return element.prefix === null
    ? element.localName
    : `${element.prefix}:${element.localName}`;
}

function orderedSet(value: string): string[] {
  return [...new Set(value.split(/[\t\n\f\r ]+/).filter(Boolean))];
}

function requiredDOMString(value: unknown, length: number): string {
  requireArguments(length, 1);
  return domString(value);
}

function legacyNullToEmptyString(value: unknown): string {
  return value === null ? "" : domString(value);
}

function nullableDOMStringToString(value: unknown): string {
  return value === null || value === undefined ? "" : domString(value);
}

function toUnsignedLong(value: unknown): number {
  if (typeof value === "bigint") {
    throw new TypeError("Cannot convert a BigInt value to a number");
  }
  const number = Number(value);
  if (!Number.isFinite(number) || number === 0) {
    return 0;
  }
  const integer = Math.trunc(number);
  return ((integer % 0x1_0000_0000) + 0x1_0000_0000) % 0x1_0000_0000;
}

function selectorArgument(value: unknown, length: number): string {
  return requiredDOMString(value, length);
}

function requireNodeArgument(
  value: unknown,
  argumentCount: number,
): asserts value is Node {
  requireArguments(argumentCount, 1);
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
  childrenToExclude: readonly Node[] = [],
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
  if (isHostIncludingInclusiveAncestor(node, parent)) {
    throw new DOMException(
      "The new child is an ancestor of this node",
      "HierarchyRequestError",
    );
  }
  if (child !== null && child.parentNode !== parent) {
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
    validateDocumentInsertion(node, parent, child, childrenToExclude);
  }
}

export function validatePreInsertion(
  node: Node,
  parent: Node,
  child: Node | null,
): void {
  ensurePreInsertionValidity(node, parent, child);
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
    current = current.parentNode;
  }
  return false;
}

function isHostIncludingInclusiveAncestor(ancestor: Node, node: Node): boolean {
  let current: Node | null = node;
  while (current !== null) {
    if (current === ancestor) {
      return true;
    }
    const root = nodeRoot(current);
    current = root instanceof ShadowRoot ? root.host : current.parentNode;
  }
  return false;
}

function nodeRoot(node: Node): Node {
  let root = node;
  while (root.parentNode !== null) {
    root = root.parentNode;
  }
  return root;
}

function shadowIncludingRoot(node: Node): Node {
  let root = nodeRoot(node);
  while (root instanceof ShadowRoot) {
    root = nodeRoot(root.host);
  }
  return root;
}

const LAST_SLOT_ASSIGNMENTS = new WeakMap<Element, readonly Node[]>();
const SIGNALLED_SLOTS = new Set<Element>();
let slotChangeMicrotaskQueued = false;

export function assignedSlotNodes(slot: Element, flatten = false): Node[] {
  if (!isSlotElement(slot)) {
    return [];
  }
  const root = nodeRoot(slot);
  if (!(root instanceof ShadowRoot)) {
    return [];
  }
  const name = slot.getAttribute("name") ?? "";
  const matchingSlots = slotElements(root).filter(
    (candidate) => (candidate.getAttribute("name") ?? "") === name,
  );
  if (matchingSlots[0] !== slot) {
    return [];
  }
  const assigned = childNodes(root.host).filter(
    (candidate): candidate is Element | Text =>
      (candidate instanceof Element || candidate instanceof Text) &&
      (candidate instanceof Element
        ? (candidate.getAttribute("slot") ?? "")
        : "") === name,
  );
  return flatten ? flattenSlotNodes(slot, assigned, new Set()) : assigned;
}

function flattenSlotNodes(
  slot: Element,
  assigned: readonly Node[],
  visited: Set<Element>,
): Node[] {
  if (visited.has(slot)) {
    return [];
  }
  visited.add(slot);
  const source = assigned.length === 0 ? childNodes(slot) : assigned;
  const result: Node[] = [];
  for (const node of source) {
    if (node instanceof Element && isSlotElement(node)) {
      result.push(...flattenSlotNodes(node, assignedSlotNodes(node), visited));
    } else {
      result.push(node);
    }
  }
  visited.delete(slot);
  return result;
}

function isSlotElement(node: Node): node is Element {
  return (
    node instanceof Element &&
    node.namespaceURI === HTML_NAMESPACE &&
    node.localName === "slot"
  );
}

function slotElements(root: ShadowRoot): Element[] {
  return descendantElements(root).filter(isSlotElement);
}

function updateSlotAssignmentsAfterTreeMutation(
  parent: Node,
  changedNode: Node,
): void {
  if (isSlotElement(parent) && assignedSlotNodes(parent).length === 0) {
    signalSlotChange(parent);
  }
  const roots = new Set<ShadowRoot>();
  addRelevantShadowRoot(roots, parent);
  if (parent instanceof Element) {
    const attached = elementImplementation(parent).shadowRoot;
    if (attached !== null) {
      roots.add(nodeInterface(attached) as ShadowRoot);
    }
  }
  addRelevantShadowRoot(roots, changedNode);
  for (const root of roots) {
    refreshSlotAssignments(root);
  }
  if (changedNode instanceof Element) {
    const slots = [changedNode, ...descendantElements(changedNode)].filter(
      isSlotElement,
    );
    for (const slot of slots) {
      refreshSlotAssignment(slot);
    }
  }
}

function updateSlotAssignmentsForMutation(element: Element): void {
  const roots = new Set<ShadowRoot>();
  addRelevantShadowRoot(roots, element);
  if (element.parentNode !== null) {
    addRelevantShadowRoot(roots, element.parentNode);
    if (element.parentNode instanceof Element) {
      const attached = elementImplementation(element.parentNode).shadowRoot;
      if (attached !== null) {
        roots.add(nodeInterface(attached) as ShadowRoot);
      }
    }
  }
  for (const root of roots) {
    refreshSlotAssignments(root);
  }
}

function addRelevantShadowRoot(roots: Set<ShadowRoot>, node: Node): void {
  const root = nodeRoot(node);
  if (root instanceof ShadowRoot) {
    roots.add(root);
  }
}

function refreshSlotAssignments(root: ShadowRoot): void {
  for (const slot of slotElements(root)) {
    refreshSlotAssignment(slot);
  }
}

function refreshSlotAssignment(slot: Element): void {
  const assigned = assignedSlotNodes(slot);
  const previous = LAST_SLOT_ASSIGNMENTS.get(slot) ?? [];
  LAST_SLOT_ASSIGNMENTS.set(slot, assigned);
  if (
    previous.length !== assigned.length ||
    previous.some((node, index) => node !== assigned[index])
  ) {
    signalSlotChange(slot);
  }
}

function signalSlotChange(slot: Element): void {
  SIGNALLED_SLOTS.add(slot);
  if (slotChangeMicrotaskQueued) {
    return;
  }
  slotChangeMicrotaskQueued = true;
  void Promise.resolve().then(() => {
    slotChangeMicrotaskQueued = false;
    const slots = Array.from(SIGNALLED_SLOTS);
    SIGNALLED_SLOTS.clear();
    for (const signalledSlot of slots) {
      signalledSlot.dispatchEvent(new Event("slotchange", { bubbles: true }));
    }
  });
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
    node1 = attribute1.ownerElement;
  }
  if (attribute2 !== null) {
    const ownerElement = attribute2.ownerElement;
    node2 = ownerElement;
    if (
      attribute1 !== null &&
      ownerElement !== null &&
      node1 === ownerElement
    ) {
      for (const attribute of attributeNodes(ownerElement)) {
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
    childNodes(parent).indexOf(child1) < childNodes(parent).indexOf(child2)
  );
}

function ancestorPath(node: Node): Node[] {
  const path: Node[] = [];
  let current: Node | null = node;
  while (current !== null) {
    path.push(current);
    current = current.parentNode;
  }
  path.reverse();
  return path;
}

function equalNodes(node: Node, other: Node): boolean {
  if (!sameNodeInterface(node, other) || !sameNodeData(node, other)) {
    return false;
  }
  const children = childNodes(node);
  const otherChildren = childNodes(other);
  if (children.length !== otherChildren.length) {
    return false;
  }
  return children.every((child, index) => {
    const otherChild = otherChildren[index];
    return otherChild !== undefined && equalNodes(child, otherChild);
  });
}

function locateNamespacePrefix(
  element: Element,
  namespace: string,
): string | null {
  if (element.namespaceURI === namespace && element.prefix !== null) {
    return element.prefix;
  }
  const declaration = attributeNodes(element).find(
    (attribute) =>
      attribute.prefix === "xmlns" && attribute.value === namespace,
  );
  if (declaration !== undefined) {
    return declaration.localName;
  }
  return element.parentElement === null
    ? null
    : locateNamespacePrefix(element.parentElement, namespace);
}

function lookupNamespacePrefix(node: Node, namespace: string): string | null {
  if (node instanceof Element) {
    return locateNamespacePrefix(node, namespace);
  }
  if (node instanceof Document) {
    return node.documentElement === null
      ? null
      : locateNamespacePrefix(node.documentElement, namespace);
  }
  if (node instanceof DocumentType || node instanceof DocumentFragment) {
    return null;
  }
  if (node instanceof Attr) {
    return node.ownerElement === null
      ? null
      : locateNamespacePrefix(node.ownerElement, namespace);
  }
  return node.parentElement === null
    ? null
    : locateNamespacePrefix(node.parentElement, namespace);
}

function locateNamespace(node: Node, prefix: string | null): string | null {
  if (node instanceof Element) {
    if (prefix === "xml") {
      return XML_NAMESPACE;
    }
    if (prefix === "xmlns") {
      return XMLNS_NAMESPACE;
    }
    if (node.namespaceURI !== null && node.prefix === prefix) {
      return node.namespaceURI;
    }
    const declaration = attributeNodes(node).find(
      (attribute) =>
        attribute.namespaceURI === XMLNS_NAMESPACE &&
        ((attribute.prefix === "xmlns" && attribute.localName === prefix) ||
          (prefix === null &&
            attribute.prefix === null &&
            attribute.localName === "xmlns")),
    );
    if (declaration !== undefined) {
      return declaration.value === "" ? null : declaration.value;
    }
    return node.parentElement === null
      ? null
      : locateNamespace(node.parentElement, prefix);
  }
  if (node instanceof Document) {
    return node.documentElement === null
      ? null
      : locateNamespace(node.documentElement, prefix);
  }
  if (node instanceof DocumentType || node instanceof DocumentFragment) {
    return null;
  }
  if (node instanceof Attr) {
    return node.ownerElement === null
      ? null
      : locateNamespace(node.ownerElement, prefix);
  }
  return node.parentElement === null
    ? null
    : locateNamespace(node.parentElement, prefix);
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
  const attributes = attributeNodes(node);
  const otherAttributes = attributeNodes(other);
  if (attributes.length !== otherAttributes.length) {
    return false;
  }
  return attributes.every((attribute) =>
    otherAttributes.some((candidate) => equalNodes(attribute, candidate)),
  );
}

function insertionNodes(node: Node): Node[] {
  return node instanceof DocumentFragment ? childNodes(node) : [node];
}

function insertAdjacent(
  element: Element,
  where: string,
  node: Node,
): Node | null {
  switch (asciiLowercase(where)) {
    case "beforebegin":
      if (element.parentNode === null) {
        return null;
      }
      preInsert(node, element.parentNode, element);
      return node;
    case "afterbegin":
      preInsert(node, element, element.firstChild);
      return node;
    case "beforeend":
      preInsert(node, element, null);
      return node;
    case "afterend":
      if (element.parentNode === null) {
        return null;
      }
      preInsert(node, element.parentNode, element.nextSibling);
      return node;
    default:
      throw new DOMException(
        `Invalid adjacent insertion position: ${where}`,
        "SyntaxError",
      );
  }
}

function validateDocumentInsertion(
  node: Node,
  document: Document,
  child: Node | null,
  childrenToExclude: readonly Node[],
): void {
  const inserted = insertionNodes(node);
  if (inserted.some((candidate) => candidate instanceof Text)) {
    throw new DOMException(
      "Text nodes cannot be children of a document",
      "HierarchyRequestError",
    );
  }

  const originalChildren = childNodes(document);
  const children = originalChildren.filter(
    (candidate) =>
      !childrenToExclude.includes(candidate) && !inserted.includes(candidate),
  );
  const childIndex = child === null ? -1 : originalChildren.indexOf(child);
  const index =
    child === null || childIndex < 0
      ? children.length
      : originalChildren
          .slice(0, childIndex)
          .filter(
            (candidate) =>
              !childrenToExclude.includes(candidate) &&
              !inserted.includes(candidate),
          ).length;
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
  if (nodes.length === 0) {
    return;
  }
  const document = parent instanceof Document ? parent : parent.ownerDocument;
  for (const inserted of nodes) {
    if (document === null) {
      removeNode(inserted);
    } else {
      adopt(inserted, document);
    }
  }
  const documentImplementationValue = nodeDocumentImplementation(
    nodeImplementation(parent),
  );
  for (const inserted of nodes) {
    const parentImplementation = nodeImplementation(parent);
    const insertedImplementation = nodeImplementation(inserted);
    const index =
      child === null
        ? -1
        : parentImplementation.children.indexOf(nodeImplementation(child));
    if (index < 0) {
      adjustLiveRangesForInsertion(
        parent,
        parentImplementation.children.length,
        1,
      );
      insertChildImplementation(
        parentImplementation,
        insertedImplementation,
        parentImplementation.children.length,
      );
    } else {
      adjustLiveRangesForInsertion(parent, index, 1);
      insertChildImplementation(
        parentImplementation,
        insertedImplementation,
        index,
      );
    }
    invalidateDescendantText(parentImplementation);
    for (const inclusiveDescendant of inclusiveDescendantNodes(inserted)) {
      documentImplementationValue.insertionSteps?.(inclusiveDescendant);
    }
  }
  documentImplementationValue.childrenChangedSteps?.(parent);
  const staticNodeList = nodes.flatMap(inclusiveDescendantNodes);
  for (const connectedNode of staticNodeList) {
    if (connectedNode.isConnected) {
      documentImplementationValue.postConnectionSteps?.(connectedNode);
    }
  }
  for (const inserted of nodes) {
    if (inserted.isConnected) {
      for (const element of shadowIncludingInclusiveDescendantElements(
        inserted,
      )) {
        enqueueCustomElementConnectedReaction(element);
      }
    }
  }
}

function inclusiveDescendantNodes(node: Node): Node[] {
  const result = [node];
  for (const child of childNodes(node)) {
    result.push(...inclusiveDescendantNodes(child));
  }
  return result;
}

function shadowIncludingInclusiveDescendantElements(node: Node): Element[] {
  const result: Element[] = [];
  if (node instanceof Element) {
    result.push(node);
    const shadowRoot = elementImplementation(node).shadowRoot;
    if (shadowRoot !== null) {
      result.push(
        ...shadowIncludingInclusiveDescendantElements(
          nodeInterface(shadowRoot),
        ),
      );
    }
  }
  for (const child of childNodes(node)) {
    result.push(...shadowIncludingInclusiveDescendantElements(child));
  }
  return result;
}

function appendNodes(
  parent: Document | DocumentFragment | Element,
  nodes: readonly (Node | string)[],
): void {
  const node = convertNodesIntoNode(nodes, parentNodeDocument(parent));
  preInsert(node, parent, null);
}

function prependNodes(
  parent: Document | DocumentFragment | Element,
  nodes: readonly (Node | string)[],
): void {
  const node = convertNodesIntoNode(nodes, parentNodeDocument(parent));
  preInsert(node, parent, parent.firstChild);
}

function replaceChildrenWithNodes(
  parent: Document | DocumentFragment | Element,
  nodes: readonly (Node | string)[],
): void {
  const node = convertNodesIntoNode(nodes, parentNodeDocument(parent));
  ensurePreInsertionValidity(node, parent, null, childNodes(parent));
  for (const child of childNodes(parent)) {
    removeNode(child);
  }
  insertNodes(node, parent, null);
}

function moveNodeBefore(
  parent: Document | DocumentFragment | Element,
  node: Node,
  child: Node | null,
): void {
  let reference = child;
  if (reference === node) {
    reference = node.nextSibling;
  }
  if (shadowIncludingRoot(parent) !== shadowIncludingRoot(node)) {
    throw new DOMException(
      "The nodes do not have the same root",
      "HierarchyRequestError",
    );
  }
  if (isHostIncludingInclusiveAncestor(node, parent)) {
    throw new DOMException(
      "The moved node is an ancestor of the destination",
      "HierarchyRequestError",
    );
  }
  if (reference !== null && reference.parentNode !== parent) {
    throw new DOMException(
      "The reference node is not a child of the destination",
      "NotFoundError",
    );
  }
  if (!(node instanceof Element) && !(node instanceof CharacterData)) {
    throw new DOMException(
      "Only Element and CharacterData nodes can be moved",
      "HierarchyRequestError",
    );
  }
  if (parent instanceof Document && node instanceof Text) {
    throw new DOMException(
      "Text nodes cannot be children of a document",
      "HierarchyRequestError",
    );
  }
  if (
    parent instanceof Document &&
    node instanceof Element &&
    (parent.documentElement !== null ||
      reference instanceof DocumentType ||
      hasFollowingDocumentType(reference))
  ) {
    throw new DOMException(
      "The element cannot be moved to this position in the document",
      "HierarchyRequestError",
    );
  }

  const oldParent = node.parentNode;
  if (oldParent === null) {
    throw new DOMException(
      "The moved node has no parent",
      "HierarchyRequestError",
    );
  }
  preRemoveLiveRanges(node);
  preRemoveNodeIterators(node);
  const nodeImplementationValue = nodeImplementation(node);
  const oldParentImplementation = nodeImplementation(oldParent);
  const oldIndex = oldParentImplementation.children.indexOf(
    nodeImplementationValue,
  );
  removeChildImplementation(
    oldParentImplementation,
    nodeImplementationValue,
    oldIndex,
  );
  invalidateDescendantText(oldParentImplementation);

  const parentImplementation = nodeImplementation(parent);
  const referenceIndex =
    reference === null
      ? parentImplementation.children.length
      : parentImplementation.children.indexOf(nodeImplementation(reference));
  adjustLiveRangesForInsertion(parent, referenceIndex, 1);
  insertChildImplementation(
    parentImplementation,
    nodeImplementationValue,
    referenceIndex,
  );
  invalidateDescendantText(parentImplementation);
  if (node.isConnected) {
    for (const element of shadowIncludingInclusiveDescendantElements(node)) {
      enqueueCustomElementMoveReaction(element);
    }
  }
}

function hasFollowingDocumentType(node: Node | null): boolean {
  let sibling = node?.nextSibling ?? null;
  while (sibling !== null) {
    if (sibling instanceof DocumentType) {
      return true;
    }
    sibling = sibling.nextSibling;
  }
  return false;
}

function insertNodesBeforeChild(
  child: DocumentType | Element | CharacterData,
  nodes: readonly (Node | string)[],
): void {
  const convertedNodes = convertNodeOrStringArguments(nodes);
  const parent = child.parentNode;
  if (parent === null) {
    return;
  }
  let viablePreviousSibling = child.previousSibling;
  while (
    viablePreviousSibling !== null &&
    convertedNodes.includes(viablePreviousSibling)
  ) {
    viablePreviousSibling = viablePreviousSibling.previousSibling;
  }
  const node = convertNodesIntoNode(convertedNodes, childNodeDocument(child));
  const reference =
    viablePreviousSibling === null
      ? parent.firstChild
      : viablePreviousSibling.nextSibling;
  preInsert(node, parent, reference);
}

function insertNodesAfterChild(
  child: DocumentType | Element | CharacterData,
  nodes: readonly (Node | string)[],
): void {
  const convertedNodes = convertNodeOrStringArguments(nodes);
  const parent = child.parentNode;
  if (parent === null) {
    return;
  }
  const viableNextSibling = followingSiblingNotIn(child, convertedNodes);
  const node = convertNodesIntoNode(convertedNodes, childNodeDocument(child));
  preInsert(node, parent, viableNextSibling);
}

function replaceChildWithNodes(
  child: DocumentType | Element | CharacterData,
  nodes: readonly (Node | string)[],
): void {
  const convertedNodes = convertNodeOrStringArguments(nodes);
  const parent = child.parentNode;
  if (parent === null) {
    return;
  }
  const viableNextSibling = followingSiblingNotIn(child, convertedNodes);
  const node = convertNodesIntoNode(convertedNodes, childNodeDocument(child));
  if (child.parentNode === parent) {
    parent.replaceChild(node, child);
  } else {
    preInsert(node, parent, viableNextSibling);
  }
}

function followingSiblingNotIn(
  child: Node,
  nodes: readonly (Node | string)[],
): Node | null {
  let sibling = child.nextSibling;
  while (sibling !== null && nodes.includes(sibling)) {
    sibling = sibling.nextSibling;
  }
  return sibling;
}

function convertNodesIntoNode(
  nodes: readonly (Node | string)[],
  document: Document,
): Node {
  const converted = nodes.map((node) =>
    node instanceof Node ? node : createText(document, domString(node)),
  );
  const first = converted[0];
  if (converted.length === 1 && first !== undefined) {
    return first;
  }
  const fragment = createDocumentFragment(document);
  for (const node of converted) {
    fragment.appendChild(node);
  }
  return fragment;
}

function convertNodeOrStringArguments(
  nodes: readonly (Node | string)[],
): (Node | string)[] {
  return nodes.map((node) => (node instanceof Node ? node : domString(node)));
}

function parentNodeDocument(
  parent: Document | DocumentFragment | Element,
): Document {
  if (parent instanceof Document) {
    return parent;
  }
  if (parent.ownerDocument === null) {
    throw new TypeError("ParentNode has no node document");
  }
  return parent.ownerDocument;
}

function childNodeDocument(
  child: DocumentType | Element | CharacterData,
): Document {
  if (child.ownerDocument === null) {
    throw new TypeError("ChildNode has no node document");
  }
  return child.ownerDocument;
}

function adopt(node: Node, document: Document): void {
  removeNode(node);
  if (node.ownerDocument === document) {
    return;
  }
  updateNodeDocument(node, document);
}

function updateNodeDocument(node: Node, document: Document): void {
  transferLiveRanges(node, document);
  transferNodeIterators(node, document);
  nodeImplementation(node).ownerDocument = documentImplementation(document);
  if (node instanceof Element) {
    for (const attribute of attributeNodes(node)) {
      nodeImplementation(attribute).ownerDocument =
        documentImplementation(document);
    }
    const contents = templateContents(node);
    if (contents !== null) {
      updateNodeDocument(contents, templateContentsDocument(document));
    }
  }
  for (const child of childNodes(node)) {
    updateNodeDocument(child, document);
  }
}
