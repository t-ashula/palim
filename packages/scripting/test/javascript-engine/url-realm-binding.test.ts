import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import type {
  EngineRealm,
  EngineValue,
  JavaScriptEngineAdapter,
} from "@palim/scripting/internal/javascript-engine/adapter.js";
import { URLRealmBinding } from "@palim/scripting/internal/javascript-engine/url-realm-binding.js";
import { WindowRealmBinding } from "@palim/scripting/internal/javascript-engine/window-realm-binding.js";
import { Engine262Adapter } from "@palim/engine262";
import { URL } from "@palim/core/internal/url/index.js";
import { createWindow } from "@palim/window/internal/window.js";

const fixtureDirectory = resolve(
  import.meta.dirname,
  "../fixtures/url-realm-binding",
);

type FixtureFile =
  | "url-errors.js"
  | "url-instance.js"
  | "url-platform-object.js"
  | "url-search-params.js";

function fixture(file: FixtureFile): string {
  return readFileSync(resolve(fixtureDirectory, file), "utf8");
}

function evaluate(
  engine: JavaScriptEngineAdapter,
  realm: EngineRealm,
  source: string,
): EngineValue {
  const result = engine.evaluate(realm, source);
  if (result.type === "throw") {
    throw new Error(engine.exceptionMessage(realm, result.value));
  }
  return result.value;
}

describe("URLRealmBinding", () => {
  it("exposes URL as a platform object in the Window realm", () => {
    const engine = new Engine262Adapter();
    const binding = new WindowRealmBinding(engine, createWindow());

    evaluate(engine, binding.realm, fixture("url-platform-object.js"));
  });

  it("converts URLSearchParams inputs and results inside the realm", () => {
    const engine = new Engine262Adapter();
    const binding = new WindowRealmBinding(engine, createWindow());

    evaluate(engine, binding.realm, fixture("url-search-params.js"));
  });

  it("creates URL errors and brand checks in the Window realm", () => {
    const engine = new Engine262Adapter();
    const binding = new WindowRealmBinding(engine, createWindow());

    evaluate(engine, binding.realm, fixture("url-errors.js"));
  });

  it("keeps URL constructors, prototypes, and instances realm-local", () => {
    const engine = new Engine262Adapter();
    const first = new WindowRealmBinding(engine, createWindow());
    const second = new WindowRealmBinding(engine, createWindow());

    const firstConstructor = engine.get(
      first.realm,
      engine.globalObject(first.realm),
      "URL",
    );
    const secondConstructor = engine.get(
      second.realm,
      engine.globalObject(second.realm),
      "URL",
    );
    expect(firstConstructor.type).toBe("normal");
    expect(secondConstructor.type).toBe("normal");
    if (
      firstConstructor.type === "normal" &&
      secondConstructor.type === "normal"
    ) {
      expect(firstConstructor.value).not.toBe(secondConstructor.value);
    }

    const firstURL = evaluate(engine, first.realm, fixture("url-instance.js"));
    const secondURL = evaluate(
      engine,
      second.realm,
      fixture("url-instance.js"),
    );
    expect(firstURL).not.toBe(secondURL);
  });

  it("keeps URL wrappers stable within one realm and separate across realms", () => {
    const engine = new Engine262Adapter();
    const first = new URLRealmBinding(engine, engine.createRealm());
    const second = new URLRealmBinding(engine, engine.createRealm());
    const url = new URL("https://example.com/path");

    expect(first.platformObject(url)).toBe(first.platformObject(url));
    expect(first.platformObject(url)).not.toBe(second.platformObject(url));
  });
});
