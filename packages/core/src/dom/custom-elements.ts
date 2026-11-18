import type { CallbackResult } from "../callback-result.js";
import { DOMException } from "../dom-exception.js";
import type { Node } from "./nodes.js";
import {
  Document,
  Element,
  shadowIncludingInclusiveDescendantElements,
  shadowIncludingInclusiveDescendantNodes,
  ShadowRoot,
} from "./nodes.js";

export interface CustomElementDefinition {
  readonly name: string;
  readonly localName: string;
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
  readonly reactionScheduler?: CustomElementReactionScheduler;
  readonly adoptedCallback?:
    | ((element: Element, oldDocument: Document, newDocument: Document) => void)
    | null;
  readonly formAssociated?: boolean;
  readonly formAssociatedCallback?:
    ((element: Element, form: Element | null) => void) | null;
  readonly disabledFeatures?: readonly string[];
  readonly observedAttributes: readonly string[];
  readonly attributeChangedCallback:
    | ((
        element: Element,
        localName: string,
        oldValue: string | null,
        newValue: string | null,
        namespace: string | null,
      ) => void)
    | null;
}

export type CustomElementReactionScheduler = (callback: () => void) => void;

const DOCUMENT_CUSTOM_ELEMENT_REGISTRY = new WeakMap<
  Document,
  CustomElementRegistry
>();
const NODE_CUSTOM_ELEMENT_REGISTRY = new WeakMap<
  Node,
  CustomElementRegistry | null
>();
const CUSTOM_ELEMENT_DEFINITIONS = new WeakMap<
  Element,
  CustomElementDefinition
>();
const CUSTOM_ELEMENTS = new WeakSet<Element>();
const CUSTOM_ELEMENT_IS_VALUES = new WeakMap<Element, string>();
const FAILED_CUSTOM_ELEMENTS = new WeakSet<Element>();
const UPGRADING_CUSTOM_ELEMENTS = new WeakSet<Element>();
const REACTION_QUEUES = new WeakMap<Element, (() => void)[]>();
const BACKUP_ELEMENT_QUEUES = new WeakMap<
  CustomElementReactionScheduler,
  Element[]
>();
const QUEUED_BACKUP_REACTIONS = new WeakSet<CustomElementReactionScheduler>();
const FORM_OWNERS = new WeakMap<Element, Element>();
const REACTIONS_STACK: Element[][] = [];
let formOwnerForCustomElement: (element: Element) => Element | null = () =>
  null;
export class CustomElementRegistry {
  readonly #definitions = new Map<string, CustomElementDefinition>();
  readonly #initializedRoots = new Set<Node>();
  readonly #associatedElements = new Set<Element>();

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

