import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

import { Document } from "@palim/core/internal/public-dom-interfaces.js";
import { Event } from "@palim/core/internal/dom/events.js";
import { normal } from "@palim/scripting/internal/javascript-engine/adapter.js";
import type {
  EngineRealm,
  JavaScriptEngineAdapter,
} from "@palim/scripting/internal/javascript-engine/adapter.js";
import { WindowRealmBinding } from "@palim/scripting/internal/javascript-engine/window-realm-binding.js";
import { Engine262Adapter } from "@palim/engine262";
import { createWindow } from "@palim/window/internal/window.js";

function evaluate(
  engine: JavaScriptEngineAdapter,
  realm: EngineRealm,
  source: string,
): void {
  const result = engine.evaluate(realm, source);
  if (result.type === "throw") {
    throw new Error(engine.exceptionMessage(realm, result.value));
  }
}

describe("WindowRealmBinding", () => {
  it("exposes live Window named properties", () => {
    const window = createWindow();
    const engine = new Engine262Adapter();
    const binding = new WindowRealmBinding(engine, window);

    evaluate(
      engine,
      binding.realm,
      readFileSync(
        new URL(
          "../fixtures/window-realm-binding/exposes-window-named-properties.js",
          import.meta.url,
        ),
        "utf8",
      ),
    );
  });

  it("constructs realm-local Document platform objects", () => {
    const window = createWindow();
    const engine = new Engine262Adapter();
    const binding = new WindowRealmBinding(engine, window);
    const documents: Document[] = [];
    const record = engine.createFunction(
      binding.realm,
      "recordConstructedDocument",
      1,
      (_thisValue, argumentsList) => {
        const document = binding.dom.interfaceObject(
          argumentsList[0] ?? engine.fromPrimitive(undefined),
        );
        if (document instanceof Document) {
          documents.push(document);
        }
        return normal(engine.fromPrimitive(undefined));
      },
    );
    engine.initializeDataProperty(
      engine.globalObject(binding.realm),
      "recordConstructedDocument",
      record,
      { configurable: true, enumerable: true, writable: true },
    );

    evaluate(
      engine,
      binding.realm,
      readFileSync(
        new URL(
          "../fixtures/window-realm-binding/document-constructor.js",
          import.meta.url,
        ),
        "utf8",
      ),
    );

    expect(documents).toHaveLength(1);
    expect(documents[0]?.documentElement?.localName).toBe("root");
  });

  it("uses Window and WindowProxy as the realm globals", () => {
    const window = createWindow();
    const engine = new Engine262Adapter();
    const binding = new WindowRealmBinding(engine, window);

    expect(engine.globalThis(binding.realm)).not.toBe(
      engine.globalObject(binding.realm),
    );

    evaluate(
      engine,
      binding.realm,
      `
        if (
          globalThis !== window ||
          window !== self ||
          window !== frames ||
          this !== window
        ) {
          throw new Error("WindowProxy global identity is invalid");
        }
        if (!(window instanceof Window)) {
          throw new Error("window is not a Window");
        }
        if (Object.getPrototypeOf(window) !== Window.prototype) {
          throw new Error("Window prototype is invalid");
        }
        if (
          window.document !== document ||
          document.defaultView !== window ||
          top !== window ||
          parent !== window ||
          frameElement !== null
        ) {
          throw new Error("Window and Document relationships are invalid");
        }
      `,
    );
  });

  it("defines global interface members with Window descriptors", () => {
    const window = createWindow();
    const engine = new Engine262Adapter();
    const binding = new WindowRealmBinding(engine, window);

    evaluate(
      engine,
      binding.realm,
      `
        const expected = {
          window: [false, false],
          self: [true, true],
          frames: [true, true],
          document: [false, false],
          top: [false, false],
          parent: [true, true],
          frameElement: [true, false],
        };
        for (const [name, [configurable, replaceable]] of Object.entries(
          expected,
        )) {
          const descriptor = Object.getOwnPropertyDescriptor(globalThis, name);
          if (
            typeof descriptor.get !== "function" ||
            (typeof descriptor.set === "function") !== replaceable ||
            descriptor.configurable !== configurable ||
            !descriptor.enumerable
          ) {
            throw new Error(name + " property descriptor is invalid");
          }
        }

        window.self = "self replacement";
        window.frames = "frames replacement";
        window.parent = "parent replacement";
        for (const [name, value] of [
          ["self", "self replacement"],
          ["frames", "frames replacement"],
          ["parent", "parent replacement"],
        ]) {
          const descriptor = Object.getOwnPropertyDescriptor(globalThis, name);
          if (
            descriptor.value !== value ||
            !descriptor.configurable ||
            !descriptor.enumerable ||
            !descriptor.writable
          ) {
            throw new Error(name + " was not replaced by a data property");
          }
        }
      `,
    );
  });

  it("creates replaceable property failures in the setter realm", () => {
    const engine = new Engine262Adapter();
    const first = new WindowRealmBinding(engine, createWindow());
    const second = new WindowRealmBinding(engine, createWindow());

    evaluate(
      engine,
      first.realm,
      `
        const selfDescriptor = Object.getOwnPropertyDescriptor(
          globalThis,
          "self",
        );
        Object.defineProperty(globalThis, "self", {
          ...selfDescriptor,
          configurable: false,
        });
        globalThis.savedSelfSetter = selfDescriptor.set;
      `,
    );
    const setter = engine.get(
      first.realm,
      engine.globalObject(first.realm),
      "savedSelfSetter",
    );
    const firstTypeError = engine.get(
      first.realm,
      engine.globalObject(first.realm),
      "TypeError",
    );
    expect(setter.type).toBe("normal");
    expect(firstTypeError.type).toBe("normal");
    if (setter.type === "throw" || firstTypeError.type === "throw") {
      return;
    }
    engine.initializeDataProperty(
      engine.globalObject(second.realm),
      "firstWindow",
      engine.globalThis(first.realm),
      { configurable: true, enumerable: true, writable: true },
    );
    engine.initializeDataProperty(
      engine.globalObject(second.realm),
      "firstSelfSetter",
      setter.value,
      { configurable: true, enumerable: true, writable: true },
    );
    engine.initializeDataProperty(
      engine.globalObject(second.realm),
      "FirstTypeError",
      firstTypeError.value,
      { configurable: true, enumerable: true, writable: true },
    );

    evaluate(
      engine,
      second.realm,
      `
        let replacementError;
        try {
          firstSelfSetter.call(firstWindow, "replacement");
        } catch (error) {
          replacementError = error;
        }
        if (!(replacementError instanceof FirstTypeError)) {
          throw new Error("replacement did not throw the setter realm TypeError");
        }
        if (replacementError instanceof TypeError) {
          throw new Error("replacement used the caller realm TypeError");
        }
        if (firstWindow.self !== firstWindow) {
          throw new Error("rejected replacement changed Window.self");
        }
      `,
    );
  });

  it("exposes the active document Location", () => {
    const window = createWindow({
      url: "https://example.com/path?query#fragment",
    });
    const engine = new Engine262Adapter();
    const binding = new WindowRealmBinding(engine, window);

    evaluate(
      engine,
      binding.realm,
      `
        if (
          !(location instanceof Location) ||
          location.href !== "https://example.com/path?query#fragment" ||
          location.pathname !== "/path" ||
          location.search !== "?query" ||
          location.hash !== "#fragment" ||
          location.toString() !== location.href
        ) {
          throw new Error("Location is invalid");
        }
      `,
    );
  });

  it("shares DOM state between the host and engine realm", () => {
    const window = createWindow();
    const engine = new Engine262Adapter();
    const binding = new WindowRealmBinding(engine, window);
    window.document.body?.setAttribute("data-host", "before");

    evaluate(
      engine,
      binding.realm,
      `
        if (document.body.getAttribute("data-host") !== "before") {
          throw new Error("host mutation was not visible");
        }
        document.body.setAttribute("data-engine", "after");
        document.body.innerHTML = "<main>connected</main>";
      `,
    );

    expect(window.document.body?.getAttribute("data-engine")).toBe("after");
    expect(window.document.querySelector("main")?.textContent).toBe(
      "connected",
    );
  });

  it("invokes Window event callbacks with WindowProxy identity", () => {
    const window = createWindow();
    const engine = new Engine262Adapter();
    const binding = new WindowRealmBinding(engine, window);

    evaluate(
      engine,
      binding.realm,
      `
        window.addEventListener("ready", function (event) {
          if (this !== window || event.currentTarget !== window) {
            throw new Error("Window event identity is invalid");
          }
          document.body.setAttribute("data-event", event.type);
        });
      `,
    );
    window.dispatchEvent(new Event("ready"));

    expect(window.document.body?.getAttribute("data-event")).toBe("ready");
  });

  it("accepts unqualified Window event operations", () => {
    const window = createWindow();
    const engine = new Engine262Adapter();
    const binding = new WindowRealmBinding(engine, window);

    evaluate(
      engine,
      binding.realm,
      `
        addEventListener("ready", function (event) {
          if (this !== window || event.currentTarget !== window) {
            throw new Error("Window event identity is invalid");
          }
          document.body.setAttribute("data-event", event.type);
        });
      `,
    );
    window.dispatchEvent(new Event("ready"));

    expect(window.document.body?.getAttribute("data-event")).toBe("ready");
  });

  it("runs Window timer callbacks", async () => {
    const window = createWindow();
    const engine = new Engine262Adapter();
    const binding = new WindowRealmBinding(engine, window);

    evaluate(
      engine,
      binding.realm,
      `
        setTimeout(function (value) {
          document.body.setAttribute("data-timer", value);
        }, 0, "complete");
      `,
    );
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(window.document.body?.getAttribute("data-timer")).toBe("complete");
  });

  it("cancels Window timer callbacks through the host runtime", async () => {
    const window = createWindow();
    const engine = new Engine262Adapter();
    const binding = new WindowRealmBinding(engine, window);

    evaluate(
      engine,
      binding.realm,
      `
        const timer = setTimeout(function () {
          document.body.setAttribute("data-timer", "unexpected");
        }, 0);
        clearTimeout(timer);
      `,
    );
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(window.document.body?.getAttribute("data-timer")).toBeNull();
  });

  it("keeps separate Window realms isolated", () => {
    const engine = new Engine262Adapter();
    const firstWindow = createWindow();
    const secondWindow = createWindow();
    const first = new WindowRealmBinding(engine, firstWindow);
    const second = new WindowRealmBinding(engine, secondWindow);

    expect(first.realm).not.toBe(second.realm);
    expect(engine.globalThis(first.realm)).not.toBe(
      engine.globalThis(second.realm),
    );
    expect(engine.globalObject(first.realm)).not.toBe(
      engine.globalObject(second.realm),
    );
    expect(first.dom.platformObject(firstWindow.document)).not.toBe(
      second.dom.platformObject(secondWindow.document),
    );

    evaluate(
      engine,
      first.realm,
      `
        window.realmMarker = "first";
        document.body.setAttribute("data-window", "first");
      `,
    );
    evaluate(
      engine,
      second.realm,
      `
        if (window.realmMarker !== undefined) {
          throw new Error("Window realm state leaked");
        }
        document.body.setAttribute("data-window", "second");
      `,
    );

    expect(firstWindow.document.body?.getAttribute("data-window")).toBe(
      "first",
    );
    expect(secondWindow.document.body?.getAttribute("data-window")).toBe(
      "second",
    );
  });
});
