import { nodeImplementation } from "../dom/node-implementation.js";
import type {
  Document,
  DocumentFragment,
  Element,
  FragmentParser,
  Node,
} from "../dom/nodes.js";
import {
  appendNode,
  createCDATASection,
  createComment,
  createDocument,
  createDocumentFragment,
  createDocumentType,
  createElementForDocument as createDOMElement,
  createProcessingInstruction,
  createText,
  setAttributes,
} from "../dom/nodes.js";
import { DOMException } from "../dom-exception.js";
import { createElementForDocument } from "../html-elements.js";
import {
  HTML_NAMESPACE,
  SVG_NAMESPACE,
  XML_NAMESPACE,
  XMLNS_NAMESPACE,
} from "../namespaces.js";
import type { DTDDefaultAttribute } from "./dtd.js";
import { parseInternalSubset } from "./dtd.js";
import {
  isXMLCharacter,
  isXMLNameCharacter,
  isXMLNameStart,
} from "./syntax.js";

export type XMLMIMEType =
  "text/xml" | "application/xml" | "application/xhtml+xml" | "image/svg+xml";

const PARSER_ERROR_NAMESPACE =
  "http://www.mozilla.org/newlayout/xml/parsererror.xml";

interface Entity {
  readonly value?: string;
  readonly external: boolean;
  readonly unparsed?: boolean;
  readonly wellFormed?: boolean;
}

interface AttributeSource {
  readonly name: string;
  readonly value: string;
}

interface ElementFrame {
  readonly element: Element;
  readonly qualifiedName: string;
  readonly namespaces: ReadonlyMap<string, string>;
}

class XMLParseFailure extends Error {}

function isWhitespace(character: string | undefined): boolean {
  return (
    character === " " ||
    character === "\t" ||
    character === "\n" ||
    character === "\r"
  );
}

function splitQualifiedName(name: string): {
  readonly prefix: string | null;
  readonly localName: string;
} {
  const parts = name.split(":");
  if (
    parts.length > 2 ||
    parts.some(
      (part) =>
        part === "" ||
        !isXMLNameStart(Array.from(part)[0] ?? "", false) ||
        !Array.from(part).every((character) =>
          isXMLNameCharacter(character, false),
        ),
    )
  ) {
    throw new XMLParseFailure(`Invalid qualified name: ${name}`);
  }
  if (parts.length === 1) {
    return { prefix: null, localName: name };
  }
  return { prefix: parts[0] ?? null, localName: parts[1] ?? "" };
}

function inheritedNamespaces(context: Element): Map<string, string> {
  const result = new Map<string, string>([["xml", XML_NAMESPACE]]);
  const ancestors: Element[] = [];
  for (let element: Element | null = context; element !== null;) {
    ancestors.push(element);
    element = element.parentElement;
  }
  for (const element of ancestors.reverse()) {
    if (element.prefix === null) {
      result.set("", element.namespaceURI ?? "");
    } else if (element.namespaceURI !== null) {
      result.set(element.prefix, element.namespaceURI);
    }
    for (const attribute of element.attributes) {
      if (attribute.namespaceURI === XMLNS_NAMESPACE) {
        const prefix = attribute.prefix === null ? "" : attribute.localName;
        result.set(prefix, attribute.value);
      }
    }
  }
  return result;
}

