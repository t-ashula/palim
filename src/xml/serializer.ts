import { DOMException } from "../dom-exception.js";
import {
  Attr,
  CDATASection,
  Comment,
  Document,
  DocumentFragment,
  DocumentType,
  Element,
  ProcessingInstruction,
  Text,
  childNodes,
  templateContents,
} from "../dom/nodes.js";
import type { Node } from "../dom/nodes.js";
import {
  HTML_NAMESPACE,
  XML_NAMESPACE,
  XMLNS_NAMESPACE,
} from "../namespaces.js";
import { containsOnlyXMLCharacters, isXMLName } from "./syntax.js";

interface SerializationState {
  nextPrefix: number;
}

class XMLSerializationFailure extends Error {}

const HTML_VOID_ELEMENTS = new Set([
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
  "menuitem",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);

function requireXMLCharacters(value: string, requireWellFormed: boolean): void {
  if (requireWellFormed && !containsOnlyXMLCharacters(value)) {
    throw new XMLSerializationFailure("Invalid XML character");
  }
}

function escapeText(value: string, requireWellFormed: boolean): string {
  requireXMLCharacters(value, requireWellFormed);
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\r", "&#xD;");
}

function escapeAttribute(value: string, requireWellFormed: boolean): string {
  requireXMLCharacters(value, requireWellFormed);
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll("\t", "&#x9;")
    .replaceAll("\n", "&#xA;")
    .replaceAll("\r", "&#xD;");
}

function declaration(
  prefix: string,
  namespace: string,
  namespaces: Map<string, string>,
  requireWellFormed: boolean,
): string {
  namespaces.set(prefix, namespace);
  const name = prefix === "" ? "xmlns" : `xmlns:${prefix}`;
  return ` ${name}="${escapeAttribute(namespace, requireWellFormed)}"`;
}

function explicitNamespaceDeclaration(attribute: Attr): {
  readonly prefix: string;
  readonly namespace: string;
} | null {
  if (attribute.namespaceURI !== XMLNS_NAMESPACE) {
    return null;
  }
  return {
    prefix: attribute.prefix === null ? "" : attribute.localName,
    namespace: attribute.value,
  };
}

function findPrefix(
  namespaces: ReadonlyMap<string, string>,
  namespace: string,
): string | null {
  let result: string | null = null;
  for (const [prefix, value] of namespaces) {
    if (prefix !== "" && prefix !== "xmlns" && value === namespace) {
      result = prefix;
    }
  }
  return result;
}

function generatedPrefix(
  namespaces: ReadonlyMap<string, string>,
  state: SerializationState,
): string {
  while (namespaces.has(`ns${String(state.nextPrefix)}`)) {
    state.nextPrefix += 1;
  }
  const prefix = `ns${String(state.nextPrefix)}`;
  state.nextPrefix += 1;
  return prefix;
}

function serializeElement(
  element: Element,
  inheritedNamespaces: ReadonlyMap<string, string>,
  state: SerializationState,
  requireWellFormed: boolean,
): string {
  validateElement(element, requireWellFormed);
  const namespaces = new Map(inheritedNamespaces);
  namespaces.set("xml", XML_NAMESPACE);
  const declarations = new Map<string, string>();
  const localPrefixes = new Set<string>();
  const attributes: string[] = [];

  for (const attribute of element.attributes) {
    const item = explicitNamespaceDeclaration(attribute);
    if (item !== null) {
      localPrefixes.add(item.prefix);
      if (item.namespace !== XML_NAMESPACE) {
        declarations.set(item.prefix, item.namespace);
        namespaces.set(item.prefix, item.namespace);
      }
    }
  }

  let elementPrefix = element.prefix ?? "";
  const elementNamespace = element.namespaceURI ?? "";
  if (element.namespaceURI === XML_NAMESPACE) {
    elementPrefix = "xml";
  } else if (
    elementPrefix !== "" &&
    namespaces.get(elementPrefix) !== elementNamespace &&
    localPrefixes.has(elementPrefix)
  ) {
    elementPrefix = findPrefix(namespaces, elementNamespace) ?? "";
    if (elementPrefix === "") {
      elementPrefix = generatedPrefix(namespaces, state);
    }
  }
  if (namespaces.get(elementPrefix) !== elementNamespace) {
    declarations.set(elementPrefix, elementNamespace);
    namespaces.set(elementPrefix, elementNamespace);
  }
  const qualifiedName =
    elementPrefix === ""
      ? element.localName
      : `${elementPrefix}:${element.localName}`;

  for (const attribute of element.attributes) {
    if (explicitNamespaceDeclaration(attribute) !== null) {
      continue;
    }

    let prefix: string | null = null;
    if (attribute.namespaceURI !== null) {
      if (attribute.namespaceURI === XML_NAMESPACE) {
        prefix = "xml";
      } else {
        const preferred = attribute.prefix;
        if (
          preferred !== null &&
          (!localPrefixes.has(preferred) ||
            namespaces.get(preferred) === attribute.namespaceURI)
        ) {
          prefix = preferred;
        }
        if (
          prefix === null ||
          namespaces.get(prefix) !== attribute.namespaceURI
        ) {
          prefix = findPrefix(namespaces, attribute.namespaceURI);
        }
        prefix ??= generatedPrefix(namespaces, state);
        if (namespaces.get(prefix) !== attribute.namespaceURI) {
          declarations.set(prefix, attribute.namespaceURI);
          namespaces.set(prefix, attribute.namespaceURI);
        }
      }
    }
    const name =
      prefix === null
        ? attribute.localName
        : `${prefix}:${attribute.localName}`;
    attributes.push(
      ` ${name}="${escapeAttribute(attribute.value, requireWellFormed)}"`,
    );
  }

  const serializedDeclarations = [...declarations].map(([prefix, namespace]) =>
    declaration(prefix, namespace, namespaces, requireWellFormed),
  );
  const start = `<${qualifiedName}${serializedDeclarations.join("")}${attributes.join("")}`;
  const contents = templateContents(element);
  const children = childNodes(contents ?? element);
  if (children.length === 0) {
    if (
      element.namespaceURI === HTML_NAMESPACE &&
      !HTML_VOID_ELEMENTS.has(element.localName)
    ) {
      return `${start}></${qualifiedName}>`;
    }
    return `${start} />`;
  }
  const serializedChildren = children
    .map((child) => serializeNode(child, namespaces, state, requireWellFormed))
    .join("");
  return `${start}>${serializedChildren}</${qualifiedName}>`;
}

function serializeNode(
  node: Node,
  namespaces: ReadonlyMap<string, string>,
  state: SerializationState,
  requireWellFormed: boolean,
): string {
  if (node instanceof Element) {
    return serializeElement(node, namespaces, state, requireWellFormed);
  }
  if (node instanceof Document) {
    if (requireWellFormed && node.documentElement === null) {
      throw new XMLSerializationFailure("Document has no document element");
    }
    return serializeChildren(
      node.childNodes,
      namespaces,
      state,
      requireWellFormed,
    );
  }
  if (node instanceof DocumentFragment) {
    return serializeChildren(
      node.childNodes,
      namespaces,
      state,
      requireWellFormed,
    );
  }
  if (node instanceof Attr) {
    return "";
  }
  if (node instanceof Text) {
    return escapeText(node.data, requireWellFormed);
  }
  if (node instanceof CDATASection) {
    return `<![CDATA[${node.data}]]>`;
  }
  if (node instanceof Comment) {
    requireXMLCharacters(node.data, requireWellFormed);
    if (
      requireWellFormed &&
      (node.data.includes("--") || node.data.endsWith("-"))
    ) {
      throw new XMLSerializationFailure("Invalid XML comment");
    }
    return `<!--${node.data}-->`;
  }
  if (node instanceof ProcessingInstruction) {
    requireXMLCharacters(node.data, requireWellFormed);
    if (
      requireWellFormed &&
      (node.target.includes(":") ||
        node.target.toLowerCase() === "xml" ||
        node.data.includes("?>"))
    ) {
      throw new XMLSerializationFailure("Invalid processing instruction");
    }
    return `<?${node.target} ${node.data}?>`;
  }
  if (node instanceof DocumentType) {
    if (
      requireWellFormed &&
      (!isPublicIdentifier(node.publicId) ||
        !containsOnlyXMLCharacters(node.systemId) ||
        (node.systemId.includes('"') && node.systemId.includes("'")))
    ) {
      throw new XMLSerializationFailure("Invalid document type identifier");
    }
    const identifiers =
      node.publicId !== ""
        ? ` PUBLIC ${serializeIdentifier(node.publicId)}${
            node.systemId === "" ? "" : ` ${serializeIdentifier(node.systemId)}`
          }`
        : node.systemId !== ""
          ? ` SYSTEM ${serializeIdentifier(node.systemId)}`
          : "";
    return `<!DOCTYPE ${node.name}${identifiers}>`;
  }
  throw new XMLSerializationFailure("Unsupported node type");
}

function serializeChildren(
  nodes: Iterable<Node>,
  namespaces: ReadonlyMap<string, string>,
  state: SerializationState,
  requireWellFormed: boolean,
): string {
  return [...nodes]
    .map((node) => serializeNode(node, namespaces, state, requireWellFormed))
    .join("");
}

function serializeNodes(
  nodes: Iterable<Node>,
  requireWellFormed: boolean,
): string {
  const namespaces = new Map<string, string>([
    ["", ""],
    ["xml", XML_NAMESPACE],
  ]);
  const state: SerializationState = { nextPrefix: 1 };
  return serializeChildren(nodes, namespaces, state, requireWellFormed);
}

function validateElement(element: Element, requireWellFormed: boolean): void {
  if (!requireWellFormed) {
    return;
  }
  if (!isXMLName(element.localName, false) || element.prefix === "xmlns") {
    throw new XMLSerializationFailure("Invalid XML element name");
  }
  const names = new Set<string>();
  for (const attribute of element.attributes) {
    if (
      !isXMLName(attribute.localName, false) ||
      (attribute.namespaceURI === null && attribute.localName === "xmlns")
    ) {
      throw new XMLSerializationFailure("Invalid XML attribute name");
    }
    requireXMLCharacters(attribute.value, true);
    const key = `${attribute.namespaceURI ?? ""}\0${attribute.localName}`;
    if (names.has(key)) {
      throw new XMLSerializationFailure("Duplicate XML attribute");
    }
    names.add(key);
    if (
      attribute.namespaceURI === XMLNS_NAMESPACE &&
      (attribute.value === XMLNS_NAMESPACE ||
        (attribute.prefix !== null && attribute.value === ""))
    ) {
      throw new XMLSerializationFailure("Invalid namespace declaration");
    }
  }
}

function isPublicIdentifier(value: string): boolean {
  return /^[\u000A\u000D\u0020a-zA-Z0-9\-'()+,./:=?;!*#@$_%]*$/u.test(value);
}

function serializeIdentifier(value: string): string {
  const quote = value.includes('"') ? "'" : '"';
  return `${quote}${value}${quote}`;
}

export function serializeXML(node: Node, requireWellFormed = false): string {
  try {
    return serializeNodes([node], requireWellFormed);
  } catch (error: unknown) {
    if (error instanceof XMLSerializationFailure) {
      throw new DOMException(error.message, "InvalidStateError");
    }
    throw error;
  }
}

export function serializeXMLFragment(element: Element): string {
  try {
    const contents = templateContents(element);
    return serializeNodes(childNodes(contents ?? element), true);
  } catch (error: unknown) {
    if (error instanceof XMLSerializationFailure) {
      throw new DOMException(error.message, "InvalidStateError");
    }
    throw error;
  }
}

export function serializeXMLElement(element: Element): string {
  return serializeXML(element, true);
}
