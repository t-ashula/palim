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

type NamespacePrefixMap = Map<string | null, string[]>;

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
    .replaceAll(">", "&gt;")
    .replaceAll("\t", "&#x9;")
    .replaceAll("\n", "&#xA;")
    .replaceAll("\r", "&#xD;");
}

function copyNamespacePrefixMap(map: NamespacePrefixMap): NamespacePrefixMap {
  return new Map(
    [...map].map(([namespace, prefixes]) => [namespace, [...prefixes]]),
  );
}

function addPrefix(
  map: NamespacePrefixMap,
  namespace: string | null,
  prefix: string,
): void {
  const prefixes = map.get(namespace);
  if (prefixes === undefined) {
    map.set(namespace, [prefix]);
  } else if (!prefixes.includes(prefix)) {
    prefixes.push(prefix);
  }
}

function hasPrefix(
  map: NamespacePrefixMap,
  namespace: string | null,
  prefix: string,
): boolean {
  return map.get(namespace)?.includes(prefix) ?? false;
}

function prefixIsMapped(map: NamespacePrefixMap, prefix: string): boolean {
  for (const prefixes of map.values()) {
    if (prefixes.includes(prefix)) {
      return true;
    }
  }
  return false;
}

function removePrefixMappings(map: NamespacePrefixMap, prefix: string): void {
  for (const [namespace, prefixes] of map) {
    const remaining = prefixes.filter((candidate) => candidate !== prefix);
    if (remaining.length === 0) {
      map.delete(namespace);
    } else if (remaining.length !== prefixes.length) {
      map.set(namespace, remaining);
    }
  }
}

function prefixMapsToAnotherNamespace(
  map: NamespacePrefixMap,
  prefix: string,
  namespace: string,
): boolean {
  for (const [mappedNamespace, prefixes] of map) {
    if (mappedNamespace !== namespace && prefixes.includes(prefix)) {
      return true;
    }
  }
  return false;
}

function preferredPrefix(
  map: NamespacePrefixMap,
  namespace: string | null,
  preferred: string | null,
): string | null {
  const candidates = map.get(namespace);
  if (candidates === undefined || candidates.length === 0) {
    return null;
  }
  if (preferred !== null && candidates.includes(preferred)) {
    return preferred;
  }
  return candidates.at(-1) ?? null;
}

function namespaceValue(value: string): string | null {
  return value === "" ? null : value;
}

function generatedPrefix(
  map: NamespacePrefixMap,
  namespace: string,
  state: SerializationState,
): string {
  let prefix: string;
  do {
    prefix = `ns${String(state.nextPrefix)}`;
    state.nextPrefix += 1;
  } while (prefixIsMapped(map, prefix));
  addPrefix(map, namespace, prefix);
  return prefix;
}

function recordNamespaceInformation(
  element: Element,
  map: NamespacePrefixMap,
  localPrefixes: Map<string, string>,
): string | null {
  let defaultNamespace: string | null = null;
  for (const attribute of element.attributes) {
    if (attribute.namespaceURI !== XMLNS_NAMESPACE) {
      continue;
    }
    if (attribute.prefix === null) {
      defaultNamespace = attribute.value;
      continue;
    }
    const prefix = attribute.localName;
    const namespace = namespaceValue(attribute.value);
    if (namespace === XML_NAMESPACE || hasPrefix(map, namespace, prefix)) {
      continue;
    }
    removePrefixMappings(map, prefix);
    addPrefix(map, namespace, prefix);
    localPrefixes.set(prefix, attribute.value);
  }
  return defaultNamespace;
}

function serializeAttributes(
  element: Element,
  map: NamespacePrefixMap,
  localPrefixes: Map<string, string>,
  state: SerializationState,
  ignoreDefaultNamespace: boolean,
  requireWellFormed: boolean,
): string {
  let result = "";
  for (const attribute of element.attributes) {
    const namespace = attribute.namespaceURI;
    const prefix = attribute.prefix;
    if (namespace === null && attribute.localName === "xmlns") {
      continue;
    }
    let candidate =
      namespace === null ? null : preferredPrefix(map, namespace, prefix);

    if (namespace === XMLNS_NAMESPACE) {
      const declarationNamespace = namespaceValue(attribute.value);
      if (
        attribute.value === XML_NAMESPACE ||
        (prefix === null && ignoreDefaultNamespace) ||
        (prefix !== null &&
          (!localPrefixes.has(attribute.localName) ||
            localPrefixes.get(attribute.localName) !== attribute.value) &&
          hasPrefix(map, declarationNamespace, attribute.localName))
      ) {
        continue;
      }
      if (prefix === "xmlns") {
        candidate = "xmlns";
      }
    } else if (namespace !== null && candidate === null) {
      candidate =
        prefix !== null &&
        !localPrefixes.has(prefix) &&
        !prefixMapsToAnotherNamespace(map, prefix, namespace)
          ? prefix
          : generatedPrefix(map, namespace, state);
      addPrefix(map, namespace, candidate);
      localPrefixes.set(candidate, namespace);
      result += ` xmlns:${candidate}="${escapeAttribute(namespace, requireWellFormed)}"`;
    }

    const name =
      candidate === null
        ? attribute.localName
        : `${candidate}:${attribute.localName}`;
    result += ` ${name}="${escapeAttribute(attribute.value, requireWellFormed)}"`;
  }
  return result;
}

