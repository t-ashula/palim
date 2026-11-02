import { Document, Element, Event, EventTarget, Node } from "../dom.js";
import { implementationFor, interfaceFor } from "../dom/binding.js";
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

export class DOMRealmBinding {
  readonly #engine: JavaScriptEngineAdapter;
  readonly #realm: EngineRealm;
  readonly #platformObjects = new WeakMap<object, EngineObject>();
  readonly #implementations = new WeakMap<EngineObject, object>();
  readonly #listeners = new WeakMap<
    EventTarget,
    Map<EngineCallable, (event: Event) => void>
  >();
  readonly #eventTargetPrototype: EngineObject;
  readonly #nodePrototype: EngineObject;
  readonly #elementPrototype: EngineObject;
  readonly #documentPrototype: EngineObject;
  readonly #eventPrototype: EngineObject;

  constructor(engine: JavaScriptEngineAdapter, realm: EngineRealm) {
    this.#engine = engine;
    this.#realm = realm;

    const objectPrototype = this.#engine.objectPrototype(this.#realm);
    this.#eventTargetPrototype = this.#engine.createObject(
      this.#realm,
      objectPrototype,
    );
    this.#nodePrototype = this.#engine.createObject(
      this.#realm,
      this.#eventTargetPrototype,
    );
    this.#elementPrototype = this.#engine.createObject(
      this.#realm,
      this.#nodePrototype,
    );
    this.#documentPrototype = this.#engine.createObject(
      this.#realm,
      this.#nodePrototype,
    );
    this.#eventPrototype = this.#engine.createObject(
      this.#realm,
      objectPrototype,
    );

    this.#installInterfaces();
    this.#installEventTargetMembers();
    this.#installNodeMembers();
    this.#installElementMembers();
    this.#installDocumentMembers();
    this.#installEventMembers();
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
    this.#installInterface("Node", this.#nodePrototype);
    this.#installInterface("Element", this.#elementPrototype);
    this.#installInterface("Document", this.#documentPrototype);
    this.#installInterface(
      "Event",
      this.#eventPrototype,
      1,
      (_thisValue, argumentsList) => {
        const type = this.#stringArgument(argumentsList, 0, "Event");
        return type.type === "throw"
          ? type
          : normal(this.#wrap(new Event(type.value)));
      },
    );
  }

  #installInterface(
    name: string,
    prototype: EngineObject,
    length = 0,
    construct: EngineHostFunction | null = null,
  ): void {
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
        const capture =
          argumentsList[2] === undefined
            ? false
            : this.#engine.toBoolean(argumentsList[2]);
        target.addEventListener(
          type.value,
          this.#eventListener(target, callback),
          capture,
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
          const capture =
            argumentsList[2] === undefined
              ? false
              : this.#engine.toBoolean(argumentsList[2]);
          target.removeEventListener(type.value, listener, capture);
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
  }

  #installElementMembers(): void {
    this.#attribute(this.#elementPrototype, "localName", (thisValue) => {
      const element = this.#element(thisValue);
      return element === null
        ? this.#typeError("Invalid Element receiver")
        : this.#primitive(element.localName);
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

  #wrap(interfaceObject: object): EngineObject {
    const implementation = implementationFor(interfaceObject);
    const existing = this.#platformObjects.get(implementation);
    if (existing !== undefined) {
      return existing;
    }
    const prototype = this.#prototype(interfaceObject);
    const platformObject = this.#engine.createObject(this.#realm, prototype);
    this.#platformObjects.set(implementation, platformObject);
    this.#implementations.set(platformObject, implementation);
    return platformObject;
  }

  #prototype(interfaceObject: object): EngineObject {
    if (interfaceObject instanceof Document) {
      return this.#documentPrototype;
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
    const interfaceObject = this.#interfaceObject(value);
    return interfaceObject instanceof EventTarget ? interfaceObject : null;
  }

  #node(value: EngineValue): Node | null {
    const interfaceObject = this.#interfaceObject(value);
    return interfaceObject instanceof Node ? interfaceObject : null;
  }

  #element(value: EngineValue): Element | null {
    const interfaceObject = this.#interfaceObject(value);
    return interfaceObject instanceof Element ? interfaceObject : null;
  }

  #document(value: EngineValue): Document | null {
    const interfaceObject = this.#interfaceObject(value);
    return interfaceObject instanceof Document ? interfaceObject : null;
  }

  #event(value: EngineValue): Event | null {
    const interfaceObject = this.#interfaceObject(value);
    return interfaceObject instanceof Event ? interfaceObject : null;
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
