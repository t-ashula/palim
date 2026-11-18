import type {
  CustomElementDefinition,
  DOMParser,
  HTMLParsingOptions,
  MutationObserverMicrotaskScheduler,
  NodeIterator,
  Range,
  Sanitizer,
  SanitizerAttribute,
  SanitizerConfig,
  SanitizerElement,
  SanitizerElementInput,
  SanitizerPI,
  Selection,
  StaticRange,
  TraversalFilterCallback,
  TraversalResult,
  TreeWalker,
} from "@palim/core";
import {
  AbortController,
  AbortSignal,
  Attr,
  callbackFailure,
  callbackSuccess,
  CDATASection,
  CharacterData,
  Comment,
  createHTMLElement,
  createNodeIterator,
  createTreeWalker,
  CSSConditionRule,
  CSSGroupingRule,
  CSSMediaRule,
  CSSRule,
  CSSRuleList,
  CSSStyleDeclaration,
  CSSStyleProperties,
  CSSStyleRule,
  CSSStyleSheet,
  CustomElementRegistry,
  customElementRegistryForNode,
  CustomEvent,
  dispatchEvent as dispatchDOMEvent,
  Document,
  documentCustomElementRegistry,
  DocumentFragment,
  DocumentImplementation,
  documentImplementation,
  documentNamedItem,
  documentNamedPropertyNames,
  DocumentType,
  DOMException as HostDOMException,
  domExceptionCode,
  DOMImplementation,
  DOMRect,
  DOMRectList,
  DOMRectReadOnly,
  DOMStringMap,
  DOMTokenList,
  Element,
  ElementInternals,
  ErrorEvent,
  Event,
  EventTarget,
  FocusEvent,
  HTMLAnchorElement,
  HTMLAreaElement,
  HTMLButtonElement,
  HTMLCollection,
  htmlCollectionSupportedPropertyNames,
  HTMLElement,
  HTMLIFrameElement,
  HTMLLinkElement,
  HTMLOutputElement,
  HTMLTableElement,
  HTMLTableRowElement,
  HTMLTableSectionElement,
  HTMLTemplateElement,
  implementationFor,
  interfaceFor,
  isForeignAnchorElement,
  isNodeIterator,
  isRange,
  isSelection,
  isStaticRange,
  isTreeWalker,
  MediaList,
  MessageEvent,
  MouseEvent,
  MutationObserver,
  MutationRecord,
  NamedNodeMap,
  namedNodeMapSupportedPropertyNames,
  Node,
  NodeFilter,
  nodeImplementation,
  NodeList,
  ProcessingInstruction,
  PromiseRejectionEvent,
  runCustomElementReactions,
  setCustomElementDefinition,
  ShadowRoot,
  StyleSheetList,
  Text,
  toLong,
  traversalAbrupt,
  traversalNormal,
  upgradeCustomElements,
  XMLDocument,
} from "@palim/core";

import type {
  EngineCallable,
  EngineHostFunction,
  EngineObject,
  EngineRealm,
  EngineResult,
  EngineValue,
  JavaScriptEngineAdapter,
} from "./adapter.js";
import { normal, thrown } from "./adapter.js";
import type { RealmExceptionReporter } from "./dom-realm-binding.js";
import type { DOMLegacyPlatformObjectConfiguration } from "./dom-realm-legacy-platform-object.js";
import { createDOMLegacyPlatformObject } from "./dom-realm-legacy-platform-object.js";
import type { HTMLElementInterfaceConstructor } from "./html-element-interface-constructors.js";
import { htmlElementInterfaceConstructors } from "./html-element-interface-constructors.js";
import type { RealmBindingContext } from "./realm-binding-context.js";
import type { CallbackRecord } from "./realm-execution-runtime.js";

const DATA_PROPERTY = {
  configurable: true,
  enumerable: true,
  writable: true,
} as const;

interface TraversalFilterArgument {
  readonly callback: TraversalFilterCallback | null;
  readonly value: EngineValue | null;
}

interface DOMExceptionState {
  readonly message: string;
  readonly name: string;
  readonly code: number;
}

type ParentNodeObject = Document | DocumentFragment | Element;
type ChildNodeObject = DocumentType | Element | CharacterData;

const documentRealmBindingsByEngine = new WeakMap<
  JavaScriptEngineAdapter,
  WeakMap<DocumentImplementation, DOMRealmBindingContext>
>();
const realmBindingsByEngine = new WeakMap<
  JavaScriptEngineAdapter,
  WeakMap<EngineRealm, DOMRealmBindingContext>
>();
const sharedImplementationsByEngine = new WeakMap<
  JavaScriptEngineAdapter,
  WeakMap<EngineObject, object>
>();
const sharedPlatformObjectsByEngine = new WeakMap<
  JavaScriptEngineAdapter,
  WeakMap<object, EngineObject>
>();
const sharedCustomElementRegistriesByEngine = new WeakMap<
  JavaScriptEngineAdapter,
  WeakMap<EngineObject, CustomElementRegistry>
>();
const sharedCustomElementRegistryObjectsByEngine = new WeakMap<
  JavaScriptEngineAdapter,
  WeakMap<CustomElementRegistry, EngineObject>
>();

function documentRealmBindings(
  engine: JavaScriptEngineAdapter,
): WeakMap<DocumentImplementation, DOMRealmBindingContext> {
  const existing = documentRealmBindingsByEngine.get(engine);
  if (existing !== undefined) {
    return existing;
  }
  const bindings = new WeakMap<
    DocumentImplementation,
    DOMRealmBindingContext
  >();
  documentRealmBindingsByEngine.set(engine, bindings);
  return bindings;
}

function realmBindings(
  engine: JavaScriptEngineAdapter,
): WeakMap<EngineRealm, DOMRealmBindingContext> {
  const existing = realmBindingsByEngine.get(engine);
  if (existing !== undefined) {
    return existing;
  }
  const bindings = new WeakMap<EngineRealm, DOMRealmBindingContext>();
  realmBindingsByEngine.set(engine, bindings);
  return bindings;
}

function sharedImplementations(
  engine: JavaScriptEngineAdapter,
): WeakMap<EngineObject, object> {
  const existing = sharedImplementationsByEngine.get(engine);
  if (existing !== undefined) {
    return existing;
  }
  const implementations = new WeakMap<EngineObject, object>();
  sharedImplementationsByEngine.set(engine, implementations);
  return implementations;
}

function sharedPlatformObjects(
  engine: JavaScriptEngineAdapter,
): WeakMap<object, EngineObject> {
  const existing = sharedPlatformObjectsByEngine.get(engine);
  if (existing !== undefined) {
    return existing;
  }
  const platformObjects = new WeakMap<object, EngineObject>();
  sharedPlatformObjectsByEngine.set(engine, platformObjects);
  return platformObjects;
}

function sharedCustomElementRegistries(
  engine: JavaScriptEngineAdapter,
): WeakMap<EngineObject, CustomElementRegistry> {
  const existing = sharedCustomElementRegistriesByEngine.get(engine);
  if (existing !== undefined) {
    return existing;
  }
  const registries = new WeakMap<EngineObject, CustomElementRegistry>();
  sharedCustomElementRegistriesByEngine.set(engine, registries);
  return registries;
}

function sharedCustomElementRegistryObjects(
  engine: JavaScriptEngineAdapter,
): WeakMap<CustomElementRegistry, EngineObject> {
  const existing = sharedCustomElementRegistryObjectsByEngine.get(engine);
  if (existing !== undefined) {
    return existing;
  }
  const objects = new WeakMap<CustomElementRegistry, EngineObject>();
  sharedCustomElementRegistryObjectsByEngine.set(engine, objects);
  return objects;
}

export class DOMRealmBindingContext {
  readonly engine: JavaScriptEngineAdapter;
  readonly realm: EngineRealm;
  readonly context: RealmBindingContext;
  readonly platformObjects = new WeakMap<object, EngineObject>();
  readonly implementations = new WeakMap<EngineObject, object>();
  readonly customEventDetails = new WeakMap<CustomEvent, EngineValue>();
  readonly mouseEventViews = new WeakMap<MouseEvent, EngineValue>();
  readonly abortSignalReasons = new WeakMap<AbortSignal, EngineValue>();
  readonly errorEventErrors = new WeakMap<ErrorEvent, EngineValue>();
  readonly promiseRejectionEventPromises = new WeakMap<
    PromiseRejectionEvent,
    EngineObject
  >();
  readonly promiseRejectionEventReasons = new WeakMap<
    PromiseRejectionEvent,
    EngineValue
  >();
  readonly messageEventData = new WeakMap<MessageEvent, EngineValue>();
  readonly listeners = new WeakMap<
    EventTarget,
    Map<EngineObject, (event: Event) => void>
  >();
  readonly eventHandlers = new WeakMap<EventTarget, (event: Event) => void>();
  mutationObserverMicrotaskScheduler: MutationObserverMicrotaskScheduler = (
    callback,
  ) => {
    void Promise.resolve().then(callback);
  };
  readonly mutationObserverScheduler: MutationObserverMicrotaskScheduler = (
    callback,
  ) => {
    this.mutationObserverMicrotaskScheduler(callback);
  };
  readonly eventTargetPrototype: EngineObject;
  readonly abortSignalPrototype: EngineObject;
  readonly abortControllerPrototype: EngineObject;
  readonly nodePrototype: EngineObject;
  readonly characterDataPrototype: EngineObject;
  readonly textPrototype: EngineObject;
  readonly cdataSectionPrototype: EngineObject;
  readonly commentPrototype: EngineObject;
  readonly processingInstructionPrototype: EngineObject;
  readonly attrPrototype: EngineObject;
  readonly elementPrototype: EngineObject;
  readonly foreignAnchorPrototype: EngineObject;
  readonly htmlElementPrototype: EngineObject;
  readonly htmlElementInterfacePrototypes = new Map<
    HTMLElementInterfaceConstructor,
    EngineObject
  >();
  readonly htmlAnchorElementPrototype: EngineObject;
  readonly htmlAreaElementPrototype: EngineObject;
  readonly htmlButtonElementPrototype: EngineObject;
  readonly htmlIFrameElementPrototype: EngineObject;
  readonly htmlLinkElementPrototype: EngineObject;
  readonly htmlOutputElementPrototype: EngineObject;
  readonly htmlTableElementPrototype: EngineObject;
  readonly htmlTableRowElementPrototype: EngineObject;
  readonly htmlTableSectionElementPrototype: EngineObject;
  readonly htmlTemplateElementPrototype: EngineObject;
  readonly documentPrototype: EngineObject;
  readonly documentFragmentPrototype: EngineObject;
  readonly shadowRootPrototype: EngineObject;
  readonly documentTypePrototype: EngineObject;
  readonly domImplementationPrototype: EngineObject;
  readonly domParserPrototype: EngineObject;
  readonly xmlSerializerPrototype: EngineObject;
  readonly sanitizerPrototype: EngineObject;
  readonly elementInternalsPrototype: EngineObject;
  readonly writableStreamPrototype: EngineObject;
  readonly writableStreamDefaultWriterPrototype: EngineObject;
  readonly xmlDocumentPrototype: EngineObject;
  readonly eventPrototype: EngineObject;
  readonly focusEventPrototype: EngineObject;
  readonly mouseEventPrototype: EngineObject;
  readonly errorEventPrototype: EngineObject;
  readonly promiseRejectionEventPrototype: EngineObject;
  readonly messageEventPrototype: EngineObject;
  readonly customEventPrototype: EngineObject;
  readonly htmlCollectionPrototype: EngineObject;
  readonly namedNodeMapPrototype: EngineObject;
  readonly nodeListPrototype: EngineObject;
  readonly domTokenListPrototype: EngineObject;
  readonly domRectReadOnlyPrototype: EngineObject;
  readonly domRectPrototype: EngineObject;
  readonly domRectListPrototype: EngineObject;
  readonly domExceptionPrototype: EngineObject;
  readonly mutationObserverPrototype: EngineObject;
  readonly mutationRecordPrototype: EngineObject;
  readonly customElementRegistryPrototype: EngineObject;
  readonly customElementRegistryObject: EngineObject;
  readonly abstractRangePrototype: EngineObject;
  readonly rangePrototype: EngineObject;
  readonly selectionPrototype: EngineObject;
  readonly staticRangePrototype: EngineObject;
  readonly nodeIteratorPrototype: EngineObject;
  readonly treeWalkerPrototype: EngineObject;
  readonly domStringMapPrototype: EngineObject;
  readonly cssStyleDeclarationPrototype: EngineObject;
  readonly cssStylePropertiesPrototype: EngineObject;
  readonly cssRulePrototype: EngineObject;
  readonly cssGroupingRulePrototype: EngineObject;
  readonly cssConditionRulePrototype: EngineObject;
  readonly cssMediaRulePrototype: EngineObject;
  readonly cssStyleRulePrototype: EngineObject;
  readonly cssRuleListPrototype: EngineObject;
  readonly cssStyleSheetPrototype: EngineObject;
  readonly mediaListPrototype: EngineObject;
  readonly styleSheetListPrototype: EngineObject;
  readonly traversalFilters = new WeakMap<object, EngineValue>();
  readonly domParsers = new WeakMap<EngineObject, DOMParser>();
  readonly xmlSerializers = new WeakSet<EngineObject>();
  private readonly sanitizers = new WeakMap<EngineObject, Sanitizer>();
  readonly domExceptions = new WeakMap<EngineObject, DOMExceptionState>();
  readonly customElementRegistry: CustomElementRegistry;
  readonly customElementRegistries = new WeakMap<
    EngineObject,
    CustomElementRegistry
  >();
  readonly customElementRegistryObjects = new WeakMap<
    CustomElementRegistry,
    EngineObject
  >();
  private readonly customElementConstructionStacks = new WeakMap<
    object,
    {
      definition: CustomElementDefinition;
      element: Element | null;
      reentryFailed: boolean;
    }[]
  >();
  readonly traversalAbruptValues = new WeakMap<object, EngineValue>();

