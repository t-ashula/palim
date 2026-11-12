import type { Event } from "@palim/core/internal/dom/events.js";
import {
  ErrorEvent,
  PromiseRejectionEvent,
} from "@palim/core/internal/dom/events.js";
import { reportWindowError, Window } from "@palim/window/internal/window.js";
import {
  windowNamedPropertyNames,
  windowNamedPropertyValue,
} from "@palim/window/internal/window-named-properties.js";

import type {
  EngineCallable,
  EngineHostFunction,
  EngineObject,
  EngineRealm,
  EngineResult,
  EngineValue,
  JavaScriptEngineAdapter,
} from "./adapter.js";
import { normal } from "./adapter.js";
import { DOMRealmBinding } from "./dom-realm-binding.js";
import { createDOMLegacyPlatformObject } from "./dom-realm-legacy-platform-object.js";
import { FormDataRealmBindingContext } from "./form-data-realm-binding-context.js";
import { RealmBindingContext } from "./realm-binding-context.js";
import { RealmExecutionRuntime } from "./realm-execution-runtime.js";
import { URLRealmBinding } from "./url-realm-binding.js";
import type { WindowErrorInformation } from "./window-error-report.js";
import {
  extractWindowErrorInformation,
  windowErrorReport,
} from "./window-error-report.js";

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
  #windowErrorHandler: EngineCallable | null = null;
  readonly #promiseRejectionHandlers = new Map<
    "rejectionhandled" | "unhandledrejection",
    EngineCallable
  >();
  #reportingException = false;

  constructor(
    engine: JavaScriptEngineAdapter,
    window: Window,
    runtime?: RealmExecutionRuntime,
  ) {
    this.engine = engine;
    this.window = window;
    this.realm = this.engine.createRealm({ forwardingGlobalThis: true });
    const executionRuntime = runtime ?? new RealmExecutionRuntime(engine);
    this.context = new RealmBindingContext(
      engine,
      this.realm,
      executionRuntime,
    );
    if (runtime === undefined) {
      executionRuntime.registerSettings({ realm: this.realm });
    }
    this.globalObject = this.engine.globalObject(this.realm);
    this.globalThis = this.engine.globalThis(this.realm);
    this.dom = new DOMRealmBinding(
      this.engine,
      this.realm,
      this.window.document,
      this.context,
      (value) => {
        this.reportException(value);
      },
    );
    this.url = new URLRealmBinding(this.engine, this.realm, this.context);
    this.formData = new FormDataRealmBindingContext(this.context);
    const namedPropertiesTarget = this.engine.createObject(
      this.realm,
      this.dom.eventTargetPrototype,
    );
    this.namedPropertiesObject = createDOMLegacyPlatformObject(
      this.context,
      namedPropertiesTarget,
      {
        namedNames: () => windowNamedPropertyNames(this.window),
        namedValue: (name) => windowNamedPropertyValue(this.window, name),
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

    this.engine.initializePrototypeOf(this.globalObject, this.windowPrototype);
    this.dom.associatePlatformObject(this.window, this.globalObject);
    this.dom.bindPlatformObject(this.window, this.globalThis);
    this.dom.setEventHandler(this.window, (event) => {
      if (event instanceof ErrorEvent) {
        this.invokeWindowErrorHandler(event);
      } else if (event instanceof PromiseRejectionEvent) {
        this.invokePromiseRejectionHandler(event);
      }
    });
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

  reportException(
    value: EngineValue,
    filename = this.window.document.URL,
    mutedErrors = false,
  ): void {
    const dispatchErrorEvent = !this.#reportingException;
    if (dispatchErrorEvent) {
      this.#reportingException = true;
    }
    let information: WindowErrorInformation;
    try {
      const extracted = extractWindowErrorInformation(
        this.engine,
        this.realm,
        value,
        filename,
      );
      information = mutedErrors
        ? {
            message: "Script error.",
            filename: "",
            lineno: 0,
            colno: 0,
          }
        : extracted;
      if (dispatchErrorEvent) {
        const event = new ErrorEvent("error", {
          cancelable: true,
          message: information.message,
          filename: information.filename,
          lineno: information.lineno,
          colno: information.colno,
        });
        this.dom.setErrorEventError(
          event,
          mutedErrors ? this.engine.fromPrimitive(null) : value,
        );
        this.dom.dispatchEvent(this.window, event);
      }
    } finally {
      if (dispatchErrorEvent) {
        this.#reportingException = false;
      }
    }
    reportWindowError(this.window, windowErrorReport(information));
  }

  windowErrorHandler(): EngineValue {
    return this.#windowErrorHandler ?? this.engine.fromPrimitive(null);
  }

  setWindowErrorHandler(value: EngineValue): EngineResult<EngineValue> {
    if (this.engine.asObject(value) === null) {
      this.#windowErrorHandler = null;
      return this.context.undefined();
    }
    const callable = this.engine.asCallable(value);
    if (callable === null) {
      return this.context.typeError("Window.onerror must be callable or null");
    }
    this.#windowErrorHandler = callable;
    return this.context.undefined();
  }

  promiseRejectionHandler(
    type: "rejectionhandled" | "unhandledrejection",
  ): EngineValue {
    return (
      this.#promiseRejectionHandlers.get(type) ??
      this.engine.fromPrimitive(null)
    );
  }

  setPromiseRejectionHandler(
    type: "rejectionhandled" | "unhandledrejection",
    value: EngineValue,
  ): EngineResult<EngineValue> {
    if (this.engine.asObject(value) === null) {
      this.#promiseRejectionHandlers.delete(type);
      return this.context.undefined();
    }
    const callable = this.engine.asCallable(value);
    if (callable === null) {
      return this.context.typeError(
        `Window.on${type} must be callable or null`,
      );
    }
    this.#promiseRejectionHandlers.set(type, callable);
    return this.context.undefined();
  }

  dispatchPromiseRejectionEvent(
    type: "rejectionhandled" | "unhandledrejection",
    promise: EngineObject,
    reason: EngineValue,
  ): boolean {
    const event = new PromiseRejectionEvent(type, {
      cancelable: type === "unhandledrejection",
      promise: undefined,
      reason: undefined,
    });
    this.dom.setPromiseRejectionEventValues(event, promise, reason);
    return this.dom.dispatchEvent(this.window, event);
  }

  reportUnhandledRejection(reason: EngineValue): void {
    const information = extractWindowErrorInformation(
      this.engine,
      this.realm,
      reason,
      this.window.document.URL,
    );
    reportWindowError(this.window, windowErrorReport(information));
  }

  private invokeWindowErrorHandler(event: Event): void {
    const handler = this.#windowErrorHandler;
    if (handler === null) {
      return;
    }
    const errorEvent = event instanceof ErrorEvent ? event : null;
    const argumentsList =
      errorEvent === null
        ? [this.dom.platformObject(event)]
        : [
            this.engine.fromPrimitive(errorEvent.message),
            this.engine.fromPrimitive(errorEvent.filename),
            this.engine.fromPrimitive(errorEvent.lineno),
            this.engine.fromPrimitive(errorEvent.colno),
            this.dom.errorEventError(errorEvent) ??
              this.engine.fromPrimitive(undefined),
          ];
    const result = this.context.call(handler, this.globalThis, argumentsList);
    if (result.type === "throw") {
      this.reportException(result.value);
      return;
    }
    if (this.engine.toBoolean(result.value) === (errorEvent !== null)) {
      event.preventDefault();
    }
  }

  private invokePromiseRejectionHandler(event: PromiseRejectionEvent): void {
    const type =
      event.type === "unhandledrejection"
        ? "unhandledrejection"
        : "rejectionhandled";
    const handler = this.#promiseRejectionHandlers.get(type);
    if (handler === undefined) {
      return;
    }
    const result = this.context.call(handler, this.globalThis, [
      this.dom.platformObject(event),
    ]);
    if (result.type === "throw") {
      this.reportException(result.value);
      return;
    }
    if (this.engine.asBoolean(result.value) === false) {
      event.preventDefault();
    }
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
          const result = this.engine.defineDataProperty(
            this.realm,
            receiver,
            name,
            argumentsList[0] ?? this.engine.fromPrimitive(undefined),
            {
              configurable: true,
              enumerable: true,
              writable: true,
            },
          );
          return result.type === "throw"
            ? result
            : result.value
              ? this.context.undefined()
              : this.context.typeError(`Cannot replace Window.${name}`);
        }
      : null;
    this.engine.initializeAccessorProperty(
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
