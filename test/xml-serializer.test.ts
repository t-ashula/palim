import { describe, expect, it } from "vitest";

import { DOMException, DOMParser } from "../src/index.js";
import type { Document, Element } from "../src/index.js";

const XHTML_NAMESPACE = "http://www.w3.org/1999/xhtml";

function parse(input: string): Document {
  return new DOMParser().parseFromString(input, "application/xml");
}

function root(document: Document): Element {
  const element = document.documentElement;
  if (element === null) {
    throw new Error("missing document element");
  }
  return element;
}

describe("XML fragment serialization", () => {
  it("serializes XML contents through the existing markup getters", () => {
    const element = root(
      parse(
        '<root xmlns="urn:root"><child value="&quot;&amp;">&lt;&amp;</child><empty /></root>',
      ),
    );

    expect(element.innerHTML).toBe(
      '<child xmlns="urn:root" value="&quot;&amp;">&lt;&amp;</child><empty xmlns="urn:root" />',
    );
    expect(element.outerHTML).toBe(
      '<root xmlns="urn:root"><child value="&quot;&amp;">&lt;&amp;</child><empty /></root>',
    );
  });

  it("parses innerHTML with the context namespace", () => {
    const element = root(parse('<root xmlns="urn:root" />'));

    element.innerHTML =
      '<child /><html:span xmlns:html="http://www.w3.org/1999/xhtml">text</html:span>';

    expect(element.firstElementChild?.namespaceURI).toBe("urn:root");
    expect(element.children.item(1)?.namespaceURI).toBe(XHTML_NAMESPACE);
    expect(element.innerHTML).toBe(
      '<child xmlns="urn:root" /><html:span xmlns:html="http://www.w3.org/1999/xhtml">text</html:span>',
    );
  });

  it("uses XML fragment parsing for outerHTML and insertAdjacentHTML", () => {
    const element = root(parse("<root><before /><target /><after /></root>"));
    const target = element.querySelector("target");
    if (target === null) {
      throw new Error("missing target");
    }

    target.insertAdjacentHTML("beforebegin", "<inserted />");
    target.outerHTML = "<replacement />";

    expect(element.innerHTML).toBe(
      "<before /><inserted /><replacement /><after />",
    );
  });

  it("throws SyntaxError without changing children for malformed fragments", () => {
    const element = root(parse("<root><existing /></root>"));

    try {
      element.innerHTML = "<unclosed>";
      throw new Error("expected SyntaxError");
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(DOMException);
      expect((error as DOMException).name).toBe("SyntaxError");
    }
    expect(element.innerHTML).toBe("<existing />");
  });
});
