import { describe, expect, it, vi } from "vitest";

import { open } from "@palim/window";

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
});
