import { describe, expect, it } from "vitest";

import { DOMException, DOMParser } from "../src/index.js";
import type { Document, Element } from "../src/index.js";

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
