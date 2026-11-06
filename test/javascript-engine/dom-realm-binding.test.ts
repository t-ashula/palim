import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { DOMParser } from "../../src/index.js";
import type { Document } from "../../src/index.js";
import * as HTML from "../../src/html-elements.js";
import type {
  EngineRealm,
  JavaScriptEngineAdapter,
} from "../../src/javascript-engine/adapter.js";
import { DOMRealmBinding } from "../../src/javascript-engine/dom-realm-binding.js";
import { Engine262Adapter } from "../../src/javascript-engine/engine262-adapter.js";
import { htmlElementInterfaceConstructors } from "../../src/javascript-engine/html-element-interface-constructors.js";

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

function createTestRealm(input: string): TestRealm {
  const document = new DOMParser().parseFromString(input, "text/html");
  const engine = new Engine262Adapter();
  const realm = engine.createRealm();
  const binding = new DOMRealmBinding(engine, realm, document);
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
  engine.defineDataProperty(
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
