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
  it("runs inline scripts in the active Window realm", async () => {
    const environment = new WindowExecutionEnvironment({
      url: "https://example.test/page.html",
    });
    const activeDocument = environment.window.document;

    const document = await environment.loadHTML(
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
    expect(
      environment.scriptResults.map((result) =>
        result.type === "execution" ? result.result.type : result.type,
      ),
    ).toEqual(["normal", "normal"]);
  });

  it("continues parsing and running scripts after script failures", async () => {
    const environment = new WindowExecutionEnvironment();

    const document = await environment.loadHTML(
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

    expect(
      environment.scriptResults.map((result) =>
        result.type === "execution" ? result.result.type : result.type,
      ),
    ).toEqual(["throw", "throw", "normal"]);
    expect(document.body?.getAttribute("data-after-errors")).toBe("executed");
    expect(document.querySelector("#parsed-after-errors")).not.toBeNull();
  });

  it("loads an external script before parsing subsequent markup", async () => {
    const requests: string[] = [];
    const resource = Promise.withResolvers<{ body: Uint8Array }>();
    const environment = new WindowExecutionEnvironment({
      url: "https://example.test/path/page.html",
      resourceLoader: {
        load(url) {
          requests.push(url.href);
          return resource.promise;
        },
      },
    });

    const loading = environment.loadHTML(
      [
        '<body><p id="before">before</p>',
        '<script src="scripts/first.js"></script>',
        '<script src="scripts/ignored.js" async></script>',
        "<script>",
        fixture("second.js"),
        "</script>",
        '<p id="after">after</p></body>',
      ].join(""),
    );

    expect(requests).toEqual(["https://example.test/path/scripts/first.js"]);
    expect(environment.window.document.querySelector("#before")).not.toBeNull();
    expect(environment.window.document.querySelector("#after")).toBeNull();

    resource.resolve({ body: Buffer.from(fixture("first.js")) });
    const document = await loading;

    expect(document.querySelector("#after")?.textContent).toBe("after");
    expect(document.body?.getAttribute("data-order")).toBe("first,second");
    expect(
      environment.scriptResults.map((result) =>
        result.type === "execution" ? result.result.type : result.type,
      ),
    ).toEqual(["normal", "normal"]);
    expect(environment.scriptResults[0]?.url).toBe(
      "https://example.test/path/scripts/first.js",
    );
  });

  it("records external load failures and skips unsupported script categories", async () => {
    const environment = new WindowExecutionEnvironment({
      url: "https://example.test/page.html",
    });
    const unexpected = fixture("unexpected.js");

    const document = await environment.loadHTML(
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
        "</script></template><p id=after></p>",
      ].join(""),
    );

    expect(environment.scriptResults).toHaveLength(1);
    expect(environment.scriptResults[0]).toMatchObject({
      type: "load-error",
      error: "missing-loader",
      url: "https://example.test/external.js",
    });
    expect(document.querySelector("#after")).not.toBeNull();
  });

  it("continues parsing after the resource loader fails", async () => {
    const environment = new WindowExecutionEnvironment({
      url: "https://example.test/page.html",
      resourceLoader: {
        load() {
          return Promise.reject(new Error("unavailable"));
        },
      },
    });

    const document = await environment.loadHTML(
      [
        '<body><script src="failure.js"></script><script>',
        fixture("after-load-failure.js"),
        '</script><p id="after-failure"></p></body>',
      ].join(""),
    );

    expect(environment.scriptResults[0]).toMatchObject({
      type: "load-error",
      error: "load-failure",
      url: "https://example.test/failure.js",
    });
    expect(environment.scriptResults[1]?.type).toBe("execution");
    expect(document.body?.getAttribute("data-after-load-failure")).toBe(
      "executed",
    );
    expect(document.querySelector("#after-failure")).not.toBeNull();
  });
});
