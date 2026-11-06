import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { runInThisContext } from "node:vm";

import {
  AbortController,
  AbortSignal,
  CustomEvent,
  Document,
  DOMException,
  DOMParser,
  DOMTokenList,
  Element,
  Event,
  EventTarget,
  HTMLCollection,
  NamedNodeMap,
  Node,
  NodeList,
} from "../../src/index.js";
import type {
  DOMShellCompletedResult,
  DOMShellHarnessStatus,
  DOMShellRunnerErrorResult,
  DOMShellSourceResult,
  DOMShellSubtestStatus,
} from "./model.js";
import {
  resolveWPTResourcePath,
  resolveWPTSourcePath,
} from "./model.js";

interface HarnessSubtestClone {
  readonly name: unknown;
  readonly status: unknown;
  readonly message: unknown;
  readonly stack: unknown;
}

interface HarnessSubtest {
  structured_clone(): HarnessSubtestClone;
}

interface HarnessStatusClone {
  readonly status: unknown;
  readonly message: unknown;
  readonly stack: unknown;
}

interface HarnessStatus {
  structured_clone(): HarnessStatusClone;
}

type CompletionCallback = (
  tests: readonly HarnessSubtest[],
  status: HarnessStatus,
) => void;

interface HarnessGlobal extends Record<string, unknown> {
  add_completion_callback?: (callback: CompletionCallback) => void;
}

const ECMASCRIPT_GLOBALS = new Set([
  "AggregateError",
  "Array",
  "ArrayBuffer",
  "Atomics",
  "BigInt",
  "BigInt64Array",
  "BigUint64Array",
  "Boolean",
  "DataView",
  "Date",
  "Error",
  "EvalError",
  "FinalizationRegistry",
  "Float32Array",
  "Float64Array",
  "Function",
  "Infinity",
  "Int16Array",
  "Int32Array",
  "Int8Array",
  "Intl",
  "JSON",
  "Map",
  "Math",
  "NaN",
  "Number",
  "Object",
  "Promise",
  "Proxy",
  "RangeError",
  "ReferenceError",
  "Reflect",
  "RegExp",
  "Set",
  "SharedArrayBuffer",
  "String",
  "Symbol",
  "SyntaxError",
  "TypeError",
  "URIError",
  "Uint16Array",
  "Uint32Array",
  "Uint8Array",
  "Uint8ClampedArray",
  "WeakMap",
  "WeakRef",
  "WeakSet",
  "decodeURI",
  "decodeURIComponent",
  "encodeURI",
  "encodeURIComponent",
  "escape",
  "eval",
  "globalThis",
  "isFinite",
  "isNaN",
  "parseFloat",
  "parseInt",
  "undefined",
  "unescape",
]);

const PALIM_GLOBALS = {
  AbortController,
  AbortSignal,
  CustomEvent,
  Document,
  DOMException,
  DOMParser,
  DOMTokenList,
  Element,
  Event,
  EventTarget,
  HTMLCollection,
  NamedNodeMap,
  Node,
  NodeList,
} as const;

const FORBIDDEN_NODE_WEB_GLOBALS = [
  "fetch",
  "FormData",
  "Headers",
  "MessageChannel",
  "MessageEvent",
  "MessagePort",
  "Request",
  "Response",
  "URL",
  "URLSearchParams",
  "WebSocket",
] as const;

const nodeProcess = process;

function message(value: unknown): string | null {
  return value === null || value === undefined ? null : display(value);
}

function display(value: unknown): string {
  switch (typeof value) {
    case "bigint":
    case "boolean":
    case "number":
    case "string":
    case "symbol":
    case "undefined":
      return String(value);
    default:
      return value === null ? "null" : Object.prototype.toString.call(value);
  }
}

function subtestStatus(value: unknown): DOMShellSubtestStatus {
  switch (value) {
    case 0:
      return "pass";
    case 1:
      return "fail";
    case 2:
      return "timeout";
    case 3:
      return "not-run";
    case 4:
      return "precondition-failed";
    default:
      throw new TypeError(`unknown testharness subtest status: ${display(value)}`);
  }
}

function harnessStatus(value: unknown): DOMShellHarnessStatus {
  switch (value) {
    case 0:
      return "ok";
    case 1:
      return "error";
    case 2:
      return "timeout";
    case 3:
      return "precondition-failed";
    default:
      throw new TypeError(`unknown testharness status: ${display(value)}`);
  }
}

function send(result: DOMShellSourceResult): void {
  if (nodeProcess.send === undefined) {
    throw new Error("DOM shell worker requires an IPC channel");
  }
  nodeProcess.send(result, () => {
    if (nodeProcess.connected) {
      nodeProcess.disconnect();
    }
  });
}

function runnerError(source: string, error: unknown): DOMShellRunnerErrorResult {
  const normalized = error instanceof Error ? error : new Error(String(error));
  return {
    schemaVersion: 1,
    profile: "dom-shell",
    source,
    result: "runner-error",
    message: normalized.message,
    ...(normalized.stack === undefined ? {} : { stack: normalized.stack }),
  };
}

