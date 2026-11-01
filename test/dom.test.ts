import { describe, expect, it } from "vitest";

import {
  Comment,
  DOMException,
  DOMParser,
  Document,
  DocumentFragment,
  Element,
  HTMLElement,
  HTMLSpanElement,
  HTMLTemplateElement,
  HTMLUnknownElement,
  Text,
} from "../src/index.js";

const HTML_NAMESPACE = "http://www.w3.org/1999/xhtml";
const XML_NAMESPACE = "http://www.w3.org/XML/1998/namespace";
const XMLNS_NAMESPACE = "http://www.w3.org/2000/xmlns/";
const XLINK_NAMESPACE = "http://www.w3.org/1999/xlink";

function parse(input: string): Document {
  return new DOMParser().parseFromString(input, "text/html");
}

function select(document: Document, selector: string): Element {
  const element = document.querySelector(selector);
  if (element === null) {
    throw new Error(`missing test element: ${selector}`);
  }
  return element;
}

function expectDOMException(operation: () => unknown, name: string): void {
  try {
    operation();
  } catch (error: unknown) {
    expect(error).toBeInstanceOf(DOMException);
    expect((error as DOMException).name).toBe(name);
    return;
  }
  throw new Error(`expected ${name}`);
}

describe("Document element creation", () => {
  it("creates HTML elements with normalized names and matching interfaces", () => {
    const document = parse("");
    const element = document.createElement("SpAn");
    const unknown = document.createElement("unregistered");
    const custom = document.createElement("palim-widget");
    const parsed = parse("<span></span>").querySelector("span");

    expect(element).toBeInstanceOf(HTMLSpanElement);
    expect(element.localName).toBe("span");
    expect(element.tagName).toBe("SPAN");
    expect(element.prefix).toBeNull();
    expect(element.namespaceURI).toBe(HTML_NAMESPACE);
    expect(element.ownerDocument).toBe(document);
    expect(element.parentNode).toBeNull();
    expect(unknown).toBeInstanceOf(HTMLUnknownElement);
    expect(custom).toBeInstanceOf(HTMLElement);
    expect(custom).not.toBeInstanceOf(HTMLUnknownElement);
    expect(element.constructor).toBe(parsed?.constructor);
  });

  it("uses the document type when createElement selects a namespace", () => {
    const parser = new DOMParser();
    const xml = parser.parseFromString("<root />", "application/xml");
    const xhtml = parser.parseFromString(
      `<html xmlns="${HTML_NAMESPACE}" />`,
      "application/xhtml+xml",
    );
    const standalone = new Document();

    const xmlElement = xml.createElement("MixedCase");
    const xhtmlElement = xhtml.createElement("span");
    const standaloneElement = standalone.createElement("MixedCase");

    expect(xmlElement).toBeInstanceOf(Element);
    expect(xmlElement).not.toBeInstanceOf(HTMLElement);
    expect(xmlElement.localName).toBe("MixedCase");
    expect(xmlElement.tagName).toBe("MixedCase");
    expect(xmlElement.namespaceURI).toBeNull();

    expect(xhtmlElement).toBeInstanceOf(HTMLSpanElement);
    expect(xhtmlElement.localName).toBe("span");
    expect(xhtmlElement.tagName).toBe("span");
    expect(xhtmlElement.namespaceURI).toBe(HTML_NAMESPACE);

    expect(standalone.contentType).toBe("application/xml");
    expect(standaloneElement.namespaceURI).toBeNull();
    expect(standaloneElement.localName).toBe("MixedCase");
  });

  it("converts and validates createElement local names", () => {
    const document = parse("");
    const createElement = document.createElement.bind(document) as unknown as (
      localName?: unknown,
    ) => Element;

    expect(createElement(null).localName).toBe("null");
    expect(createElement(undefined).localName).toBe("undefined");
    expect(createElement("article<draft").localName).toBe("article<draft");

    for (const invalidName of ["", "1article", "article draft", "a/b", "a>b"]) {
      expectDOMException(
        () => document.createElement(invalidName),
        "InvalidCharacterError",
      );
    }
    expect(() => createElement()).toThrow(TypeError);
  });

  it("creates namespaced elements and preserves qualified names", () => {
    const document = parse("");
    const html = document.createElementNS(HTML_NAMESPACE, "html:span");
    const foreign = document.createElementNS("urn:example", "p:item:part");
    const noNamespace = document.createElementNS("", "item");
    const createElementNS = document.createElementNS.bind(
      document,
    ) as unknown as (namespace?: unknown, qualifiedName?: unknown) => Element;

    expect(html).toBeInstanceOf(HTMLSpanElement);
    expect(html.prefix).toBe("html");
    expect(html.localName).toBe("span");
    expect(html.tagName).toBe("HTML:SPAN");
    expect(html.namespaceURI).toBe(HTML_NAMESPACE);

    expect(foreign).toBeInstanceOf(Element);
    expect(foreign).not.toBeInstanceOf(HTMLElement);
    expect(foreign.prefix).toBe("p");
    expect(foreign.localName).toBe("item:part");
    expect(foreign.tagName).toBe("p:item:part");
    expect(foreign.namespaceURI).toBe("urn:example");

    expect(noNamespace.namespaceURI).toBeNull();
    expect(createElementNS(undefined, "item").namespaceURI).toBeNull();
  });

  it("reports element name and namespace errors", () => {
    const document = parse("");

    expectDOMException(
      () => document.createElementNS("urn:example", "bad prefix:item"),
      "InvalidCharacterError",
    );
    expectDOMException(
      () => document.createElementNS("urn:example", "p:1item"),
      "InvalidCharacterError",
    );
    expectDOMException(
      () => document.createElementNS(null, "p:item"),
      "NamespaceError",
    );
    expectDOMException(
      () => document.createElementNS("urn:example", "xml:item"),
      "NamespaceError",
    );
    expectDOMException(
      () => document.createElementNS("urn:example", "xmlns"),
      "NamespaceError",
    );
    expectDOMException(
      () => document.createElementNS(XMLNS_NAMESPACE, "item"),
      "NamespaceError",
    );

    expect(
      document.createElementNS(XML_NAMESPACE, "xml:item").namespaceURI,
    ).toBe(XML_NAMESPACE);
    expect(
      document.createElementNS(XMLNS_NAMESPACE, "xmlns").namespaceURI,
    ).toBe(XMLNS_NAMESPACE);

    const createElementNS = document.createElementNS.bind(
      document,
    ) as unknown as (...arguments_: unknown[]) => Element;
    expect(() => createElementNS("urn:example")).toThrow(TypeError);
  });
});

