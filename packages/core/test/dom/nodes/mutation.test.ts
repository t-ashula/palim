import { describe, expect, it } from "vitest";

import { documentImplementation } from "../../../src/dom/node-implementation.js";
import { setDocumentURL } from "../../../src/dom/nodes.js";
import { associateDOMParser } from "../../../src/dom-parser.js";
import { expectDOMException } from "../../helper/assertions.js";
import {
  parseHTML as parse,
  requireElement as select,
} from "../../helper/dom.js";
import { Document, DOMParser, Element, Text } from "../../public-test-api.js";

const HTML_NAMESPACE = "http://www.w3.org/1999/xhtml";

describe("Node mutation", () => {
  it("validates replaceChild hierarchy before child membership", () => {
    const document = new Document();
    const text = document.createTextNode("parent");

    expectDOMException(() => {
      text.replaceChild(
        document.createElement("replacement"),
        document.createElement("missing"),
      );
    }, "HierarchyRequestError");

    const target = document.implementation.createHTMLDocument("target");
    const source = document.implementation.createHTMLDocument("source");
    const oldDoctype = target.doctype;
    const newDoctype = source.doctype;
    if (oldDoctype === null || newDoctype === null) {
      throw new Error("missing doctype");
    }
    expect(target.replaceChild(newDoctype, oldDoctype)).toBe(oldDoctype);
    expect(target.doctype).toBe(newDoctype);

    const constrained = document.implementation.createHTMLDocument("title");
    const constrainedElement = constrained.documentElement;
    if (constrainedElement === null) {
      throw new Error("missing document element");
    }
    constrained.removeChild(constrainedElement);
    const comment = constrained.insertBefore(
      constrained.createComment("before"),
      constrained.doctype,
    );
    expectDOMException(() => {
      constrained.replaceChild(constrained.createElement("root"), comment);
    }, "HierarchyRequestError");
  });

  it("finds adjacent element siblings across non-element nodes", () => {
    const document = parse(
      "<main><section id=first></section>text<!--comment--><section id=second></section></main>",
    );
    const first = select(document, "#first");
    const second = select(document, "#second");
    const text = first.nextSibling;

    expect(first.previousElementSibling).toBeNull();
    expect(first.nextElementSibling).toBe(second);
    expect(second.previousElementSibling).toBe(first);
    expect(second.nextElementSibling).toBeNull();
    expect(text).toBeInstanceOf(Text);
    expect((text as Text).previousElementSibling).toBe(first);
    expect((text as Text).nextElementSibling).toBe(second);
  });

  it("appends nodes and strings to ParentNode objects", () => {
    const document = parse("<main><span></span></main>");
    const main = select(document, "main");
    const span = select(document, "span");
    const fragment = document.createDocumentFragment();

    fragment.append("fragment");
    main.append("before", span, fragment, "after");

    expect(main.textContent).toBe("beforefragmentafter");
    expect(main.children).toHaveLength(1);
    expect(main.firstElementChild).toBe(span);
    expect(fragment.childNodes).toHaveLength(0);

    const detached = new Document();
    const root = detached.createElement("root");
    detached.append(root);
    expect(detached.documentElement).toBe(root);
  });

  it("mutates ParentNode and ChildNode objects with nodes and strings", () => {
    const document = parse("<main><a></a><b></b><c></c></main>");
    const main = select(document, "main");
    const first = select(document, "a");
    const second = select(document, "b");
    const third = select(document, "c");

    second.before(third, second);
    expect(Array.from(main.children)).toEqual([first, third, second]);
    second.after(first, second);
    expect(Array.from(main.children)).toEqual([third, first, second]);
    second.replaceWith(first, "tail");
    expect(Array.from(main.children)).toEqual([third, first]);
    expect(main.textContent).toBe("tail");

    main.prepend("head");
    main.append("foot");
    expect(main.textContent).toBe("headtailfoot");
    main.replaceChildren(first, "replacement");
    expect(Array.from(main.childNodes)).toEqual([first, main.lastChild]);
    expect(main.textContent).toBe("replacement");
    first.remove();
    expect(main.children).toHaveLength(0);
  });

  it("moves Element and CharacterData nodes within the same tree", () => {
    const document = parse(
      "<main><section id=first></section><section id=second>text</section><section id=third></section></main>",
    );
    const main = select(document, "main");
    const first = select(document, "#first");
    const second = select(document, "#second");
    const third = select(document, "#third");
    const text = second.firstChild;
    if (!(text instanceof Text)) {
      throw new Error("missing text node");
    }

    expect(document.isConnected).toBe(true);
    expect(main.isConnected).toBe(true);
    main.moveBefore(third, first);
    expect(Array.from(main.children)).toEqual([third, first, second]);
    main.moveBefore(third, third);
    expect(Array.from(main.children)).toEqual([third, first, second]);
    main.moveBefore(text, null);
    expect(main.lastChild).toBe(text);
    expect(second.textContent).toBe("");

    const detachedRoot = document.createElement("div");
    const destination = detachedRoot.appendChild(
      document.createElement("section"),
    );
    const moved = detachedRoot.appendChild(document.createElement("p"));
    expect(detachedRoot.isConnected).toBe(false);
    destination.moveBefore(moved, null);
    expect(destination.firstChild).toBe(moved);

    const unrelated = document.createElement("div");
    expectDOMException(() => {
      unrelated.moveBefore(moved, null);
    }, "HierarchyRequestError");
    const hierarchyDocument = new Document();
    const doctype = hierarchyDocument.implementation.createDocumentType(
      "root",
      "",
      "",
    );
    const hierarchyRoot = hierarchyDocument.createElement("root");
    hierarchyDocument.appendChild(doctype);
    hierarchyDocument.appendChild(hierarchyRoot);
    expectDOMException(() => {
      hierarchyRoot.moveBefore(doctype, null);
    }, "HierarchyRequestError");
    expectDOMException(() => {
      first.moveBefore(second, third);
    }, "NotFoundError");
  });

  it("applies live Range and NodeIterator pre-remove updates during moves", () => {
    const document = parse(
      "<main><section id=old><i id=before></i><div id=target><b id=inner></b></div><i id=after></i></section><section id=destination></section></main>",
    );
    const oldParent = select(document, "#old");
    const target = select(document, "#target");
    const inner = select(document, "#inner");
    const after = select(document, "#after");
    const destination = select(document, "#destination");
    const range = document.createRange();
    range.setStart(inner, 0);
    range.setEnd(after, 0);
    const iterator = document.createNodeIterator(oldParent);
    expect(iterator.nextNode()).toBe(oldParent);
    expect(iterator.nextNode()).toBe(select(document, "#before"));
    expect(iterator.nextNode()).toBe(target);
    expect(iterator.nextNode()).toBe(inner);

    destination.moveBefore(target, null);

    expect(range.startContainer).toBe(oldParent);
    expect(range.endContainer).toBe(after);
    expect(iterator.nextNode()).toBe(after);
  });

  it("validates and replaces all Document children", () => {
    const document = new Document();
    const doctype = document.implementation.createDocumentType("root", "", "");
    const first = document.createElement("first");
    const second = document.createElement("second");
    document.appendChild(doctype);
    document.appendChild(first);

    document.replaceChildren(second);

    expect(document.childNodes).toHaveLength(1);
    expect(document.documentElement).toBe(second);
    expect(doctype.parentNode).toBeNull();
    expectDOMException(() => {
      document.append(document.createElement("third"));
    }, "HierarchyRequestError");
    expect(document.documentElement).toBe(second);
  });

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

  it("runs insertion and post-connection steps in tree order", () => {
    const document = parse("<main></main>");
    const main = select(document, "main");
    const fragment = document.createDocumentFragment();
    const section = document.createElement("section");
    const span = document.createElement("span");
    const aside = document.createElement("aside");
    section.id = "section";
    span.id = "span";
    aside.id = "aside";
    section.append(span);
    fragment.append(section, aside);
    const events: string[] = [];
    const implementation = documentImplementation(document);
    implementation.insertionSteps = (node) => {
      events.push(`insert:${(node as Element).id}`);
      if (node === section) {
        expect(section.parentNode).toBe(main);
        expect(aside.parentNode).toBeNull();
      }
    };
    implementation.postConnectionSteps = (node) => {
      events.push(`post:${(node as Element).id}`);
    };

    main.append(fragment);

    expect(events).toEqual([
      "insert:section",
      "insert:span",
      "insert:aside",
      "post:section",
      "post:span",
      "post:aside",
    ]);
  });

  it("runs insertion steps in shadow-including tree order", () => {
    const document = parse("<main></main>");
    const main = select(document, "main");
    const host = document.createElement("section");
    host.id = "host";
    const shadowRoot = host.attachShadow({ mode: "open" });
    const shadowChild = document.createElement("span");
    shadowChild.id = "shadow";
    shadowRoot.append(shadowChild);
    const lightChild = document.createElement("aside");
    lightChild.id = "light";
    host.append(lightChild);
    const events: string[] = [];
    documentImplementation(document).insertionSteps = (node) => {
      events.push(node instanceof Element ? node.id : node.nodeName);
    };

    main.append(host);

    expect(events).toEqual(["host", "#document-fragment", "shadow", "light"]);
  });

  it("runs post-connection steps when a shadow tree becomes connected", () => {
    const document = parse("<main></main>");
    const main = select(document, "main");
    const fragment = document.createDocumentFragment();
    const host = document.createElement("section");
    host.id = "host";
    const shadowRoot = host.attachShadow({ mode: "open" });
    const shadowChild = document.createElement("span");
    shadowChild.id = "shadow";
    shadowRoot.append(shadowChild);
    const lightChild = document.createElement("aside");
    lightChild.id = "light";
    host.append(lightChild);
    const events: string[] = [];
    documentImplementation(document).postConnectionSteps = (node) => {
      expect(node.isConnected).toBe(true);
      events.push(node instanceof Element ? node.id : node.nodeName);
    };

    fragment.append(host);

    expect(events).toEqual([]);

    main.append(fragment);

    expect(events).toEqual(["host", "#document-fragment", "shadow", "light"]);
  });

  it("runs removing steps in tree order after detaching the subtree", () => {
    const document = parse(
      "<main><section><span></span></section><aside></aside></main>",
    );
    const main = select(document, "main");
    const section = select(document, "section");
    const span = select(document, "span");
    const events: string[] = [];
    documentImplementation(document).removingSteps = (
      node,
      isSubtreeRoot,
      oldAncestor,
    ) => {
      events.push(
        `${node.nodeName}:${String(isSubtreeRoot)}:${oldAncestor.nodeName}`,
      );
      if (node === section) {
        expect(section.parentNode).toBeNull();
      }
      if (node === span) {
        expect(span.parentNode).toBe(section);
      }
    };

    section.remove();

    expect(events).toEqual(["SECTION:true:MAIN", "SPAN:false:MAIN"]);
    expect(main.firstElementChild?.localName).toBe("aside");
  });

  it("runs removing steps in shadow-including tree order", () => {
    const document = parse('<main id="main"></main>');
    const main = select(document, "main");
    const host = document.createElement("section");
    host.id = "host";
    const shadowRoot = host.attachShadow({ mode: "open" });
    const shadowChild = document.createElement("span");
    shadowChild.id = "shadow";
    shadowRoot.append(shadowChild);
    const lightChild = document.createElement("aside");
    lightChild.id = "light";
    host.append(lightChild);
    main.append(host);
    const events: string[] = [];
    documentImplementation(document).removingSteps = (
      node,
      isSubtreeRoot,
      oldAncestor,
    ) => {
      expect(node.isConnected).toBe(false);
      const label = node instanceof Element ? node.id : node.nodeName;
      events.push(
        `${label}:${String(isSubtreeRoot)}:${(oldAncestor as Element).id}`,
      );
    };

    host.remove();

    expect(events).toEqual([
      "host:true:main",
      "#document-fragment:false:main",
      "shadow:false:main",
      "light:false:main",
    ]);
  });

  it("does not run insertion or removing steps for an atomic move", () => {
    const document = parse("<main><section></section><aside></aside></main>");
    const main = select(document, "main");
    const section = select(document, "section");
    const aside = select(document, "aside");
    const events: string[] = [];
    const implementation = documentImplementation(document);
    implementation.insertionSteps = () => events.push("insert");
    implementation.removingSteps = () => events.push("remove");
    implementation.postConnectionSteps = () => events.push("post");

    main.moveBefore(aside, section);

    expect(Array.from(main.children)).toEqual([aside, section]);
    expect(events).toEqual([]);
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

describe("Document metadata", () => {
  it("exposes same-object live document element collections", () => {
    const document = parse(`
      <form id="form"></form>
      <img id="image">
      <a id="link" href=""></a><area id="area"><a id="no-href"></a>
      <script id="script"></script><embed id="embed">
      <svg><a id="foreign-link" href=""></a><script id="foreign-script"></script></svg>
    `);
    const ids = (collection: Iterable<Element>): string[] =>
      Array.from(collection, (element) => element.id);

    expect(ids(document.forms)).toEqual(["form"]);
    expect(ids(document.images)).toEqual(["image"]);
    expect(ids(document.links)).toEqual(["link"]);
    expect(ids(document.scripts)).toEqual(["script"]);
    expect(ids(document.embeds)).toEqual(["embed"]);
    expect(document.plugins).toBe(document.embeds);
    expect(document.forms).toBe(document.forms);

    const area = select(document, "#area");
    area.setAttribute("href", "");
    const form = document.createElement("form");
    document.body?.appendChild(form);

    expect(ids(document.links)).toEqual(["link", "area"]);
    expect(document.forms.length).toBe(2);
    form.remove();
    expect(document.forms.length).toBe(1);
  });

  it("gets an SVG document root through the legacy rootElement", () => {
    const svg = new DOMParser().parseFromString(
      '<svg xmlns="http://www.w3.org/2000/svg"></svg>',
      "image/svg+xml",
    );
    const prefixed = new DOMParser().parseFromString(
      '<p:svg xmlns:p="http://www.w3.org/2000/svg"></p:svg>',
      "image/svg+xml",
    );
    const xml = new DOMParser().parseFromString("<svg></svg>", "text/xml");

    expect(svg.rootElement).toBe(svg.documentElement);
    expect(prefixed.rootElement).toBe(prefixed.documentElement);
    expect(xml.rootElement).toBeNull();
    expect(parse("").rootElement).toBeNull();
  });

  it("gets the first HTML head child of an HTML root", () => {
    const foreignRootDocument = new Document();
    const foreignRoot = foreignRootDocument.createElementNS(
      "urn:example",
      "html",
    );
    foreignRootDocument.appendChild(foreignRoot);
    foreignRoot.appendChild(
      foreignRootDocument.createElementNS(HTML_NAMESPACE, "head"),
    );
    expect(foreignRootDocument.head).toBeNull();

    const document = new Document();
    const root = document.createElementNS(HTML_NAMESPACE, "html");
    const foreignHead = document.createElementNS("urn:example", "head");
    const head = document.createElementNS(HTML_NAMESPACE, "head");
    document.appendChild(root);
    root.append(foreignHead, head);

    expect(document.head).toBe(head);
  });

  it("gets the first HTML body or frameset child of an HTML root", () => {
    const foreignRootDocument = new Document();
    const foreignRoot = foreignRootDocument.createElementNS(
      "urn:example",
      "html",
    );
    foreignRootDocument.appendChild(foreignRoot);
    foreignRoot.appendChild(
      foreignRootDocument.createElementNS(HTML_NAMESPACE, "body"),
    );
    expect(foreignRootDocument.body).toBeNull();

    const document = new Document();
    const root = document.createElementNS(HTML_NAMESPACE, "html");
    const foreignBody = document.createElementNS("urn:example", "body");
    const frameset = document.createElementNS(HTML_NAMESPACE, "frameset");
    document.appendChild(root);
    root.append(foreignBody, frameset);

    expect(document.body).toBe(frameset);
  });

  it("sets, replaces, and validates the document body", () => {
    const document = parse("<main>content</main>");
    const oldBody = document.body;
    const body = document.createElement("body");
    document.body = body;

    expect(document.body).toBe(body);
    expect(oldBody?.parentNode).toBeNull();
    document.body = body;
    expect(document.body).toBe(body);

    expect(() => {
      document.body = "text" as unknown as Element;
    }).toThrow(TypeError);
    expectDOMException(() => {
      document.body = document.createElement("div");
    }, "HierarchyRequestError");
    expectDOMException(() => {
      document.body = null;
    }, "HierarchyRequestError");

    const empty = new Document();
    expectDOMException(() => {
      empty.body = empty.createElementNS(HTML_NAMESPACE, "body");
    }, "HierarchyRequestError");
  });

  it("appends a valid body value to a non-HTML document element", () => {
    const document = new DOMParser().parseFromString(
      '<svg xmlns="http://www.w3.org/2000/svg"></svg>',
      "image/svg+xml",
    );
    const body = document.createElementNS(HTML_NAMESPACE, "body");

    document.body = body;

    expect(document.documentElement?.lastChild).toBe(body);
    expect(document.body).toBeNull();
  });

  it("gets and sets the document title", () => {
    const document = parse(
      "<title>  Initial\n title\u00a0 </title><main></main>",
    );

    expect(document.title).toBe("Initial title\u00a0");
    document.title = "Updated title";
    expect(document.title).toBe("Updated title");
    expect(document.querySelector("title")?.textContent).toBe("Updated title");
  });

  it("reflects dir on the HTML document element", () => {
    const document = parse('<html dir="LTR"><head></head><body></body></html>');

    expect(document.dir).toBe("ltr");
    document.dir = "x-garbage";
    expect(document.dir).toBe("");
    expect(document.documentElement?.getAttribute("dir")).toBe("x-garbage");

    const xmlDocument = new DOMParser().parseFromString(
      '<root dir="rtl"></root>',
      "application/xml",
    );
    expect(xmlDocument.dir).toBe("");
    xmlDocument.dir = "ltr";
    expect(xmlDocument.documentElement?.getAttribute("dir")).toBe("rtl");
  });

  it("uses only the HTML title element in an HTML document", () => {
    const document = parse(
      "<svg><title>SVG title</title></svg><title>HTML title</title>",
    );

    expect(document.title).toBe("HTML title");
  });

  it("gets, creates, and sets a direct SVG title child", () => {
    const document = new DOMParser().parseFromString(
      '<svg xmlns="http://www.w3.org/2000/svg"><g><title>nested</title></g></svg>',
      "image/svg+xml",
    );

    expect(document.title).toBe("");
    document.title = "SVG title";
    expect(document.title).toBe("SVG title");
    expect(document.documentElement?.firstElementChild?.localName).toBe(
      "title",
    );
    expect(document.documentElement?.firstElementChild?.namespaceURI).toBe(
      "http://www.w3.org/2000/svg",
    );
  });

  it("ignores title assignment for a non-HTML, non-SVG root", () => {
    const document = new DOMParser().parseFromString(
      "<root><title>unchanged</title></root>",
      "application/xml",
    );

    expect(document.title).toBe("");
    document.title = "ignored";
    expect(document.querySelector("title")?.textContent).toBe("unchanged");
  });

  it("uses the frozen URL of the first base element with an href", () => {
    const document = parse("<main></main>");
    const head = document.head;
    if (head === null) {
      throw new Error("missing head");
    }
    setDocumentURL(document, "https://old.example/news/page.html");
    const firstWithoutHref = document.createElement("base");
    const firstWithHref = document.createElement("base");
    firstWithHref.setAttribute("href", "../articles/");
    const secondWithHref = document.createElement("base");
    secondWithHref.setAttribute("href", "../ignored/");
    head.append(firstWithoutHref, firstWithHref, secondWithHref);

    expect(document.baseURI).toBe("https://old.example/articles/");
    expect(select(document, "main").baseURI).toBe(
      "https://old.example/articles/",
    );

    setDocumentURL(document, "https://new.example/path/page.html");
    expect(document.baseURI).toBe("https://old.example/articles/");

    firstWithHref.setAttribute("href", "../updated/");
    expect(document.baseURI).toBe("https://new.example/updated/");

    firstWithoutHref.setAttribute("href", "/first/");
    expect(document.baseURI).toBe("https://new.example/first/");

    setDocumentURL(document, "https://latest.example/root/page.html");
    firstWithoutHref.remove();
    expect(document.baseURI).toBe("https://latest.example/updated/");
  });

  it("resolves DOMParser base URLs against its associated document", () => {
    const associatedDocument = parse("");
    setDocumentURL(
      associatedDocument,
      "https://example.test/path/document.html",
    );
    const parser = new DOMParser();
    associateDOMParser(parser, associatedDocument);

    const document = parser.parseFromString(
      '<!doctype html><base href="sub/">',
      "text/html",
    );

    expect(document.URL).toBe("https://example.test/path/document.html");
    expect(document.baseURI).toBe("https://example.test/path/sub/");
    expect(document.cloneNode(true).baseURI).toBe(
      "https://example.test/path/sub/",
    );
    expect(document.cloneNode(false).baseURI).toBe(
      "https://example.test/path/sub/",
    );
  });

  it("preserves DOMParser document metadata after an XML parse error", () => {
    const associatedDocument = parse("");
    setDocumentURL(
      associatedDocument,
      "https://example.test/path/document.html",
    );
    const parser = new DOMParser();
    associateDOMParser(parser, associatedDocument);

    const document = parser.parseFromString("<root>", "application/xml");

    expect(document.URL).toBe("https://example.test/path/document.html");
    expect(document.baseURI).toBe("https://example.test/path/document.html");
    expect(document.documentElement?.localName).toBe("parsererror");
  });

  it("falls back to the document URL for invalid and forbidden base URLs", () => {
    const document = parse("<main></main>");
    const head = document.head;
    if (head === null) {
      throw new Error("missing head");
    }
    setDocumentURL(document, "https://example.test/path/page.html");
    const base = document.createElement("base");
    head.appendChild(base);

    expect(document.baseURI).toBe("https://example.test/path/page.html");
    base.setAttribute("href", "data:text/plain,base");
    expect(document.baseURI).toBe("https://example.test/path/page.html");
    base.setAttribute("href", "javascript:void(0)");
    expect(document.baseURI).toBe("https://example.test/path/page.html");
    base.setAttribute("href", "http://[");
    expect(document.baseURI).toBe("https://example.test/path/page.html");
  });

  it("preserves the source base URL as a document clone override", () => {
    const document = parse("<main></main>");
    const head = document.head;
    if (head === null) {
      throw new Error("missing head");
    }
    setDocumentURL(document, "https://example.test/path/page.html");
    const base = document.createElement("base");
    base.setAttribute("href", "../articles/");
    head.appendChild(base);

    const clone = document.cloneNode() as Document;
    setDocumentURL(clone, "https://other.test/changed/page.html");

    expect(clone.baseURI).toBe("https://example.test/articles/");
  });
});
