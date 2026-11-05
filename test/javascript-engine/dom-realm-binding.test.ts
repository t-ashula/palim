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

  it("binds CharacterData operations in the engine realm", () => {
    const { engine, realm } = createTestRealm("");

    evaluate(
      engine,
      realm,
      `
        const data = Object.getOwnPropertyDescriptor(
          CharacterData.prototype,
          "data",
        );
        const replaceData = Object.getOwnPropertyDescriptor(
          CharacterData.prototype,
          "replaceData",
        );
        if (
          typeof data.get !== "function" ||
          typeof data.set !== "function" ||
          typeof replaceData.value !== "function" ||
          replaceData.value.length !== 3
        ) {
          throw new Error("CharacterData descriptors are invalid");
        }

        const text = new Text("test");
        if (text.data !== "test" || text.ownerDocument !== testDocument) {
          throw new Error("Text constructor did not use data or the realm document");
        }
        const calls = [];
        const convertedComment = new Comment({
          toString() {
            calls.push("first");
            return "comment";
          }
        }, {
          toString() {
            calls.push("second");
            throw new Error("second constructor argument was read");
          }
        });
        if (
          convertedComment.data !== "comment" ||
          convertedComment.ownerDocument !== testDocument ||
          calls.join(",") !== "first" ||
          new Text(undefined).data !== "" ||
          new Comment(null).data !== "null"
        ) {
          throw new Error("CharacterData constructor conversion is invalid");
        }
        text.data = "🌠 test 🌠 TEST";
        if (text.substringData(1, 8) !== "\\uDF20 test \\uD83C") {
          throw new Error("substringData did not use UTF-16 code units");
        }
        text.replaceData(1, 4, "--");
        text.deleteData(1, 2);
        text.insertData(1, "\\uDF1F ");
        text.appendData(null);
        if (text.data !== "🌟 st 🌠 TESTnull") {
          throw new Error("CharacterData mutation result is invalid");
        }

        try {
          text.substringData(0);
          throw new Error("missing count was accepted");
        } catch (error) {
          if (!(error instanceof TypeError)) throw error;
        }
        try {
          text.substringData(0xffffffff, 0);
          throw new Error("out-of-bounds offset was accepted");
        } catch (error) {
          if (!(error instanceof DOMException) || error.name !== "IndexSizeError") {
            throw error;
          }
        }
        text.data = null;
        if (text.data !== "") {
          throw new Error("data did not apply LegacyNullToEmptyString");
        }
      `,
    );
  });

  it("exposes the Readability DOM APIs in the engine realm", () => {
    const { document, engine, realm } = createTestRealm(
      '<title>Initial title</title><main data-value="old"></main>text<aside data-value="new"></aside>',
    );

    evaluate(
      engine,
      realm,
      `
        const main = testDocument.querySelector("main");
        const aside = testDocument.querySelector("aside");
        const text = main.nextSibling;
        if (
          main.nextElementSibling !== aside ||
          aside.previousElementSibling !== main ||
          text.previousElementSibling !== main ||
          text.nextElementSibling !== aside
        ) {
          throw new Error("element sibling binding is invalid");
        }

        const original = main.attributes[0];
        const replacement = aside.attributes[0];
        aside.removeAttributeNode(replacement);
        const old = main.setAttributeNodeNS(replacement);
        if (
          old !== original ||
          main.attributes[0] !== replacement ||
          main.removeAttributeNode(replacement) !== replacement ||
          main.attributes.length !== 0
        ) {
          throw new Error("attribute node binding is invalid");
        }

        testDocument.title = "Updated title";
        if (testDocument.title !== "Updated title") {
          throw new Error("Document title binding is invalid");
        }

        const style = main.style;
        if (
          !(style instanceof CSSStyleDeclaration) ||
          !(style instanceof CSSStyleProperties) ||
          style !== main.style ||
          style.parentRule !== null
        ) {
          throw new Error("style object binding is invalid");
        }
        style.setProperty("display", "none", "important");
        style.visibility = "hidden";
        if (
          style.length !== 2 ||
          style[0] !== "display" ||
          style.item(1) !== "visibility" ||
          style.getPropertyValue("display") !== "none" ||
          style.getPropertyPriority("display") !== "important" ||
          style.float !== ""
        ) {
          throw new Error("style declaration binding is invalid");
        }
        main.style = "display: flex;";
        if (style.display !== "flex") {
          throw new Error("style PutForwards binding is invalid");
        }
        main.style = null;
        if (main.getAttribute("style") !== "" || style.length !== 0) {
          throw new Error("style cssText forwarding is invalid");
        }
      `,
    );

    expect(document.title).toBe("Updated title");
    expect(document.querySelector("main")?.getAttribute("style")).toBe("");
  });

  it("exposes markup getters and setters in the engine realm", () => {
    const { document, engine, realm } = createTestRealm(
      '<main><p id="first">old</p><p id="second">old</p></main>',
    );

    evaluate(
      engine,
      realm,
      `
        const main = testDocument.querySelector("main");
        const first = testDocument.getElementById("first");
        const second = testDocument.getElementById("second");
        if (first.outerHTML !== '<p id="first">old</p>') {
          throw new Error("outerHTML getter is invalid");
        }
        first.outerHTML = null;
        second.outerHTML = undefined;
        if (main.innerHTML !== "undefined") {
          throw new Error("outerHTML conversion is invalid");
        }
        main.innerHTML = null;
        if (main.innerHTML !== "") {
          throw new Error("innerHTML null conversion is invalid");
        }
        main.innerHTML = '<span id="target"></span>';
        const target = testDocument.getElementById("target");
        target.insertAdjacentHTML("beforebegin", "<b>before</b>");
        target.insertAdjacentHTML("afterbegin", "<i>first</i>");
        target.insertAdjacentHTML("beforeend", "<i>last</i>");
        target.insertAdjacentHTML("afterend", "<b>after</b>");
        if (
          main.innerHTML !==
          '<b>before</b><span id="target"><i>first</i><i>last</i></span><b>after</b>'
        ) {
          throw new Error("insertAdjacentHTML is invalid");
        }
        try {
          target.insertAdjacentHTML("invalid", "");
          throw new Error("invalid insertAdjacentHTML position was accepted");
        } catch (error) {
          if (!(error instanceof DOMException) || error.name !== "SyntaxError") {
            throw error;
          }
        }
        try {
          testDocument.documentElement.outerHTML = "<html></html>";
          throw new Error("document child outerHTML was accepted");
        } catch (error) {
          if (
            !(error instanceof DOMException) ||
            error.name !== "NoModificationAllowedError"
          ) {
            throw error;
          }
        }
      `,
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
          typeof list.contains !== "function" ||
          typeof list.add !== "function" ||
          typeof list.remove !== "function" ||
          typeof list.toggle !== "function" ||
          typeof list.replace !== "function" ||
          typeof list.supports !== "function" ||
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
        list.add("baz", "foo");
        list.remove("bar");
        if (
          !list.contains("baz") ||
          list.toggle("baz") ||
          !list.toggle("qux", true) ||
          !list.replace("qux", "replaced") ||
          list.value !== "foo replaced"
        ) {
          throw new Error("DOMTokenList mutation methods are invalid");
        }
        testDocument.querySelector("span").classList = "assigned";
        if (list.value !== "assigned") {
          throw new Error("DOMTokenList PutForwards is invalid");
        }
        let supportsError = null;
        try {
          list.supports("token");
        } catch (error) {
          supportsError = error;
        }
        if (!(supportsError instanceof TypeError)) {
          throw new Error("DOMTokenList supports TypeError is invalid");
        }
      `,
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

  it("exposes traversal interfaces and filters in the engine realm", () => {
    const { engine, realm } = createTestRealm("");

    evaluate(
      engine,
      realm,
      `
        const root = testDocument.createElement("main");
        const text = testDocument.createTextNode("before");
        const first = testDocument.createElement("section");
        const second = testDocument.createElement("p");
        const comment = testDocument.createComment("after");
        root.appendChild(text);
        root.appendChild(first);
        root.appendChild(second);
        root.appendChild(comment);
        if (
          !(text instanceof Text) ||
          !(comment instanceof Comment) ||
          text.nodeValue !== "before" ||
          comment.nodeValue !== "after" ||
          first.previousSibling !== text ||
          first.nextSibling !== second
        ) {
          throw new Error("traversal node binding is invalid");
        }

        const iterator = testDocument.createNodeIterator(
          root,
          NodeFilter.SHOW_ELEMENT,
        );
        if (
          !(iterator instanceof NodeIterator) ||
          iterator.toString() !== "[object NodeIterator]" ||
          iterator.root !== root ||
          iterator.referenceNode !== root ||
          !iterator.pointerBeforeReferenceNode ||
          iterator.whatToShow !== NodeFilter.SHOW_ELEMENT ||
          iterator.filter !== null ||
          iterator.nextNode() !== root ||
          iterator.nextNode() !== first ||
          iterator.nextNode() !== second ||
          iterator.nextNode() !== null
        ) {
          throw new Error("NodeIterator binding is invalid");
        }

        let receiver;
        let argument;
        const filter = {
          acceptNode(node) {
            receiver = this;
            argument = node;
            return node === first
              ? NodeFilter.FILTER_SKIP
              : NodeFilter.FILTER_ACCEPT;
          },
        };
        const walker = testDocument.createTreeWalker(
          root,
          NodeFilter.SHOW_ELEMENT,
          filter,
        );
        if (
          !(walker instanceof TreeWalker) ||
          walker.toString() !== "[object TreeWalker]" ||
          walker.root !== root ||
          walker.currentNode !== root ||
          walker.whatToShow !== NodeFilter.SHOW_ELEMENT ||
          walker.filter !== filter ||
          walker.nextNode() !== second ||
          receiver !== filter ||
          argument !== second
        ) {
          throw new Error("TreeWalker binding is invalid");
        }
        walker.currentNode = first;
        if (walker.currentNode !== first || walker.parentNode() !== root) {
          throw new Error("TreeWalker currentNode is invalid");
        }

        const marker = {};
        const throwing = testDocument.createTreeWalker(root, undefined, () => {
          throw marker;
        });
        try {
          throwing.nextNode();
          throw new Error("throwing filter was accepted");
        } catch (error) {
          if (error !== marker) {
            throw error;
          }
        }

        let recursive;
        recursive = testDocument.createNodeIterator(root, undefined, () => {
          recursive.nextNode();
          return NodeFilter.FILTER_ACCEPT;
        });
        try {
          recursive.nextNode();
          throw new Error("recursive filter was accepted");
        } catch (error) {
          if (
            !(error instanceof DOMException) ||
            error.name !== "InvalidStateError" ||
            error.code !== DOMException.INVALID_STATE_ERR
          ) {
            throw error;
          }
        }

        const xmlDocument = new Document();
        const cdata = xmlDocument.createCDATASection("data");
        const instruction = xmlDocument.createProcessingInstruction("pi", "data");
        const doctype = testDocument.implementation.createDocumentType(
          "root",
          "",
          "",
        );
        const foreignDocument = testDocument.implementation.createDocument(
          null,
          null,
          doctype,
        );
        const htmlDocument = testDocument.implementation.createHTMLDocument("");
        if (
          cdata.nodeType !== Node.CDATA_SECTION_NODE ||
          instruction.nodeType !== Node.PROCESSING_INSTRUCTION_NODE ||
          foreignDocument.doctype !== doctype ||
          htmlDocument.head === null ||
          htmlDocument.body === null ||
          testDocument.implementation !== testDocument.implementation
        ) {
          throw new Error("document fixture APIs are invalid");
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

  it("exposes live getElementsByName NodeLists in the engine realm", () => {
    const { engine, realm } = createTestRealm(
      '<main><p name="target"></p><svg name="target"></svg></main>',
    );

    evaluate(
      engine,
      realm,
      `
        const list = testDocument.getElementsByName("target");
        if (
          !(list instanceof NodeList) ||
          Object.prototype.toString.call(list) !== "[object NodeList]" ||
          list.length !== 1 ||
          list[0].localName !== "p"
        ) {
          throw new Error("getElementsByName result is invalid");
        }
        const added = testDocument.createElement("section");
        added.setAttribute("name", "target");
        testDocument.body.appendChild(added);
        if (list.length !== 2 || list[1] !== added) {
          throw new Error("getElementsByName result is not live");
        }
      `,
    );
  });

  it("binds DocumentFragment selector methods", () => {
    const { engine, realm } = createTestRealm("");

    evaluate(
      engine,
      realm,
      `
        const fragment = testDocument.createDocumentFragment();
        const first = testDocument.createElement("p");
        first.className = "target";
        const second = testDocument.createElement("span");
        second.className = "target";
        fragment.append(first, second);
        const list = fragment.querySelectorAll(".target");
        if (
          fragment.querySelector(".target") !== first ||
          !(list instanceof NodeList) ||
          list.length !== 2 ||
          list[1] !== second
        ) {
          throw new Error("DocumentFragment selector binding is invalid");
        }
      `,
    );
  });

  it("binds Range and StaticRange constructors", () => {
    const { engine, realm } = createTestRealm("<main>text</main>");

    evaluate(
      engine,
      realm,
      `
        const main = testDocument.querySelector("main");
        const text = main.firstChild;
        const constructed = new Range();
        const created = testDocument.createRange();
        if (
          !(constructed instanceof Range) ||
          !(created instanceof Range) ||
          constructed.startContainer !== testDocument ||
          constructed.endContainer !== testDocument ||
          !constructed.collapsed
        ) {
          throw new Error("Range construction is invalid");
        }
        created.setStart(text, 1);
        created.setEnd(text, 3);
        if (created.toString() !== "ex" || created.commonAncestorContainer !== text) {
          throw new Error("Range binding is invalid");
        }
        const snapshot = new StaticRange({
          startContainer: text,
          startOffset: 1,
          endContainer: text,
          endOffset: 3,
        });
        if (
          !(snapshot instanceof StaticRange) ||
          snapshot.startContainer !== text ||
          snapshot.startOffset !== 1 ||
          snapshot.endContainer !== text ||
          snapshot.endOffset !== 3 ||
          snapshot.collapsed
        ) {
          throw new Error("StaticRange construction is invalid");
        }
      `,
    );
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

  it("filters and deduplicates NamedNodeMap supported property names", () => {
    const { engine, realm } = createTestRealm("<main></main>");

    evaluate(
      engine,
      realm,
      `
        const element = testDocument.querySelector("main");
        for (const [namespace, name] of [
          ["urn:first", "same"],
          ["urn:second", "same"],
          ["urn:upper", "A:B"],
          ["urn:lower", "c:d"],
        ]) {
          const attribute = testDocument.createAttributeNS(namespace, name);
          element.setAttributeNodeNS(attribute);
        }
        const names = Object.getOwnPropertyNames(element.attributes);
        const expected = ["0", "1", "2", "3", "same", "c:d"];
        if (names.join("|") !== expected.join("|")) {
          throw new Error("NamedNodeMap supported property names are invalid: " + names);
        }
      `,
    );
  });

  it("binds namespace-aware attribute methods", () => {
    const { engine, realm } = createTestRealm("<main></main>");

    evaluate(
      engine,
      realm,
      `
        for (const [prototype, name, length] of [
          [Document.prototype, "createAttributeNS", 2],
          [Element.prototype, "getAttributeNS", 2],
          [Element.prototype, "getAttributeNodeNS", 2],
          [Element.prototype, "hasAttributeNS", 2],
          [Element.prototype, "setAttributeNS", 3],
          [Element.prototype, "removeAttributeNS", 2],
        ]) {
          if (typeof prototype[name] !== "function" || prototype[name].length !== length) {
            throw new Error(name + " has an invalid descriptor");
          }
        }

        const main = testDocument.querySelector("main");
        const attribute = testDocument.createAttributeNS("urn:test", "p:name");
        attribute.value = "before";
        if (
          attribute.ownerDocument !== testDocument ||
          attribute.ownerElement !== null ||
          attribute.namespaceURI !== "urn:test" ||
          attribute.prefix !== "p" ||
          attribute.localName !== "name"
        ) {
          throw new Error("createAttributeNS returned an invalid Attr");
        }
        main.setAttributeNodeNS(attribute);
        main.setAttributeNS("urn:test", "q:name", "after");
        if (
          main.getAttributeNS("urn:test", "name") !== "after" ||
          main.getAttributeNodeNS("urn:test", "name") !== attribute ||
          !main.hasAttributeNS("urn:test", "name") ||
          attribute.name !== "p:name" ||
          attribute.nodeValue !== "after"
        ) {
          throw new Error("namespace-aware attribute update is invalid");
        }

        main.setAttributeNS(undefined, "plain", "value");
        if (main.getAttributeNS(null, "plain") !== "value") {
          throw new Error("undefined namespace was not converted to null");
        }
        main.removeAttributeNS("urn:test", "name");
        if (main.getAttributeNodeNS("urn:test", "name") !== null) {
          throw new Error("removeAttributeNS did not remove the Attr");
        }

        let error = null;
        try {
          testDocument.createAttributeNS(null, "p:name");
        } catch (caught) {
          error = caught;
        }
        if (!(error instanceof DOMException) || error.name !== "NamespaceError") {
          throw new Error("createAttributeNS did not expose NamespaceError");
        }
      `,
    );
  });

  it("binds non-namespaced attribute methods", () => {
    const { engine, realm } = createTestRealm("<main></main>");

    evaluate(
      engine,
      realm,
      `
        for (const [prototype, name, length] of [
          [Document.prototype, "createAttribute", 1],
          [Element.prototype, "getAttributeNames", 0],
          [Element.prototype, "getAttributeNode", 1],
          [Element.prototype, "toggleAttribute", 1],
        ]) {
          if (typeof prototype[name] !== "function" || prototype[name].length !== length) {
            throw new Error(name + " has an invalid descriptor");
          }
        }

        const main = testDocument.querySelector("main");
        const attribute = testDocument.createAttribute("DATA^VALUE");
        attribute.value = "content";
        main.setAttributeNode(attribute);
        if (
          attribute.name !== "data^value" ||
          main.getAttributeNode("DATA^VALUE") !== attribute ||
          main.getAttributeNames().join(",") !== "data^value"
        ) {
          throw new Error("non-namespaced Attr lookup is invalid");
        }
        if (
          !main.toggleAttribute("FLAG", undefined) ||
          !main.hasAttribute("flag") ||
          main.toggleAttribute("flag", false) ||
          main.hasAttribute("flag")
        ) {
          throw new Error("toggleAttribute conversion is invalid");
        }

        let error = null;
        try {
          main.setAttribute("", "value");
        } catch (caught) {
          error = caught;
        }
        if (!(error instanceof DOMException) || error.name !== "InvalidCharacterError") {
          throw new Error("setAttribute did not expose InvalidCharacterError");
        }
      `,
    );
  });

  it("binds ParentNode and ChildNode mutation methods", () => {
    const { document, engine, realm } = createTestRealm(
      "<main><a></a><b></b><c></c></main>",
    );

    evaluate(
      engine,
      realm,
      `
        for (const [prototype, names] of [
          [Document.prototype, ["prepend", "append", "replaceChildren"]],
          [DocumentFragment.prototype, ["prepend", "append", "replaceChildren"]],
          [Element.prototype, ["before", "after", "replaceWith", "remove", "prepend", "append", "replaceChildren"]],
          [CharacterData.prototype, ["before", "after", "replaceWith", "remove"]],
          [DocumentType.prototype, ["before", "after", "replaceWith", "remove"]],
        ]) {
          for (const name of names) {
            if (typeof prototype[name] !== "function" || prototype[name].length !== 0) {
              throw new Error(name + " has an invalid descriptor");
            }
          }
        }
        for (const prototype of [Document.prototype, DocumentFragment.prototype, Element.prototype]) {
          if (typeof prototype.moveBefore !== "function" || prototype.moveBefore.length !== 2) {
            throw new Error("moveBefore has an invalid descriptor");
          }
        }

        const main = testDocument.querySelector("main");
        const first = main.children[0];
        const second = main.children[1];
        const third = main.children[2];
        second.before(third, second);
        second.after(first, second);
        second.replaceWith(first, "tail");
        main.prepend("head");
        main.append("foot");
        if (main.textContent !== "headtailfoot") {
          throw new Error("ChildNode mutation order is invalid");
        }
        main.replaceChildren(first, "replacement");
        first.remove();
        if (main.textContent !== "replacement" || main.children.length !== 0) {
          throw new Error("ParentNode replacement result is invalid");
        }

        const detached = testDocument.createElement("detached");
        let converted = false;
        detached.before({ toString() { converted = true; return "detached"; } });
        if (!converted) {
          throw new Error("detached ChildNode argument was not converted");
        }

        const moveParent = testDocument.createElement("section");
        const moveFirst = testDocument.createElement("i");
        const moveSecond = testDocument.createTextNode("moved");
        main.append(moveParent);
        moveParent.append(moveFirst, moveSecond);
        if (!main.isConnected || !moveParent.isConnected) {
          throw new Error("Node.isConnected is invalid");
        }
        if (moveParent.moveBefore(moveSecond, moveFirst) !== undefined ||
            moveParent.firstChild !== moveSecond) {
          throw new Error("moveBefore order or return value is invalid");
        }
        moveParent.moveBefore(moveFirst, undefined);
        let missingSecondArgumentThrew = false;
        try {
          moveParent.moveBefore(moveFirst);
        } catch (error) {
          missingSecondArgumentThrew = error instanceof TypeError;
        }
        if (!missingSecondArgumentThrew) {
          throw new Error("moveBefore accepted a missing second argument");
        }
        moveParent.remove();
      `,
    );

    expect(document.querySelector("main")?.textContent).toBe("replacement");
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
          document.baseURI !== "about:blank" ||
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

  it("parses HTML and XML through DOMParser in the engine realm", () => {
    const { engine, realm } = createTestRealm("");

    evaluate(
      engine,
      realm,
      `
        const parser = new DOMParser();
        const xml = parser.parseFromString("<root>value</root>", "text/xml");
        const xmlWithDoctype = parser.parseFromString(
          '<!DOCTYPE root SYSTEM "urn:test"><root/>',
          "text/xml",
        );
        const html = parser.parseFromString("<main>value</main>", "text/html");
        if (
          !(parser instanceof DOMParser) ||
          Object.prototype.toString.call(parser) !== "[object DOMParser]" ||
          !(xml instanceof Document) ||
          xml.contentType !== "text/xml" ||
          xml.documentElement.localName !== "root" ||
          xml.documentElement.tagName !== "root" ||
          xml.documentElement.textContent !== "value" ||
          xml.readyState !== "complete" ||
          !(xmlWithDoctype.doctype instanceof DocumentType) ||
          xmlWithDoctype.doctype.name !== "root" ||
          xmlWithDoctype.doctype.publicId !== "" ||
          xmlWithDoctype.doctype.systemId !== "urn:test" ||
          html.contentType !== "text/html" ||
          html.querySelector("main").textContent !== "value"
        ) {
          throw new Error("DOMParser binding is invalid");
        }
        for (const argumentsList of [[], ["<root />"]]) {
          try {
            parser.parseFromString(...argumentsList);
            throw new Error("missing DOMParser argument was accepted");
          } catch (error) {
            if (!(error instanceof TypeError)) {
              throw error;
            }
          }
        }
        try {
          DOMParser.prototype.parseFromString.call({}, "<root />", "text/xml");
          throw new Error("invalid DOMParser receiver was accepted");
        } catch (error) {
          if (!(error instanceof TypeError)) {
            throw error;
          }
        }
        const xhtml = parser.parseFromString(
          "<html xmlns='http://www.w3.org/1999/xhtml'></html>",
          "application/xhtml+xml",
        );
        const serializer = new XMLSerializer();
        if (
          !(serializer instanceof XMLSerializer) ||
          Object.prototype.toString.call(serializer) !== "[object XMLSerializer]" ||
          serializer.serializeToString(xml) !== "<root>value</root>"
        ) {
          throw new Error("XMLSerializer binding is invalid");
        }
        for (const serialize of [
          () => serializer.serializeToString(),
          () => serializer.serializeToString("<root />"),
          () => XMLSerializer.prototype.serializeToString.call({}, xml),
        ]) {
          try {
            serialize();
            throw new Error("invalid XMLSerializer call was accepted");
          } catch (error) {
            if (!(error instanceof TypeError)) {
              throw error;
            }
          }
        }
        try {
          xhtml.documentElement.innerHTML = "\uD800";
          throw new Error("invalid XML fragment was accepted");
        } catch (error) {
          if (
            !(error instanceof DOMException) ||
            error.name !== "SyntaxError" ||
            error.code !== DOMException.SYNTAX_ERR
          ) {
            throw error;
          }
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
