import type {
  EngineObject,
  EngineRealm,
  EngineValue,
  JavaScriptEngineAdapter,
} from "./adapter.js";
import type { Document } from "@palim/core/internal/dom.js";
import { DOMRealmBindingContext } from "./dom-realm-binding-context.js";
import { installDOMRealmInterfaces } from "./dom-realm-installer.js";
import { RealmBindingContext } from "./realm-binding-context.js";

export type RealmExceptionReporter = (value: EngineValue) => void;

export class DOMRealmBinding {
  readonly #context: DOMRealmBindingContext;

  constructor(
    engine: JavaScriptEngineAdapter,
    realm: EngineRealm,
    associatedDocument: Document | null = null,
    context = new RealmBindingContext(engine, realm),
    reportException: RealmExceptionReporter = () => undefined,
  ) {
    this.#context = new DOMRealmBindingContext(
      context,
      associatedDocument,
      reportException,
    );
    installDOMRealmInterfaces(this.#context);
  }

  expose(name: string, interfaceObject: object): void {
    this.#context.expose(name, interfaceObject);
  }

  get eventTargetPrototype(): EngineObject {
    return this.#context.eventTargetPrototype;
  }

  platformObject(interfaceObject: object): EngineObject {
    return this.#context.platformObject(interfaceObject);
  }

  bindPlatformObject(
    interfaceObject: object,
    platformObject: EngineObject,
  ): void {
    this.#context.bindPlatformObject(interfaceObject, platformObject);
  }

  associatePlatformObject(
    interfaceObject: object,
    platformObject: EngineObject,
  ): void {
    this.#context.associatePlatformObject(interfaceObject, platformObject);
  }

  interfaceObject(value: EngineValue): object | null {
    return this.#context.interfaceObject(value);
  }
}