function restrictGlobal(): void {
  for (const name of Object.getOwnPropertyNames(globalThis)) {
    if (ECMASCRIPT_GLOBALS.has(name)) {
      continue;
    }
    if (!Reflect.deleteProperty(globalThis, name)) {
      throw new Error(`cannot remove Node.js global ${name}`);
    }
  }
  Object.defineProperty(globalThis, "self", {
    configurable: true,
    value: globalThis,
    writable: false,
  });
  Object.defineProperty(globalThis, "GLOBAL", {
    configurable: true,
    value: Object.freeze({
      isShadowRealm: (): boolean => false,
      isWindow: (): boolean => false,
      isWorker: (): boolean => false,
    }),
    writable: false,
  });
}

function exposePalimGlobals(): void {
  for (const [name, value] of Object.entries(PALIM_GLOBALS)) {
    Object.defineProperty(globalThis, name, {
      configurable: true,
      value,
      writable: true,
    });
  }
  const globalEventTarget = new EventTarget();
  Object.defineProperties(globalThis, {
    addEventListener: {
      configurable: true,
      value: globalEventTarget.addEventListener.bind(globalEventTarget),
      writable: true,
    },
    dispatchEvent: {
      configurable: true,
      value: globalEventTarget.dispatchEvent.bind(globalEventTarget),
      writable: true,
    },
    removeEventListener: {
      configurable: true,
      value: globalEventTarget.removeEventListener.bind(globalEventTarget),
      writable: true,
    },
  });
}

function verifyGlobalIsolation(): void {
  for (const name of FORBIDDEN_NODE_WEB_GLOBALS) {
    if (name in globalThis) {
      throw new Error(`Node.js Web API leaked into the test global: ${name}`);
    }
  }
}

function metadataScripts(source: string): string[] {
  return [...source.matchAll(/^\/\/ META: script=(.+)$/gmu)].map(
    (match) => match[1]?.trim() ?? "",
  );
}

function evaluateLocalResource(
  wptRoot: string,
  source: string,
  resource: string,
): void {
  const resourcePath = resolveWPTResourcePath(wptRoot, source, resource);
  runInThisContext(readFileSync(resourcePath, "utf8"), {
    filename: resourcePath,
  });
}

function executeAnySource(
  wptRoot: string,
  source: string,
  testSource: string,
  testPath: string,
): void {
  for (const resource of metadataScripts(testSource)) {
    evaluateLocalResource(wptRoot, source, resource);
  }
  runInThisContext(testSource, { filename: testPath });
}

function executeHTMLSource(
  wptRoot: string,
  source: string,
  testSource: string,
  testPath: string,
): void {
  const document = new DOMParser().parseFromString(testSource, "text/html");
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: document,
    writable: false,
  });
  let inlineScriptIndex = 0;
  for (const script of document.querySelectorAll("script")) {
    const resource = script.getAttribute("src");
    if (resource !== null) {
      if (
        resource === "/resources/testharness.js" ||
        resource === "/resources/testharnessreport.js"
      ) {
        continue;
      }
      evaluateLocalResource(wptRoot, source, resource);
      continue;
    }
    inlineScriptIndex += 1;
    runInThisContext(script.textContent ?? "", {
      filename: `${testPath}#inline-script-${String(inlineScriptIndex)}`,
    });
  }
}

function execute(wptRoot: string, source: string): void {
  const harnessPath = resolve(wptRoot, "resources/testharness.js");
  const testPath = resolveWPTSourcePath(wptRoot, source);
  const harnessSource = readFileSync(harnessPath, "utf8");
  const testSource = readFileSync(testPath, "utf8");

  restrictGlobal();
  verifyGlobalIsolation();
  runInThisContext(harnessSource, { filename: harnessPath });

  const harnessGlobal = globalThis as HarnessGlobal;
  const addCompletionCallback = harnessGlobal.add_completion_callback;
  if (addCompletionCallback === undefined) {
    throw new Error("testharness did not expose add_completion_callback");
  }
  addCompletionCallback((tests, status) => {
    try {
      const harness = status.structured_clone();
      const result: DOMShellCompletedResult = {
        schemaVersion: 1,
        profile: "dom-shell",
        source,
        result: "complete",
        harness: {
          status: harnessStatus(harness.status),
          message: message(harness.message),
          stack: message(harness.stack),
        },
        subtests: tests.map((test) => {
          const clone = test.structured_clone();
          return {
            name: String(clone.name),
            status: subtestStatus(clone.status),
            message: message(clone.message),
            stack: message(clone.stack),
          };
        }),
      };
      send(result);
    } catch (error) {
      send(runnerError(source, error));
    }
  });

  exposePalimGlobals();
  if (source.endsWith(".any.js")) {
    executeAnySource(wptRoot, source, testSource, testPath);
  } else if (source.endsWith(".html")) {
    executeHTMLSource(wptRoot, source, testSource, testPath);
  } else {
    throw new TypeError(`unsupported DOM shell source type: ${source}`);
  }
}

const wptRoot = nodeProcess.argv[2];
const source = nodeProcess.argv[3] ?? "";

if (wptRoot === undefined || source === "") {
  send(runnerError(source, new TypeError("worker requires WPT root and source")));
} else {
  try {
    execute(wptRoot, source);
  } catch (error) {
    send(runnerError(source, error));
  }
}
