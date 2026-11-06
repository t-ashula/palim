import { Window } from "../window.js";
import { URL } from "../url/index.js";
import { createHTMLCollection } from "../dom/collections.js";
import type { Document, Element } from "../dom.js";
import { descendantElements } from "../dom/traversal.js";
import { HTML_NAMESPACE } from "../namespaces.js";
import { normal } from "./adapter.js";
import type {
  EngineHostFunction,
  EngineObject,
  EngineRealm,
  EngineResult,
  EngineValue,
  JavaScriptEngineAdapter,
} from "./adapter.js";
import { DOMRealmBinding } from "./dom-realm-binding.js";
import { createDOMLegacyPlatformObject } from "./dom-realm-legacy-platform-object.js";
import { FormDataRealmBindingContext } from "./form-data-realm-binding-context.js";
import { installFormDataInterface } from "./form-data-realm-interface-installer.js";
import { RealmBindingContext } from "./realm-binding-context.js";
import { URLRealmBinding } from "./url-realm-binding.js";
import {
  installConsole,
  installLocationInterface,
  installLocationMembers,
  installTimers,
  installWindowInterface,
  installWindowMembers,
} from "./window-realm-interface-installers.js";

export class WindowRealmBindingContext {
  readonly engine: JavaScriptEngineAdapter;
  readonly context: RealmBindingContext;
  readonly window: Window;
  readonly globalObject: EngineObject;
  readonly globalThis: EngineObject;
  readonly namedPropertiesObject: EngineObject;
  readonly windowPrototype: EngineObject;
  readonly locationPrototype: EngineObject;
  readonly locationObject: EngineObject;
  readonly dom: DOMRealmBinding;
  readonly formData: FormDataRealmBindingContext;
  readonly url: URLRealmBinding;
  readonly realm: EngineRealm;

  constructor(engine: JavaScriptEngineAdapter, window: Window) {
    this.engine = engine;
    this.window = window;
    this.realm = this.engine.createRealm({ forwardingGlobalThis: true });
    this.context = new RealmBindingContext(engine, this.realm);
    this.globalObject = this.engine.globalObject(this.realm);
    this.globalThis = this.engine.globalThis(this.realm);
    this.dom = new DOMRealmBinding(
      this.engine,
      this.realm,
      this.window.document,
    );
    this.url = new URLRealmBinding(this.engine, this.realm);
    this.formData = new FormDataRealmBindingContext(this.context);
    installFormDataInterface(this.context, this.formData);
    const namedPropertiesTarget = this.engine.createObject(
      this.realm,
      this.dom.eventTargetPrototype,
    );
    this.namedPropertiesObject = createDOMLegacyPlatformObject(
      this.context,
      namedPropertiesTarget,
      {
        namedNames: () => windowNamedPropertyNames(this.window.document),
        namedValue: (name) =>
          windowNamedPropertyValue(this.window.document, name),
        namedIncludesIndices: true,
        namedWritable: true,
      },
      (value) => this.dom.platformObject(value),
    );
    this.windowPrototype = this.engine.createObject(
      this.realm,
      this.namedPropertiesObject,
    );
    this.locationPrototype = this.engine.createObject(
      this.realm,
      this.engine.objectPrototype(this.realm),
    );
    this.locationObject = this.engine.createObject(
      this.realm,
      this.locationPrototype,
    );

    this.engine.setPrototypeOf(this.globalObject, this.windowPrototype);
    this.dom.associatePlatformObject(this.window, this.globalObject);
    this.dom.bindPlatformObject(this.window, this.globalThis);
    installWindowInterface(this);
    installLocationInterface(this);
    installWindowMembers(this);
    installLocationMembers(this);
    installTimers(this);
    installConsole(this);
  }

  locationURL(): URL {
    return new URL(this.window.document.URL);
  }

  timerDelay(value: EngineValue | undefined): EngineResult<number> {
    if (value === undefined) {
      return normal(0);
    }
    const text = this.context.string(value);
    return text.type === "throw"
      ? text
      : normal(Math.max(0, Number(text.value) || 0));
  }

  timerId(value: EngineValue | undefined): EngineResult<number> {
    if (value === undefined) {
      return normal(0);
    }
    const text = this.context.string(value);
    return text.type === "throw" ? text : normal(Number(text.value) || 0);
  }

  operation(name: string, length: number, callback: EngineHostFunction): void {
    this.context.interfaceMethod(this.globalObject, name, length, callback);
  }

  consoleText(value: EngineValue): string {
    const result = this.context.string(value);
    return result.type === "normal" ? result.value : "<unprintable>";
  }

  attribute(
    name: string,
    value: () => EngineValue,
    configurable: boolean,
    replaceable = false,
  ): void {
    const getter: EngineHostFunction = (thisValue) =>
      this.receiver(thisValue) === null
        ? this.context.typeError(`Invalid Window receiver for ${name}`)
        : normal(value());
    const setter: EngineHostFunction | null = replaceable
      ? (thisValue, argumentsList) => {
          const receiver = this.engine.asObject(thisValue);
          if (receiver === null || this.receiver(thisValue) === null) {
            return this.context.typeError(
              `Invalid Window receiver for ${name}`,
            );
          }
          this.engine.defineDataProperty(
            receiver,
            name,
            argumentsList[0] ?? this.engine.fromPrimitive(undefined),
            {
              configurable: true,
              enumerable: true,
              writable: true,
            },
          );
          return this.context.undefined();
        }
      : null;
    this.engine.defineAccessorProperty(
      this.globalObject,
      name,
      this.engine.createFunction(this.realm, `get ${name}`, 0, getter),
      setter === null
        ? null
        : this.engine.createFunction(this.realm, `set ${name}`, 1, setter),
      { configurable, enumerable: true },
    );
  }

  receiver(value: EngineValue): Window | null {
    const interfaceObject = this.dom.interfaceObject(value);
    return interfaceObject instanceof Window ? interfaceObject : null;
  }
}

const WINDOW_NAMED_ELEMENT_LOCAL_NAMES = new Set([
  "embed",
  "form",
  "img",
  "object",
]);

function windowNamedPropertyNames(document: Document): string[] {
  const names: string[] = [];
  for (const element of descendantElements(document)) {
    const id = element.getAttributeNS(null, "id");
    if (id !== null && id !== "" && !names.includes(id)) {
      names.push(id);
    }
    if (!isWindowNamedElement(element)) {
      continue;
    }
    const name = element.getAttributeNS(null, "name");
    if (name !== null && name !== "" && !names.includes(name)) {
      names.push(name);
    }
  }
  return names;
}

function windowNamedPropertyValue(
  document: Document,
  name: string,
): object | undefined {
  const elements = windowNamedElements(document, name);
  if (elements.length === 0) {
    return undefined;
  }
  if (elements.length === 1) {
    return elements[0];
  }
  return createHTMLCollection(() => windowNamedElements(document, name));
}

function windowNamedElements(document: Document, name: string): Element[] {
  return descendantElements(document).filter(
    (element) =>
      element.getAttributeNS(null, "id") === name ||
      (isWindowNamedElement(element) &&
        element.getAttributeNS(null, "name") === name),
  );
}

function isWindowNamedElement(element: Element): boolean {
  return (
    element.namespaceURI === HTML_NAMESPACE &&
    WINDOW_NAMED_ELEMENT_LOCAL_NAMES.has(element.localName)
  );
}
