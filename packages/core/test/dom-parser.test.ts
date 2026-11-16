import { describe, expect, it } from "vitest";

import { expectDOMException } from "./helper/assertions.js";
import { DOMParser } from "./public-test-api.js";

function parse(input: string) {
  return new DOMParser().parseFromString(input, "text/html");
}

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
