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
  readonly url?: string | URL;
}

export interface Window extends EventTarget {
  readonly window: Window;
  readonly self: Window;
  readonly frames: Window;
  readonly document: Document;
  readonly top: Window;
  readonly parent: Window;
  readonly frameElement: Element | null;
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

function windowEnvironment(window: Window): WindowEnvironment {
  const environment = WINDOW_ENVIRONMENTS.get(window);
  if (environment === undefined) {
    throw new TypeError("Invalid Window receiver");
  }
  return environment;
}
