import { describe, expect, it } from "vitest";

import { DOMParser } from "../../src/index.js";
import type { Document } from "../../src/index.js";
import type {
  EngineRealm,
  JavaScriptEngineAdapter,
} from "../../src/javascript-engine/adapter.js";
import { DOMRealmBinding } from "../../src/javascript-engine/dom-realm-binding.js";
import { Engine262Adapter } from "../../src/javascript-engine/engine262-adapter.js";

interface TestRealm {
  readonly binding: DOMRealmBinding;
  readonly document: Document;
  readonly engine: JavaScriptEngineAdapter;
  readonly realm: EngineRealm;
}

function createTestRealm(input: string): TestRealm {
  const document = new DOMParser().parseFromString(input, "text/html");
  const engine = new Engine262Adapter();
  const realm = engine.createRealm();
  const binding = new DOMRealmBinding(engine, realm);
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

describe("DOMRealmBinding", () => {
  it("exposes DOM platform objects with realm interface identity", () => {
    const { document, engine, realm } = createTestRealm(
      '<main id="target"></main>',
    );

    evaluate(
      engine,
      realm,
      `
        if (!(testDocument instanceof Document)) {
          throw new Error("testDocument is not a Document");
        }
        const first = testDocument.querySelector("main");
        const second = testDocument.getElementById("target");
        if (!(first instanceof Element) || first !== second) {
          throw new Error("DOM platform object identity was not preserved");
        }
        first.setAttribute("data-runtime", "palim");
        first.innerHTML = "<span>connected</span>";
      `,
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
      `
        const id = Object.getOwnPropertyDescriptor(Element.prototype, "id");
        const setAttribute = Object.getOwnPropertyDescriptor(
          Element.prototype,
          "setAttribute",
        );
        if (
          typeof id.get !== "function" ||
          typeof id.set !== "function" ||
          !id.configurable ||
          !id.enumerable ||
          typeof setAttribute.value !== "function" ||
          setAttribute.value.length !== 2
        ) {
          throw new Error("interface property descriptors are invalid");
        }
        const target = testDocument.getElementById("target");
        target.setAttribute("data-number", 12);
        try {
          target.setAttribute("data-missing");
          throw new Error("missing argument was accepted");
        } catch (error) {
          if (!(error instanceof TypeError)) {
            throw error;
          }
        }
      `,
    );

    expect(document.getElementById("target")?.getAttribute("data-number")).toBe(
      "12",
    );
  });

  it("exposes live DOMTokenList objects in the engine realm", () => {
    const { document, engine, realm } = createTestRealm(
      '<span class="   a  a b "></span>',
    );

    evaluate(
      engine,
      realm,
      `
        const list = testDocument.querySelector("span").classList;
        if (
          !(list instanceof DOMTokenList) ||
          Object.prototype.toString.call(list) !== "[object DOMTokenList]" ||
          String(list) !== "   a  a b " ||
          list.value !== "   a  a b " ||
          list.length !== 2 ||
          list[0] !== "a" ||
          list[1] !== "b" ||
          list[Symbol.iterator] !== Array.prototype[Symbol.iterator] ||
          list.keys !== Array.prototype.keys ||
          list.values !== Array.prototype.values ||
          list.entries !== Array.prototype.entries ||
          list.forEach !== Array.prototype.forEach ||
          [...list].join("|") !== "a|b" ||
          [...list.keys()].join("|") !== "0|1" ||
          [...list.values()].join("|") !== "a|b" ||
          [...list.entries()].map((entry) => entry.join(":"))
            .join("|") !== "0:a|1:b"
        ) {
          throw new Error("DOMTokenList binding is invalid");
        }
        const receiver = {};
        let calls = 0;
        list.forEach(function(value, index, parent) {
          if (
            this !== receiver ||
            parent !== list ||
            value !== list[index]
          ) {
            throw new Error("DOMTokenList forEach is invalid");
          }
          calls += 1;
        }, receiver);
        if (calls !== 2) {
          throw new Error("DOMTokenList forEach length is invalid");
        }
        list.value = " foo bar foo ";
        if (list.value !== " foo bar foo " || list.length !== 2) {
          throw new Error("DOMTokenList value is invalid");
        }
      `,
    );

    expect(document.querySelector("span")?.getAttribute("class")).toBe(
      " foo bar foo ",
    );
  });

  it("exposes token list attributes on their element interfaces", () => {
    const { engine, realm } = createTestRealm("");

    evaluate(
      engine,
      realm,
      `
        const html = "http://www.w3.org/1999/xhtml";
        const svg = "http://www.w3.org/2000/svg";
        const mathml = "http://www.w3.org/1998/Math/MathML";
        const cases = [
          [html, "a", "relList", HTMLAnchorElement],
          [html, "area", "relList", HTMLAreaElement],
          [html, "link", "relList", HTMLLinkElement],
          [html, "link", "sizes", HTMLLinkElement],
          [html, "iframe", "sandbox", HTMLIFrameElement],
          [html, "output", "htmlFor", HTMLOutputElement],
          [svg, "a", "relList", Element],
          [mathml, "a", "relList", Element],
        ];
        for (const [namespace, localName, attribute, Interface] of cases) {
          const element = testDocument.createElementNS(namespace, localName);
          if (
            !(element instanceof Interface) ||
            Object.prototype.toString.call(element[attribute]) !==
              "[object DOMTokenList]"
          ) {
            throw new Error(localName + "." + attribute + " is invalid");
          }
        }
        for (const [namespace, localName, attribute] of [
          [html, "td", "relList"],
          [svg, "area", "relList"],
          [mathml, "link", "sizes"],
        ]) {
          const element = testDocument.createElementNS(namespace, localName);
          if (element[attribute] !== undefined) {
            throw new Error(localName + "." + attribute + " is overexposed");
          }
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
      `
        const collection = testDocument.getElementsByTagName("meta");
        if (
          !(collection instanceof HTMLCollection) ||
          collection.length !== 2 ||
          collection[0].localName !== "meta" ||
          collection.item(1).localName !== "meta"
        ) {
          throw new Error("HTMLCollection was not exposed correctly");
        }
        testDocument
          .querySelector("main")
          .appendChild(testDocument.createElement("meta"));
        if (collection.length !== 3) {
          throw new Error("HTMLCollection is not live");
        }
      `,
    );

    expect(document.getElementsByTagName("meta").length).toBe(3);
  });

  it("exposes live indexed and named HTMLCollection properties", () => {
    const { engine, realm } = createTestRealm(
      '<main><span id="first" name="alpha"></span><span id="first" name="beta"></span></main>',
    );

    evaluate(
      engine,
      realm,
      `
        const collection = testDocument.getElementsByTagName("span");
        const first = testDocument.getElementById("first");
        if (
          collection[0] !== first ||
          collection.first !== first ||
          collection.namedItem("alpha") !== first
        ) {
          throw new Error("HTMLCollection named properties are invalid");
        }
        const descriptor = Object.getOwnPropertyDescriptor(collection, "first");
        if (
          descriptor.value !== first ||
          descriptor.enumerable ||
          !descriptor.configurable ||
          descriptor.writable
        ) {
          throw new Error("HTMLCollection named descriptor is invalid");
        }
        const third = testDocument.createElement("span");
        third.id = "third";
        third.className = "runtime";
        const runtime = testDocument.getElementsByClassName("runtime");
        testDocument.querySelector("main").append(third);
        if (collection[2] !== third || collection.third !== third) {
          throw new Error("HTMLCollection properties are not live");
        }
        if (runtime[0] !== third || third.getAttribute("class") !== "runtime") {
          throw new Error("ParentNode.append or className binding is invalid");
        }
        const names = Object.getOwnPropertyNames(collection);
        const expected = ["0", "1", "2", "first", "alpha", "beta", "third"];
        if (names.join("|") !== expected.join("|")) {
          throw new Error("HTMLCollection property names are invalid: " + names);
        }
        collection.first = "ignored";
        delete collection.first;
        if (collection.first !== first) {
          throw new Error("HTMLCollection named property was replaced");
        }
        const derived = Object.create(collection);
        derived.first = "shadow";
        if (derived.first !== "shadow" || collection.first !== first) {
          throw new Error("HTMLCollection prototype property cannot be shadowed");
        }
      `,
    );
  });

  it("exposes DOMStringMap and NamedNodeMap named properties", () => {
    const { document, engine, realm } = createTestRealm(
      '<main id="target" class="initial" data-user-id="42"></main>',
    );

    evaluate(
      engine,
      realm,
      `
        const element = testDocument.getElementById("target");
        if (!(element instanceof HTMLElement)) {
          throw new Error("HTMLElement realm identity is invalid");
        }
        if (
          !(element.dataset instanceof DOMStringMap) ||
          element.dataset.userId !== "42"
        ) {
          throw new Error("DOMStringMap getter is invalid");
        }
        element.dataset.runtimeValue = 7;
        if (
          element.getAttribute("data-runtime-value") !== "7" ||
          Object.getOwnPropertyNames(element.dataset).join("|") !==
            "userId|runtimeValue"
        ) {
          throw new Error("DOMStringMap setter is invalid");
        }
        delete element.dataset.userId;
        if (element.dataset.userId !== undefined) {
          throw new Error("DOMStringMap deleter is invalid");
        }
        const attributes = element.attributes;
        if (
          !(attributes instanceof NamedNodeMap) ||
          !(attributes[0] instanceof Attr) ||
          Object.getOwnPropertyNames(attributes).join("|") !==
            "0|1|2|id|class|data-runtime-value"
        ) {
          throw new Error("NamedNodeMap properties are invalid");
        }
      `,
    );

    expect(
      document.getElementById("target")?.getAttribute("data-user-id"),
    ).toBeNull();
  });

  it("exposes HTMLAnchorElement URL attributes in the engine realm", () => {
    const { engine, realm } = createTestRealm('<a id="target"></a>');

    evaluate(
      engine,
      realm,
      `
        const anchor = testDocument.getElementById("target");
        anchor.href = "https://example.com/path?query#fragment";
        if (
          !(anchor instanceof HTMLAnchorElement) ||
          anchor.pathname !== "/path" ||
          anchor.search !== "?query" ||
          anchor.hash !== "#fragment"
        ) {
          throw new Error("HTMLAnchorElement URL attributes are invalid");
        }
      `,
    );
  });

  it("creates namespaced elements in the engine realm", () => {
    const { engine, realm } = createTestRealm("");

    evaluate(
      engine,
      realm,
      `
        const anchor = testDocument.createElementNS(
          "http://www.w3.org/1999/xhtml",
          "a",
        );
        if (
          !(anchor instanceof HTMLAnchorElement) ||
          anchor.namespaceURI !== "http://www.w3.org/1999/xhtml"
        ) {
          throw new Error("createElementNS returned an invalid element");
        }
      `,
    );
  });

  it("exposes constructed Document metadata and children", () => {
    const { engine, realm } = createTestRealm("");

    evaluate(
      engine,
      realm,
      `
        const document = new Document();
        if (
          document instanceof XMLDocument ||
          document.firstChild !== null ||
          document.lastChild !== null ||
          !(document.childNodes instanceof NodeList) ||
          document.childNodes.length !== 0 ||
          document.location !== null ||
          document.URL !== "about:blank" ||
          document.documentURI !== "about:blank" ||
          document.compatMode !== "CSS1Compat" ||
          document.characterSet !== "UTF-8" ||
          document.charset !== "UTF-8" ||
          document.inputEncoding !== "UTF-8" ||
          document.contentType !== "application/xml"
        ) {
          throw new Error("constructed Document state is invalid");
        }
      `,
    );
  });

  it("invokes engine event callbacks synchronously and supports reentry", () => {
    const { document, engine, realm } = createTestRealm(
      '<button id="target"></button>',
    );

    evaluate(
      engine,
      realm,
      `
        const target = testDocument.getElementById("target");
        let calls = 0;
        target.addEventListener("activate", function (event) {
          calls += 1;
          if (this !== target || event.currentTarget !== target) {
            throw new Error("Event callback receiver was not preserved");
          }
          if (calls === 1) {
            target.dispatchEvent(new Event("activate"));
          }
          target.setAttribute("data-calls", calls);
        });
        target.dispatchEvent(new Event("activate"));
      `,
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
      `
        const target = new EventTarget();
        let onceCalls = 0;
        function onceListener() {
          onceCalls += 1;
          target.dispatchEvent(new Event("once"));
        }
        target.addEventListener("once", onceListener, { once: true });
        target.dispatchEvent(new Event("once"));
        target.dispatchEvent(new Event("once"));
        if (onceCalls !== 1) {
          throw new Error("once listener was not removed before invocation");
        }

        let removeOnceGetterCalls = 0;
        function removableListener() {}
        target.addEventListener("remove", removableListener);
        target.removeEventListener("remove", removableListener, {
          get once() {
            removeOnceGetterCalls += 1;
            return true;
          },
        });
        if (removeOnceGetterCalls !== 0) {
          throw new Error("removeEventListener read the once option");
        }

        let immediateCalls = 0;
        for (let index = 0; index < 2; index += 1) {
          target.addEventListener("immediate", (event) => {
            immediateCalls += 1;
            event.stopImmediatePropagation();
          }, { once: true });
        }
        target.dispatchEvent(new Event("immediate"));
        target.dispatchEvent(new Event("immediate"));
        if (immediateCalls !== 2) {
          throw new Error("remaining once listener was not retained");
        }
      `,
    );
  });

  it("supports passive event listeners", () => {
    const { engine, realm } = createTestRealm("");

    evaluate(
      engine,
      realm,
      `
        const target = new EventTarget();
        let passiveGetterCalls = 0;
        target.addEventListener("probe", null, {
          get passive() {
            passiveGetterCalls += 1;
            return false;
          },
        });
        if (passiveGetterCalls !== 1) {
          throw new Error("passive option was not read");
        }

        target.addEventListener("passive", (event) => {
          if (event.defaultPrevented) {
            throw new Error("event was canceled before listener invocation");
          }
          event.preventDefault();
          event.returnValue = false;
        }, { passive: true });
        const event = new Event("passive", { cancelable: true });
        if (!target.dispatchEvent(event) || event.defaultPrevented) {
          throw new Error("passive listener canceled the event");
        }
      `,
    );
  });

  it("supports abort signals for event listeners", () => {
    const { engine, realm } = createTestRealm("");

    evaluate(
      engine,
      realm,
      `
        const target = new EventTarget();
        const controller = new AbortController();
        let calls = 0;
        function listener() {
          calls += 1;
        }
        target.addEventListener("signal", listener, {
          signal: controller.signal,
        });
        target.dispatchEvent(new Event("signal"));
        controller.abort();
        target.dispatchEvent(new Event("signal"));
        target.addEventListener("signal", listener, {
          signal: controller.signal,
        });
        target.dispatchEvent(new Event("signal"));
        if (calls !== 1 || !controller.signal.aborted) {
          throw new Error("abort signal did not remove the listener");
        }

        let threw = false;
        try {
          target.addEventListener("signal", null, { signal: null });
        } catch (error) {
          threw = error instanceof TypeError;
        }
        if (!threw) {
          throw new Error("null signal did not throw a TypeError");
        }
      `,
    );
  });

  it("exposes event constructor state and custom event detail", () => {
    const { engine, realm } = createTestRealm("");

    evaluate(
      engine,
      realm,
      `
        const event = new Event("event", {
          bubbles: true,
          cancelable: true,
        });
        if (
          event.target !== null ||
          event.srcElement !== null ||
          event.currentTarget !== null ||
          event.eventPhase !== Event.NONE ||
          !event.bubbles ||
          !event.cancelable ||
          event.defaultPrevented ||
          event.returnValue !== true ||
          event.isTrusted ||
          event.timeStamp <= 0 ||
          typeof event.initEvent !== "function"
        ) {
          throw new Error("Event constructor state is invalid");
        }

        const custom = new CustomEvent("custom", {
          detail: 54,
          cancelable: true,
        });
        if (
          !(custom instanceof CustomEvent) ||
          !(custom instanceof Event) ||
          custom.detail !== 54 ||
          !custom.cancelable
        ) {
          throw new Error("CustomEvent constructor state is invalid");
        }
      `,
    );
  });

  it("keeps platform object wrappers separate between realms", () => {
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

    evaluate(engine, firstRealm, 'testDocument.realmMarker = "first"');
    evaluate(
      engine,
      secondRealm,
      `
        if (testDocument.realmMarker !== undefined) {
          throw new Error("platform object leaked between realms");
        }
        testDocument.getElementById("target").id = "second";
      `,
    );

    expect(document.getElementById("second")?.localName).toBe("main");
  });
});
