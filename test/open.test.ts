import { readFileSync } from "node:fs";

import { describe, expect, it, vi } from "vitest";

import { open } from "../packages/palim/src/index.js";

function fixture(name: string): string {
  return readFileSync(
    new URL(`./fixtures/open/${name}`, import.meta.url),
    "utf8",
  );
}

describe("open", () => {
  it("opens supplied HTML with its base URL", async () => {
    const context = await open({
      html: [
        "<body><script>",
        'document.body.setAttribute("data-opened", "yes");',
        "</script></body>",
      ].join(""),
      baseURL: "https://example.test/path/page.html",
    });

    expect(context.window.document.URL).toBe(
      "https://example.test/path/page.html",
    );
    expect(context.window.document.body?.getAttribute("data-opened")).toBe(
      "yes",
    );
  });

  it("loads the initial document and relative resources from a URL", async () => {
    const fetchMock = vi.fn((input: string | URL) => {
      const url = input.toString();
      return Promise.resolve(
        url.endsWith("/script.js")
          ? new Response(
              'document.body.setAttribute("data-external", "loaded");',
              { headers: { "content-type": "text/javascript; charset=utf-8" } },
            )
          : new Response('<body><script src="/script.js"></script></body>', {
              headers: { "content-type": "text/html; charset=utf-8" },
            }),
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    try {
      const context = await open("https://example.test/");

      expect(fetchMock.mock.calls.map(([input]) => input.toString())).toEqual([
        "https://example.test/",
        "https://example.test/script.js",
      ]);
      expect(context.window.document.body?.getAttribute("data-external")).toBe(
        "loaded",
      );
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it.each([
    ["iso-8859-1", "windows-1252"],
    ["iso-2022-cn-ext", "replacement"],
  ])(
    "exposes the normalized %s document encoding as %s",
    async (label, encoding) => {
      const fetchMock = vi.fn(() =>
        Promise.resolve(
          new Response(`<!doctype html><meta charset="${label}">`, {
            headers: { "content-type": "text/html" },
          }),
        ),
      );
      vi.stubGlobal("fetch", fetchMock);

      try {
        const { document } = (await open("https://example.test/")).window;

        expect(document.characterSet).toBe(encoding);
        expect(document.inputEncoding).toBe(encoding);
        expect(document.charset).toBe(encoding);
      } finally {
        vi.unstubAllGlobals();
      }
    },
  );

  it.each([
    {
      body: new TextEncoder().encode(
        '<!doctype html><meta charset="utf-8"><p>transport</p>',
      ),
      contentType: "text/html; charset=iso-8859-1",
      encoding: "windows-1252",
      source: "transport charset",
    },
    {
      body: new Uint8Array([
        0xef,
        0xbb,
        0xbf,
        ...new TextEncoder().encode(
          '<!doctype html><meta charset="windows-1252"><p>bom</p>',
        ),
      ]),
      contentType: "text/html; charset=iso-8859-1",
      encoding: "UTF-8",
      source: "BOM",
    },
  ])("prefers $source when selecting navigation encoding", async (fixture) => {
    const fetchMock = vi.fn(() =>
      Promise.resolve(
        new Response(fixture.body, {
          headers: { "content-type": fixture.contentType },
        }),
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    try {
      const { document } = (await open("https://example.test/")).window;

      expect(document.characterSet).toBe(fixture.encoding);
      expect(document.inputEncoding).toBe(fixture.encoding);
      expect(document.charset).toBe(fixture.encoding);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("parses XML responses and runs classic scripts in document order", async () => {
    const fetchMock = vi.fn((input: string | URL) => {
      const url = input.toString();
      return Promise.resolve(
        url.endsWith("/external.js")
          ? new Response(fixture("xml-navigation-external.js"), {
              headers: { "content-type": "text/javascript; charset=utf-8" },
            })
          : new Response(
              [
                '<html xmlns="http://www.w3.org/1999/xhtml" ',
                'xmlns:g="http://www.w3.org/2000/svg">',
                '<body data-order=""><div id="tests">',
                '<x id="first" class="a"/><g:x id="second" class="a"/>',
                "</div>",
                '<script src="/external.js"/>',
                `<script>${fixture("xml-navigation-inline.js")}</script>`,
                "</body></html>",
              ].join(""),
              {
                headers: {
                  "content-type": "Application/XML; Charset=UTF-8",
                },
              },
            ),
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    try {
      const context = await open("https://example.test/document.xml");
      const { document } = context.window;

      expect(fetchMock.mock.calls.map(([input]) => input.toString())).toEqual([
        "https://example.test/document.xml",
        "https://example.test/external.js",
      ]);
      expect(document.contentType).toBe("application/xml");
      const tests = document.querySelector("#tests");
      expect(Array.from(document.getElementsByClassName("a"))).toEqual(
        Array.from(tests?.children ?? []),
      );
      expect(document.querySelector("#first")?.parentElement).toBe(tests);
      expect(document.querySelector("#second")?.parentElement).toBe(tests);
      expect(document.body?.getAttribute("data-order")).toBe("external,inline");
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("loads document resources against the document base URL", async () => {
    const fetchMock = vi.fn((input: string | URL) => {
      const url = input.toString();
      return Promise.resolve(
        new Response(
          url.endsWith("/external.js")
            ? 'document.body.setAttribute("data-external", "loaded");'
            : "resource",
        ),
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    try {
      const context = await open({
        html: [
          '<base href="https://wpt.test/resources/">',
          '<link rel="stylesheet" href="support.css">',
          '<link rel="help" href="ignored.html">',
          '<img src="pixel.png">',
          '<script src="external.js"></script>',
          '<script async src="async.js"></script>',
        ].join(""),
        baseURL: "https://wpt.test/example/test.html",
      });

      expect(fetchMock.mock.calls.map(([input]) => input.toString())).toEqual([
        "https://wpt.test/resources/support.css",
        "https://wpt.test/resources/pixel.png",
        "https://wpt.test/resources/external.js",
        "https://wpt.test/resources/async.js",
      ]);
      expect(context.window.document.body?.getAttribute("data-external")).toBe(
        "loaded",
      );
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("does not share Window state between calls", async () => {
    const first = await open({ html: "<body></body>" });
    const second = await open({ html: "<body></body>" });

    first.window.document.body?.setAttribute("data-context", "first");

    expect(first.window).not.toBe(second.window);
    expect(
      second.window.document.body?.getAttribute("data-context"),
    ).toBeNull();
  });

  it("reports page errors and forwards page console calls to the host", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);

    try {
      const context = await open({
        html: [
          "<body><script>",
          "document.body.setAttribute(",
          '  "data-host-members",',
          "  typeof window.onerror,",
          ");",
          'console.log("page output", 7);',
          'throw new TypeError("page failure");',
          "</script><script>",
          'document.body.setAttribute("data-after-error", "executed");',
          "</script></body>",
        ].join("\n"),
        baseURL: "https://example.test/page.html",
      });
      const errors: { message: string; url: string; stack?: string }[] = [];

      context.window.onerror((error) => {
        errors.push(error);
      });

      expect(
        context.window.document.body?.getAttribute("data-host-members"),
      ).toBe("undefined");
      expect(
        context.window.document.body?.getAttribute("data-after-error"),
      ).toBe("executed");
      expect(log).toHaveBeenCalledWith("page output", "7");
      expect(errors).toHaveLength(1);
      expect(errors[0]).toMatchObject({
        message: "TypeError: page failure",
        url: "https://example.test/page.html",
      });
      expect(errors[0]?.stack).toContain("TypeError: page failure");
    } finally {
      log.mockRestore();
    }
  });
});
