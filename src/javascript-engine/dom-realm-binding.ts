import {
  AbortController,
  AbortSignal,
  Attr,
  CustomEvent,
  Document,
  Element,
  Event,
  EventTarget,
  HTMLCollection,
  NamedNodeMap,
  Node,
  NodeList,
} from "../dom.js";
import {
  DOMStringMap,
  HTMLAnchorElement,
  HTMLElement,
} from "../html-elements.js";
import { implementationFor, interfaceFor } from "../dom/binding.js";
import {
  htmlCollectionSupportedPropertyNames,
  namedNodeMapSupportedPropertyNames,
} from "../dom/collections.js";
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

const DATA_PROPERTY = {
  configurable: true,
  enumerable: true,
  writable: true,
} as const;

const ATTRIBUTE_PROPERTY = {
  configurable: true,
  enumerable: true,
} as const;

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

export class DOMRealmBinding {
  readonly #engine: JavaScriptEngineAdapter;
  readonly #realm: EngineRealm;
  readonly #platformObjects = new WeakMap<object, EngineObject>();
  readonly #implementations = new WeakMap<EngineObject, object>();
  readonly #customEventDetails = new WeakMap<CustomEvent, EngineValue>();
  readonly #listeners = new WeakMap<
    EventTarget,
    Map<EngineCallable, (event: Event) => void>
  >();
  readonly #legacyPlatformObjectFactory: EngineCallable;
  readonly #eventTargetPrototype: EngineObject;
  readonly #abortSignalPrototype: EngineObject;
  readonly #abortControllerPrototype: EngineObject;
  readonly #nodePrototype: EngineObject;
  readonly #attrPrototype: EngineObject;
  readonly #elementPrototype: EngineObject;
  readonly #htmlElementPrototype: EngineObject;
  readonly #htmlAnchorElementPrototype: EngineObject;
  readonly #documentPrototype: EngineObject;
  readonly #xmlDocumentPrototype: EngineObject;
  readonly #eventPrototype: EngineObject;
  readonly #customEventPrototype: EngineObject;
  readonly #htmlCollectionPrototype: EngineObject;
  readonly #namedNodeMapPrototype: EngineObject;
  readonly #nodeListPrototype: EngineObject;
  readonly #domStringMapPrototype: EngineObject;

  constructor(engine: JavaScriptEngineAdapter, realm: EngineRealm) {
    this.#engine = engine;
    this.#realm = realm;

    const factory = this.#engine.evaluate(
      this.#realm,
      LEGACY_PLATFORM_OBJECT_FACTORY,
    );
    const factoryCallable =
      factory.type === "normal" ? this.#engine.asCallable(factory.value) : null;
    if (factoryCallable === null) {
      const message =
        factory.type === "throw"
          ? this.#engine.exceptionMessage(this.#realm, factory.value)
          : "Legacy platform object factory is not callable";
      throw new TypeError(message);
    }
    this.#legacyPlatformObjectFactory = factoryCallable;

