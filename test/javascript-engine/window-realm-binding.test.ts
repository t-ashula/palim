import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

import { Document, Event } from "../../src/index.js";
import { normal } from "../../src/javascript-engine/adapter.js";
import type {
  EngineRealm,
  JavaScriptEngineAdapter,
} from "../../src/javascript-engine/adapter.js";
import { Engine262Adapter } from "../../src/javascript-engine/engine262-adapter.js";
import { WindowRealmBinding } from "../../src/javascript-engine/window-realm-binding.js";
import { createWindow } from "../../src/window.js";

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
    engine.defineDataProperty(
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
