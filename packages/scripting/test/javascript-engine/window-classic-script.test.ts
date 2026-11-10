import { describe, expect, it } from "vitest";

import { normal } from "@palim/scripting/internal/javascript-engine/adapter.js";
import type {
  EngineJob,
  EngineResult,
  EngineValue,
} from "@palim/scripting/internal/javascript-engine/adapter.js";
import type { WindowEnvironmentSettings } from "@palim/scripting/internal/javascript-engine/window-classic-script.js";
import { WindowScriptEnvironment } from "@palim/scripting/internal/javascript-engine/window-classic-script.js";
import { Engine262Adapter } from "@palim/engine262";
import { OpaqueOrigin } from "@palim/core/internal/origin.js";
import { URL } from "@palim/core/internal/url/index.js";
import { createWindow } from "@palim/window/internal/window.js";
import { WindowExecutionEnvironment } from "../helper/window-execution-environment.js";

class TrackingEngine262Adapter extends Engine262Adapter {
  jobsRun = 0;

  override runJob(job: EngineJob): EngineResult<EngineValue> {
    this.jobsRun += 1;
    return super.runJob(job);
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
    engine.initializeDataProperty(
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

  it("uses callback realm settings and preserves entry and incumbent settings", () => {
    const engine = new TrackingEngine262Adapter();
    const first = new WindowScriptEnvironment(engine, createWindow());
    const second = new WindowScriptEnvironment(
      engine,
      createWindow(),
      first.eventLoop,
    );
    const observations: {
      readonly label: string;
      readonly current: WindowEnvironmentSettings | null;
      readonly entry: WindowEnvironmentSettings | null;
      readonly incumbent: WindowEnvironmentSettings | null;
    }[] = [];
    const record = (label: string) =>
      engine.createFunction(first.settings.realm, label, 0, () => {
        observations.push({
          label,
          current: first.runtime.currentSettings,
          entry: first.runtime.entrySettings,
          incumbent: first.runtime.incumbentSettings,
        });
        return normal(engine.fromPrimitive(undefined));
      });
    engine.initializeDataProperty(
      engine.globalObject(first.settings.realm),
      "recordOuter",
      record("outer"),
      { configurable: true, enumerable: true, writable: true },
    );
    engine.initializeDataProperty(
      engine.globalObject(first.settings.realm),
      "recordNested",
      record("nested"),
      { configurable: true, enumerable: true, writable: true },
    );
    expect(
      first.runClassicScript(
        first.createClassicScript(`
          globalThis.callbackFailure = {};
          globalThis.crossRealmCallback = () => {
            recordOuter();
            new URLSearchParams("nested=1").forEach(() => recordNested());
            document.body.setAttribute("data-callback", "first");
            throw callbackFailure;
          };
        `),
      ).type,
    ).toBe("normal");
    const copyToSecond = (name: string): void => {
      const value = engine.get(
        first.settings.realm,
        engine.globalObject(first.settings.realm),
        name,
      );
      expect(value.type).toBe("normal");
      if (value.type === "normal") {
        engine.initializeDataProperty(
          engine.globalObject(second.settings.realm),
          name,
          value.value,
          { configurable: true, enumerable: true, writable: true },
        );
      }
    };
    copyToSecond("callbackFailure");
    copyToSecond("crossRealmCallback");
    const recordAfter = engine.createFunction(
      second.settings.realm,
      "recordAfter",
      0,
      () => {
        observations.push({
          label: "after",
          current: second.runtime.currentSettings,
          entry: second.runtime.entrySettings,
          incumbent: second.runtime.incumbentSettings,
        });
        return normal(engine.fromPrimitive(undefined));
      },
    );
    engine.initializeDataProperty(
      engine.globalObject(second.settings.realm),
      "recordAfter",
      recordAfter,
      { configurable: true, enumerable: true, writable: true },
    );

    const result = second.runClassicScript(
      second.createClassicScript(`
        let caught;
        try {
          new URLSearchParams("value=1").forEach(crossRealmCallback);
        } catch (error) {
          caught = error;
        }
        if (caught !== callbackFailure) {
          throw new Error("callback exception identity changed");
        }
        recordAfter();
      `),
    );

    expect(result.type).toBe("normal");
    expect(observations).toEqual([
      {
        label: "outer",
        current: first.settings,
        entry: second.settings,
        incumbent: second.settings,
      },
      {
        label: "nested",
        current: first.settings,
        entry: second.settings,
        incumbent: first.settings,
      },
      {
        label: "after",
        current: second.settings,
        entry: second.settings,
        incumbent: second.settings,
      },
    ]);
    expect(first.window.document.body?.getAttribute("data-callback")).toBe(
      "first",
    );
    expect(second.runtime.currentSettings).toBeNull();
    expect(second.runtime.entrySettings).toBeNull();
    expect(second.runtime.incumbentSettings).toBeNull();
  });

  it("restores settings after a callback host failure", () => {
    const engine = new TrackingEngine262Adapter();
    const first = new WindowScriptEnvironment(engine, createWindow());
    const second = new WindowScriptEnvironment(
      engine,
      createWindow(),
      first.eventLoop,
    );
    const callback = engine.createFunction(
      first.settings.realm,
      "hostFailureCallback",
      0,
      () => {
        throw new Error("host callback failed");
      },
    );
    engine.initializeDataProperty(
      engine.globalObject(second.settings.realm),
      "hostFailureCallback",
      callback,
      { configurable: true, enumerable: true, writable: true },
    );
    const script = second.createClassicScript(
      'new URLSearchParams("value=1").forEach(hostFailureCallback)',
    );

    expect(() => second.runClassicScript(script)).toThrow(
      "host callback failed",
    );
    expect(second.runtime.currentSettings).toBeNull();
    expect(second.runtime.entrySettings).toBeNull();
    expect(second.runtime.incumbentSettings).toBeNull();
    expect(
      second.runClassicScript(second.createClassicScript("1 + 1")).type,
    ).toBe("normal");
  });

  it("reports a cross-realm timer failure to the scheduling Window", async () => {
    const engine = new TrackingEngine262Adapter();
    const first = new WindowScriptEnvironment(engine, createWindow());
    const second = new WindowScriptEnvironment(
      engine,
      createWindow(),
      first.eventLoop,
    );
    const firstReports: string[] = [];
    const secondReports: string[] = [];
    first.window.onerror((report) => {
      firstReports.push(report.message);
    });
    second.window.onerror((report) => {
      secondReports.push(report.message);
    });
    expect(
      first.runClassicScript(
        first.createClassicScript(`
          globalThis.timerCallback = () => {
            throw new Error("cross-realm timer failure");
          };
        `),
      ).type,
    ).toBe("normal");
    const callback = engine.get(
      first.settings.realm,
      engine.globalObject(first.settings.realm),
      "timerCallback",
    );
    expect(callback.type).toBe("normal");
    if (callback.type === "throw") {
      return;
    }
    engine.initializeDataProperty(
      engine.globalObject(second.settings.realm),
      "timerCallback",
      callback.value,
      { configurable: true, enumerable: true, writable: true },
    );

    expect(
      second.runClassicScript(
        second.createClassicScript("setTimeout(timerCallback, 0)"),
      ).type,
    ).toBe("normal");
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(firstReports).toEqual([]);
    expect(secondReports).toEqual(["Error: cross-realm timer failure"]);
  });

  it("runs jobs after the outermost reentrant script", () => {
    const engine = new TrackingEngine262Adapter();
    const environment = new WindowScriptEnvironment(engine, createWindow());
    const nested = environment.createClassicScript(`
      Promise.resolve().then(() => {
        document.body.setAttribute("data-promise", "complete");
      });
    `);
    let jobsAfterNested = -1;
    const runNested = engine.createFunction(
      environment.settings.realm,
      "runNested",
      0,
      () => {
        const result = environment.runClassicScript(nested);
        jobsAfterNested = engine.jobsRun;
        return result;
      },
    );
    engine.initializeDataProperty(
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
    expect(jobsAfterNested).toBe(0);
    expect(engine.jobsRun).toBe(1);
    expect(environment.window.document.body?.getAttribute("data-promise")).toBe(
      "complete",
    );
  });

  it("orders Promise, queueMicrotask, and MutationObserver jobs", () => {
    const environment = new WindowExecutionEnvironment();
    const script = environment.createClassicScript(`
      const order = [];
      Promise.resolve().then(() => order.push("promise-first"));
      queueMicrotask(() => {
        order.push("queue");
        Promise.resolve().then(() => {
          order.push("nested-promise");
          document.body.setAttribute("data-order", order.join(","));
        });
      });
      const observer = new MutationObserver(() => order.push("mutation"));
      observer.observe(document.body, { childList: true });
      document.body.append(document.createElement("p"));
      Promise.resolve().then(() => order.push("promise-last"));
    `);

    expect(environment.runClassicScript(script).type).toBe("normal");
    expect(environment.window.document.body?.getAttribute("data-order")).toBe(
      "promise-first,queue,mutation,promise-last,nested-promise",
    );
  });

  it("reports queueMicrotask failures and continues the checkpoint", () => {
    const environment = new WindowExecutionEnvironment();
    const reports: string[] = [];
    environment.window.onerror((report) => {
      reports.push(report.message);
    });
    const script = environment.createClassicScript(`
      queueMicrotask(() => {
        throw new Error("microtask failure");
      });
      queueMicrotask(() => {
        document.body.setAttribute("data-after-microtask", "complete");
      });
    `);

    expect(environment.runClassicScript(script).type).toBe("normal");
    expect(reports).toEqual(["Error: microtask failure"]);
    expect(
      environment.window.document.body?.getAttribute("data-after-microtask"),
    ).toBe("complete");
  });

  it("uses the job realm with the registration incumbent settings", () => {
    const engine = new TrackingEngine262Adapter();
    const first = new WindowScriptEnvironment(engine, createWindow());
    const second = new WindowScriptEnvironment(
      engine,
      createWindow(),
      first.eventLoop,
    );
    const observations: {
      readonly current: WindowEnvironmentSettings | null;
      readonly entry: WindowEnvironmentSettings | null;
      readonly incumbent: WindowEnvironmentSettings | null;
    }[] = [];
    const record = engine.createFunction(
      first.settings.realm,
      "recordJobSettings",
      0,
      () => {
        observations.push({
          current: first.runtime.currentSettings,
          entry: first.runtime.entrySettings,
          incumbent: first.runtime.incumbentSettings,
        });
        return normal(engine.fromPrimitive(undefined));
      },
    );
    engine.initializeDataProperty(
      engine.globalObject(first.settings.realm),
      "recordJobSettings",
      record,
      { configurable: true, enumerable: true, writable: true },
    );
    expect(
      first.runClassicScript(
        first.createClassicScript(
          "globalThis.promiseCallback = () => recordJobSettings()",
        ),
      ).type,
    ).toBe("normal");
    const callback = engine.get(
      first.settings.realm,
      engine.globalObject(first.settings.realm),
      "promiseCallback",
    );
    expect(callback.type).toBe("normal");
    if (callback.type === "throw") {
      return;
    }
    engine.initializeDataProperty(
      engine.globalObject(second.settings.realm),
      "promiseCallback",
      callback.value,
      { configurable: true, enumerable: true, writable: true },
    );

    expect(
      second.runClassicScript(
        second.createClassicScript("Promise.resolve().then(promiseCallback)"),
      ).type,
    ).toBe("normal");
    expect(observations).toEqual([
      {
        current: first.settings,
        entry: first.settings,
        incumbent: second.settings,
      },
    ]);
  });

  it("restores job settings after a host failure", () => {
    const engine = new TrackingEngine262Adapter();
    const environment = new WindowScriptEnvironment(engine, createWindow());
    const hostFailure = engine.createFunction(
      environment.settings.realm,
      "hostFailure",
      0,
      () => {
        throw new Error("job host failure");
      },
    );
    engine.initializeDataProperty(
      engine.globalObject(environment.settings.realm),
      "hostFailure",
      hostFailure,
      { configurable: true, enumerable: true, writable: true },
    );

    expect(() =>
      environment.runClassicScript(
        environment.createClassicScript("queueMicrotask(hostFailure)"),
      ),
    ).toThrow("job host failure");
    expect(environment.runtime.currentSettings).toBeNull();
    expect(environment.runtime.entrySettings).toBeNull();
    expect(environment.runtime.incumbentSettings).toBeNull();
    expect(
      environment.runClassicScript(
        environment.createClassicScript(`
          queueMicrotask(() => {
            document.body.setAttribute("data-after-host-failure", "complete");
          });
        `),
      ).type,
    ).toBe("normal");
    expect(
      environment.window.document.body?.getAttribute("data-after-host-failure"),
    ).toBe("complete");
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