    const objectPrototype = this.#engine.objectPrototype(this.#realm);
    this.#eventTargetPrototype = this.#engine.createObject(
      this.#realm,
      objectPrototype,
    );
    this.#abortSignalPrototype = this.#engine.createObject(
      this.#realm,
      this.#eventTargetPrototype,
    );
    this.#abortControllerPrototype = this.#engine.createObject(
      this.#realm,
      objectPrototype,
    );
    this.#nodePrototype = this.#engine.createObject(
      this.#realm,
      this.#eventTargetPrototype,
    );
    this.#attrPrototype = this.#engine.createObject(
      this.#realm,
      this.#nodePrototype,
    );
    this.#elementPrototype = this.#engine.createObject(
      this.#realm,
      this.#nodePrototype,
    );
    this.#htmlElementPrototype = this.#engine.createObject(
      this.#realm,
      this.#elementPrototype,
    );
    this.#htmlAnchorElementPrototype = this.#engine.createObject(
      this.#realm,
      this.#htmlElementPrototype,
    );
    this.#documentPrototype = this.#engine.createObject(
      this.#realm,
      this.#nodePrototype,
    );
    this.#xmlDocumentPrototype = this.#engine.createObject(
      this.#realm,
      this.#documentPrototype,
    );
    this.#eventPrototype = this.#engine.createObject(
      this.#realm,
      objectPrototype,
    );
    this.#customEventPrototype = this.#engine.createObject(
      this.#realm,
      this.#eventPrototype,
    );
    this.#htmlCollectionPrototype = this.#engine.createObject(
      this.#realm,
      objectPrototype,
    );
    this.#namedNodeMapPrototype = this.#engine.createObject(
      this.#realm,
      objectPrototype,
    );
    this.#nodeListPrototype = this.#engine.createObject(
      this.#realm,
      objectPrototype,
    );
    this.#domStringMapPrototype = this.#engine.createObject(
      this.#realm,
      objectPrototype,
    );

    this.#installInterfaces();
    this.#installEventTargetMembers();
    this.#installAbortMembers();
    this.#installNodeMembers();
    this.#installElementMembers();
    this.#installHTMLElementMembers();
    this.#installHTMLAnchorElementMembers();
    this.#installDocumentMembers();
    this.#installEventMembers();
    this.#installHTMLCollectionMembers();
    this.#installNamedNodeMapMembers();
    this.#installNodeListMembers();
  }

  expose(name: string, interfaceObject: object): void {
    this.#engine.defineDataProperty(
      this.#engine.globalObject(this.#realm),
      name,
      this.#wrap(interfaceObject),
      DATA_PROPERTY,
    );
  }

  get eventTargetPrototype(): EngineObject {
    return this.#eventTargetPrototype;
  }

  platformObject(interfaceObject: object): EngineObject {
    return this.#wrap(interfaceObject);
  }

  bindPlatformObject(
    interfaceObject: object,
    platformObject: EngineObject,
  ): void {
    const implementation = implementationFor(interfaceObject);
    this.#platformObjects.set(implementation, platformObject);
    this.#implementations.set(platformObject, implementation);
  }

  associatePlatformObject(
    interfaceObject: object,
    platformObject: EngineObject,
  ): void {
    this.#implementations.set(
      platformObject,
      implementationFor(interfaceObject),
    );
  }

  interfaceObject(value: EngineValue): object | null {
    return this.#interfaceObject(value);
  }

  #installInterfaces(): void {
    this.#installInterface("EventTarget", this.#eventTargetPrototype, 0, () =>
      normal(this.#wrap(new EventTarget())),
    );
    this.#installInterface("AbortSignal", this.#abortSignalPrototype);
    this.#installInterface(
      "AbortController",
      this.#abortControllerPrototype,
      0,
      () => normal(this.#wrap(new AbortController())),
    );
    this.#installInterface("Node", this.#nodePrototype);
    this.#installInterface("Attr", this.#attrPrototype);
    this.#installInterface("Element", this.#elementPrototype);
    this.#installInterface("HTMLElement", this.#htmlElementPrototype);
    this.#installInterface(
      "HTMLAnchorElement",
      this.#htmlAnchorElementPrototype,
    );
    this.#installInterface("Document", this.#documentPrototype, 0, () =>
      normal(this.#wrap(new Document())),
    );
    this.#installInterface("XMLDocument", this.#xmlDocumentPrototype);
    this.#installInterface("HTMLCollection", this.#htmlCollectionPrototype);
    this.#installInterface("NamedNodeMap", this.#namedNodeMapPrototype);
    this.#installInterface("NodeList", this.#nodeListPrototype);
    this.#installInterface("DOMStringMap", this.#domStringMapPrototype);
    const eventConstructor = this.#installInterface(
      "Event",
      this.#eventPrototype,
      1,
      (_thisValue, argumentsList) => {
        const type = this.#stringArgument(argumentsList, 0, "Event");
        if (type.type === "throw") {
          return type;
        }
        const eventInit = this.#eventInit(argumentsList[1]);
        return eventInit.type === "throw"
          ? eventInit
          : normal(this.#wrap(new Event(type.value, eventInit.value)));
      },
    );
    for (const [name, value] of [
      ["NONE", Event.NONE],
      ["CAPTURING_PHASE", Event.CAPTURING_PHASE],
      ["AT_TARGET", Event.AT_TARGET],
      ["BUBBLING_PHASE", Event.BUBBLING_PHASE],
    ] as const) {
      for (const target of [eventConstructor, this.#eventPrototype]) {
        this.#engine.defineDataProperty(
          target,
          name,
          this.#engine.fromPrimitive(value),
          {
            configurable: false,
            enumerable: true,
            writable: false,
          },
        );
      }
    }
    this.#installInterface(
      "CustomEvent",
      this.#customEventPrototype,
      1,
      (_thisValue, argumentsList) => {
        const type = this.#stringArgument(argumentsList, 0, "CustomEvent");
        if (type.type === "throw") {
          return type;
        }
        const eventInit = this.#customEventInit(argumentsList[1]);
        if (eventInit.type === "throw") {
          return eventInit;
        }
        const event = new CustomEvent(type.value, eventInit.value);
        this.#customEventDetails.set(event, eventInit.value.detail);
        return normal(this.#wrap(event));
      },
    );
  }

  #installInterface(
    name: string,
    prototype: EngineObject,
    length = 0,
    construct: EngineHostFunction | null = null,
  ): EngineObject {
    const constructor =
      construct === null
        ? this.#engine.createFunction(this.#realm, name, length, () =>
            this.#typeError("Illegal constructor"),
          )
        : this.#engine.createConstructor(this.#realm, name, length, construct);
    this.#engine.defineDataProperty(constructor, "prototype", prototype, {
      configurable: false,
      enumerable: false,
      writable: false,
    });
    this.#engine.defineDataProperty(prototype, "constructor", constructor, {
      configurable: true,
      enumerable: false,
      writable: true,
    });
    this.#engine.defineDataProperty(
      this.#engine.globalObject(this.#realm),
      name,
      constructor,
      {
        configurable: true,
        enumerable: false,
        writable: true,
      },
    );
    return constructor;
  }

  #installEventTargetMembers(): void {
    this.#method(
      this.#eventTargetPrototype,
      "addEventListener",
      2,
      (thisValue, argumentsList) => {
        const target = this.#eventTarget(thisValue);
        if (target === null) {
          return this.#typeError("Invalid EventTarget receiver");
        }
        const type = this.#stringArgument(argumentsList, 0, "addEventListener");
        if (type.type === "throw") {
          return type;
        }
        const options = this.#eventListenerOptions(argumentsList[2], true);
        if (options.type === "throw") {
          return options;
        }
        const callbackValue = argumentsList[1];
        if (
          callbackValue === undefined ||
          this.#engine.isNull(callbackValue) ||
          this.#engine.isUndefined(callbackValue)
        ) {
          return this.#undefined();
        }
        const callback = this.#engine.asCallable(callbackValue);
        if (callback === null) {
          return this.#typeError("The event listener is not callable");
        }
        const signal = options.value.signal;
        const listenerOptions =
          signal === null
            ? {
                capture: options.value.capture,
                once: options.value.once,
                passive: options.value.passive,
              }
            : {
                capture: options.value.capture,
                once: options.value.once,
                passive: options.value.passive,
                signal,
              };
        target.addEventListener(
          type.value,
          this.#eventListener(target, callback),
          listenerOptions,
        );
        return this.#undefined();
      },
    );
    this.#method(
      this.#eventTargetPrototype,
      "removeEventListener",
      2,
      (thisValue, argumentsList) => {
        const target = this.#eventTarget(thisValue);
        if (target === null) {
          return this.#typeError("Invalid EventTarget receiver");
        }
        const type = this.#stringArgument(
          argumentsList,
          0,
          "removeEventListener",
        );
        if (type.type === "throw") {
          return type;
        }
        const callbackValue = argumentsList[1];
        if (callbackValue === undefined) {
          return this.#undefined();
        }
        const callback = this.#engine.asCallable(callbackValue);
        const listener =
          callback === null
            ? undefined
            : this.#listeners.get(target)?.get(callback);
        if (listener !== undefined) {
          const options = this.#eventListenerOptions(argumentsList[2], false);
          if (options.type === "throw") {
            return options;
          }
          target.removeEventListener(type.value, listener, options.value);
        }
        return this.#undefined();
      },
    );
    this.#method(
      this.#eventTargetPrototype,
      "dispatchEvent",
      1,
      (thisValue, argumentsList) => {
        const target = this.#eventTarget(thisValue);
        if (target === null) {
          return this.#typeError("Invalid EventTarget receiver");
        }
        const eventValue = argumentsList[0];
        const event = eventValue === undefined ? null : this.#event(eventValue);
        if (event === null) {
          return this.#typeError("The argument is not an Event");
        }
        return this.#primitive(target.dispatchEvent(event));
      },
    );
  }

  #installAbortMembers(): void {
    this.#attribute(this.#abortSignalPrototype, "aborted", (thisValue) => {
      const signal = this.#abortSignal(thisValue);
      return signal === null
        ? this.#typeError("Invalid AbortSignal receiver")
        : this.#primitive(signal.aborted);
    });
    this.#attribute(this.#abortControllerPrototype, "signal", (thisValue) => {
      const controller = this.#abortController(thisValue);
      return controller === null
        ? this.#typeError("Invalid AbortController receiver")
        : this.#platformValue(controller.signal);
    });
    this.#method(this.#abortControllerPrototype, "abort", 0, (thisValue) => {
      const controller = this.#abortController(thisValue);
      if (controller === null) {
        return this.#typeError("Invalid AbortController receiver");
      }
      controller.abort();
      return this.#undefined();
    });
  }

  #installNodeMembers(): void {
    this.#attribute(this.#nodePrototype, "nodeType", (thisValue) => {
      const node = this.#node(thisValue);
      return node === null
        ? this.#typeError("Invalid Node receiver")
        : this.#primitive(node.nodeType);
    });
    this.#attribute(this.#nodePrototype, "nodeName", (thisValue) => {
      const node = this.#node(thisValue);
      return node === null
        ? this.#typeError("Invalid Node receiver")
        : this.#primitive(node.nodeName);
    });
    this.#attribute(this.#nodePrototype, "parentNode", (thisValue) => {
      const node = this.#node(thisValue);
      return node === null
        ? this.#typeError("Invalid Node receiver")
        : this.#platformValue(node.parentNode);
    });
    for (const name of ["firstChild", "lastChild"] as const) {
      this.#attribute(this.#nodePrototype, name, (thisValue) => {
        const node = this.#node(thisValue);
        return node === null
          ? this.#typeError("Invalid Node receiver")
          : this.#platformValue(node[name]);
      });
    }
    this.#attribute(this.#nodePrototype, "childNodes", (thisValue) => {
      const node = this.#node(thisValue);
      return node === null
        ? this.#typeError("Invalid Node receiver")
        : normal(this.#wrap(node.childNodes));
    });
    this.#attribute(this.#nodePrototype, "textContent", (thisValue) => {
      const node = this.#node(thisValue);
      return node === null
        ? this.#typeError("Invalid Node receiver")
        : this.#primitive(node.textContent);
    });
    this.#method(
      this.#nodePrototype,
      "appendChild",
      1,
      (thisValue, argumentsList) => {
        const node = this.#node(thisValue);
        const childValue = argumentsList[0];
        const child = childValue === undefined ? null : this.#node(childValue);
        if (node === null || child === null) {
          return this.#typeError("The argument is not a Node");
        }
        return normal(this.#wrap(node.appendChild(child)));
      },
    );
    this.#method(
      this.#nodePrototype,
      "removeChild",
      1,
      (thisValue, argumentsList) => {
        const node = this.#node(thisValue);
        const childValue = argumentsList[0];
        const child = childValue === undefined ? null : this.#node(childValue);
        if (node === null || child === null) {
          return this.#typeError("The argument is not a Node");
        }
        return normal(this.#wrap(node.removeChild(child)));
      },
    );
  }

  #installElementMembers(): void {
    this.#attribute(this.#elementPrototype, "localName", (thisValue) => {
      const element = this.#element(thisValue);
      return element === null
        ? this.#typeError("Invalid Element receiver")
        : this.#primitive(element.localName);
    });
    this.#attribute(this.#elementPrototype, "namespaceURI", (thisValue) => {
      const element = this.#element(thisValue);
      return element === null
        ? this.#typeError("Invalid Element receiver")
        : this.#primitive(element.namespaceURI);
    });
    this.#attribute(this.#elementPrototype, "attributes", (thisValue) => {
      const element = this.#element(thisValue);
      return element === null
        ? this.#typeError("Invalid Element receiver")
        : normal(this.#wrap(element.attributes));
    });
    this.#attribute(this.#elementPrototype, "children", (thisValue) => {
      const element = this.#element(thisValue);
      return element === null
        ? this.#typeError("Invalid Element receiver")
        : normal(this.#wrap(element.children));
    });
    this.#attribute(
      this.#elementPrototype,
      "id",
      (thisValue) => {
        const element = this.#element(thisValue);
        return element === null
          ? this.#typeError("Invalid Element receiver")
          : this.#primitive(element.id);
      },
      (thisValue, argumentsList) => {
        const element = this.#element(thisValue);
        if (element === null) {
          return this.#typeError("Invalid Element receiver");
        }
        const value = this.#stringArgument(argumentsList, 0, "id");
        if (value.type === "throw") {
          return value;
        }
        element.id = value.value;
        return this.#undefined();
      },
    );
    this.#attribute(
      this.#elementPrototype,
      "className",
      (thisValue) => {
        const element = this.#element(thisValue);
        return element === null
          ? this.#typeError("Invalid Element receiver")
          : this.#primitive(element.className);
      },
      (thisValue, argumentsList) => {
        const element = this.#element(thisValue);
        if (element === null) {
          return this.#typeError("Invalid Element receiver");
        }
        const value = this.#stringArgument(argumentsList, 0, "className");
        if (value.type === "throw") {
          return value;
        }
        element.className = value.value;
        return this.#undefined();
      },
    );
    this.#attribute(
      this.#elementPrototype,
      "innerHTML",
      (thisValue) => {
        const element = this.#element(thisValue);
        return element === null
          ? this.#typeError("Invalid Element receiver")
          : this.#primitive(element.innerHTML);
      },
      (thisValue, argumentsList) => {
        const element = this.#element(thisValue);
        if (element === null) {
          return this.#typeError("Invalid Element receiver");
        }
        const value = this.#stringArgument(argumentsList, 0, "innerHTML");
        if (value.type === "throw") {
          return value;
        }
        element.innerHTML = value.value;
        return this.#undefined();
      },
    );
    this.#method(
      this.#elementPrototype,
      "getAttribute",
      1,
      (thisValue, argumentsList) => {
        const element = this.#element(thisValue);
        if (element === null) {
          return this.#typeError("Invalid Element receiver");
        }
        const name = this.#stringArgument(argumentsList, 0, "getAttribute");
        return name.type === "throw"
          ? name
          : this.#primitive(element.getAttribute(name.value));
      },
    );
    this.#method(
      this.#elementPrototype,
      "setAttribute",
      2,
      (thisValue, argumentsList) => {
        const element = this.#element(thisValue);
        if (element === null) {
          return this.#typeError("Invalid Element receiver");
        }
        const name = this.#stringArgument(argumentsList, 0, "setAttribute");
        if (name.type === "throw") {
          return name;
        }
        const value = this.#stringArgument(argumentsList, 1, "setAttribute");
        if (value.type === "throw") {
          return value;
        }
        element.setAttribute(name.value, value.value);
        return this.#undefined();
      },
    );
    this.#method(
      this.#elementPrototype,
      "removeAttribute",
      1,
      (thisValue, argumentsList) => {
        const element = this.#element(thisValue);
        if (element === null) {
          return this.#typeError("Invalid Element receiver");
        }
        const name = this.#stringArgument(argumentsList, 0, "removeAttribute");
        if (name.type === "throw") {
          return name;
        }
        element.removeAttribute(name.value);
        return this.#undefined();
      },
    );
    this.#method(
      this.#elementPrototype,
      "hasAttribute",
      1,
      (thisValue, argumentsList) => {
        const element = this.#element(thisValue);
        if (element === null) {
          return this.#typeError("Invalid Element receiver");
        }
        const name = this.#stringArgument(argumentsList, 0, "hasAttribute");
        return name.type === "throw"
          ? name
          : this.#primitive(element.hasAttribute(name.value));
      },
    );
    this.#method(
      this.#elementPrototype,
      "querySelector",
      1,
      (thisValue, argumentsList) => {
        const element = this.#element(thisValue);
        if (element === null) {
          return this.#typeError("Invalid Element receiver");
        }
        const selectors = this.#stringArgument(
          argumentsList,
          0,
          "querySelector",
        );
        return selectors.type === "throw"
          ? selectors
          : this.#platformValue(element.querySelector(selectors.value));
      },
    );
    this.#method(
      this.#elementPrototype,
      "getElementsByTagName",
      1,
      (thisValue, argumentsList) => {
        const element = this.#element(thisValue);
        if (element === null) {
          return this.#typeError("Invalid Element receiver");
        }
        const qualifiedName = this.#stringArgument(
          argumentsList,
          0,
          "getElementsByTagName",
        );
        return qualifiedName.type === "throw"
          ? qualifiedName
          : normal(
              this.#wrap(element.getElementsByTagName(qualifiedName.value)),
            );
      },
    );
    this.#method(
      this.#elementPrototype,
      "getElementsByTagNameNS",
      2,
      (thisValue, argumentsList) => {
        const element = this.#element(thisValue);
        if (element === null) {
          return this.#typeError("Invalid Element receiver");
        }
        const namespace = this.#nullableStringArgument(
          argumentsList,
          0,
          "getElementsByTagNameNS",
        );
        if (namespace.type === "throw") {
          return namespace;
        }
        const localName = this.#stringArgument(
          argumentsList,
          1,
          "getElementsByTagNameNS",
        );
        return localName.type === "throw"
          ? localName
          : normal(
              this.#wrap(
                element.getElementsByTagNameNS(
                  namespace.value,
                  localName.value,
                ),
              ),
            );
      },
    );
    this.#method(
      this.#elementPrototype,
      "getElementsByClassName",
      1,
      (thisValue, argumentsList) => {
        const element = this.#element(thisValue);
        if (element === null) {
          return this.#typeError("Invalid Element receiver");
        }
        const classNames = this.#stringArgument(
          argumentsList,
          0,
          "getElementsByClassName",
        );
        return classNames.type === "throw"
          ? classNames
          : normal(
              this.#wrap(element.getElementsByClassName(classNames.value)),
            );
      },
    );
    this.#method(this.#elementPrototype, "remove", 0, (thisValue) => {
      const element = this.#element(thisValue);
      if (element === null) {
        return this.#typeError("Invalid Element receiver");
      }
      element.remove();
      return this.#undefined();
    });
    this.#method(
      this.#elementPrototype,
      "append",
      0,
      (thisValue, argumentsList) => {
        const element = this.#element(thisValue);
        if (element === null) {
          return this.#typeError("Invalid Element receiver");
        }
        const nodes = this.#parentNodeArguments(argumentsList);
        if (nodes.type === "throw") {
          return nodes;
        }
        element.append(...nodes.value);
        return this.#undefined();
      },
    );
  }

  #installHTMLElementMembers(): void {
    this.#attribute(this.#htmlElementPrototype, "dataset", (thisValue) => {
      const element = this.#htmlElement(thisValue);
      return element === null
        ? this.#typeError("Invalid HTMLElement receiver")
        : normal(this.#wrap(element.dataset));
    });
  }

  #installDocumentMembers(): void {
    this.#attribute(this.#documentPrototype, "defaultView", (thisValue) => {
      const document = this.#document(thisValue);
      return document === null
        ? this.#typeError("Invalid Document receiver")
        : this.#platformValue(document.defaultView);
    });
    this.#attribute(this.#documentPrototype, "body", (thisValue) => {
      const document = this.#document(thisValue);
      return document === null
        ? this.#typeError("Invalid Document receiver")
        : this.#platformValue(document.body);
    });
    for (const name of ["doctype", "documentElement"] as const) {
      this.#attribute(this.#documentPrototype, name, (thisValue) => {
        const document = this.#document(thisValue);
        return document === null
          ? this.#typeError("Invalid Document receiver")
          : this.#platformValue(document[name]);
      });
    }
    this.#attribute(this.#documentPrototype, "location", (thisValue) => {
      const document = this.#document(thisValue);
      return document === null
        ? this.#typeError("Invalid Document receiver")
        : this.#primitive(document.location);
    });
    for (const name of [
      "URL",
      "documentURI",
      "compatMode",
      "characterSet",
      "charset",
      "inputEncoding",
      "contentType",
    ] as const) {
      this.#attribute(this.#documentPrototype, name, (thisValue) => {
        const document = this.#document(thisValue);
        return document === null
          ? this.#typeError("Invalid Document receiver")
          : this.#primitive(document[name]);
      });
    }
    this.#method(
      this.#documentPrototype,
      "querySelector",
      1,
      (thisValue, argumentsList) => {
        const document = this.#document(thisValue);
        if (document === null) {
          return this.#typeError("Invalid Document receiver");
        }
        const selectors = this.#stringArgument(
          argumentsList,
          0,
          "querySelector",
        );
        return selectors.type === "throw"
          ? selectors
          : this.#platformValue(document.querySelector(selectors.value));
      },
    );
    this.#method(
      this.#documentPrototype,
      "getElementById",
      1,
      (thisValue, argumentsList) => {
        const document = this.#document(thisValue);
        if (document === null) {
          return this.#typeError("Invalid Document receiver");
        }
        const id = this.#stringArgument(argumentsList, 0, "getElementById");
        return id.type === "throw"
          ? id
          : this.#platformValue(document.getElementById(id.value));
      },
    );
    this.#method(
      this.#documentPrototype,
      "getElementsByTagName",
      1,
      (thisValue, argumentsList) => {
        const document = this.#document(thisValue);
        if (document === null) {
          return this.#typeError("Invalid Document receiver");
        }
        const qualifiedName = this.#stringArgument(
          argumentsList,
          0,
          "getElementsByTagName",
        );
        return qualifiedName.type === "throw"
          ? qualifiedName
          : normal(
              this.#wrap(document.getElementsByTagName(qualifiedName.value)),
            );
      },
    );
    this.#method(
      this.#documentPrototype,
      "getElementsByTagNameNS",
      2,
      (thisValue, argumentsList) => {
        const document = this.#document(thisValue);
        if (document === null) {
          return this.#typeError("Invalid Document receiver");
        }
        const namespace = this.#nullableStringArgument(
          argumentsList,
          0,
          "getElementsByTagNameNS",
        );
        if (namespace.type === "throw") {
          return namespace;
        }
        const localName = this.#stringArgument(
          argumentsList,
          1,
          "getElementsByTagNameNS",
        );
        return localName.type === "throw"
          ? localName
          : normal(
              this.#wrap(
                document.getElementsByTagNameNS(
                  namespace.value,
                  localName.value,
                ),
              ),
            );
      },
    );
    this.#method(
      this.#documentPrototype,
      "getElementsByClassName",
      1,
      (thisValue, argumentsList) => {
        const document = this.#document(thisValue);
        if (document === null) {
          return this.#typeError("Invalid Document receiver");
        }
        const classNames = this.#stringArgument(
          argumentsList,
          0,
          "getElementsByClassName",
        );
        return classNames.type === "throw"
          ? classNames
          : normal(
              this.#wrap(document.getElementsByClassName(classNames.value)),
            );
      },
    );
    this.#method(
      this.#documentPrototype,
      "createElement",
      1,
      (thisValue, argumentsList) => {
        const document = this.#document(thisValue);
        if (document === null) {
          return this.#typeError("Invalid Document receiver");
        }
        const localName = this.#stringArgument(
          argumentsList,
          0,
          "createElement",
        );
        return localName.type === "throw"
          ? localName
          : normal(this.#wrap(document.createElement(localName.value)));
      },
    );
    this.#method(
      this.#documentPrototype,
      "createElementNS",
      2,
      (thisValue, argumentsList) => {
        const document = this.#document(thisValue);
        if (document === null) {
          return this.#typeError("Invalid Document receiver");
        }
        const namespaceValue = argumentsList[0];
        if (namespaceValue === undefined) {
          return this.#typeError("createElementNS requires 2 argument(s)");
        }
        const namespace = this.#engine.isNull(namespaceValue)
          ? normal(null)
          : this.#engine.toString(this.#realm, namespaceValue);
        if (namespace.type === "throw") {
          return namespace;
        }
        const qualifiedName = this.#stringArgument(
          argumentsList,
          1,
          "createElementNS",
        );
        return qualifiedName.type === "throw"
          ? qualifiedName
          : normal(
              this.#wrap(
                document.createElementNS(namespace.value, qualifiedName.value),
              ),
            );
      },
    );
    this.#method(
      this.#documentPrototype,
      "append",
      0,
      (thisValue, argumentsList) => {
        const document = this.#document(thisValue);
        if (document === null) {
          return this.#typeError("Invalid Document receiver");
        }
        const nodes = this.#parentNodeArguments(argumentsList);
        if (nodes.type === "throw") {
          return nodes;
        }
        document.append(...nodes.value);
        return this.#undefined();
      },
    );
  }

  #installHTMLAnchorElementMembers(): void {
    this.#attribute(
      this.#htmlAnchorElementPrototype,
      "href",
      (thisValue) => {
        const anchor = this.#htmlAnchorElement(thisValue);
        return anchor === null
          ? this.#typeError("Invalid HTMLAnchorElement receiver")
          : this.#primitive(anchor.href);
      },
      (thisValue, argumentsList) => {
        const anchor = this.#htmlAnchorElement(thisValue);
        if (anchor === null) {
          return this.#typeError("Invalid HTMLAnchorElement receiver");
        }
        const value = this.#stringArgument(argumentsList, 0, "href");
        if (value.type === "throw") {
          return value;
        }
        anchor.href = value.value;
        return this.#undefined();
      },
    );
    for (const name of ["pathname", "search", "hash"] as const) {
      this.#attribute(this.#htmlAnchorElementPrototype, name, (thisValue) => {
        const anchor = this.#htmlAnchorElement(thisValue);
        return anchor === null
          ? this.#typeError("Invalid HTMLAnchorElement receiver")
          : this.#primitive(anchor[name]);
      });
    }
  }

  #installEventMembers(): void {
    this.#attribute(this.#eventPrototype, "type", (thisValue) => {
      const event = this.#event(thisValue);
      return event === null
        ? this.#typeError("Invalid Event receiver")
        : this.#primitive(event.type);
    });
    this.#attribute(this.#eventPrototype, "currentTarget", (thisValue) => {
      const event = this.#event(thisValue);
      return event === null
        ? this.#typeError("Invalid Event receiver")
        : this.#platformValue(event.currentTarget);
    });
    for (const name of ["target", "srcElement"] as const) {
      this.#attribute(this.#eventPrototype, name, (thisValue) => {
        const event = this.#event(thisValue);
        return event === null
          ? this.#typeError("Invalid Event receiver")
          : this.#platformValue(event[name]);
      });
    }
    for (const name of ["eventPhase", "timeStamp"] as const) {
      this.#attribute(this.#eventPrototype, name, (thisValue) => {
        const event = this.#event(thisValue);
        return event === null
          ? this.#typeError("Invalid Event receiver")
          : this.#primitive(event[name]);
      });
    }
    this.#attribute(this.#eventPrototype, "isTrusted", (thisValue) => {
      const event = this.#event(thisValue);
      return event === null
        ? this.#typeError("Invalid Event receiver")
        : this.#primitive(event.isTrusted);
    });
    for (const name of [
      "bubbles",
      "cancelable",
      "composed",
      "defaultPrevented",
    ] as const) {
      this.#attribute(this.#eventPrototype, name, (thisValue) => {
        const event = this.#event(thisValue);
        return event === null
          ? this.#typeError("Invalid Event receiver")
          : this.#primitive(event[name]);
      });
    }
    this.#attribute(
      this.#eventPrototype,
      "returnValue",
      (thisValue) => {
        const event = this.#event(thisValue);
        return event === null
          ? this.#typeError("Invalid Event receiver")
          : this.#primitive(event.returnValue);
      },
      (thisValue, argumentsList) => {
        const event = this.#event(thisValue);
        if (event === null) {
          return this.#typeError("Invalid Event receiver");
        }
        event.returnValue = this.#engine.toBoolean(
          argumentsList[0] ?? this.#engine.fromPrimitive(undefined),
        );
        return this.#undefined();
      },
    );
    for (const name of [
      "stopPropagation",
      "stopImmediatePropagation",
      "preventDefault",
    ] as const) {
      this.#method(this.#eventPrototype, name, 0, (thisValue) => {
        const event = this.#event(thisValue);
        if (event === null) {
          return this.#typeError("Invalid Event receiver");
        }
        event[name]();
        return this.#undefined();
      });
    }
    this.#method(
      this.#eventPrototype,
      "initEvent",
      1,
      (thisValue, argumentsList) => {
        const event = this.#event(thisValue);
        if (event === null) {
          return this.#typeError("Invalid Event receiver");
        }
        const type = this.#stringArgument(argumentsList, 0, "initEvent");
        if (type.type === "throw") {
          return type;
        }
        event.initEvent(
          type.value,
          argumentsList[1] === undefined
            ? false
            : this.#engine.toBoolean(argumentsList[1]),
          argumentsList[2] === undefined
            ? false
            : this.#engine.toBoolean(argumentsList[2]),
        );
        return this.#undefined();
      },
    );
    this.#attribute(this.#customEventPrototype, "detail", (thisValue) => {
      const event = this.#customEvent(thisValue);
      if (event === null) {
        return this.#typeError("Invalid CustomEvent receiver");
      }
      return normal(
        this.#customEventDetails.get(event) ?? this.#engine.fromPrimitive(null),
      );
    });
  }

  #installHTMLCollectionMembers(): void {
    this.#attribute(this.#htmlCollectionPrototype, "length", (thisValue) => {
      const collection = this.#htmlCollection(thisValue);
      return collection === null
        ? this.#typeError("Invalid HTMLCollection receiver")
        : this.#primitive(collection.length);
    });
    this.#method(
      this.#htmlCollectionPrototype,
      "item",
      1,
      (thisValue, argumentsList) => {
        const collection = this.#htmlCollection(thisValue);
        if (collection === null) {
          return this.#typeError("Invalid HTMLCollection receiver");
        }
        const index = this.#stringArgument(argumentsList, 0, "item");
        return index.type === "throw"
          ? index
          : this.#platformValue(collection.item(Number(index.value) >>> 0));
      },
    );
    this.#method(
      this.#htmlCollectionPrototype,
      "namedItem",
      1,
      (thisValue, argumentsList) => {
        const collection = this.#htmlCollection(thisValue);
        if (collection === null) {
          return this.#typeError("Invalid HTMLCollection receiver");
        }
        const name = this.#stringArgument(argumentsList, 0, "namedItem");
        return name.type === "throw"
          ? name
          : this.#platformValue(collection.namedItem(name.value));
      },
    );
    this.#installIterator(
      this.#htmlCollectionPrototype,
      (thisValue) => this.#htmlCollection(thisValue),
      "HTMLCollection",
    );
  }

  #installNamedNodeMapMembers(): void {
    this.#attribute(this.#namedNodeMapPrototype, "length", (thisValue) => {
      const attributes = this.#namedNodeMap(thisValue);
      return attributes === null
        ? this.#typeError("Invalid NamedNodeMap receiver")
        : this.#primitive(attributes.length);
    });
    this.#method(
      this.#namedNodeMapPrototype,
      "item",
      1,
      (thisValue, argumentsList) => {
        const attributes = this.#namedNodeMap(thisValue);
        if (attributes === null) {
          return this.#typeError("Invalid NamedNodeMap receiver");
        }
        const index = this.#stringArgument(argumentsList, 0, "item");
        return index.type === "throw"
          ? index
          : this.#platformValue(attributes.item(Number(index.value) >>> 0));
      },
    );
  }

  #installNodeListMembers(): void {
    this.#attribute(this.#nodeListPrototype, "length", (thisValue) => {
      const list = this.#nodeList(thisValue);
      return list === null
        ? this.#typeError("Invalid NodeList receiver")
        : this.#primitive(list.length);
    });
    this.#method(
      this.#nodeListPrototype,
      "item",
      1,
      (thisValue, argumentsList) => {
        const list = this.#nodeList(thisValue);
        if (list === null) {
          return this.#typeError("Invalid NodeList receiver");
        }
        const index = this.#stringArgument(argumentsList, 0, "item");
        return index.type === "throw"
          ? index
          : this.#platformValue(list.item(Number(index.value) >>> 0));
      },
    );
    this.#installIterator(
      this.#nodeListPrototype,
      (thisValue) => this.#nodeList(thisValue),
      "NodeList",
    );
  }

  #installIterator(
    prototype: EngineObject,
    collection: (value: EngineValue) => Iterable<object> | null,
    interfaceName: string,
  ): void {
    this.#engine.defineDataProperty(
      prototype,
      this.#engine.wellKnownSymbol("iterator"),
      this.#engine.createFunction(this.#realm, "values", 0, (thisValue) => {
        const value = collection(thisValue);
        return value === null
          ? this.#typeError(`Invalid ${interfaceName} receiver`)
          : this.#arrayIterator(Array.from(value));
      }),
      DATA_PROPERTY,
    );
  }

  #method(
    prototype: EngineObject,
    name: string,
    length: number,
    callback: EngineHostFunction,
  ): void {
    this.#engine.defineDataProperty(
      prototype,
      name,
      this.#engine.createFunction(this.#realm, name, length, callback),
      DATA_PROPERTY,
    );
  }

  #attribute(
    prototype: EngineObject,
    name: string,
    getter: EngineHostFunction,
    setter: EngineHostFunction | null = null,
  ): void {
    this.#engine.defineAccessorProperty(
      prototype,
      name,
      this.#engine.createFunction(this.#realm, `get ${name}`, 0, getter),
      setter === null
        ? null
        : this.#engine.createFunction(this.#realm, `set ${name}`, 1, setter),
      ATTRIBUTE_PROPERTY,
    );
  }

  #legacyPlatformObject(
    target: EngineObject,
    configuration: LegacyPlatformObjectConfiguration,
  ): EngineObject {
    const nullValue = this.#engine.fromPrimitive(null);
    const indexedNames =
      configuration.indexedLength === undefined
        ? nullValue
        : this.#engine.createFunction(this.#realm, "indexedNames", 0, () => {
            const names = Array.from(
              { length: configuration.indexedLength?.() ?? 0 },
              (_value, index) => this.#engine.fromPrimitive(String(index)),
            );
            return normal(this.#engine.createArray(this.#realm, names));
          });
    const indexedValue =
      configuration.indexedValue === undefined
        ? nullValue
        : this.#engine.createFunction(
            this.#realm,
            "indexedValue",
            1,
            (_thisValue, argumentsList) => {
              const property = this.#stringArgument(
                argumentsList,
                0,
                "indexedValue",
              );
              return property.type === "throw"
                ? property
                : this.#legacyValue(
                    configuration.indexedValue?.(Number(property.value)),
                  );
            },
          );
    const namedNames =
      configuration.namedNames === undefined
        ? nullValue
        : this.#engine.createFunction(this.#realm, "namedNames", 0, () => {
            const names =
              configuration
                .namedNames?.()
                .map((name) => this.#engine.fromPrimitive(name)) ?? [];
            return normal(this.#engine.createArray(this.#realm, names));
          });
    const namedValue =
      configuration.namedValue === undefined
        ? nullValue
        : this.#engine.createFunction(
            this.#realm,
            "namedValue",
            1,
            (_thisValue, argumentsList) => {
              const name = this.#stringArgument(argumentsList, 0, "namedValue");
              return name.type === "throw"
                ? name
                : this.#legacyValue(configuration.namedValue?.(name.value));
            },
          );
    const namedSetter =
      configuration.namedSet === undefined
        ? nullValue
        : this.#engine.createFunction(
            this.#realm,
            "namedSetter",
            2,
            (_thisValue, argumentsList) => {
              const name = this.#stringArgument(
                argumentsList,
                0,
                "namedSetter",
              );
              if (name.type === "throw") {
                return name;
              }
              const value = argumentsList[1];
              if (value === undefined) {
                return this.#typeError("namedSetter requires 2 argument(s)");
              }
              const converted = this.#engine.toString(this.#realm, value);
              if (converted.type === "throw") {
                return converted;
              }
              configuration.namedSet?.(name.value, converted.value);
              return this.#undefined();
            },
          );
    const namedDeleter =
      configuration.namedDelete === undefined
        ? nullValue
        : this.#engine.createFunction(
            this.#realm,
            "namedDeleter",
            1,
            (_thisValue, argumentsList) => {
              const name = this.#stringArgument(
                argumentsList,
                0,
                "namedDeleter",
              );
              if (name.type === "throw") {
                return name;
              }
              configuration.namedDelete?.(name.value);
              return this.#undefined();
            },
          );
    const result = this.#engine.call(
      this.#realm,
      this.#legacyPlatformObjectFactory,
      this.#engine.fromPrimitive(undefined),
      [
        target,
        indexedNames,
        indexedValue,
        namedNames,
        namedValue,
        namedSetter,
        namedDeleter,
        this.#engine.fromPrimitive(configuration.namedEnumerable ?? false),
        this.#engine.fromPrimitive(configuration.overrideBuiltins ?? false),
      ],
    );
    if (result.type === "throw") {
      throw new TypeError(
        this.#engine.exceptionMessage(this.#realm, result.value),
      );
    }
    const proxy = this.#engine.asObject(result.value);
    if (proxy === null) {
      throw new TypeError(
        "Legacy platform object factory returned a primitive",
      );
    }
    return proxy;
  }

  #legacyValue(value: LegacyPlatformValue): EngineResult<EngineValue> {
    return typeof value === "object" && value !== null
      ? normal(this.#wrap(value))
      : this.#primitive(value);
  }

  #arrayIterator(values: readonly object[]): EngineResult<EngineValue> {
    const array = this.#engine.createArray(
      this.#realm,
      values.map((value) => this.#wrap(value)),
    );
    const iterator = this.#engine.get(
      this.#realm,
      array,
      this.#engine.wellKnownSymbol("iterator"),
    );
    if (iterator.type === "throw") {
      return iterator;
    }
    const callable = this.#engine.asCallable(iterator.value);
    return callable === null
      ? this.#typeError("Array iterator is not callable")
      : this.#engine.call(this.#realm, callable, array, []);
  }

  #wrap(interfaceObject: object): EngineObject {
    const implementation = implementationFor(interfaceObject);
    const existing = this.#platformObjects.get(implementation);
    if (existing !== undefined) {
      return existing;
    }
    const prototype = this.#prototype(interfaceObject);
    const target = this.#engine.createObject(this.#realm, prototype);
    let platformObject = target;
    if (interfaceObject instanceof HTMLCollection) {
      const collection = interfaceObject as HTMLCollection<Element, Element>;
      platformObject = this.#legacyPlatformObject(target, {
        indexedLength: () => collection.length,
        indexedValue: (index) => collection.item(index),
        namedNames: () => htmlCollectionSupportedPropertyNames(collection),
        namedValue: (name) => collection.namedItem(name),
      });
    } else if (interfaceObject instanceof NamedNodeMap) {
      platformObject = this.#legacyPlatformObject(target, {
        indexedLength: () => interfaceObject.length,
        indexedValue: (index) => interfaceObject.item(index),
        namedNames: () => namedNodeMapSupportedPropertyNames(interfaceObject),
        namedValue: (name) => interfaceObject.getNamedItem(name),
      });
    } else if (interfaceObject instanceof NodeList) {
      const list = interfaceObject as NodeList;
      platformObject = this.#legacyPlatformObject(target, {
        indexedLength: () => list.length,
        indexedValue: (index) => list.item(index),
      });
    } else if (interfaceObject instanceof DOMStringMap) {
      platformObject = this.#legacyPlatformObject(target, {
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
    this.#platformObjects.set(implementation, platformObject);
    this.#implementations.set(platformObject, implementation);
    return platformObject;
  }

  #prototype(interfaceObject: object): EngineObject {
    if (interfaceObject instanceof AbortSignal) {
      return this.#abortSignalPrototype;
    }
    if (interfaceObject instanceof AbortController) {
      return this.#abortControllerPrototype;
    }
    if (interfaceObject instanceof CustomEvent) {
      return this.#customEventPrototype;
    }
    if (interfaceObject instanceof Document) {
      return this.#documentPrototype;
    }
    if (interfaceObject instanceof Attr) {
      return this.#attrPrototype;
    }
    if (interfaceObject instanceof HTMLAnchorElement) {
      return this.#htmlAnchorElementPrototype;
    }
    if (interfaceObject instanceof HTMLElement) {
      return this.#htmlElementPrototype;
    }
    if (interfaceObject instanceof Element) {
      return this.#elementPrototype;
    }
    if (interfaceObject instanceof Node) {
      return this.#nodePrototype;
    }
    if (interfaceObject instanceof Event) {
      return this.#eventPrototype;
    }
    if (interfaceObject instanceof EventTarget) {
      return this.#eventTargetPrototype;
    }
    if (interfaceObject instanceof HTMLCollection) {
      return this.#htmlCollectionPrototype;
    }
    if (interfaceObject instanceof NamedNodeMap) {
      return this.#namedNodeMapPrototype;
    }
    if (interfaceObject instanceof NodeList) {
      return this.#nodeListPrototype;
    }
    if (interfaceObject instanceof DOMStringMap) {
      return this.#domStringMapPrototype;
    }
    throw new TypeError("Unsupported DOM platform object");
  }

  #interfaceObject(value: EngineValue): object | null {
    const object = this.#engine.asObject(value);
    if (object === null) {
      return null;
    }
    const implementation = this.#implementations.get(object);
    return implementation === undefined ? null : interfaceFor(implementation);
  }

  #eventTarget(value: EngineValue): EventTarget | null {
    const interfaceObject = this.#engine.isUndefined(value)
      ? this.#interfaceObject(this.#engine.globalThis(this.#realm))
      : this.#interfaceObject(value);
    return interfaceObject instanceof EventTarget ? interfaceObject : null;
  }

  #abortSignal(value: EngineValue): AbortSignal | null {
    const interfaceObject = this.#interfaceObject(value);
    return interfaceObject instanceof AbortSignal ? interfaceObject : null;
  }

  #abortController(value: EngineValue): AbortController | null {
    const interfaceObject = this.#interfaceObject(value);
    return interfaceObject instanceof AbortController ? interfaceObject : null;
  }

  #node(value: EngineValue): Node | null {
    const interfaceObject = this.#interfaceObject(value);
    return interfaceObject instanceof Node ? interfaceObject : null;
  }

  #element(value: EngineValue): Element | null {
    const interfaceObject = this.#interfaceObject(value);
    return interfaceObject instanceof Element ? interfaceObject : null;
  }

  #htmlElement(value: EngineValue): HTMLElement | null {
    const interfaceObject = this.#interfaceObject(value);
    return interfaceObject instanceof HTMLElement ? interfaceObject : null;
  }

  #htmlAnchorElement(value: EngineValue): HTMLAnchorElement | null {
    const interfaceObject = this.#interfaceObject(value);
    return interfaceObject instanceof HTMLAnchorElement
      ? interfaceObject
      : null;
  }

  #document(value: EngineValue): Document | null {
    const interfaceObject = this.#interfaceObject(value);
    return interfaceObject instanceof Document ? interfaceObject : null;
  }

  #event(value: EngineValue): Event | null {
    const interfaceObject = this.#interfaceObject(value);
    return interfaceObject instanceof Event ? interfaceObject : null;
  }

  #customEvent(value: EngineValue): CustomEvent | null {
    const interfaceObject = this.#interfaceObject(value);
    return interfaceObject instanceof CustomEvent ? interfaceObject : null;
  }

  #htmlCollection(value: EngineValue): HTMLCollection<Element, Element> | null {
    const interfaceObject = this.#interfaceObject(value);
    return interfaceObject instanceof HTMLCollection
      ? (interfaceObject as HTMLCollection<Element, Element>)
      : null;
  }

  #namedNodeMap(value: EngineValue): NamedNodeMap | null {
    const interfaceObject = this.#interfaceObject(value);
    return interfaceObject instanceof NamedNodeMap ? interfaceObject : null;
  }

  #nodeList(value: EngineValue): NodeList | null {
    const interfaceObject = this.#interfaceObject(value);
    return interfaceObject instanceof NodeList ? interfaceObject : null;
  }

  #stringArgument(
    argumentsList: readonly EngineValue[],
    index: number,
    operation: string,
  ): EngineResult<string> {
    const value = argumentsList[index];
    if (value === undefined) {
      return thrown(
        this.#engine.createTypeError(
          this.#realm,
          `${operation} requires ${String(index + 1)} argument(s)`,
        ),
      );
    }
    return this.#engine.toString(this.#realm, value);
  }

  #nullableStringArgument(
    argumentsList: readonly EngineValue[],
    index: number,
    operation: string,
  ): EngineResult<string | null> {
    const value = argumentsList[index];
    if (value === undefined) {
      return thrown(
        this.#engine.createTypeError(
          this.#realm,
          `${operation} requires ${String(index + 1)} argument(s)`,
        ),
      );
    }
    return this.#engine.isNull(value)
      ? normal(null)
      : this.#engine.toString(this.#realm, value);
  }

  #parentNodeArguments(
    argumentsList: readonly EngineValue[],
  ): EngineResult<(Node | string)[]> {
    const nodes: (Node | string)[] = [];
    for (const value of argumentsList) {
      const node = this.#node(value);
      if (node !== null) {
        nodes.push(node);
        continue;
      }
      const converted = this.#engine.toString(this.#realm, value);
      if (converted.type === "throw") {
        return converted;
      }
      nodes.push(converted.value);
    }
    return normal(nodes);
  }

  #eventListenerOptions(
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
      this.#engine.isUndefined(value) ||
      this.#engine.isNull(value)
    ) {
      return normal({
        capture: false,
        once: false,
        passive: false,
        signal: null,
      });
    }
    const object = this.#engine.asObject(value);
    if (object === null) {
      return normal({
        capture: this.#engine.toBoolean(value),
        once: false,
        passive: false,
        signal: null,
      });
    }
    const capture = this.#engine.get(this.#realm, object, "capture");
    if (capture.type === "throw") {
      return capture;
    }
    if (!includeOnce) {
      return normal({
        capture: this.#engine.toBoolean(capture.value),
        once: false,
        passive: false,
        signal: null,
      });
    }
    const passive = this.#engine.get(this.#realm, object, "passive");
    if (passive.type === "throw") {
      return passive;
    }
    const once = this.#engine.get(this.#realm, object, "once");
    if (once.type === "throw") {
      return once;
    }
    const signalValue = this.#engine.get(this.#realm, object, "signal");
    if (signalValue.type === "throw") {
      return signalValue;
    }
    let signal: AbortSignal | null = null;
    if (!this.#engine.isUndefined(signalValue.value)) {
      signal = this.#abortSignal(signalValue.value);
      if (signal === null) {
        return thrown(
          this.#engine.createTypeError(
            this.#realm,
            "The signal option is not an AbortSignal",
          ),
        );
      }
    }
    return normal({
      capture: this.#engine.toBoolean(capture.value),
      once: this.#engine.toBoolean(once.value),
      passive: this.#engine.toBoolean(passive.value),
      signal,
    });
  }

  #eventInit(value: EngineValue | undefined): EngineResult<{
    bubbles: boolean;
    cancelable: boolean;
    composed: boolean;
  }> {
    if (
      value === undefined ||
      this.#engine.isUndefined(value) ||
      this.#engine.isNull(value)
    ) {
      return normal({ bubbles: false, cancelable: false, composed: false });
    }
    const object = this.#engine.asObject(value);
    if (object === null) {
      return thrown(
        this.#engine.createTypeError(
          this.#realm,
          "Event init is not an object",
        ),
      );
    }
    const values: boolean[] = [];
    for (const name of ["bubbles", "cancelable", "composed"] as const) {
      const property = this.#engine.get(this.#realm, object, name);
      if (property.type === "throw") {
        return property;
      }
      values.push(this.#engine.toBoolean(property.value));
    }
    return normal({
      bubbles: values[0] ?? false,
      cancelable: values[1] ?? false,
      composed: values[2] ?? false,
    });
  }

  #customEventInit(value: EngineValue | undefined): EngineResult<{
    bubbles: boolean;
    cancelable: boolean;
    composed: boolean;
    detail: EngineValue;
  }> {
    const eventInit = this.#eventInit(value);
    if (eventInit.type === "throw") {
      return eventInit;
    }
    if (
      value === undefined ||
      this.#engine.isUndefined(value) ||
      this.#engine.isNull(value)
    ) {
      return normal({
        ...eventInit.value,
        detail: this.#engine.fromPrimitive(null),
      });
    }
    const object = this.#engine.asObject(value);
    if (object === null) {
      return thrown(
        this.#engine.createTypeError(
          this.#realm,
          "CustomEvent init is not an object",
        ),
      );
    }
    const detail = this.#engine.get(this.#realm, object, "detail");
    if (detail.type === "throw") {
      return detail;
    }
    return normal({
      ...eventInit.value,
      detail: this.#engine.isUndefined(detail.value)
        ? this.#engine.fromPrimitive(null)
        : detail.value,
    });
  }

  #eventListener(
    target: EventTarget,
    callback: EngineCallable,
  ): (event: Event) => void {
    let listeners = this.#listeners.get(target);
    if (listeners === undefined) {
      listeners = new Map();
      this.#listeners.set(target, listeners);
    }
    const existing = listeners.get(callback);
    if (existing !== undefined) {
      return existing;
    }
    const listener = (event: Event): void => {
      const currentTarget = event.currentTarget ?? target;
      const result = this.#engine.call(
        this.#realm,
        callback,
        this.#wrap(currentTarget),
        [this.#wrap(event)],
      );
      if (result.type === "throw") {
        throw new Error(
          this.#engine.exceptionMessage(this.#realm, result.value),
        );
      }
    };
    listeners.set(callback, listener);
    return listener;
  }

  #platformValue(interfaceObject: object | null): EngineResult<EngineValue> {
    return interfaceObject === null
      ? this.#primitive(null)
      : normal(this.#wrap(interfaceObject));
  }

  #primitive(
    value: undefined | null | boolean | string | number | bigint,
  ): EngineResult<EngineValue> {
    return normal(this.#engine.fromPrimitive(value));
  }

  #undefined(): EngineResult<EngineValue> {
    return this.#primitive(undefined);
  }

  #typeError(message: string): EngineResult<EngineValue> {
    return thrown(this.#engine.createTypeError(this.#realm, message));
  }
}
