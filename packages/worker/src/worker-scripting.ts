import { ErrorEvent, Event, EventTarget, MessageEvent, URL } from "@palim/core";
import type {
  DedicatedWorkerExtension,
  Extension,
  HostServices,
  ServiceWorkerExtension,
  SharedWorkerExtension,
} from "@palim/polyfills";
import { createHostServices } from "@palim/polyfills";
import type {
  EngineObject,
  EngineRealm,
  EngineResult,
  EngineScript,
  EngineValue,
  ExtensionRealmBinding,
  JavaScriptEngineAdapter,
  WindowEnvironmentSettings,
  WindowRealmBinding,
  WindowScriptingCapability,
} from "@palim/scripting";
import {
  BlobRealmBindingContext,
  DOMRealmBinding,
  FormDataRealmBindingContext,
  installBlobInterfaces,
  installFormDataInterface,
  installWritableStreamRealm,
  normal,
  RealmBindingContext,
  RealmExecutionRuntime,
  realmResultToEngine,
  ScriptingWindowRealmInstaller,
  URLRealmBinding,
} from "@palim/scripting";
import type {
  Resource,
  ResourceLoader,
  ServiceWorkerRecord,
  ServiceWorkerRegistrationRecord,
} from "@palim/window";
import {
  blobBytes,
  FormData,
  loadResource,
  ServiceWorkerRegistrationStore,
  setWindowServiceWorkerStore,
} from "@palim/window";

import { installWorkerDOMRealmInterfaces } from "./javascript-engine/worker-dom-realm-installer.js";
import {
  createMessageEndpointPair,
  MessageEndpoint,
  MessagingRealm,
} from "./javascript-engine/worker-messaging.js";
import type { ServiceWorkerConnection } from "./service-worker-scripting.js";
import { WindowServiceWorkerBinding } from "./service-worker-scripting.js";

export type WorkerEngineFactory = () => JavaScriptEngineAdapter;

export interface WorkerExtensions {
  readonly dedicated?: readonly DedicatedWorkerExtension[];
  readonly shared?: readonly SharedWorkerExtension[];
  readonly service?: readonly ServiceWorkerExtension[];
}

type WorkerRealmFormDataEntry =
  | { readonly name: string; readonly value: string }
  | {
      readonly name: string;
      readonly filename: string;
      readonly type: string;
      readonly bytes: Uint8Array;
    };

interface TimerPlatform {
  clearTimeout(id: unknown): void;
  setTimeout(callback: () => void, delay?: number): unknown;
}

interface TextDecoderInstance {
  decode(input?: Uint8Array): string;
}

type TextDecoderConstructor = new (label?: string) => TextDecoderInstance;

const platform = globalThis as typeof globalThis &
  TimerPlatform & { readonly TextDecoder: TextDecoderConstructor };

interface LoadedWorkerScript {
  readonly url: URL;
  readonly source: string;
}

interface WorkerScriptCompilation {
  readonly script: EngineScript;
  readonly sourceURL: string;
}

interface WorkerErrorTarget {
  readonly target: EventTarget;
  readonly binding: WindowRealmBinding;
}

class SharedWorkerTarget extends EventTarget {}

class ServiceWorkerExtendableEvent extends Event {}

class WorkerEnvironmentSettings {
  constructor(
    readonly realm: EngineRealm,
    readonly apiBaseURL: URL,
    readonly reportException: (value: EngineValue) => void,
  ) {}
}

export class WorkerScriptingManager implements WindowScriptingCapability {
  readonly #sharedWorkers = new Map<string, WorkerController>();
  readonly #serviceWorkers = new WeakMap<
    ServiceWorkerRegistrationRecord,
    ServiceWorkerConnection
  >();
  readonly #serviceWorkerStore = new ServiceWorkerRegistrationStore();
  readonly #pendingStarts = new Set<Promise<void>>();

  constructor(
    readonly engineFactory: WorkerEngineFactory,
    readonly extensions: WorkerExtensions = {},
    readonly hostServices: HostServices = createHostServices(),
  ) {}

