import { spawnSync } from "node:child_process";

import { describe, expect, it } from "vitest";

import * as Core from "@palim/core";
import * as Palim from "../packages/palim/src/index.js";

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
  it("exposes only DOMParser as a core runtime value", () => {
    expect(Object.keys(Core)).toEqual(["DOMParser"]);
    const document = new Core.DOMParser().parseFromString(
      "<main>core</main>",
      "text/html",
    );
    expect(document.querySelector("main")?.textContent).toBe("core");
  });

  it("keeps Window out of the package root", () => {
    expect("Window" in Palim).toBe(false);
    const document = new Palim.DOMParser().parseFromString(
      "<main>parser</main>",
      "text/html",
    );
    expect(document.querySelector("main")?.textContent).toBe("parser");
  });

  it("loads the Window entry point without the engine package", () => {
    const entry = new URL("../packages/palim/src/window.ts", import.meta.url)
      .href;

    importWithoutEngine(`
      const { createWindow } = await import(${JSON.stringify(entry)});
      const window = createWindow();
      if (window.document.defaultView !== window) {
        throw new Error("Window entry point did not work");
      }
    `);
  });

  it("loads the package parser without the engine package", () => {
    importWithoutEngine(`
      const { DOMParser } = await import("@palim/core");
      const document = new DOMParser().parseFromString(
        "<main>parser-only</main>",
        "text/html",
      );
      if (document.querySelector("main")?.textContent !== "parser-only") {
        throw new Error("parser-only entry point did not work");
      }
    `);
  });
});