  constructor(
    context: RealmBindingContext,
    readonly associatedDocument: Document | null = null,
    readonly reportException: RealmExceptionReporter = () => undefined,
  ) {
    this.engine = context.engine;
    this.realm = context.realm;
    this.context = context;
    realmBindings(this.engine).set(this.realm, this);
    this.customElementRegistry =
      associatedDocument === null
        ? new CustomElementRegistry()
        : documentCustomElementRegistry(associatedDocument);

    const objectPrototype = this.engine.objectPrototype(this.realm);
    this.eventTargetPrototype = this.engine.createObject(
      this.realm,
      objectPrototype,
    );
    this.abortSignalPrototype = this.engine.createObject(
      this.realm,
      this.eventTargetPrototype,
    );
    this.abortControllerPrototype = this.engine.createObject(
      this.realm,
      objectPrototype,
    );
    this.nodePrototype = this.engine.createObject(
      this.realm,
      this.eventTargetPrototype,
    );
    this.characterDataPrototype = this.engine.createObject(
      this.realm,
      this.nodePrototype,
    );
    this.textPrototype = this.engine.createObject(
      this.realm,
      this.characterDataPrototype,
    );
    this.cdataSectionPrototype = this.engine.createObject(
      this.realm,
      this.textPrototype,
    );
    this.commentPrototype = this.engine.createObject(
      this.realm,
      this.characterDataPrototype,
    );
    this.processingInstructionPrototype = this.engine.createObject(
      this.realm,
      this.characterDataPrototype,
    );
    this.attrPrototype = this.engine.createObject(
      this.realm,
      this.nodePrototype,
    );
    this.elementPrototype = this.engine.createObject(
      this.realm,
      this.nodePrototype,
    );
    this.domRectReadOnlyPrototype = this.engine.createObject(
      this.realm,
      objectPrototype,
    );
    this.domRectPrototype = this.engine.createObject(
      this.realm,
      this.domRectReadOnlyPrototype,
    );
    this.domRectListPrototype = this.engine.createObject(
      this.realm,
      objectPrototype,
    );
    this.foreignAnchorPrototype = this.engine.createObject(
      this.realm,
      this.elementPrototype,
    );
    this.htmlElementPrototype = this.engine.createObject(
      this.realm,
      this.elementPrototype,
    );
    for (const interfaceConstructor of htmlElementInterfaceConstructors) {
      const parentConstructor = Object.getPrototypeOf(
        interfaceConstructor,
      ) as HTMLElementInterfaceConstructor;
      const parentPrototype =
        parentConstructor === HTMLElement
          ? this.htmlElementPrototype
          : this.htmlElementInterfacePrototypes.get(parentConstructor);
      if (parentPrototype === undefined) {
        throw new TypeError(
          `${interfaceConstructor.name} must be registered after ${parentConstructor.name}`,
        );
      }
      this.htmlElementInterfacePrototypes.set(
        interfaceConstructor,
        this.engine.createObject(this.realm, parentPrototype),
      );
    }
    this.htmlAnchorElementPrototype =
      this.htmlElementInterfacePrototype(HTMLAnchorElement);
    this.htmlAreaElementPrototype =
      this.htmlElementInterfacePrototype(HTMLAreaElement);
    this.htmlButtonElementPrototype =
      this.htmlElementInterfacePrototype(HTMLButtonElement);
    this.htmlIFrameElementPrototype =
      this.htmlElementInterfacePrototype(HTMLIFrameElement);
    this.htmlLinkElementPrototype =
      this.htmlElementInterfacePrototype(HTMLLinkElement);
    this.htmlOutputElementPrototype =
      this.htmlElementInterfacePrototype(HTMLOutputElement);
    this.htmlTableElementPrototype =
      this.htmlElementInterfacePrototype(HTMLTableElement);
    this.htmlTableRowElementPrototype =
      this.htmlElementInterfacePrototype(HTMLTableRowElement);
    this.htmlTableSectionElementPrototype = this.htmlElementInterfacePrototype(
      HTMLTableSectionElement,
    );
    this.htmlTemplateElementPrototype =
      this.htmlElementInterfacePrototype(HTMLTemplateElement);
    this.documentPrototype = this.engine.createObject(
      this.realm,
      this.nodePrototype,
    );
    this.documentFragmentPrototype = this.engine.createObject(
      this.realm,
      this.nodePrototype,
    );
    this.shadowRootPrototype = this.engine.createObject(
      this.realm,
      this.documentFragmentPrototype,
    );
    this.documentTypePrototype = this.engine.createObject(
      this.realm,
      this.nodePrototype,
    );
    this.domImplementationPrototype = this.engine.createObject(
      this.realm,
      objectPrototype,
    );
    this.domParserPrototype = this.engine.createObject(
      this.realm,
      objectPrototype,
    );
    this.xmlSerializerPrototype = this.engine.createObject(
      this.realm,
      objectPrototype,
    );
    this.sanitizerPrototype = this.engine.createObject(
      this.realm,
      objectPrototype,
    );
    this.elementInternalsPrototype = this.engine.createObject(
      this.realm,
      objectPrototype,
    );
    this.writableStreamPrototype = this.engine.createObject(
      this.realm,
      objectPrototype,
    );
    this.writableStreamDefaultWriterPrototype = this.engine.createObject(
      this.realm,
      objectPrototype,
    );
    this.xmlDocumentPrototype = this.engine.createObject(
      this.realm,
      this.documentPrototype,
    );
    this.eventPrototype = this.engine.createObject(this.realm, objectPrototype);
    this.focusEventPrototype = this.engine.createObject(
      this.realm,
      this.eventPrototype,
    );
    this.mouseEventPrototype = this.engine.createObject(
      this.realm,
      this.eventPrototype,
    );
    this.errorEventPrototype = this.engine.createObject(
      this.realm,
      this.eventPrototype,
    );
    this.promiseRejectionEventPrototype = this.engine.createObject(
      this.realm,
      this.eventPrototype,
    );
    this.messageEventPrototype = this.engine.createObject(
      this.realm,
      this.eventPrototype,
    );
    this.customEventPrototype = this.engine.createObject(
      this.realm,
      this.eventPrototype,
    );
    this.htmlCollectionPrototype = this.engine.createObject(
      this.realm,
      objectPrototype,
    );
    this.namedNodeMapPrototype = this.engine.createObject(
      this.realm,
      objectPrototype,
    );
    this.nodeListPrototype = this.engine.createObject(
      this.realm,
      objectPrototype,
    );
    this.domTokenListPrototype = this.engine.createObject(
      this.realm,
      objectPrototype,
    );
    this.domExceptionPrototype = this.engine.createObject(
      this.realm,
      objectPrototype,
    );
    this.mutationObserverPrototype = this.engine.createObject(
      this.realm,
      objectPrototype,
    );
    this.mutationRecordPrototype = this.engine.createObject(
      this.realm,
      objectPrototype,
    );
    this.customElementRegistryPrototype = this.engine.createObject(
      this.realm,
      objectPrototype,
    );
    this.customElementRegistryObject = this.engine.createObject(
      this.realm,
      this.customElementRegistryPrototype,
    );
    this.customElementRegistries.set(
      this.customElementRegistryObject,
      this.customElementRegistry,
    );
    this.customElementRegistryObjects.set(
      this.customElementRegistry,
      this.customElementRegistryObject,
    );
    sharedCustomElementRegistries(this.engine).set(
      this.customElementRegistryObject,
      this.customElementRegistry,
    );
    sharedCustomElementRegistryObjects(this.engine).set(
      this.customElementRegistry,
      this.customElementRegistryObject,
    );
    this.abstractRangePrototype = this.engine.createObject(
      this.realm,
      objectPrototype,
    );
    this.rangePrototype = this.engine.createObject(
      this.realm,
      this.abstractRangePrototype,
    );
    this.selectionPrototype = this.engine.createObject(
      this.realm,
      objectPrototype,
    );
    this.staticRangePrototype = this.engine.createObject(
      this.realm,
      this.abstractRangePrototype,
    );
    this.nodeIteratorPrototype = this.engine.createObject(
      this.realm,
      objectPrototype,
    );
    this.treeWalkerPrototype = this.engine.createObject(
      this.realm,
      objectPrototype,
    );
    this.domStringMapPrototype = this.engine.createObject(
      this.realm,
      objectPrototype,
    );
    this.cssStyleDeclarationPrototype = this.engine.createObject(
      this.realm,
      objectPrototype,
    );
    this.cssStylePropertiesPrototype = this.engine.createObject(
      this.realm,
      this.cssStyleDeclarationPrototype,
    );
    this.cssRulePrototype = this.engine.createObject(
      this.realm,
      objectPrototype,
    );
    this.cssGroupingRulePrototype = this.engine.createObject(
      this.realm,
      this.cssRulePrototype,
    );
    this.cssConditionRulePrototype = this.engine.createObject(
      this.realm,
      this.cssGroupingRulePrototype,
    );
    this.cssMediaRulePrototype = this.engine.createObject(
      this.realm,
      this.cssConditionRulePrototype,
    );
    this.cssStyleRulePrototype = this.engine.createObject(
      this.realm,
      this.cssRulePrototype,
    );
    this.cssRuleListPrototype = this.engine.createObject(
      this.realm,
      objectPrototype,
    );
    this.cssStyleSheetPrototype = this.engine.createObject(
      this.realm,
      objectPrototype,
    );
    this.mediaListPrototype = this.engine.createObject(
      this.realm,
      objectPrototype,
    );
    this.styleSheetListPrototype = this.engine.createObject(
      this.realm,
      objectPrototype,
    );

    if (associatedDocument !== null) {
      const implementation = documentImplementation(associatedDocument);
      const bindings = documentRealmBindings(this.engine);
      if (!bindings.has(implementation.relevantRealmDocument)) {
        bindings.set(implementation.relevantRealmDocument, this);
      }
    }
  }

  expose(name: string, interfaceObject: object): void {
    this.engine.initializeDataProperty(
      this.engine.globalObject(this.realm),
      name,
      this.wrap(interfaceObject),
      DATA_PROPERTY,
    );
  }

