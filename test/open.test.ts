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

  it("does not share Window state between calls", async () => {
    const first = await open({ html: "<body></body>" });
    const second = await open({ html: "<body></body>" });

    first.window.document.body?.setAttribute("data-context", "first");

    expect(first.window).not.toBe(second.window);
    expect(
      second.window.document.body?.getAttribute("data-context"),
    ).toBeNull();
  });
});
