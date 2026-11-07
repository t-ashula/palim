import type { Document, Element } from "./nodes.js";

export interface CustomElementDefinition {
  readonly name: string;
  readonly construct: (
    document: Document,
    localName: string,
    prefix: string | null,
  ) => Element;
  readonly connectedCallback: ((element: Element) => void) | null;
  readonly disconnectedCallback: ((element: Element) => void) | null;
  readonly connectedMoveCallback: ((element: Element) => void) | null;
}

const DOCUMENT_REGISTRIES = new WeakMap<Document, CustomElementRegistry>();
const CUSTOM_ELEMENT_DEFINITIONS = new WeakMap<
  Element,
  CustomElementDefinition
>();
export class CustomElementRegistry {
  readonly #definitions = new Map<string, CustomElementDefinition>();

  define(definition: CustomElementDefinition): void {
    if (!isValidCustomElementName(definition.name)) {
      throw new SyntaxError("The custom element name is invalid");
    }
    if (this.#definitions.has(definition.name)) {
      throw new Error("The custom element name is already defined");
    }
    this.#definitions.set(definition.name, definition);
  }

  definition(name: string): CustomElementDefinition | null {
    return this.#definitions.get(name) ?? null;
  }
}

export function setDocumentCustomElementRegistry(
  document: Document,
  registry: CustomElementRegistry,
): void {
  DOCUMENT_REGISTRIES.set(document, registry);
}

export function createDefinedCustomElement(
  document: Document,
  localName: string,
  prefix: string | null,
): Element | null {
  const definition = DOCUMENT_REGISTRIES.get(document)?.definition(localName);
  if (definition === null || definition === undefined) {
    return null;
  }
  const element = definition.construct(document, localName, prefix);
  CUSTOM_ELEMENT_DEFINITIONS.set(element, definition);
  return element;
}

export function enqueueCustomElementConnectedReaction(element: Element): void {
  const callback = CUSTOM_ELEMENT_DEFINITIONS.get(element)?.connectedCallback;
  if (callback !== null && callback !== undefined) {
    enqueueReaction(() => {
      callback(element);
    });
  }
}

export function enqueueCustomElementDisconnectedReaction(
  element: Element,
): void {
  const callback =
    CUSTOM_ELEMENT_DEFINITIONS.get(element)?.disconnectedCallback;
  if (callback !== null && callback !== undefined) {
    enqueueReaction(() => {
      callback(element);
    });
  }
}

export function enqueueCustomElementMoveReaction(element: Element): void {
  const definition = CUSTOM_ELEMENT_DEFINITIONS.get(element);
  if (definition === undefined) {
    return;
  }
  if (definition.connectedMoveCallback !== null) {
    enqueueReaction(() => definition.connectedMoveCallback?.(element));
    return;
  }
  if (definition.disconnectedCallback !== null) {
    enqueueReaction(() => definition.disconnectedCallback?.(element));
  }
  if (definition.connectedCallback !== null) {
    enqueueReaction(() => definition.connectedCallback?.(element));
  }
}

function enqueueReaction(reaction: () => void): void {
  reaction();
}

function isValidCustomElementName(name: string): boolean {
  return (
    ![
      "annotation-xml",
      "color-profile",
      "font-face",
      "font-face-src",
      "font-face-uri",
      "font-face-format",
      "font-face-name",
      "missing-glyph",
    ].includes(name) &&
    /^[a-z][.0-9_a-z\-\u00B7\u00C0-\uD6FF\uF900-\uFFFD]*-[.0-9_a-z\-\u00B7\u00C0-\uD6FF\uF900-\uFFFD]*$/u.test(
      name,
    )
  );
}
