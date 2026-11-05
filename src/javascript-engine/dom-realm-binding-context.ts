import {
  AbortController,
  AbortSignal,
  Attr,
  CharacterData,
  Comment,
  CustomEvent,
  Document,
  DocumentFragment,
  DocumentType,
  DOMImplementation,
  DOMTokenList,
  Element,
  Event,
  EventTarget,
  HTMLCollection,
  NamedNodeMap,
  Node,
  NodeFilter,
  NodeList,
  Text,
} from "../dom.js";
import type { NodeIterator, TreeWalker } from "../dom.js";
import {
  CSSStyleDeclaration,
  CSSStyleProperties,
  DOMStringMap,
  HTMLAnchorElement,
  HTMLAreaElement,
  HTMLElement,
  HTMLIFrameElement,
  HTMLLinkElement,
  HTMLOutputElement,
  HTMLTemplateElement,
} from "../html-elements.js";
import { implementationFor, interfaceFor } from "../dom/binding.js";
import { DOMException as HostDOMException } from "../dom-exception.js";
import type { DOMParser } from "../dom-parser.js";
import {
  htmlCollectionSupportedPropertyNames,
  namedNodeMapSupportedPropertyNames,
} from "../dom/collections.js";
import {
  isNodeIterator,
  isTreeWalker,
  type NodeFilter as NodeFilterCallback,
} from "../dom/traversal.js";
import { MATHML_NAMESPACE, SVG_NAMESPACE } from "../namespaces.js";
import { normal, thrown } from "./adapter.js";
import type {
  EngineCallable,
  EngineHostFunction,
  EngineObject,
  EngineRealm,
  EngineResult,
  EngineValue,
  JavaScriptEngineAdapter,
} from "./adapter.js";
import { RealmBindingContext } from "./realm-binding-context.js";

import {
  installInterfaces,
  installEventTargetMembers,
  installAbortMembers,
  installNodeMembers,
  installCharacterDataMembers,
  installElementMembers,
  installForeignAnchorMembers,
  installHTMLElementMembers,
  installDocumentMembers,
  installHTMLAnchorElementMembers,
  installHTMLAreaElementMembers,
  installHTMLIFrameElementMembers,
  installHTMLLinkElementMembers,
  installHTMLOutputElementMembers,
  installHTMLTemplateElementMembers,
  installDocumentFragmentMembers,
  installDocumentTypeMembers,
  installDOMImplementationMembers,
  installDOMParserMembers,
  installXMLSerializerMembers,
  installEventMembers,
  installHTMLCollectionMembers,
  installNamedNodeMapMembers,
  installNodeListMembers,
  installDOMTokenListMembers,
  installCSSStyleDeclarationMembers,
  installCSSStylePropertiesMembers,
  installNodeIteratorMembers,
  installTreeWalkerMembers,
} from "./dom-realm-interface-installers.js";

const DATA_PROPERTY = {
  configurable: true,
  enumerable: true,
  writable: true,
} as const;

const DOM_EXCEPTION_NAME_CODES: Readonly<Record<string, number>> = {
  IndexSizeError: 1,
  DOMStringSizeError: 2,
  HierarchyRequestError: 3,
  WrongDocumentError: 4,
  InvalidCharacterError: 5,
  NoDataAllowedError: 6,
  NoModificationAllowedError: 7,
  NotFoundError: 8,
  NotSupportedError: 9,
  InUseAttributeError: 10,
  InvalidStateError: 11,
  SyntaxError: 12,
  InvalidModificationError: 13,
  NamespaceError: 14,
  InvalidAccessError: 15,
  ValidationError: 16,
  TypeMismatchError: 17,
  SecurityError: 18,
  NetworkError: 19,
  AbortError: 20,
  URLMismatchError: 21,
  QuotaExceededError: 22,
  TimeoutError: 23,
  InvalidNodeTypeError: 24,
  DataCloneError: 25,
};

