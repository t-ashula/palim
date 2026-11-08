import { createOpen } from "@palim/window/internal/open.js";

export type {
  Open,
  OpenHTMLOptions,
  OpenOptions,
  OpenResult,
} from "@palim/window";

export const open = createOpen(async (window, resourceLoader) => {
  const [{ Engine262Adapter }, { createWindowScripting }] = await Promise.all([
    import("@palim/engine262"),
    import("@palim/scripting"),
  ]);
  return createWindowScripting(new Engine262Adapter(), window, resourceLoader);
});
