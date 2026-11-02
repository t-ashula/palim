import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { WindowExecutionEnvironment } from "../../src/window-javascript.js";

function fixture(name: string): string {
  return readFileSync(
    new URL(`../fixtures/window-script-element/${name}`, import.meta.url),
    "utf8",
  );
}

describe("parser-inserted classic scripts", () => {
  it("runs inline scripts synchronously in the active Window realm", () => {
    const environment = new WindowExecutionEnvironment({
      url: "https://example.com/page.html",
    });
    const activeDocument = environment.window.document;

    const document = environment.loadHTML(
      [
        '<!doctype html><html><body><p id="before">before</p>',
        '<script type="text/javascript">',
        fixture("first.js"),
        "</script><script>",
        fixture("second.js"),
        '</script><p id="after">after</p></body></html>',
      ].join(""),
    );

    expect(document).toBe(activeDocument);
    expect(environment.window.document).toBe(activeDocument);
    expect(document.defaultView).toBe(environment.window);
    expect(document.body?.getAttribute("data-first")).toBe("before");
    expect(document.body?.getAttribute("data-order")).toBe("first,second");
    expect(document.querySelector("#after")?.textContent).toBe("after");
    expect(environment.scriptResults).toHaveLength(2);
    expect(environment.scriptResults.map(({ result }) => result.type)).toEqual([
      "normal",
      "normal",
    ]);
  });

  it("continues parsing and running scripts after script failures", () => {
    const environment = new WindowExecutionEnvironment();

    const document = environment.loadHTML(
      [
        "<body><script>",
        fixture("syntax-error.js"),
        "</script><script>",
        fixture("runtime-error.js"),
        "</script><script>",
        fixture("after-errors.js"),
        '</script><p id="parsed-after-errors"></p></body>',
      ].join(""),
    );

    expect(environment.scriptResults.map(({ result }) => result.type)).toEqual([
      "throw",
      "throw",
      "normal",
    ]);
    expect(document.body?.getAttribute("data-after-errors")).toBe("executed");
    expect(document.querySelector("#parsed-after-errors")).not.toBeNull();
  });

  it("does not execute scripts outside the initial inline classic scope", () => {
    const environment = new WindowExecutionEnvironment();
    const unexpected = fixture("unexpected.js");

    environment.loadHTML(
      [
        '<script src="external.js">',
        unexpected,
        '</script><script type="module">',
        unexpected,
        '</script><script type="importmap">',
        unexpected,
        '</script><script type="application/json">',
        unexpected,
        '</script><script type=" ">',
        unexpected,
        "</script><script nomodule>",
        unexpected,
        "</script><template><script>",
        unexpected,
        "</script></template>",
      ].join(""),
    );

    expect(environment.scriptResults).toEqual([]);
  });
});