class EngineRealmException extends Error {
  constructor(readonly value: EngineValue) {
    super("JavaScript realm exception");
  }
}

const LEGACY_PLATFORM_OBJECT_FACTORY = `(
  target,
  indexedNames,
  indexedValue,
  namedNames,
  namedValue,
  namedSetter,
  namedDeleter,
  namedEnumerable,
  overrideBuiltins
) => {
  const isArrayIndex = (property) => {
    if (
      typeof property !== "string" ||
      !/^(0|[1-9]\\d*)$/.test(property)
    ) {
      return false;
    }
    return Number(property) < 4294967295;
  };
  const supportedIndices = () =>
    indexedNames === null ? [] : indexedNames();
  const supportedNames = () => namedNames === null ? [] : namedNames();
  const hasIndex = (property) =>
    isArrayIndex(property) && supportedIndices().includes(property);
  const hasName = (property) =>
    typeof property === "string" &&
    !isArrayIndex(property) &&
    supportedNames().includes(property) &&
    (overrideBuiltins || !Reflect.has(target, property));
  let proxy;
  proxy = new Proxy(target, {
    get(target, property, receiver) {
      if (hasIndex(property)) {
        return indexedValue(property);
      }
      if (hasName(property)) {
        return namedValue(property);
      }
      return Reflect.get(target, property, receiver);
    },
    has(target, property) {
      return hasIndex(property) || hasName(property) || Reflect.has(target, property);
    },
    ownKeys(target) {
      const targetKeys = Reflect.ownKeys(target);
      const indices = supportedIndices();
      const names = supportedNames().filter(
        (name) =>
          !indices.includes(name) &&
          !isArrayIndex(name) &&
          !targetKeys.includes(name) &&
          (overrideBuiltins || !Reflect.has(target, name)),
      );
      return [
        ...indices,
        ...names,
        ...targetKeys.filter(
          (key) => !indices.includes(key) && !names.includes(key),
        ),
      ];
    },
    getOwnPropertyDescriptor(target, property) {
      if (hasIndex(property)) {
        return {
          value: indexedValue(property),
          writable: false,
          enumerable: true,
          configurable: true,
        };
      }
      if (hasName(property)) {
        return {
          value: namedValue(property),
          writable: namedSetter !== null,
          enumerable: namedEnumerable,
          configurable: true,
        };
      }
      return Reflect.getOwnPropertyDescriptor(target, property);
    },
    set(target, property, value, receiver) {
      if (receiver !== proxy) {
        return Reflect.set(target, property, value, receiver);
      }
      if (isArrayIndex(property)) {
        return false;
      }
      if (
        namedSetter !== null &&
        typeof property === "string" &&
        (overrideBuiltins || !Reflect.has(target, property))
      ) {
        namedSetter(property, value);
        return true;
      }
      if (hasName(property)) {
        return false;
      }
      return Reflect.set(target, property, value, target);
    },
    defineProperty(target, property, descriptor) {
      if (isArrayIndex(property) || hasName(property)) {
        return false;
      }
      if (
        namedSetter !== null &&
        typeof property === "string" &&
        "value" in descriptor &&
        (overrideBuiltins || !Reflect.has(target, property))
      ) {
        namedSetter(property, descriptor.value);
        return true;
      }
      return Reflect.defineProperty(target, property, descriptor);
    },
    deleteProperty(target, property) {
      if (hasIndex(property)) {
        return false;
      }
      if (
        namedDeleter !== null &&
        typeof property === "string" &&
        (overrideBuiltins || !Reflect.has(target, property))
      ) {
        namedDeleter(property);
        return true;
      }
      if (hasName(property)) {
        return false;
      }
      return Reflect.deleteProperty(target, property);
    },
  });
  return proxy;
}`;

type LegacyPlatformValue =
  object | undefined | null | boolean | string | number;

