import type {
  DedicatedWorkerExtension,
  ServiceWorkerExtension,
  SharedWorkerExtension,
} from "@palim/polyfills";
import { createExtensionHostServices } from "@palim/polyfills";
import type {
  OpenHTMLOptions,
  OpenOptions as WindowOpenOptions,
  OpenResult,
} from "@palim/window";
import { createOpen } from "@palim/window";

export type { OpenHTMLOptions, OpenResult } from "@palim/window";

export interface WorkerExtensions {
  readonly dedicated?: readonly DedicatedWorkerExtension[];
  readonly shared?: readonly SharedWorkerExtension[];
  readonly service?: readonly ServiceWorkerExtension[];
}

export interface OpenOptions extends WindowOpenOptions {
  readonly workerExtensions?: WorkerExtensions;
}

export type Open = (
  input: string | OpenHTMLOptions,
  options?: OpenOptions,
) => Promise<OpenResult>;

const openWithScripting = createOpen<OpenOptions>(
  async (window, resourceLoader, extensions, options) => {
    const [
      { Engine262Adapter },
      { createWindowScripting },
      { WorkerScriptingManager },
    ] = await Promise.all([
      import("@palim/engine262"),
      import("@palim/scripting"),
      import("@palim/worker"),
    ]);
    const createEngine = () => new Engine262Adapter();
    const workerExtensions = options.workerExtensions ?? {};
    const hostServices = createExtensionHostServices([
      ...extensions,
      ...(workerExtensions.dedicated ?? []),
      ...(workerExtensions.shared ?? []),
      ...(workerExtensions.service ?? []),
    ]);
    const workerManager = new WorkerScriptingManager(
      createEngine,
      workerExtensions,
      hostServices,
    );
    return createWindowScripting(
      createEngine(),
      window,
      resourceLoader,
      extensions,
      hostServices,
      [workerManager],
    );
  },
);

export const open: Open = (input, options = {}) => {
  const workerExtensions = options.workerExtensions;
  const hasWorkerExtensions =
    (workerExtensions?.dedicated?.length ?? 0) > 0 ||
    (workerExtensions?.shared?.length ?? 0) > 0 ||
    (workerExtensions?.service?.length ?? 0) > 0;
  if (options.scripting !== "enabled" && hasWorkerExtensions) {
    return Promise.reject(
      new TypeError("Worker extensions require scripting to be enabled"),
    );
  }
  return openWithScripting(input, options);
};
