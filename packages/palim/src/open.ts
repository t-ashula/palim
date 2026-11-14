import { createOpen } from "@palim/window/internal/open.js";

export type {
  Open,
  OpenHTMLOptions,
  OpenOptions,
  OpenResult,
} from "@palim/window";

export const open = createOpen(
  async (window, resourceLoader, extensions, hostServices) => {
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
    const workerManager = new WorkerScriptingManager(createEngine);
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
