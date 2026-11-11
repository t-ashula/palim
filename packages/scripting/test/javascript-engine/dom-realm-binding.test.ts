import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { DOMParser } from "@palim/core";
import { Event } from "@palim/core/internal/dom/events.js";
import type { Document } from "@palim/core/internal/public-dom-interfaces.js";
import * as HTML from "@palim/core/internal/html-elements.js";
import type {
  EngineRealm,
  EngineValue,
  JavaScriptEngineAdapter,
} from "@palim/scripting/internal/javascript-engine/adapter.js";
import { DOMRealmBinding } from "@palim/scripting/internal/javascript-engine/dom-realm-binding.js";
import { htmlElementInterfaceConstructors } from "@palim/scripting/internal/javascript-engine/html-element-interface-constructors.js";
import { Engine262Adapter } from "@palim/engine262";

interface TestRealm {
  readonly binding: DOMRealmBinding;
  readonly document: Document;
  readonly engine: JavaScriptEngineAdapter;
  readonly realm: EngineRealm;
}

const fixtureDirectory = resolve(
  import.meta.dirname,
  "../fixtures/dom-realm-binding",
);

function fixture(file: string): string {
  return readFileSync(resolve(fixtureDirectory, file), "utf8");
}

function createTestRealm(
  input: string,
  reportException: (value: EngineValue) => void = () => undefined,
): TestRealm {
  const document = new DOMParser().parseFromString(input, "text/html");
  const engine = new Engine262Adapter();
  const realm = engine.createRealm();
  const binding = new DOMRealmBinding(
    engine,
    realm,
    document,
    undefined,
    reportException,
  );
  binding.expose("testDocument", document);
  return { binding, document, engine, realm };
}

function evaluate(
  engine: JavaScriptEngineAdapter,
  realm: EngineRealm,
  source: string,
): void {
  const result = engine.evaluate(realm, source);
  if (result.type === "throw") {
    throw new Error(engine.exceptionMessage(realm, result.value));
  }
}

function copyRealmGlobal(
  engine: JavaScriptEngineAdapter,
  sourceRealm: EngineRealm,
  targetRealm: EngineRealm,
  sourceName: string,
  targetName: string,
): void {
  const value = engine.get(
    sourceRealm,
    engine.globalObject(sourceRealm),
    sourceName,
  );
  if (value.type === "throw") {
    throw new Error(engine.exceptionMessage(sourceRealm, value.value));
  }
  engine.initializeDataProperty(
    engine.globalObject(targetRealm),
    targetName,
    value.value,
    { configurable: true, enumerable: true, writable: true },
  );
}

function isConcreteHTMLElementInterface(
  value: unknown,
): value is typeof HTML.HTMLElement {
  if (typeof value !== "function") {
    return false;
  }
  const candidate = value as {
    readonly name?: unknown;
    readonly prototype?: unknown;
  };
  return (
    typeof candidate.name === "string" &&
    /^HTML.*Element$/u.test(candidate.name) &&
    candidate.prototype instanceof HTML.HTMLElement
  );
}

