import {
  CDATASection,
  Comment,
  DocumentType,
  Element,
  ProcessingInstruction,
  Text,
} from "../dom/nodes.js";
import type { Attr, Node } from "../dom/nodes.js";
import { XML_NAMESPACE, XMLNS_NAMESPACE } from "../namespaces.js";

interface SerializationState {
  nextPrefix: number;
}

function escapeText(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\r", "&#xD;");
}

function escapeAttribute(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("\t", "&#x9;")
    .replaceAll("\n", "&#xA;")
    .replaceAll("\r", "&#xD;");
}

function declaration(
  prefix: string,
  namespace: string,
  namespaces: Map<string, string>,
): string {
  namespaces.set(prefix, namespace);
  const name = prefix === "" ? "xmlns" : `xmlns:${prefix}`;
  return ` ${name}="${escapeAttribute(namespace)}"`;
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
  for (const [prefix, value] of namespaces) {
    if (prefix !== "" && prefix !== "xmlns" && value === namespace) {
      return prefix;
    }
  }
  return null;
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
): string {
  const namespaces = new Map(inheritedNamespaces);
  namespaces.set("xml", XML_NAMESPACE);
  const declarations: string[] = [];
  const attributes: string[] = [];

  for (const attribute of element.attributes) {
    const item = explicitNamespaceDeclaration(attribute);
    if (item !== null) {
      declarations.push(declaration(item.prefix, item.namespace, namespaces));
    }
  }

  const elementPrefix = element.prefix ?? "";
  const elementNamespace = element.namespaceURI ?? "";
  if (namespaces.get(elementPrefix) !== elementNamespace) {
    declarations.push(declaration(elementPrefix, elementNamespace, namespaces));
  }
  const qualifiedName =
    element.prefix === null
      ? element.localName
      : `${element.prefix}:${element.localName}`;

  for (const attribute of element.attributes) {
    if (explicitNamespaceDeclaration(attribute) !== null) {
      continue;
    }

    let prefix = attribute.prefix;
    if (attribute.namespaceURI !== null) {
      if (attribute.namespaceURI === XML_NAMESPACE) {
        prefix = "xml";
      } else if (
        prefix === null ||
        namespaces.get(prefix) !== attribute.namespaceURI
      ) {
        prefix = findPrefix(namespaces, attribute.namespaceURI);
        if (prefix === null) {
          prefix = generatedPrefix(namespaces, state);
          declarations.push(
            declaration(prefix, attribute.namespaceURI, namespaces),
          );
        }
      }
    }
    const name =
      prefix === null
        ? attribute.localName
        : `${prefix}:${attribute.localName}`;
    attributes.push(` ${name}="${escapeAttribute(attribute.value)}"`);
  }

  const start = `<${qualifiedName}${declarations.join("")}${attributes.join("")}`;
  if (element.childNodes.length === 0) {
    return `${start} />`;
  }
  const children = [...element.childNodes]
    .map((child) => serializeNode(child, namespaces, state))
    .join("");
  return `${start}>${children}</${qualifiedName}>`;
}

function serializeNode(
  node: Node,
  namespaces: ReadonlyMap<string, string>,
  state: SerializationState,
): string {
  if (node instanceof Element) {
    return serializeElement(node, namespaces, state);
  }
  if (node instanceof Text) {
    return escapeText(node.data);
  }
  if (node instanceof CDATASection) {
    return `<![CDATA[${node.data}]]>`;
  }
  if (node instanceof Comment) {
    return `<!--${node.data}-->`;
  }
  if (node instanceof ProcessingInstruction) {
    return `<?${node.target}${node.data === "" ? "" : ` ${node.data}`}?>`;
  }
  if (node instanceof DocumentType) {
    const identifiers =
      node.publicId !== ""
        ? ` PUBLIC "${node.publicId}" "${node.systemId}"`
        : node.systemId !== ""
          ? ` SYSTEM "${node.systemId}"`
          : "";
    return `<!DOCTYPE ${node.name}${identifiers}>`;
  }
  return "";
}

function serializeNodes(nodes: Iterable<Node>): string {
  const namespaces = new Map<string, string>([
    ["", ""],
    ["xml", XML_NAMESPACE],
  ]);
  const state: SerializationState = { nextPrefix: 1 };
  return [...nodes]
    .map((node) => serializeNode(node, namespaces, state))
    .join("");
}

export function serializeXMLFragment(element: Element): string {
  return serializeNodes(element.childNodes);
}

export function serializeXMLElement(element: Element): string {
  return serializeNodes([element]);
}
