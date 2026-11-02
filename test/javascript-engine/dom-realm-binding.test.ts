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
