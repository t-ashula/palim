import * as DOM from "./dom.js";

// The caller supplies the public value-side type for this runtime boundary.
// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
function exposeInterface<T>(value: object, length = 0): T {
  Object.defineProperty(value, "length", { configurable: true, value: length });
  return value as T;
}

export type Attr = DOM.Attr;
interface AttrInterface {
  readonly length: 0;
  readonly name: "Attr";
  readonly prototype: Attr;
  [Symbol.hasInstance](value: unknown): value is Attr;
}
export const Attr = exposeInterface<AttrInterface>(DOM.Attr);

export type CDATASection = DOM.CDATASection;
interface CDATASectionInterface {
  readonly length: 0;
  readonly name: "CDATASection";
  readonly prototype: CDATASection;
  [Symbol.hasInstance](value: unknown): value is CDATASection;
}
export const CDATASection = exposeInterface<CDATASectionInterface>(
  DOM.CDATASection,
);

export type CharacterData = DOM.CharacterData;
interface CharacterDataInterface {
  readonly length: 0;
  readonly name: "CharacterData";
  readonly prototype: CharacterData;
  [Symbol.hasInstance](value: unknown): value is CharacterData;
}
export const CharacterData = exposeInterface<CharacterDataInterface>(
  DOM.CharacterData,
);

export type Comment = DOM.Comment;
interface CommentInterface {
  readonly length: 0;
  readonly name: "Comment";
  readonly prototype: Comment;
  [Symbol.hasInstance](value: unknown): value is Comment;
  new (data?: string): Comment;
}
export const Comment = exposeInterface<CommentInterface>(DOM.Comment);

export type Document = DOM.Document;
interface DocumentInterface {
  readonly length: 0;
  readonly name: "Document";
  readonly prototype: Document;
  [Symbol.hasInstance](value: unknown): value is Document;
  new (): Document;
}
export const Document = exposeInterface<DocumentInterface>(DOM.Document);

export type DocumentFragment = DOM.DocumentFragment;
interface DocumentFragmentInterface {
  readonly length: 0;
  readonly name: "DocumentFragment";
  readonly prototype: DocumentFragment;
  [Symbol.hasInstance](value: unknown): value is DocumentFragment;
  new (): DocumentFragment;
}
export const DocumentFragment = exposeInterface<DocumentFragmentInterface>(
  DOM.DocumentFragment,
);

export type DocumentType = DOM.DocumentType;
interface DocumentTypeInterface {
  readonly length: 0;
  readonly name: "DocumentType";
  readonly prototype: DocumentType;
  [Symbol.hasInstance](value: unknown): value is DocumentType;
}
export const DocumentType = exposeInterface<DocumentTypeInterface>(
  DOM.DocumentType,
);

export type DOMTokenList = DOM.DOMTokenList;
interface DOMTokenListInterface {
  readonly length: 0;
  readonly name: "DOMTokenList";
  readonly prototype: DOMTokenList;
  [Symbol.hasInstance](value: unknown): value is DOMTokenList;
}
export const DOMTokenList = exposeInterface<DOMTokenListInterface>(
  DOM.DOMTokenList,
);

export type Element = DOM.Element;
interface ElementInterface {
  readonly length: 0;
  readonly name: "Element";
  readonly prototype: Element;
  [Symbol.hasInstance](value: unknown): value is Element;
}
export const Element = exposeInterface<ElementInterface>(DOM.Element);

export {
  AbortController,
  AbortSignal,
  Event,
  EventTarget,
  NodeFilter,
} from "./dom.js";
export type {
  AddEventListenerOptions,
  ElementCreationOptions,
  EventInit,
  EventListener,
  EventListenerObject,
  GetRootNodeOptions,
  ImportNodeOptions,
  NodeIterator,
  Range,
  TreeWalker,
} from "./dom.js";

export interface HTMLCollection extends Iterable<Element> {
  readonly [index: number]: Element | undefined;
  readonly length: number;
  item(index: number): Element | null;
  namedItem(name: string): Element | null;
}
interface HTMLCollectionInterface {
  readonly length: 0;
  readonly name: "HTMLCollection";
  readonly prototype: HTMLCollection;
  [Symbol.hasInstance](value: unknown): value is HTMLCollection;
}
export const HTMLCollection = exposeInterface<HTMLCollectionInterface>(
  DOM.HTMLCollection,
);

export type NamedNodeMap = DOM.NamedNodeMap;
interface NamedNodeMapInterface {
  readonly length: 0;
  readonly name: "NamedNodeMap";
  readonly prototype: NamedNodeMap;
  [Symbol.hasInstance](value: unknown): value is NamedNodeMap;
}
export const NamedNodeMap = exposeInterface<NamedNodeMapInterface>(
  DOM.NamedNodeMap,
);

export type Node = DOM.Node;
interface NodeInterface {
  readonly length: 0;
  readonly name: "Node";
  readonly prototype: Node;
  [Symbol.hasInstance](value: unknown): value is Node;
  readonly ELEMENT_NODE: 1;
  readonly ATTRIBUTE_NODE: 2;
  readonly TEXT_NODE: 3;
  readonly CDATA_SECTION_NODE: 4;
  readonly COMMENT_NODE: 8;
  readonly PROCESSING_INSTRUCTION_NODE: 7;
  readonly DOCUMENT_NODE: 9;
  readonly DOCUMENT_TYPE_NODE: 10;
  readonly DOCUMENT_FRAGMENT_NODE: 11;
  readonly DOCUMENT_POSITION_DISCONNECTED: 1;
  readonly DOCUMENT_POSITION_PRECEDING: 2;
  readonly DOCUMENT_POSITION_FOLLOWING: 4;
  readonly DOCUMENT_POSITION_CONTAINS: 8;
  readonly DOCUMENT_POSITION_CONTAINED_BY: 16;
  readonly DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC: 32;
}
export const Node = exposeInterface<NodeInterface>(DOM.Node);

export interface NodeList extends Iterable<Node> {
  readonly [index: number]: Node | undefined;
  readonly length: number;
  item(index: number): Node | null;
}
interface NodeListInterface {
  readonly length: 0;
  readonly name: "NodeList";
  readonly prototype: NodeList;
  [Symbol.hasInstance](value: unknown): value is NodeList;
}
export const NodeList = exposeInterface<NodeListInterface>(DOM.NodeList);

export type ProcessingInstruction = DOM.ProcessingInstruction;
interface ProcessingInstructionInterface {
  readonly length: 1;
  readonly name: "ProcessingInstruction";
  readonly prototype: ProcessingInstruction;
  [Symbol.hasInstance](value: unknown): value is ProcessingInstruction;
  new (target: string, data?: string): ProcessingInstruction;
}
export const ProcessingInstruction =
  exposeInterface<ProcessingInstructionInterface>(DOM.ProcessingInstruction, 1);

export type Text = DOM.Text;
interface TextInterface {
  readonly length: 0;
  readonly name: "Text";
  readonly prototype: Text;
  [Symbol.hasInstance](value: unknown): value is Text;
  new (data?: string): Text;
}
export const Text = exposeInterface<TextInterface>(DOM.Text);
