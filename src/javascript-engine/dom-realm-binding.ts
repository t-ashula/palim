import type {
  EngineObject,
  EngineRealm,
  EngineValue,
  JavaScriptEngineAdapter,
} from "./adapter.js";
import { DOMRealmBindingContext } from "./dom-realm-binding-context.js";

export class DOMRealmBinding {
  readonly #context: DOMRealmBindingContext;

  constructor(engine: JavaScriptEngineAdapter, realm: EngineRealm) {
    this.#context = new DOMRealmBindingContext(engine, realm);
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