describe("Document node creation", () => {
  it("creates text and comment nodes associated with the document", () => {
    const document = parse("");
    const text = document.createTextNode("content");
    const comment = document.createComment("note");

    expect(text).toBeInstanceOf(Text);
    expect(text.nodeType).toBe(3);
    expect(text.nodeName).toBe("#text");
    expect(text.data).toBe("content");
    expect(text.textContent).toBe("content");
    expect(text.ownerDocument).toBe(document);
    expect(text.parentNode).toBeNull();

    expect(comment).toBeInstanceOf(Comment);
    expect(comment.nodeType).toBe(8);
    expect(comment.nodeName).toBe("#comment");
    expect(comment.data).toBe("note");
    expect(comment.textContent).toBe("note");
    expect(comment.ownerDocument).toBe(document);
    expect(comment.parentNode).toBeNull();
  });

  it("converts character data and rejects omitted required arguments", () => {
    const document = parse("");
    const createTextNode = document.createTextNode.bind(
      document,
    ) as unknown as (data?: unknown) => Text;
    const createComment = document.createComment.bind(document) as unknown as (
      data?: unknown,
    ) => Comment;

    expect(createTextNode(null).data).toBe("null");
    expect(createTextNode(undefined).data).toBe("undefined");
    expect(createComment(null).data).toBe("null");
    expect(createComment(undefined).data).toBe("undefined");
    expect(() => createTextNode()).toThrow(TypeError);
    expect(() => createComment()).toThrow(TypeError);
  });

  it("creates an empty document fragment associated with the document", () => {
    const document = parse("");
    const fragment = document.createDocumentFragment();

    expect(fragment).toBeInstanceOf(DocumentFragment);
    expect(fragment.nodeType).toBe(11);
    expect(fragment.nodeName).toBe("#document-fragment");
    expect(fragment.ownerDocument).toBe(document);
    expect(fragment.parentNode).toBeNull();
    expect(fragment.childNodes.length).toBe(0);
    expect(fragment.children.length).toBe(0);
  });
});

