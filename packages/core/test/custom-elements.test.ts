import { describe, expect, it } from "vitest";

import { callbackFailure, callbackSuccess } from "../src/callback-result.js";
import {
  CustomElementRegistry,
  customElementRegistryForNode,
  initializeCustomElementRegistry,
  setDocumentCustomElementRegistry,
} from "../src/dom/custom-elements.js";
import { createCustomHTMLElementBase } from "../src/html-elements.js";
import { DOMParser } from "./public-test-api.js";

describe("custom element reactions", () => {
  it("initializes only null registries in a light-tree subtree", () => {
    const document = new DOMParser().parseFromString("", "text/html");
    const root = document.createElement("div");
    const child = document.createElement("div");
    const shadowChild = document.createElement("i");
    root.append(child);
    child.attachShadow({ mode: "open" }).append(shadowChild);
    const registry = new CustomElementRegistry();

    initializeCustomElementRegistry(registry, root);

    expect(customElementRegistryForNode(root)).toBe(registry);
    expect(customElementRegistryForNode(child)).toBe(registry);
    const shadowRoot = child.shadowRoot;
    expect(shadowRoot).not.toBeNull();
    if (shadowRoot === null) {
      throw new TypeError("Expected an open shadow root");
    }
    expect(customElementRegistryForNode(shadowRoot)).toBe(registry);
    expect(customElementRegistryForNode(shadowChild)).toBe(registry);
  });

  it("does not replace an initialized registry", () => {
    const document = new DOMParser().parseFromString("", "text/html");
    const element = document.createElement("div");
    const first = new CustomElementRegistry();
    const second = new CustomElementRegistry();

    initializeCustomElementRegistry(first, element);
    initializeCustomElementRegistry(second, element);

    expect(customElementRegistryForNode(element)).toBe(first);
  });

  it("creates an uncustomized element after construction fails", () => {
    const document = new DOMParser().parseFromString("", "text/html");
    const registry = new CustomElementRegistry();
    const reactions: string[] = [];
    setDocumentCustomElementRegistry(document, registry);
    registry.define({
      name: "x-failed",
      localName: "x-failed",
      construct: () => callbackFailure(),
      connectedCallback: () => reactions.push("connected"),
      disconnectedCallback: null,
      connectedMoveCallback: null,
    });

    const element = document.createElement("x-failed");
    document.body?.append(element);

    expect(element.localName).toBe("x-failed");
    expect(reactions).toEqual([]);
  });

  it("uses disconnected and connected callbacks for an atomic move", () => {
    const document = new DOMParser().parseFromString("", "text/html");
    const registry = new CustomElementRegistry();
    const reactions: string[] = [];
    setDocumentCustomElementRegistry(document, registry);
    registry.define({
      name: "x-moving",
      localName: "x-moving",
      construct: (ownerDocument, localName, prefix) =>
        callbackSuccess(
          createCustomHTMLElementBase(ownerDocument, localName, prefix),
        ),
      connectedCallback: () => reactions.push("connected"),
      disconnectedCallback: () => reactions.push("disconnected"),
      connectedMoveCallback: null,
    });
    const element = document.createElement("x-moving");
    const destination = document.createElement("section");
    document.body?.append(element, destination);
    reactions.length = 0;

    destination.moveBefore(element, null);

    expect(reactions).toEqual(["disconnected", "connected"]);
    expect(element.isConnected).toBe(true);
  });

  it("uses connectedMoveCallback for custom elements in a shadow tree", () => {
    const document = new DOMParser().parseFromString("", "text/html");
    const registry = new CustomElementRegistry();
    const reactions: string[] = [];
    setDocumentCustomElementRegistry(document, registry);
    registry.define({
      name: "x-shadow-moving",
      localName: "x-shadow-moving",
      construct: (ownerDocument, localName, prefix) =>
        callbackSuccess(
          createCustomHTMLElementBase(ownerDocument, localName, prefix),
        ),
      connectedCallback: () => reactions.push("connected"),
      disconnectedCallback: () => reactions.push("disconnected"),
      connectedMoveCallback: () => reactions.push("connectedMove"),
    });
    const host = document.createElement("div");
    const destination = document.createElement("section");
    const element = document.createElement("x-shadow-moving");
    host.attachShadow({ mode: "open" }).append(element);
    document.body?.append(host, destination);
    reactions.length = 0;

    destination.moveBefore(host, null);

    expect(reactions).toEqual(["connectedMove"]);
  });
});
