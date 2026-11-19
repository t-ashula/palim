import { TextEncoder } from "node:util";

import type { URL } from "@palim/core";
import { Engine262Adapter } from "@palim/engine262";
import {
  createExtensionHostServices,
  fetchPolyfill,
  xmlHttpRequestPolyfill,
} from "@palim/polyfills";
import { WindowScriptingEnvironment } from "@palim/scripting";
import type { Resource, ResourceLoader } from "@palim/window";
import { WindowDocumentLoader } from "@palim/window";
import { afterEach, expect, it, vi } from "vitest";

import type { WorkerExtensions } from "../src/index.js";
import { WorkerScriptingManager } from "../src/index.js";

class MemoryResourceLoader implements ResourceLoader {
  readonly #resources: ReadonlyMap<string, string>;
  readonly requests: string[] = [];

  constructor(resources: Readonly<Record<string, string>>) {
    this.#resources = new Map(Object.entries(resources));
  }

  load(url: URL): Promise<Resource> {
    this.requests.push(url.href);
    const source = this.#resources.get(url.href);
    if (source === undefined) {
      throw new TypeError(`Missing resource ${url.href}`);
    }
    return Promise.resolve({
      body: new TextEncoder().encode(source),
      url: url.href,
      encoding: "utf-8",
      mimeType: "text/javascript",
    });
  }
}

