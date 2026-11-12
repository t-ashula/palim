import {
  bindEventTarget,
  eventTargetImplementation,
} from "@palim/core/internal/dom/event-implementation.js";
import { EventTarget } from "@palim/core/internal/dom/events.js";
import { documentImplementation } from "@palim/core/internal/dom/node-implementation.js";
import { parseHTML } from "@palim/core/internal/html/parser.js";
import { originFromURL } from "@palim/core/internal/origin.js";
import type {
  Document,
  Element,
} from "@palim/core/internal/public-dom-interfaces.js";
import { URL } from "@palim/core/internal/url/index.js";
import type {
  Location,
  Window as WindowInstance,
  WindowConsoleCall,
  WindowConsoleHandler,
  WindowErrorHandler,
  WindowErrorReport,
} from "@palim/core/internal/window-types.js";

export type {
  Location,
  WindowConsoleCall,
  WindowConsoleHandler,
  WindowConsoleMethod,
  WindowErrorHandler,
  WindowErrorReport,
} from "@palim/core/internal/window-types.js";

export type Window = WindowInstance;

export interface WindowOptions {
  readonly consoleHandler?: WindowConsoleHandler;
  readonly url?: string | URL;
}

interface WindowInterface {
  readonly length: number;
  readonly name: string;
  readonly prototype: Window;
  [Symbol.hasInstance](value: unknown): value is Window;
}

class BrowsingContext {
  constructor(
    readonly window: Window,
    readonly windowProxy: Window,
    activeDocument: Document,
    readonly creationURL: URL,
    readonly parent: BrowsingContext | null,
    readonly frameElement: Element | null,
  ) {
    this.activeDocument = activeDocument;
  }

  activeDocument: Document;

  get top(): BrowsingContext {
    return this.parent?.top ?? this;
  }
}

interface WindowEnvironment {
  readonly browsingContext: BrowsingContext;
  readonly location: Location;
  readonly consoleHandler: WindowConsoleHandler | null;
  readonly errorHandlers: Set<WindowErrorHandler>;
  readonly errors: WindowErrorReport[];
  readonly timers: Map<number, unknown>;
  microtaskScheduler: WindowMicrotaskScheduler;
  nextTimerId: number;
}

export type WindowMicrotaskScheduler = (callback: () => void) => void;

const WINDOW_ENVIRONMENTS = new WeakMap<object, WindowEnvironment>();

class WindowPlatform extends EventTarget implements Window {
  constructor(construction?: unknown) {
    super();
    if (!(construction instanceof WindowConstruction)) {
      throw new TypeError("Illegal constructor");
    }
    const proxy = new Proxy(this, {});
    bindEventTarget(proxy, eventTargetImplementation(this));

    const document = construction.document ?? parseHTML("");
    const url = new URL(construction.options.url ?? "about:blank");
    const implementation = documentImplementation(document);
    const parentContext =
      construction.parent === null
        ? null
        : windowEnvironment(construction.parent).browsingContext;
    implementation.url = url;
    if (parentContext === null) {
      implementation.origin = originFromURL(url);
    } else {
      implementation.origin = documentImplementation(
        parentContext.activeDocument,
      ).origin;
      implementation.aboutBaseURL = new URL(
        parentContext.activeDocument.baseURI,
      );
    }
    const environment = {
      browsingContext: new BrowsingContext(
        this,
        proxy,
        document,
        url,
        parentContext,
        construction.frameElement,
      ),
      location: new LocationPlatform(proxy),
      consoleHandler: construction.options.consoleHandler ?? null,
      errorHandlers: new Set<WindowErrorHandler>(),
      errors: [],
      timers: new Map<number, unknown>(),
      microtaskScheduler: (callback: () => void) => {
        hostMicrotasks().queueMicrotask(callback);
      },
      nextTimerId: 1,
    };
    WINDOW_ENVIRONMENTS.set(this, environment);
    WINDOW_ENVIRONMENTS.set(proxy, environment);
    implementation.defaultView = proxy;
    return proxy;
  }

  get window(): Window {
    return windowEnvironment(this).browsingContext.windowProxy;
  }

  get self(): Window {
    return windowEnvironment(this).browsingContext.windowProxy;
  }

  get frames(): Window {
    return windowEnvironment(this).browsingContext.windowProxy;
  }

  get document(): Document {
    return windowEnvironment(this).browsingContext.activeDocument;
  }

  get location(): Location {
    return windowEnvironment(this).location;
  }

  get top(): Window {
    return windowEnvironment(this).browsingContext.top.windowProxy;
  }

  get parent(): Window {
    const context = windowEnvironment(this).browsingContext;
    return (context.parent ?? context).windowProxy;
  }

  get frameElement(): Element | null {
    return windowEnvironment(this).browsingContext.frameElement;
  }

