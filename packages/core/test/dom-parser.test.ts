import { describe, expect, it } from "vitest";

import { expectDOMException } from "./helper/assertions.js";
import { parseHTML as parse } from "./helper/dom.js";
import { DOMParser } from "./public-test-api.js";

describe("Document dynamic markup insertion", () => {
  it("uses one parser session across open, write, writeln, and close", () => {
    const document = parse("<p>old</p>");

    expect(document.open()).toBe(document);
    document.write("<!doctype html><main><p>one");
    expect(document.querySelector("main")?.textContent).toBe("one");

    document.writeln("</p><p>two</p></main>");
    document.close();

    expect(document.querySelector("p")?.textContent).toBe("one");
    expect(document.querySelectorAll("p").item(1)?.textContent).toBe("two");
  });

  it("appends one-character writes to the active parser input", () => {
    const document = parse("<p>old</p>");
    const input =
      '<!doctype html public "identifier" "system"><!--note-->' +
      "<main>A&amp;B</main><svg><![CDATA[C]]></svg>";

    document.open();
    for (const character of input) {
      document.write(character);
    }
    document.close();

    expect(document.doctype?.name).toBe("html");
    expect(document.doctype?.publicId).toBe("identifier");
    expect(document.doctype?.systemId).toBe("system");
    expect(document.childNodes.item(1)?.nodeValue).toBe("note");
    expect(document.querySelector("main")?.textContent).toBe("A&B");
    expect(document.querySelector("svg")?.textContent).toBe("C");
  });

  it("implicitly opens a closed document without executing scripts", () => {
    const document = parse("<p>old</p>");

    document.write(
      '<script>document.body.setAttribute("data-ran", "yes")</script>',
      "<p>new</p>",
    );
    document.close();

    expect(document.body?.getAttribute("data-ran")).toBeNull();
    expect(document.querySelector("p")?.textContent).toBe("new");
  });

  it("rejects dynamic markup insertion for XML documents", () => {
    const document = new DOMParser().parseFromString(
      "<root />",
      "application/xml",
    );

    expectDOMException(() => document.open(), "InvalidStateError");
    expectDOMException(() => {
      document.write("<next />");
    }, "InvalidStateError");
  });
});
