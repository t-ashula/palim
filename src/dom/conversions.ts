import { DOMException } from "../dom-exception.js";
import { XML_NAMESPACE, XMLNS_NAMESPACE } from "../namespaces.js";

export function domString(value: unknown): string {
  if (typeof value === "symbol") {
    throw new TypeError("Cannot convert a Symbol value to a string");
  }
  return String(value);
}

export function asciiLowercase(value: string): string {
  return value.replaceAll(/[A-Z]/g, (character) => character.toLowerCase());
}

export function normalizeNamespace(namespace: unknown): string | null {
  if (namespace === null || namespace === undefined) {
    return null;
  }
  const converted = domString(namespace);
  return converted === "" ? null : converted;
}

export function validateName(name: string): void {
  if (
    !/^[\p{L}_:][\p{L}\p{N}_.:\-\u00B7\u0300-\u036F\u203F-\u2040]*$/u.test(name)
  ) {
    throw new DOMException(
      `Invalid character in attribute name: ${name}`,
      "InvalidCharacterError",
    );
  }
}

export function validateElementLocalName(name: string): void {
  if (
    !/^(?:[A-Za-z][^\0\t\n\f\r />]*|[:_\u0080-\u{10FFFF}][A-Za-z0-9.\-:_\u0080-\u{10FFFF}]*)$/u.test(
      name,
    )
  ) {
    throw new DOMException(
      `Invalid character in element local name: ${name}`,
      "InvalidCharacterError",
    );
  }
}

function validateNamespacePrefix(prefix: string): void {
  if (prefix === "" || /[\t\n\f\r \0/>]/u.test(prefix)) {
    throw new DOMException(
      `Invalid character in namespace prefix: ${prefix}`,
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

export function validateAndExtract(
  namespace: string | null,
  qualifiedName: string,
): ExtractedQualifiedName {
  validateName(qualifiedName);
  const parts = qualifiedName.split(":");
  if (parts.length > 2 || parts.some((part) => part === "")) {
    throw new DOMException(
      `Invalid qualified name: ${qualifiedName}`,
      "InvalidCharacterError",
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

export function validateAndExtractElement(
  namespace: string | null,
  qualifiedName: string,
): ExtractedQualifiedName {
  const separator = qualifiedName.indexOf(":");
  const prefix = separator < 0 ? null : qualifiedName.slice(0, separator);
  const localName =
    separator < 0 ? qualifiedName : qualifiedName.slice(separator + 1);
  if (prefix !== null) {
    validateNamespacePrefix(prefix);
  }
  validateElementLocalName(localName);
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
