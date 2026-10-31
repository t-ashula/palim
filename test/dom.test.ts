import { describe, expect, it } from "vitest";

import { DOMException, DOMParser, HTMLTemplateElement } from "../src/index.js";
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
