import { describe, expect, it } from "vitest";

import {
  TrustedHTML,
  TrustedHTMLParserOptions,
  TrustedScript,
  TrustedScriptURL,
  windowTrustedTypes,
} from "../src/index.js";
import { createWindow } from "../src/window.js";

describe("Trusted Types policy state", () => {
  it("keeps policy names and default policies in one Window", () => {
    const first = windowTrustedTypes(createWindow());
    const second = windowTrustedTypes(createWindow());

    const policy = first.createPolicy("default", {});
    if (policy === null) {
      throw new Error("Could not create the default policy");
    }

    expect(first.defaultPolicy).toBe(policy);
    expect(second.defaultPolicy).toBeNull();
    expect(first.createPolicy("default", {})).toBeNull();
    expect(second.createPolicy("default", {})).not.toBeNull();
    expect(first.createPolicy("application", {})).not.toBeNull();
    expect(first.createPolicy("application", {})).not.toBeNull();
  });

  it("creates branded values from policy callback results", () => {
    const factory = windowTrustedTypes(createWindow());
    const calls: unknown[][] = [];
    const policy = factory.createPolicy("application", {
      createHTML: (input, argumentsList) => {
        calls.push([input, ...argumentsList]);
        return { type: "normal", value: `<p>${String(input)}</p>` };
      },
      createScript: (input) => ({ type: "normal", value: input }),
      createScriptURL: (input) => ({ type: "normal", value: input }),
      createParserOptions: (input) => ({ type: "normal", value: input }),
    });
    if (policy === null) {
      throw new Error("Could not create the application policy");
    }

    const html = policy.createHTML("content", ["extra"]);
    const script = policy.createScript("run()", []);
    const scriptURL = policy.createScriptURL("/script.js", []);
    const parserOptions = policy.createParserOptions({ mode: "safe" }, []);

    expect(html.type).toBe("normal");
    expect(html.type === "normal" && html.value instanceof TrustedHTML).toBe(
      true,
    );
    expect(script.type).toBe("normal");
    expect(
      script.type === "normal" && script.value instanceof TrustedScript,
    ).toBe(true);
    expect(scriptURL.type).toBe("normal");
    expect(
      scriptURL.type === "normal" &&
        scriptURL.value instanceof TrustedScriptURL,
    ).toBe(true);
    expect(parserOptions.type).toBe("normal");
    expect(
      parserOptions.type === "normal" &&
        parserOptions.value instanceof TrustedHTMLParserOptions,
    ).toBe(true);
    expect(calls).toEqual([["content", "extra"]]);
    expect(html.type === "normal" && html.value.policyName).toBe("application");
    expect(html.type === "normal" && html.value.data).toBe("<p>content</p>");
  });

  it("returns callback failures without throwing them", () => {
    const failure = { reason: "page callback" };
    const policy = windowTrustedTypes(createWindow()).createPolicy("failure", {
      createHTML: () => ({ type: "throw", value: failure }),
    });
    if (policy === null) {
      throw new Error("Could not create the failure policy");
    }

    expect(policy.createHTML("content", [])).toEqual({
      type: "throw",
      value: failure,
    });
  });
});