  onerror(handler: WindowErrorHandler): () => void {
    if (typeof handler !== "function") {
      throw new TypeError("Window error handler must be callable");
    }
    const environment = windowEnvironment(this);
    environment.errorHandlers.add(handler);
    flush(environment.errors, handler);
    return () => {
      environment.errorHandlers.delete(handler);
    };
  }
}

class LocationPlatform implements Location {
  readonly #window: Window;

  constructor(window: Window) {
    this.#window = window;
  }

  get href(): string {
    return this.url().href;
  }

  get origin(): string {
    return this.url().origin;
  }

  get pathname(): string {
    return this.url().pathname;
  }

  get search(): string {
    return this.url().search;
  }

  get hash(): string {
    return this.url().hash;
  }

  toString(): string {
    return this.href;
  }

  private url(): URL {
    return new URL(this.#window.document.URL);
  }
}

class WindowConstruction {
  constructor(
    readonly options: WindowOptions,
    readonly document?: Document,
    readonly parent: Window | null = null,
    readonly frameElement: Element | null = null,
  ) {}
}

Object.defineProperties(WindowPlatform, {
  length: { configurable: true, value: 0 },
  name: { configurable: true, value: "Window" },
});

export const Window = WindowPlatform as unknown as WindowInterface;

export function createWindow(options: WindowOptions = {}): Window {
  return new WindowPlatform(new WindowConstruction(options));
}

export function createWindowForDocument(
  document: Document,
  options: WindowOptions = {},
): Window {
  return new WindowPlatform(new WindowConstruction(options, document));
}

export function createChildWindow(
  parent: Window,
  frameElement: Element,
  options: WindowOptions = {},
): Window {
  return new WindowPlatform(
    new WindowConstruction(options, undefined, parent, frameElement),
  );
}

export function detachWindow(window: Window): void {
  documentImplementation(window.document).defaultView = null;
}

export function replaceWindowDocument(
  window: Window,
  document: Document,
): void {
  const context = windowEnvironment(window).browsingContext;
  documentImplementation(context.activeDocument).defaultView = null;
  context.activeDocument = document;
  documentImplementation(document).defaultView = context.windowProxy;
}

export function reportWindowError(
  window: Window,
  report: WindowErrorReport,
): void {
  const environment = windowEnvironment(window);
  deliver(environment.errorHandlers, environment.errors, report);
}

export function reportWindowConsole(
  window: Window,
  call: WindowConsoleCall,
): void {
  const environment = windowEnvironment(window);
  environment.consoleHandler?.(call);
}

export function scheduleWindowTimeout(
  window: Window,
  callback: () => void,
  delay: number,
): number {
  const environment = windowEnvironment(window);
  const id = environment.nextTimerId;
  environment.nextTimerId += 1;
  const handle = hostTimers().setTimeout(() => {
    environment.timers.delete(id);
    callback();
  }, delay);
  environment.timers.set(id, handle);
  return id;
}

export function clearWindowTimeout(window: Window, id: number): void {
  const environment = windowEnvironment(window);
  const handle = environment.timers.get(id);
  if (handle === undefined) {
    return;
  }
  hostTimers().clearTimeout(handle);
  environment.timers.delete(id);
}

export function scheduleWindowMicrotask(
  window: Window,
  callback: () => void,
): void {
  windowEnvironment(window).microtaskScheduler(callback);
}

export function setWindowMicrotaskScheduler(
  window: Window,
  scheduler: WindowMicrotaskScheduler,
): void {
  windowEnvironment(window).microtaskScheduler = scheduler;
}

function windowEnvironment(window: Window): WindowEnvironment {
  const environment = WINDOW_ENVIRONMENTS.get(window);
  if (environment === undefined) {
    throw new TypeError("Invalid Window receiver");
  }
  return environment;
}

function deliver<T>(
  handlers: ReadonlySet<(value: T) => void>,
  pending: T[],
  value: T,
): void {
  if (handlers.size === 0) {
    pending.push(value);
    return;
  }
  for (const handler of handlers) {
    handler(value);
  }
}

function flush<T>(pending: T[], handler: (value: T) => void): void {
  const values = pending.splice(0);
  for (const value of values) {
    handler(value);
  }
}

function hostTimers(): {
  setTimeout(callback: () => void, delay: number): unknown;
  clearTimeout(handle: unknown): void;
} {
  const host: unknown = globalThis;
  return host as {
    setTimeout(callback: () => void, delay: number): unknown;
    clearTimeout(handle: unknown): void;
  };
}

function hostMicrotasks(): {
  queueMicrotask(callback: () => void): void;
} {
  const host: unknown = globalThis;
  return host as { queueMicrotask(callback: () => void): void };
}