interface LegacyPlatformObjectConfiguration {
  readonly indexedLength?: () => number;
  readonly indexedValue?: (index: number) => LegacyPlatformValue;
  readonly namedNames?: () => readonly string[];
  readonly namedValue?: (name: string) => LegacyPlatformValue;
  readonly namedSet?: (name: string, value: string) => void;
  readonly namedDelete?: (name: string) => void;
  readonly namedEnumerable?: boolean;
  readonly overrideBuiltins?: boolean;
}

interface TraversalFilterArgument {
  readonly callback: NodeFilterCallback | null;
  readonly value: EngineValue | null;
}

type ParentNodeObject = Document | DocumentFragment | Element;
type ChildNodeObject = DocumentType | Element | CharacterData;

export class DOMRealmBindingContext {
  readonly engine: JavaScriptEngineAdapter;
  readonly realm: EngineRealm;
  readonly context: RealmBindingContext;
  readonly platformObjects = new WeakMap<object, EngineObject>();
  readonly implementations = new WeakMap<EngineObject, object>();
  readonly customEventDetails = new WeakMap<CustomEvent, EngineValue>();
  readonly listeners = new WeakMap<
    EventTarget,
    Map<EngineCallable, (event: Event) => void>
  >();
  readonly legacyPlatformObjectFactory: EngineCallable;
  readonly eventTargetPrototype: EngineObject;
  readonly abortSignalPrototype: EngineObject;
  readonly abortControllerPrototype: EngineObject;
  readonly nodePrototype: EngineObject;
  readonly characterDataPrototype: EngineObject;
  readonly textPrototype: EngineObject;
  readonly commentPrototype: EngineObject;
  readonly attrPrototype: EngineObject;
  readonly elementPrototype: EngineObject;
  readonly foreignAnchorPrototype: EngineObject;
  readonly htmlElementPrototype: EngineObject;
  readonly htmlAnchorElementPrototype: EngineObject;
  readonly htmlAreaElementPrototype: EngineObject;
  readonly htmlIFrameElementPrototype: EngineObject;
  readonly htmlLinkElementPrototype: EngineObject;
  readonly htmlOutputElementPrototype: EngineObject;
  readonly htmlTemplateElementPrototype: EngineObject;
  readonly documentPrototype: EngineObject;
  readonly documentFragmentPrototype: EngineObject;
  readonly documentTypePrototype: EngineObject;
  readonly domImplementationPrototype: EngineObject;
  readonly domParserPrototype: EngineObject;
  readonly xmlSerializerPrototype: EngineObject;
  readonly xmlDocumentPrototype: EngineObject;
  readonly eventPrototype: EngineObject;
  readonly customEventPrototype: EngineObject;
  readonly htmlCollectionPrototype: EngineObject;
  readonly namedNodeMapPrototype: EngineObject;
  readonly nodeListPrototype: EngineObject;
  readonly domTokenListPrototype: EngineObject;
  readonly domExceptionPrototype: EngineObject;
  readonly nodeIteratorPrototype: EngineObject;
  readonly treeWalkerPrototype: EngineObject;
  readonly domStringMapPrototype: EngineObject;
  readonly cssStyleDeclarationPrototype: EngineObject;
  readonly cssStylePropertiesPrototype: EngineObject;
  readonly foreignAnchorRelLists = new WeakMap<Element, DOMTokenList>();
  readonly traversalFilters = new WeakMap<object, EngineValue>();
  readonly domParsers = new WeakMap<EngineObject, DOMParser>();
  readonly xmlSerializers = new WeakSet<EngineObject>();

