import { describe, expect, it } from "vitest";

import { DOMParser, HTMLTemplateElement } from "../packages/palim/src/index.js";
import type { Document, Element } from "../packages/palim/src/index.js";

const XML_NAMESPACE = "http://www.w3.org/XML/1998/namespace";
const XMLNS_NAMESPACE = "http://www.w3.org/2000/xmlns/";

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

describe("HTML fragment serialization", () => {
  it("serializes contents and the element through the public getters", () => {
    const target = select(
      parse('<main id="target"><p title="value">text</p></main>'),
      "#target",
    );

    expect(target.innerHTML).toBe('<p title="value">text</p>');
    expect(target.outerHTML).toBe(
      '<main id="target"><p title="value">text</p></main>',
    );
  });

  it("escapes text and attribute values", () => {
    const target = select(
      parse(
        '<main id="target"><p title="&quot;&amp;&lt;&gt;&nbsp;">&quot;&amp;&lt;&gt;&nbsp;</p></main>',
      ),
      "#target",
    );

    expect(target.innerHTML).toBe(
      '<p title="&quot;&amp;&lt;&gt;&nbsp;">"&amp;&lt;&gt;&nbsp;</p>',
    );
  });

  it("serializes raw text element contents literally", () => {
    const document = parse(
      "<main><script>if (a < b && c > d) run()</script><style>a > b { color: red }</style></main>",
    );

    expect(select(document, "script").innerHTML).toBe(
      "if (a < b && c > d) run()",
    );
    expect(select(document, "style").innerHTML).toBe("a > b { color: red }");
  });

  it("omits contents and end tags for void elements", () => {
    const input = select(
      parse('<input id="target" value="a&amp;b">'),
      "#target",
    );

    expect(input.innerHTML).toBe("");
    expect(input.outerHTML).toBe('<input id="target" value="a&amp;b">');
  });

  it("serializes template contents", () => {
    const target = select(
      parse('<template id="target"><p title="a&amp;b">text</p></template>'),
      "#target",
    );
    expect(target).toBeInstanceOf(HTMLTemplateElement);

    expect(target.innerHTML).toBe('<p title="a&amp;b">text</p>');
    expect(target.outerHTML).toBe(
      '<template id="target"><p title="a&amp;b">text</p></template>',
    );
  });

  it("serializes foreign elements and namespaced attributes", () => {
    const document = parse(
      '<main id="target"><svg viewBox="0 0 10 10"><a xlink:href="#item"></a></svg><math><mi>x</mi></math></main>',
    );
    const target = select(document, "#target");
    const link = select(document, "svg a");
    link.setAttributeNS(XML_NAMESPACE, "xml:lang", "en");
    link.setAttributeNS(XMLNS_NAMESPACE, "xmlns:example", "urn:example");
    link.setAttributeNS("urn:example", "example:data", "a&b");

    expect(target.innerHTML).toBe(
      '<svg viewBox="0 0 10 10"><a xlink:href="#item" xml:lang="en" xmlns:example="urn:example" example:data="a&amp;b"></a></svg><math><mi>x</mi></math>',
    );
  });

  it("serializes comments and processing instructions", () => {
    const target = select(
      parse('<main id="target"><!--comment--><?target data?></main>'),
      "#target",
    );

    expect(target.innerHTML).toBe("<!--comment--><?target data?>");
  });

  it("reflects mutations and keeps attribute order stable", () => {
    const target = select(
      parse('<main id="target" data-first="1"></main>'),
      "#target",
    );
    target.setAttribute("data-second", "2");
    target.setAttribute("data-first", "updated");

    const expected =
      '<main id="target" data-first="updated" data-second="2"></main>';
    expect(target.outerHTML).toBe(expected);
    expect(target.outerHTML).toBe(expected);
  });

  it("serializes a detached element", () => {
    const target = select(
      parse('<main><section id="target"><p>text</p></section></main>'),
      "#target",
    );
    target.remove();

    expect(target.outerHTML).toBe('<section id="target"><p>text</p></section>');
  });
});
