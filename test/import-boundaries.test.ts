import { spawnSync } from "node:child_process";

import { describe, expect, it } from "vitest";

const REJECT_ENGINE_IMPORT = new URL(
  "./fixtures/reject-engine-import.mjs",
  import.meta.url,
).href;

function importWithoutEngine(source: string): void {
  const result = spawnSync(
    process.execPath,
    [
      "--import",
      "tsx",
      "--import",
      REJECT_ENGINE_IMPORT,
      "--input-type=module",
      "--eval",
      source,
    ],
    { encoding: "utf8" },
  );
  expect(result.status, result.stderr || result.stdout).toBe(0);
}

describe("capability import boundaries", () => {
  it("loads the parser entry point without Window or the engine package", () => {
    const entry = new URL("../src/index.ts", import.meta.url).href;

    importWithoutEngine(`
      const palim = await import(${JSON.stringify(entry)});
      if ("Window" in palim) {
        throw new Error("parser entry point exposed Window");
      }
      const document = new palim.DOMParser().parseFromString(
        "<main>parser</main>",
        "text/html",
      );
      if (document.querySelector("main")?.textContent !== "parser") {
        throw new Error("parser entry point did not work");
      }
    `);
  });

  it("loads the Window entry point without the engine package", () => {
    const entry = new URL("../src/window.ts", import.meta.url).href;

    importWithoutEngine(`
      const { Window } = await import(${JSON.stringify(entry)});
      const window = new Window();
      if (window.document.defaultView !== window) {
        throw new Error("Window entry point did not work");
      }
    `);
  });
});