  constructHTMLElement(
    activeInterface: typeof HTMLElement | HTMLElementInterfaceConstructor,
    activeFunction: EngineCallable,
    newTarget: EngineCallable,
  ): EngineResult<EngineValue> {
    if (newTarget === activeFunction) {
      return this.typeError("Illegal constructor");
    }
    const stack = this.customElementConstructionStacks.get(newTarget);
    const entry = stack?.at(-1);
    const definition =
      entry?.definition ??
      this.customElementRegistry.definitionForConstructor(newTarget);
    if (definition === null) {
      return this.typeError("Illegal constructor");
    }
    if (definition.localName === definition.name) {
      if (activeInterface !== HTMLElement) {
        return this.typeError("Illegal constructor");
      }
    } else {
      const expected = createHTMLElement(
        this.associatedDocument ?? new Document(),
        definition.localName,
        null,
      );
      if (expected.constructor !== activeInterface) {
        return this.typeError("Illegal constructor");
      }
    }
    const prototypeValue = this.engine.get(this.realm, newTarget, "prototype");
    if (prototypeValue.type === "throw") {
      return prototypeValue;
    }
    let prototype = this.engine.asObject(prototypeValue.value);
    if (prototype === null) {
      const callableRealm = this.engine.callableRealm(this.realm, newTarget);
      if (callableRealm.type === "throw") {
        return callableRealm;
      }
      const binding = realmBindings(this.engine).get(callableRealm.value);
      if (binding === undefined) {
        return this.typeError("NewTarget realm has no DOM interfaces");
      }
      prototype =
        activeInterface === HTMLElement
          ? binding.htmlElementPrototype
          : binding.htmlElementInterfacePrototype(activeInterface);
    }
    if (entry?.element === null) {
      entry.reentryFailed = true;
      return this.typeError("Custom element is already constructed");
    }
    const element =
      entry?.element ??
      createHTMLElement(
        this.associatedDocument ?? new Document(),
        definition.localName,
        null,
      );
    setCustomElementDefinition(element, definition);
    const platformObject = this.wrap(element);
    const prototypeResult = this.engine.setPrototypeOf(
      this.realm,
      platformObject,
      prototype,
    );
    if (prototypeResult.type === "throw") {
      return prototypeResult;
    }
    if (!prototypeResult.value) {
      return this.typeError("Custom element prototype was rejected");
    }
    if (stack !== undefined && entry !== undefined) {
      entry.element = null;
    }
    return normal(platformObject);
  }

  defineCustomElement(
    registry: CustomElementRegistry,
    name: string,
    localName: string,
    constructor: EngineCallable,
  ): EngineResult<EngineValue> {
    const prototypeValue = this.engine.get(
      this.realm,
      constructor,
      "prototype",
    );
    if (prototypeValue.type === "throw") {
      return prototypeValue;
    }
    const prototype = this.engine.asObject(prototypeValue.value);
    if (prototype === null) {
      return this.typeError("Custom element constructor has no prototype");
    }
    const constructorRecord = this.context.runtime.createCallbackRecord(
      this.realm,
      constructor,
    );
    if (constructorRecord.type === "throw") {
      return constructorRecord;
    }
    const callback = (
      callbackName:
        | "connectedCallback"
        | "disconnectedCallback"
        | "connectedMoveCallback"
        | "adoptedCallback"
        | "attributeChangedCallback"
        | "formAssociatedCallback"
        | "formResetCallback"
        | "formDisabledCallback"
        | "formStateRestoreCallback",
    ): EngineResult<((element: Element) => void) | null> => {
      const value = this.engine.get(this.realm, prototype, callbackName);
      if (value.type === "throw") {
        return value;
      }
      if (this.engine.isUndefined(value.value)) {
        return normal(null);
      }
      const callable = this.engine.asCallable(value.value);
      if (callable === null) {
        return thrown(
          this.engine.createTypeError(
            this.realm,
            `${callbackName} is not callable`,
          ),
        );
      }
      const record = this.reportingCallback(callable);
      if (record.type === "throw") {
        return record;
      }
      return normal((element) => {
        this.context.invokeCallback(record.value, this.wrap(element), []);
      });
    };
    const connectedCallback = callback("connectedCallback");
    if (connectedCallback.type === "throw") {
      return connectedCallback;
    }
    const disconnectedCallback = callback("disconnectedCallback");
    if (disconnectedCallback.type === "throw") {
      return disconnectedCallback;
    }
    const connectedMoveCallback = callback("connectedMoveCallback");
    if (connectedMoveCallback.type === "throw") {
      return connectedMoveCallback;
    }
    const adoptedCallbackValue = this.engine.get(
      this.realm,
      prototype,
      "adoptedCallback",
    );
    if (adoptedCallbackValue.type === "throw") {
      return adoptedCallbackValue;
    }
    let adoptedCallback:
      | ((
          element: Element,
          oldDocument: Document,
          newDocument: Document,
        ) => void)
      | null = null;
    if (!this.engine.isUndefined(adoptedCallbackValue.value)) {
      const callable = this.engine.asCallable(adoptedCallbackValue.value);
      if (callable === null) {
        return thrown(
          this.engine.createTypeError(
            this.realm,
            "adoptedCallback is not callable",
          ),
        );
      }
      const record = this.reportingCallback(callable);
      if (record.type === "throw") {
        return record;
      }
      adoptedCallback = (element, oldDocument, newDocument) => {
        this.context.invokeCallback(record.value, this.wrap(element), [
          this.wrap(oldDocument),
          this.wrap(newDocument),
        ]);
      };
    }
    const attributeChangedCallbackValue = this.engine.get(
      this.realm,
      prototype,
      "attributeChangedCallback",
    );
    if (attributeChangedCallbackValue.type === "throw") {
      return attributeChangedCallbackValue;
    }
    let attributeChangedCallback:
      | ((
          element: Element,
          localName: string,
          oldValue: string | null,
          newValue: string | null,
          namespace: string | null,
        ) => void)
      | null = null;
    let observedAttributes: readonly string[] = [];
    if (!this.engine.isUndefined(attributeChangedCallbackValue.value)) {
      const callable = this.engine.asCallable(
        attributeChangedCallbackValue.value,
      );
      if (callable === null) {
        return thrown(
          this.engine.createTypeError(
            this.realm,
            "attributeChangedCallback is not callable",
          ),
        );
      }
      const record = this.reportingCallback(callable);
      if (record.type === "throw") {
        return record;
      }
      attributeChangedCallback = (
        element,
        localName,
        oldValue,
        newValue,
        namespace,
      ) => {
        this.context.invokeCallback(record.value, this.wrap(element), [
          this.engine.fromPrimitive(localName),
          this.engine.fromPrimitive(oldValue),
          this.engine.fromPrimitive(newValue),
          this.engine.fromPrimitive(namespace),
        ]);
      };
    }
    if (attributeChangedCallback !== null) {
      const convertedObservedAttributes = this.customElementStringSequence(
        constructor,
        "observedAttributes",
      );
      if (convertedObservedAttributes.type === "throw") {
        return convertedObservedAttributes;
      }
      observedAttributes = convertedObservedAttributes.value;
    }
    const disabledFeatures = this.customElementStringSequence(
      constructor,
      "disabledFeatures",
    );
    if (disabledFeatures.type === "throw") {
      return disabledFeatures;
    }
    const formAssociatedValue = this.engine.get(
      this.realm,
      constructor,
      "formAssociated",
    );
    if (formAssociatedValue.type === "throw") {
      return formAssociatedValue;
    }
    const formAssociated = this.engine.toBoolean(formAssociatedValue.value);
    let formAssociatedCallback:
      ((element: Element, form: Element | null) => void) | null = null;
    if (formAssociated) {
      const callbackValue = this.engine.get(
        this.realm,
        prototype,
        "formAssociatedCallback",
      );
      if (callbackValue.type === "throw") {
        return callbackValue;
      }
      if (!this.engine.isUndefined(callbackValue.value)) {
        const callable = this.engine.asCallable(callbackValue.value);
        if (callable === null) {
          return thrown(
            this.engine.createTypeError(
              this.realm,
              "formAssociatedCallback is not callable",
            ),
          );
        }
        const record = this.reportingCallback(callable);
        if (record.type === "throw") {
          return record;
        }
        formAssociatedCallback = (element, form) => {
          this.context.invokeCallback(record.value, this.wrap(element), [
            form === null ? this.engine.fromPrimitive(null) : this.wrap(form),
          ]);
        };
      }
      for (const callbackName of [
        "formResetCallback",
        "formDisabledCallback",
        "formStateRestoreCallback",
      ] as const) {
        const formCallback = callback(callbackName);
        if (formCallback.type === "throw") {
          return formCallback;
        }
      }
    }
    try {
      registry.define({
        name,
        localName,
        constructorIdentity: constructor,
        construct: (document, localName, prefix, existingElement) => {
          if (
            existingElement !== undefined &&
            !(existingElement instanceof HTMLElement)
          ) {
            return callbackFailure();
          }
          const element =
            existingElement ?? createHTMLElement(document, localName, prefix);
          let constructionStack =
            this.customElementConstructionStacks.get(constructor);
          if (constructionStack === undefined) {
            constructionStack = [];
            this.customElementConstructionStacks.set(
              constructor,
              constructionStack,
            );
          }
          const definition = registry.definition(name);
          if (definition === null) {
            return callbackFailure();
          }
          const constructionEntry = {
            definition,
            element,
            reentryFailed: false,
          };
          constructionStack.push(constructionEntry);
          try {
            const result = this.context.runtime.invokeConstructor(
              constructorRecord.value,
              [],
            );
            if (result.type === "throw") {
              this.reportException(result.value);
              return constructionEntry.reentryFailed
                ? callbackSuccess(element)
                : callbackFailure();
            }
            if (this.interfaceObject(result.value) !== element) {
              this.reportException(
                this.engine.createTypeError(
                  this.realm,
                  "Custom element constructor returned a different object",
                ),
              );
              return callbackFailure();
            }
            return callbackSuccess(element);
          } finally {
            constructionStack.pop();
          }
        },
        connectedCallback: connectedCallback.value,
        disconnectedCallback: disconnectedCallback.value,
        connectedMoveCallback: connectedMoveCallback.value,
        reactionScheduler: this.mutationObserverScheduler,
        adoptedCallback,
        formAssociated,
        formAssociatedCallback,
        disabledFeatures: disabledFeatures.value,
        observedAttributes,
        attributeChangedCallback,
      });
    } catch (error: unknown) {
      if (error instanceof HostDOMException) {
        return thrown(this.createDOMException(error.message, error.name));
      }
      throw error;
    }
    return this.undefined();
  }

  upgradeCustomElementDefinition(
    registry: CustomElementRegistry,
    name: string,
  ): void {
    if (!registry.scoped && this.associatedDocument !== null) {
      upgradeCustomElements(this.associatedDocument, registry, name);
    }
    for (const root of registry.initializedRoots()) {
      upgradeCustomElements(root, registry, name);
    }
    if (registry.scoped) {
      for (const element of registry.associatedElements()) {
        if (element.isConnected) {
          upgradeCustomElements(element, registry, name);
        }
      }
    }
  }

  private customElementStringSequence(
    constructor: EngineCallable,
    property: string,
  ): EngineResult<readonly string[]> {
    const value = this.engine.get(this.realm, constructor, property);
    if (value.type === "throw") {
      return value;
    }
    if (this.engine.isUndefined(value.value)) {
      return normal([]);
    }
    const object = this.engine.asObject(value.value);
    if (object === null) {
      return thrown(
        this.engine.createTypeError(
          this.realm,
          `${property} is not a sequence`,
        ),
      );
    }
    const values = this.context.iterableValues(object);
    if (values.type === "throw") {
      return values;
    }
    if (values.value === null) {
      return thrown(
        this.engine.createTypeError(this.realm, `${property} is not iterable`),
      );
    }
    const strings: string[] = [];
    for (const item of values.value) {
      const string = this.engine.toString(this.realm, item);
      if (string.type === "throw") {
        return string;
      }
      strings.push(string.value);
    }
    return normal(strings);
  }

  createCustomElementRegistry(): EngineObject {
    const object = this.engine.createObject(
      this.realm,
      this.customElementRegistryPrototype,
    );
    const registry = new CustomElementRegistry();
    this.customElementRegistries.set(object, registry);
    this.customElementRegistryObjects.set(registry, object);
    sharedCustomElementRegistries(this.engine).set(object, registry);
    sharedCustomElementRegistryObjects(this.engine).set(registry, object);
    return object;
  }

  customElementRegistryObjectForNode(node: Node): EngineValue {
    const registry = customElementRegistryForNode(node);
    if (registry === null) {
      return this.engine.fromPrimitive(null);
    }
    const localObject = this.customElementRegistryObjects.get(registry);
    if (localObject !== undefined) {
      return localObject;
    }
    return (
      sharedCustomElementRegistryObjects(this.engine).get(registry) ??
      this.engine.fromPrimitive(null)
    );
  }

  customElementRegistryFor(value: EngineValue): CustomElementRegistry | null {
    const object = this.engine.asObject(value);
    if (object === null) {
      return null;
    }
    const localRegistry = this.customElementRegistries.get(object);
    if (localRegistry !== undefined) {
      return localRegistry;
    }
    return sharedCustomElementRegistries(this.engine).get(object) ?? null;
  }