  installWindow(
    binding: WindowRealmBinding,
    settings: WindowEnvironmentSettings,
    resourceLoader: ResourceLoader | null,
  ): void {
    setWindowServiceWorkerStore(binding.window, this.#serviceWorkerStore);
    new WindowWorkerBinding(this, binding, settings, resourceLoader).install();
    new WindowServiceWorkerBinding(
      this,
      binding,
      settings,
      resourceLoader,
    ).install();
  }

  async waitForPendingTasks(): Promise<void> {
    while (this.#pendingStarts.size > 0) {
      await Promise.all(this.#pendingStarts);
    }
  }

  serviceWorkerStore(): ServiceWorkerRegistrationStore {
    return this.#serviceWorkerStore;
  }

  createDedicated(
    url: URL,
    resourceLoader: ResourceLoader | null,
    owner: WorkerErrorTarget,
    workerEndpoint: MessageEndpoint,
  ): WorkerController {
    const controller = new WorkerController(
      () =>
        new WorkerExecutionEnvironment(
          this.engineFactory(),
          "dedicated",
          url,
          "",
          resourceLoader,
          workerEndpoint,
          this.extensions.dedicated ?? [],
          this.hostServices,
        ),
    );
    controller.addErrorTarget(owner);
    this.#track(controller.started);
    return controller;
  }

  connectShared(
    url: URL,
    name: string,
    resourceLoader: ResourceLoader | null,
    owner: WorkerErrorTarget,
    workerPort: MessageEndpoint,
  ): WorkerController {
    const key = `${url.origin}\n${url.href}\n${name}`;
    let controller = this.#sharedWorkers.get(key);
    if (controller === undefined || controller.closed) {
      controller = new WorkerController(
        () =>
          new WorkerExecutionEnvironment(
            this.engineFactory(),
            "shared",
            url,
            name,
            resourceLoader,
            new MessageEndpoint(true),
            this.extensions.shared ?? [],
            this.hostServices,
          ),
      );
      this.#sharedWorkers.set(key, controller);
      this.#track(controller.started);
    }
    controller.addErrorTarget(owner);
    controller.connect(workerPort);
    return controller;
  }

  registerService(
    registration: ServiceWorkerRegistrationRecord,
    worker: ServiceWorkerRecord,
    resourceLoader: ResourceLoader | null,
    owner: WorkerErrorTarget,
  ): ServiceWorkerConnection {
    const existing = this.#serviceWorkers.get(registration);
    if (existing !== undefined && !existing.controller.closed) {
      return existing;
    }
    const [windowEndpoint, workerEndpoint] = createMessageEndpointPair(true);
    const controller = new WorkerController(
      () =>
        new WorkerExecutionEnvironment(
          this.engineFactory(),
          "service",
          worker.scriptURL,
          "",
          resourceLoader,
          workerEndpoint,
          this.extensions.service ?? [],
          this.hostServices,
          (state) => {
            worker.state = state;
            if (state === "activated") {
              registration.active = worker;
            }
          },
        ),
    );
    controller.addErrorTarget(owner);
    const connection = { controller, windowEndpoint, worker };
    this.#serviceWorkers.set(registration, connection);
    this.#track(controller.started);
    return connection;
  }

  #track(start: Promise<void>): void {
    this.#pendingStarts.add(start);
    void start.finally(() => {
      this.#pendingStarts.delete(start);
    });
  }
}

class WorkerController {
  readonly started: Promise<void>;
  readonly #errorTargets = new Set<WorkerErrorTarget>();
  readonly #connections: MessageEndpoint[] = [];
  #environment: WorkerExecutionEnvironment | null = null;
  closed = false;

  constructor(readonly createEnvironment: () => WorkerExecutionEnvironment) {
    this.started = Promise.resolve().then(async () => {
      if (this.closed) {
        return;
      }
      const environment = this.createEnvironment();
      this.#environment = environment;
      for (const target of this.#errorTargets) {
        environment.addErrorTarget(target);
      }
      for (const connection of this.#connections) {
        environment.connect(connection);
      }
      await environment.start();
    });
  }

  addErrorTarget(target: WorkerErrorTarget): void {
    this.#errorTargets.add(target);
    this.#environment?.addErrorTarget(target);
  }

  connect(port: MessageEndpoint): void {
    this.#connections.push(port);
    this.#environment?.connect(port);
  }

  close(): void {
    if (this.closed) {
      return;
    }
    this.closed = true;
    this.#environment?.close();
    for (const connection of this.#connections) {
      connection.close();
    }
  }
}

class WindowWorkerBinding {
  readonly #engine: JavaScriptEngineAdapter;
  readonly #context: RealmBindingContext;
  readonly #messaging: MessagingRealm;
  readonly #workerPrototype: EngineObject;
  readonly #sharedWorkerPrototype: EngineObject;
  readonly #workers = new WeakMap<MessageEndpoint, WorkerController>();

