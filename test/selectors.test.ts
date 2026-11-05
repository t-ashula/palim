import { describe, expect, it } from "vitest";

import type { Document } from "../src/index.js";
import {
  DocumentFragment,
  DOMException,
  DOMParser,
  Element,
  HTMLInputElement,
} from "../src/index.js";
import { expectDOMException } from "./helper/assertions.js";

const FIXTURE = `<!doctype html>
<html lang="en">
<head><title>selectors</title></head>
<body>
  <main id="Root" class="panel active" data-list="alpha beta" data-lang="en-US" data-code="PrefixMiddleSuffix">
    <section id="first" class="item featured" data-kind="primary">
      <span id="leaf-a" class="leaf"></span>
      <input id="control" type="text" required checked>
    </section>
    <section id="second" class="item">
      <span id="leaf-b" class="leaf"></span>
      <em id="only-em"></em>
    </section>
    <p id="empty"></p>
    <p id="nonempty">text</p>
    <p id="white-space-empty"> \n\t</p>
    <a id="link" href="/target"></a>
    <div id="language" lang="en-US" dir="rtl"><span id="language-child"></span></div>
    <div id="script-language" lang="sr-Cyrl-RS"></div>
    <input id="checked" type="checkbox" checked>
    <input id="unchecked" type="checkbox">
    <input id="indeterminate" type="checkbox">
    <details id="open-details" open></details>
    <div id="open-div" open></div>
    <svg>
      <linearGradient id="paint"></linearGradient>
      <use id="paint-use" xlink:href="#paint"></use>
    </svg>
    <div id="123" class="café"></div>
    <undefined id="undefined-element"></undefined>
    <null id="null-element"></null>
  </main>
</body>
</html>`;

function parse(input = FIXTURE): Document {
  return new DOMParser().parseFromString(input, "text/html");
}

function attribute(element: Element, name: string): string | null {
  for (const item of element.attributes) {
    if (item.name === name) {
      return item.value;
    }
  }
  return null;
}

function descendants(node: Document | DocumentFragment | Element): Element[] {
  const result: Element[] = [];
  const visit = (parent: Document | DocumentFragment | Element): void => {
    for (const child of parent.childNodes) {
      if (child instanceof Element) {
        result.push(child);
        visit(child);
      }
    }
  };
  visit(node);
  return result;
}

function byId(document: Document, id: string): Element {
  const element = descendants(document).find(
    (candidate) => attribute(candidate, "id") === id,
  );
  if (element === undefined) {
    throw new Error(`Missing fixture element: ${id}`);
  }
  return element;
}

