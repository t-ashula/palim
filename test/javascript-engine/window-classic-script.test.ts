import { describe, expect, it } from "vitest";

import { normal } from "../../packages/palim/src/javascript-engine/adapter.js";
import { Engine262Adapter } from "../../packages/palim/src/javascript-engine/engine262-adapter.js";
import type { WindowEnvironmentSettings } from "../../packages/palim/src/javascript-engine/window-classic-script.js";
import { WindowScriptEnvironment } from "../../packages/palim/src/javascript-engine/window-classic-script.js";
import { OpaqueOrigin } from "@palim/core/internal/origin.js";
import { URL } from "@palim/core/internal/url/index.js";
import { createWindow } from "../../packages/palim/src/window.js";
import { WindowExecutionEnvironment } from "../../packages/palim/src/window-javascript.js";

class TrackingEngine262Adapter extends Engine262Adapter {
  checkpoints = 0;

  override performPromiseCheckpoint(): void {
    this.checkpoints += 1;
    super.performPromiseCheckpoint();
  }
}

describe("Window classic script execution", () => {
  it("provides Window environment settings from the active Document", () => {
    const environment = new WindowExecutionEnvironment({
      url: "https://example.test:443/path/page.html",
    });

    expect(environment.settings.creationURL.href).toBe(
      "https://example.test/path/page.html",
    );
    expect(environment.settings.topLevelCreationURL.href).toBe(
      "https://example.test/path/page.html",
    );
    expect(environment.settings.apiBaseURL.href).toBe(
      "https://example.test/path/page.html",
    );
    expect(environment.settings.creationURL).toBeInstanceOf(URL);
    expect(environment.settings.topLevelCreationURL).toBeInstanceOf(URL);
    expect(environment.settings.apiBaseURL).toBeInstanceOf(URL);
    expect(environment.settings.origin).toEqual({
      type: "tuple",
      scheme: "https",
      host: "example.test",
      port: null,
    });
    expect(environment.settings.topLevelOrigin).toBe(
      environment.settings.origin,
    );
  });

  it("assigns distinct opaque origins to separate about:blank Windows", () => {
    const first = new WindowExecutionEnvironment();
    const second = new WindowExecutionEnvironment();
    const firstOrigin = first.settings.origin;
    const secondOrigin = second.settings.origin;

    expect(firstOrigin).toBeInstanceOf(OpaqueOrigin);
    expect(secondOrigin).toBeInstanceOf(OpaqueOrigin);
    if (
      firstOrigin instanceof OpaqueOrigin &&
      secondOrigin instanceof OpaqueOrigin
    ) {
      expect(firstOrigin.isSameOrigin(secondOrigin)).toBe(false);
    }
  });

  it("keeps global and DOM state across classic scripts", () => {
    const environment = new WindowExecutionEnvironment({
      url: "https://example.test/",
    });
    const first = environment.createClassicScript(
      `
        globalThis.scriptState = 40;
        document.body.setAttribute("data-first", "set");
      `,
    );
    const second = environment.createClassicScript(
      `
        scriptState += 2;
        document.body.setAttribute("data-second", String(scriptState));
      `,
    );

    expect(environment.runClassicScript(first).type).toBe("normal");
    expect(environment.runClassicScript(second).type).toBe("normal");
    expect(environment.window.document.body?.getAttribute("data-first")).toBe(
      "set",
    );
    expect(environment.window.document.body?.getAttribute("data-second")).toBe(
      "42",
    );
  });

  it("separates parse errors from runtime exceptions", () => {
    const environment = new WindowExecutionEnvironment();
    const parseError = environment.createClassicScript(
      "globalThis.parseExecuted = true; const = 1",
    );
    const runtimeException = environment.createClassicScript(
      'throw new TypeError("runtime failure")',
    );

    expect(parseError.compilation.type).toBe("parse-error");
    const parseResult = environment.runClassicScript(parseError);
    expect(parseResult.type).toBe("throw");
    if (parseResult.type === "throw") {
      expect(
        environment.engine.exceptionMessage(
          environment.settings.realm,
          parseResult.value,
        ),
      ).toMatch(/^SyntaxError:/);
    }
    expect(
      environment.runClassicScript(
        environment.createClassicScript(`
          if ("parseExecuted" in globalThis) {
            throw new Error("source with a parse error was evaluated");
          }
        `),
      ).type,
    ).toBe("normal");

    expect(runtimeException.compilation.type).toBe("compiled");
    const runtimeResult = environment.runClassicScript(runtimeException);
    expect(runtimeResult.type).toBe("throw");
    if (runtimeResult.type === "throw") {
      expect(
        environment.engine.exceptionMessage(
          environment.settings.realm,
          runtimeResult.value,
        ),
      ).toBe("TypeError: runtime failure");
    }
  });

  it("sets and restores current settings for normal and abrupt completion", () => {
    const engine = new TrackingEngine262Adapter();
    const environment = new WindowScriptEnvironment(engine, createWindow());
    const observed: WindowEnvironmentSettings[] = [];
    const recordSettings = engine.createFunction(
      environment.settings.realm,
      "recordSettings",
      0,
      () => {
        const settings = environment.runtime.currentSettings;
        if (settings !== null) {
          observed.push(settings);
        }
        return normal(engine.fromPrimitive(undefined));
      },
    );
    engine.defineDataProperty(
      engine.globalObject(environment.settings.realm),
      "recordSettings",
      recordSettings,
      { configurable: true, enumerable: true, writable: true },
    );

    const normalScript = environment.createClassicScript("recordSettings()");
    const throwingScript = environment.createClassicScript(
      'recordSettings(); throw new Error("failure")',
    );

    expect(environment.runClassicScript(normalScript).type).toBe("normal");
    expect(environment.runtime.currentSettings).toBeNull();
    expect(environment.runClassicScript(throwingScript).type).toBe("throw");
    expect(environment.runtime.currentSettings).toBeNull();
    expect(observed).toEqual([environment.settings, environment.settings]);
  });

  it("runs one checkpoint after the outermost reentrant script", () => {
    const engine = new TrackingEngine262Adapter();
    const environment = new WindowScriptEnvironment(engine, createWindow());
    const nested = environment.createClassicScript(`
      Promise.resolve().then(() => {
        document.body.setAttribute("data-promise", "complete");
      });
    `);
    let checkpointsAfterNested = -1;
    const runNested = engine.createFunction(
      environment.settings.realm,
      "runNested",
      0,
      () => {
        const result = environment.runClassicScript(nested);
        checkpointsAfterNested = engine.checkpoints;
        return result;
      },
    );
    engine.defineDataProperty(
      engine.globalObject(environment.settings.realm),
      "runNested",
      runNested,
      { configurable: true, enumerable: true, writable: true },
    );
    const outer = environment.createClassicScript(`
      runNested();
      if (document.body.getAttribute("data-promise") !== null) {
        throw new Error("Promise job ran before outer script cleanup");
      }
    `);

    expect(environment.runClassicScript(outer).type).toBe("normal");
    expect(checkpointsAfterNested).toBe(0);
    expect(engine.checkpoints).toBe(1);
    expect(environment.window.document.body?.getAttribute("data-promise")).toBe(
      "complete",
    );
  });

  it("does not share state between Window execution environments", () => {
    const first = new WindowExecutionEnvironment();
    const second = new WindowExecutionEnvironment();
    const firstScript = first.createClassicScript(
      `
        globalThis.marker = "first";
        document.body.setAttribute("data-owner", "first");
      `,
    );
    const secondScript = second.createClassicScript(`
      if (globalThis.marker !== undefined) {
        throw new Error("global state leaked");
      }
      if (document.body.getAttribute("data-owner") !== null) {
        throw new Error("DOM state leaked");
      }
    `);

    expect(first.runClassicScript(firstScript).type).toBe("normal");
    expect(second.runClassicScript(secondScript).type).toBe("normal");
    expect(first.settings).not.toBe(second.settings);
    expect(first.settings.realm).not.toBe(second.settings.realm);
    expect(first.window.document).not.toBe(second.window.document);
    expect(first.window.document.body?.getAttribute("data-owner")).toBe(
      "first",
    );
    expect(second.window.document.body?.getAttribute("data-owner")).toBeNull();
  });
});