  constructor(
    readonly manager: WorkerScriptingManager,
    readonly binding: WindowRealmBinding,
    readonly settings: WindowEnvironmentSettings,
    readonly resourceLoader: ResourceLoader | null,
  ) {
    this.#engine = this.binding.context.engine;
    this.#context = this.binding.context;
    this.#messaging = new MessagingRealm(this.#context, this.binding.dom);
    this.#workerPrototype = this.#engine.createObject(
      this.binding.realm,
      this.binding.dom.eventTargetPrototype,
    );
    this.#sharedWorkerPrototype = this.#engine.createObject(
      this.binding.realm,
      this.binding.dom.eventTargetPrototype,
    );
  }

  install(): void {
    this.#installWorker();
    this.#installSharedWorker();
  }

  #installWorker(): void {
    const constructor = this.#context.createConstructor(
      "Worker",
      1,
      (_thisValue, argumentsList) => {
        const url = this.#workerURL(argumentsList, "Worker");
        if (url.type === "throw") {
          return url;
        }
        const classic = this.#classicWorkerOptions(argumentsList[1], "Worker");
        if (classic.type === "throw") {
          return classic;
        }
        const [windowEndpoint, workerEndpoint] =
          createMessageEndpointPair(true);
        const object = this.#engine.createObject(
          this.binding.realm,
          this.#workerPrototype,
        );
        this.binding.dom.bindPlatformObject(windowEndpoint, object);
        this.#messaging.bindTarget(windowEndpoint);
        const environment = this.manager.createDedicated(
          url.value,
          this.resourceLoader,
          { target: windowEndpoint, binding: this.binding },
          workerEndpoint,
        );
        this.#workers.set(windowEndpoint, environment);
        return normal(object);
      },
    );
    this.#context.installInterface(
      "Worker",
      constructor,
      this.#workerPrototype,
    );
    this.#context.method(
      this.#workerPrototype,
      "postMessage",
      1,
      (thisValue, argumentsList) => {
        const target = this.#worker(thisValue);
        return target === null
          ? this.#context.invalidReceiver("Worker", "postMessage")
          : this.#messaging.postMessage(target, argumentsList[0]);
      },
    );
    this.#context.method(this.#workerPrototype, "terminate", 0, (thisValue) => {
      const target = this.#worker(thisValue);
      if (target === null) {
        return this.#context.invalidReceiver("Worker", "terminate");
      }
      this.#workers.get(target)?.close();
      target.close();
      return this.#context.undefined();
    });
    this.#context.tag(this.#workerPrototype, "Worker");
  }

  #installSharedWorker(): void {
    const constructor = this.#context.createConstructor(
      "SharedWorker",
      1,
      (_thisValue, argumentsList) => {
        const url = this.#workerURL(argumentsList, "SharedWorker");
        if (url.type === "throw") {
          return url;
        }
        const options = this.#sharedWorkerOptions(argumentsList[1]);
        if (options.type === "throw") {
          return options;
        }
        const [windowPort, workerPort] = createMessageEndpointPair();
        const target = new SharedWorkerTarget();
        const object = this.#engine.createObject(
          this.binding.realm,
          this.#sharedWorkerPrototype,
        );
        this.binding.dom.bindPlatformObject(target, object);
        this.manager.connectShared(
          url.value,
          options.value,
          this.resourceLoader,
          { target, binding: this.binding },
          workerPort,
        );
        this.#engine.initializeDataProperty(
          object,
          "port",
          this.#messaging.wrapPort(windowPort),
          { configurable: true, enumerable: true, writable: false },
        );
        return normal(object);
      },
    );
    this.#context.installInterface(
      "SharedWorker",
      constructor,
      this.#sharedWorkerPrototype,
    );
    this.#context.tag(this.#sharedWorkerPrototype, "SharedWorker");
  }

  #workerURL(
    argumentsList: readonly EngineValue[],
    operation: string,
  ): EngineResult<URL> {
    const value = this.#context.requiredString(argumentsList, 0, operation);
    if (value.type === "throw") {
      return value;
    }
    try {
      const url = new URL(value.value, this.settings.apiBaseURL);
      return url.origin === this.settings.apiBaseURL.origin
        ? normal(url)
        : this.#context.typeError(`${operation} script must be same-origin`);
    } catch {
      return this.#context.typeError(`${operation} script URL is invalid`);
    }
  }

  #classicWorkerOptions(
    value: EngineValue | undefined,
    operation: string,
  ): EngineResult<undefined> {
    if (
      value === undefined ||
      this.#engine.isUndefined(value) ||
      this.#engine.isNull(value)
    ) {
      return normal(undefined);
    }
    const options = this.#engine.asObject(value);
    if (options === null) {
      return this.#context.typeError(`${operation} options must be an object`);
    }
    const type = this.#engine.get(this.binding.realm, options, "type");
    if (type.type === "throw") {
      return type;
    }
    if (this.#engine.isUndefined(type.value)) {
      return normal(undefined);
    }
    const converted = this.#context.string(type.value);
    return converted.type === "throw"
      ? converted
      : converted.value === "classic"
        ? normal(undefined)
        : this.#context.typeError("Module workers are not supported");
  }

  #sharedWorkerOptions(value: EngineValue | undefined): EngineResult<string> {
    if (value === undefined || this.#engine.isUndefined(value)) {
      return normal("");
    }
    const options = this.#engine.asObject(value);
    if (options === null || this.#engine.asString(value) !== null) {
      return this.#context.string(value);
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
    const name = this.#engine.get(this.binding.realm, options, "name");
    return name.type === "throw"
      ? name
      : this.#context.optionalString(name.value, "");
  }

  #worker(value: EngineValue): MessageEndpoint | null {
    const target = this.binding.dom.interfaceObject(value);
    return target instanceof MessageEndpoint ? target : null;
  }
}

