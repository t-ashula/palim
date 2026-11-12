import { describe, expect, it, vi } from "vitest";

import { HTMLIFrameElement, open } from "@palim/window";

describe("open", () => {
  it("keeps scripting disabled when the option is omitted", async () => {
    const context = await open({
      html: [
        "<body><script>",
        'document.body.setAttribute("data-executed", "yes");',
        "</script><noscript><p>fallback</p></noscript></body>",
      ].join(""),
    });

    expect(
      context.window.document.body?.getAttribute("data-executed"),
    ).toBeNull();
    expect(
      context.window.document.querySelector("noscript p")?.textContent,
    ).toBe("fallback");
  });

  it("parses host document writes without executing scripts", async () => {
    const context = await open({ html: "<p>old</p>" });
    const loaded = new Promise<void>((resolve) => {
      context.window.addEventListener(
        "load",
        () => {
          resolve();
        },
        { once: true },
      );
    });

    context.window.document.open();
    context.window.document.write(
      '<main>new<script>document.body.dataset.ran = "yes"</script></main>',
    );
    context.window.document.close();
    await loaded;

    expect(context.window.document.querySelector("main")?.textContent).toBe(
      'newdocument.body.dataset.ran = "yes"',
    );
    expect(context.window.document.body?.getAttribute("data-ran")).toBeNull();
  });

  it("does not fetch script resources when scripting is disabled", async () => {
    const fetchMock = vi.fn((_input: string | URL) =>
      Promise.resolve(
        new Response('<body><script src="script.js"></script></body>', {
          headers: { "content-type": "text/html" },
        }),
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    try {
      await open("https://example.test/");
      expect(fetchMock.mock.calls.map(([input]) => input.toString())).toEqual([
        "https://example.test/",
      ]);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("keeps scripting disabled in child iframe documents", async () => {
    const context = await open({
      html: [
        '<iframe srcdoc="<body><script>',
        "document.body.setAttribute('data-executed', 'yes');",
        '</script></body>"></iframe>',
      ].join(""),
    });
    const iframe = context.window.document.querySelector("iframe");

    expect(
      iframe instanceof HTMLIFrameElement
        ? iframe.contentDocument?.body?.getAttribute("data-executed")
        : null,
    ).toBeNull();
  });

  it("rejects scripting before loading input", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    try {
      await expect(
        open("https://example.test/", { scripting: "enabled" }),
      ).rejects.toThrow(TypeError);
      expect(fetchMock).not.toHaveBeenCalled();
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("rejects a non-empty extension list when scripting is disabled", async () => {
    const extension = vi.fn();

    await expect(
      open({ html: "<body></body>" }, { extensions: [extension] }),
    ).rejects.toThrow("Window extensions require scripting to be enabled");
    expect(extension).not.toHaveBeenCalled();
  });

  it("allows an empty extension list when scripting is disabled", async () => {
    const context = await open(
      { html: "<body><p>loaded</p></body>" },
      { extensions: [] },
    );

    expect(context.window.document.querySelector("p")?.textContent).toBe(
      "loaded",
    );
  });

  it("creates a child Window and document for a connected iframe", async () => {
    const context = await open({
      html: [
        '<iframe id="outer" ',
        "srcdoc=\"<iframe id='inner' srcdoc='<p>deep</p>'></iframe>\">",
        "</iframe>",
      ].join(""),
      baseURL: "https://example.test/path/page.html",
    });
    const outer = context.window.document.querySelector("#outer");

    expect(outer).toBeInstanceOf(HTMLIFrameElement);
    if (!(outer instanceof HTMLIFrameElement)) {
      throw new TypeError("Expected an iframe element");
    }
    expect(outer.contentWindow).not.toBeNull();
    expect(outer.contentDocument?.URL).toBe("about:srcdoc");
    expect(outer.contentDocument?.baseURI).toBe(
      "https://example.test/path/page.html",
    );
    expect(outer.contentWindow?.parent).toBe(context.window);
    expect(outer.contentWindow?.top).toBe(context.window);
    expect(outer.contentWindow?.frameElement).toBe(outer);

    const inner = outer.contentDocument?.querySelector("#inner");
    expect(inner).toBeInstanceOf(HTMLIFrameElement);
    if (!(inner instanceof HTMLIFrameElement)) {
      throw new TypeError("Expected a nested iframe element");
    }
    expect(inner.contentDocument?.body?.textContent).toBe("deep");
    expect(inner.contentWindow?.parent).toBe(outer.contentWindow);
    expect(inner.contentWindow?.top).toBe(context.window);
    expect(inner.contentWindow?.frameElement).toBe(inner);
  });

  it("loads an iframe src as a child document before open resolves", async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve(
        new Response("<main id=child>loaded</main>", {
          headers: { "content-type": "text/html; charset=utf-8" },
        }),
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    try {
      const context = await open({
        html: '<iframe src="child.html"></iframe>',
        baseURL: "https://example.test/path/page.html",
      });
      const iframe = context.window.document.querySelector("iframe");

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock).toHaveBeenCalledWith(
        "https://example.test/path/child.html",
      );
      expect(iframe).toBeInstanceOf(HTMLIFrameElement);
      expect(
        iframe instanceof HTMLIFrameElement
          ? iframe.contentDocument?.querySelector("#child")?.textContent
          : null,
      ).toBe("loaded");
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it.each([
    { contentType: "image/bmp", source: "bitmap", root: "html" },
    { contentType: "text/plain", source: "plain text", root: "html" },
    {
      contentType: "application/xml",
      source: "<root>xml</root>",
      root: "root",
    },
  ])(
    "uses the iframe response MIME type for $contentType documents",
    async ({ contentType, source, root }) => {
      const fetchMock = vi.fn(() =>
        Promise.resolve(
          new Response(source, {
            headers: { "content-type": `${contentType}; charset=utf-8` },
          }),
        ),
      );
      vi.stubGlobal("fetch", fetchMock);

      try {
        const context = await open({
          html: '<iframe src="child"></iframe>',
          baseURL: "https://example.test/parent",
        });
        const iframe = context.window.document.querySelector("iframe");
        if (!(iframe instanceof HTMLIFrameElement)) {
          throw new TypeError("Expected an iframe element");
        }

        expect(iframe.contentDocument?.contentType).toBe(contentType);
        expect(iframe.contentDocument?.documentElement?.localName).toBe(root);
        expect(iframe.contentDocument?.defaultView).toBe(iframe.contentWindow);
      } finally {
        vi.unstubAllGlobals();
      }
    },
  );

  it("navigates when srcdoc changes and detaches on removal", async () => {
    const context = await open({ html: "<main></main>" });
    const iframe = context.window.document.createElement("iframe");
    if (!(iframe instanceof HTMLIFrameElement)) {
      throw new TypeError("Expected an iframe element");
    }
    iframe.srcdoc = "<p>first</p>";
    const firstLoad = new Promise<void>((resolve) => {
      iframe.addEventListener(
        "load",
        () => {
          resolve();
        },
        { once: true },
      );
    });
    context.window.document.body?.append(iframe);
    await firstLoad;
    expect(iframe.contentDocument?.body?.textContent).toBe("first");

    const childDocument = iframe.contentDocument;
    const secondLoad = new Promise<void>((resolve) => {
      iframe.addEventListener(
        "load",
        () => {
          resolve();
        },
        { once: true },
      );
    });
    iframe.srcdoc = "<p>second</p>";
    await secondLoad;
    expect(iframe.contentDocument).toBe(childDocument);
    expect(iframe.contentDocument?.body?.textContent).toBe("second");

    iframe.remove();
    expect(iframe.contentWindow).toBeNull();
    expect(iframe.contentDocument).toBeNull();
    expect(childDocument?.defaultView).toBeNull();
  });

  it("prefers srcdoc and navigates src changes", async () => {
    const fetchMock = vi.fn((input: string | URL) =>
      Promise.resolve(
        new Response(`<p>${input.toString()}</p>`, {
          headers: { "content-type": "text/html" },
        }),
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    try {
      const context = await open({
        html: "<main></main>",
        baseURL: "https://example.test/path/page.html",
      });
      const iframe = context.window.document.createElement("iframe");
      if (!(iframe instanceof HTMLIFrameElement)) {
        throw new TypeError("Expected an iframe element");
      }
      iframe.src = "first.html";
      iframe.srcdoc = "<p>inline</p>";
      const inlineLoad = new Promise<void>((resolve) => {
        iframe.addEventListener(
          "load",
          () => {
            resolve();
          },
          { once: true },
        );
      });
      context.window.document.body?.append(iframe);
      await inlineLoad;
      expect(fetchMock).not.toHaveBeenCalled();
      expect(iframe.contentDocument?.body?.textContent).toBe("inline");

      const firstSourceLoad = new Promise<void>((resolve) => {
        iframe.addEventListener(
          "load",
          () => {
            resolve();
          },
          { once: true },
        );
      });
      iframe.removeAttribute("srcdoc");
      await firstSourceLoad;
      expect(iframe.contentDocument?.body?.textContent).toBe(
        "https://example.test/path/first.html",
      );

      const secondSourceLoad = new Promise<void>((resolve) => {
        iframe.addEventListener(
          "load",
          () => {
            resolve();
          },
          { once: true },
        );
      });
      iframe.src = "second.html";
      await secondSourceLoad;
      expect(iframe.contentDocument?.body?.textContent).toBe(
        "https://example.test/path/second.html",
      );

      const thirdSourceLoad = new Promise<void>((resolve) => {
        iframe.addEventListener(
          "load",
          () => {
            resolve();
          },
          { once: true },
        );
      });
      const sourceAttribute = iframe.getAttributeNode("src");
      if (sourceAttribute === null) {
        throw new TypeError("Expected a src attribute");
      }
      sourceAttribute.value = "third.html";
      await thirdSourceLoad;
      expect(iframe.contentDocument?.body?.textContent).toBe(
        "https://example.test/path/third.html",
      );
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("does not navigate an iframe to an ancestor document URL", async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve(
        new Response('<iframe src="page.html#child"></iframe>', {
          headers: { "content-type": "text/html" },
        }),
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    try {
      const context = await open("https://example.test/path/page.html#top");
      const iframe = context.window.document.querySelector("iframe");

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(iframe).toBeInstanceOf(HTMLIFrameElement);
      expect(
        iframe instanceof HTMLIFrameElement
          ? iframe.contentDocument?.URL
          : null,
      ).toBe("about:blank");
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("checks every ancestor document before iframe navigation", async () => {
    const fetchMock = vi.fn((input: string | URL) => {
      const url = input.toString();
      return Promise.resolve(
        new Response(
          url.endsWith("/a.html")
            ? '<iframe src="b.html"></iframe>'
            : '<iframe src="a.html#nested"></iframe>',
          { headers: { "content-type": "text/html" } },
        ),
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    try {
      const context = await open("https://example.test/path/a.html");
      const outer = context.window.document.querySelector("iframe");
      const inner =
        outer instanceof HTMLIFrameElement
          ? outer.contentDocument?.querySelector("iframe")
          : null;

      expect(fetchMock.mock.calls.map(([input]) => input.toString())).toEqual([
        "https://example.test/path/a.html",
        "https://example.test/path/b.html",
      ]);
      expect(inner).toBeInstanceOf(HTMLIFrameElement);
      expect(
        inner instanceof HTMLIFrameElement ? inner.contentDocument?.URL : null,
      ).toBe("about:blank");
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
