import type {
  EngineObject,
  EngineRealm,
  EngineValue,
  JavaScriptEngineAdapter,
} from "./adapter.js";
import type { MutationObserverMicrotaskScheduler } from "@palim/core/internal/dom.js";
import type {
  Document,
  ErrorEvent,
  Event,
  EventTarget,
} from "@palim/core/internal/dom.js";
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

  setMutationObserverMicrotaskScheduler(
    scheduler: MutationObserverMicrotaskScheduler,
  ): void {
    this.#context.mutationObserverMicrotaskScheduler = scheduler;
  }

  interfaceObject(value: EngineValue): object | null {
    return this.#context.interfaceObject(value);
  }

  setErrorEventError(event: ErrorEvent, value: EngineValue): void {
    this.#context.errorEventErrors.set(event, value);
  }

  errorEventError(event: ErrorEvent): EngineValue | undefined {
    return this.#context.errorEventErrors.get(event);
  }

  setEventHandler(target: EventTarget, handler: (event: Event) => void): void {
    this.#context.setEventHandler(target, handler);
  }

  dispatchEvent(target: EventTarget, event: Event): boolean {
    return this.#context.dispatchEvent(target, event);
  }
}
