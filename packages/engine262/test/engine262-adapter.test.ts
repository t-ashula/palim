import { Engine262Adapter } from "@palim/engine262";
import type {
  EngineRealm,
  JavaScriptEngineAdapter,
} from "@palim/scripting/internal/javascript-engine/adapter.js";
import {
  FORWARD_PROXY_TRAP,
  normal,
  thrown,
} from "@palim/scripting/internal/javascript-engine/adapter.js";
import { describe, expect, it } from "vitest";

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

describe("Engine262Adapter", () => {
  it("evaluates source in separate realms", () => {
    const engine = new Engine262Adapter();
    const firstRealm = engine.createRealm();
    const secondRealm = engine.createRealm();
    engine.initializeDataProperty(
      engine.globalObject(firstRealm),
      "realmValue",
      engine.fromPrimitive("first"),
      { configurable: true, enumerable: true, writable: true },
    );
    engine.initializeDataProperty(
      engine.globalObject(secondRealm),
      "realmValue",
      engine.fromPrimitive("second"),
      { configurable: true, enumerable: true, writable: true },
    );

    const first = engine.evaluate(firstRealm, "realmValue");
    const second = engine.evaluate(secondRealm, "realmValue");
    expect(first.type).toBe("normal");
    expect(second.type).toBe("normal");
    if (first.type === "normal" && second.type === "normal") {
      expect(engine.toString(firstRealm, first.value)).toEqual(normal("first"));
      expect(engine.toString(secondRealm, second.value)).toEqual(
        normal("second"),
      );
    }
  });

  it("calls host functions and preserves property descriptors", () => {
    const engine = new Engine262Adapter();
    const realm = engine.createRealm();
    const hostFunction = engine.createFunction(
      realm,
      "hostFunction",
      1,
      (_thisValue, argumentsList) =>
        normal(argumentsList[0] ?? engine.fromPrimitive(undefined)),
    );
    engine.initializeDataProperty(
      engine.globalObject(realm),
      "hostFunction",
      hostFunction,
      { configurable: false, enumerable: false, writable: false },
    );

    evaluate(
      engine,
      realm,
      `
        if (hostFunction("value") !== "value") {
          throw new Error("host function result was not preserved");
        }
        const descriptor = Object.getOwnPropertyDescriptor(
          globalThis,
          "hostFunction",
        );
        if (
          descriptor.configurable ||
          descriptor.enumerable ||
          descriptor.writable
        ) {
          throw new Error("property descriptor was not preserved");
        }
      `,
    );
  });

  it("returns exceptions as engine values", () => {
    const engine = new Engine262Adapter();
    const realm = engine.createRealm();

    const result = engine.evaluate(realm, 'throw new TypeError("failure")');

    expect(result.type).toBe("throw");
    if (result.type === "throw") {
      expect(engine.exceptionMessage(realm, result.value)).toBe(
        "TypeError: failure",
      );
    }
  });

  it("returns callable realms for bound functions and proxies", () => {
    const engine = new Engine262Adapter();
    const functionRealm = engine.createRealm();
    const operationRealm = engine.createRealm();
    evaluate(
      engine,
      functionRealm,
      `
        globalThis.boundCallback = (() => undefined).bind(null);
        globalThis.proxyCallback = new Proxy(() => undefined, {});
        const revocable = Proxy.revocable(() => undefined, {});
        globalThis.revokedCallback = revocable.proxy;
        revocable.revoke();
      `,
    );

    const callback = (name: string) => {
      const value = engine.get(
        functionRealm,
        engine.globalObject(functionRealm),
        name,
      );
      expect(value.type).toBe("normal");
      if (value.type === "throw") {
        return null;
      }
      const callable = engine.asCallable(value.value);
      expect(callable).not.toBeNull();
      return callable;
    };
    const bound = callback("boundCallback");
    const proxy = callback("proxyCallback");
    const revoked = callback("revokedCallback");
    if (bound === null || proxy === null || revoked === null) {
      return;
    }

    expect(engine.callableRealm(operationRealm, bound)).toEqual(
      normal(functionRealm),
    );
    expect(engine.callableRealm(operationRealm, proxy)).toEqual(
      normal(functionRealm),
    );
    const revokedResult = engine.callableRealm(operationRealm, revoked);
    expect(revokedResult.type).toBe("throw");
    if (revokedResult.type === "throw") {
      engine.initializeDataProperty(
        engine.globalObject(operationRealm),
        "revokedError",
        revokedResult.value,
        { configurable: true, enumerable: true, writable: true },
      );
      evaluate(
        engine,
        operationRealm,
        `
          if (!(revokedError instanceof TypeError)) {
            throw new Error("revoked Proxy used the wrong TypeError realm");
          }
        `,
      );
    }
  });

  it("returns host function failures to the page as Error values", () => {
    const engine = new Engine262Adapter();
    const realm = engine.createRealm();
    const hostFunction = engine.createFunction(realm, "hostFunction", 0, () => {
      throw new Error("host function failed");
    });
    engine.initializeDataProperty(
      engine.globalObject(realm),
      "hostFunction",
      hostFunction,
      { configurable: true, enumerable: true, writable: true },
    );

    const compilation = engine.compileScript(
      realm,
      `
        function pageCaller() {
          hostFunction();
        }
        let caught;
        try {
          pageCaller();
        } catch (error) {
          caught = error;
        }
        if (!(caught instanceof Error) || caught instanceof TypeError) {
          throw new Error("host failure did not become a page Error");
        }
        if (caught.message !== "host function failed") {
          throw new Error("host failure message was not preserved");
        }
        const stack = String(caught.stack);
        if (
          !stack.includes("(native)") ||
          !stack.includes("pageCaller (https://example.test/host-failure.js") ||
          stack.includes("file://") ||
          stack.includes("node:")
        ) {
          throw new Error("host failure did not use the page stack: " + stack);
        }
      `,
      "https://example.test/host-failure.js",
    );
    expect(compilation.type).toBe("normal");
    if (compilation.type === "normal") {
      expect(engine.runScript(realm, compilation.value).type).toBe("normal");
    }
  });

  it("compiles and runs scripts as separate operations", () => {
    const engine = new Engine262Adapter();
    const realm = engine.createRealm();
    const compilation = engine.compileScript(
      realm,
      'globalThis.compiledValue = "ready"; compiledValue',
      "https://example.test/script.js",
    );

    expect(compilation.type).toBe("normal");
    if (compilation.type === "normal") {
      const result = engine.runScript(realm, compilation.value);
      expect(result.type).toBe("normal");
      if (result.type === "normal") {
        expect(engine.toString(realm, result.value)).toEqual(normal("ready"));
      }
    }
  });

  it("returns script parse errors without evaluating source", () => {
    const engine = new Engine262Adapter();
    const realm = engine.createRealm();

    const compilation = engine.compileScript(realm, "const = 1");

    expect(compilation.type).toBe("throw");
    if (compilation.type === "throw") {
      expect(engine.exceptionMessage(realm, compilation.value)).toMatch(
        /^SyntaxError:/,
      );
    }
  });

  it("exposes Promise jobs for explicit execution", () => {
    const engine = new Engine262Adapter();
    const realm = engine.createRealm();
    const enqueued = new Set();
    const onEnqueue = (job: object): void => {
      enqueued.add(job);
    };
    engine.addJobEnqueueCallback(onEnqueue);
    let calls = 0;
    const record = engine.createFunction(realm, "record", 0, () => {
      calls += 1;
      return normal(engine.fromPrimitive(undefined));
    });
    engine.initializeDataProperty(
      engine.globalObject(realm),
      "record",
      record,
      {
        configurable: true,
        enumerable: false,
        writable: true,
      },
    );

    evaluate(engine, realm, "Promise.resolve().then(record)");
    expect(calls).toBe(0);
    expect(enqueued).toHaveLength(1);

    const job = engine.dequeueJob();
    expect(job).not.toBeNull();
    if (job === null) {
      return;
    }
    expect(engine.jobRealm(job)).toBe(realm);
    expect(engine.runJob(job).type).toBe("normal");
    expect(calls).toBe(1);
    expect(engine.dequeueJob()).toBeNull();
    engine.removeJobEnqueueCallback(onEnqueue);
  });

  it("returns generic job host failures as page Error values", () => {
    const engine = new Engine262Adapter();
    const realm = engine.createRealm();
    engine.enqueueJob(realm, () => {
      throw new Error("generic job host failure");
    });

    const job = engine.dequeueJob();
    expect(job).not.toBeNull();
    if (job === null) {
      return;
    }
    const result = engine.runJob(job);
    expect(result.type).toBe("throw");
    if (result.type === "throw") {
      expect(engine.exceptionMessage(realm, result.value)).toBe(
        "Error: generic job host failure",
      );
    }
  });

  it("runs consecutive async resumptions after host-created promises", () => {
    const engine = new Engine262Adapter();
    const realm = engine.createRealm();
    const promiseValue = engine.get(
      realm,
      engine.globalObject(realm),
      "Promise",
    );
    expect(promiseValue.type).toBe("normal");
    if (promiseValue.type === "throw") {
      return;
    }
    const promise = engine.asObject(promiseValue.value);
    expect(promise).not.toBeNull();
    if (promise === null) {
      return;
    }
    const resolveValue = engine.get(realm, promise, "resolve");
    expect(resolveValue.type).toBe("normal");
    if (resolveValue.type === "throw") {
      return;
    }
    const resolve = engine.asCallable(resolveValue.value);
    expect(resolve).not.toBeNull();
    if (resolve === null) {
      return;
    }
    const hostPromise = engine.createFunction(realm, "hostPromise", 0, () =>
      engine.call(realm, resolve, promise, [engine.fromPrimitive(undefined)]),
    );
    engine.initializeDataProperty(
      engine.globalObject(realm),
      "hostPromise",
      hostPromise,
      { configurable: true, enumerable: true, writable: true },
    );

    evaluate(
      engine,
      realm,
      `
        globalThis.asyncResult = "pending";
        (async () => {
          await hostPromise();
          await hostPromise();
          globalThis.asyncResult = "complete";
        })();
      `,
    );
    for (;;) {
      const job = engine.dequeueJob();
      if (job === null) {
        break;
      }
      expect(engine.runJob(job).type).toBe("normal");
    }
    const result = engine.get(realm, engine.globalObject(realm), "asyncResult");
    expect(result.type).toBe("normal");
    if (result.type === "normal") {
      expect(engine.toString(realm, result.value)).toEqual(normal("complete"));
    }
  });

  it("rejects a Promise with a page Error after a host function failure", () => {
    const engine = new Engine262Adapter();
    const realm = engine.createRealm();
    const hostFailure = engine.createFunction(realm, "hostFailure", 0, () => {
      throw new Error("Promise job host failure");
    });
    engine.initializeDataProperty(
      engine.globalObject(realm),
      "hostFailure",
      hostFailure,
      { configurable: true, enumerable: true, writable: true },
    );

    evaluate(
      engine,
      realm,
      `
        globalThis.hostFailureHandled = false;
        Promise.resolve()
          .then(() => hostFailure())
          .catch((error) => {
            if (!(error instanceof Error) || error instanceof TypeError) {
              throw new Error("Promise used the wrong host failure value");
            }
            if (error.message !== "Promise job host failure") {
              throw new Error("Promise lost the host failure message");
            }
            globalThis.hostFailureHandled = true;
          });
      `,
    );
    for (;;) {
      const job = engine.dequeueJob();
      if (job === null) {
        break;
      }
      expect(engine.runJob(job).type).toBe("normal");
    }
    const handled = engine.get(
      realm,
      engine.globalObject(realm),
      "hostFailureHandled",
    );
    expect(handled.type).toBe("normal");
    if (handled.type === "normal") {
      expect(engine.asBoolean(handled.value)).toBe(true);
    }
  });

  it("reports Promise reject and handle with original values", () => {
    const engine = new Engine262Adapter();
    const realm = engine.createRealm();
    const tracked: {
      readonly promise: object;
      readonly reason: object;
      readonly operation: "handle" | "reject";
    }[] = [];
    engine.addPromiseRejectionTracker((promise, reason, operation) => {
      tracked.push({ promise, reason, operation });
    });

    evaluate(
      engine,
      realm,
      `
        globalThis.rejectionReason = {};
        globalThis.rejectedPromise = Promise.reject(rejectionReason);
      `,
    );
    const promise = engine.get(
      realm,
      engine.globalObject(realm),
      "rejectedPromise",
    );
    const reason = engine.get(
      realm,
      engine.globalObject(realm),
      "rejectionReason",
    );
    expect(promise.type).toBe("normal");
    expect(reason.type).toBe("normal");
    if (promise.type === "throw" || reason.type === "throw") {
      return;
    }
    expect(engine.isPromise(promise.value)).toBe(true);
    expect(tracked).toEqual([
      { promise: promise.value, reason: reason.value, operation: "reject" },
    ]);

    evaluate(engine, realm, "rejectedPromise.catch(() => undefined)");
    expect(tracked).toEqual([
      { promise: promise.value, reason: reason.value, operation: "reject" },
      { promise: promise.value, reason: reason.value, operation: "handle" },
    ]);
  });

  it("keeps forwarding global this identity while changing its target", () => {
    const engine = new Engine262Adapter();
    const realm = engine.createRealm({ forwardingGlobalThis: true });
    const globalThis = engine.globalThis(realm);
    const replacement = engine.createObject(
      realm,
      engine.objectPrototype(realm),
    );
    engine.initializeDataProperty(
      replacement,
      "marker",
      engine.fromPrimitive("replacement"),
      { configurable: true, enumerable: true, writable: true },
    );

    engine.setForwardingTarget(globalThis, replacement);
    const result = engine.evaluate(realm, "globalThis.marker");

    expect(engine.globalThis(realm)).toBe(globalThis);
    expect(result.type).toBe("normal");
    if (result.type === "normal") {
      expect(engine.toString(realm, result.value)).toEqual(
        normal("replacement"),
      );
    }
  });

  it("creates proxies from typed host traps without evaluating source", () => {
    const engine = new Engine262Adapter();
    const realm = engine.createRealm();
    const target = engine.createObject(realm, engine.objectPrototype(realm));
    engine.initializeDataProperty(
      target,
      "existing",
      engine.fromPrimitive("target"),
      { configurable: true, enumerable: true, writable: true },
    );
    const proxy = engine.createProxy(realm, target, {
      get: (argumentsList) =>
        engine.asString(argumentsList[1] ?? engine.fromPrimitive(undefined)) ===
        "virtual"
          ? normal(engine.fromPrimitive("trap"))
          : FORWARD_PROXY_TRAP,
      has: (argumentsList) =>
        engine.asString(argumentsList[1] ?? engine.fromPrimitive(undefined)) ===
        "virtual"
          ? normal(engine.fromPrimitive(true))
          : FORWARD_PROXY_TRAP,
      ownKeys: () => {
        const keys = engine.ownPropertyKeys(realm, target);
        return keys.type === "throw"
          ? keys
          : normal(
              engine.createArray(realm, [
                engine.fromPrimitive("virtual"),
                ...keys.value,
              ]),
            );
      },
      set: (argumentsList) =>
        engine.asString(argumentsList[1] ?? engine.fromPrimitive(undefined)) ===
        "virtual"
          ? normal(engine.fromPrimitive(false))
          : FORWARD_PROXY_TRAP,
    });
    engine.initializeDataProperty(
      engine.globalObject(realm),
      "testProxy",
      proxy,
      {
        configurable: true,
        enumerable: true,
        writable: true,
      },
    );

    evaluate(
      engine,
      realm,
      `
        if (
          testProxy.virtual !== "trap" ||
          !("virtual" in testProxy) ||
          testProxy.existing !== "target" ||
          Reflect.ownKeys(testProxy).join("|") !== "virtual|existing"
        ) {
          throw new Error("proxy traps were not preserved");
        }
        testProxy.existing = "changed";
        if (testProxy.existing !== "changed") {
          throw new Error("proxy forwarding was not preserved");
        }
      `,
    );
  });

  it("returns host proxy trap failures to the page as Error values", () => {
    const engine = new Engine262Adapter();
    const realm = engine.createRealm();
    const target = engine.createObject(realm, engine.objectPrototype(realm));
    const proxy = engine.createProxy(realm, target, {
      get: () => {
        throw new Error("proxy trap failed");
      },
    });
    engine.initializeDataProperty(
      engine.globalObject(realm),
      "testProxy",
      proxy,
      {
        configurable: true,
        enumerable: true,
        writable: true,
      },
    );

    evaluate(
      engine,
      realm,
      `
        let caught;
        try {
          testProxy.value;
        } catch (error) {
          caught = error;
        }
        if (!(caught instanceof Error) || caught instanceof TypeError) {
          throw new Error("proxy trap failure did not become a page Error");
        }
        if (caught.message !== "proxy trap failed") {
          throw new Error("proxy trap failure message was not preserved");
        }
      `,
    );
  });

  it("returns property operation exceptions as their original engine values", () => {
    const engine = new Engine262Adapter();
    const realm = engine.createRealm();
    const failure = engine.createObject(realm, engine.objectPrototype(realm));
    const target = engine.createObject(realm, engine.objectPrototype(realm));
    const proxy = engine.createProxy(realm, target, {
      defineProperty: () => thrown(failure),
    });
    engine.initializeDataProperty(
      engine.globalObject(realm),
      "prototypeFailure",
      failure,
      { configurable: true, enumerable: true, writable: true },
    );
    evaluate(
      engine,
      realm,
      `
        globalThis.prototypeProxy = new Proxy({}, {
          setPrototypeOf() {
            throw prototypeFailure;
          },
        });
      `,
    );
    const prototypeProxyValue = engine.get(
      realm,
      engine.globalObject(realm),
      "prototypeProxy",
    );
    expect(prototypeProxyValue.type).toBe("normal");
    if (prototypeProxyValue.type === "throw") {
      return;
    }
    const prototypeProxy = engine.asObject(prototypeProxyValue.value);
    expect(prototypeProxy).not.toBeNull();
    if (prototypeProxy === null) {
      return;
    }

    const dataResult = engine.defineDataProperty(
      realm,
      proxy,
      "data",
      engine.fromPrimitive(1),
      { configurable: true, enumerable: true, writable: true },
    );
    const accessorResult = engine.defineAccessorProperty(
      realm,
      proxy,
      "accessor",
      null,
      null,
      { configurable: true, enumerable: true },
    );
    const prototypeResult = engine.setPrototypeOf(
      realm,
      prototypeProxy,
      engine.createObject(realm, engine.objectPrototype(realm)),
    );

    expect(dataResult).toEqual(thrown(failure));
    expect(accessorResult).toEqual(thrown(failure));
    expect(prototypeResult).toEqual(thrown(failure));
  });

  it("keeps normal property operation rejection separate from exceptions", () => {
    const engine = new Engine262Adapter();
    const realm = engine.createRealm();
    const target = engine.createObject(realm, engine.objectPrototype(realm));
    const proxy = engine.createProxy(realm, target, {
      defineProperty: () => normal(engine.fromPrimitive(false)),
    });
    engine.initializeDataProperty(
      engine.globalObject(realm),
      "target",
      target,
      { configurable: true, enumerable: true, writable: true },
    );
    evaluate(engine, realm, "Object.preventExtensions(target)");

    expect(
      engine.defineDataProperty(
        realm,
        proxy,
        "value",
        engine.fromPrimitive(1),
        { configurable: true, enumerable: true, writable: true },
      ),
    ).toEqual(normal(false));
    expect(
      engine.defineAccessorProperty(realm, proxy, "accessor", null, null, {
        configurable: true,
        enumerable: true,
      }),
    ).toEqual(normal(false));
    expect(
      engine.setPrototypeOf(
        realm,
        target,
        engine.createObject(realm, engine.objectPrototype(realm)),
      ),
    ).toEqual(normal(false));
  });

  it("rejects handles from another adapter instance", () => {
    const first = new Engine262Adapter();
    const second = new Engine262Adapter();
    const firstRealm = first.createRealm();
    const secondRealm = second.createRealm();

    expect(() => {
      second.defineDataProperty(
        secondRealm,
        first.globalObject(firstRealm),
        "value",
        second.fromPrimitive(1),
        { configurable: true, enumerable: true, writable: true },
      );
    }).toThrow("another engine adapter");
    expect(() => second.globalObject(firstRealm)).toThrow(
      "another engine adapter",
    );
    expect(second.globalObject(secondRealm)).toBeDefined();
  });
});
