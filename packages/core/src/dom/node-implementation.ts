import type { PalimParseError } from "../html/parse-errors.js";
import type { Origin } from "../origin.js";
import { originFromURL } from "../origin.js";
import { URL } from "../url/index.js";
import type { Window } from "../window-types.js";
import {
  bindDOMInterface,
  implementationFor,
  interfaceFor,
} from "./binding.js";
import type { HTMLCollection, NamedNodeMap, NodeList } from "./collections.js";
import { EventTargetImplementation } from "./event-implementation.js";
import type {
  Attr,
  CharacterData,
  Document,
  DocumentFragment,
  DOMImplementation,
  Element,
  ElementFactory,
  FragmentParser,
  Node,
} from "./nodes.js";
import type { DOMTokenList } from "./token-list.js";

export class NodeImplementation extends EventTargetImplementation {
  readonly children: NodeImplementation[] = [];
  parent: NodeImplementation | null = null;
  previousSibling: NodeImplementation | null = null;
  nextSibling: NodeImplementation | null = null;
  descendantTextCache: string | null = null;
  childNodes: NodeList | null = null;
  elementChildren: HTMLCollection | null = null;
  htmlInsertionHost: ElementImplementation | null = null;
  scriptAlreadyStarted = false;
  scriptForceAsync = true;
  readonly creationDocument: DocumentImplementation | null;

  constructor(
    readonly nodeType: number,
    readonly nodeName: string,
    public ownerDocument: DocumentImplementation | null,
  ) {
    super();
    this.creationDocument = ownerDocument;
  }
}

export type ScriptingMode = "disabled" | "enabled";

export class DocumentImplementation extends NodeImplementation {
  relevantRealmDocument: DocumentImplementation;
  namedPropertyVersion = 0;
  encoding = "UTF-8";
  templateContentsOwnerDocument: Document | null = null;
  currentScript: Element | null = null;
  domImplementation: DOMImplementation | null = null;
  defaultView: Window | null = null;
  scriptingMode: ScriptingMode = "disabled";
  url = new URL("about:blank");
  aboutBaseURL: URL | null = null;
  baseURLOverride: URL | null = null;
  firstBaseElementWithHref: ElementImplementation | null = null;
  origin: Origin = originFromURL(this.url);
  quirks = false;
  parseErrors: readonly PalimParseError[] = [];
  parserOpenedSteps: (() => void) | null = null;
  parserElementSteps: ((element: Element) => void) | null = null;
  parserScriptSteps: ((element: Element) => Promise<void> | void) | null = null;
  parserClosedSteps: (() => Promise<void> | void) | null = null;
  childrenChangedSteps: ((node: Node) => void) | null = null;
  attributeChangedSteps:
    | ((element: Element, localName: string, namespace: string | null) => void)
    | null = null;
  insertionSteps: ((node: Node) => void) | null = null;
  removingSteps:
    ((node: Node, isSubtreeRoot: boolean, oldAncestor: Node) => void) | null =
    null;
  postConnectionSteps: ((node: Node) => void) | null = null;

  constructor(
    readonly fragmentParser: FragmentParser | null,
    readonly contentType: string,
    readonly elementFactory: ElementFactory,
  ) {
    super(9, "#document", null);
    this.relevantRealmDocument = this;
  }
}

export class DocumentTypeImplementation extends NodeImplementation {
  constructor(
    document: DocumentImplementation,
    readonly name: string,
    readonly publicId: string,
    readonly systemId: string,
  ) {
    super(10, name, document);
  }
}

export class AttrImplementation extends NodeImplementation {
  ownerElement: ElementImplementation | null;

  constructor(
    document: DocumentImplementation,
    element: ElementImplementation | null,
    public name: string,
    public value: string,
    readonly namespaceURI: string | null,
    public prefix: string | null,
    readonly localName: string,
  ) {
    super(2, name, document);
    this.ownerElement = element;
  }
}

export class ElementImplementation extends NodeImplementation {
  readonly attributes: AttrImplementation[] = [];
  templateContents: DocumentFragment | null = null;
  frozenBaseURL: URL | null = null;
  attributeMap: NamedNodeMap | null = null;
  classList: DOMTokenList | null = null;
  shadowRoot: ShadowRootImplementation | null = null;

  constructor(
    document: DocumentImplementation,
    readonly namespaceURI: string | null,
    readonly prefix: string | null,
    readonly localName: string,
  ) {
    super(1, prefix === null ? localName : `${prefix}:${localName}`, document);
  }
}

export class ShadowRootImplementation extends NodeImplementation {
  constructor(
    document: DocumentImplementation,
    readonly host: ElementImplementation,
    readonly mode: "open" | "closed",
  ) {
    super(11, "#document-fragment", document);
  }
}

export class CharacterDataImplementation extends NodeImplementation {
  constructor(
    nodeType: number,
    nodeName: string,
    document: DocumentImplementation,
    public data: string,
  ) {
    super(nodeType, nodeName, document);
  }
}

export function bindNode(node: Node, implementation: NodeImplementation): void {
  bindDOMInterface(node, implementation);
}

export function nodeImplementation(node: Node): NodeImplementation {
  return implementationFor(node) as NodeImplementation;
}

export function documentImplementation(
  document: Document,
): DocumentImplementation {
  return implementationFor(document) as DocumentImplementation;
}

export function documentTypeImplementation(
  documentType: Node,
): DocumentTypeImplementation {
  return implementationFor(documentType) as DocumentTypeImplementation;
}

export function attrImplementation(attribute: Attr): AttrImplementation {
  return implementationFor(attribute) as AttrImplementation;
}

export function elementImplementation(element: Element): ElementImplementation {
  return implementationFor(element) as ElementImplementation;
}

export function shadowRootImplementation(
  shadowRoot: Node,
): ShadowRootImplementation {
  return implementationFor(shadowRoot) as ShadowRootImplementation;
}

export function characterDataImplementation(
  data: CharacterData,
): CharacterDataImplementation {
  return implementationFor(data) as CharacterDataImplementation;
}

export function nodeInterface(implementation: NodeImplementation): Node {
  return interfaceFor(implementation) as Node;
}

export function documentInterface(
  implementation: DocumentImplementation,
): Document {
  return interfaceFor(implementation) as Document;
}

export function elementInterface(
  implementation: ElementImplementation,
): Element {
  return interfaceFor(implementation) as Element;
}

export function attrInterface(implementation: AttrImplementation): Attr {
  return interfaceFor(implementation) as Attr;
}
