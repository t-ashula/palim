import type { EventTarget } from "@palim/core";
import { URL } from "@palim/core";
import type {
  EngineCallable,
  EngineObject,
  EngineResult,
  EngineValue,
  JavaScriptEngineAdapter,
  RealmBindingContext,
  WindowEnvironmentSettings,
  WindowRealmBinding,
} from "@palim/scripting";
import { normal } from "@palim/scripting";
import type {
  ResourceLoader,
  ServiceWorkerRegistrationStore,
} from "@palim/window";
import {
  ServiceWorkerRecord,
  ServiceWorkerRegistrationRecord,
  windowNavigator,
  windowServiceWorkerContainer,
} from "@palim/window";

import type { MessageEndpoint } from "./javascript-engine/worker-messaging.js";
import { MessagingRealm } from "./javascript-engine/worker-messaging.js";

export interface ServiceWorkerController {
  readonly started: Promise<void>;
  readonly closed: boolean;
  close(): void;
}

export interface ServiceWorkerConnection {
  readonly controller: ServiceWorkerController;
  readonly windowEndpoint: MessageEndpoint;
  readonly worker: ServiceWorkerRecord;
}

export interface ServiceWorkerManager {
  registerService(
    registration: ServiceWorkerRegistrationRecord,
    worker: ServiceWorkerRecord,
    resourceLoader: ResourceLoader | null,
    owner: {
      readonly target: EventTarget;
      readonly binding: WindowRealmBinding;
    },
  ): ServiceWorkerConnection;
  serviceWorkerStore(): ServiceWorkerRegistrationStore;
}

interface PromiseCapability {
  readonly promise: EngineObject;
  readonly resolve: EngineCallable;
  readonly reject: EngineCallable;
}

export class WindowServiceWorkerBinding {
  readonly #engine: JavaScriptEngineAdapter;
  readonly #context: RealmBindingContext;
  readonly #messaging: MessagingRealm;
  readonly #navigatorPrototype: EngineObject;
  readonly #containerPrototype: EngineObject;
  readonly #registrationPrototype: EngineObject;
  readonly #workerPrototype: EngineObject;
  readonly #navigatorObject: EngineObject;
  readonly #containerObject: EngineObject;
  readonly #registrationObjects = new WeakMap<
    ServiceWorkerRegistrationRecord,
    EngineObject
  >();
  readonly #workerObjects = new WeakMap<ServiceWorkerRecord, EngineObject>();
  readonly #connections = new WeakMap<
    ServiceWorkerRecord,
    ServiceWorkerConnection
  >();