  platformObject(interfaceObject: object): EngineObject {
    return this.wrap(interfaceObject);
  }

  bindPlatformObject(
    interfaceObject: object,
    platformObject: EngineObject,
  ): void {
    const implementation = implementationFor(interfaceObject);
    this.platformObjects.set(implementation, platformObject);
    sharedPlatformObjects(this.engine).set(implementation, platformObject);
    this.implementations.set(platformObject, implementation);
    sharedImplementations(this.engine).set(platformObject, implementation);
  }

  associatePlatformObject(
    interfaceObject: object,
    platformObject: EngineObject,
  ): void {
    const implementation = implementationFor(interfaceObject);
    this.implementations.set(platformObject, implementation);
    sharedImplementations(this.engine).set(platformObject, implementation);
  }

  installInterface(
    name: string,
    prototype: EngineObject,
    length = 0,
    construct: EngineHostFunction | null = null,
  ): EngineObject {
    const constructor =
      construct === null
        ? this.context.function(name, length, () =>
            this.typeError("Illegal constructor"),
          )
        : this.context.createConstructor(name, length, construct);
    this.context.installInterface(name, constructor, prototype);
    return constructor;
  }

  installHTMLElementInterface(
    name: string,
    prototype: EngineObject,
    activeInterface: typeof HTMLElement | HTMLElementInterfaceConstructor,
  ): EngineObject {
    const constructor = this.context.createConstructorWithoutThis(
      name,
      0,
      (_argumentsList, newTarget) =>
        this.constructHTMLElement(activeInterface, constructor, newTarget),
    );
    this.context.installInterface(name, constructor, prototype);
    return constructor;
  }

  htmlElementInterfacePrototype(
    interfaceConstructor: HTMLElementInterfaceConstructor,
  ): EngineObject {
    const prototype =
      this.htmlElementInterfacePrototypes.get(interfaceConstructor);
    if (prototype === undefined) {
      throw new TypeError(
        `${interfaceConstructor.name} is not registered in the realm`,
      );
    }
    return prototype;
  }

  createTraversal(
    thisValue: EngineValue,
    argumentsList: readonly EngineValue[],
    kind: "iterator" | "walker",
  ): EngineResult<EngineValue> {
    const document = this.document(thisValue);
    if (document === null) {
      return this.typeError("Invalid Document receiver");
    }
    const rootValue = argumentsList[0];
    const root = rootValue === undefined ? null : this.node(rootValue);
    if (root === null) {
      return this.typeError(
        `${kind === "iterator" ? "createNodeIterator" : "createTreeWalker"} requires a Node root`,
      );
    }
    const whatToShow = this.unsignedLong(argumentsList[1], NodeFilter.SHOW_ALL);
    if (whatToShow.type === "throw") {
      return whatToShow;
    }
    const filter = this.traversalFilter(argumentsList[2]);
    if (filter.type === "throw") {
      return filter;
    }
    const traversal =
      kind === "iterator"
        ? createNodeIterator(
            root,
            whatToShow.value,
            null,
            filter.value.callback,
          )
        : createTreeWalker(root, whatToShow.value, null, filter.value.callback);
    if (filter.value.value !== null) {
      this.traversalFilters.set(traversal, filter.value.value);
    }
    return normal(this.wrap(traversal));
  }

  unsignedLong(
    value: EngineValue | undefined,
    defaultValue: number,
  ): EngineResult<number> {
    if (value === undefined || this.engine.isUndefined(value)) {
      return normal(defaultValue);
    }
    const converted = this.engine.toString(this.realm, value);
    if (converted.type === "throw") {
      return converted;
    }
    const number = Number(converted.value);
    if (!Number.isFinite(number) || number === 0) {
      return normal(0);
    }
    const integer = Math.trunc(number);
    return normal(((integer % 0x1_0000_0000) + 0x1_0000_0000) % 0x1_0000_0000);
  }

  unsignedLongArgument(
    argumentsList: readonly EngineValue[],
    index: number,
    operation: string,
  ): EngineResult<number> {
    const value = argumentsList[index];
    if (value === undefined) {
      return thrown(
        this.engine.createTypeError(
          this.realm,
          `${operation} requires ${String(index + 1)} argument(s)`,
        ),
      );
    }
    const converted = this.engine.toNumber(this.realm, value);
    if (converted.type === "throw") {
      return converted;
    }
    if (!Number.isFinite(converted.value) || converted.value === 0) {
      return normal(0);
    }
    const integer = Math.trunc(converted.value);
    return normal(((integer % 0x1_0000_0000) + 0x1_0000_0000) % 0x1_0000_0000);
  }

  longArgument(
    argumentsList: readonly EngineValue[],
    index: number,
    operation: string,
  ): EngineResult<number> {
    const value = argumentsList[index];
    if (value === undefined) {
      return thrown(
        this.engine.createTypeError(
          this.realm,
          `${operation} requires ${String(index + 1)} argument(s)`,
        ),
      );
    }
    const converted = this.engine.toNumber(this.realm, value);
    return converted.type === "throw"
      ? converted
      : normal(toLong(converted.value));
  }

  integer(
    value: EngineValue | undefined,
    bits: 16 | 32,
    signed: boolean,
  ): EngineResult<number> {
    if (value === undefined || this.engine.isUndefined(value)) {
      return normal(0);
    }
    const converted = this.engine.toNumber(this.realm, value);
    if (converted.type === "throw") {
      return converted;
    }
    if (!Number.isFinite(converted.value) || converted.value === 0) {
      return normal(0);
    }
    const modulus = 2 ** bits;
    const unsigned =
      ((Math.trunc(converted.value) % modulus) + modulus) % modulus;
    return normal(
      signed && unsigned >= modulus / 2 ? unsigned - modulus : unsigned,
    );
  }

  htmlParsingOptions(
    value: EngineValue | undefined,
    includeRunScripts: boolean,
    operation: string,
  ): EngineResult<HTMLParsingOptions> {
    if (
      value === undefined ||
      this.engine.isUndefined(value) ||
      this.engine.isNull(value)
    ) {
      return normal({});
    }
    const dictionary = this.engine.asObject(value);
    if (dictionary === null) {
      return thrown(
        this.engine.createTypeError(
          this.realm,
          `${operation} options must be an object`,
        ),
      );
    }
    const options: {
      runScripts?: boolean;
      sanitizer?: "default" | Sanitizer | SanitizerConfig;
    } = {};
    if (includeRunScripts) {
      const runScripts = this.engine.get(this.realm, dictionary, "runScripts");
      if (runScripts.type === "throw") {
        return runScripts;
      }
      if (!this.engine.isUndefined(runScripts.value)) {
        options.runScripts = this.engine.toBoolean(runScripts.value);
      }
    }
    const sanitizer = this.engine.get(this.realm, dictionary, "sanitizer");
    if (sanitizer.type === "throw") {
      return sanitizer;
    }
    if (this.engine.isUndefined(sanitizer.value)) {
      return normal(options);
    }
    const sanitizerObject = this.engine.asObject(sanitizer.value);
    const sanitizerInstance =
      sanitizerObject === null
        ? undefined
        : this.sanitizers.get(sanitizerObject);
    if (sanitizerInstance !== undefined) {
      options.sanitizer = sanitizerInstance;
      return normal(options);
    }
    const config = this.sanitizerConfiguration(
      sanitizer.value,
      false,
      operation,
    );
    if (config.type === "throw") {
      return config;
    }
    options.sanitizer = config.value;
    return normal(options);
  }

  sanitizer(value: EngineValue): Sanitizer | null {
    const object = this.engine.asObject(value);
    return object === null ? null : (this.sanitizers.get(object) ?? null);
  }

  setSanitizer(object: EngineObject, sanitizer: Sanitizer): void {
    this.sanitizers.set(object, sanitizer);
  }

  private sanitizerTypeError<T>(message: string): EngineResult<T> {
    return thrown(this.engine.createTypeError(this.realm, message));
  }

  sanitizerConfiguration(
    value: EngineValue | undefined,
    defaultPreset: boolean,
    operation: string,
  ): EngineResult<"default" | SanitizerConfig> {
    if (value === undefined || this.engine.isUndefined(value)) {
      return normal(defaultPreset ? "default" : {});
    }
    const stringValue = this.engine.asString(value);
    if (stringValue !== null) {
      return stringValue === "default"
        ? normal("default")
        : this.sanitizerTypeError(
            `${operation} configuration must be "default" or a dictionary`,
          );
    }
    if (this.engine.isNull(value)) {
      return normal({});
    }
    const dictionary = this.engine.asObject(value);
    if (dictionary === null) {
      const converted = this.engine.toString(this.realm, value);
      if (converted.type === "throw") {
        return converted;
      }
      return converted.value === "default"
        ? normal("default")
        : this.sanitizerTypeError(
            `${operation} configuration must be "default" or a dictionary`,
          );
    }
    const config: {
      attributes?: readonly SanitizerAttribute[];
      comments?: boolean;
      dataAttributes?: boolean;
      elements?: readonly SanitizerElementInput[];
      javascriptURLs?: boolean;
      processingInstructions?: readonly SanitizerPI[];
      removeAttributes?: readonly SanitizerAttribute[];
      removeElements?: readonly SanitizerElement[];
      removeProcessingInstructions?: readonly SanitizerPI[];
      replaceWithChildrenElements?: readonly SanitizerElement[];
    } = {};
    for (const member of ["elements"] as const) {
      const converted = this.sanitizerSequenceMember(
        dictionary,
        member,
        operation,
        (item) => this.sanitizerElementValue(item, true, operation),
      );
      if (converted.type === "throw") {
        return converted;
      }
      if (converted.value !== undefined) {
        config[member] = converted.value;
      }
    }
    for (const member of [
      "removeElements",
      "replaceWithChildrenElements",
    ] as const) {
      const converted = this.sanitizerSequenceMember(
        dictionary,
        member,
        operation,
        (item) => this.sanitizerElementValue(item, false, operation),
      );
      if (converted.type === "throw") {
        return converted;
      }
      if (converted.value !== undefined) {
        config[member] = converted.value;
      }
    }
    for (const member of ["attributes", "removeAttributes"] as const) {
      const converted = this.sanitizerSequenceMember(
        dictionary,
        member,
        operation,
        (item) => this.sanitizerNameValue(item, operation),
      );
      if (converted.type === "throw") {
        return converted;
      }
      if (converted.value !== undefined) {
        config[member] = converted.value;
      }
    }
    for (const member of [
      "processingInstructions",
      "removeProcessingInstructions",
    ] as const) {
      const converted = this.sanitizerSequenceMember(
        dictionary,
        member,
        operation,
        (item) => this.sanitizerPIValue(item, operation),
      );
      if (converted.type === "throw") {
        return converted;
      }
      if (converted.value !== undefined) {
        config[member] = converted.value;
      }
    }
    for (const member of [
      "comments",
      "dataAttributes",
      "javascriptURLs",
    ] as const) {
      const memberValue = this.engine.get(this.realm, dictionary, member);
      if (memberValue.type === "throw") {
        return memberValue;
      }
      if (!this.engine.isUndefined(memberValue.value)) {
        config[member] = this.engine.toBoolean(memberValue.value);
      }
    }
    return normal(config);
  }

  sanitizerElementArgument(
    argumentsList: readonly EngineValue[],
    index: number,
    withAttributes: boolean,
    operation: string,
  ): EngineResult<SanitizerElementInput> {
    const value = argumentsList[index];
    return value === undefined
      ? this.sanitizerTypeError(
          `${operation} requires ${String(index + 1)} argument(s)`,
        )
      : this.sanitizerElementValue(value, withAttributes, operation);
  }

  sanitizerPIArgument(
    argumentsList: readonly EngineValue[],
    index: number,
    operation: string,
  ): EngineResult<SanitizerPI> {
    const value = argumentsList[index];
    return value === undefined
      ? this.sanitizerTypeError(
          `${operation} requires ${String(index + 1)} argument(s)`,
        )
      : this.sanitizerPIValue(value, operation);
  }