  definitionForElement(
    localName: string,
    isValue: string | null,
  ): CustomElementDefinition | null {
    const autonomousDefinition = this.#definitions.get(localName);
    if (autonomousDefinition?.localName === localName) {
      return autonomousDefinition;
    }
    if (isValue !== null) {
      const definition = this.#definitions.get(isValue);
      return definition?.localName === localName ? definition : null;
    }
    return null;
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

  associateElement(element: Element): void {
    this.#associatedElements.add(element);
  }

  associatedElements(): readonly Element[] {
    return [...this.#associatedElements];
  }
}

export function documentCustomElementRegistry(
  document: Document,
): CustomElementRegistry {
  let registry = DOCUMENT_CUSTOM_ELEMENT_REGISTRY.get(document);
  if (registry === undefined) {
    registry = new CustomElementRegistry(false);
    DOCUMENT_CUSTOM_ELEMENT_REGISTRY.set(document, registry);
  }
  return registry;
}

export function setDocumentCustomElementRegistry(
  document: Document,
  registry: CustomElementRegistry,
): void {
  DOCUMENT_CUSTOM_ELEMENT_REGISTRY.set(document, registry);
}

export function customElementRegistryForNode(
  node: Node,
): CustomElementRegistry | null {
  if (NODE_CUSTOM_ELEMENT_REGISTRY.has(node)) {
    return NODE_CUSTOM_ELEMENT_REGISTRY.get(node) ?? null;
  }
  if (node instanceof Document) {
    return DOCUMENT_CUSTOM_ELEMENT_REGISTRY.get(node) ?? null;
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
    return DOCUMENT_CUSTOM_ELEMENT_REGISTRY.get(node.ownerDocument) ?? null;
  }
  if (node instanceof ShadowRoot) {
    return customElementRegistryForNode(node.host);
  }
  return null;
}

export function customElementRegistryStateForNode(
  node: Node,
): CustomElementRegistry | null | undefined {
  if (node instanceof Document) {
    return DOCUMENT_CUSTOM_ELEMENT_REGISTRY.get(node);
  }
  return NODE_CUSTOM_ELEMENT_REGISTRY.get(node);
}

export function setCustomElementRegistryForNode(
  node: Node,
  registry: CustomElementRegistry | null,
): void {
  NODE_CUSTOM_ELEMENT_REGISTRY.set(node, registry);
  if (node instanceof Element && registry !== null) {
    registry.associateElement(node);
  }
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
  for (const node of shadowIncludingInclusiveDescendantNodes(root)) {
    if (
      (node instanceof Document ||
        node instanceof Element ||
        node instanceof ShadowRoot) &&
      customElementRegistryForNode(node) === null
    ) {
      if (node instanceof Document) {
        DOCUMENT_CUSTOM_ELEMENT_REGISTRY.set(node, registry);
      } else {
        NODE_CUSTOM_ELEMENT_REGISTRY.set(node, registry);
        if (node instanceof Element) {
          registry.associateElement(node);
        }
      }
    }
  }
}

export function createDefinedCustomElement(
  document: Document,
  localName: string,
  prefix: string | null,
  isValue: string | null = null,
  registry: CustomElementRegistry | null = DOCUMENT_CUSTOM_ELEMENT_REGISTRY.get(
    document,
  ) ?? null,
): CallbackResult<Element> | null {
  const definition = registry?.definitionForElement(localName, isValue);
  if (definition === null || definition === undefined) {
    return null;
  }
  const result = definition.construct(document, localName, prefix);
  if (result.type === "success") {
    CUSTOM_ELEMENT_DEFINITIONS.set(result.value, definition);
    CUSTOM_ELEMENTS.add(result.value);
    updateFormAssociatedCustomElement(result.value);
    if (isValue !== null) {
      CUSTOM_ELEMENT_IS_VALUES.set(result.value, isValue);
    }
  }
  return result;
}

export function setCustomElementIsValue(
  element: Element,
  isValue: string,
): void {
  CUSTOM_ELEMENT_IS_VALUES.set(element, isValue);
}

export function customElementIsValue(element: Element): string | null {
  return CUSTOM_ELEMENT_IS_VALUES.get(element) ?? null;
}

export function setCustomElementDefinition(
  element: Element,
  definition: CustomElementDefinition,
): void {
  CUSTOM_ELEMENT_DEFINITIONS.set(element, definition);
  if (definition.localName !== definition.name) {
    CUSTOM_ELEMENT_IS_VALUES.set(element, definition.name);
  }
}

export function customElementDefinitionForElement(
  element: Element,
): CustomElementDefinition | null {
  return CUSTOM_ELEMENT_DEFINITIONS.get(element) ?? null;
}

export function customElementConstructionFailed(element: Element): boolean {
  return FAILED_CUSTOM_ELEMENTS.has(element);
}

export function setFailedCustomElement(element: Element): void {
  FAILED_CUSTOM_ELEMENTS.add(element);
}

export function upgradeCustomElements(
  root: Node,
  registry: CustomElementRegistry,
  name?: string,
  enqueueConnected = true,
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
    const definition = registry.definitionForElement(
      element.localName,
      CUSTOM_ELEMENT_IS_VALUES.get(element) ?? null,
    );
    if (
      definition === null ||
      (name !== undefined && definition.name !== name)
    ) {
      continue;
    }
    runCustomElementReactions(() => {
      CUSTOM_ELEMENT_DEFINITIONS.set(element, definition);
      for (const attribute of element.attributes) {
        enqueueCustomElementAttributeChangedReaction(
          element,
          attribute.localName,
          null,
          attribute.value,
          attribute.namespaceURI,
        );
      }
      if (enqueueConnected && element.isConnected) {
        enqueueCustomElementConnectedReaction(element);
      }
      UPGRADING_CUSTOM_ELEMENTS.add(element);
      let result: CallbackResult<Element>;
      try {
        result = definition.construct(
          document,
          element.localName,
          element.prefix,
          element,
        );
      } finally {
        UPGRADING_CUSTOM_ELEMENTS.delete(element);
      }
      if (result.type === "success") {
        CUSTOM_ELEMENTS.add(element);
        updateFormAssociatedCustomElement(element);
      } else {
        CUSTOM_ELEMENT_DEFINITIONS.delete(element);
        REACTION_QUEUES.delete(element);
        FAILED_CUSTOM_ELEMENTS.add(element);
      }
    });
  }
}

export function enqueueCustomElementAttributeChangedReaction(
  element: Element,
  localName: string,
  oldValue: string | null,
  newValue: string | null,
  namespace: string | null,
): void {
  if (UPGRADING_CUSTOM_ELEMENTS.has(element)) {
    return;
  }
  if (localName === "form") {
    updateFormAssociatedCustomElement(element);
  } else if (localName === "id" && element.ownerDocument !== null) {
    updateFormAssociatedCustomElements(element.ownerDocument);
  }
  const definition = CUSTOM_ELEMENT_DEFINITIONS.get(element);
  if (
    definition?.attributeChangedCallback === null ||
    definition?.attributeChangedCallback === undefined ||
    !definition.observedAttributes.includes(localName)
  ) {
    return;
  }
  enqueueReaction(element, () => {
    definition.attributeChangedCallback?.(
      element,
      localName,
      oldValue,
      newValue,
      namespace,
    );
  });
}

export function enqueueCustomElementConnectedReaction(element: Element): void {
  if (UPGRADING_CUSTOM_ELEMENTS.has(element)) {
    return;
  }
  updateFormAssociatedCustomElement(element);
  const callback = CUSTOM_ELEMENT_DEFINITIONS.get(element)?.connectedCallback;
  if (callback !== null && callback !== undefined) {
    enqueueReaction(element, () => {
      callback(element);
    });
  }
}

export function enqueueCustomElementDisconnectedReaction(
  element: Element,
): void {
  if (UPGRADING_CUSTOM_ELEMENTS.has(element)) {
    return;
  }
  updateFormAssociatedCustomElement(element);
  const callback =
    CUSTOM_ELEMENT_DEFINITIONS.get(element)?.disconnectedCallback;
  if (callback !== null && callback !== undefined) {
    enqueueReaction(element, () => {
      callback(element);
    });
  }
}

export function enqueueCustomElementAdoptedReaction(
  element: Element,
  oldDocument: Document,
  newDocument: Document,
): void {
  if (UPGRADING_CUSTOM_ELEMENTS.has(element)) {
    return;
  }
  const callback = CUSTOM_ELEMENT_DEFINITIONS.get(element)?.adoptedCallback;
  if (callback !== null && callback !== undefined) {
    enqueueReaction(element, () => {
      callback(element, oldDocument, newDocument);
    });
  }
}

export function setFormAssociatedCustomElementOwnerProvider(
  provider: (element: Element) => Element | null,
): void {
  formOwnerForCustomElement = provider;
}

export function isFormAssociatedCustomElement(element: Element): boolean {
  return (
    CUSTOM_ELEMENTS.has(element) &&
    CUSTOM_ELEMENT_DEFINITIONS.get(element)?.formAssociated === true
  );
}

export function formAssociatedCustomElementOwner(
  element: Element,
): Element | null {
  return FORM_OWNERS.get(element) ?? null;
}

export function updateFormAssociatedCustomElements(root: Node): void {
  for (const element of shadowIncludingInclusiveDescendantElements(root)) {
    updateFormAssociatedCustomElement(element);
  }
}

function updateFormAssociatedCustomElement(element: Element): void {
  const definition = CUSTOM_ELEMENT_DEFINITIONS.get(element);
  if (!CUSTOM_ELEMENTS.has(element) || definition?.formAssociated !== true) {
    return;
  }
  const previous = FORM_OWNERS.get(element) ?? null;
  const current = formOwnerForCustomElement(element);
  if (previous === current) {
    return;
  }
  if (current === null) {
    FORM_OWNERS.delete(element);
  } else {
    FORM_OWNERS.set(element, current);
  }
  if (definition.formAssociatedCallback != null) {
    enqueueReaction(element, () => {
      definition.formAssociatedCallback?.(element, current);
    });
  }
}

export function enqueueCustomElementMoveReaction(element: Element): void {
  const definition = CUSTOM_ELEMENT_DEFINITIONS.get(element);
  if (definition === undefined) {
    return;
  }
  if (definition.connectedMoveCallback !== null) {
    enqueueReaction(element, () => definition.connectedMoveCallback?.(element));
    return;
  }
  if (definition.disconnectedCallback !== null) {
    enqueueReaction(element, () => definition.disconnectedCallback?.(element));
  }
  if (definition.connectedCallback !== null) {
    enqueueReaction(element, () => definition.connectedCallback?.(element));
  }
}

function enqueueReaction(element: Element, reaction: () => void): void {
  const reactions = reactionQueue(element);
  reactions.push(reaction);
  const queue = REACTIONS_STACK.at(-1);
  if (queue === undefined) {
    const scheduler =
      CUSTOM_ELEMENT_DEFINITIONS.get(element)?.reactionScheduler;
    if (scheduler === undefined) {
      invokeReactions([element]);
      return;
    }
    const backupQueue = backupElementQueue(scheduler);
    if (!backupQueue.includes(element)) {
      backupQueue.push(element);
    }
    queueBackupReactions(scheduler, backupQueue);
    return;
  }
  if (!queue.includes(element)) {
    queue.push(element);
  }
}

function backupElementQueue(
  scheduler: CustomElementReactionScheduler,
): Element[] {
  const existing = BACKUP_ELEMENT_QUEUES.get(scheduler);
  if (existing !== undefined) {
    return existing;
  }
  const created: Element[] = [];
  BACKUP_ELEMENT_QUEUES.set(scheduler, created);
  return created;
}

function queueBackupReactions(
  scheduler: CustomElementReactionScheduler,
  queue: Element[],
): void {
  if (QUEUED_BACKUP_REACTIONS.has(scheduler)) {
    return;
  }
  QUEUED_BACKUP_REACTIONS.add(scheduler);
  scheduler(() => {
    QUEUED_BACKUP_REACTIONS.delete(scheduler);
    REACTIONS_STACK.push(queue);
    try {
      invokeReactions(queue);
    } finally {
      REACTIONS_STACK.pop();
    }
  });
}

function reactionQueue(element: Element): (() => void)[] {
  const existing = REACTION_QUEUES.get(element);
  if (existing !== undefined) {
    return existing;
  }
  const created: (() => void)[] = [];
  REACTION_QUEUES.set(element, created);
  return created;
}

function invokeReactions(queue: Element[]): void {
  while (queue.length > 0) {
    const element = queue.shift();
    if (element === undefined) {
      continue;
    }
    const reactions = REACTION_QUEUES.get(element);
    if (reactions === undefined) {
      continue;
    }
    while (reactions.length > 0) {
      reactions.shift()?.();
    }
    REACTION_QUEUES.delete(element);
  }
}

export function runCustomElementReactions<T>(callback: () => T): T {
  const queue: Element[] = [];
  REACTIONS_STACK.push(queue);
  try {
    return callback();
  } finally {
    try {
      invokeReactions(queue);
    } finally {
      REACTIONS_STACK.pop();
    }
  }
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