describe("Element attributes", () => {
  it("gets, sets, toggles, and removes attributes", () => {
    const document = parse('<main id="root" data-value="initial"></main>');
    const element = select(document, "main");
    const attribute = element.attributes.item(1);

    expect(element.getAttributeNames()).toEqual(["id", "data-value"]);
    expect(element.getAttribute("DATA-VALUE")).toBe("initial");
    expect(element.hasAttribute("DATA-VALUE")).toBe(true);

    element.setAttribute("DATA-VALUE", "updated");
    expect(element.getAttribute("data-value")).toBe("updated");
    expect(element.attributes.item(1)).toBe(attribute);
    expect(attribute?.value).toBe("updated");

    element.setAttribute("hidden", "");
    expect(element.getAttributeNames()).toEqual(["id", "data-value", "hidden"]);
    expect(element.toggleAttribute("hidden")).toBe(false);
    expect(element.hasAttribute("hidden")).toBe(false);
    expect(element.toggleAttribute("hidden", true)).toBe(true);
    expect(element.getAttribute("hidden")).toBe("");
    expect(element.toggleAttribute("hidden", false)).toBe(false);

    element.removeAttribute("DATA-VALUE");
    expect(element.getAttribute("data-value")).toBeNull();
    expect(attribute?.ownerElement).toBeNull();
  });

  it("converts attribute values and rejects invalid names", () => {
    const element = select(parse("<main></main>"), "main");
    const value = {
      toString(): string {
        return "converted";
      },
    };
    const setAttribute = element.setAttribute.bind(element) as unknown as (
      name: unknown,
      value: unknown,
    ) => void;

    setAttribute("data-value", value);
    expect(element.getAttribute("data-value")).toBe("converted");
    expectDOMException(() => {
      element.setAttribute("not valid", "value");
    }, "InvalidCharacterError");
  });

  it("operates on namespaced attributes by namespace and local name", () => {
    const document = parse('<svg><a id="link" xlink:href="before"></a></svg>');
    const element = select(document, "#link");
    const attribute = element.attributes.item(1);

    expect(element.getAttributeNS(XLINK_NAMESPACE, "href")).toBe("before");
    expect(element.hasAttributeNS(XLINK_NAMESPACE, "href")).toBe(true);

    element.setAttributeNS(XLINK_NAMESPACE, "xlink:href", "after");
    expect(element.getAttribute("xlink:href")).toBe("after");
    expect(element.attributes.item(1)).toBe(attribute);

    element.removeAttributeNS(XLINK_NAMESPACE, "href");
    expect(element.getAttributeNS(XLINK_NAMESPACE, "href")).toBeNull();
    expect(attribute?.ownerElement).toBeNull();
  });
});

describe("Node mutation", () => {
  it("moves nodes with appendChild and updates live collections", () => {
    const document = parse(
      '<main><section id="first"><p></p></section><section id="second"></section></main>',
    );
    const main = select(document, "main");
    const first = select(document, "#first");
    const second = select(document, "#second");
    const paragraph = select(document, "p");
    const mainChildren = main.children;
    const firstChildren = first.childNodes;

    expect(second.appendChild(paragraph)).toBe(paragraph);
    expect(paragraph.parentNode).toBe(second);
    expect(firstChildren).toHaveLength(0);
    expect(second.firstChild).toBe(paragraph);
    expect(mainChildren).toHaveLength(2);
  });

  it("inserts, replaces, and removes child nodes", () => {
    const document = parse(
      '<main><section id="first"></section><section id="second"></section><section id="third"></section></main>',
    );
    const main = select(document, "main");
    const first = select(document, "#first");
    const second = select(document, "#second");
    const third = select(document, "#third");

    expect(main.insertBefore(third, first)).toBe(third);
    expect(Array.from(main.children)).toEqual([third, first, second]);

    expect(main.replaceChild(first, third)).toBe(third);
    expect(Array.from(main.children)).toEqual([first, second]);
    expect(third.parentNode).toBeNull();

    expect(main.removeChild(second)).toBe(second);
    expect(Array.from(main.children)).toEqual([first]);
    expect(second.parentNode).toBeNull();
  });

  it("adopts an inserted node and its descendants", () => {
    const targetDocument = parse("<main></main>");
    const sourceDocument = parse("<section><span></span></section>");
    const main = select(targetDocument, "main");
    const section = select(sourceDocument, "section");
    const span = select(sourceDocument, "span");

    main.appendChild(section);

    expect(section.ownerDocument).toBe(targetDocument);
    expect(span.ownerDocument).toBe(targetDocument);
    expect(sourceDocument.querySelector("section")).toBeNull();
  });

  it("rejects invalid tree mutations", () => {
    const document = parse(
      '<main><section id="first"></section><section id="second"></section></main>',
    );
    const main = select(document, "main");
    const first = select(document, "#first");
    const body = document.body;
    if (body === null) {
      throw new Error("missing body");
    }

    expectDOMException(() => first.appendChild(main), "HierarchyRequestError");
    expectDOMException(() => main.insertBefore(first, body), "NotFoundError");
    expectDOMException(() => main.removeChild(body), "NotFoundError");
  });
});

