import type {
  Attr,
  CharacterData,
  DocumentFragment,
  DocumentType,
  Element,
  Node,
  ProcessingInstruction,
} from "../dom/nodes.js";
import { attributeNodes, childNodes, templateContents } from "../dom/nodes.js";
import {
  HTML_NAMESPACE,
  MATHML_NAMESPACE,
  SVG_NAMESPACE,
  XLINK_NAMESPACE,
  XML_NAMESPACE,
  XMLNS_NAMESPACE,
} from "../namespaces.js";

const ELEMENT_NODE = 1;
const TEXT_NODE = 3;
const PROCESSING_INSTRUCTION_NODE = 7;
const COMMENT_NODE = 8;
const DOCUMENT_TYPE_NODE = 10;

const VOID_ELEMENTS = new Set([
  "area",
  "base",
  "basefont",
  "bgsound",
  "br",
  "col",
  "embed",
  "frame",
  "hr",
  "img",
  "input",
  "keygen",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);

const RAW_TEXT_ELEMENTS = new Set([
  "style",
  "script",
  "xmp",
  "iframe",
  "noembed",
  "noframes",
  "plaintext",
]);

function isHTMLElement(element: Element, localName?: string): boolean {
  return (
    element.namespaceURI === HTML_NAMESPACE &&
    (localName === undefined || element.localName === localName)
  );
}

function serializesAsVoid(element: Element): boolean {
  return isHTMLElement(element) && VOID_ELEMENTS.has(element.localName);
}

function escape(value: string, attributeMode: boolean): string {
  return value.replaceAll(/[&\u00a0<>"]/gu, (character) => {
    switch (character) {
      case "&":
        return "&amp;";
      case "\u00a0":
        return "&nbsp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return attributeMode ? "&quot;" : '"';
      default:
        return character;
    }
  });
}

function qualifiedName(prefix: string | null, localName: string): string {
  return prefix === null ? localName : `${prefix}:${localName}`;
}

function elementName(element: Element): string {
  return element.namespaceURI === HTML_NAMESPACE ||
    element.namespaceURI === MATHML_NAMESPACE ||
    element.namespaceURI === SVG_NAMESPACE
    ? element.localName
    : qualifiedName(element.prefix, element.localName);
}

function attributeName(attribute: Attr): string {
  switch (attribute.namespaceURI) {
    case null:
      return attribute.localName;
    case XML_NAMESPACE:
      return `xml:${attribute.localName}`;
    case XMLNS_NAMESPACE:
      return attribute.localName === "xmlns"
        ? "xmlns"
        : `xmlns:${attribute.localName}`;
    case XLINK_NAMESPACE:
      return `xlink:${attribute.localName}`;
    default:
      return qualifiedName(attribute.prefix, attribute.localName);
  }
}

function serializeElement(element: Element): string {
  const name = elementName(element);
  let result = `<${name}`;
  for (const attribute of attributeNodes(element)) {
    result += ` ${attributeName(attribute)}="${escape(attribute.value, true)}"`;
  }
  result += ">";
  if (serializesAsVoid(element)) {
    return result;
  }
  return `${result}${serializeHTMLFragment(element)}</${name}>`;
}

function serializeText(text: CharacterData): string {
  const parent = text.parentElement;
  if (
    parent !== null &&
    isHTMLElement(parent) &&
    RAW_TEXT_ELEMENTS.has(parent.localName)
  ) {
    return text.data;
  }
  return escape(text.data, false);
}

function serializeNode(node: Node): string {
  switch (node.nodeType) {
    case ELEMENT_NODE:
      return serializeElement(node as Element);
    case TEXT_NODE:
      return serializeText(node as CharacterData);
    case COMMENT_NODE:
      return `<!--${(node as CharacterData).data}-->`;
    case PROCESSING_INSTRUCTION_NODE: {
      const instruction = node as ProcessingInstruction;
      return `<?${instruction.target} ${instruction.data}?>`;
    }
    case DOCUMENT_TYPE_NODE:
      return `<!DOCTYPE ${(node as DocumentType).name}>`;
    default:
      return "";
  }
}

export function serializeHTMLFragment(
  fragment: Element | DocumentFragment,
): string {
  if (fragment.nodeType === ELEMENT_NODE) {
    const element = fragment as Element;
    if (serializesAsVoid(element)) {
      return "";
    }
    const contents = templateContents(element);
    const node =
      isHTMLElement(element, "template") && contents !== null
        ? contents
        : element;
    return childNodes(node).map(serializeNode).join("");
  }
  const node = fragment;
  return childNodes(node).map(serializeNode).join("");
}

export function serializeHTMLElement(element: Element): string {
  return serializeElement(element);
}
