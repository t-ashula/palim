import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { WindowExecutionEnvironment } from "../helper/window-execution-environment.js";

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

  it("keeps DOMParser metadata and parsed scripts inactive", async () => {
    const environment = new WindowExecutionEnvironment({
      url: "https://example.test/path/page.html",
    });

    const document = await environment.loadHTML(
      `<body><script>${fixture("domparser-metadata-and-scripting.js")}</script></body>`,
    );

    expect(document.body?.getAttribute("data-domparser-state")).toBe("valid");
    expect(environment.scriptResults).toHaveLength(1);
  });

  it("dispatches Window load after parsing and subresource loading", async () => {
    const environment = new WindowExecutionEnvironment();

    const document = await environment.loadHTML(
      [
        "<body><script>",
        'addEventListener("load", function () {',
        '  document.body.setAttribute("data-load", "complete");',
        "});",
        "</script></body>",
      ].join(""),
    );

    expect(document.body?.getAttribute("data-load")).toBe("complete");
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

  it("exposes the external classic script as document.currentScript", async () => {
    const environment = new WindowExecutionEnvironment({
      url: "https://example.test/page.html",
      resourceLoader: {
        load() {
          return Promise.resolve({
            body: Buffer.from(fixture("records-current-script-dataset.js")),
          });
        },
      },
    });

    const document = await environment.loadHTML(
      '<body><script src="current.js" data-run-type="url"></script></body>',
    );

    expect(document.body?.getAttribute("data-run-type")).toBe("url");
    expect(document.currentScript).toBeNull();
  });

  it("restores document.currentScript after reentrant script execution", async () => {
    const environment = new WindowExecutionEnvironment();

    const document = await environment.loadHTML(
      `<body><script id="outer">${fixture("records-nested-current-script.js")}</script></body>`,
    );

    expect(document.body?.getAttribute("data-current-script-order")).toBe(
      "outer,inner,outer",
    );
    expect(document.currentScript).toBeNull();
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

  it("runs dynamic inline scripts after batched DOM insertion", async () => {
    const environment = new WindowExecutionEnvironment();
    const errors: string[] = [];
    environment.window.onerror((report) => {
      errors.push(report.message);
    });

    const document = await environment.loadHTML(
      [
        '<body><script id="parser-empty"></script><script>',
        "window.dynamicOrder = [];",
        'document.querySelector("#parser-empty").appendChild(document.createTextNode("dynamicOrder.push(\'parser-empty\');"));',
        'const container = document.createElement("div");',
        'const first = document.createElement("script");',
        'const second = document.createElement("script");',
        'const third = document.createElement("script");',
        'first.textContent = `third.appendChild(document.createTextNode("dynamicOrder.push(\'third\');")); dynamicOrder.push("first");`;',
        'second.textContent = `dynamicOrder.push("second");`;',
        "container.append(first, second, third);",
        "document.body.append(container);",
        'document.body.setAttribute("data-dynamic-order", dynamicOrder.join(","));',
        "</script></body>",
      ].join(""),
    );

    expect(errors).toEqual([]);
    expect(document.body?.getAttribute("data-dynamic-order")).toBe(
      "parser-empty,third,first,second",
    );
  });

  it("runs contextual fragment external scripts asynchronously", async () => {
    const slow = Promise.withResolvers<{ body: Uint8Array }>();
    const requests: string[] = [];
    const environment = new WindowExecutionEnvironment({
      url: "https://example.test/page.html",
      resourceLoader: {
        load(url) {
          requests.push(url.href);
          if (url.href.endsWith("/slow.js")) {
            return slow.promise;
          }
          return Promise.resolve({
            body: Buffer.from("window.contextualOrder.push('fast');"),
          });
        },
      },
    });

    const loading = environment.loadHTML(
      [
        "<body><script>",
        "window.contextualOrder = [];",
        "const inert = document.createElement('div');",
        "inert.innerHTML = '<script>window.contextualOrder.push(\"inert\");<' + '/script>';",
        "document.body.append(inert);",
        "const range = document.createRange();",
        "range.selectNodeContents(document.body);",
        "const markup = '<script src=\"slow.js\"><' + '/script>' +",
        "  '<script src=\"fast.js\"><' + '/script>' +",
        "  '<script>window.contextualOrder.push(\"inline\");<' + '/script>';",
        "const fragment = range.createContextualFragment(markup);",
        "document.body.setAttribute('data-contextual-async',",
        "  Array.from(fragment.querySelectorAll('script')).map((script) => script.async).join(','));",
        "document.body.setAttribute('data-contextual-src', fragment.querySelector('script').src);",
        "document.body.append(fragment);",
        "document.body.setAttribute('data-contextual-immediate', contextualOrder.join(','));",
        "</script></body>",
      ].join(""),
    );

    expect(requests).toEqual([
      "https://example.test/slow.js",
      "https://example.test/fast.js",
    ]);
    expect(
      environment.window.document.body?.getAttribute("data-contextual-async"),
    ).toBe("true,true,true");
    expect(
      environment.window.document.body?.getAttribute("data-contextual-src"),
    ).toBe("https://example.test/slow.js");
    expect(
      environment.window.document.body?.getAttribute(
        "data-contextual-immediate",
      ),
    ).toBe("inline");

    slow.resolve({
      body: Buffer.from("window.contextualOrder.push('slow');"),
    });
    const document = await loading;
    expect(document.body?.getAttribute("data-contextual-immediate")).toBe(
      "inline",
    );
    expect(environment.scriptResults).toHaveLength(4);
    expect(
      environment.scriptResults.map((result) =>
        result.type === "execution" ? result.element.getAttribute("src") : null,
      ),
    ).toEqual([null, null, "fast.js", "slow.js"]);
  });

  it("runs unsafe HTML insertion scripts in a connected shadow tree", async () => {
    const environment = new WindowExecutionEnvironment();

    const document = await environment.loadHTML(
      [
        "<body><div id='host'></div><script>",
        "window.shadowScriptRan = false;",
        "const shadow = document.querySelector('#host').attachShadow({ mode: 'open' });",
        "shadow.setHTMLUnsafe('<script>window.shadowScriptRan = true;<' + '/script>', { runScripts: true });",
        "document.body.setAttribute('data-shadow-connected', String(shadow.querySelector('script').isConnected));",
        "document.body.setAttribute('data-shadow-script-ran', String(window.shadowScriptRan));",
        "</script></body>",
      ].join(""),
    );

    expect(document.body?.getAttribute("data-shadow-connected")).toBe("true");
    expect(document.body?.getAttribute("data-shadow-script-ran")).toBe("true");
  });

  it("defers reentrant streaming operations until the current chunk ends", async () => {
    const environment = new WindowExecutionEnvironment();

    const document = await environment.loadHTML(
      `<body><div id="write-target"></div><div id="abort-target"></div><script>${fixture("streaming-reentrancy.js")}</script></body>`,
    );

    expect(document.body?.getAttribute("data-streaming-write-at-script")).toBe(
      "a",
    );
    expect(document.body?.getAttribute("data-streaming-write-after")).toBe(
      "a,b,c",
    );
    expect(document.body?.getAttribute("data-streaming-abort-after")).toBe(
      "a,b,c,d",
    );
  });

  it("skips a dynamic script removed by an earlier post-connection step", async () => {
    const environment = new WindowExecutionEnvironment();

    const document = await environment.loadHTML(
      [
        "<body><script>",
        "const fragment = document.createDocumentFragment();",
        'window.firstDynamic = fragment.appendChild(document.createElement("script"));',
        'window.secondDynamic = fragment.appendChild(document.createElement("script"));',
        "window.secondDynamicRan = false;",
        'firstDynamic.textContent = "secondDynamic.remove();";',
        'secondDynamic.textContent = "secondDynamicRan = true;";',
        "document.body.append(fragment);",
        'document.body.setAttribute("data-second-ran", String(secondDynamicRan));',
        "</script></body>",
      ].join(""),
    );

    expect(document.body?.getAttribute("data-second-ran")).toBe("false");
  });
});
