import { open } from "palim";
import { describe, expect, it, vi } from "vitest";

import type {
  HostNetwork,
  HostNetworkRequest,
  HostNetworkResponse,
} from "../src/index.js";
import { xmlHttpRequestPolyfill } from "../src/xml-http-request.js";

class RecordingNetwork implements HostNetwork {
  requests: HostNetworkRequest[] = [];

  constructor(readonly response: HostNetworkResponse) {}

  request(request: HostNetworkRequest): Promise<HostNetworkResponse> {
    this.requests.push(request);
    return Promise.resolve(this.response);
  }
}

describe("xmlHttpRequestPolyfill", () => {
  it("does not add XMLHttpRequest without the extension", async () => {
    const { window } = await open(
      {
        html: `<body><script>
          document.body.dataset.type = typeof XMLHttpRequest;
        </script></body>`,
      },
      { scripting: "enabled" },
    );

    expect(window.document.body?.getAttribute("data-type")).toBe("undefined");
  });

  it("installs the XMLHttpRequest EventTarget prototype chain", async () => {
    const network = new RecordingNetwork(response("ok"));
    const { window } = await open(
      {
        html: `<body><script>
          const xhr = new XMLHttpRequest();
          document.body.dataset.shape = JSON.stringify({
            xhr: xhr instanceof XMLHttpRequest,
            xhrTarget: xhr instanceof XMLHttpRequestEventTarget,
            eventTarget: xhr instanceof EventTarget,
            initial: xhr.readyState,
            constants: [xhr.UNSENT, xhr.DONE, XMLHttpRequest.DONE]
          });
        </script></body>`,
      },
      { scripting: "enabled", extensions: [xmlHttpRequestPolyfill(network)] },
    );

    expect(
      JSON.parse(window.document.body?.getAttribute("data-shape") ?? "null"),
    ).toEqual({
      xhr: true,
      xhrTarget: true,
      eventTarget: true,
      initial: 0,
      constants: [0, 4, 4],
    });
  });

  it("throws a Window realm DOMException for an invalid URL", async () => {
    const network = new RecordingNetwork(response("ok"));
    const { window } = await open(
      {
        html: `<body><script>
          try {
            new XMLHttpRequest().open("GET", "https://[");
          } catch (error) {
            document.body.dataset.error = JSON.stringify({
              domException: error instanceof DOMException,
              name: error.name,
              code: error.code
            });
          }
        </script></body>`,
      },
      { scripting: "enabled", extensions: [xmlHttpRequestPolyfill(network)] },
    );

    expect(
      JSON.parse(window.document.body?.getAttribute("data-error") ?? "null"),
    ).toEqual({ domException: true, name: "SyntaxError", code: 12 });
  });

  it("sends through HostNetwork and dispatches lifecycle events", async () => {
    const network = new RecordingNetwork(response("response body"));
    const { window } = await open(
      {
        baseURL: "https://example.test/path/page.html",
        html: `<body><script>
          const xhr = new XMLHttpRequest();
          const events = [];
          xhr.addEventListener("readystatechange", event => {
            events.push(event.type + ":" + xhr.readyState);
          });
          xhr.onload = event => {
            events.push(event.type + ":" + xhr.status);
            document.body.dataset.result = JSON.stringify({
              events,
              responseText: xhr.responseText,
              responseURL: xhr.responseURL,
              header: xhr.getResponseHeader("X-Test")
            });
          };
          xhr.open("post", "../api");
          xhr.setRequestHeader("X-Request", "one");
          xhr.setRequestHeader("X-Request", "two");
          xhr.send("request body");
        </script></body>`,
      },
      { scripting: "enabled", extensions: [xmlHttpRequestPolyfill(network)] },
    );

    await vi.waitFor(() => {
      expect(window.document.body?.getAttribute("data-result")).not.toBeNull();
    });
    expect(network.requests).toHaveLength(1);
    expect({
      url: network.requests[0]?.url,
      method: network.requests[0]?.method,
      headers: network.requests[0]?.headers,
      body: new TextDecoder().decode(network.requests[0]?.body ?? undefined),
    }).toEqual({
      url: "https://example.test/api",
      method: "POST",
      headers: [["x-request", "one, two"]],
      body: "request body",
    });
    expect(
      JSON.parse(window.document.body?.getAttribute("data-result") ?? "null"),
    ).toEqual({
      events: [
        "readystatechange:1",
        "readystatechange:2",
        "readystatechange:3",
        "readystatechange:4",
        "load:200",
      ],
      responseText: "response body",
      responseURL: "https://example.test/api",
      header: "value",
    });
  });

  it("creates a scripting-disabled XML Document response", async () => {
    const network = new RecordingNetwork({
      ...response("<root><value>ok</value></root>"),
      url: "https://example.test/final.xml",
      headers: [["Content-Type", "text/plain"]],
    });
    const { window } = await open(
      {
        baseURL: "https://example.test/",
        html: `<body><script>
          const xhr = new XMLHttpRequest();
          xhr.responseType = "document";
          xhr.onload = () => {
            document.body.dataset.document = JSON.stringify({
              contentType: xhr.responseXML.contentType,
              url: xhr.responseXML.URL,
              defaultView: xhr.responseXML.defaultView,
              value: xhr.responseXML.documentElement.firstChild.textContent,
              sameResponse: xhr.response === xhr.responseXML
            });
          };
          xhr.open("GET", "/document.xml");
          xhr.overrideMimeType("application/xml;charset=UTF-8");
          xhr.send();
        </script></body>`,
      },
      { scripting: "enabled", extensions: [xmlHttpRequestPolyfill(network)] },
    );

    await vi.waitFor(() => {
      expect(
        window.document.body?.getAttribute("data-document"),
      ).not.toBeNull();
    });
    expect(
      JSON.parse(window.document.body?.getAttribute("data-document") ?? "null"),
    ).toEqual({
      contentType: "application/xml",
      url: "https://example.test/final.xml",
      defaultView: null,
      value: "ok",
      sameResponse: true,
    });
  });

  it("serializes a realm FormData body as multipart form data", async () => {
    const network = new RecordingNetwork(response("ok"));
    await open(
      {
        baseURL: "https://example.test/",
        html: `<body><script>
          const body = new FormData();
          body.append("first", "one");
          body.append("second", "two");
          const xhr = new XMLHttpRequest();
          xhr.open("POST", "/upload");
          xhr.send(body);
        </script></body>`,
      },
      { scripting: "enabled", extensions: [xmlHttpRequestPolyfill(network)] },
    );

    await vi.waitFor(() => {
      expect(network.requests).toHaveLength(1);
    });
    const request = network.requests[0];
    const contentType = request?.headers[0]?.[1] ?? "";
    expect(contentType).toMatch(/^multipart\/form-data; boundary=/);
    const boundary = contentType.slice(contentType.indexOf("boundary=") + 9);
    expect(new TextDecoder().decode(request?.body ?? undefined)).toBe(
      `--${boundary}\r\n` +
        'Content-Disposition: form-data; name="first"\r\n\r\n' +
        "one\r\n" +
        `--${boundary}\r\n` +
        'Content-Disposition: form-data; name="second"\r\n\r\n' +
        "two\r\n" +
        `--${boundary}--\r\n`,
    );
  });
});

function response(body: string): HostNetworkResponse {
  return {
    url: "https://example.test/api",
    status: 200,
    statusText: "OK",
    headers: [["X-Test", "value"]],
    body: new TextEncoder().encode(body),
  };
}
