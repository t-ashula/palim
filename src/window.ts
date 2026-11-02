import {
  bindEventTarget,
  eventTargetImplementation,
} from "./dom/event-implementation.js";
import { EventTarget } from "./dom/events.js";
import { documentImplementation } from "./dom/node-implementation.js";
import type { Document, Element } from "./dom/nodes.js";
import { parseHTML } from "./html/parser.js";

class BrowsingContext {
  readonly parent: BrowsingContext | null = null;

  constructor(
    readonly window: Window,
    readonly windowProxy: Window,
    readonly activeDocument: Document,
  ) {}

  get top(): this {
    return this;
  }
}

interface WindowEnvironment {
  readonly browsingContext: BrowsingContext;
}

const WINDOW_ENVIRONMENTS = new WeakMap<object, WindowEnvironment>();

export class Window extends EventTarget {
  constructor() {
    super();
    const proxy = new Proxy(this, {});
    bindEventTarget(proxy, eventTargetImplementation(this));

    const document = parseHTML("");
    const environment = {
      browsingContext: new BrowsingContext(this, proxy, document),
    };
    WINDOW_ENVIRONMENTS.set(this, environment);
    WINDOW_ENVIRONMENTS.set(proxy, environment);
    documentImplementation(document).defaultView = proxy;
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

function windowEnvironment(window: Window): WindowEnvironment {
  const environment = WINDOW_ENVIRONMENTS.get(window);
  if (environment === undefined) {
    throw new TypeError("Invalid Window receiver");
  }
  return environment;
}
