import { describe, expect, it, vi } from "vitest";

import { open } from "../src/index.js";

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