describe("Selector API", () => {
  it("exposes querySelector and querySelectorAll on ParentNode", () => {
    const document = parse();
    const root = byId(document, "Root");
    const leafA = byId(document, "leaf-a");
    const leafB = byId(document, "leaf-b");

    expect(document.querySelector("main")).toBe(root);
    expect(root.querySelector(".leaf")).toBe(leafA);
    expect(Array.from(document.querySelectorAll(".leaf"))).toEqual([
      leafA,
      leafB,
    ]);
    expect(Array.from(document.querySelectorAll("#leaf-a, .leaf"))).toEqual([
      leafA,
      leafB,
    ]);
    expect(document.querySelector(".missing")).toBeNull();
    expect(document.querySelectorAll(".missing")).toHaveLength(0);
    expect(document.querySelectorAll(".leaf")).not.toBe(
      document.querySelectorAll(".leaf"),
    );
  });

  it("matches type, universal, ID, class, and attribute selectors", () => {
    const document = parse();
    const root = byId(document, "Root");

    expect(document.querySelector("main#Root.panel.active")).toBe(root);
    expect(root.querySelector("*")).toBe(byId(document, "first"));
    expect(document.querySelector("[data-list]")).toBe(root);
    expect(document.querySelector('[data-list="alpha beta"]')).toBe(root);
    expect(document.querySelector('[data-list~="beta"]')).toBe(root);
    expect(document.querySelector('[data-lang|="en"]')).toBe(root);
    expect(document.querySelector('[data-code^="Prefix"]')).toBe(root);
    expect(document.querySelector('[data-code$="Suffix"]')).toBe(root);
    expect(document.querySelector('[data-code*="Middle"]')).toBe(root);
    expect(document.querySelector('[data-kind="PRIMARY" i]')).toBe(
      byId(document, "first"),
    );
    expect(document.querySelector('[data-kind="PRIMARY" s]')).toBeNull();
  });

  it("matches combinators in tree order", () => {
    const document = parse();

    expect(document.querySelector("main .leaf")).toBe(byId(document, "leaf-a"));
    expect(document.querySelector("main > section")).toBe(
      byId(document, "first"),
    );
    expect(document.querySelector("#first + #second")).toBe(
      byId(document, "second"),
    );
    expect(document.querySelector("#first ~ #nonempty")).toBe(
      byId(document, "nonempty"),
    );
  });

  it("matches structural and logical pseudo-classes", () => {
    const document = parse();

    expect(document.querySelector(":root")).toBe(document.documentElement);
    expect(document.querySelector("section:first-child")).toBe(
      byId(document, "first"),
    );
    expect(document.querySelector("section:nth-child(2)")).toBe(
      byId(document, "second"),
    );
    expect(document.querySelector("p:nth-of-type(2)")).toBe(
      byId(document, "nonempty"),
    );
    expect(document.querySelector("em:only-of-type")).toBe(
      byId(document, "only-em"),
    );
    expect(document.querySelector("p:empty")).toBe(byId(document, "empty"));
    expect(document.querySelector("#white-space-empty:empty")).toBe(
      byId(document, "white-space-empty"),
    );
    expect(document.querySelector("section:not(.featured)")).toBe(
      byId(document, "second"),
    );
    expect(document.querySelector(":is(#missing, #first)")).toBe(
      byId(document, "first"),
    );
    expect(document.querySelector(":where(#second, #missing)")).toBe(
      byId(document, "second"),
    );
    expect(document.querySelector("section:has(> #leaf-a)")).toBe(
      byId(document, "first"),
    );
    expect(document.querySelector("section:has(+ #second)")).toBe(
      byId(document, "first"),
    );
    expect(document.querySelector("section:nth-child(2n)")).toBe(
      byId(document, "second"),
    );
    expect(document.querySelector("section:nth-child(-n+1)")).toBe(
      byId(document, "first"),
    );
    expect(document.querySelector("section:nth-child(1 of .featured)")).toBe(
      byId(document, "first"),
    );
    expect(document.querySelector(":is(:unknown, #first)")).toBe(
      byId(document, "first"),
    );
  });

  it("uses the ParentNode as the scoping root", () => {
    const document = parse();
    const root = byId(document, "Root");
    const first = byId(document, "first");

    expect(root.querySelector(":scope > section")).toBe(first);
    expect(root.querySelector(":scope")).toBeNull();

    const fragment = new DocumentFragment();
    expect(fragment.querySelector("*")).toBeNull();
    expect(fragment.querySelectorAll("*")).toHaveLength(0);
    expect(fragment.querySelector(":scope")).toBeNull();
  });

  it("keeps the outer scoping root inside :has()", () => {
    const document = parse(`
      <div class="ancestor">
        <div id="scope">
          <div id="candidate" class="child"><span class="descendant"></span></div>
        </div>
      </div>
      <select><option id="option"></option></select>
    `);
    const scope = byId(document, "scope");
    const candidate = byId(document, "candidate");
    const option = byId(document, "option");

    expect(scope.querySelectorAll(":has(:scope)")).toHaveLength(0);
    expect(scope.querySelector(".ancestor:has(:scope) .child")).toBe(candidate);
    expect(scope.querySelector(".child:has(:is(:scope .descendant))")).toBe(
      candidate,
    );
    expect(option.closest(":has(> :scope)")?.localName).toBe("select");
  });

  it("exposes matches and closest on Element", () => {
    const document = parse();
    const root = byId(document, "Root");
    const first = byId(document, "first");
    const leafA = byId(document, "leaf-a");

    expect(first.matches("section.item:first-child")).toBe(true);
    expect(first.matches("section:not(.featured)")).toBe(false);
    expect(first.matches(":scope")).toBe(true);
    expect(leafA.closest("span")).toBe(leafA);
    expect(leafA.closest(":scope")).toBe(leafA);
    expect(leafA.closest("section")).toBe(first);
    expect(leafA.closest("main")).toBe(root);
    expect(leafA.closest("article")).toBeNull();
  });

  it("applies CSS escapes and comments", () => {
    const document = parse();

    expect(document.querySelector("#\\31 23")).toBe(byId(document, "123"));
    expect(document.querySelector(".caf\\e9")).toBe(byId(document, "123"));
    expect(document.querySelector("main/**/>/**/section")).toBe(
      byId(document, "first"),
    );
  });

  it("applies HTML and foreign element case rules", () => {
    const document = parse();

    expect(document.querySelector("MAIN")).toBe(byId(document, "Root"));
    expect(document.querySelector("[DATA-KIND]")).toBe(byId(document, "first"));
    expect(document.querySelector("#root")).toBeNull();
    expect(document.querySelector(".PANEL")).toBeNull();
    expect(document.querySelector('input[type="TEXT"]')).toBe(
      byId(document, "control"),
    );
    expect(document.querySelector("linearGradient")).toBe(
      byId(document, "paint"),
    );
    expect(document.querySelector("lineargradient")).toBeNull();
    expect(document.querySelector("*|linearGradient")).toBe(
      byId(document, "paint"),
    );
    expect(document.querySelector("|linearGradient")).toBeNull();
    expect(document.querySelector("[href]")).toBe(byId(document, "link"));
    expect(document.querySelector("[*|href]")).toBe(byId(document, "link"));
    expect(byId(document, "paint-use").matches("[href]")).toBe(false);
    expect(byId(document, "paint-use").matches("[*|href]")).toBe(true);

    const quirksDocument = parse('<main id="Root" class="panel"></main>');
    expect(quirksDocument.querySelector("#root")).not.toBeNull();
    expect(quirksDocument.querySelector(".PANEL")).not.toBeNull();
  });

  it("matches host-language pseudo-classes without a browsing context", () => {
    const document = parse();
    const checked = byId(document, "checked");
    const unchecked = byId(document, "unchecked");
    const indeterminate = byId(document, "indeterminate");

    expect(document.querySelector("#language-child:lang(en)")).toBe(
      byId(document, "language-child"),
    );
    expect(document.querySelector("#language-child:dir(rtl)")).toBe(
      byId(document, "language-child"),
    );
    expect(document.querySelector(':lang("*-Cyrl")')).toBe(
      byId(document, "script-language"),
    );
    expect(document.querySelector(':lang("åå")')).toBeNull();
    expect(document.querySelector("a:any-link")).toBe(byId(document, "link"));
    expect(document.querySelector("input:required")).toBe(
      byId(document, "control"),
    );
    expect(document.querySelector("input:enabled")).toBe(
      byId(document, "control"),
    );
    expect(document.querySelector("input:checked")).toBe(checked);
    expect(document.querySelector("input:unchecked")).toBe(unchecked);
    expect(indeterminate).toBeInstanceOf(HTMLInputElement);
    (indeterminate as HTMLInputElement).indeterminate = true;
    expect(document.querySelector("input:indeterminate")).toBe(indeterminate);
    expect(document.querySelector("details:open")).toBe(
      byId(document, "open-details"),
    );
    expect(document.querySelector("div:open")).toBeNull();
    expect(document.querySelector(":hover")).toBeNull();
    expect(document.querySelector(":visited")).toBeNull();
    expect(document.querySelector("main::before")).toBeNull();
  });

  it("parses pseudo-compound selectors without returning pseudo-elements", () => {
    const document = parse();

    expect(document.querySelector("main::before:hover")).toBeNull();
    expect(document.querySelector("main::before::marker")).toBeNull();
    expect(document.querySelector("main::before:is(.item)")).toBeNull();
    expect(document.querySelector(":is(::before, #first)")).toBe(
      byId(document, "first"),
    );
    expect(document.querySelector("main:host(.panel)")).toBeNull();
  });

  it("applies Web IDL string conversion and required argument rules", () => {
    const document = parse();
    const querySelector = document.querySelector.bind(document) as unknown as (
      selectors?: unknown,
      ...extra: unknown[]
    ) => Element | null;

    expect(() => querySelector()).toThrow(TypeError);
    expect(querySelector(undefined)).toBe(byId(document, "undefined-element"));
    expect(querySelector(null)).toBe(byId(document, "null-element"));

    let converted = false;
    expect(
      querySelector({
        toString(): string {
          converted = true;
          return "#first";
        },
      }),
    ).toBe(byId(document, "first"));
    expect(converted).toBe(true);
    expect(querySelector("#second", "ignored")).toBe(byId(document, "second"));
    expect(() => querySelector(Symbol("selector"))).toThrow(TypeError);
  });

  it.each([
    "",
    ",div",
    "div,",
    "div,,span",
    "[",
    "[data-kind=",
    "#",
    "div >",
    "> div",
    ":unknown",
    "::unknown",
    "main::before > span",
    ":not()",
    ":not(:unknown, .item)",
    ":not(::before)",
    ":has(:has(.item))",
    ":has(::before)",
    ":nth-child(1 of ::before)",
    "main::before.item",
    "main::before:empty",
    "main::before:not(.item)",
    "main::before::after",
    "div || span",
    ":blank",
    ":closed",
    ":current",
    ":future",
    ":local-link",
    ":past",
    ":target-within",
    ":current(p)",
    ":nth-col(1)",
    ":nth-last-col(1)",
    ":state(selected)",
    "svg|linearGradient",
  ])("throws SyntaxError DOMException for invalid selector %j", (selector) => {
    const document = parse();

    const error = expectDOMException(() => {
      document.querySelector(selector);
    }, "SyntaxError");

    expect(error).toBeInstanceOf(globalThis.DOMException);
    expect(error.code).toBe(DOMException.SYNTAX_ERR);
  });
});