  private sanitizerElementValue(
    value: EngineValue,
    withAttributes: boolean,
    operation: string,
  ): EngineResult<SanitizerElementInput> {
    const name = this.sanitizerNameValue(value, operation);
    if (
      name.type === "throw" ||
      !withAttributes ||
      typeof name.value === "string"
    ) {
      return name;
    }
    const dictionary = this.engine.asObject(value);
    if (dictionary === null) {
      return name;
    }
    const attributes = this.sanitizerSequenceMember(
      dictionary,
      "attributes",
      operation,
      (item) => this.sanitizerNameValue(item, operation),
    );
    if (attributes.type === "throw") {
      return attributes;
    }
    const removeAttributes = this.sanitizerSequenceMember(
      dictionary,
      "removeAttributes",
      operation,
      (item) => this.sanitizerNameValue(item, operation),
    );
    if (removeAttributes.type === "throw") {
      return removeAttributes;
    }
    return normal({
      ...name.value,
      ...(attributes.value === undefined
        ? {}
        : { attributes: attributes.value }),
      ...(removeAttributes.value === undefined
        ? {}
        : { removeAttributes: removeAttributes.value }),
    });
  }

  private sanitizerNameValue(
    value: EngineValue,
    operation: string,
  ): EngineResult<SanitizerAttribute> {
    const stringValue = this.engine.asString(value);
    if (stringValue !== null) {
      return normal(stringValue);
    }
    const dictionary = this.engine.asObject(value);
    if (dictionary === null && !this.engine.isNull(value)) {
      const converted = this.engine.toString(this.realm, value);
      return converted.type === "throw" ? converted : normal(converted.value);
    }
    if (dictionary === null) {
      return this.sanitizerTypeError(
        `${operation} sanitizer name requires a name member`,
      );
    }
    const name = this.engine.get(this.realm, dictionary, "name");
    if (name.type === "throw") {
      return name;
    }
    if (this.engine.isUndefined(name.value)) {
      return this.sanitizerTypeError(
        `${operation} sanitizer name requires a name member`,
      );
    }
    const convertedName = this.engine.toString(this.realm, name.value);
    if (convertedName.type === "throw") {
      return convertedName;
    }
    const namespace = this.engine.get(this.realm, dictionary, "namespace");
    if (namespace.type === "throw") {
      return namespace;
    }
    if (this.engine.isUndefined(namespace.value)) {
      return normal({ name: convertedName.value });
    }
    if (this.engine.isNull(namespace.value)) {
      return normal({ name: convertedName.value, namespace: null });
    }
    const convertedNamespace = this.engine.toString(
      this.realm,
      namespace.value,
    );
    return convertedNamespace.type === "throw"
      ? convertedNamespace
      : normal({
          name: convertedName.value,
          namespace: convertedNamespace.value,
        });
  }

  private sanitizerPIValue(
    value: EngineValue,
    operation: string,
  ): EngineResult<SanitizerPI> {
    const stringValue = this.engine.asString(value);
    if (stringValue !== null) {
      return normal(stringValue);
    }
    const dictionary = this.engine.asObject(value);
    if (dictionary === null && !this.engine.isNull(value)) {
      const converted = this.engine.toString(this.realm, value);
      return converted.type === "throw" ? converted : normal(converted.value);
    }
    if (dictionary === null) {
      return this.sanitizerTypeError(
        `${operation} processing instruction requires a target member`,
      );
    }
    const target = this.engine.get(this.realm, dictionary, "target");
    if (target.type === "throw") {
      return target;
    }
    if (this.engine.isUndefined(target.value)) {
      return this.sanitizerTypeError(
        `${operation} processing instruction requires a target member`,
      );
    }
    const converted = this.engine.toString(this.realm, target.value);
    return converted.type === "throw"
      ? converted
      : normal({ target: converted.value });
  }

  private sanitizerSequenceMember<T>(
    dictionary: EngineObject,
    member: string,
    operation: string,
    convert: (value: EngineValue) => EngineResult<T>,
  ): EngineResult<readonly T[] | undefined> {
    const value = this.engine.get(this.realm, dictionary, member);
    if (value.type === "throw") {
      return value;
    }
    if (this.engine.isUndefined(value.value)) {
      return normal(undefined);
    }
    const sequence = this.engine.asObject(value.value);
    if (sequence === null) {
      return this.sanitizerTypeError(
        `${operation} sanitizer.${member} must be a sequence`,
      );
    }
    const values = this.context.iterableValues(sequence);
    if (values.type === "throw") {
      return values;
    }
    if (values.value === null) {
      return this.sanitizerTypeError(
        `${operation} sanitizer.${member} must be iterable`,
      );
    }
    const result: T[] = [];
    for (const item of values.value) {
      const converted = convert(item);
      if (converted.type === "throw") {
        return converted;
      }
      result.push(converted.value);
    }
    return normal(result);
  }

  traversalFilter(
    value: EngineValue | undefined,
  ): EngineResult<TraversalFilterArgument> {
    if (
      value === undefined ||
      this.engine.isUndefined(value) ||
      this.engine.isNull(value)
    ) {
      return normal({ callback: null, value: null });
    }
    if (
      this.engine.asCallable(value) === null &&
      this.engine.asObject(value) === null
    ) {
      return thrown(
        this.engine.createTypeError(
          this.realm,
          "NodeFilter must be an object or function",
        ),
      );
    }
    return normal({
      callback: (node) => this.callTraversalFilter(value, node),
      value,
    });
  }

  callTraversalFilter(
    filter: EngineValue,
    node: Node,
  ): TraversalResult<number> {
    let callable = this.engine.asCallable(filter);
    let receiver = this.engine.fromPrimitive(undefined);
    if (callable === null) {
      const object = this.engine.asObject(filter);
      if (object === null) {
        return this.traversalAbrupt(
          this.engine.createTypeError(this.realm, "Invalid NodeFilter"),
        );
      }
      const acceptNode = this.engine.get(this.realm, object, "acceptNode");
      if (acceptNode.type === "throw") {
        return this.traversalAbrupt(acceptNode.value);
      }
      callable = this.engine.asCallable(acceptNode.value);
      if (callable === null) {
        return this.traversalAbrupt(
          this.engine.createTypeError(
            this.realm,
            "NodeFilter.acceptNode is not callable",
          ),
        );
      }
      receiver = filter;
    }
    const result = this.context.call(callable, receiver, [this.wrap(node)]);
    if (result.type === "throw") {
      return this.traversalAbrupt(result.value);
    }
    const converted = this.engine.toNumber(this.realm, result.value);
    if (converted.type === "throw") {
      return this.traversalAbrupt(converted.value);
    }
    return traversalNormal(converted.value);
  }

  traversalAbrupt(value: EngineValue): TraversalResult<never> {
    const token = {};
    this.traversalAbruptValues.set(token, value);
    return traversalAbrupt(token);
  }

  installParentNodeMutationMembers(
    prototype: EngineObject,
    receiver: (value: EngineValue) => ParentNodeObject | null,
    interfaceName: string,
  ): void {
    for (const name of ["prepend", "append", "replaceChildren"] as const) {
      this.method(prototype, name, 0, (thisValue, argumentsList) => {
        const parent = receiver(thisValue);
        if (parent === null) {
          return this.typeError(`Invalid ${interfaceName} receiver`);
        }
        const nodes = this.parentNodeArguments(argumentsList);
        if (nodes.type === "throw") {
          return nodes;
        }
        return this.domOperationResult(() => {
          parent[name](...nodes.value);
          return this.undefined();
        });
      });
    }
    this.method(prototype, "moveBefore", 2, (thisValue, argumentsList) => {
      const parent = receiver(thisValue);
      const nodeValue = argumentsList[0];
      const node = nodeValue === undefined ? null : this.node(nodeValue);
      if (parent === null) {
        return this.typeError(`Invalid ${interfaceName} receiver`);
      }
      if (node === null) {
        return this.typeError("The first argument is not a Node");
      }
      const childValue = argumentsList[1];
      if (childValue === undefined) {
        return this.typeError("moveBefore requires 2 argument(s)");
      }
      const child =
        this.engine.isNull(childValue) || this.engine.isUndefined(childValue)
          ? null
          : this.node(childValue);
      if (
        child === null &&
        !this.engine.isNull(childValue) &&
        !this.engine.isUndefined(childValue)
      ) {
        return this.typeError("The second argument is not a Node or null");
      }
      return this.domOperationResult(() => {
        parent.moveBefore(node, child);
        return this.undefined();
      });
    });
  }

  installChildNodeMutationMembers(
    prototype: EngineObject,
    receiver: (value: EngineValue) => ChildNodeObject | null,
    interfaceName: string,
  ): void {
    for (const name of ["before", "after", "replaceWith"] as const) {
      this.method(prototype, name, 0, (thisValue, argumentsList) => {
        const child = receiver(thisValue);
        if (child === null) {
          return this.typeError(`Invalid ${interfaceName} receiver`);
        }
        const nodes = this.parentNodeArguments(argumentsList);
        if (nodes.type === "throw") {
          return nodes;
        }
        return this.domOperationResult(() => {
          child[name](...nodes.value);
          return this.undefined();
        });
      });
    }
    this.method(prototype, "remove", 0, (thisValue) => {
      const child = receiver(thisValue);
      if (child === null) {
        return this.typeError(`Invalid ${interfaceName} receiver`);
      }
      return this.domOperationResult(() => {
        child.remove();
        return this.undefined();
      });
    });
  }

  traversalCompletion(
    callback: () => TraversalResult<Node | null>,
  ): EngineResult<EngineValue> {
    try {
      const result = callback();
      if (result.type === "normal") {
        return this.platformValue(result.value);
      }
      const value = this.traversalAbruptValues.get(result.token);
      this.traversalAbruptValues.delete(result.token);
      if (value === undefined) {
        throw new TypeError("Unknown traversal interruption token");
      }
      return thrown(value);
    } catch (error: unknown) {
      if (error instanceof HostDOMException) {
        return thrown(this.createDOMException(error.message, error.name));
      }
      throw error;
    }
  }

  domOperationResult(
    callback: () => EngineResult<EngineValue>,
  ): EngineResult<EngineValue> {
    try {
      return callback();
    } catch (error: unknown) {
      if (error instanceof HostDOMException) {
        return thrown(this.createDOMException(error.message, error.name));
      }
      throw error;
    }
  }

  createDOMException(message: string, name: string): EngineObject {
    const exception = this.engine.createObject(
      this.realm,
      this.domExceptionPrototype,
    );
    const code = domExceptionCode(name);
    this.domExceptions.set(exception, { message, name, code });
    return exception;
  }

  domExceptionState(value: EngineValue): DOMExceptionState | null {
    const object = this.engine.asObject(value);
    return object === null ? null : (this.domExceptions.get(object) ?? null);
  }

  interfaceTag(prototype: EngineObject, name: string): void {
    this.context.tag(prototype, name);
  }

  installIterator(
    prototype: EngineObject,
    collection: (value: EngineValue) => Iterable<object> | null,
    interfaceName: string,
  ): void {
    this.engine.initializeDataProperty(
      prototype,
      this.engine.wellKnownSymbol("iterator"),
      this.engine.createFunction(this.realm, "values", 0, (thisValue) => {
        const value = collection(thisValue);
        return value === null
          ? this.typeError(`Invalid ${interfaceName} receiver`)
          : this.arrayIterator(Array.from(value));
      }),
      DATA_PROPERTY,
    );
  }

  method(
    prototype: EngineObject,
    name: string,
    length: number,
    callback: EngineHostFunction,
  ): void {
    this.context.method(prototype, name, length, (thisValue, argumentsList) =>
      runCustomElementReactions(() => callback(thisValue, argumentsList)),
    );
  }

  attribute(
    prototype: EngineObject,
    name: string,
    getter: EngineHostFunction,
    setter: EngineHostFunction | null = null,
  ): void {
    this.context.attribute(
      prototype,
      name,
      getter,
      setter === null
        ? null
        : (thisValue, argumentsList) =>
            runCustomElementReactions(() => setter(thisValue, argumentsList)),
    );
  }

  legacyPlatformObject(
    target: EngineObject,
    configuration: DOMLegacyPlatformObjectConfiguration,
  ): EngineObject {
    return createDOMLegacyPlatformObject(
      this.context,
      target,
      configuration,
      (value) => this.wrap(value),
    );
  }

  arrayIterator(values: readonly object[]): EngineResult<EngineValue> {
    const array = this.engine.createArray(
      this.realm,
      values.map((value) => this.wrap(value)),
    );
    const iterator = this.engine.get(
      this.realm,
      array,
      this.engine.wellKnownSymbol("iterator"),
    );
    if (iterator.type === "throw") {
      return iterator;
    }
    const callable = this.engine.asCallable(iterator.value);
    return callable === null
      ? this.typeError("Array iterator is not callable")
      : this.context.call(callable, array, []);
  }

