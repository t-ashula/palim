import {
  closest as closestSelector,
  matches as matchesSelector,
  querySelector as selectFirst,
  querySelectorAll as selectAll,
} from "../selectors.js";
import { DOMException } from "../dom-exception.js";
import { HTML_NAMESPACE, SVG_NAMESPACE } from "../namespaces.js";
import { originFromURL } from "../origin.js";
import type { HTMLCollection, NamedNodeMap, NodeList } from "./collections.js";
import { URL } from "../url/index.js";
import {
  createHTMLCollection,
  createNamedNodeMap,
  createNodeList,
} from "./collections.js";
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
import {
  AttrImplementation,
  CharacterDataImplementation,
  DocumentImplementation,
  DocumentTypeImplementation,
  ElementImplementation,
  NodeImplementation,
  attrImplementation,
  attrInterface,
  bindNode,
  characterDataImplementation,
  documentImplementation,
  documentInterface,
  documentTypeImplementation,
  elementImplementation,
  elementInterface,
  nodeImplementation,
  nodeInterface,
} from "./node-implementation.js";
import type { DOMTokenList } from "./token-list.js";
import { createDOMTokenList } from "./token-list.js";
import { bindDOMInterface } from "./binding.js";
import {
  adjustLiveRangesForData,
  adjustLiveRangesForInsertion,
  adjustLiveRangesForTextMerge,
  createRange,
  preRemoveLiveRanges,
  transferLiveRanges,
} from "./range-implementation.js";
import type { Range } from "./range.js";
import {
  createNodeIterator,
  createTreeWalker,
  descendantElements,
  preRemoveNodeIterators,
  transferNodeIterators,
} from "./traversal.js";
import { NodeFilter } from "./traversal.js";
import type {
  NodeFilter as NodeFilterCallback,
  NodeIterator,
  TreeWalker,
} from "./traversal.js";
import type { PalimParseError } from "../html/parse-errors.js";
import type { Window } from "../window.js";
import {
  serializeHTMLFragment,
  serializeHTMLElement,
} from "../html/serializer.js";
import {
  serializeXMLFragment,
  serializeXMLElement,
} from "../xml/serializer.js";
import { requireArguments } from "../web-idl.js";

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

let documentElementFactory: ElementFactory = defaultElementFactory;

export class DOMImplementation {
  constructor(readonly document: Document) {
    bindDOMInterface(this, this);
  }

