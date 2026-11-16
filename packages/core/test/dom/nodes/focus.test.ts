import { describe, expect, it } from "vitest";

import { parseHTML as parse } from "../../helper/dom.js";
import type { Document, HTMLElement } from "../../public-test-api.js";
import {
  Document as DocumentConstructor,
  FocusEvent,
} from "../../public-test-api.js";

function htmlElement(document: Document, selector: string): HTMLElement {
  const element = document.querySelector(selector);
  if (element === null || !("focus" in element)) {
    throw new Error(`missing HTMLElement: ${selector}`);
  }
  return element as HTMLElement;
}

describe("focus management", () => {
  it("updates the focused area and dispatches focus transition events", () => {
    const document = parse(
      '<button id="first"></button><button id="second"></button>',
    );
    const first = htmlElement(document, "#first");
    const second = htmlElement(document, "#second");
    const transitions: string[] = [];

    for (const element of [first, second]) {
      for (const type of ["blur", "focusout", "focus", "focusin"]) {
        element.addEventListener(type, (event) => {
          const related =
            event instanceof FocusEvent && event.relatedTarget === second
              ? "second"
              : event instanceof FocusEvent && event.relatedTarget === first
                ? "first"
                : "null";
          transitions.push(`${element.id}:${type}:${related}`);
        });
      }
    }

    first.focus();
    second.focus();

    expect(document.activeElement).toBe(second);
    expect(transitions).toEqual([
      "first:focus:null",
      "first:focusin:null",
      "first:blur:second",
      "first:focusout:second",
      "second:focus:first",
      "second:focusin:first",
    ]);

    second.blur();
    expect(document.activeElement).toBe(document.body);
  });

  it("rejects non-focusable, disabled, inert, and disconnected elements", () => {
    const document = parse(
      '<div id="plain"></div><button id="button"></button><div inert><input id="inert"></div>',
    );
    const plain = htmlElement(document, "#plain");
    const button = htmlElement(document, "#button");
    const inert = htmlElement(document, "#inert");

    plain.focus();
    expect(document.activeElement).toBe(document.body);
    inert.focus();
    expect(document.activeElement).toBe(document.body);

    button.focus();
    expect(document.activeElement).toBe(button);
    button.setAttribute("disabled", "");
    expect(document.activeElement).toBe(document.body);

    button.removeAttribute("disabled");
    button.focus();
    button.remove();
    expect(document.activeElement).toBe(document.body);
  });

  it("retargets activeElement across nested shadow roots", () => {
    const document = parse('<div id="outer"></div>');
    const outer = htmlElement(document, "#outer");
    const outerRoot = outer.attachShadow({ mode: "open" });
    const innerHost = document.createElement("div") as HTMLElement;
    const innerRoot = innerHost.attachShadow({ mode: "open" });
    const input = document.createElement("input") as HTMLElement;
    innerRoot.append(input);
    outerRoot.append(innerHost);

    input.focus();

    expect(document.activeElement).toBe(outer);
    expect(outerRoot.activeElement).toBe(innerHost);
    expect(innerRoot.activeElement).toBe(input);
  });

  it("retargets composed focus events to the shadow host", () => {
    const document = parse('<div id="host"></div>');
    const host = htmlElement(document, "#host");
    const root = host.attachShadow({ mode: "closed" });
    const input = document.createElement("input") as HTMLElement;
    root.append(input);
    const calls: string[] = [];

    host.addEventListener("focus", (event) => {
      calls.push(
        `host:${String(event.eventPhase)}:${String(event.target === host)}`,
      );
    });
    document.addEventListener(
      "focus",
      (event) => {
        calls.push(
          `document:${String(event.eventPhase)}:${String(event.target === host)}`,
        );
      },
      true,
    );

    input.focus();

    expect(calls).toEqual(["document:1:true", "host:2:true"]);
    expect(document.activeElement).toBe(host);
    expect(root.activeElement).toBe(input);
    expect(host.shadowRoot).toBeNull();
  });

  it("delegates host focus and keeps slotted focus outside ShadowRoot", () => {
    const document = parse('<div id="host"><input id="slotted"></div>');
    const host = htmlElement(document, "#host");
    const slotted = htmlElement(document, "#slotted");
    const root = host.attachShadow({ mode: "open", delegatesFocus: true });
    const delegated = document.createElement("input") as HTMLElement;
    const slot = document.createElement("slot");
    root.append(delegated, slot);

    expect(root.delegatesFocus).toBe(true);
    host.focus();
    expect(document.activeElement).toBe(host);
    expect(root.activeElement).toBe(delegated);

    slotted.focus();
    expect(document.activeElement).toBe(slotted);
    expect(root.activeElement).toBeNull();
  });

  it("matches focus selectors from the focus chain", () => {
    const document = parse('<div id="host"></div>');
    const host = htmlElement(document, "#host");
    const root = host.attachShadow({ mode: "open", delegatesFocus: true });
    const input = document.createElement("input") as HTMLElement;
    root.append(input);

    host.focus();

    expect(input.matches(":focus")).toBe(true);
    expect(host.matches(":focus")).toBe(true);
    expect(host.matches(":focus-within")).toBe(true);
  });

  it("preserves declarative delegatesFocus state", () => {
    const document = DocumentConstructor.parseHTMLUnsafe(
      '<div id="host"><template shadowrootmode="open" shadowrootdelegatesfocus><input></template></div>',
    );
    const host = htmlElement(document, "#host");

    expect(host.shadowRoot?.delegatesFocus).toBe(true);
    host.focus();
    expect(host.shadowRoot?.activeElement?.localName).toBe("input");
  });
});
