import { DOMParser } from "@palim/core";
import { Event } from "@palim/core/internal/dom/events.js";
import { setDocumentURL } from "@palim/core/internal/dom/nodes.js";
import type {
  Element,
  EventTarget,
} from "@palim/core/internal/public-dom-interfaces.js";
import type { Window } from "@palim/window/internal/window.js";
import {
  createWindow,
  scheduleWindowMicrotask,
} from "@palim/window/internal/window.js";
import {
  windowNamedPropertyNames,
  windowNamedPropertyValue,
} from "@palim/window/internal/window-named-properties.js";
import { describe, expect, it } from "vitest";

describe("Window", () => {
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
