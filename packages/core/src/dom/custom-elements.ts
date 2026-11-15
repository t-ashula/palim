import type { CallbackResult } from "../callback-result.js";
import { DOMException } from "../dom-exception.js";
import type { Node } from "./nodes.js";
import {
  Document,
  Element,
  shadowIncludingInclusiveDescendantElements,
  ShadowRoot,
} from "./nodes.js";

export interface CustomElementDefinition {
  readonly name: string;
  readonly constructorIdentity?: object;
  readonly construct: (
    document: Document,
    localName: string,
    prefix: string | null,
    element?: Element,
  ) => CallbackResult<Element>;
  readonly connectedCallback: ((element: Element) => void) | null;
  readonly disconnectedCallback: ((element: Element) => void) | null;
  readonly connectedMoveCallback: ((element: Element) => void) | null;
}

const DOCUMENT_REGISTRIES = new WeakMap<Document, CustomElementRegistry>();
const NODE_REGISTRIES = new WeakMap<Node, CustomElementRegistry>();
const CUSTOM_ELEMENT_DEFINITIONS = new WeakMap<
  Element,
  CustomElementDefinition
>();
const FAILED_CUSTOM_ELEMENTS = new WeakSet<Element>();
export class CustomElementRegistry {
  readonly #definitions = new Map<string, CustomElementDefinition>();
  readonly #initializedRoots = new Set<Node>();

  constructor(readonly scoped = true) {}

  define(definition: CustomElementDefinition): void {
    if (!isValidCustomElementName(definition.name)) {
      throw new DOMException(
        "The custom element name is invalid",
        "SyntaxError",
      );
    }
    if (this.#definitions.has(definition.name)) {
      throw new DOMException(
        "The custom element name is already defined",
        "NotSupportedError",
      );
    }
    this.#definitions.set(definition.name, definition);
  }

  definition(name: string): CustomElementDefinition | null {
    return this.#definitions.get(name) ?? null;
  }

  definitionForConstructor(
    constructorIdentity: object,
  ): CustomElementDefinition | null {
    for (const definition of this.#definitions.values()) {
      if (definition.constructorIdentity === constructorIdentity) {
        return definition;
      }
    }
    return null;
  }

  addInitializedRoot(root: Node): void {
    this.#initializedRoots.add(root);
  }

  initializedRoots(): readonly Node[] {
    return [...this.#initializedRoots];
  }
}

export function documentCustomElementRegistry(
  document: Document,
): CustomElementRegistry {
  let registry = DOCUMENT_REGISTRIES.get(document);
  if (registry === undefined) {
    registry = new CustomElementRegistry(false);
    DOCUMENT_REGISTRIES.set(document, registry);
  }
  return registry;
}

export function setDocumentCustomElementRegistry(
  document: Document,
  registry: CustomElementRegistry,
): void {
  DOCUMENT_REGISTRIES.set(document, registry);
}

export function customElementRegistryForNode(
  node: Node,
): CustomElementRegistry | null {
  const assigned = NODE_REGISTRIES.get(node);
  if (assigned !== undefined) {
    return assigned;
  }
  if (node instanceof Document) {
    return DOCUMENT_REGISTRIES.get(node) ?? null;
  }
  const root = node.getRootNode();
  if (
    root !== node &&
    (root instanceof Document ||
      root instanceof Element ||
      root instanceof ShadowRoot)
  ) {
    return customElementRegistryForNode(root);
  }
  if (node instanceof Element && node.ownerDocument !== null) {
    return DOCUMENT_REGISTRIES.get(node.ownerDocument) ?? null;
  }
  if (node instanceof ShadowRoot) {
    return customElementRegistryForNode(node.host);
  }
  return null;
}

export function initializeCustomElementRegistry(
  registry: CustomElementRegistry,
  root: Node,
): void {
  if (
    root instanceof Document &&
    (!registry.scoped || customElementRegistryForNode(root) !== null)
  ) {
    throw new DOMException(
      "The Document cannot be initialized with this registry",
      "NotSupportedError",
    );
  }
  registry.addInitializedRoot(root);
  for (const node of lightTreeInclusiveDescendants(root)) {
    if (
      (node instanceof Document ||
        node instanceof Element ||
        node instanceof ShadowRoot) &&
      customElementRegistryForNode(node) === null
    ) {
      if (node instanceof Document) {
        DOCUMENT_REGISTRIES.set(node, registry);
      } else {
        NODE_REGISTRIES.set(node, registry);
      }
    }
  }
}

function* lightTreeInclusiveDescendants(root: Node): Iterable<Node> {
  yield root;
  for (const child of root.childNodes) {
    yield* lightTreeInclusiveDescendants(child);
  }
}

export function createDefinedCustomElement(
  document: Document,
  localName: string,
  prefix: string | null,
): CallbackResult<Element> | null {
  const definition = DOCUMENT_REGISTRIES.get(document)?.definition(localName);
  if (definition === null || definition === undefined) {
    return null;
  }
  const result = definition.construct(document, localName, prefix);
  if (result.type === "success") {
    CUSTOM_ELEMENT_DEFINITIONS.set(result.value, definition);
  }
  return result;
}

export function upgradeCustomElements(
  root: Node,
  registry: CustomElementRegistry,
  name?: string,
): void {
  for (const element of shadowIncludingInclusiveDescendantElements(root)) {
    const document = element.ownerDocument;
    if (
      document === null ||
      CUSTOM_ELEMENT_DEFINITIONS.has(element) ||
      FAILED_CUSTOM_ELEMENTS.has(element) ||
      customElementRegistryForNode(element) !== registry
    ) {
      continue;
    }
    const definition = registry.definition(element.localName);
    if (
      definition === null ||
      (name !== undefined && definition.name !== name)
    ) {
      continue;
    }
    const result = definition.construct(
      document,
      element.localName,
      element.prefix,
      element,
    );
    if (result.type === "success") {
      CUSTOM_ELEMENT_DEFINITIONS.set(element, definition);
    } else {
      FAILED_CUSTOM_ELEMENTS.add(element);
    }
  }
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

export function isValidCustomElementName(name: string): boolean {
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
