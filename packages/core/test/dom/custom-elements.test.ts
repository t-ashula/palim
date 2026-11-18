import { describe, expect, it } from "vitest";

import { callbackFailure, callbackSuccess } from "../../src/callback-result.js";
import {
  CustomElementRegistry,
  customElementRegistryForNode,
  customElementRegistryStateForNode,
  initializeCustomElementRegistry,
  setDocumentCustomElementRegistry,
} from "../../src/dom/custom-elements.js";
import { createElementInterface } from "../../src/dom/nodes.js";
import { createCustomHTMLElementBase } from "../../src/html-elements.js";
import { parseHTML } from "../helper/dom.js";

describe("custom element reactions", () => {
  it("initializes only null registries in a light-tree subtree", () => {
    const document = parseHTML();
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
    const document = parseHTML();
    const element = document.createElement("div");
    const first = new CustomElementRegistry();
    const second = new CustomElementRegistry();

    initializeCustomElementRegistry(first, element);
    initializeCustomElementRegistry(second, element);

    expect(customElementRegistryForNode(element)).toBe(first);
  });

  it("uses the registry selected by element creation options", () => {
    const document = parseHTML();
    const globalRegistry = customElementRegistryForNode(document);
    const scopedRegistry = new CustomElementRegistry();
    scopedRegistry.define({
      name: "x-scoped",
      localName: "x-scoped",
      construct: (ownerDocument, localName, prefix) =>
        callbackSuccess(
          createCustomHTMLElementBase(ownerDocument, localName, prefix),
        ),
      connectedCallback: null,
      disconnectedCallback: null,
      connectedMoveCallback: null,
      observedAttributes: [],
      attributeChangedCallback: null,
    });

    const scoped = document.createElement("x-scoped", {
      customElementRegistry: scopedRegistry,
    });
    const candidate = document.createElement("x-pending", {
      customElementRegistry: scopedRegistry,
    });
    const withoutRegistry = document.createElement("x-scoped", {
      customElementRegistry: null,
    });
    const implicit = document.createElement("div");

    expect(scoped.localName).toBe("x-scoped");
    expect(customElementRegistryForNode(scoped)).toBe(scopedRegistry);
    expect(customElementRegistryForNode(candidate)).toBe(scopedRegistry);
    expect(customElementRegistryForNode(withoutRegistry)).toBeNull();
    expect(customElementRegistryForNode(implicit)).toBe(globalRegistry);
  });

  it("distinguishes inherited, null, global, and scoped registry state", () => {
    const document = parseHTML();
    setDocumentCustomElementRegistry(
      document,
      new CustomElementRegistry(false),
    );
    const globalRegistry = customElementRegistryForNode(document);
    const scopedRegistry = new CustomElementRegistry();
    const inherited = createElementInterface(document, "div");
    const withoutRegistry = document.createElement("div", {
      customElementRegistry: null,
    });
    const explicitGlobal = document.createElement("div", {
      customElementRegistry: globalRegistry,
    });
    const scoped = document.createElement("div", {
      customElementRegistry: scopedRegistry,
    });

    expect(customElementRegistryStateForNode(inherited)).toBeUndefined();
    expect(customElementRegistryStateForNode(withoutRegistry)).toBeNull();
    expect(customElementRegistryStateForNode(explicitGlobal)).toBe(
      globalRegistry,
    );
    expect(customElementRegistryStateForNode(scoped)).toBe(scopedRegistry);
  });

  it("updates global and null registries when adopting into another document", () => {
    const source = parseHTML();
    const target = parseHTML();
    const sourceGlobal = new CustomElementRegistry(false);
    const targetGlobal = new CustomElementRegistry(false);
    const scopedRegistry = new CustomElementRegistry();
    setDocumentCustomElementRegistry(source, sourceGlobal);
    setDocumentCustomElementRegistry(target, targetGlobal);
    const inherited = source.createElement("div");
    const explicitGlobal = source.createElement("div", {
      customElementRegistry: sourceGlobal,
    });
    const withoutRegistry = source.createElement("div", {
      customElementRegistry: null,
    });
    const scoped = source.createElement("div", {
      customElementRegistry: scopedRegistry,
    });

    target.adoptNode(inherited);
    target.adoptNode(explicitGlobal);
    target.adoptNode(withoutRegistry);
    target.adoptNode(scoped);

    expect(customElementRegistryForNode(inherited)).toBe(targetGlobal);
    expect(customElementRegistryForNode(explicitGlobal)).toBe(targetGlobal);
    expect(customElementRegistryForNode(withoutRegistry)).toBe(targetGlobal);
    expect(customElementRegistryForNode(scoped)).toBe(scopedRegistry);
  });

  it("uses the adopted parent's effective global registry for null descendants", () => {
    const source = parseHTML();
    const target = parseHTML();
    const sourceGlobal = new CustomElementRegistry(false);
    const targetGlobal = new CustomElementRegistry(false);
    const scopedRegistry = new CustomElementRegistry();
    setDocumentCustomElementRegistry(source, sourceGlobal);
    setDocumentCustomElementRegistry(target, targetGlobal);
    const globalParent = source.createElement("div", {
      customElementRegistry: sourceGlobal,
    });
    const globalChild = source.createElement("span", {
      customElementRegistry: null,
    });
    globalParent.append(globalChild);
    const scopedParent = source.createElement("div", {
      customElementRegistry: scopedRegistry,
    });
    const scopedChild = source.createElement("span", {
      customElementRegistry: null,
    });
    scopedParent.append(scopedChild);

    target.adoptNode(globalParent);
    target.adoptNode(scopedParent);

    expect(customElementRegistryForNode(globalParent)).toBe(targetGlobal);
    expect(customElementRegistryForNode(globalChild)).toBe(targetGlobal);
    expect(customElementRegistryForNode(scopedParent)).toBe(scopedRegistry);
    expect(customElementRegistryForNode(scopedChild)).toBeNull();
  });

  it("updates an imperative null shadow-root registry during adoption", () => {
    const source = parseHTML();
    const target = parseHTML();
    setDocumentCustomElementRegistry(source, new CustomElementRegistry(false));
    const targetGlobal = new CustomElementRegistry(false);
    setDocumentCustomElementRegistry(target, targetGlobal);
    const host = source.createElement("div");
    const shadowRoot = host.attachShadow({
      mode: "open",
      customElementRegistry: null,
    });
    const child = source.createElement("span", {
      customElementRegistry: null,
    });
    shadowRoot.append(child);

    target.adoptNode(host);

    expect(customElementRegistryForNode(shadowRoot)).toBe(targetGlobal);
    expect(customElementRegistryForNode(child)).toBe(targetGlobal);
  });

  it("preserves an inherited null shadow-root registry during adoption", () => {
    const source = parseHTML();
    const target = parseHTML();
    const targetRegistry = new CustomElementRegistry();
    setDocumentCustomElementRegistry(target, targetRegistry);
    const host = source.createElement("div");
    const shadowRoot = host.attachShadow({ mode: "closed" });

    target.adoptNode(host);

    expect(shadowRoot.ownerDocument).toBe(target);
    expect(customElementRegistryForNode(shadowRoot)).toBeNull();
  });

  it("uses null as the effective global registry of a scoped document", () => {
    const source = parseHTML();
    const target = parseHTML();
    setDocumentCustomElementRegistry(source, new CustomElementRegistry(false));
    setDocumentCustomElementRegistry(target, new CustomElementRegistry());
    const element = source.createElement("div");

    target.adoptNode(element);

    expect(customElementRegistryForNode(element)).toBeNull();
  });

  it("associates non-HTML elements with the selected registry", () => {
    const document = parseHTML();
    const registry = new CustomElementRegistry();

    const element = document.createElementNS("urn:test", "test", {
      customElementRegistry: registry,
    });

    expect(customElementRegistryForNode(element)).toBe(registry);
  });

  it("creates an uncustomized element after construction fails", () => {
    const document = parseHTML();
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
      observedAttributes: [],
      attributeChangedCallback: null,
    });

    const element = document.createElement("x-failed");
    document.body?.append(element);

    expect(element.localName).toBe("x-failed");
    expect(reactions).toEqual([]);
  });

  it("uses disconnected and connected callbacks for an atomic move", () => {
    const document = parseHTML();
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
      observedAttributes: [],
      attributeChangedCallback: null,
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
    const document = parseHTML();
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
      observedAttributes: [],
      attributeChangedCallback: null,
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

  it("passes attribute changes for observed attributes to the definition", () => {
    const document = parseHTML();
    const registry = new CustomElementRegistry();
    const reactions: (readonly unknown[])[] = [];
    setDocumentCustomElementRegistry(document, registry);
    registry.define({
      name: "x-observed",
      localName: "x-observed",
      construct: (ownerDocument, localName, prefix) =>
        callbackSuccess(
          createCustomHTMLElementBase(ownerDocument, localName, prefix),
        ),
      connectedCallback: null,
      disconnectedCallback: null,
      connectedMoveCallback: null,
      observedAttributes: ["data-value", "local"],
      attributeChangedCallback: (...argumentsList) => {
        reactions.push(argumentsList);
      },
    });
    const element = document.createElement("x-observed");

    element.setAttribute("data-value", "first");
    element.setAttribute("data-value", "second");
    element.setAttributeNS("urn:test", "prefix:local", "namespaced");
    element.removeAttribute("data-value");
    element.setAttribute("ignored", "value");

    expect(reactions).toEqual([
      [element, "data-value", null, "first", null],
      [element, "data-value", "first", "second", null],
      [element, "local", null, "namespaced", "urn:test"],
      [element, "data-value", "second", null, null],
    ]);
  });
});