class XMLParserCore {
  #source: string;
  #position = 0;
  readonly #document: Document;
  readonly #fragment: DocumentFragment | null;
  readonly #frames: ElementFrame[] = [];
  readonly #entities = new Map<string, Entity>([
    ["amp", { value: "&", external: false }],
    ["lt", { value: "<", external: false }],
    ["gt", { value: ">", external: false }],
    ["apos", { value: "'", external: false }],
    ["quot", { value: '"', external: false }],
  ]);
  readonly #initialNamespaces: ReadonlyMap<string, string>;
  readonly #tokenizedAttributes = new Set<string>();
  readonly #defaultAttributes: DTDDefaultAttribute[] = [];
  #rootSeen = false;
  #rootClosed = false;
  #doctypeSeen = false;
  #hasExternalSubset = false;
  #entityExpansionCount = 0;

  constructor(
    source: string,
    document: Document,
    fragment: DocumentFragment | null,
    initialNamespaces: ReadonlyMap<string, string>,
  ) {
    this.#source = source.replaceAll("\r\n", "\n").replaceAll("\r", "\n");
    this.#document = document;
    this.#fragment = fragment;
    this.#initialNamespaces = initialNamespaces;
    for (const character of this.#source) {
      const codePoint = character.codePointAt(0);
      if (codePoint === undefined || !isXMLCharacter(codePoint)) {
        throw new XMLParseFailure(
          "The input contains an invalid XML character",
        );
      }
    }
  }

  parse(): void {
    if (this.#fragment === null && /^<\?xml(?:\s|\?>)/u.test(this.#source)) {
      this.#parseXMLDeclaration();
    }

    while (!this.#atEnd()) {
      if (this.#startsWith("<!--")) {
        this.#parseComment();
      } else if (this.#startsWith("<?")) {
        this.#parseProcessingInstruction();
      } else if (this.#startsWith("<![CDATA[")) {
        this.#parseCDATA();
      } else if (this.#startsWith("<!DOCTYPE")) {
        this.#parseDoctype();
      } else if (this.#startsWith("</")) {
        this.#parseEndTag();
      } else if (this.#startsWith("<")) {
        this.#parseStartTag();
      } else {
        this.#parseText();
      }
    }

    if (this.#frames.length !== 0) {
      throw new XMLParseFailure(
        `Unclosed element: ${this.#frames.at(-1)?.qualifiedName ?? ""}`,
      );
    }
    if (this.#fragment === null && !this.#rootSeen) {
      throw new XMLParseFailure("The document has no document element");
    }
  }

  #parseXMLDeclaration(): void {
    const end = this.#source.indexOf("?>", this.#position + 5);
    if (end < 0) {
      throw new XMLParseFailure("Unclosed XML declaration");
    }
    const declaration = this.#source.slice(this.#position + 5, end);
    if (
      !/^\s+version\s*=\s*(['"])1\.[0-9]+\1(?:\s+encoding\s*=\s*(['"])[A-Za-z][A-Za-z0-9._-]*\2)?(?:\s+standalone\s*=\s*(['"])(?:yes|no)\3)?\s*$/u.test(
        declaration,
      )
    ) {
      throw new XMLParseFailure("Invalid XML declaration");
    }
    this.#position = end + 2;
  }

  #parseComment(): void {
    const end = this.#source.indexOf("-->", this.#position + 4);
    if (end < 0) {
      throw new XMLParseFailure("Unclosed comment");
    }
    const data = this.#source.slice(this.#position + 4, end);
    if (data.includes("--") || data.endsWith("-")) {
      throw new XMLParseFailure("Invalid comment");
    }
    this.#append(createComment(this.#document, data));
    this.#position = end + 3;
  }

  #parseProcessingInstruction(): void {
    this.#position += 2;
    const target = this.#parseName();
    if (target.toLowerCase() === "xml" || target.includes(":")) {
      throw new XMLParseFailure("Reserved processing instruction target");
    }
    const end = this.#source.indexOf("?>", this.#position);
    if (end < 0) {
      throw new XMLParseFailure("Unclosed processing instruction");
    }
    const raw = this.#source.slice(this.#position, end);
    if (raw !== "" && !isWhitespace(raw[0])) {
      throw new XMLParseFailure("Invalid processing instruction");
    }
    this.#append(
      createProcessingInstruction(this.#document, target, raw.trimStart()),
    );
    this.#position = end + 2;
  }

  #parseCDATA(): void {
    if (this.#frames.length === 0) {
      throw new XMLParseFailure("CDATA section outside the document element");
    }
    const end = this.#source.indexOf("]]>", this.#position + 9);
    if (end < 0) {
      throw new XMLParseFailure("Unclosed CDATA section");
    }
    const data = this.#source.slice(this.#position + 9, end);
    this.#append(createCDATASection(this.#document, data));
    this.#position = end + 3;
  }

  #parseDoctype(): void {
    if (
      this.#fragment !== null ||
      this.#frames.length !== 0 ||
      this.#rootSeen ||
      this.#doctypeSeen
    ) {
      throw new XMLParseFailure("DOCTYPE is not allowed here");
    }
    this.#position += "<!DOCTYPE".length;
    this.#requireWhitespace();
    const name = this.#parseName();
    this.#skipWhitespace();

    let publicId = "";
    let systemId = "";
    if (this.#startsWith("SYSTEM")) {
      this.#hasExternalSubset = true;
      this.#position += "SYSTEM".length;
      this.#requireWhitespace();
      systemId = this.#parseQuotedLiteral();
      this.#skipWhitespace();
    } else if (this.#startsWith("PUBLIC")) {
      this.#hasExternalSubset = true;
      this.#position += "PUBLIC".length;
      this.#requireWhitespace();
      publicId = this.#parseQuotedLiteral();
      if (
        !Array.from(publicId).every((character) =>
          /[\u000a\u000d\u0020a-zA-Z0-9\-'()+,./:=?;!*#@$_%]/u.test(character),
        )
      ) {
        throw new XMLParseFailure("Invalid public identifier");
      }
      this.#requireWhitespace();
      systemId = this.#parseQuotedLiteral();
      this.#skipWhitespace();
    }

    if (this.#startsWith("[")) {
      const subsetStart = ++this.#position;
      const subsetEnd = this.#findSubsetEnd();
      const subset = this.#source.slice(subsetStart, subsetEnd);
      try {
        const result = parseInternalSubset(subset);
        for (const [entityName, entity] of result.generalEntities) {
          if (!this.#entities.has(entityName)) {
            this.#entities.set(entityName, entity);
          }
        }
        for (const attribute of result.tokenizedAttributes) {
          this.#tokenizedAttributes.add(attribute);
        }
        this.#defaultAttributes.push(...result.defaultAttributes);
        if (result.externalDeclarationsSkipped) {
          this.#hasExternalSubset = true;
        }
      } catch (error: unknown) {
        if (error instanceof SyntaxError) {
          throw new XMLParseFailure(error.message);
        }
        throw error;
      }
      this.#position = subsetEnd + 1;
      this.#skipWhitespace();
    }
    if (!this.#startsWith(">")) {
      throw new XMLParseFailure("Invalid DOCTYPE declaration");
    }
    this.#position += 1;
    this.#doctypeSeen = true;
    this.#append(createDocumentType(this.#document, name, publicId, systemId));
  }

  #findSubsetEnd(): number {
    let quote: string | null = null;
    for (let index = this.#position; index < this.#source.length; index += 1) {
      const character = this.#source[index] ?? "";
      if (quote !== null) {
        if (character === quote) {
          quote = null;
        }
      } else if (this.#source.startsWith("<!--", index)) {
        const end = this.#source.indexOf("-->", index + 4);
        if (end < 0) {
          throw new XMLParseFailure("Unclosed comment in DOCTYPE");
        }
        index = end + 2;
      } else if (this.#source.startsWith("<?", index)) {
        const end = this.#source.indexOf("?>", index + 2);
        if (end < 0) {
          throw new XMLParseFailure(
            "Unclosed processing instruction in DOCTYPE",
          );
        }
        index = end + 1;
      } else if (character === '"' || character === "'") {
        quote = character;
      } else if (character === "]") {
        let following = index + 1;
        while (isWhitespace(this.#source[following])) {
          following += 1;
        }
        if (this.#source[following] === ">") {
          return index;
        }
      }
    }
    throw new XMLParseFailure("Unclosed DOCTYPE internal subset");
  }

  #parseStartTag(): void {
    if (this.#fragment === null && this.#rootClosed) {
      throw new XMLParseFailure("The document has more than one root element");
    }
    this.#position += 1;
    const qualifiedName = this.#parseName();
    const attributes: AttributeSource[] = [];
    let selfClosing = false;

    for (;;) {
      const hadWhitespace = this.#skipWhitespace();
      if (this.#startsWith("/>")) {
        selfClosing = true;
        this.#position += 2;
        break;
      }
      if (this.#startsWith(">")) {
        this.#position += 1;
        break;
      }
      if (!hadWhitespace) {
        throw new XMLParseFailure("Missing whitespace before an attribute");
      }
      const name = this.#parseName();
      this.#skipWhitespace();
      this.#expect("=");
      this.#skipWhitespace();
      const rawValue = this.#parseAttributeValue();
      const value = this.#tokenizedAttributes.has(
        `${qualifiedName}\u0000${name}`,
      )
        ? rawValue.trim().replaceAll(/ +/gu, " ")
        : rawValue;
      if (attributes.some((attribute) => attribute.name === name)) {
        throw new XMLParseFailure(`Duplicate attribute: ${name}`);
      }
      attributes.push({ name, value });
    }

    for (const attribute of this.#defaultAttributes) {
      if (
        attribute.elementName !== qualifiedName ||
        attributes.some(({ name }) => name === attribute.attributeName)
      ) {
        continue;
      }
      const normalized = attribute.value.replaceAll(/[\t\n\r]/gu, " ");
      attributes.push({
        name: attribute.attributeName,
        value: attribute.tokenized
          ? normalized.trim().replaceAll(/ +/gu, " ")
          : normalized,
      });
    }

    const parentNamespaces =
      this.#frames.at(-1)?.namespaces ?? this.#initialNamespaces;
    const namespaces = new Map(parentNamespaces);
    for (const attribute of attributes) {
      if (attribute.name === "xmlns") {
        this.#setNamespace(namespaces, "", attribute.value);
      } else if (attribute.name.startsWith("xmlns:")) {
        const { prefix, localName } = splitQualifiedName(attribute.name);
        if (prefix !== "xmlns") {
          throw new XMLParseFailure("Invalid namespace declaration");
        }
        this.#setNamespace(namespaces, localName, attribute.value);
      }
    }

    const elementName = splitQualifiedName(qualifiedName);
    const defaultNamespace = namespaces.get("");
    const namespaceURI =
      elementName.prefix === null
        ? defaultNamespace === ""
          ? null
          : (defaultNamespace ?? null)
        : namespaces.get(elementName.prefix);
    if (elementName.prefix !== null && namespaceURI === undefined) {
      throw new XMLParseFailure(
        `Unbound namespace prefix: ${elementName.prefix}`,
      );
    }
    const element = createDOMElement(
      this.#document,
      elementName.localName,
      namespaceURI ?? null,
      elementName.prefix,
    );
    if (
      elementName.localName === "script" &&
      (namespaceURI === HTML_NAMESPACE || namespaceURI === SVG_NAMESPACE)
    ) {
      const implementation = nodeImplementation(element);
      implementation.scriptForceAsync = false;
      if (this.#fragment !== null) {
        implementation.scriptAlreadyStarted = true;
      }
    }

    const expandedNames = new Set<string>();
    for (const attribute of attributes) {
      const name = splitQualifiedName(attribute.name);
      let attributeNamespace: string | null = null;
      if (attribute.name === "xmlns") {
        attributeNamespace = XMLNS_NAMESPACE;
      } else if (name.prefix === "xmlns") {
        attributeNamespace = XMLNS_NAMESPACE;
      } else if (name.prefix !== null) {
        const resolved = namespaces.get(name.prefix);
        if (resolved === undefined) {
          throw new XMLParseFailure(`Unbound namespace prefix: ${name.prefix}`);
        }
        attributeNamespace = resolved;
      }
      const expandedName = `${attributeNamespace ?? ""}\u0000${name.localName}`;
      if (expandedNames.has(expandedName)) {
        throw new XMLParseFailure(
          `Duplicate expanded attribute: ${attribute.name}`,
        );
      }
      expandedNames.add(expandedName);
      setAttributes(element, [
        {
          name: attribute.name,
          value: attribute.value,
          namespaceURI: attributeNamespace,
          prefix: name.prefix,
          localName: name.localName,
        },
      ]);
    }

    this.#append(element);
    if (this.#fragment === null && this.#frames.length === 0) {
      this.#rootSeen = true;
    }
    if (selfClosing) {
      if (this.#fragment === null && this.#frames.length === 0) {
        this.#rootClosed = true;
      }
    } else {
      this.#frames.push({ element, qualifiedName, namespaces });
    }
  }

  #setNamespace(
    namespaces: Map<string, string>,
    prefix: string,
    namespace: string,
  ): void {
    if (
      prefix === "xmlns" ||
      namespace === XMLNS_NAMESPACE ||
      (prefix === "xml" && namespace !== XML_NAMESPACE) ||
      (prefix !== "xml" && namespace === XML_NAMESPACE) ||
      (prefix !== "" && namespace === "")
    ) {
      throw new XMLParseFailure("Invalid namespace declaration");
    }
    namespaces.set(prefix, namespace);
  }

  #parseEndTag(): void {
    this.#position += 2;
    const qualifiedName = this.#parseName();
    this.#skipWhitespace();
    this.#expect(">");
    const frame = this.#frames.pop();
    if (frame?.qualifiedName !== qualifiedName) {
      throw new XMLParseFailure(`Mismatched end tag: ${qualifiedName}`);
    }
    if (this.#fragment === null && this.#frames.length === 0) {
      this.#rootClosed = true;
    }
  }

  #parseText(): void {
    let value = "";
    while (!this.#atEnd() && !this.#startsWith("<")) {
      if (this.#startsWith("&")) {
        if (this.#fragment === null && this.#frames.length === 0) {
          throw new XMLParseFailure(
            "References are not allowed outside the document element",
          );
        }
        const referenceStart = this.#position;
        const replacement = this.#parseReference(false);
        if (replacement === null) {
          if (value !== "") {
            this.#appendText(value);
          }
          this.#expandEntityAt(referenceStart);
          return;
        }
        value += replacement;
      } else {
        const character = this.#currentCharacter();
        if (
          character === "]" &&
          this.#source.startsWith("]]>", this.#position)
        ) {
          throw new XMLParseFailure("]]> is not allowed in character data");
        }
        value += character;
        this.#position += character.length;
      }
    }
    this.#appendText(value);
  }

  #appendText(value: string): void {
    if (value === "") {
      return;
    }
    if (this.#frames.length === 0 && this.#fragment === null) {
      if (value.trim() !== "") {
        throw new XMLParseFailure(
          "Character data outside the document element",
        );
      }
      return;
    }
    this.#append(createText(this.#document, value));
  }

  #parseAttributeValue(): string {
    const quote = this.#source[this.#position];
    if (quote !== '"' && quote !== "'") {
      throw new XMLParseFailure("Attribute values must be quoted");
    }
    this.#position += 1;
    let result = "";
    while (!this.#atEnd() && this.#source[this.#position] !== quote) {
      if (this.#startsWith("<")) {
        throw new XMLParseFailure("< is not allowed in an attribute value");
      }
      if (this.#startsWith("&")) {
        const replacement = this.#parseReference(true);
        if (replacement === null) {
          throw new XMLParseFailure("External entity in an attribute value");
        }
        result += replacement;
      } else {
        const character = this.#currentCharacter();
        result += isWhitespace(character) ? " " : character;
        this.#position += character.length;
      }
    }
    if (this.#atEnd()) {
      throw new XMLParseFailure("Unclosed attribute value");
    }
    this.#position += 1;
    return result;
  }

  #parseReference(inAttribute: boolean): string | null {
    const start = this.#position;
    this.#position += 1;
    const semicolon = this.#source.indexOf(";", this.#position);
    if (semicolon < 0) {
      throw new XMLParseFailure("Unclosed entity reference");
    }
    const name = this.#source.slice(this.#position, semicolon);
    this.#position = semicolon + 1;
    if (name.startsWith("#x")) {
      return this.#numericReference(name.slice(2), 16);
    }
    if (name.startsWith("#")) {
      return this.#numericReference(name.slice(1), 10);
    }
    const entity = this.#entities.get(name);
    if (entity === undefined) {
      if (this.#hasExternalSubset) {
        return inAttribute ? "" : null;
      }
      throw new XMLParseFailure(`Undefined entity: ${name}`);
    }
    if (entity.external) {
      if (entity.unparsed === true) {
        throw new XMLParseFailure(`Reference to an unparsed entity: ${name}`);
      }
      return null;
    }
    if (entity.value === undefined) {
      throw new XMLParseFailure(`Entity has no replacement text: ${name}`);
    }
    if (entity.wellFormed === false) {
      throw new XMLParseFailure(
        `Entity replacement text is not well-formed: ${name}`,
      );
    }
    if (
      name === "amp" ||
      name === "lt" ||
      name === "gt" ||
      name === "apos" ||
      name === "quot"
    ) {
      return entity.value;
    }
    if (inAttribute) {
      return this.#expandAttributeEntity(entity.value, new Set([name]));
    }
    this.#position = start;
    return null;
  }

  #numericReference(digits: string, radix: number): string {
    if (
      digits === "" ||
      !new RegExp(radix === 16 ? "^[0-9a-fA-F]+$" : "^[0-9]+$").test(digits)
    ) {
      throw new XMLParseFailure("Invalid character reference");
    }
    const codePoint = Number.parseInt(digits, radix);
    if (!isXMLCharacter(codePoint)) {
      throw new XMLParseFailure("Invalid XML character reference");
    }
    return String.fromCodePoint(codePoint);
  }

  #expandAttributeEntity(value: string, active: Set<string>): string {
    return value.replaceAll(/&([^;]+);/gu, (_reference, name: string) => {
      if (name.startsWith("#x")) {
        return this.#numericReference(name.slice(2), 16);
      }
      if (name.startsWith("#")) {
        return this.#numericReference(name.slice(1), 10);
      }
      const entity = this.#entities.get(name);
      if (
        entity === undefined ||
        entity.external ||
        entity.value === undefined
      ) {
        throw new XMLParseFailure(`Invalid entity in attribute value: ${name}`);
      }
      if (entity.unparsed === true || entity.wellFormed === false) {
        throw new XMLParseFailure(`Invalid entity in attribute value: ${name}`);
      }
      if (active.has(name)) {
        throw new XMLParseFailure(`Recursive entity: ${name}`);
      }
      const next = new Set(active).add(name);
      return this.#expandAttributeEntity(entity.value, next);
    });
  }

  #expandEntityAt(start: number): void {
    this.#position = start + 1;
    const semicolon = this.#source.indexOf(";", this.#position);
    if (semicolon < 0) {
      throw new XMLParseFailure("Unclosed entity reference");
    }
    const name = this.#source.slice(this.#position, semicolon);
    const entity = this.#entities.get(name);
    if (entity === undefined || entity.external || entity.value === undefined) {
      if (entity?.unparsed === true) {
        throw new XMLParseFailure(`Reference to an unparsed entity: ${name}`);
      }
      if (
        entity?.external === true ||
        (entity === undefined && this.#hasExternalSubset)
      ) {
        this.#source = `${this.#source.slice(0, start)}${this.#source.slice(semicolon + 1)}`;
        this.#position = start;
        return;
      }
      throw new XMLParseFailure(`Undefined entity: ${name}`);
    }
    if (entity.wellFormed === false) {
      throw new XMLParseFailure(
        `Entity replacement text is not well-formed: ${name}`,
      );
    }
    this.#entityExpansionCount += 1;
    if (this.#entityExpansionCount > 10_000) {
      throw new XMLParseFailure("Entity expansion limit exceeded");
    }
    this.#source = `${this.#source.slice(0, start)}${entity.value}${this.#source.slice(semicolon + 1)}`;
    if (this.#source.length > 10_000_000) {
      throw new XMLParseFailure("Entity replacement text is too large");
    }
    this.#position = start;
  }

  #parseQuotedLiteral(): string {
    const quote = this.#source[this.#position];
    if (quote !== '"' && quote !== "'") {
      throw new XMLParseFailure("Expected a quoted literal");
    }
    const end = this.#source.indexOf(quote, this.#position + 1);
    if (end < 0) {
      throw new XMLParseFailure("Unclosed quoted literal");
    }
    const result = this.#source.slice(this.#position + 1, end);
    this.#position = end + 1;
    return result;
  }

  #parseName(): string {
    const first = this.#currentCharacter();
    if (!isXMLNameStart(first)) {
      throw new XMLParseFailure("Expected an XML name");
    }
    let result = first;
    this.#position += first.length;
    while (!this.#atEnd()) {
      const character = this.#currentCharacter();
      if (!isXMLNameCharacter(character)) {
        break;
      }
      result += character;
      this.#position += character.length;
    }
    return result;
  }

  #append(node: Node): void {
    const parent =
      this.#frames.at(-1)?.element ?? this.#fragment ?? this.#document;
    appendNode(parent, node);
  }

  #requireWhitespace(): void {
    if (!this.#skipWhitespace()) {
      throw new XMLParseFailure("Expected whitespace");
    }
  }

  #skipWhitespace(): boolean {
    const start = this.#position;
    while (isWhitespace(this.#source[this.#position])) {
      this.#position += 1;
    }
    return this.#position !== start;
  }

  #expect(value: string): void {
    if (!this.#startsWith(value)) {
      throw new XMLParseFailure(`Expected ${value}`);
    }
    this.#position += value.length;
  }

  #currentCharacter(): string {
    const codePoint = this.#source.codePointAt(this.#position);
    return codePoint === undefined ? "" : String.fromCodePoint(codePoint);
  }

  #startsWith(value: string): boolean {
    return this.#source.startsWith(value, this.#position);
  }

  #atEnd(): boolean {
    return this.#position >= this.#source.length;
  }
}