class WorkerExecutionEnvironment {
  readonly realm: EngineRealm;
  readonly runtime: RealmExecutionRuntime;
  readonly context: RealmBindingContext;
  readonly dom: DOMRealmBinding;
  readonly messaging: MessagingRealm;
  readonly settings: WorkerEnvironmentSettings;
  readonly #globalObject: EngineObject;
  readonly #loadedScripts = new Map<string, LoadedWorkerScript>();
  readonly #errorTargets = new Set<WorkerErrorTarget>();
  readonly #timers = new Map<number, unknown>();
  readonly #connections: MessageEndpoint[] = [];
  readonly #extendableEventPromises = new WeakMap<
    ServiceWorkerExtendableEvent,
    EngineObject[]
  >();
  #startPromise: Promise<void> | null = null;
  #performingCheckpoint = false;
  #reportingException = false;
  #nextTimerId = 1;
  closed = false;

  constructor(
    readonly engine: JavaScriptEngineAdapter,
    readonly kind: "dedicated" | "shared" | "service",
    readonly url: URL,
    readonly name: string,
    readonly resourceLoader: ResourceLoader | null,
    readonly globalTarget: MessageEndpoint,
    readonly extensions: readonly Extension[],
    readonly hostServices: HostServices,
    readonly serviceWorkerStateChanged: (
      state: ServiceWorkerRecord["state"],
    ) => void = () => undefined,
  ) {
    this.realm = this.engine.createRealm();
    this.runtime = new RealmExecutionRuntime(this.engine, () => {
      if (this.#performingCheckpoint) {
        return;
      }
      this.#performingCheckpoint = true;
      try {
        this.runtime.performMicrotaskCheckpoint();
      } finally {
        this.#performingCheckpoint = false;
      }
    });
    this.context = new RealmBindingContext(
      this.engine,
      this.realm,
      this.runtime,
    );
    this.dom = new DOMRealmBinding(
      this.engine,
      this.realm,
      null,
      this.context,
      (value) => {
        this.reportException(value);
      },
      installWorkerDOMRealmInterfaces,
    );
    this.messaging = new MessagingRealm(this.context, this.dom);
    this.settings = new WorkerEnvironmentSettings(
      this.realm,
      new URL(this.url.href),
      (value) => {
        this.reportException(value);
      },
    );
    this.runtime.registerSettings(this.settings);
    this.#globalObject = this.engine.globalObject(this.realm);
    const blobs = new BlobRealmBindingContext(this.context);
    new URLRealmBinding(this.engine, this.realm, this.context, {
      blobs,
      origin: this.settings.apiBaseURL.origin,
    });
    installBlobInterfaces(this.context, blobs);
    const formData = new FormDataRealmBindingContext(this.context, blobs);
    installFormDataInterface(this.context, formData);
    installWritableStreamRealm(this.context);
    this.#installGlobal();
    this.#installExtensions(formData);
    this.messaging.bindTarget(
      this.globalTarget,
      this.kind === "service" ? this.globalTarget : null,
    );
  }

