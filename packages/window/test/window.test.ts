import type { Element, EventTarget } from "@palim/core";
import { DOMParser, Event, setDocumentURL } from "@palim/core";
import { describe, expect, it } from "vitest";

import type { Window } from "../src/window.js";
import {
  createWindow,
  replaceWindowDocument,
  runWindowAnimationFrameCallbacks,
  scheduleWindowMicrotask,
  setWindowAnimationFrameScheduler,
  windowViewport,
} from "../src/window.js";
import {
  windowNamedPropertyNames,
  windowNamedPropertyValue,
} from "../src/window-named-properties.js";

describe("Window", () => {
  it("provides the Window animation frame API", () => {
    const window = createWindow();
    const renderingRequests: string[] = [];
    const callbacks: string[] = [];
    setWindowAnimationFrameScheduler(window, () => {
      renderingRequests.push("requested");
    });

    const first = window.requestAnimationFrame((timestamp) => {
      callbacks.push(`first:${String(timestamp)}`);
      window.requestAnimationFrame((nextTimestamp) => {
        callbacks.push(`next:${String(nextTimestamp)}`);
      });
    });
    const cancelled = window.requestAnimationFrame(() => {
      callbacks.push("cancelled");
    });
    window.cancelAnimationFrame(cancelled);

    expect(typeof window.requestAnimationFrame).toBe("function");
    expect(typeof window.cancelAnimationFrame).toBe("function");
    expect(first).toBe(1);
    expect(cancelled).toBe(2);
    expect(renderingRequests).toEqual(["requested", "requested"]);

    expect(runWindowAnimationFrameCallbacks(window, 10)).toBe(true);
    expect(callbacks).toEqual(["first:10"]);
    expect(runWindowAnimationFrameCallbacks(window, 20)).toBe(false);
    expect(callbacks).toEqual(["first:10", "next:20"]);
  });

  it("keeps animation frame callbacks with the associated Document", () => {
    const window = createWindow();
    const callbacks: string[] = [];
    window.requestAnimationFrame(() => callbacks.push("old document"));

    const replacement = new DOMParser().parseFromString(
      "<html></html>",
      "text/html",
    );
    replaceWindowDocument(window, replacement);
    expect(
      window.requestAnimationFrame(() => callbacks.push("active document")),
    ).toBe(1);

    runWindowAnimationFrameCallbacks(window, 10);
    expect(callbacks).toEqual(["active document"]);
  });

  it("owns microtask scheduling in the Window runtime", async () => {
    const window = createWindow();
    const calls: string[] = [];

    scheduleWindowMicrotask(window, () => calls.push("first"));
    scheduleWindowMicrotask(window, () => calls.push("second"));
    calls.push("sync");

    expect(calls).toEqual(["sync"]);
    await new Promise<void>((resolve) => {
      queueMicrotask(resolve);
    });
    expect(calls).toEqual(["sync", "first", "second"]);
  });

  it("creates a top-level Window environment", () => {
    const window = createWindow();

    expect(window.window).toBe(window);
    expect(window.self).toBe(window);
    expect(window.frames).toBe(window);
    expect(window.top).toBe(window);
    expect(window.parent).toBe(window);
    expect(window.frameElement).toBeNull();
    expect(window.document.defaultView).toBe(window);
    expect(window.document.documentElement?.localName).toBe("html");
    expect(window.document.head?.localName).toBe("head");
    expect(window.document.body?.localName).toBe("body");
  });

  it("owns viewport dimensions", () => {
    expect(windowViewport(createWindow())).toEqual({
      width: 1024,
      height: 768,
    });
    expect(
      windowViewport(createWindow({ viewport: { width: 640, height: 480 } })),
    ).toEqual({ width: 640, height: 480 });
    const window = createWindow({ viewport: { width: 640, height: 480 } });
    expect(window.innerWidth).toBe(640);
    expect(window.innerHeight).toBe(480);
  });

  it("owns Location state in the Window runtime", () => {
    const window = createWindow({
      url: "https://example.test/first?q=1#old",
    });

    expect(window.location.href).toBe("https://example.test/first?q=1#old");
    expect(window.location.origin).toBe("https://example.test");
    expect(window.location.pathname).toBe("/first");
    expect(window.location.search).toBe("?q=1");
    expect(window.location.hash).toBe("#old");
    expect(window.location.toString()).toBe(window.location.href);

    setDocumentURL(window.document, "https://example.test/next#new");
    expect(window.location.href).toBe("https://example.test/next#new");
  });

  it("computes live named properties outside a realm binding", () => {
    const window = createWindow();
    const first = window.document.createElement("img");
    first.setAttribute("name", "target");
    window.document.body?.append(first);

    expect(windowNamedPropertyNames(window)).toEqual(["target"]);
    expect(windowNamedPropertyValue(window, "target")).toBe(first);

    const second = window.document.createElement("form");
    second.setAttribute("name", "target");
    window.document.body?.append(second);
    const collection = windowNamedPropertyValue(window, "target");

    expect(Array.from(collection as Iterable<Element>)).toEqual([
      first,
      second,
    ]);
    first.remove();
    expect(Array.from(collection as Iterable<Element>)).toEqual([second]);
    expect(windowNamedPropertyValue(window, "target")).toBe(second);
  });

  it("keeps contextless documents separate from Window", () => {
    const document = new DOMParser().parseFromString(
      "<main></main>",
      "text/html",
    );

    expect(document.defaultView).toBeNull();
  });

  it("uses the WindowProxy identity for event callbacks", () => {
    const window = createWindow();
    let receiverMatches = false;
    let currentTarget: EventTarget | null = null;
    window.addEventListener("ready", function (this: Window, event) {
      receiverMatches = this === window;
      currentTarget = event.currentTarget;
    });

    window.dispatchEvent(new Event("ready"));

    expect(receiverMatches).toBe(true);
    expect(currentTarget).toBe(window);
  });

  it("does not share state between Window environments", () => {
    const first = createWindow();
    const second = createWindow();

    first.document.body?.setAttribute("data-window", "first");

    expect(first).not.toBe(second);
    expect(first.document).not.toBe(second.document);
    expect(second.document.body?.getAttribute("data-window")).toBeNull();
  });
});
