import { describe, expect, it } from "vitest";

import type { EventTarget } from "../src/index.js";
import { DOMParser, Event } from "../src/index.js";
import { createWindow, type Window } from "../src/window.js";

describe("Window", () => {
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