describe("HTML fragment insertion", () => {
  it("sets innerHTML using the element and its ancestors as context", () => {
    const document = parse(
      "<!doctype html><form><div id=target><span></span></div></form>",
    );
    const target = select(document, "#target");

    target.innerHTML = "<form id=nested></form><input id=control>";

    expect(target.querySelector("#nested")).toBeNull();
    expect(target.querySelector("#control")?.parentElement).toBe(target);
    expect(target.firstChild?.ownerDocument).toBe(document);

    const tableDocument = parse("<table id=table></table>");
    const table = select(tableDocument, "#table");
    table.innerHTML = "<tr id=row><td>cell</td></tr>";

    expect(table.firstElementChild?.localName).toBe("tbody");
    expect(table.querySelector("#row")?.parentElement?.localName).toBe("tbody");
    expect(table.textContent).toBe("cell");
  });

  it("sets innerHTML on template contents without executing scripts", () => {
    const document = parse("<template id=target><p>old</p></template>");
    const target = select(document, "#target");
    expect(target).toBeInstanceOf(HTMLTemplateElement);
    if (!(target instanceof HTMLTemplateElement)) {
      throw new Error("missing template element");
    }

    target.innerHTML =
      '<script id="script">globalThis.executed = true</script><button onclick="run()">button</button>';

    expect(target.childNodes).toHaveLength(0);
    expect(target.content.querySelector("#script")?.textContent).toBe(
      "globalThis.executed = true",
    );
    expect(
      target.content.querySelector("button")?.getAttribute("onclick"),
    ).toBe("run()");
  });

  it("parses innerHTML with scripting enabled without executing scripts", () => {
    const document = parse("<main id=target></main>");
    const target = select(document, "#target");

    target.innerHTML =
      '<noscript><p id="fallback">fallback</p></noscript><script>globalThis.palimConformanceExecuted = true</script>';

    expect(target.querySelector("#fallback")).toBeNull();
    expect(target.querySelector("noscript")?.textContent).toBe(
      '<p id="fallback">fallback</p>',
    );
    expect(target.querySelector("script")?.textContent).toBe(
      "globalThis.palimConformanceExecuted = true",
    );
    expect("palimConformanceExecuted" in globalThis).toBe(false);
  });

  it("sets outerHTML using the parent element as context", () => {
    const document = parse(
      "<table><tbody><tr id=old><td>old</td></tr></tbody></table>",
    );
    const oldRow = select(document, "#old");

    oldRow.outerHTML = '<tr id="new"><td>new</td></tr>';

    expect(oldRow.parentNode).toBeNull();
    const newRow = select(document, "#new");
    expect(newRow.parentElement?.localName).toBe("tbody");
    expect(newRow.textContent).toBe("new");
  });

  it("inserts HTML at each adjacent position", () => {
    const document = parse("<main><section id=target><i></i></section></main>");
    const target = select(document, "#target");

    target.insertAdjacentHTML("beforebegin", '<p id="before"></p>');
    target.insertAdjacentHTML("afterbegin", '<b id="first"></b>');
    target.insertAdjacentHTML("beforeend", '<b id="last"></b>');
    target.insertAdjacentHTML("afterend", '<p id="after"></p>');

    expect(
      [...select(document, "main").children].map((element) =>
        element.getAttribute("id"),
      ),
    ).toEqual(["before", "target", "after"]);
    expect([...target.children].map(({ localName }) => localName)).toEqual([
      "b",
      "i",
      "b",
    ]);
    expect(target.firstElementChild?.getAttribute("id")).toBe("first");
    expect(target.lastElementChild?.getAttribute("id")).toBe("last");
  });

  it("rejects invalid adjacent insertion", () => {
    const document = parse("<main><section></section></main>");
    const section = select(document, "section");

    expectDOMException(() => {
      section.insertAdjacentHTML("invalid", "<p></p>");
    }, "SyntaxError");

    section.remove();
    expectDOMException(() => {
      section.insertAdjacentHTML("beforebegin", "<p></p>");
    }, "NoModificationAllowedError");

    const html = document.documentElement;
    if (html === null) {
      throw new Error("missing document element");
    }
    expectDOMException(() => {
      html.outerHTML = "<html></html>";
    }, "NoModificationAllowedError");
  });
});
