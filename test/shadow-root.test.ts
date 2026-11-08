import { describe, expect, it } from "vitest";

import { DOMParser, ShadowRoot } from "../packages/palim/src/index.js";

describe("ShadowRoot", () => {
  it("supports atomic moves within and across a shadow tree", () => {
    const document = new DOMParser().parseFromString("", "text/html");
    const host = document.createElement("div");
    const lightChild = document.createElement("p");
    document.body?.append(host);
    host.append(lightChild);
    const shadowRoot = host.attachShadow({ mode: "open" });
    const destination = document.createElement("section");
    const first = document.createElement("span");
    shadowRoot.append(destination, first);

    destination.moveBefore(lightChild, null);
    shadowRoot.moveBefore(first, destination);

    expect(shadowRoot).toBeInstanceOf(ShadowRoot);
    expect(shadowRoot.firstChild).toBe(first);
    expect(destination.firstChild).toBe(lightChild);
    expect(lightChild.getRootNode()).toBe(shadowRoot);
    expect(lightChild.getRootNode({ composed: true })).toBe(document);
    expect(lightChild.isConnected).toBe(true);
  });

  it("does not expose a closed shadow root through its host", () => {
    const document = new DOMParser().parseFromString("", "text/html");
    const host = document.createElement("div");
    const shadowRoot = host.attachShadow({ mode: "closed" });

    expect(shadowRoot.mode).toBe("closed");
    expect(shadowRoot.host).toBe(host);
    expect(host.shadowRoot).toBeNull();
  });
});