  constructor(engine: JavaScriptEngineAdapter, realm: EngineRealm) {
    this.engine = engine;
    this.realm = realm;
    this.context = new RealmBindingContext(engine, realm);

    const factory = this.engine.evaluate(
      this.realm,
      LEGACY_PLATFORM_OBJECT_FACTORY,
    );
    const factoryCallable =
      factory.type === "normal" ? this.engine.asCallable(factory.value) : null;
    if (factoryCallable === null) {
      const message =
        factory.type === "throw"
          ? this.engine.exceptionMessage(this.realm, factory.value)
          : "Legacy platform object factory is not callable";
      throw new TypeError(message);
    }
    this.legacyPlatformObjectFactory = factoryCallable;

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
    this.commentPrototype = this.engine.createObject(
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
    this.foreignAnchorPrototype = this.engine.createObject(
      this.realm,
      this.elementPrototype,
    );
    this.htmlElementPrototype = this.engine.createObject(
      this.realm,
      this.elementPrototype,
    );
    this.htmlAnchorElementPrototype = this.engine.createObject(
      this.realm,
      this.htmlElementPrototype,
    );
    this.htmlAreaElementPrototype = this.engine.createObject(
      this.realm,
      this.htmlElementPrototype,
    );
    this.htmlIFrameElementPrototype = this.engine.createObject(
      this.realm,
      this.htmlElementPrototype,
    );
    this.htmlLinkElementPrototype = this.engine.createObject(
      this.realm,
      this.htmlElementPrototype,
    );
    this.htmlOutputElementPrototype = this.engine.createObject(
      this.realm,
      this.htmlElementPrototype,
    );
    this.htmlTemplateElementPrototype = this.engine.createObject(
      this.realm,
      this.htmlElementPrototype,
    );
    this.documentPrototype = this.engine.createObject(
      this.realm,
      this.nodePrototype,
    );
    this.documentFragmentPrototype = this.engine.createObject(
      this.realm,
      this.nodePrototype,
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
    this.xmlDocumentPrototype = this.engine.createObject(
      this.realm,
      this.documentPrototype,
    );
    this.eventPrototype = this.engine.createObject(this.realm, objectPrototype);
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

    installInterfaces(this);
    installEventTargetMembers(this);
    installAbortMembers(this);
    installNodeMembers(this);
    installCharacterDataMembers(this);
    installElementMembers(this);
    installForeignAnchorMembers(this);
    installHTMLElementMembers(this);
    installHTMLAnchorElementMembers(this);
    installHTMLAreaElementMembers(this);
    installHTMLIFrameElementMembers(this);
    installHTMLLinkElementMembers(this);
    installHTMLOutputElementMembers(this);
    installHTMLTemplateElementMembers(this);
    installDocumentMembers(this);
    installDocumentFragmentMembers(this);
    installDocumentTypeMembers(this);
    installDOMImplementationMembers(this);
    installDOMParserMembers(this);
    installXMLSerializerMembers(this);
    installEventMembers(this);
    installHTMLCollectionMembers(this);
    installNamedNodeMapMembers(this);
    installNodeListMembers(this);
    installDOMTokenListMembers(this);
    installCSSStyleDeclarationMembers(this);
    installCSSStylePropertiesMembers(this);
    installNodeIteratorMembers(this);
    installTreeWalkerMembers(this);
  }

  expose(name: string, interfaceObject: object): void {
    this.engine.defineDataProperty(
      this.engine.globalObject(this.realm),
      name,
      this.wrap(interfaceObject),
      DATA_PROPERTY,
    );
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
    this.implementations.set(platformObject, implementation);
  }

  associatePlatformObject(
    interfaceObject: object,
    platformObject: EngineObject,
  ): void {
    this.implementations.set(
      platformObject,
      implementationFor(interfaceObject),
    );
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
        ? document.createNodeIterator(
            root,
            whatToShow.value,
            filter.value.callback,
          )
        : document.createTreeWalker(
            root,
            whatToShow.value,
            filter.value.callback,
          );
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

  callTraversalFilter(filter: EngineValue, node: Node): number {
    let callable = this.engine.asCallable(filter);
    let receiver = this.engine.fromPrimitive(undefined);
    if (callable === null) {
      const object = this.engine.asObject(filter);
      if (object === null) {
        throw new EngineRealmException(
          this.engine.createTypeError(this.realm, "Invalid NodeFilter"),
        );
      }
      const acceptNode = this.engine.get(this.realm, object, "acceptNode");
      if (acceptNode.type === "throw") {
        throw new EngineRealmException(acceptNode.value);
      }
      callable = this.engine.asCallable(acceptNode.value);
      if (callable === null) {
        throw new EngineRealmException(
          this.engine.createTypeError(
            this.realm,
            "NodeFilter.acceptNode is not callable",
          ),
        );
      }
      receiver = filter;
    }
    const result = this.engine.call(this.realm, callable, receiver, [
      this.wrap(node),
    ]);
    if (result.type === "throw") {
      throw new EngineRealmException(result.value);
    }
    const converted = this.engine.toNumber(this.realm, result.value);
    if (converted.type === "throw") {
      throw new EngineRealmException(converted.value);
    }
    return converted.value;
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

  traversalResult(callback: () => Node | null): EngineResult<EngineValue> {
    try {
      return this.platformValue(callback());
    } catch (error: unknown) {
      if (error instanceof EngineRealmException) {
        return thrown(error.value);
      }
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
    const code = DOM_EXCEPTION_NAME_CODES[name] ?? 0;
    for (const [property, value] of [
      ["message", message],
      ["name", name],
      ["code", code],
    ] as const) {
      this.engine.defineDataProperty(
        exception,
        property,
        this.engine.fromPrimitive(value),
        { configurable: true, enumerable: false, writable: true },
      );
    }
    return exception;
  }

  interfaceTag(prototype: EngineObject, name: string): void {
    this.context.tag(prototype, name);
  }

  installIterator(
    prototype: EngineObject,
    collection: (value: EngineValue) => Iterable<object> | null,
    interfaceName: string,
  ): void {
    this.engine.defineDataProperty(
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
    this.context.method(prototype, name, length, callback);
  }

  attribute(
    prototype: EngineObject,
    name: string,
    getter: EngineHostFunction,
    setter: EngineHostFunction | null = null,
  ): void {
    this.context.attribute(prototype, name, getter, setter);
  }

  legacyPlatformObject(
    target: EngineObject,
    configuration: LegacyPlatformObjectConfiguration,
  ): EngineObject {
    const nullValue = this.engine.fromPrimitive(null);
    const indexedNames =
      configuration.indexedLength === undefined
        ? nullValue
        : this.engine.createFunction(this.realm, "indexedNames", 0, () => {
            const names = Array.from(
              { length: configuration.indexedLength?.() ?? 0 },
              (_value, index) => this.engine.fromPrimitive(String(index)),
            );
            return normal(this.engine.createArray(this.realm, names));
          });
    const indexedValue =
      configuration.indexedValue === undefined
        ? nullValue
        : this.engine.createFunction(
            this.realm,
            "indexedValue",
            1,
            (_thisValue, argumentsList) => {
              const property = this.stringArgument(
                argumentsList,
                0,
                "indexedValue",
              );
              return property.type === "throw"
                ? property
                : this.legacyValue(
                    configuration.indexedValue?.(Number(property.value)),
                  );
            },
          );
    const namedNames =
      configuration.namedNames === undefined
        ? nullValue
        : this.engine.createFunction(this.realm, "namedNames", 0, () => {
            const names =
              configuration
                .namedNames?.()
                .map((name) => this.engine.fromPrimitive(name)) ?? [];
            return normal(this.engine.createArray(this.realm, names));
          });
    const namedValue =
      configuration.namedValue === undefined
        ? nullValue
        : this.engine.createFunction(
            this.realm,
            "namedValue",
            1,
            (_thisValue, argumentsList) => {
              const name = this.stringArgument(argumentsList, 0, "namedValue");
              return name.type === "throw"
                ? name
                : this.legacyValue(configuration.namedValue?.(name.value));
            },
          );
    const namedSetter =
      configuration.namedSet === undefined
        ? nullValue
        : this.engine.createFunction(
            this.realm,
            "namedSetter",
            2,
            (_thisValue, argumentsList) => {
              const name = this.stringArgument(argumentsList, 0, "namedSetter");
              if (name.type === "throw") {
                return name;
              }
              const value = argumentsList[1];
              if (value === undefined) {
                return this.typeError("namedSetter requires 2 argument(s)");
              }
              const converted = this.engine.toString(this.realm, value);
              if (converted.type === "throw") {
                return converted;
              }
              configuration.namedSet?.(name.value, converted.value);
              return this.undefined();
            },
          );
    const namedDeleter =
      configuration.namedDelete === undefined
        ? nullValue
        : this.engine.createFunction(
            this.realm,
            "namedDeleter",
            1,
            (_thisValue, argumentsList) => {
              const name = this.stringArgument(
                argumentsList,
                0,
                "namedDeleter",
              );
              if (name.type === "throw") {
                return name;
              }
              configuration.namedDelete?.(name.value);
              return this.undefined();
            },
          );
    const result = this.engine.call(
      this.realm,
      this.legacyPlatformObjectFactory,
      this.engine.fromPrimitive(undefined),
      [
        target,
        indexedNames,
        indexedValue,
        namedNames,
        namedValue,
        namedSetter,
        namedDeleter,
        this.engine.fromPrimitive(configuration.namedEnumerable ?? false),
        this.engine.fromPrimitive(configuration.overrideBuiltins ?? false),
      ],
    );
    if (result.type === "throw") {
      throw new TypeError(
        this.engine.exceptionMessage(this.realm, result.value),
      );
    }
    const proxy = this.engine.asObject(result.value);
    if (proxy === null) {
      throw new TypeError(
        "Legacy platform object factory returned a primitive",
      );
    }
    return proxy;
  }

  legacyValue(value: LegacyPlatformValue): EngineResult<EngineValue> {
    return typeof value === "object" && value !== null
      ? normal(this.wrap(value))
      : this.primitive(value);
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
      : this.engine.call(this.realm, callable, array, []);
  }

  wrap(interfaceObject: object): EngineObject {
    const implementation = implementationFor(interfaceObject);
    const existing = this.platformObjects.get(implementation);
    if (existing !== undefined) {
      return existing;
    }
    const prototype = this.prototype(interfaceObject);
    const target = this.engine.createObject(this.realm, prototype);
    let platformObject = target;
    if (interfaceObject instanceof HTMLCollection) {
      const collection = interfaceObject as HTMLCollection<Element, Element>;
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
      const list = interfaceObject as NodeList;
      platformObject = this.legacyPlatformObject(target, {
        indexedLength: () => list.length,
        indexedValue: (index) => list.item(index),
      });
    } else if (interfaceObject instanceof DOMTokenList) {
      platformObject = this.legacyPlatformObject(target, {
        indexedLength: () => interfaceObject.length,
        indexedValue: (index) => interfaceObject.item(index),
      });
    } else if (interfaceObject instanceof CSSStyleDeclaration) {
      platformObject = this.legacyPlatformObject(target, {
        indexedLength: () => interfaceObject.length,
        indexedValue: (index) => interfaceObject.item(index),
      });
    } else if (interfaceObject instanceof DOMStringMap) {
      platformObject = this.legacyPlatformObject(target, {
        namedNames: () => Object.getOwnPropertyNames(interfaceObject),
        namedValue: (name) => interfaceObject[name],
        namedSet: (name, value) => {
          interfaceObject[name] = value;
        },
        namedDelete: (name) => {
          Reflect.deleteProperty(interfaceObject, name);
        },
        namedEnumerable: true,
        overrideBuiltins: true,
      });
    }
    this.platformObjects.set(implementation, platformObject);
    this.implementations.set(target, implementation);
    this.implementations.set(platformObject, implementation);
    return platformObject;
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
    if (interfaceObject instanceof Document) {
      return this.documentPrototype;
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
    if (interfaceObject instanceof Text) {
      return this.textPrototype;
    }
    if (interfaceObject instanceof Comment) {
      return this.commentPrototype;
    }
    if (interfaceObject instanceof CharacterData) {
      return this.characterDataPrototype;
    }
    if (interfaceObject instanceof Attr) {
      return this.attrPrototype;
    }
    if (interfaceObject instanceof HTMLAnchorElement) {
      return this.htmlAnchorElementPrototype;
    }
    if (interfaceObject instanceof HTMLAreaElement) {
      return this.htmlAreaElementPrototype;
    }
    if (interfaceObject instanceof HTMLIFrameElement) {
      return this.htmlIFrameElementPrototype;
    }
    if (interfaceObject instanceof HTMLLinkElement) {
      return this.htmlLinkElementPrototype;
    }
    if (interfaceObject instanceof HTMLOutputElement) {
      return this.htmlOutputElementPrototype;
    }
    if (interfaceObject instanceof HTMLTemplateElement) {
      return this.htmlTemplateElementPrototype;
    }
    if (interfaceObject instanceof HTMLElement) {
      return this.htmlElementPrototype;
    }
    if (interfaceObject instanceof Element) {
      return this.isForeignAnchor(interfaceObject)
        ? this.foreignAnchorPrototype
        : this.elementPrototype;
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
    if (interfaceObject instanceof DOMTokenList) {
      return this.domTokenListPrototype;
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
    throw new TypeError("Unsupported DOM platform object");
  }

  interfaceObject(value: EngineValue): object | null {
    const object = this.engine.asObject(value);
    if (object === null) {
      return null;
    }
    const implementation = this.implementations.get(object);
    return implementation === undefined ? null : interfaceFor(implementation);
  }

  eventTarget(value: EngineValue): EventTarget | null {
    const interfaceObject = this.engine.isUndefined(value)
      ? this.interfaceObject(this.engine.globalThis(this.realm))
      : this.interfaceObject(value);
    return interfaceObject instanceof EventTarget ? interfaceObject : null;
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

  characterData(value: EngineValue): CharacterData | null {
    const interfaceObject = this.interfaceObject(value);
    return interfaceObject instanceof CharacterData ? interfaceObject : null;
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
    return (
      element.localName === "a" &&
      (element.namespaceURI === SVG_NAMESPACE ||
        element.namespaceURI === MATHML_NAMESPACE)
    );
  }

  document(value: EngineValue): Document | null {
    const interfaceObject = this.interfaceObject(value);
    return interfaceObject instanceof Document ? interfaceObject : null;
  }

  documentFragment(value: EngineValue): DocumentFragment | null {
    const interfaceObject = this.interfaceObject(value);
    return interfaceObject instanceof DocumentFragment ? interfaceObject : null;
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

  htmlCollection(value: EngineValue): HTMLCollection<Element, Element> | null {
    const interfaceObject = this.interfaceObject(value);
    return interfaceObject instanceof HTMLCollection
      ? (interfaceObject as HTMLCollection<Element, Element>)
      : null;
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

  eventListener(
    target: EventTarget,
    callback: EngineCallable,
  ): (event: Event) => void {
    let listeners = this.listeners.get(target);
    if (listeners === undefined) {
      listeners = new Map();
      this.listeners.set(target, listeners);
    }
    const existing = listeners.get(callback);
    if (existing !== undefined) {
      return existing;
    }
    const listener = (event: Event): void => {
      const currentTarget = event.currentTarget ?? target;
      const result = this.engine.call(
        this.realm,
        callback,
        this.wrap(currentTarget),
        [this.wrap(event)],
      );
      if (result.type === "throw") {
        throw new Error(this.engine.exceptionMessage(this.realm, result.value));
      }
    };
    listeners.set(callback, listener);
    return listener;
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
