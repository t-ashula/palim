import { Event } from "@palim/core/internal/dom/events.js";
import type { Document, Element } from "@palim/core/internal/dom/nodes.js";
import { descendantElements } from "@palim/core/internal/dom/traversal.js";
import { HTMLScriptElement } from "@palim/core/internal/html-elements.js";
import { parseHTMLIntoDocumentAsync } from "@palim/core/internal/html/parser.js";
import { URL } from "@palim/core/internal/url/index.js";

import {
  createWindow,
  createWindowForDocument,
  type Window,
  type WindowOptions,
} from "./window.js";

export interface Resource {
  readonly body: Uint8Array;
  readonly url?: string | URL;
  readonly encoding?: string;
}

export interface ResourceLoader {
  load(url: URL): Promise<Resource>;
}

export interface WindowScripting {
  processScript(element: unknown): Promise<void>;
  waitForPendingScripts(): Promise<void>;
}

export interface WindowDocumentOptions extends WindowOptions {
  readonly resourceLoader?: ResourceLoader;
}

export class WindowDocumentLoader {
  readonly window: Window;
  readonly resourceLoader: ResourceLoader | null;
  readonly #pendingResourceLoads: Promise<void>[] = [];

  constructor(options: WindowDocumentOptions = {}, document?: Document) {
    this.window =
      document === undefined
        ? createWindow(options)
        : createWindowForDocument(document, options);
    this.resourceLoader = options.resourceLoader ?? null;
  }

  async loadHTML(
    source: string,
    scripting: WindowScripting | null,
  ): Promise<Document> {
    this.#pendingResourceLoads.length = 0;
    const document = await parseHTMLIntoDocumentAsync(
      source,
      this.window.document,
      async (element) => scripting?.processScript(element),
      (element) => {
        this.#processElement(element);
      },
    );
    await this.#finish(scripting);
    return document;
  }

  async loadParsedDocument(
    scripting: WindowScripting | null,
  ): Promise<Document> {
    this.#pendingResourceLoads.length = 0;
    const document = this.window.document;
    for (const element of descendantElements(document)) {
      this.#processElement(element);
      await scripting?.processScript(element);
    }
    await this.#finish(scripting);
    return document;
  }

  async #finish(scripting: WindowScripting | null): Promise<void> {
    await Promise.all(this.#pendingResourceLoads);
    await scripting?.waitForPendingScripts();
    this.window.dispatchEvent(new Event("load"));
  }

  #processElement(element: Element): void {
    for (const value of resourceURLs(element)) {
      this.#pendingResourceLoads.push(this.#loadResource(element, value));
    }
  }

  async #loadResource(element: Element, value: string): Promise<void> {
    if (this.resourceLoader === null) {
      return;
    }
    let resourceURL: URL;
    try {
      resourceURL = new URL(value, baseURL(element));
    } catch {
      return;
    }
    try {
      await this.resourceLoader.load(new URL(resourceURL.href));
    } catch {
      // A subresource failure does not abort loading the document.
    }
  }
}

function baseURL(element: Element): URL {
  const document = element.ownerDocument;
  const fallback = new URL(document?.URL ?? "about:blank");
  const value = document?.querySelector("base[href]")?.getAttribute("href");
  if (value === null || value === undefined) {
    return fallback;
  }
  try {
    return new URL(value, fallback);
  } catch {
    return fallback;
  }
}

function resourceURLs(element: Element): string[] {
  if (element instanceof HTMLScriptElement) {
    return [];
  }
  switch (element.localName) {
    case "link": {
      const rel = new Set(
        (element.getAttribute("rel") ?? "")
          .toLowerCase()
          .split(/[\t\n\f\r ]+/u),
      );
      const loadsResource = [
        "icon",
        "modulepreload",
        "prefetch",
        "preload",
        "stylesheet",
      ].some((token) => rel.has(token));
      return loadsResource ? resourceAttribute(element, "href") : [];
    }
    case "img":
      return resourceAttribute(element, "src");
    case "input":
      return (element.getAttribute("type") ?? "").toLowerCase() === "image"
        ? resourceAttribute(element, "src")
        : [];
    case "iframe":
    case "frame":
    case "embed":
    case "audio":
    case "source":
    case "track":
      return resourceAttribute(element, "src");
    case "object":
      return resourceAttribute(element, "data");
    case "video":
      return [
        ...resourceAttribute(element, "src"),
        ...resourceAttribute(element, "poster"),
      ];
    default:
      return [];
  }
}

function resourceAttribute(element: Element, attribute: string): string[] {
  const value = element.getAttribute(attribute);
  return value === null || value === "" ? [] : [value];
}