  createDocumentType(
    qualifiedName: string,
    publicId: string,
    systemId: string,
  ): DocumentType {
    requireArguments(arguments.length, 3);
    const name = domString(qualifiedName);
    validateName(name);
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
    const document = createDocument(
      source.fragmentParser,
      "application/xml",
      source.elementFactory,
    );
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
      document.appendChild(document.createElementNS(namespace, name));
    }
    return document;
  }

  createHTMLDocument(title?: string): Document {
    const source = documentImplementation(this.document);
    const document = createDocument(
      source.fragmentParser,
      "text/html",
      source.elementFactory,
    );
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
    return nodeImplementation(this).nodeName;
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
    const data = value === null ? "" : domString(value);
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
    requireArguments(arguments.length, 2);
    if (!(node instanceof Node) || !(child instanceof Node)) {
      throw new TypeError("The argument is not a Node");
    }
    if (child.parentNode !== this) {
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
    ensurePreInsertionValidity(node, this, reference, [child]);
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
  preRemoveLiveRanges(node);
  preRemoveNodeIterators(node);
  const parent = implementation.parent;
  const index = parent.children.indexOf(implementation);
  if (index >= 0) {
    removeChildImplementation(parent, implementation, index);
    invalidateDescendantText(parent);
  }
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
  if (subtreeContainsHTMLBaseElement(child)) {
    updateFirstBaseElementWithHref(nodeDocumentImplementation(parent));
  }
}

function removeChildImplementation(
  parent: NodeImplementation,
  child: NodeImplementation,
  index: number,
): void {
  const previous = child.previousSibling;
  const next = child.nextSibling;
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
}

function invalidateDescendantText(node: NodeImplementation): void {
  let current: NodeImplementation | null = node;
  while (current !== null) {
    current.descendantTextCache = null;
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
  readonly characterSet = "UTF-8";
  readonly charset = "UTF-8";
  readonly inputEncoding = "UTF-8";
  readonly readyState = "complete";

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

  get implementation(): DOMImplementation {
    const implementation = documentImplementation(this);
    implementation.domImplementation ??= new DOMImplementation(this);
    return implementation.domImplementation;
  }

  get contentType(): string {
    return documentImplementation(this).contentType;
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

  get head(): Element | null {
    return (
      (this.documentElement === null
        ? []
        : childNodes(this.documentElement)
      ).find(
        (node): node is Element =>
          node instanceof Element && node.localName === "head",
      ) ?? null
    );
  }

  get body(): Element | null {
    return (
      (this.documentElement === null
        ? []
        : childNodes(this.documentElement)
      ).find(
        (node): node is Element =>
          node instanceof Element &&
          (node.localName === "body" || node.localName === "frameset"),
      ) ?? null
    );
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
    if (convertedData.includes("]]>") || this.contentType === "text/html") {
      throw new DOMException(
        "CDATA sections are not supported for this document",
        "NotSupportedError",
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
}

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
): Document {
  return new Document(
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
  const qualifiedName = prefix === null ? localName : `${prefix}:${localName}`;
  const tagName =
    namespaceURI === HTML_NAMESPACE && document.contentType === "text/html"
      ? qualifiedName.toUpperCase()
      : qualifiedName;
  return new ElementImplementation(
    documentImplementation(document),
    namespaceURI,
    prefix,
    localName,
    tagName,
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
      respondToBaseHrefChange(implementation.ownerElement, implementation);
    }
  }

  get ownerElement(): Element | null {
    const implementation = attrImplementation(this).ownerElement;
    return implementation === null ? null : elementInterface(implementation);
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
    return elementImplementation(this).tagName;
  }

  get attributes(): NamedNodeMap {
    const implementation = elementImplementation(this);
    implementation.attributeMap ??= createNamedNodeMap(this);
    return implementation.attributeMap;
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
    validateName(name);
    const convertedValue = domString(value);
    const attribute = findAttributeByName(this, name);
    if (attribute !== null) {
      attribute.value = convertedValue;
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
      const implementation = attrImplementation(attribute);
      implementation.prefix = extracted.prefix;
      implementation.name = extracted.qualifiedName;
      attribute.value = convertedValue;
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
    validateName(name);
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
    respondToBaseHrefChange(implementation, valueImplementation);
    return null;
  }
  const oldImplementation = attrImplementation(oldAttribute);
  const index = implementation.attributes.indexOf(oldImplementation);
  implementation.attributes[index] = valueImplementation;
  oldImplementation.ownerElement = null;
  respondToBaseHrefChange(implementation, valueImplementation);
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
  respondToBaseHrefChange(implementation, attributeImplementation);
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

  prepend(...nodes: (Node | string)[]): void {
    prependNodes(this, nodes);
  }

  append(...nodes: (Node | string)[]): void {
    appendNodes(this, nodes);
  }

  replaceChildren(...nodes: (Node | string)[]): void {
    replaceChildrenWithNodes(this, nodes);
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
    const data = value === null ? "" : domString(value);
    replaceCharacterData(this, 0, this.length, data);
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
    );
    const copyImplementation = documentImplementation(copy);
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
  return createHTMLCollection(() =>
    descendantElements(root).filter((element) => {
      if (qualifiedName === "*") {
        return true;
      }
      const name = elementQualifiedName(element);
      return document.contentType === "text/html" &&
        element.namespaceURI === HTML_NAMESPACE
        ? name === htmlName
        : name === qualifiedName;
    }),
  );
}

function elementsByTagNameNS(
  root: CollectionLookupRoot,
  namespace: string | null,
  localName: string,
): HTMLCollection {
  return createHTMLCollection(() =>
    descendantElements(root).filter(
      (element) =>
        (namespace === "*" || element.namespaceURI === namespace) &&
        (localName === "*" || element.localName === localName),
    ),
  );
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
  if (child !== null && child.parentNode !== parent) {
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
  if (isInclusiveAncestor(node, parent)) {
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

function nodeRoot(node: Node): Node {
  let root = node;
  while (root.parentNode !== null) {
    root = root.parentNode;
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

  const children = childNodes(document).filter(
    (candidate) =>
      !childrenToExclude.includes(candidate) && !inserted.includes(candidate),
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
      removeNode(inserted);
    } else {
      adopt(inserted, document);
    }
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
  }
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
