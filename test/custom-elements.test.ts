import { describe, expect, it } from "vitest";

import {
  CustomElementRegistry,
  setDocumentCustomElementRegistry,
} from "../src/dom/custom-elements.js";
import { createCustomHTMLElementBase } from "../src/html-elements.js";
import { DOMParser } from "../src/index.js";

describe("custom element reactions", () => {
  it("uses disconnected and connected callbacks for an atomic move", () => {
    const document = new DOMParser().parseFromString("", "text/html");
    const registry = new CustomElementRegistry();
    const reactions: string[] = [];
    setDocumentCustomElementRegistry(document, registry);
    registry.define({
      name: "x-moving",
      construct: (ownerDocument, localName, prefix) =>
        createCustomHTMLElementBase(ownerDocument, localName, prefix),
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
      construct: (ownerDocument, localName, prefix) =>
        createCustomHTMLElementBase(ownerDocument, localName, prefix),
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
