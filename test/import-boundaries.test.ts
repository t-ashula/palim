import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import * as Core from "@palim/core";
import * as Palim from "../packages/palim/src/index.js";

const REJECT_ENGINE_IMPORT = new URL(
  "./fixtures/reject-engine-import.mjs",
  import.meta.url,
).href;

function packageDependencies(
  name: "engine262" | "palim" | "scripting" | "window",
): Record<string, string> {
  const manifest = JSON.parse(
    readFileSync(
      new URL(`../packages/${name}/package.json`, import.meta.url),
      "utf8",
    ),
  ) as { readonly dependencies?: Record<string, string> };
  return manifest.dependencies ?? {};
}

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
    importWithoutEngine(`
      const { open } = await import("@palim/window");
      const { window } = await open({
        html: "<body><script>document.body.dataset.executed = 'yes'</script></body>",
      });
      if (window.document.body?.dataset.executed !== undefined) {
        throw new Error("Window package executed a script");
      }
    `);
  });

  it("loads the scripting package without the engine package", () => {
    importWithoutEngine(`
      await import("@palim/scripting");
    `);
  });

  it("opens the full package with scripting disabled without the engine package", () => {
    importWithoutEngine(`
      const { open } = await import("palim");
      const { window } = await open({
        html: "<body><script>document.body.dataset.executed = 'yes'</script></body>",
      });
      if (window.document.body?.dataset.executed !== undefined) {
        throw new Error("Disabled open executed a script");
      }
    `);
  });

  it.each([
    ['await import("@palim/window"); await import("@palim/scripting");'],
    ['await import("@palim/scripting"); await import("@palim/window");'],
  ])("keeps Window scripting unavailable for import order %#", (imports) => {
    importWithoutEngine(`
      ${imports}
      const { open } = await import("@palim/window");
      let rejected = false;
      try {
        await open({ html: "<body></body>" }, { scripting: "enabled" });
      } catch (error) {
        rejected = error instanceof TypeError;
      }
      if (!rejected) {
        throw new Error("Window scripting changed after package imports");
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

  it("keeps engine262 in the backend package", () => {
    expect(packageDependencies("window")).toEqual({
      "@palim/core": "0.0.0",
    });
    expect(packageDependencies("scripting")).toEqual({
      "@palim/core": "0.0.0",
      "@palim/window": "0.0.0",
    });
    expect(packageDependencies("engine262")).toEqual({
      "@engine262/engine262": "file:../../vendor/engine262",
      "@palim/scripting": "0.0.0",
    });
    expect(packageDependencies("palim")).toEqual({
      "@palim/core": "0.0.0",
      "@palim/engine262": "0.0.0",
      "@palim/scripting": "0.0.0",
      "@palim/window": "0.0.0",
    });
  });
});