  wrap(interfaceObject: object): EngineObject {
    const creationBinding = this.creationRealmBinding(interfaceObject);
    if (creationBinding !== null && creationBinding !== this) {
      return creationBinding.wrap(interfaceObject);
    }
    if (interfaceObject instanceof Document) {
      const document = documentImplementation(interfaceObject);
      const bindings = documentRealmBindings(this.engine);
      if (!bindings.has(document.relevantRealmDocument)) {
        bindings.set(document.relevantRealmDocument, this);
      }
    }
    const implementation = implementationFor(interfaceObject);
    const existing = this.platformObjects.get(implementation);
    if (existing !== undefined) {
      return existing;
    }
    const shared = sharedPlatformObjects(this.engine).get(implementation);
    if (shared !== undefined) {
      return shared;
    }
    const prototype = this.prototype(interfaceObject);
    const target = this.engine.createObject(this.realm, prototype);
    let platformObject = target;
    if (interfaceObject instanceof Document) {
      platformObject = this.legacyPlatformObject(target, {
        namedNames: () => documentNamedPropertyNames(interfaceObject),
        namedValue: (name) => documentNamedItem(interfaceObject, name),
        namedEnumerable: true,
        namedIncludesIndices: true,
        overrideBuiltins: true,
      });
    } else if (interfaceObject instanceof HTMLCollection) {
      const collection = interfaceObject;
      platformObject = this.legacyPlatformObject(target, {
        indexedLength: () => collection.length,
        indexedValue: (index) => collection.item(index),
        namedNames: () => htmlCollectionSupportedPropertyNames(collection),
        namedValue: (name) => collection.namedItem(name),
      });
    } else if (interfaceObject instanceof NamedNodeMap) {
      platformObject = this.legacyPlatformObject(target, {
        indexedLength: () => interfaceObject.length,
        indexedValue: (index) => interfaceObject.item(index),
        namedNames: () => namedNodeMapSupportedPropertyNames(interfaceObject),
        namedValue: (name) => interfaceObject.getNamedItem(name),
      });
    } else if (interfaceObject instanceof NodeList) {
      const list = interfaceObject;
      platformObject = this.legacyPlatformObject(target, {
        indexedLength: () => list.length,
        indexedValue: (index) => list.item(index),
      });
    } else if (interfaceObject instanceof DOMTokenList) {
      platformObject = this.legacyPlatformObject(target, {
        indexedLength: () => interfaceObject.length,
        indexedValue: (index) => interfaceObject.item(index),
      });
    } else if (interfaceObject instanceof DOMRectList) {
      platformObject = this.legacyPlatformObject(target, {
        indexedLength: () => interfaceObject.length,
        indexedValue: (index) => interfaceObject.item(index),
      });
    } else if (interfaceObject instanceof CSSStyleDeclaration) {
      platformObject = this.legacyPlatformObject(target, {
        indexedLength: () => interfaceObject.length,
        indexedValue: (index) => interfaceObject.item(index),
      });
    } else if (interfaceObject instanceof CSSRuleList) {
      platformObject = this.legacyPlatformObject(target, {
        indexedLength: () => interfaceObject.length,
        indexedValue: (index) => interfaceObject.item(index),
      });
    } else if (interfaceObject instanceof MediaList) {
      platformObject = this.legacyPlatformObject(target, {
        indexedLength: () => interfaceObject.length,
        indexedValue: (index) => interfaceObject.item(index),
      });
    } else if (interfaceObject instanceof StyleSheetList) {
      platformObject = this.legacyPlatformObject(target, {
        indexedLength: () => interfaceObject.length,
        indexedValue: (index) => interfaceObject.item(index),
      });
    } else if (interfaceObject instanceof DOMStringMap) {
      platformObject = this.legacyPlatformObject(target, {
        namedNames: () => Object.getOwnPropertyNames(interfaceObject),
        namedValue: (name) => interfaceObject[name],
        namedSet: (name, value) =>
          this.domOperationResult(() => {
            interfaceObject[name] = value;
            return this.undefined();
          }),
        namedDelete: (name) => {
          Reflect.deleteProperty(interfaceObject, name);
        },
        namedEnumerable: true,
        namedIncludesIndices: true,
        overrideBuiltins: true,
      });
    }
    this.platformObjects.set(implementation, platformObject);
    this.implementations.set(target, implementation);
    this.implementations.set(platformObject, implementation);
    const implementations = sharedImplementations(this.engine);
    implementations.set(target, implementation);
    implementations.set(platformObject, implementation);
    return platformObject;
  }

  private creationRealmBinding(
    interfaceObject: object,
  ): DOMRealmBindingContext | null {
    let document: DocumentImplementation | null = null;
    if (interfaceObject instanceof Node) {
      const implementation = nodeImplementation(interfaceObject);
      document =
        implementation instanceof DocumentImplementation
          ? implementation
          : implementation.creationDocument;
    } else if (interfaceObject instanceof DOMImplementation) {
      document = documentImplementation(interfaceObject.document);
    }
    return document === null
      ? null
      : (documentRealmBindings(this.engine).get(
          document.relevantRealmDocument,
        ) ?? null);
  }

  prototype(interfaceObject: object): EngineObject {
    if (interfaceObject instanceof AbortSignal) {
      return this.abortSignalPrototype;
    }
    if (interfaceObject instanceof AbortController) {
      return this.abortControllerPrototype;
    }
    if (interfaceObject instanceof CustomEvent) {
      return this.customEventPrototype;
    }
    if (interfaceObject instanceof FocusEvent) {
      return this.focusEventPrototype;
    }
    if (interfaceObject instanceof MouseEvent) {
      return this.mouseEventPrototype;
    }
    if (interfaceObject instanceof ErrorEvent) {
      return this.errorEventPrototype;
    }
    if (interfaceObject instanceof PromiseRejectionEvent) {
      return this.promiseRejectionEventPrototype;
    }
    if (interfaceObject instanceof MessageEvent) {
      return this.messageEventPrototype;
    }
    if (interfaceObject instanceof XMLDocument) {
      return this.xmlDocumentPrototype;
    }
    if (interfaceObject instanceof Document) {
      return this.documentPrototype;
    }
    if (interfaceObject instanceof ShadowRoot) {
      return this.shadowRootPrototype;
    }
    if (interfaceObject instanceof DocumentFragment) {
      return this.documentFragmentPrototype;
    }
    if (interfaceObject instanceof DocumentType) {
      return this.documentTypePrototype;
    }
    if (interfaceObject instanceof DOMImplementation) {
      return this.domImplementationPrototype;
    }
    if (interfaceObject instanceof CDATASection) {
      return this.cdataSectionPrototype;
    }
    if (interfaceObject instanceof Text) {
      return this.textPrototype;
    }
    if (interfaceObject instanceof Comment) {
      return this.commentPrototype;
    }
    if (interfaceObject instanceof ProcessingInstruction) {
      return this.processingInstructionPrototype;
    }
    if (interfaceObject instanceof CharacterData) {
      return this.characterDataPrototype;
    }
    if (interfaceObject instanceof Attr) {
      return this.attrPrototype;
    }
    if (interfaceObject instanceof ElementInternals) {
      return this.elementInternalsPrototype;
    }
    if (interfaceObject instanceof HTMLElement) {
      return (
        this.htmlElementInterfacePrototypes.get(interfaceObject.constructor) ??
        this.htmlElementPrototype
      );
    }
    if (interfaceObject instanceof Element) {
      return this.isForeignAnchor(interfaceObject)
        ? this.foreignAnchorPrototype
        : this.elementPrototype;
    }
    if (interfaceObject instanceof DOMRect) {
      return this.domRectPrototype;
    }
    if (interfaceObject instanceof DOMRectReadOnly) {
      return this.domRectReadOnlyPrototype;
    }
    if (interfaceObject instanceof DOMRectList) {
      return this.domRectListPrototype;
    }
    if (interfaceObject instanceof Node) {
      return this.nodePrototype;
    }
    if (interfaceObject instanceof Event) {
      return this.eventPrototype;
    }
    if (interfaceObject instanceof EventTarget) {
      return this.eventTargetPrototype;
    }
    if (interfaceObject instanceof HTMLCollection) {
      return this.htmlCollectionPrototype;
    }
    if (interfaceObject instanceof NamedNodeMap) {
      return this.namedNodeMapPrototype;
    }
    if (interfaceObject instanceof NodeList) {
      return this.nodeListPrototype;
    }
    if (interfaceObject instanceof MutationObserver) {
      return this.mutationObserverPrototype;
    }
    if (interfaceObject instanceof MutationRecord) {
      return this.mutationRecordPrototype;
    }
    if (interfaceObject instanceof DOMTokenList) {
      return this.domTokenListPrototype;
    }
    if (isRange(interfaceObject)) {
      return this.rangePrototype;
    }
    if (isSelection(interfaceObject)) {
      return this.selectionPrototype;
    }
    if (isStaticRange(interfaceObject)) {
      return this.staticRangePrototype;
    }
    if (isNodeIterator(interfaceObject)) {
      return this.nodeIteratorPrototype;
    }
    if (isTreeWalker(interfaceObject)) {
      return this.treeWalkerPrototype;
    }
    if (interfaceObject instanceof DOMStringMap) {
      return this.domStringMapPrototype;
    }
    if (interfaceObject instanceof CSSStyleProperties) {
      return this.cssStylePropertiesPrototype;
    }
    if (interfaceObject instanceof CSSStyleDeclaration) {
      return this.cssStyleDeclarationPrototype;
    }
    if (interfaceObject instanceof CSSMediaRule) {
      return this.cssMediaRulePrototype;
    }
    if (interfaceObject instanceof CSSConditionRule) {
      return this.cssConditionRulePrototype;
    }
    if (interfaceObject instanceof CSSGroupingRule) {
      return this.cssGroupingRulePrototype;
    }
    if (interfaceObject instanceof CSSStyleRule) {
      return this.cssStyleRulePrototype;
    }
    if (interfaceObject instanceof CSSRule) {
      return this.cssRulePrototype;
    }
    if (interfaceObject instanceof CSSRuleList) {
      return this.cssRuleListPrototype;
    }
    if (interfaceObject instanceof CSSStyleSheet) {
      return this.cssStyleSheetPrototype;
    }
    if (interfaceObject instanceof MediaList) {
      return this.mediaListPrototype;
    }
    if (interfaceObject instanceof StyleSheetList) {
      return this.styleSheetListPrototype;
    }
    throw new TypeError("Unsupported DOM platform object");
  }

  interfaceObject(value: EngineValue): object | null {
    const object = this.engine.asObject(value);
    if (object === null) {
      return null;
    }
    const implementation =
      this.implementations.get(object) ??
      sharedImplementations(this.engine).get(object);
    return implementation === undefined ? null : interfaceFor(implementation);
  }

  eventTarget(value: EngineValue): EventTarget | null {
    const interfaceObject = this.engine.isUndefined(value)
      ? this.interfaceObject(this.engine.globalThis(this.realm))
      : this.interfaceObject(value);
    return interfaceObject instanceof EventTarget ? interfaceObject : null;
  }

  domRectReadOnly(value: EngineValue): DOMRectReadOnly | null {
    const interfaceObject = this.interfaceObject(value);
    return interfaceObject instanceof DOMRectReadOnly ? interfaceObject : null;
  }

  domRect(value: EngineValue): DOMRect | null {
    const interfaceObject = this.interfaceObject(value);
    return interfaceObject instanceof DOMRect ? interfaceObject : null;
  }

  domRectList(value: EngineValue): DOMRectList | null {
    const interfaceObject = this.interfaceObject(value);
    return interfaceObject instanceof DOMRectList ? interfaceObject : null;
  }

  elementInternals(value: EngineValue): ElementInternals | null {
    const interfaceObject = this.interfaceObject(value);
    return interfaceObject instanceof ElementInternals ? interfaceObject : null;
  }

  abortSignal(value: EngineValue): AbortSignal | null {
    const interfaceObject = this.interfaceObject(value);
    return interfaceObject instanceof AbortSignal ? interfaceObject : null;
  }

  abortController(value: EngineValue): AbortController | null {
    const interfaceObject = this.interfaceObject(value);
    return interfaceObject instanceof AbortController ? interfaceObject : null;
  }

  node(value: EngineValue): Node | null {
    const interfaceObject = this.interfaceObject(value);
    return interfaceObject instanceof Node ? interfaceObject : null;
  }

