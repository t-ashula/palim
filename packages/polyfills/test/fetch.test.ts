import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchPolyfill } from "@palim/polyfills/fetch";
import { HTMLIFrameElement, open } from "palim";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchPolyfill", () => {
  it("does not add globals when the extension is absent", async () => {
    const { window } = await open(
      {
        html: `<body><script>
          document.body.dataset.globals = [
            typeof fetch,
            typeof Headers,
            typeof Request,
            typeof Response
          ].join(",");
        </script></body>`,
      },
      { scripting: "enabled" },
    );

    expect(window.document.body?.getAttribute("data-globals")).toBe(
      "undefined,undefined,undefined,undefined",
    );
  });

  it("installs all related globals before the first inline script", async () => {
    const { window } = await open(
      {
        html: `<body><script>
          document.body.dataset.globals = [
            typeof fetch,
            typeof Headers,
            typeof Request,
            typeof Response
          ].join(",");
        </script></body>`,
      },
      { scripting: "enabled", extensions: [fetchPolyfill()] },
    );

    expect(window.document.body?.getAttribute("data-globals")).toBe(
      "function,function,function,function",
    );
  });

  it("implements the checked-out Headers basic cases", async () => {
    const { window } = await open(
      {
        html: `<body><script>
          const input = {
            name1: "value1",
            Name2: "value2",
            name3: null,
            name4: undefined,
            name5: 1,
            "Content-Type": "value4"
          };
          const headers = new Headers(input);
          headers.append("name1", "value5");
          const copy = new Headers(headers);
          document.body.dataset.values = JSON.stringify(Array.from(copy));
          document.body.dataset.lookup = JSON.stringify([
            copy.get("NAME1"),
            copy.get("name3"),
            copy.get("name4"),
            copy.get("missing")
          ]);
          copy.delete("name2");
          document.body.dataset.has = String(copy.has("name2"));
          let callback = "";
          copy.forEach((value, name, owner) => {
            if (owner !== copy) throw new Error("wrong Headers owner");
            callback += name + ":" + value + ";";
          });
          document.body.dataset.callback = callback;
        </script></body>`,
      },
      { scripting: "enabled", extensions: [fetchPolyfill()] },
    );

    expect(window.document.body?.getAttribute("data-values")).toBe(
      JSON.stringify([
        ["content-type", "value4"],
        ["name1", "value1, value5"],
        ["name2", "value2"],
        ["name3", "null"],
        ["name4", "undefined"],
        ["name5", "1"],
      ]),
    );
    expect(
      JSON.parse(window.document.body?.getAttribute("data-lookup") ?? "null"),
    ).toEqual(["value1, value5", "null", "undefined", null]);
    expect(window.document.body?.getAttribute("data-has")).toBe("false");
    expect(window.document.body?.getAttribute("data-callback")).toContain(
      "content-type:value4;",
    );
  });

  it("implements the checked-out Request and Response simple cases", async () => {
    const { window } = await open(
      {
        baseURL: "https://example.test/path/page.html",
        html: `<body><script>
          const request = new Request("../api", {
            method: "poSt",
            headers: { "X-Test": "request" },
            body: "payload",
            credentials: "include"
          });
          const response = new Response("hello", {
            status: 201,
            statusText: "Created",
            headers: { "X-Test": "response" }
          });
          document.body.dataset.request = JSON.stringify({
            url: request.url,
            method: request.method,
            header: request.headers.get("x-test"),
            credentials: request.credentials,
            promise: request.text() instanceof Promise
          });
          document.body.dataset.response = JSON.stringify({
            type: response.type,
            url: response.url,
            status: response.status,
            statusText: response.statusText,
            ok: response.ok,
            sameHeaders: response.headers === response.headers,
            header: response.headers.get("x-test"),
            promise: response.text() instanceof Promise
          });
        </script></body>`,
      },
      { scripting: "enabled", extensions: [fetchPolyfill()] },
    );

    expect(
      JSON.parse(window.document.body?.getAttribute("data-request") ?? "null"),
    ).toEqual({
      url: "https://example.test/api",
      method: "POST",
      header: "request",
      credentials: "include",
      promise: true,
    });
    expect(
      JSON.parse(window.document.body?.getAttribute("data-response") ?? "null"),
    ).toEqual({
      type: "default",
      url: "",
      status: 201,
      statusText: "Created",
      ok: true,
      sameHeaders: true,
      header: "response",
      promise: true,
    });
  });

  it("parses URL-encoded Request and Response bodies as realm FormData", async () => {
    const { window } = await open(
      {
        baseURL: "https://example.test/",
        html: `<body><script>
          window.onerror = (message, source, line, column, error) => {
            document.body.dataset.error = error && error.message || message;
          };
          const body = "%EF%BB%BFtest=%EF%BB%BF&bad=%C2x&raw=†&empty&plus=a+b";
          const headers = {
            "Content-Type": "application/x-www-form-urlencoded;charset=shift_jis"
          };
          const request = new Request("/submit", {
            method: "POST",
            headers,
            body
          });
          const response = new Response(body, { headers });
          const RealmFormData = FormData;
          window.FormData = class FormDataReplacement {
            constructor() {
              throw new Error("replaced FormData constructor was called");
            }
          };
          window.URLSearchParams = class URLSearchParamsReplacement {
            constructor() {
              throw new Error("replaced URLSearchParams constructor was called");
            }
          };
          const requestResult = request.formData();
          const responseResult = response.formData();
          document.body.dataset.promises = String(
            requestResult instanceof Promise && responseResult instanceof Promise
          );
          const values = [];
          const record = formData => {
            values.push({
              identity: formData instanceof RealmFormData,
              entries: Array.from(formData)
            });
            if (values.length === 2) {
              document.body.dataset.entries = JSON.stringify(values);
            }
          };
          requestResult.then(formData => {
            record(formData);
            document.body.dataset.used = String(
              request.bodyUsed && response.bodyUsed
            );
          }, error => {
            document.body.dataset.error = error && error.message;
          });
          responseResult.then(record, error => {
            document.body.dataset.error = error && error.message;
          });
        </script></body>`,
      },
      { scripting: "enabled", extensions: [fetchPolyfill()] },
    );

    expect({
      promises: window.document.body?.getAttribute("data-promises"),
      error: window.document.body?.getAttribute("data-error"),
    }).toEqual({ promises: "true", error: null });
    await vi.waitFor(() => {
      expect(
        window.document.body?.getAttribute("data-entries") ??
          window.document.body?.getAttribute("data-error"),
      ).not.toBeNull();
    });
    expect(window.document.body?.getAttribute("data-used")).toBe("true");
    expect(window.document.body?.getAttribute("data-error")).toBeNull();
    expect(
      JSON.parse(window.document.body?.getAttribute("data-entries") ?? "null"),
    ).toEqual([
      {
        identity: true,
        entries: [
          ["\ufefftest", "\ufeff"],
          ["bad", "\ufffdx"],
          ["raw", "†"],
          ["empty", ""],
          ["plus", "a b"],
        ],
      },
      {
        identity: true,
        entries: [
          ["\ufefftest", "\ufeff"],
          ["bad", "\ufffdx"],
          ["raw", "†"],
          ["empty", ""],
          ["plus", "a b"],
        ],
      },
    ]);
  });

  it("uses neutral request and response data while returning realm values", async () => {
    const fetchMock = vi.fn(
      (input: string, init: RequestInit): Promise<Response> => {
        expect(input).toBe("https://example.test/api/items");
        expect(init.method).toBe("POST");
        expect(Array.from(init.headers as Iterable<[string, string]>)).toEqual([
          ["content-type", "text/plain;charset=UTF-8"],
          ["x-test", "request"],
        ]);
        expect(new TextDecoder().decode(init.body as Uint8Array)).toBe(
          "payload",
        );
        const response = new Response('{"result":"ok"}', {
          status: 202,
          statusText: "Accepted",
          headers: {
            "content-type": "application/json",
            "x-test": "response",
          },
        });
        Object.defineProperty(response, "url", { value: input });
        return Promise.resolve(response);
      },
    );
    vi.stubGlobal("fetch", fetchMock);

    const { window } = await open(
      {
        baseURL: "https://example.test/page.html",
        html: `<body><script>
          const result = fetch("/api/items", {
            method: "POST",
            headers: { "X-Test": "request" },
            body: "payload"
          });
          document.body.dataset.promise = String(result instanceof Promise);
          result.then(async response => {
            document.body.dataset.response = String(response instanceof Response);
            document.body.dataset.headers = String(response.headers instanceof Headers);
            document.body.dataset.status = String(response.status);
            document.body.dataset.url = response.url;
            document.body.dataset.body = JSON.stringify(await response.json());
          }).catch(error => {
            document.body.dataset.error = error && error.message;
          });
        </script></body>`,
      },
      { scripting: "enabled", extensions: [fetchPolyfill()] },
    );

    await vi.waitFor(() => {
      expect(window.document.body?.getAttribute("data-body")).toBe(
        '{"result":"ok"}',
      );
    });
    expect(window.document.body?.getAttribute("data-promise")).toBe("true");
    expect(window.document.body?.getAttribute("data-response")).toBe("true");
    expect(window.document.body?.getAttribute("data-headers")).toBe("true");
    expect(window.document.body?.getAttribute("data-status")).toBe("202");
    expect(window.document.body?.getAttribute("data-url")).toBe(
      "https://example.test/api/items",
    );
    expect(window.document.body?.getAttribute("data-error")).toBeNull();
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("creates separate globals for parent and child Window realms", async () => {
    const { window } = await open(
      {
        html: `<body>
          <iframe srcdoc="<body></body>"></iframe>
          <script>
            const child = document.querySelector("iframe").contentWindow;
            document.body.dataset.separate = String(
              child.Headers !== Headers &&
              child.Request !== Request &&
              child.Response !== Response &&
              child.fetch !== fetch
            );
          </script>
        </body>`,
      },
      { scripting: "enabled", extensions: [fetchPolyfill()] },
    );

    const iframe = window.document.querySelector("iframe");
    expect(iframe).toBeInstanceOf(HTMLIFrameElement);
    expect(window.document.body?.getAttribute("data-separate")).toBe("true");
  });
});