function createEnvironment(
  resources: Readonly<Record<string, string>>,
  extensions: WorkerExtensions = {},
): {
  readonly environment: WindowScriptingEnvironment;
  readonly loader: WindowDocumentLoader;
  readonly resources: MemoryResourceLoader;
  readonly workerEngines: readonly Engine262Adapter[];
} {
  const resourceLoader = new MemoryResourceLoader(resources);
  const loader = new WindowDocumentLoader({
    url: "https://example.test/page.html",
    resourceLoader,
  });
  const workerEngines: Engine262Adapter[] = [];
  const selectedExtensions = [
    ...(extensions.dedicated ?? []),
    ...(extensions.shared ?? []),
    ...(extensions.service ?? []),
  ];
  const hostServices = createExtensionHostServices(selectedExtensions);
  const workerManager = new WorkerScriptingManager(
    () => {
      const engine = new Engine262Adapter();
      workerEngines.push(engine);
      return engine;
    },
    extensions,
    hostServices,
  );
  const environment = new WindowScriptingEnvironment(
    new Engine262Adapter(),
    loader.window,
    resourceLoader,
    [],
    hostServices,
    undefined,
    [workerManager],
  );
  return { environment, loader, resources: resourceLoader, workerEngines };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

async function waitFor(predicate: () => boolean): Promise<void> {
  const deadline = Date.now() + 1_000;
  while (!predicate()) {
    if (Date.now() >= deadline) {
      throw new Error("Timed out waiting for worker result");
    }
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
}

it("runs a classic Dedicated Worker in a separate agent", async () => {
  const { environment, loader, resources, workerEngines } = createEnvironment({
    "https://example.test/helper.js": "self.helperValue = 42;",
    "https://example.test/worker.js": `
        importScripts("/helper.js");
        postMessage({
          type: "ready",
          helperValue,
          noDocument: typeof Document === "undefined",
          noWindow: typeof Window === "undefined",
          dedicated: self instanceof DedicatedWorkerGlobalScope,
        });
        onmessage = event => {
          postMessage({
            type: "echo",
            sameArray: Array.isArray(event.data.values),
            value: event.data.values[1],
          });
        };
      `,
  });

  await loader.loadHTML(
    `
      <!doctype html><body>
      <script>
        const worker = new Worker("/worker.js");
        worker.addEventListener("message", event => {
          if (event.data.type === "ready") {
            document.body.dataset.ready = String(
              event.data.helperValue === 42 &&
              event.data.noDocument &&
              event.data.noWindow &&
              event.data.dedicated
            );
            worker.postMessage({ values: [1, 2] });
          } else {
            document.body.dataset.echo = String(
              event.data.sameArray && event.data.value === 2
            );
          }
        });
      </script>
    `,
    environment,
  );
  await waitFor(
    () =>
      environment.window.document.body?.getAttribute("data-echo") === "true",
  );

  expect(environment.window.document.body?.getAttribute("data-ready")).toBe(
    "true",
  );
  expect(environment.window.document.body?.getAttribute("data-echo")).toBe(
    "true",
  );
  expect(workerEngines).toHaveLength(1);
  expect(workerEngines[0]).not.toBe(environment.engine);
  expect(resources.requests).toEqual([
    "https://example.test/worker.js",
    "https://example.test/helper.js",
  ]);
});

it("reuses a classic Shared Worker and creates a port per connection", async () => {
  const { environment, loader, workerEngines } = createEnvironment({
    "https://example.test/shared.js": `
      let connection = 0;
      onconnect = event => {
        connection += 1;
        event.source.postMessage({ connection, name });
      };
    `,
  });

  await loader.loadHTML(
    `
      <!doctype html><body>
      <script>
        const values = [];
        for (let index = 0; index < 2; index += 1) {
          const worker = new SharedWorker("/shared.js", { name: "shared" });
          worker.port.onmessage = event => {
            values.push(event.data.connection + ":" + event.data.name);
            values.sort();
            document.body.dataset.connections = values.join(",");
          };
        }
      </script>
    `,
    environment,
  );
  await waitFor(
    () =>
      environment.window.document.body?.getAttribute("data-connections") ===
      "1:shared,2:shared",
  );

  expect(workerEngines).toHaveLength(1);
  expect(
    environment.window.document.body?.getAttribute("data-connections"),
  ).toBe("1:shared,2:shared");
});

it("exposes Blob, File, and binary FormData entries in workers", async () => {
  const { environment, loader } = createEnvironment({
    "https://example.test/blob-worker.js": `
      const blob = new Blob(["worker"], { type: "Text/Plain" });
      const file = new File([blob], "worker.txt", { lastModified: 42 });
      const data = new FormData();
      data.append("file", file);
      postMessage({
        blob: blob instanceof Blob && blob.size === 6 && blob.type === "text/plain",
        file:
          file instanceof File &&
          file instanceof Blob &&
          file.name === "worker.txt" &&
          file.lastModified === 42,
        formData: data.get("file") === file,
      });
    `,
  });

  await loader.loadHTML(
    `
      <!doctype html><body>
      <script>
        const worker = new Worker("/blob-worker.js");
        worker.onmessage = event => {
          document.body.dataset.blob = String(
            event.data.blob && event.data.file && event.data.formData
          );
        };
      </script>
    `,
    environment,
  );
  await waitFor(
    () =>
      environment.window.document.body?.getAttribute("data-blob") === "true",
  );

  expect(environment.window.document.body?.getAttribute("data-blob")).toBe(
    "true",
  );
});

it("installs Fetch selected for a Dedicated Worker", async () => {
  const hostFetch = vi.fn((input: string) =>
    Promise.resolve({
      url: input,
      status: 200,
      statusText: "OK",
      headers: [["content-type", "text/plain"]],
      arrayBuffer: () =>
        Promise.resolve(new TextEncoder().encode("worker response").buffer),
    }),
  );
  vi.stubGlobal("fetch", hostFetch);
  const fetchExtension = fetchPolyfill();
  const { environment, loader } = createEnvironment(
    {
      "https://example.test/workers/fetch.js": `
        const result = fetch("./data.txt");
        result.then(async response => {
          postMessage({
            globals: [fetch, Headers, Request, Response].every(
              value => typeof value === "function"
            ),
            promise: result instanceof Promise,
            response: response instanceof Response,
            text: await response.text(),
          });
        });
      `,
    },
    { dedicated: [fetchExtension] },
  );

  await loader.loadHTML(
    `
      <!doctype html><body>
      <script>
        const worker = new Worker("/workers/fetch.js");
        worker.onmessage = event => {
          document.body.dataset.fetch = JSON.stringify(event.data);
        };
      </script>
    `,
    environment,
  );
  await waitFor(
    () => environment.window.document.body?.getAttribute("data-fetch") !== null,
  );

  expect(
    JSON.parse(
      environment.window.document.body?.getAttribute("data-fetch") ?? "null",
    ),
  ).toEqual({
    globals: true,
    promise: true,
    response: true,
    text: "worker response",
  });
  expect(hostFetch).toHaveBeenCalledWith(
    "https://example.test/workers/data.txt",
    expect.any(Object),
  );
});

it("installs XMLHttpRequest selected for a Dedicated Worker", async () => {
  const hostFetch = vi.fn((input: string) =>
    Promise.resolve({
      url: input,
      status: 200,
      statusText: "OK",
      headers: [["content-type", "text/plain"]],
      arrayBuffer: () =>
        Promise.resolve(new TextEncoder().encode("xhr response").buffer),
    }),
  );
  vi.stubGlobal("fetch", hostFetch);
  const xhrExtension = xmlHttpRequestPolyfill();
  const { environment, loader } = createEnvironment(
    {
      "https://example.test/workers/xhr.js": `
        const request = new XMLHttpRequest();
        request.open("GET", "./data.txt");
        request.responseType = "document";
        request.onload = () => {
          postMessage({
            response: request.responseText,
            responseType: request.responseType,
            responseXML: "responseXML" in request,
          });
        };
        request.send();
      `,
    },
    { dedicated: [xhrExtension] },
  );

  await loader.loadHTML(
    `
      <!doctype html><body>
      <script>
        const worker = new Worker("/workers/xhr.js");
        worker.onmessage = event => {
          document.body.dataset.xhr = JSON.stringify(event.data);
        };
      </script>
    `,
    environment,
  );
  await waitFor(
    () => environment.window.document.body?.getAttribute("data-xhr") !== null,
  );

  expect(
    JSON.parse(
      environment.window.document.body?.getAttribute("data-xhr") ?? "null",
    ),
  ).toEqual({
    response: "xhr response",
    responseType: "",
    responseXML: false,
  });
  expect(hostFetch).toHaveBeenCalledWith(
    "https://example.test/workers/data.txt",
    expect.any(Object),
  );
});

it("loads a Worker from a Blob URL and exposes Blob URL methods in it", async () => {
  const { environment, loader, resources } = createEnvironment({});

  await loader.loadHTML(
    `
      <!doctype html><body>
      <script>
        const source = new Blob([
          'const url = URL.createObjectURL(new Blob(["worker"]));',
          'postMessage(url);',
        ], { type: "text/javascript" });
        const sourceURL = URL.createObjectURL(source);
        const worker = new Worker(sourceURL);
        worker.onmessage = event => {
          document.body.setAttribute(
            "data-worker-blob-url",
            String(event.data.startsWith("blob:https://example.test/")),
          );
          URL.revokeObjectURL(event.data);
          URL.revokeObjectURL(sourceURL);
        };
      </script>
    `,
    environment,
  );
  await waitFor(
    () =>
      environment.window.document.body?.getAttribute("data-worker-blob-url") ===
      "true",
  );

  expect(
    environment.window.document.body?.getAttribute("data-worker-blob-url"),
  ).toBe("true");
  expect(resources.requests).toEqual([]);
});

it("reports worker exceptions to the page Worker object", async () => {
  const { environment, loader } = createEnvironment({
    "https://example.test/throws.js": `
      throw new Error("worker failure");
    `,
  });

  await loader.loadHTML(
    `
      <!doctype html><body>
      <script>
        const worker = new Worker("/throws.js");
        worker.addEventListener("error", event => {
          document.body.dataset.workerError = event.message;
          event.preventDefault();
        });
      </script>
    `,
    environment,
  );
  await waitFor(
    () =>
      environment.window.document.body?.getAttribute("data-worker-error") ===
      "Error: worker failure",
  );

  expect(
    environment.window.document.body?.getAttribute("data-worker-error"),
  ).toBe("Error: worker failure");
});