function serializeElement(
  element: Element,
  inheritedNamespace: string | null,
  prefixMap: NamespacePrefixMap,
  state: SerializationState,
  requireWellFormed: boolean,
): string {
  validateElement(element, requireWellFormed);
  const map = copyNamespacePrefixMap(prefixMap);
  const localPrefixes = new Map<string, string>();
  const localDefaultNamespace = recordNamespaceInformation(
    element,
    map,
    localPrefixes,
  );
  const namespace = element.namespaceURI;
  let childNamespace = inheritedNamespace;
  let ignoreDefaultNamespace = false;
  let qualifiedName: string;
  let start: string;

  if (inheritedNamespace === namespace) {
    ignoreDefaultNamespace =
      localDefaultNamespace !== null &&
      ![...localPrefixes.values()].includes("");
    qualifiedName =
      namespace === XML_NAMESPACE
        ? `xml:${element.localName}`
        : element.localName;
    start = `<${qualifiedName}`;
  } else {
    let prefix = element.prefix;
    let candidate = preferredPrefix(map, namespace, prefix);
    if (prefix === "xmlns") {
      candidate = prefix;
    }

    if (candidate !== null) {
      qualifiedName = `${candidate}:${element.localName}`;
      start = `<${qualifiedName}`;
      if (
        localDefaultNamespace !== null &&
        localDefaultNamespace !== XML_NAMESPACE
      ) {
        childNamespace = namespaceValue(localDefaultNamespace);
      }
    } else if (prefix !== null) {
      if (localPrefixes.has(prefix)) {
        prefix = generatedPrefix(map, namespace ?? "", state);
      }
      addPrefix(map, namespace, prefix);
      qualifiedName = `${prefix}:${element.localName}`;
      start = `<${qualifiedName} xmlns:${prefix}="${escapeAttribute(namespace ?? "", requireWellFormed)}"`;
      if (localDefaultNamespace !== null) {
        childNamespace = namespaceValue(localDefaultNamespace);
      }
    } else if (
      localDefaultNamespace === null ||
      namespaceValue(localDefaultNamespace) !== namespace
    ) {
      ignoreDefaultNamespace = true;
      qualifiedName = element.localName;
      childNamespace = namespace;
      start = `<${qualifiedName} xmlns="${escapeAttribute(namespace ?? "", requireWellFormed)}"`;
    } else {
      qualifiedName = element.localName;
      childNamespace = namespace;
      start = `<${qualifiedName}`;
    }
  }

  start += serializeAttributes(
    element,
    map,
    localPrefixes,
    state,
    ignoreDefaultNamespace,
    requireWellFormed,
  );
  const contents = templateContents(element);
  const children = childNodes(contents ?? element);
  if (children.length === 0) {
    if (namespace === HTML_NAMESPACE) {
      if (HTML_VOID_ELEMENTS.has(element.localName)) {
        return `${start} />`;
      }
      return `${start}></${qualifiedName}>`;
    }
    return `${start}/>`;
  }
  const serializedChildren = children
    .map((child) =>
      serializeNode(child, childNamespace, map, state, requireWellFormed),
    )
    .join("");
  return `${start}>${serializedChildren}</${qualifiedName}>`;
}

function serializeNode(
  node: Node,
  namespace: string | null,
  prefixMap: NamespacePrefixMap,
  state: SerializationState,
  requireWellFormed: boolean,
): string {
  if (node instanceof Element) {
    return serializeElement(
      node,
      namespace,
      prefixMap,
      state,
      requireWellFormed,
    );
  }
  if (node instanceof Document) {
    if (requireWellFormed && node.documentElement === null) {
      throw new XMLSerializationFailure("Document has no document element");
    }
    return serializeChildren(
      node.childNodes,
      namespace,
      prefixMap,
      state,
      requireWellFormed,
    );
  }
  if (node instanceof DocumentFragment) {
    return serializeChildren(
      node.childNodes,
      namespace,
      prefixMap,
      state,
      requireWellFormed,
    );
  }
  if (node instanceof Attr) {
    return "";
  }
  if (node instanceof CDATASection) {
    return `<![CDATA[${node.data}]]>`;
  }
  if (node instanceof Text) {
    return escapeText(node.data, requireWellFormed);
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
  namespace: string | null,
  prefixMap: NamespacePrefixMap,
  state: SerializationState,
  requireWellFormed: boolean,
): string {
  return [...nodes]
    .map((node) =>
      serializeNode(node, namespace, prefixMap, state, requireWellFormed),
    )
    .join("");
}

function serializeNodes(
  nodes: Iterable<Node>,
  requireWellFormed: boolean,
): string {
  const prefixMap: NamespacePrefixMap = new Map();
  addPrefix(prefixMap, XML_NAMESPACE, "xml");
  const state: SerializationState = { nextPrefix: 1 };
  return serializeChildren(nodes, null, prefixMap, state, requireWellFormed);
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
  return `"${value}"`;
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
