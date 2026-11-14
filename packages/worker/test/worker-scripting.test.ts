import { TextEncoder } from "node:util";

import type { URL } from "@palim/core/internal/url/index.js";
import { Engine262Adapter } from "@palim/engine262";
import { createHostServices } from "@palim/polyfills";
import { WindowScriptingEnvironment } from "@palim/scripting/internal/window-scripting.js";
import type {
  Resource,
  ResourceLoader,
} from "@palim/window/internal/document-loader.js";
import { WindowDocumentLoader } from "@palim/window/internal/document-loader.js";
import { WorkerScriptingManager } from "@palim/worker";
import { expect, it } from "vitest";

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

function createEnvironment(resources: Readonly<Record<string, string>>): {
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
  const workerManager = new WorkerScriptingManager(() => {
    const engine = new Engine262Adapter();
    workerEngines.push(engine);
    return engine;
  });
  const environment = new WindowScriptingEnvironment(
    new Engine262Adapter(),
    loader.window,
    resourceLoader,
    [],
    createHostServices(),
    undefined,
    [workerManager],
  );
  return { environment, loader, resources: resourceLoader, workerEngines };
}

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