describe("DOMRealmBinding", () => {
  it("shares a document custom element registry across realms", () => {
    const document = new DOMParser().parseFromString(
      "<body></body>",
      "text/html",
    );
    const engine = new Engine262Adapter();
    const firstRealm = engine.createRealm();
    const firstBinding = new DOMRealmBinding(engine, firstRealm, document);
    firstBinding.expose("testDocument", document);

    evaluate(
      engine,
      firstRealm,
      `
        customElements.define("x-shared", class extends HTMLElement {
          constructor() {
            super();
            this.setAttribute("constructed", "yes");
          }

          connectedCallback() {
            this.setAttribute("connected-in-first-realm", "yes");
          }
        });
      `,
    );

    const secondRealm = engine.createRealm();
    const secondBinding = new DOMRealmBinding(engine, secondRealm, document);
    secondBinding.expose("testDocument", document);
    evaluate(
      engine,
      secondRealm,
      `testDocument.body.append(testDocument.createElement("x-shared"));`,
    );

    expect(
      document.querySelector("x-shared")?.getAttribute("constructed"),
    ).toBe("yes");
    expect(
      document
        .querySelector("x-shared")
        ?.getAttribute("connected-in-first-realm"),
    ).toBe("yes");
  });

  it("connects custom element reactions", () => {
    const { engine, realm } = createTestRealm("<section></section>");

    evaluate(engine, realm, fixture("connects-custom-element-reactions.js"));
  });

  it("preserves exceptions raised while reading custom element callbacks", () => {
    const { engine, realm } = createTestRealm("");

    evaluate(
      engine,
      realm,
      `
        const failure = {};
        class FailingElement extends HTMLElement {}
        Object.defineProperty(FailingElement.prototype, "connectedCallback", {
          get() { throw failure; },
        });
        let caught;
        try {
          customElements.define("x-failing-callback", FailingElement);
        } catch (error) {
          caught = error;
        }
        if (caught !== failure) {
          throw new Error("custom element callback exception identity changed");
        }
      `,
    );
  });

  it("converts custom element registry failures to realm DOMExceptions", () => {
    const { engine, realm } = createTestRealm("");

    evaluate(
      engine,
      realm,
      `
        class RegisteredElement extends HTMLElement {}
        let invalidNameError;
        try {
          customElements.define("invalid", RegisteredElement);
        } catch (error) {
          invalidNameError = error;
        }
        if (
          !(invalidNameError instanceof DOMException) ||
          invalidNameError.name !== "SyntaxError"
        ) {
          throw new Error("invalid custom element name was not a SyntaxError");
        }

        customElements.define("x-registered", RegisteredElement);
        let duplicateNameError;
        try {
          customElements.define("x-registered", RegisteredElement);
        } catch (error) {
          duplicateNameError = error;
        }
        if (
          !(duplicateNameError instanceof DOMException) ||
          duplicateNameError.name !== "NotSupportedError"
        ) {
          throw new Error("duplicate custom element name was not supported");
        }
      `,
    );
  });

  it("reports event listener exceptions and continues dispatch", () => {
    const reported: EngineValue[] = [];
    const { document, engine, realm } = createTestRealm(
      "<main></main>",
      (value) => reported.push(value),
    );

    evaluate(
      engine,
      realm,
      `
        globalThis.listenerFailure = {};
        testDocument.addEventListener("failure", () => {
          throw listenerFailure;
        });
        testDocument.addEventListener("failure", () => {
          testDocument.body.setAttribute("data-after-listener", "yes");
        });
        testDocument.dispatchEvent(new Event("failure"));
      `,
    );
    const failure = engine.get(
      realm,
      engine.globalObject(realm),
      "listenerFailure",
    );

    expect(failure.type).toBe("normal");
    expect(reported).toHaveLength(1);
    if (failure.type === "normal") {
      expect(reported[0]).toBe(failure.value);
    }
    expect(document.body?.getAttribute("data-after-listener")).toBe("yes");
  });

  it("constructs PromiseRejectionEvent with Promise and reason identity", () => {
    const { engine, realm } = createTestRealm("");

    evaluate(
      engine,
      realm,
      `
        const promise = Promise.resolve("value");
        const reason = {};
        const event = new PromiseRejectionEvent("unhandledrejection", {
          cancelable: true,
          promise,
          reason,
        });
        if (
          !(event instanceof PromiseRejectionEvent) ||
          !(event instanceof Event) ||
          event.type !== "unhandledrejection" ||
          event.cancelable !== true ||
          event.promise !== promise ||
          event.reason !== reason
        ) {
          throw new Error("PromiseRejectionEvent identity changed");
        }
        for (const init of [undefined, {}, { promise: {} }]) {
          let caught;
          try {
            new PromiseRejectionEvent("invalid", init);
          } catch (error) {
            caught = error;
          }
          if (!(caught instanceof TypeError)) {
            throw new Error("invalid PromiseRejectionEvent init was accepted");
          }
        }
      `,
    );
  });

  it("supports EventListener objects and reads handleEvent when invoked", () => {
    const reported: EngineValue[] = [];
    const { engine, realm } = createTestRealm("", (value) => {
      reported.push(value);
    });

    evaluate(
      engine,
      realm,
      `
        globalThis.handleEventFailure = {};
        let getterCalls = 0;
        let objectCalls = 0;
        let laterCalls = 0;
        const listener = {
          get handleEvent() {
            getterCalls += 1;
            if (getterCalls === 1) throw handleEventFailure;
            return function (event) {
              if (this !== listener || event.type !== "object-listener") {
                throw new Error("EventListener object invocation is invalid");
              }
              objectCalls += 1;
            };
          },
        };
        testDocument.addEventListener("object-listener", listener);
        testDocument.addEventListener("object-listener", listener);
        testDocument.addEventListener("object-listener", () => {
          laterCalls += 1;
        });
        testDocument.dispatchEvent(new Event("object-listener"));
        testDocument.dispatchEvent(new Event("object-listener"));
        testDocument.removeEventListener("object-listener", listener);
        testDocument.dispatchEvent(new Event("object-listener"));
        if (
          getterCalls !== 2 ||
          objectCalls !== 1 ||
          laterCalls !== 3
        ) {
          throw new Error("EventListener object identity is invalid");
        }
      `,
    );
    const failure = engine.get(
      realm,
      engine.globalObject(realm),
      "handleEventFailure",
    );

    expect(failure.type).toBe("normal");
    expect(reported).toHaveLength(1);
    if (failure.type === "normal") {
      expect(reported[0]).toBe(failure.value);
    }
  });

  it("reports page listener exceptions during host dispatch", () => {
    const reported: EngineValue[] = [];
    const { document, engine, realm } = createTestRealm("", (value) => {
      reported.push(value);
    });

    evaluate(
      engine,
      realm,
      `
        globalThis.hostDispatchFailure = {};
        testDocument.addEventListener("host-dispatch", () => {
          throw hostDispatchFailure;
        });
        testDocument.addEventListener("host-dispatch", () => {
          testDocument.body.setAttribute("data-host-dispatch", "continued");
        });
      `,
    );
    document.dispatchEvent(new Event("host-dispatch"));
    const failure = engine.get(
      realm,
      engine.globalObject(realm),
      "hostDispatchFailure",
    );

    expect(failure.type).toBe("normal");
    expect(reported).toHaveLength(1);
    if (failure.type === "normal") {
      expect(reported[0]).toBe(failure.value);
    }
    expect(document.body?.getAttribute("data-host-dispatch")).toBe("continued");
  });

  it("separates custom element construction and reaction failures", () => {
    const reported: EngineValue[] = [];
    const { document, engine, realm } = createTestRealm("", (value) => {
      reported.push(value);
    });

    evaluate(
      engine,
      realm,
      `
        globalThis.constructorFailure = {};
        globalThis.reactionFailure = {};
        let failedElementReactions = 0;
        class FailingElement extends HTMLElement {
          constructor() {
            super();
            throw constructorFailure;
          }

          connectedCallback() {
            failedElementReactions += 1;
          }
        }
        customElements.define("x-construction-failure", FailingElement);
        const failed = testDocument.createElement("x-construction-failure");
        if (failed instanceof FailingElement) {
          throw new Error("failed constructor retained its custom prototype");
        }
        testDocument.body.append(failed);
        if (failedElementReactions !== 0) {
          throw new Error("failed custom element ran a reaction");
        }

        class FailingReactionElement extends HTMLElement {
          connectedCallback() {
            throw reactionFailure;
          }
        }
        customElements.define("x-reaction-failure", FailingReactionElement);
        testDocument.body.append(
          testDocument.createElement("x-reaction-failure"),
        );
        testDocument.body.setAttribute("data-after-reaction", "continued");
      `,
    );
    const constructorFailure = engine.get(
      realm,
      engine.globalObject(realm),
      "constructorFailure",
    );
    const reactionFailure = engine.get(
      realm,
      engine.globalObject(realm),
      "reactionFailure",
    );

    expect(constructorFailure.type).toBe("normal");
    expect(reactionFailure.type).toBe("normal");
    expect(reported).toHaveLength(2);
    if (constructorFailure.type === "normal") {
      expect(reported[0]).toBe(constructorFailure.value);
    }
    if (reactionFailure.type === "normal") {
      expect(reported[1]).toBe(reactionFailure.value);
    }
    expect(document.body?.getAttribute("data-after-reaction")).toBe(
      "continued",
    );
  });

  it("connects slot assignment", () => {
    const { engine, realm } = createTestRealm("<div></div><p></p>");

    evaluate(engine, realm, fixture("connects-slot-assignment.js"));
  });

  it("connects ShadowRoot tree operations", () => {
    const { engine, realm } = createTestRealm("<div><p></p></div>");

    evaluate(engine, realm, fixture("connects-shadow-root.js"));
  });

  it("connects MutationObserver to domain tree mutations", () => {
    const { engine, realm } = createTestRealm(`
      <div><section><span></span></section><main></main></div>
    `);

    evaluate(engine, realm, fixture("connects-mutation-observer.js"));
  });

  it("converts invalid MutationObserver options to a realm TypeError", () => {
    const { engine, realm } = createTestRealm("");

    evaluate(
      engine,
      realm,
      `
        const observer = new MutationObserver(() => {});
        let caught;
        try {
          observer.observe(testDocument.body, {});
        } catch (error) {
          caught = error;
        }
        if (!(caught instanceof TypeError)) {
          throw new Error("invalid observer options were not a TypeError");
        }
      `,
    );
  });

  it("reports MutationObserver exceptions and continues notification", async () => {
    const reported: EngineValue[] = [];
    const { document, engine, realm } = createTestRealm("", (value) => {
      reported.push(value);
    });

    evaluate(
      engine,
      realm,
      `
        globalThis.observerFailure = {};
        const first = new MutationObserver(() => {
          throw observerFailure;
        });
        const second = new MutationObserver(() => {
          testDocument.body.setAttribute("data-observer", "continued");
        });
        first.observe(testDocument.body, { childList: true });
        second.observe(testDocument.body, { childList: true });
        testDocument.body.append(testDocument.createElement("p"));
      `,
    );
    await Promise.resolve();
    const failure = engine.get(
      realm,
      engine.globalObject(realm),
      "observerFailure",
    );

    expect(failure.type).toBe("normal");
    expect(reported).toHaveLength(1);
    if (failure.type === "normal") {
      expect(reported[0]).toBe(failure.value);
    }
    expect(document.body?.getAttribute("data-observer")).toBe("continued");
  });

  it("updates a button form owner after an atomic move", () => {
    const { engine, realm } = createTestRealm(`
      <form id="form1"></form>
      <button form="form1"></button>
    `);

    evaluate(
      engine,
      realm,
      fixture("updates-button-form-owner-after-atomic-move.js"),
    );
  });

  it("exposes live HTML table collections", () => {
    const { engine, realm } = createTestRealm(`
      <div><a class="text"></a></div>
      <b class="text"></b>
      <table>
        <caption class="text"></caption>
        <tbody><tr><td class="text"></td></tr></tbody>
      </table>
    `);

    evaluate(engine, realm, fixture("exposes-live-html-table-collections.js"));
  });

  it("connects HTMLTableElement.deleteRow to the domain implementation", () => {
    const { engine, realm } = createTestRealm(`
      <table>
        <thead><tr><td>head</td></tr></thead>
        <tbody><tr><td class="text1">body</td></tr></tbody>
      </table>
    `);

    evaluate(engine, realm, fixture("supports-html-table-delete-row.js"));
  });

  it("exposes live Document named properties", () => {
    const { engine, realm } = createTestRealm("");

    evaluate(engine, realm, fixture("exposes-document-named-properties.js"));
  });

  it("connects the Document body setter", () => {
    const { engine, realm } = createTestRealm("<main></main>");

    evaluate(engine, realm, fixture("connects-document-body-setter.js"));
  });

  it("exposes the legacy SVG document rootElement", () => {
    const { engine, realm } = createTestRealm("");

    evaluate(engine, realm, fixture("exposes-document-root-element.js"));
  });

  it("exposes live document element collections", () => {
    const { engine, realm } = createTestRealm(`
      <form id="form"></form><img><a href=""></a><script></script><embed>
    `);

    evaluate(engine, realm, fixture("exposes-document-collections.js"));
  });

  it("exposes every HTML element interface in the engine realm", () => {
    const concreteInterfaces = Object.values(HTML).filter(
      isConcreteHTMLElementInterface,
    );
    expect(new Set(htmlElementInterfaceConstructors)).toEqual(
      new Set(concreteInterfaces),
    );

    const { engine, realm } = createTestRealm("");

    evaluate(engine, realm, fixture("exposes-all-html-element-interfaces.js"));
  });

  it("exposes HTMLDocument as the Document constructor alias", () => {
    const { engine, realm } = createTestRealm("");

    evaluate(engine, realm, fixture("exposes-html-document-alias.js"));
  });

  it("converts DOM operation failures into realm DOMExceptions", () => {
    const { engine, realm } = createTestRealm('<main id="target"></main>');

    evaluate(
      engine,
      realm,
      fixture("converts-dom-operation-failures-into-realm-domexceptions.js"),
    );
  });

  it("exposes DOM platform objects with realm interface identity", () => {
    const { document, engine, realm } = createTestRealm(
      '<main id="target"></main>',
    );

    evaluate(
      engine,
      realm,
      fixture("exposes-dom-platform-objects-with-realm-interface-identity.js"),
    );

    const target = document.getElementById("target");
    expect(target?.getAttribute("data-runtime")).toBe("palim");
    expect(target?.querySelector("span")?.textContent).toBe("connected");
  });

  it("defines interface members and conversions in the engine realm", () => {
    const { document, engine, realm } = createTestRealm(
      '<main id="target"></main>',
    );

    evaluate(
      engine,
      realm,
      fixture(
        "defines-interface-members-and-conversions-in-the-engine-realm.js",
      ),
    );

    expect(document.getElementById("target")?.getAttribute("data-number")).toBe(
      "12",
    );
  });

  it("binds CharacterData operations in the engine realm", () => {
    const { engine, realm } = createTestRealm("");

    evaluate(
      engine,
      realm,
      fixture("binds-characterdata-operations-in-the-engine-realm.js"),
    );
  });

  it("binds Node relationship and cloning methods in the engine realm", () => {
    const { engine, realm } = createTestRealm(
      "<main><span>one</span><span>two</span></main>",
    );

    evaluate(
      engine,
      realm,
      fixture(
        "binds-node-relationship-and-cloning-methods-in-the-engine-realm.js",
      ),
    );
  });

  it("binds implemented Node attributes in the engine realm", () => {
    const { engine, realm } = createTestRealm(
      "<main><span></span><b></b></main>",
    );

    evaluate(
      engine,
      realm,
      fixture("binds-implemented-node-attributes-in-the-engine-realm.js"),
    );
  });

  it("exposes the Readability DOM APIs in the engine realm", () => {
    const { document, engine, realm } = createTestRealm(
      '<title>Initial title</title><main data-value="old"></main>text<aside data-value="new"></aside>',
    );

    evaluate(
      engine,
      realm,
      fixture("exposes-the-readability-dom-apis-in-the-engine-realm.js"),
    );

    expect(document.title).toBe("Updated title");
    expect(document.querySelector("main")?.getAttribute("style")).toBe("");
  });

  it("reflects HTMLElement.title in the engine realm", () => {
    const { document, engine, realm } = createTestRealm(
      '<main title="before"></main><aside></aside>',
    );

    evaluate(
      engine,
      realm,
      fixture("reflects-html-element-title-in-the-engine-realm.js"),
    );

    expect(document.querySelector("main")?.getAttribute("title")).toBe("7");
  });

  it("connects global attribute reflection in the engine realm", () => {
    const { document, engine, realm } = createTestRealm(
      '<html dir="LTR"><body><main lang="en" hidden="UNTIL-FOUND"></main><a href="/"></a><span spellcheck="FaLsE"></span></body></html>',
    );

    evaluate(engine, realm, fixture("connects-global-attribute-reflection.js"));

    const main = document.querySelector("main");
    expect(main?.getAttribute("lang")).toBe("ja");
    expect(main?.getAttribute("translate")).toBe("no");
    expect(main?.getAttribute("hidden")).toBeNull();
  });

  it("binds HTMLElement.innerText in the engine realm", () => {
    const { document, engine, realm } = createTestRealm(
      '<main id="target">before <span>child</span></main>',
    );

    evaluate(
      engine,
      realm,
      fixture("binds-html-element-innertext-in-the-engine-realm.js"),
    );

    expect(document.getElementById("target")?.textContent).toBe("after");
  });

  it("exposes markup getters and setters in the engine realm", () => {
    const { document, engine, realm } = createTestRealm(
      '<main><p id="first">old</p><p id="second">old</p></main>',
    );

    evaluate(
      engine,
      realm,
      fixture("exposes-markup-getters-and-setters-in-the-engine-realm.js"),
    );

    expect(document.querySelector("main")?.innerHTML).toBe(
      '<b>before</b><span id="target"><i>first</i><i>last</i></span><b>after</b>',
    );
  });

  it("exposes Sanitizer and connects it to HTML parsing", () => {
    const { engine, realm } = createTestRealm("");

    evaluate(
      engine,
      realm,
      fixture("exposes-sanitizer-in-the-engine-realm.js"),
    );
  });

  it("exposes HTML streaming in the engine realm", () => {
    const { document, engine, realm } = createTestRealm(
      "<main><i>old</i></main>",
    );

    evaluate(
      engine,
      realm,
      fixture("exposes-html-streaming-in-the-engine-realm.js"),
    );

    expect(document.querySelector("main")?.innerHTML).toBe(
      "<span>A&lt;B</span>",
    );
  });

  it("exposes live DOMTokenList objects in the engine realm", () => {
    const { document, engine, realm } = createTestRealm(
      '<span class="   a  a b "></span>',
    );

    evaluate(
      engine,
      realm,
      fixture("exposes-live-domtokenlist-objects-in-the-engine-realm.js"),
    );

    expect(document.querySelector("span")?.getAttribute("class")).toBe(
      "assigned",
    );
  });

  it("exposes token list attributes on their element interfaces", () => {
    const { engine, realm } = createTestRealm("");

    evaluate(
      engine,
      realm,
      fixture("exposes-token-list-attributes-on-their-element-interfaces.js"),
    );
  });

  it("exposes traversal interfaces and filters in the engine realm", () => {
    const { engine, realm } = createTestRealm("");

    evaluate(
      engine,
      realm,
      fixture(
        "exposes-traversal-interfaces-and-filters-in-the-engine-realm.js",
      ),
    );
  });

  it("preserves traversal callback completions and state", () => {
    const { engine, realm } = createTestRealm("");

    evaluate(
      engine,
      realm,
      `
        const root = testDocument.createElement("main");
        root.append(
          testDocument.createElement("a"),
          testDocument.createElement("b"),
          testDocument.createElement("c"),
        );
        const thrownValues = [
          {},
          Symbol("failure"),
          1n,
          false,
          0,
          "",
          undefined,
          null,
        ];
        for (const thrownValue of thrownValues) {
          let shouldThrow = true;
          const iterator = testDocument.createNodeIterator(
            root,
            NodeFilter.SHOW_ALL,
            () => {
              if (shouldThrow) {
                throw thrownValue;
              }
              return NodeFilter.FILTER_ACCEPT;
            },
          );
          let caught = "not thrown";
          try {
            iterator.nextNode();
          } catch (error) {
            caught = error;
          }
          if (!Object.is(caught, thrownValue)) {
            throw new Error("traversal throw identity changed");
          }
          if (iterator.referenceNode !== root ||
              !iterator.pointerBeforeReferenceNode) {
            throw new Error("failed traversal changed iterator state");
          }
          shouldThrow = false;
          if (iterator.nextNode() !== root) {
            throw new Error("iterator did not recover after failure");
          }
        }

        const getterFailure = {};
        const filter = {};
        Object.defineProperty(filter, "acceptNode", {
          configurable: true,
          get() { throw getterFailure; },
        });
        const walker = testDocument.createTreeWalker(
          root,
          NodeFilter.SHOW_ALL,
          filter,
        );
        let getterCaught;
        try {
          walker.nextNode();
        } catch (error) {
          getterCaught = error;
        }
        if (getterCaught !== getterFailure || walker.currentNode !== root) {
          throw new Error("acceptNode getter failure was not preserved");
        }
        Object.defineProperty(filter, "acceptNode", {
          value: () => NodeFilter.FILTER_ACCEPT,
        });
        if (walker.nextNode() !== root.firstChild) {
          throw new Error("TreeWalker did not recover after getter failure");
        }

        const conversionFailure = {};
        let failConversion = true;
        const converting = testDocument.createNodeIterator(
          root,
          NodeFilter.SHOW_ALL,
          () => failConversion
            ? { valueOf() { throw conversionFailure; } }
            : NodeFilter.FILTER_ACCEPT,
        );
        let conversionCaught;
        try {
          converting.nextNode();
        } catch (error) {
          conversionCaught = error;
        }
        if (conversionCaught !== conversionFailure) {
          throw new Error("filter result conversion changed the exception");
        }
        failConversion = false;
        if (converting.nextNode() !== root) {
          throw new Error("iterator did not recover after conversion failure");
        }
        for (const unconvertible of [Symbol("result"), 1n]) {
          const invalidResult = testDocument.createNodeIterator(
            root,
            NodeFilter.SHOW_ALL,
            () => unconvertible,
          );
          let typeError;
          try {
            invalidResult.nextNode();
          } catch (error) {
            typeError = error;
          }
          if (!(typeError instanceof TypeError) ||
              invalidResult.referenceNode !== root ||
              !invalidResult.pointerBeforeReferenceNode) {
            throw new Error("invalid filter result was not rejected safely");
          }
        }

        const mutationFailure = {};
        const removed = root.children[1];
        let failAfterMutation = true;
        const mutating = testDocument.createNodeIterator(
          root,
          NodeFilter.SHOW_ELEMENT,
          (node) => {
            if (node === removed && failAfterMutation) {
              removed.remove();
              throw mutationFailure;
            }
            return NodeFilter.FILTER_ACCEPT;
          },
        );
        if (mutating.nextNode() !== root ||
            mutating.nextNode() !== root.firstChild) {
          throw new Error("iterator setup failed");
        }
        let mutationCaught;
        try {
          mutating.nextNode();
        } catch (error) {
          mutationCaught = error;
        }
        if (mutationCaught !== mutationFailure ||
            mutating.referenceNode !== root.firstChild) {
          throw new Error("mutation failure changed iterator state");
        }
        failAfterMutation = false;
        if (mutating.nextNode() !== root.lastChild) {
          throw new Error("iterator did not recover after mutation failure");
        }
      `,
    );
  });

  it("exposes getElementsByTagName collections in the engine realm", () => {
    const { document, engine, realm } = createTestRealm(
      '<meta name="first"><main><meta name="second"></main>',
    );

    evaluate(
      engine,
      realm,
      fixture(
        "exposes-getelementsbytagname-collections-in-the-engine-realm.js",
      ),
    );

    expect(document.getElementsByTagName("meta").length).toBe(3);
  });

  it("binds ID and class lookup boundaries in the engine realm", () => {
    const { engine, realm } = createTestRealm("");

    evaluate(engine, realm, fixture("binds-id-and-class-lookup-boundaries.js"));
  });

  it("exposes live getElementsByName NodeLists in the engine realm", () => {
    const { engine, realm } = createTestRealm(
      '<main><p name="target"></p><svg name="target"></svg></main>',
    );

    evaluate(
      engine,
      realm,
      fixture(
        "exposes-live-getelementsbyname-nodelists-in-the-engine-realm.js",
      ),
    );
  });

  it("binds DocumentFragment selector methods", () => {
    const { engine, realm } = createTestRealm("");

    evaluate(
      engine,
      realm,
      fixture("binds-documentfragment-selector-methods.js"),
    );
  });

  it("binds DOMImplementation.hasFeature", () => {
    const { engine, realm } = createTestRealm("");

    evaluate(engine, realm, fixture("binds-domimplementation-hasfeature.js"));
  });

  it("treats an undefined createHTMLDocument title as omitted", () => {
    const { engine, realm } = createTestRealm("");

    evaluate(
      engine,
      realm,
      fixture("converts-createhtmldocument-optional-title.js"),
    );
  });

  it("binds document import, adoption, and fragment ID lookup", () => {
    const { engine, realm } = createTestRealm("");

    evaluate(
      engine,
      realm,
      fixture("binds-document-import-adoption-and-fragment-id-lookup.js"),
    );
  });

  it("binds Range and StaticRange constructors", () => {
    const { engine, realm } = createTestRealm("<main>text</main>");

    evaluate(
      engine,
      realm,
      fixture("binds-range-and-staticrange-constructors.js"),
    );
  });

  it("binds Range content and point operations", () => {
    const { engine, realm } = createTestRealm(
      "<main><p>one<b>two</b>three</p></main>",
    );

    evaluate(
      engine,
      realm,
      fixture("binds-range-content-and-point-operations.js"),
    );
  });

  it("exposes live indexed and named HTMLCollection properties", () => {
    const { engine, realm } = createTestRealm(
      '<main><span id="first" name="alpha"></span><span id="first" name="beta"></span></main>',
    );

    evaluate(
      engine,
      realm,
      fixture("exposes-live-indexed-and-named-htmlcollection-properties.js"),
    );
  });

  it("exposes DOMStringMap and NamedNodeMap named properties", () => {
    const { document, engine, realm } = createTestRealm(
      '<main id="target" class="initial" data-user-id="42"></main>',
    );

    evaluate(
      engine,
      realm,
      fixture("exposes-domstringmap-and-namednodemap-named-properties.js"),
    );

    expect(
      document.getElementById("target")?.getAttribute("data-user-id"),
    ).toBeNull();
  });

  it("binds NamedNodeMap mutation methods", () => {
    const { engine, realm } = createTestRealm("<main></main>");

    evaluate(engine, realm, fixture("binds-namednodemap-mutation-methods.js"));
  });

  it("binds the NamedNodeMap iterator", () => {
    const { engine, realm } = createTestRealm(
      '<main id="target" class="value"></main>',
    );

    evaluate(engine, realm, fixture("binds-namednodemap-iterator.js"));
  });

  it("binds live NodeList iterable methods", () => {
    const { engine, realm } = createTestRealm(
      '<main><b id="first"></b></main>',
    );

    evaluate(engine, realm, fixture("binds-live-nodelist-iterable-methods.js"));
  });

  it("filters and deduplicates NamedNodeMap supported property names", () => {
    const { engine, realm } = createTestRealm("<main></main>");

    evaluate(
      engine,
      realm,
      fixture(
        "filters-and-deduplicates-namednodemap-supported-property-names.js",
      ),
    );
  });

  it("binds namespace-aware attribute methods", () => {
    const { engine, realm } = createTestRealm("<main></main>");

    evaluate(
      engine,
      realm,
      fixture("binds-namespace-aware-attribute-methods.js"),
    );
  });

  it("binds non-namespaced attribute methods", () => {
    const { engine, realm } = createTestRealm("<main></main>");

    evaluate(
      engine,
      realm,
      fixture("binds-non-namespaced-attribute-methods.js"),
    );
  });

  it("binds Element matching and adjacent insertion methods", () => {
    const { document, engine, realm } = createTestRealm(
      '<main><section id="target"></section></main>',
    );

    evaluate(
      engine,
      realm,
      fixture("binds-element-matching-and-adjacent-insertion-methods.js"),
    );

    expect(document.querySelector("before")?.nextSibling?.textContent).toBe(
      "content",
    );
  });

  it("binds ParentNode and ChildNode mutation methods", () => {
    const { document, engine, realm } = createTestRealm(
      "<main><a></a><b></b><c></c></main>",
    );

    evaluate(
      engine,
      realm,
      fixture("binds-parentnode-and-childnode-mutation-methods.js"),
    );

    expect(document.querySelector("main")?.textContent).toBe("replacement");
  });

  it("binds Node replacement, namespace lookup, and legacy constants", () => {
    const { document, engine, realm } = createTestRealm(
      "<main><first></first><second></second></main>",
    );

    evaluate(
      engine,
      realm,
      fixture(
        "binds-node-replacement-namespace-lookup-and-legacy-constants.js",
      ),
    );

    expect(document.querySelector("main")?.firstChild?.nodeName).toBe("SECOND");
  });

  it("exposes HTMLAnchorElement URL attributes in the engine realm", () => {
    const { engine, realm } = createTestRealm('<a id="target"></a>');

    evaluate(
      engine,
      realm,
      fixture(
        "exposes-htmlanchorelement-url-attributes-in-the-engine-realm.js",
      ),
    );
  });

  it("creates namespaced elements in the engine realm", () => {
    const { engine, realm } = createTestRealm("");

    evaluate(
      engine,
      realm,
      fixture("creates-namespaced-elements-in-the-engine-realm.js"),
    );
  });

  it("exposes constructed Document metadata and children", () => {
    const { engine, realm } = createTestRealm("");

    evaluate(
      engine,
      realm,
      fixture("exposes-constructed-document-metadata-and-children.js"),
    );
  });

  it("parses HTML and XML through DOMParser in the engine realm", () => {
    const { engine, realm } = createTestRealm("");

    evaluate(
      engine,
      realm,
      fixture("parses-html-and-xml-through-domparser-in-the-engine-realm.js"),
    );
  });

  it("invokes engine event callbacks synchronously and supports reentry", () => {
    const { document, engine, realm } = createTestRealm(
      '<button id="target"></button>',
    );

    evaluate(
      engine,
      realm,
      fixture(
        "invokes-engine-event-callbacks-synchronously-and-supports-reentry.js",
      ),
    );

    expect(document.getElementById("target")?.getAttribute("data-calls")).toBe(
      "2",
    );
  });

  it("supports once event listeners and immediate propagation stopping", () => {
    const { engine, realm } = createTestRealm("");

    evaluate(
      engine,
      realm,
      fixture(
        "supports-once-event-listeners-and-immediate-propagation-stopping.js",
      ),
    );
  });

  it("supports passive event listeners", () => {
    const { engine, realm } = createTestRealm("");

    evaluate(engine, realm, fixture("supports-passive-event-listeners.js"));
  });

  it("supports abort signals for event listeners", () => {
    const { engine, realm } = createTestRealm("");

    evaluate(
      engine,
      realm,
      fixture("supports-abort-signals-for-event-listeners.js"),
    );
  });

  it("exposes event constructor state and custom event detail", () => {
    const { engine, realm } = createTestRealm("");

    evaluate(
      engine,
      realm,
      fixture("exposes-event-constructor-state-and-custom-event-detail.js"),
    );
  });

  it("supports Document.createEvent and legacy event initialization", () => {
    const { engine, realm } = createTestRealm("");

    evaluate(
      engine,
      realm,
      fixture("supports-document-createevent-and-legacy-initialization.js"),
    );
  });

  it("keeps a platform object wrapper in its first associated realm", () => {
    const document = new DOMParser().parseFromString(
      '<main id="target"></main>',
      "text/html",
    );
    const engine = new Engine262Adapter();
    const firstRealm = engine.createRealm();
    const secondRealm = engine.createRealm();
    const firstBinding = new DOMRealmBinding(engine, firstRealm);
    const secondBinding = new DOMRealmBinding(engine, secondRealm);
    firstBinding.expose("testDocument", document);
    secondBinding.expose("testDocument", document);

    evaluate(
      engine,
      firstRealm,
      fixture("keeps-platform-object-wrapper-in-associated-realm-1.js"),
    );
    evaluate(
      engine,
      secondRealm,
      fixture("keeps-platform-object-wrapper-in-associated-realm-2.js"),
    );

    expect(document.getElementById("second")?.localName).toBe("main");
  });

  it("preserves node creation realms across factories and adoption", () => {
    const firstDocument = new DOMParser().parseFromString(
      "<main><span id=never-wrapped></span></main>",
      "text/html",
    );
    const secondDocument = new DOMParser().parseFromString("", "text/html");
    const engine = new Engine262Adapter();
    const firstRealm = engine.createRealm();
    const secondRealm = engine.createRealm();
    const firstBinding = new DOMRealmBinding(engine, firstRealm, firstDocument);
    const secondBinding = new DOMRealmBinding(
      engine,
      secondRealm,
      secondDocument,
    );
    firstBinding.expose("testDocument", firstDocument);
    secondBinding.expose("testDocument", secondDocument);
    secondBinding.expose("otherDocument", firstDocument);

    const crossRealmNode = firstDocument.createElement("span");
    const adoptedContainer = firstDocument.createElement("div");
    const neverWrappedNode = firstDocument.getElementById("never-wrapped");
    if (neverWrappedNode === null) {
      throw new Error("missing never-wrapped node fixture");
    }
    secondDocument.adoptNode(neverWrappedNode);
    secondBinding.expose("crossRealmNode", crossRealmNode);
    secondBinding.expose("adoptedContainer", adoptedContainer);
    secondBinding.expose("neverWrappedNode", neverWrappedNode);

    for (const name of ["Comment", "HTMLElement"] as const) {
      copyRealmGlobal(engine, firstRealm, secondRealm, name, `first${name}`);
    }

    evaluate(
      engine,
      secondRealm,
      fixture("preserves-node-creation-realms-across-adoption.js"),
    );
  });
});