  constructor(
    readonly manager: ServiceWorkerManager,
    readonly binding: WindowRealmBinding,
    readonly settings: WindowEnvironmentSettings,
    readonly resourceLoader: ResourceLoader | null,
  ) {
    this.#engine = binding.context.engine;
    this.#context = binding.context;
    this.#messaging = new MessagingRealm(this.#context, binding.dom, false);
    const objectPrototype = this.#engine.objectPrototype(binding.realm);
    this.#navigatorPrototype = this.#engine.createObject(
      binding.realm,
      objectPrototype,
    );
    this.#containerPrototype = this.#engine.createObject(
      binding.realm,
      binding.dom.eventTargetPrototype,
    );
    this.#registrationPrototype = this.#engine.createObject(
      binding.realm,
      binding.dom.eventTargetPrototype,
    );
    this.#workerPrototype = this.#engine.createObject(
      binding.realm,
      binding.dom.eventTargetPrototype,
    );
    this.#navigatorObject = this.#engine.createObject(
      binding.realm,
      this.#navigatorPrototype,
    );
    this.#containerObject = this.#engine.createObject(
      binding.realm,
      this.#containerPrototype,
    );
    binding.dom.bindPlatformObject(
      windowServiceWorkerContainer(binding.window),
      this.#containerObject,
    );
  }

  install(): void {
    this.#installInterfaces();
    this.#context.interfaceProperty("navigator", this.#navigatorObject);
  }

  #installInterfaces(): void {
    for (const [name, prototype] of [
      ["Navigator", this.#navigatorPrototype],
      ["ServiceWorkerContainer", this.#containerPrototype],
      ["ServiceWorkerRegistration", this.#registrationPrototype],
      ["ServiceWorker", this.#workerPrototype],
    ] as const) {
      this.#context.installInterface(
        name,
        this.#context.function(name, 0, () =>
          this.#context.typeError("Illegal constructor"),
        ),
        prototype,
      );
      this.#context.tag(prototype, name);
    }
    this.#context.attribute(
      this.#navigatorPrototype,
      "serviceWorker",
      (thisValue) =>
        thisValue === this.#navigatorObject
          ? normal(this.#containerObject)
          : this.#context.invalidReceiver("Navigator", "serviceWorker"),
    );
    for (const name of ["userAgent", "onLine"] as const) {
      this.#context.attribute(this.#navigatorPrototype, name, (thisValue) =>
        thisValue === this.#navigatorObject
          ? normal(
              this.#engine.fromPrimitive(
                windowNavigator(this.binding.window)[name],
              ),
            )
          : this.#context.invalidReceiver("Navigator", name),
      );
    }
    this.#context.method(
      this.#containerPrototype,
      "getRegistration",
      0,
      (thisValue, argumentsList) => {
        if (thisValue !== this.#containerObject) {
          return this.#context.invalidReceiver(
            "ServiceWorkerContainer",
            "getRegistration",
          );
        }
        const scope = this.#scopeURL(argumentsList[0]);
        if (scope.type === "throw") {
          return scope;
        }
        const registration = this.#managerRegistration(scope.value);
        return normal(
          this.#resolvedPromise(
            registration === null
              ? this.#engine.fromPrimitive(undefined)
              : this.#registrationObject(registration),
          ),
        );
      },
    );
    this.#context.method(
      this.#containerPrototype,
      "register",
      1,
      (thisValue, argumentsList) => {
        if (thisValue !== this.#containerObject) {
          return this.#context.invalidReceiver(
            "ServiceWorkerContainer",
            "register",
          );
        }
        const script = this.#scriptURL(argumentsList);
        if (script.type === "throw") {
          return script;
        }
        const scopeValue = this.#scopeOption(argumentsList[1]);
        if (scopeValue.type === "throw") {
          return scopeValue;
        }
        const scope = this.#scopeURLValue(
          scopeValue.value ?? new URL("./", script.value).href,
        );
        if (scope.type === "throw") {
          return scope;
        }
        const store = this.#serviceWorkerStore();
        const registration = store.getOrCreate(
          script.value.origin,
          scope.value,
        );
        const worker = new ServiceWorkerRecord(script.value);
        registration.installing = worker;
        const connection = this.manager.registerService(
          registration,
          worker,
          this.resourceLoader,
          {
            target: windowServiceWorkerContainer(this.binding.window),
            binding: this.binding,
          },
        );
        this.#connections.set(worker, connection);
        const workerObject = this.#workerObject(worker);
        this.binding.dom.bindPlatformObject(worker, workerObject);
        this.#messaging.bindTarget(
          connection.windowEndpoint,
          worker,
          windowServiceWorkerContainer(this.binding.window),
        );
        const capability = this.#promiseCapability();
        void connection.controller.started.then(
          () => {
            if (worker.state === "redundant") {
              this.#settle(
                capability.reject,
                this.#engine.createTypeError(
                  this.binding.realm,
                  "Service Worker registration failed",
                ),
              );
            } else {
              this.#settle(
                capability.resolve,
                this.#registrationObject(registration),
              );
            }
          },
          (error: unknown) => {
            this.#settle(
              capability.reject,
              this.#engine.createTypeError(
                this.binding.realm,
                error instanceof Error
                  ? error.message
                  : "Service Worker registration failed",
              ),
            );
          },
        );
        return normal(capability.promise);
      },
    );
    for (const name of ["installing", "waiting", "active"] as const) {
      this.#context.attribute(
        this.#registrationPrototype,
        name,
        (thisValue) => {
          const registration = this.#registration(thisValue);
          if (registration === null) {
            return this.#context.invalidReceiver(
              "ServiceWorkerRegistration",
              name,
            );
          }
          const worker = registration[name];
          return normal(
            worker === null
              ? this.#engine.fromPrimitive(null)
              : this.#workerObject(worker),
          );
        },
      );
    }
    this.#context.attribute(
      this.#registrationPrototype,
      "scope",
      (thisValue) => {
        const registration = this.#registration(thisValue);
        return registration === null
          ? this.#context.invalidReceiver("ServiceWorkerRegistration", "scope")
          : normal(this.#engine.fromPrimitive(registration.scope.href));
      },
    );
    this.#context.method(
      this.#registrationPrototype,
      "unregister",
      0,
      (thisValue) => {
        const registration = this.#registration(thisValue);
        if (registration === null) {
          return this.#context.invalidReceiver(
            "ServiceWorkerRegistration",
            "unregister",
          );
        }
        const worker =
          registration.installing ??
          registration.waiting ??
          registration.active;
        if (worker !== null) {
          this.#connections.get(worker)?.controller.close();
          worker.state = "redundant";
        }
        return normal(
          this.#resolvedPromise(
            this.#engine.fromPrimitive(
              this.#serviceWorkerStore().remove(registration),
            ),
          ),
        );
      },
    );
    this.#context.attribute(this.#workerPrototype, "scriptURL", (thisValue) => {
      const worker = this.#worker(thisValue);
      return worker === null
        ? this.#context.invalidReceiver("ServiceWorker", "scriptURL")
        : normal(this.#engine.fromPrimitive(worker.scriptURL.href));
    });
    this.#context.attribute(this.#workerPrototype, "state", (thisValue) => {
      const worker = this.#worker(thisValue);
      return worker === null
        ? this.#context.invalidReceiver("ServiceWorker", "state")
        : normal(this.#engine.fromPrimitive(worker.state));
    });
    this.#context.method(
      this.#workerPrototype,
      "postMessage",
      1,
      (thisValue, argumentsList) => {
        const worker = this.#worker(thisValue);
        if (worker === null) {
          return this.#context.invalidReceiver("ServiceWorker", "postMessage");
        }
        const connection = this.#connections.get(worker);
        return connection === undefined
          ? this.#context.typeError("Service Worker is not running")
          : this.#messaging.postMessage(
              connection.windowEndpoint,
              argumentsList[0],
            );
      },
    );
  }

  #managerRegistration(scope: URL): ServiceWorkerRegistrationRecord | null {
    return this.#serviceWorkerStore().get(scope.origin, scope);
  }

  #serviceWorkerStore(): ServiceWorkerRegistrationStore {
    return this.manager.serviceWorkerStore();
  }

  #scriptURL(argumentsList: readonly EngineValue[]): EngineResult<URL> {
    const value = this.#context.requiredString(
      argumentsList,
      0,
      "ServiceWorkerContainer.register",
    );
    return value.type === "throw" ? value : this.#scriptURLValue(value.value);
  }

  #scriptURLValue(value: string): EngineResult<URL> {
    try {
      const url = new URL(value, this.settings.apiBaseURL);
      return url.origin === this.settings.apiBaseURL.origin
        ? normal(url)
        : this.#context.typeError("Service Worker script must be same-origin");
    } catch {
      return this.#context.typeError("Service Worker script URL is invalid");
    }
  }

  #scopeURL(value: EngineValue | undefined): EngineResult<URL> {
    if (value === undefined || this.#engine.isUndefined(value)) {
      return normal(new URL(this.settings.apiBaseURL.href));
    }
    const converted = this.#context.string(value);
    return converted.type === "throw"
      ? converted
      : this.#scopeURLValue(converted.value);
  }

  #scopeURLValue(value: string): EngineResult<URL> {
    try {
      const url = new URL(value, this.settings.apiBaseURL);
      return url.origin === this.settings.apiBaseURL.origin
        ? normal(url)
        : this.#context.typeError("Service Worker scope must be same-origin");
    } catch {
      return this.#context.typeError("Service Worker scope URL is invalid");
    }
  }

  #scopeOption(value: EngineValue | undefined): EngineResult<string | null> {
    if (
      value === undefined ||
      this.#engine.isUndefined(value) ||
      this.#engine.isNull(value)
    ) {
      return normal(null);
    }
    const options = this.#engine.asObject(value);
    if (options === null) {
      return this.#context.typeError(
        "Service Worker options must be an object",
      );
    }
    const type = this.#engine.get(this.binding.realm, options, "type");
    if (type.type === "throw") {
      return type;
    }
    if (!this.#engine.isUndefined(type.value)) {
      const converted = this.#context.string(type.value);
      if (converted.type === "throw") {
        return converted;
      }
      if (converted.value !== "classic") {
        return this.#context.typeError("Module workers are not supported");
      }
    }
    const scope = this.#engine.get(this.binding.realm, options, "scope");
    return scope.type === "throw"
      ? scope
      : this.#engine.isUndefined(scope.value)
        ? normal(null)
        : this.#context.string(scope.value);
  }

  #registrationObject(
    registration: ServiceWorkerRegistrationRecord,
  ): EngineObject {
    let object = this.#registrationObjects.get(registration);
    if (object === undefined) {
      object = this.#engine.createObject(
        this.binding.realm,
        this.#registrationPrototype,
      );
      this.#registrationObjects.set(registration, object);
      this.binding.dom.bindPlatformObject(registration, object);
    }
    return object;
  }

  #workerObject(worker: ServiceWorkerRecord): EngineObject {
    let object = this.#workerObjects.get(worker);
    if (object === undefined) {
      object = this.#engine.createObject(
        this.binding.realm,
        this.#workerPrototype,
      );
      this.#workerObjects.set(worker, object);
      this.binding.dom.bindPlatformObject(worker, object);
    }
    return object;
  }

  #registration(value: EngineValue): ServiceWorkerRegistrationRecord | null {
    const target = this.binding.dom.interfaceObject(value);
    return target instanceof ServiceWorkerRegistrationRecord ? target : null;
  }

  #worker(value: EngineValue): ServiceWorkerRecord | null {
    const target = this.binding.dom.interfaceObject(value);
    return target instanceof ServiceWorkerRecord ? target : null;
  }

  #promiseCapability(): PromiseCapability {
    let resolve: EngineCallable | undefined;
    let reject: EngineCallable | undefined;
    const executor = this.#context.function(
      "",
      2,
      (_thisValue, argumentsList) => {
        resolve =
          this.#engine.asCallable(
            argumentsList[0] ?? this.#engine.fromPrimitive(undefined),
          ) ?? undefined;
        reject =
          this.#engine.asCallable(
            argumentsList[1] ?? this.#engine.fromPrimitive(undefined),
          ) ?? undefined;
        return this.#context.undefined();
      },
    );
    const promiseValue = this.#engine.get(
      this.binding.realm,
      this.#engine.globalObject(this.binding.realm),
      "Promise",
    );
    const constructor =
      promiseValue.type === "normal"
        ? this.#engine.asCallable(promiseValue.value)
        : null;
    if (constructor === null) {
      throw new TypeError("Could not get realm Promise constructor");
    }
    const promise = this.#engine.construct(this.binding.realm, constructor, [
      executor,
    ]);
    if (
      promise.type === "throw" ||
      resolve === undefined ||
      reject === undefined
    ) {
      throw new TypeError("Could not create realm Promise");
    }
    return { promise: promise.value, resolve, reject };
  }

  #resolvedPromise(value: EngineValue): EngineObject {
    const capability = this.#promiseCapability();
    this.#settle(capability.resolve, value);
    return capability.promise;
  }

  #settle(operation: EngineCallable, value: EngineValue): void {
    this.#context.call(operation, this.#engine.fromPrimitive(undefined), [
      value,
    ]);
  }
}