  #installExtensions(formData: FormDataRealmBindingContext): void {
    if (this.extensions.length === 0) {
      return;
    }
    const binding: ExtensionRealmBinding = {
      context: this.context,
      dom: this.dom,
      createFormData: (entries) => formData.wrap(new FormData(entries)),
      formDataEntries: (value) => workerFormDataEntries(formData, value),
    };
    const realm = new ScriptingWindowRealmInstaller(binding, false);
    const settings = this.settings;
    const environment = {
      get url() {
        return settings.apiBaseURL.href;
      },
      get origin() {
        return settings.apiBaseURL.origin;
      },
      hasDocument: false,
      isActive: () => !this.closed,
    };
    const extensionContext = Object.freeze({
      realm,
      environment,
      tasks: {
        enqueue: (
          callback: () => Parameters<typeof realmResultToEngine>[0],
        ) => {
          const id = this.#nextTimerId;
          this.#nextTimerId += 1;
          const timer = platform.setTimeout(() => {
            this.#timers.delete(id);
            if (this.closed) {
              return;
            }
            const result = this.runtime.run(this.settings, this.settings, () =>
              realmResultToEngine(callback()),
            );
            if (result.type === "throw") {
              this.reportException(result.value);
            }
          }, 0);
          this.#timers.set(id, timer);
        },
      },
      host: this.hostServices,
    });
    for (const extension of this.extensions) {
      const result = this.runtime.run(this.settings, this.settings, () => {
        extension(extensionContext);
        return this.context.undefined();
      });
      if (result.type === "throw") {
        this.reportException(result.value);
      }
    }
  }

  addErrorTarget(target: WorkerErrorTarget): void {
    this.#errorTargets.add(target);
  }

  start(): Promise<void> {
    this.#startPromise ??= this.#start();
    return this.#startPromise;
  }

  connect(port: MessageEndpoint): void {
    this.#connections.push(port);
    void this.start().then(() => {
      if (this.closed) {
        return;
      }
      this.messaging.wrapPort(port);
      port.start();
      const event = new MessageEvent("connect", {
        source: port,
        ports: [port],
      });
      this.dom.dispatchEvent(this.globalTarget, event);
    });
  }

  close(): void {
    if (this.closed) {
      return;
    }
    this.closed = true;
    this.globalTarget.close();
    for (const timer of this.#timers.values()) {
      platform.clearTimeout(timer);
    }
    this.#timers.clear();
    for (const connection of this.#connections) {
      connection.close();
    }
  }

  reportException(value: EngineValue): void {
    if (this.#reportingException) {
      return;
    }
    this.#reportingException = true;
    try {
      const message = this.engine.exceptionMessage(this.realm, value);
      const event = new ErrorEvent("error", {
        cancelable: true,
        message,
        filename: this.url.href,
      });
      this.dom.setErrorEventError(event, value);
      const handled = !this.dom.dispatchEvent(this.globalTarget, event);
      if (!handled) {
        for (const target of this.#errorTargets) {
          platform.setTimeout(() => {
            target.binding.dom.dispatchEvent(
              target.target,
              new ErrorEvent("error", {
                cancelable: true,
                message,
                filename: this.url.href,
              }),
            );
          }, 0);
        }
      }
    } finally {
      this.#reportingException = false;
    }
  }

  async #start(): Promise<void> {
    try {
      const script = await this.#loadScript(this.url);
      await this.#preloadImports(script);
      if (this.closed) {
        return;
      }
      const result = this.#runScript(script);
      if (result.type === "throw") {
        this.reportException(result.value);
        if (this.kind === "service") {
          this.serviceWorkerStateChanged("redundant");
        }
        return;
      }
      if (this.kind === "service") {
        if (!(await this.#dispatchExtendableEvent("install"))) {
          this.serviceWorkerStateChanged("redundant");
          return;
        }
        this.serviceWorkerStateChanged("installed");
        this.serviceWorkerStateChanged("activating");
        if (!(await this.#dispatchExtendableEvent("activate"))) {
          this.serviceWorkerStateChanged("redundant");
          return;
        }
        this.serviceWorkerStateChanged("activated");
      }
    } catch (error: unknown) {
      const value = this.engine.createTypeError(
        this.realm,
        error instanceof Error ? error.message : "Failed to load worker script",
      );
      this.reportException(value);
      if (this.kind === "service") {
        this.serviceWorkerStateChanged("redundant");
      }
    }
  }

  async #loadScript(url: URL): Promise<LoadedWorkerScript> {
    const cached = this.#loadedScripts.get(url.href);
    if (cached !== undefined) {
      return cached;
    }
    const loaded = loadResource(this.resourceLoader, new URL(url.href));
    if (loaded.type === "not-found") {
      throw new Error("Worker script resource was not found");
    }
    if (loaded.type === "missing-loader") {
      throw new Error("Worker script loading requires a resource loader");
    }
    const resource = await loaded.resource;
    const finalURL = new URL(resource.url?.toString() ?? url.href, url);
    if (finalURL.origin !== this.url.origin) {
      throw new TypeError("Worker script redirect must be same-origin");
    }
    const script = {
      url: finalURL,
      source: decodeWorkerScript(resource),
    };
    this.#loadedScripts.set(url.href, script);
    this.#loadedScripts.set(finalURL.href, script);
    return script;
  }

  async #preloadImports(script: LoadedWorkerScript): Promise<void> {
    for (const specifier of literalImportScripts(script.source)) {
      const url = new URL(specifier, this.settings.apiBaseURL);
      const imported = await this.#loadScript(url);
      await this.#preloadImports(imported);
    }
  }

  #runScript(script: LoadedWorkerScript): EngineResult<EngineValue> {
    const compilation = this.#compileScript(script);
    return compilation.type === "throw"
      ? compilation
      : this.runtime.run(this.settings, this.settings, () =>
          this.engine.runScript(this.realm, compilation.value.script),
        );
  }

  #compileScript(
    script: LoadedWorkerScript,
  ): EngineResult<WorkerScriptCompilation> {
    const compilation = this.engine.compileScript(
      this.realm,
      script.source,
      script.url.href,
    );
    if (compilation.type === "throw") {
      return compilation;
    }
    this.runtime.registerScriptSettings(compilation.value, this.settings);
    return normal({ script: compilation.value, sourceURL: script.url.href });
  }

  #installGlobal(): void {
    const objectPrototype = this.engine.objectPrototype(this.realm);
    const workerGlobalPrototype = this.engine.createObject(
      this.realm,
      this.dom.eventTargetPrototype,
    );
    const specificPrototype = this.engine.createObject(
      this.realm,
      workerGlobalPrototype,
    );
    const workerGlobalConstructor = this.context.function(
      "WorkerGlobalScope",
      0,
      () => this.context.typeError("Illegal constructor"),
    );
    this.context.installInterface(
      "WorkerGlobalScope",
      workerGlobalConstructor,
      workerGlobalPrototype,
    );
    if (this.kind === "service") {
      const extendableEventPrototype = this.engine.createObject(
        this.realm,
        this.dom.eventPrototype,
      );
      const extendableEventConstructor = this.context.function(
        "ExtendableEvent",
        1,
        () => this.context.typeError("Illegal constructor"),
      );
      this.context.installInterface(
        "ExtendableEvent",
        extendableEventConstructor,
        extendableEventPrototype,
      );
      this.context.method(
        extendableEventPrototype,
        "waitUntil",
        1,
        (thisValue, argumentsList) => {
          const target = this.dom.interfaceObject(thisValue);
          if (!(target instanceof ServiceWorkerExtendableEvent)) {
            return this.context.invalidReceiver("ExtendableEvent", "waitUntil");
          }
          const value = argumentsList[0];
          const promise =
            value === undefined ? null : this.engine.asObject(value);
          if (promise === null || !this.engine.isPromise(promise)) {
            return this.context.typeError("waitUntil requires a Promise");
          }
          this.#extendableEventPromises.get(target)?.push(promise);
          return this.context.undefined();
        },
      );
      this.context.tag(extendableEventPrototype, "ExtendableEvent");
      this.#extendableEventPrototype = extendableEventPrototype;
    }
    const specificName =
      this.kind === "dedicated"
        ? "DedicatedWorkerGlobalScope"
        : this.kind === "shared"
          ? "SharedWorkerGlobalScope"
          : "ServiceWorkerGlobalScope";
    const specificConstructor = this.context.function(specificName, 0, () =>
      this.context.typeError("Illegal constructor"),
    );
    this.context.installInterface(
      specificName,
      specificConstructor,
      specificPrototype,
    );
    this.engine.initializePrototypeOf(this.#globalObject, specificPrototype);
    this.dom.bindPlatformObject(this.globalTarget, this.#globalObject);
    this.context.tag(workerGlobalPrototype, "WorkerGlobalScope");
    this.context.tag(specificPrototype, specificName);
    this.context.dataProperty(
      this.#globalObject,
      "self",
      this.engine.globalThis(this.realm),
    );
    if (this.kind === "shared") {
      this.context.dataProperty(
        this.#globalObject,
        "name",
        this.engine.fromPrimitive(this.name),
      );
    } else {
      this.context.method(
        this.#globalObject,
        "postMessage",
        1,
        (_thisValue, argumentsList) =>
          this.messaging.postMessage(this.globalTarget, argumentsList[0]),
      );
    }
    this.context.method(this.#globalObject, "close", 0, () => {
      this.close();
      return this.context.undefined();
    });
    if (this.kind === "service") {
      this.context.method(this.#globalObject, "skipWaiting", 0, () => {
        const promise = this.engine.evaluate(
          this.realm,
          "Promise.resolve(undefined)",
        );
        return promise;
      });
      const clients = this.engine.createObject(this.realm, objectPrototype);
      this.context.interfaceProperty("clients", clients, this.#globalObject);
    }
    this.context.method(
      this.#globalObject,
      "importScripts",
      0,
      (_thisValue, argumentsList) => this.#importScripts(argumentsList),
    );
    this.#installTimers();
    this.#installLocation();
    this.#installNavigator(objectPrototype);
  }

  #extendableEventPrototype: EngineObject | null = null;

  async #dispatchExtendableEvent(
    type: "install" | "activate",
  ): Promise<boolean> {
    const event = new ServiceWorkerExtendableEvent(type);
    const promises: EngineObject[] = [];
    this.#extendableEventPromises.set(event, promises);
    if (this.#extendableEventPrototype !== null) {
      const object = this.engine.createObject(
        this.realm,
        this.#extendableEventPrototype,
      );
      this.dom.bindPlatformObject(event, object);
    }
    this.dom.dispatchEvent(this.globalTarget, event);
    const results = await Promise.all(
      promises.map((promise) => this.#awaitEnginePromise(promise)),
    );
    return results.every((result) => result);
  }

  #awaitEnginePromise(promise: EngineObject): Promise<boolean> {
    return new Promise((resolve) => {
      const thenValue = this.engine.get(this.realm, promise, "then");
      const then =
        thenValue.type === "normal"
          ? this.engine.asCallable(thenValue.value)
          : null;
      if (then === null) {
        resolve(false);
        return;
      }
      const fulfilled = this.context.function("", 0, () => {
        resolve(true);
        return this.context.undefined();
      });
      const rejected = this.context.function("", 0, () => {
        resolve(false);
        return this.context.undefined();
      });
      const result = this.context.call(then, promise, [fulfilled, rejected]);
      if (result.type === "throw") {
        resolve(false);
      }
    });
  }

  #importScripts(
    argumentsList: readonly EngineValue[],
  ): EngineResult<EngineValue> {
    for (const value of argumentsList) {
      const specifier = this.context.string(value);
      if (specifier.type === "throw") {
        return specifier;
      }
      let url: URL;
      try {
        url = new URL(specifier.value, this.settings.apiBaseURL);
      } catch {
        return this.context.typeError("importScripts URL is invalid");
      }
      const script = this.#loadedScripts.get(url.href);
      if (script === undefined) {
        return this.context.typeError(
          `importScripts resource was not preloaded: ${url.href}`,
        );
      }
      const result = this.#runScript(script);
      if (result.type === "throw") {
        return result;
      }
    }
    return this.context.undefined();
  }

  #installTimers(): void {
    this.context.method(
      this.#globalObject,
      "queueMicrotask",
      1,
      (_thisValue, argumentsList) => {
        const callback = this.context.requiredCallable(
          argumentsList[0],
          "queueMicrotask callback must be callable",
          {
            exceptionBehavior: "report",
            reportException: (value) => {
              this.reportException(value);
            },
          },
        );
        if (callback.type === "throw") {
          return callback;
        }
        this.runtime.enqueueMicrotask(this.settings, () => {
          this.context.invokeCallback(
            callback.value,
            this.engine.fromPrimitive(undefined),
            [],
          );
        });
        return this.context.undefined();
      },
    );
    this.context.method(
      this.#globalObject,
      "setTimeout",
      1,
      (_thisValue, argumentsList) => {
        const callback = this.context.requiredCallable(
          argumentsList[0],
          "setTimeout callback must be callable",
          {
            exceptionBehavior: "report",
            reportException: (value) => {
              this.reportException(value);
            },
          },
        );
        if (callback.type === "throw") {
          return callback;
        }
        const delay =
          argumentsList[1] === undefined
            ? normal(0)
            : this.engine.toNumber(this.realm, argumentsList[1]);
        if (delay.type === "throw") {
          return delay;
        }
        const id = this.#nextTimerId;
        this.#nextTimerId += 1;
        const timer = platform.setTimeout(
          () => {
            this.#timers.delete(id);
            if (this.closed) {
              return;
            }
            this.runtime.run(this.settings, this.settings, () =>
              this.context.invokeCallback(
                callback.value,
                this.engine.globalThis(this.realm),
                argumentsList.slice(2),
              ),
            );
          },
          Math.max(0, delay.value),
        );
        this.#timers.set(id, timer);
        return normal(this.engine.fromPrimitive(id));
      },
    );
    this.context.method(
      this.#globalObject,
      "clearTimeout",
      1,
      (_thisValue, argumentsList) => {
        const value = argumentsList[0];
        const converted =
          value === undefined
            ? normal(0)
            : this.engine.toNumber(this.realm, value);
        if (converted.type === "throw") {
          return converted;
        }
        const id = Math.trunc(converted.value);
        const timer = this.#timers.get(id);
        if (timer !== undefined) {
          platform.clearTimeout(timer);
          this.#timers.delete(id);
        }
        return this.context.undefined();
      },
    );
  }

  #installLocation(): void {
    const location = this.engine.createObject(
      this.realm,
      this.engine.objectPrototype(this.realm),
    );
    for (const name of [
      "href",
      "origin",
      "protocol",
      "host",
      "hostname",
      "port",
      "pathname",
      "search",
      "hash",
    ] as const) {
      this.context.dataProperty(
        location,
        name,
        this.engine.fromPrimitive(this.url[name]),
      );
    }
    this.context.method(location, "toString", 0, () =>
      normal(this.engine.fromPrimitive(this.url.href)),
    );
    this.context.interfaceProperty("location", location, this.#globalObject);
  }

  #installNavigator(objectPrototype: EngineObject): void {
    const navigator = this.engine.createObject(this.realm, objectPrototype);
    this.context.dataProperty(
      navigator,
      "userAgent",
      this.engine.fromPrimitive("palim"),
    );
    this.context.dataProperty(
      navigator,
      "onLine",
      this.engine.fromPrimitive(true),
    );
    this.context.interfaceProperty("navigator", navigator, this.#globalObject);
  }
}

function workerFormDataEntries(
  formDataBinding: FormDataRealmBindingContext,
  value: EngineValue,
): readonly WorkerRealmFormDataEntry[] | null {
  const formData = formDataBinding.value(value);
  if (formData === null) {
    return null;
  }
  return Array.from(formData, ([name, entry]): WorkerRealmFormDataEntry =>
    typeof entry === "string"
      ? { name, value: entry }
      : {
          name,
          filename: entry.name,
          type: entry.type,
          bytes: blobBytes(entry),
        },
  );
}

function decodeWorkerScript(resource: Resource): string {
  return new platform.TextDecoder(resource.encoding ?? "utf-8").decode(
    resource.body,
  );
}

function literalImportScripts(source: string): readonly string[] {
  const specifiers: string[] = [];
  const pattern = /\bimportScripts\s*\(\s*(["'])(.*?)\1\s*\)/gu;
  for (const match of source.matchAll(pattern)) {
    const value = match[2];
    if (value !== undefined) {
      specifiers.push(value.replace(/\\([\\"'])/gu, "$1"));
    }
  }
  return specifiers;
}