  mutationObserver(value: EngineValue): MutationObserver | null {
    const interfaceObject = this.interfaceObject(value);
    return interfaceObject instanceof MutationObserver ? interfaceObject : null;
  }

  mutationRecord(value: EngineValue): MutationRecord | null {
    const interfaceObject = this.interfaceObject(value);
    return interfaceObject instanceof MutationRecord ? interfaceObject : null;
  }

  characterData(value: EngineValue): CharacterData | null {
    const interfaceObject = this.interfaceObject(value);
    return interfaceObject instanceof CharacterData ? interfaceObject : null;
  }

  processingInstruction(value: EngineValue): ProcessingInstruction | null {
    const interfaceObject = this.interfaceObject(value);
    return interfaceObject instanceof ProcessingInstruction
      ? interfaceObject
      : null;
  }

  attr(value: EngineValue): Attr | null {
    const interfaceObject = this.interfaceObject(value);
    return interfaceObject instanceof Attr ? interfaceObject : null;
  }

  element(value: EngineValue): Element | null {
    const interfaceObject = this.interfaceObject(value);
    return interfaceObject instanceof Element ? interfaceObject : null;
  }

  htmlElement(value: EngineValue): HTMLElement | null {
    const interfaceObject = this.interfaceObject(value);
    return interfaceObject instanceof HTMLElement ? interfaceObject : null;
  }

  htmlAnchorElement(value: EngineValue): HTMLAnchorElement | null {
    const interfaceObject = this.interfaceObject(value);
    return interfaceObject instanceof HTMLAnchorElement
      ? interfaceObject
      : null;
  }

  htmlAreaElement(value: EngineValue): HTMLAreaElement | null {
    const interfaceObject = this.interfaceObject(value);
    return interfaceObject instanceof HTMLAreaElement ? interfaceObject : null;
  }

  htmlButtonElement(value: EngineValue): HTMLButtonElement | null {
    const interfaceObject = this.interfaceObject(value);
    return interfaceObject instanceof HTMLButtonElement
      ? interfaceObject
      : null;
  }

  htmlIFrameElement(value: EngineValue): HTMLIFrameElement | null {
    const interfaceObject = this.interfaceObject(value);
    return interfaceObject instanceof HTMLIFrameElement
      ? interfaceObject
      : null;
  }

  htmlLinkElement(value: EngineValue): HTMLLinkElement | null {
    const interfaceObject = this.interfaceObject(value);
    return interfaceObject instanceof HTMLLinkElement ? interfaceObject : null;
  }

  htmlOutputElement(value: EngineValue): HTMLOutputElement | null {
    const interfaceObject = this.interfaceObject(value);
    return interfaceObject instanceof HTMLOutputElement
      ? interfaceObject
      : null;
  }

  htmlTableElement(value: EngineValue): HTMLTableElement | null {
    const interfaceObject = this.interfaceObject(value);
    return interfaceObject instanceof HTMLTableElement ? interfaceObject : null;
  }

  htmlTableRowElement(value: EngineValue): HTMLTableRowElement | null {
    const interfaceObject = this.interfaceObject(value);
    return interfaceObject instanceof HTMLTableRowElement
      ? interfaceObject
      : null;
  }

  htmlTableSectionElement(value: EngineValue): HTMLTableSectionElement | null {
    const interfaceObject = this.interfaceObject(value);
    return interfaceObject instanceof HTMLTableSectionElement
      ? interfaceObject
      : null;
  }

  htmlTemplateElement(value: EngineValue): HTMLTemplateElement | null {
    const interfaceObject = this.interfaceObject(value);
    return interfaceObject instanceof HTMLTemplateElement
      ? interfaceObject
      : null;
  }

  foreignAnchorElement(value: EngineValue): Element | null {
    const element = this.element(value);
    return element !== null && this.isForeignAnchor(element) ? element : null;
  }

  isForeignAnchor(element: Element): boolean {
    return isForeignAnchorElement(element);
  }

  document(value: EngineValue): Document | null {
    const interfaceObject = this.interfaceObject(value);
    return interfaceObject instanceof Document ? interfaceObject : null;
  }

  documentFragment(value: EngineValue): DocumentFragment | null {
    const interfaceObject = this.interfaceObject(value);
    return interfaceObject instanceof DocumentFragment ? interfaceObject : null;
  }

  shadowRoot(value: EngineValue): ShadowRoot | null {
    const interfaceObject = this.interfaceObject(value);
    return interfaceObject instanceof ShadowRoot ? interfaceObject : null;
  }

  domImplementation(value: EngineValue): DOMImplementation | null {
    const interfaceObject = this.interfaceObject(value);
    return interfaceObject instanceof DOMImplementation
      ? interfaceObject
      : null;
  }

  documentType(value: EngineValue): DocumentType | null {
    const interfaceObject = this.interfaceObject(value);
    return interfaceObject instanceof DocumentType ? interfaceObject : null;
  }

  event(value: EngineValue): Event | null {
    const interfaceObject = this.interfaceObject(value);
    return interfaceObject instanceof Event ? interfaceObject : null;
  }

  customEvent(value: EngineValue): CustomEvent | null {
    const interfaceObject = this.interfaceObject(value);
    return interfaceObject instanceof CustomEvent ? interfaceObject : null;
  }

  errorEvent(value: EngineValue): ErrorEvent | null {
    const interfaceObject = this.interfaceObject(value);
    return interfaceObject instanceof ErrorEvent ? interfaceObject : null;
  }

  promiseRejectionEvent(value: EngineValue): PromiseRejectionEvent | null {
    const interfaceObject = this.interfaceObject(value);
    return interfaceObject instanceof PromiseRejectionEvent
      ? interfaceObject
      : null;
  }

  messageEvent(value: EngineValue): MessageEvent | null {
    const interfaceObject = this.interfaceObject(value);
    return interfaceObject instanceof MessageEvent ? interfaceObject : null;
  }

  htmlCollection(value: EngineValue): HTMLCollection | null {
    const interfaceObject = this.interfaceObject(value);
    return interfaceObject instanceof HTMLCollection ? interfaceObject : null;
  }

  namedNodeMap(value: EngineValue): NamedNodeMap | null {
    const interfaceObject = this.interfaceObject(value);
    return interfaceObject instanceof NamedNodeMap ? interfaceObject : null;
  }

  nodeList(value: EngineValue): NodeList | null {
    const interfaceObject = this.interfaceObject(value);
    return interfaceObject instanceof NodeList ? interfaceObject : null;
  }

  domTokenList(value: EngineValue): DOMTokenList | null {
    const interfaceObject = this.interfaceObject(value);
    return interfaceObject instanceof DOMTokenList ? interfaceObject : null;
  }

  range(value: EngineValue): Range | null {
    const interfaceObject = this.interfaceObject(value);
    return interfaceObject !== null && isRange(interfaceObject)
      ? interfaceObject
      : null;
  }

  selection(value: EngineValue): Selection | null {
    const interfaceObject = this.interfaceObject(value);
    return interfaceObject !== null && isSelection(interfaceObject)
      ? interfaceObject
      : null;
  }

  staticRange(value: EngineValue): StaticRange | null {
    const interfaceObject = this.interfaceObject(value);
    return interfaceObject !== null && isStaticRange(interfaceObject)
      ? interfaceObject
      : null;
  }

  cssStyleDeclaration(value: EngineValue): CSSStyleDeclaration | null {
    const interfaceObject = this.interfaceObject(value);
    return interfaceObject instanceof CSSStyleDeclaration
      ? interfaceObject
      : null;
  }

  cssStyleProperties(value: EngineValue): CSSStyleProperties | null {
    const interfaceObject = this.interfaceObject(value);
    return interfaceObject instanceof CSSStyleProperties
      ? interfaceObject
      : null;
  }

  nodeIterator(value: EngineValue): NodeIterator | null {
    const interfaceObject = this.interfaceObject(value);
    return interfaceObject !== null && isNodeIterator(interfaceObject)
      ? interfaceObject
      : null;
  }

  treeWalker(value: EngineValue): TreeWalker | null {
    const interfaceObject = this.interfaceObject(value);
    return interfaceObject !== null && isTreeWalker(interfaceObject)
      ? interfaceObject
      : null;
  }

  stringArgument(
    argumentsList: readonly EngineValue[],
    index: number,
    operation: string,
  ): EngineResult<string> {
    return this.context.requiredString(argumentsList, index, operation);
  }

  legacyNullToEmptyStringArgument(
    argumentsList: readonly EngineValue[],
    index: number,
    operation: string,
  ): EngineResult<string> {
    const value = argumentsList[index];
    return value !== undefined && this.engine.isNull(value)
      ? normal("")
      : this.stringArgument(argumentsList, index, operation);
  }

  optionalStringArgument(
    value: EngineValue | undefined,
    fallback: string,
  ): EngineResult<string> {
    return this.context.optionalString(value, fallback);
  }

  nullableStringArgument(
    argumentsList: readonly EngineValue[],
    index: number,
    operation: string,
  ): EngineResult<string | null> {
    return this.context.nullableString(argumentsList, index, operation);
  }

  parentNodeArguments(
    argumentsList: readonly EngineValue[],
  ): EngineResult<(Node | string)[]> {
    const nodes: (Node | string)[] = [];
    for (const value of argumentsList) {
      const node = this.node(value);
      if (node !== null) {
        nodes.push(node);
        continue;
      }
      const converted = this.engine.toString(this.realm, value);
      if (converted.type === "throw") {
        return converted;
      }
      nodes.push(converted.value);
    }
    return normal(nodes);
  }

  eventListenerOptions(
    value: EngineValue | undefined,
    includeOnce: boolean,
  ): EngineResult<{
    capture: boolean;
    once: boolean;
    passive: boolean;
    signal: AbortSignal | null;
  }> {
    if (
      value === undefined ||
      this.engine.isUndefined(value) ||
      this.engine.isNull(value)
    ) {
      return normal({
        capture: false,
        once: false,
        passive: false,
        signal: null,
      });
    }
    const object = this.engine.asObject(value);
    if (object === null) {
      return normal({
        capture: this.engine.toBoolean(value),
        once: false,
        passive: false,
        signal: null,
      });
    }
    const capture = this.engine.get(this.realm, object, "capture");
    if (capture.type === "throw") {
      return capture;
    }
    if (!includeOnce) {
      return normal({
        capture: this.engine.toBoolean(capture.value),
        once: false,
        passive: false,
        signal: null,
      });
    }
    const passive = this.engine.get(this.realm, object, "passive");
    if (passive.type === "throw") {
      return passive;
    }
    const once = this.engine.get(this.realm, object, "once");
    if (once.type === "throw") {
      return once;
    }
    const signalValue = this.engine.get(this.realm, object, "signal");
    if (signalValue.type === "throw") {
      return signalValue;
    }
    let signal: AbortSignal | null = null;
    if (!this.engine.isUndefined(signalValue.value)) {
      signal = this.abortSignal(signalValue.value);
      if (signal === null) {
        return thrown(
          this.engine.createTypeError(
            this.realm,
            "The signal option is not an AbortSignal",
          ),
        );
      }
    }
    return normal({
      capture: this.engine.toBoolean(capture.value),
      once: this.engine.toBoolean(once.value),
      passive: this.engine.toBoolean(passive.value),
      signal,
    });
  }

  eventInit(value: EngineValue | undefined): EngineResult<{
    bubbles: boolean;
    cancelable: boolean;
    composed: boolean;
  }> {
    if (
      value === undefined ||
      this.engine.isUndefined(value) ||
      this.engine.isNull(value)
    ) {
      return normal({ bubbles: false, cancelable: false, composed: false });
    }
    const object = this.engine.asObject(value);
    if (object === null) {
      return thrown(
        this.engine.createTypeError(this.realm, "Event init is not an object"),
      );
    }
    const values: boolean[] = [];
    for (const name of ["bubbles", "cancelable", "composed"] as const) {
      const property = this.engine.get(this.realm, object, name);
      if (property.type === "throw") {
        return property;
      }
      values.push(this.engine.toBoolean(property.value));
    }
    return normal({
      bubbles: values[0] ?? false,
      cancelable: values[1] ?? false,
      composed: values[2] ?? false,
    });
  }