const xmlFragmentParser: FragmentParser = {
  parse(input, context) {
    return parseXMLFragment(input, context);
  },
};

function parserErrorDocument(
  type: string,
  message: string,
  documentConstructor: typeof Document,
): Document {
  const document = createDocument(
    xmlFragmentParser,
    type,
    createElementForDocument,
    documentConstructor,
  );
  const error = createDOMElement(
    document,
    "parsererror",
    PARSER_ERROR_NAMESPACE,
  );
  appendNode(error, createText(document, message));
  appendNode(document, error);
  return document;
}

export function parseXML(
  input: string,
  type: string,
  documentConstructor: typeof Document,
): Document {
  const document = createDocument(
    xmlFragmentParser,
    type,
    createElementForDocument,
    documentConstructor,
  );
  try {
    new XMLParserCore(
      (input.startsWith("\uFEFF") ? input.slice(1) : input).toWellFormed(),
      document,
      null,
      new Map([["xml", XML_NAMESPACE]]),
    ).parse();
    return document;
  } catch (error: unknown) {
    if (error instanceof XMLParseFailure) {
      return parserErrorDocument(type, error.message, documentConstructor);
    }
    throw error;
  }
}

export function parseXMLFragment(
  input: string,
  context: Element,
): DocumentFragment {
  const document = context.ownerDocument;
  if (document === null) {
    throw new TypeError("The context element has no owner document");
  }
  const fragment = createDocumentFragment(document);
  try {
    new XMLParserCore(
      input,
      document,
      fragment,
      inheritedNamespaces(context),
    ).parse();
    return fragment;
  } catch (error: unknown) {
    if (error instanceof XMLParseFailure) {
      throw new DOMException(error.message, "SyntaxError");
    }
    throw error;
  }
}
