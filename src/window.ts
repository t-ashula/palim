import {
  bindEventTarget,
  eventTargetImplementation,
} from "./dom/event-implementation.js";
import { EventTarget } from "./dom/events.js";
import { documentImplementation } from "./dom/node-implementation.js";
import { parseHTML } from "./html/parser.js";
import { originFromURL } from "./origin.js";
import type { Document, Element } from "./public-dom-interfaces.js";
import { URL } from "./url/index.js";

export interface WindowOptions {
  readonly consoleHandler?: WindowConsoleHandler;
  readonly url?: string | URL;
}

export interface WindowErrorReport {
  readonly message: string;
  readonly url: string;
  readonly stack?: string;
}

export type WindowConsoleMethod =
  | "assert"
  | "clear"
  | "count"
  | "countReset"
  | "debug"
  | "dir"
  | "dirxml"
  | "error"
  | "group"
  | "groupCollapsed"
  | "groupEnd"
  | "info"
  | "log"
  | "table"
  | "time"
  | "timeEnd"
  | "timeLog"
  | "trace"
  | "warn";

export interface WindowConsoleCall {
  readonly method: WindowConsoleMethod;
  readonly arguments: readonly string[];
}

export type WindowErrorHandler = (report: WindowErrorReport) => void;
export type WindowConsoleHandler = (call: WindowConsoleCall) => void;

export interface Window extends EventTarget {
  readonly window: Window;
  readonly self: Window;
  readonly frames: Window;
  readonly document: Document;
  readonly top: Window;
  readonly parent: Window;
  readonly frameElement: Element | null;
  onerror(handler: WindowErrorHandler): () => void;
}

interface WindowInterface {
  readonly length: number;
  readonly name: string;
  readonly prototype: Window;
  [Symbol.hasInstance](value: unknown): value is Window;
}

class BrowsingContext {
  readonly parent: BrowsingContext | null = null;

  constructor(
    readonly window: Window,
    readonly windowProxy: Window,
    readonly activeDocument: Document,
    readonly creationURL: URL,
  ) {}

  get top(): this {
    return this;
  }
}

interface WindowEnvironment {
  readonly browsingContext: BrowsingContext;
  readonly consoleHandler: WindowConsoleHandler | null;
  readonly errorHandlers: Set<WindowErrorHandler>;
  readonly errors: WindowErrorReport[];
}

const WINDOW_ENVIRONMENTS = new WeakMap<object, WindowEnvironment>();

class WindowPlatform extends EventTarget implements Window {
  constructor(construction?: unknown) {
    super();
    if (!(construction instanceof WindowConstruction)) {
      throw new TypeError("Illegal constructor");
    }
    const proxy = new Proxy(this, {});
    bindEventTarget(proxy, eventTargetImplementation(this));

    const document = parseHTML("");
    const url = new URL(construction.options.url ?? "about:blank");
    const implementation = documentImplementation(document);
    implementation.url = url;
    implementation.origin = originFromURL(url);
    const environment = {
      browsingContext: new BrowsingContext(this, proxy, document, url),
      consoleHandler: construction.options.consoleHandler ?? null,
      errorHandlers: new Set<WindowErrorHandler>(),
      errors: [],
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

  get top(): Window {
    return windowEnvironment(this).browsingContext.top.windowProxy;
  }

  get parent(): Window {
    const context = windowEnvironment(this).browsingContext;
    return (context.parent ?? context).windowProxy;
  }

  readonly frameElement: Element | null = null;

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

class WindowConstruction {
  constructor(readonly options: WindowOptions) {}
}

Object.defineProperties(WindowPlatform, {
  length: { configurable: true, value: 0 },
  name: { configurable: true, value: "Window" },
});

export const Window = WindowPlatform as unknown as WindowInterface;

export function createWindow(options: WindowOptions = {}): Window {
  return new WindowPlatform(new WindowConstruction(options));
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