  mouseEventInit(value: EngineValue | undefined): EngineResult<{
    bubbles: boolean;
    cancelable: boolean;
    composed: boolean;
    view: EngineValue;
    detail: number;
    screenX: number;
    screenY: number;
    clientX: number;
    clientY: number;
    ctrlKey: boolean;
    shiftKey: boolean;
    altKey: boolean;
    metaKey: boolean;
    button: number;
    buttons: number;
    relatedTarget: EventTarget | null;
  }> {
    const eventInit = this.eventInit(value);
    if (eventInit.type === "throw") {
      return eventInit;
    }
    const defaultView = this.engine.fromPrimitive(null);
    if (
      value === undefined ||
      this.engine.isUndefined(value) ||
      this.engine.isNull(value)
    ) {
      return normal({
        ...eventInit.value,
        view: defaultView,
        detail: 0,
        screenX: 0,
        screenY: 0,
        clientX: 0,
        clientY: 0,
        ctrlKey: false,
        shiftKey: false,
        altKey: false,
        metaKey: false,
        button: 0,
        buttons: 0,
        relatedTarget: null,
      });
    }
    const object = this.engine.asObject(value);
    if (object === null) {
      return thrown(
        this.engine.createTypeError(
          this.realm,
          "MouseEvent init is not an object",
        ),
      );
    }
    const property = (name: string): EngineResult<EngineValue> =>
      this.engine.get(this.realm, object, name);
    const number = (
      name: string,
      bits: 16 | 32,
      signed: boolean,
    ): EngineResult<number> => {
      const result = property(name);
      if (result.type === "throw") {
        return result;
      }
      const converted = this.engine.toNumber(this.realm, result.value);
      if (converted.type === "throw") {
        return converted;
      }
      if (!Number.isFinite(converted.value) || converted.value === 0) {
        return normal(0);
      }
      const modulus = 2 ** bits;
      const unsigned =
        ((Math.trunc(converted.value) % modulus) + modulus) % modulus;
      return normal(
        signed && unsigned >= modulus / 2 ? unsigned - modulus : unsigned,
      );
    };
    const detail = number("detail", 32, true);
    if (detail.type === "throw") {
      return detail;
    }
    const view = property("view");
    if (view.type === "throw") {
      return view;
    }
    const booleans: boolean[] = [];
    for (const name of ["altKey", "ctrlKey", "metaKey", "shiftKey"] as const) {
      const result = property(name);
      if (result.type === "throw") {
        return result;
      }
      booleans.push(this.engine.toBoolean(result.value));
    }
    const numbers: number[] = [];
    for (const [name, bits, signed] of [
      ["button", 16, true],
      ["buttons", 16, false],
      ["clientX", 32, true],
      ["clientY", 32, true],
    ] as const) {
      const result = number(name, bits, signed);
      if (result.type === "throw") {
        return result;
      }
      numbers.push(result.value);
    }
    const relatedTargetValue = property("relatedTarget");
    if (relatedTargetValue.type === "throw") {
      return relatedTargetValue;
    }
    const relatedTarget =
      this.engine.isNull(relatedTargetValue.value) ||
      this.engine.isUndefined(relatedTargetValue.value)
        ? null
        : this.eventTarget(relatedTargetValue.value);
    if (
      relatedTarget === null &&
      !this.engine.isNull(relatedTargetValue.value) &&
      !this.engine.isUndefined(relatedTargetValue.value)
    ) {
      return thrown(
        this.engine.createTypeError(
          this.realm,
          "MouseEventInit.relatedTarget is not an EventTarget",
        ),
      );
    }
    const coordinates: number[] = [];
    for (const name of ["screenX", "screenY"] as const) {
      const result = number(name, 32, true);
      if (result.type === "throw") {
        return result;
      }
      coordinates.push(result.value);
    }
    return normal({
      ...eventInit.value,
      view: this.engine.isUndefined(view.value) ? defaultView : view.value,
      detail: detail.value,
      altKey: booleans[0] ?? false,
      ctrlKey: booleans[1] ?? false,
      metaKey: booleans[2] ?? false,
      shiftKey: booleans[3] ?? false,
      button: numbers[0] ?? 0,
      buttons: numbers[1] ?? 0,
      clientX: numbers[2] ?? 0,
      clientY: numbers[3] ?? 0,
      relatedTarget,
      screenX: coordinates[0] ?? 0,
      screenY: coordinates[1] ?? 0,
    });
  }

  customEventInit(value: EngineValue | undefined): EngineResult<{
    bubbles: boolean;
    cancelable: boolean;
    composed: boolean;
    detail: EngineValue;
  }> {
    const eventInit = this.eventInit(value);
    if (eventInit.type === "throw") {
      return eventInit;
    }
    if (
      value === undefined ||
      this.engine.isUndefined(value) ||
      this.engine.isNull(value)
    ) {
      return normal({
        ...eventInit.value,
        detail: this.engine.fromPrimitive(null),
      });
    }
    const object = this.engine.asObject(value);
    if (object === null) {
      return thrown(
        this.engine.createTypeError(
          this.realm,
          "CustomEvent init is not an object",
        ),
      );
    }
    const detail = this.engine.get(this.realm, object, "detail");
    if (detail.type === "throw") {
      return detail;
    }
    return normal({
      ...eventInit.value,
      detail: this.engine.isUndefined(detail.value)
        ? this.engine.fromPrimitive(null)
        : detail.value,
    });
  }

  errorEventInit(value: EngineValue | undefined): EngineResult<{
    bubbles: boolean;
    cancelable: boolean;
    composed: boolean;
    message: string;
    filename: string;
    lineno: number;
    colno: number;
    error: EngineValue;
  }> {
    const eventInit = this.eventInit(value);
    if (eventInit.type === "throw") {
      return eventInit;
    }
    if (
      value === undefined ||
      this.engine.isUndefined(value) ||
      this.engine.isNull(value)
    ) {
      return normal({
        ...eventInit.value,
        message: "",
        filename: "",
        lineno: 0,
        colno: 0,
        error: this.engine.fromPrimitive(undefined),
      });
    }
    const object = this.engine.asObject(value);
    if (object === null) {
      return thrown(
        this.engine.createTypeError(
          this.realm,
          "ErrorEvent init is not an object",
        ),
      );
    }
    const messageValue = this.engine.get(this.realm, object, "message");
    if (messageValue.type === "throw") {
      return messageValue;
    }
    const message = this.context.string(messageValue.value);
    if (message.type === "throw") {
      return message;
    }
    const filenameValue = this.engine.get(this.realm, object, "filename");
    if (filenameValue.type === "throw") {
      return filenameValue;
    }
    const filename = this.context.string(filenameValue.value, true);
    if (filename.type === "throw") {
      return filename;
    }
    const numbers: number[] = [];
    for (const name of ["lineno", "colno"] as const) {
      const numberValue = this.engine.get(this.realm, object, name);
      if (numberValue.type === "throw") {
        return numberValue;
      }
      const converted = this.engine.toNumber(this.realm, numberValue.value);
      if (converted.type === "throw") {
        return converted;
      }
      if (!Number.isFinite(converted.value) || converted.value === 0) {
        numbers.push(0);
      } else {
        const integer = Math.trunc(converted.value);
        numbers.push(
          ((integer % 0x1_0000_0000) + 0x1_0000_0000) % 0x1_0000_0000,
        );
      }
    }
    const error = this.engine.get(this.realm, object, "error");
    if (error.type === "throw") {
      return error;
    }
    return normal({
      ...eventInit.value,
      message: this.engine.isUndefined(messageValue.value) ? "" : message.value,
      filename: this.engine.isUndefined(filenameValue.value)
        ? ""
        : filename.value,
      lineno: numbers[0] ?? 0,
      colno: numbers[1] ?? 0,
      error: error.value,
    });
  }

  promiseRejectionEventInit(value: EngineValue | undefined): EngineResult<{
    bubbles: boolean;
    cancelable: boolean;
    composed: boolean;
    promise: EngineObject;
    reason: EngineValue;
  }> {
    const eventInit = this.eventInit(value);
    if (eventInit.type === "throw") {
      return eventInit;
    }
    if (
      value === undefined ||
      this.engine.isUndefined(value) ||
      this.engine.isNull(value)
    ) {
      return thrown(
        this.engine.createTypeError(
          this.realm,
          "PromiseRejectionEvent init requires a promise",
        ),
      );
    }
    const object = this.engine.asObject(value);
    if (object === null) {
      return thrown(
        this.engine.createTypeError(
          this.realm,
          "PromiseRejectionEvent init is not an object",
        ),
      );
    }
    const promise = this.engine.get(this.realm, object, "promise");
    if (promise.type === "throw") {
      return promise;
    }
    const promiseObject = this.engine.asObject(promise.value);
    if (promiseObject === null || !this.engine.isPromise(promiseObject)) {
      return thrown(
        this.engine.createTypeError(
          this.realm,
          "PromiseRejectionEvent promise is not a Promise",
        ),
      );
    }
    const reason = this.engine.get(this.realm, object, "reason");
    if (reason.type === "throw") {
      return reason;
    }
    return normal({
      ...eventInit.value,
      promise: promiseObject,
      reason: reason.value,
    });
  }

  eventListener(
    target: EventTarget,
    callbackObject: EngineObject,
  ): EngineResult<(event: Event) => void> {
    let listeners = this.listeners.get(target);
    if (listeners === undefined) {
      listeners = new Map();
      this.listeners.set(target, listeners);
    }
    const existing = listeners.get(callbackObject);
    if (existing !== undefined) {
      return normal(existing);
    }
    const callback = this.engine.asCallable(callbackObject);
    const callbackRecord =
      callback === null ? null : this.reportingCallback(callback);
    if (callbackRecord?.type === "throw") {
      return callbackRecord;
    }
    const listener = (event: Event): void => {
      const currentTarget = event.currentTarget ?? target;
      if (callbackRecord !== null) {
        this.context.invokeCallback(
          callbackRecord.value,
          this.wrap(currentTarget),
          [this.wrap(event)],
        );
        return;
      }
      const operation = this.engine.get(
        this.realm,
        callbackObject,
        "handleEvent",
      );
      if (operation.type === "throw") {
        this.reportException(operation.value);
        return;
      }
      const callable = this.engine.asCallable(operation.value);
      if (callable === null) {
        this.reportException(
          this.engine.createTypeError(
            this.realm,
            "EventListener.handleEvent is not callable",
          ),
        );
        return;
      }
      const operationRecord = this.reportingCallback(callable);
      if (operationRecord.type === "throw") {
        this.reportException(operationRecord.value);
        return;
      }
      this.context.invokeCallback(operationRecord.value, callbackObject, [
        this.wrap(event),
      ]);
    };
    listeners.set(callbackObject, listener);
    return normal(listener);
  }

  reportingCallback(callback: EngineCallable): EngineResult<CallbackRecord> {
    return this.context.runtime.createCallbackRecord(this.realm, callback, {
      exceptionBehavior: "report",
      reportException: (value) => {
        this.reportException(value);
      },
    });
  }

  setEventHandler(target: EventTarget, handler: (event: Event) => void): void {
    this.eventHandlers.set(target, handler);
  }

  dispatchEvent(target: EventTarget, event: Event): boolean {
    const handler = this.eventHandlers.get(target);
    if (handler !== undefined) {
      return dispatchDOMEvent(target, event, handler);
    }
    return dispatchDOMEvent(target, event, (dispatchedEvent) => {
      const coreHandler: unknown = Reflect.get(
        target,
        `on${dispatchedEvent.type}`,
      );
      if (typeof coreHandler === "function") {
        Reflect.apply(coreHandler, target, [dispatchedEvent]);
      }
      const callback = this.engine.get(
        this.realm,
        this.wrap(target),
        `on${dispatchedEvent.type}`,
      );
      if (callback.type === "throw") {
        this.reportException(callback.value);
        return;
      }
      const callable = this.engine.asCallable(callback.value);
      if (callable === null) {
        return;
      }
      const callbackRecord = this.reportingCallback(callable);
      if (callbackRecord.type === "throw") {
        this.reportException(callbackRecord.value);
        return;
      }
      this.context.invokeCallback(callbackRecord.value, this.wrap(target), [
        this.wrap(dispatchedEvent),
      ]);
    });
  }

  platformValue(interfaceObject: object | null): EngineResult<EngineValue> {
    return interfaceObject === null
      ? this.primitive(null)
      : normal(this.wrap(interfaceObject));
  }

  primitive(
    value: undefined | null | boolean | string | number | bigint,
  ): EngineResult<EngineValue> {
    return this.context.primitive(value);
  }

  undefined(): EngineResult<EngineValue> {
    return this.context.undefined();
  }

  typeError(message: string): EngineResult<EngineValue> {
    return this.context.typeError(message);
  }
}
