import { describe, expect, it } from "vitest";

import { expectDOMException } from "../../helper/assertions.js";
import {
  parseHTML as parse,
  requireElement as select,
} from "../../helper/dom.js";
import { HTMLTemplateElement } from "../../public-test-api.js";

describe("HTML fragment insertion", () => {
  it("uses the element and its ancestors as the innerHTML context", () => {
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

  it("sets template innerHTML without executing scripts", () => {
    const document = parse("<template id=target><p>old</p></template>");
    const target = select(document, "#target");
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

  it("uses the Document scripting mode for innerHTML", () => {
    const document = parse("<main id=target></main>");
    const target = select(document, "#target");

    target.innerHTML =
      '<noscript><p id="fallback">fallback</p></noscript><script>globalThis.palimConformanceExecuted = true</script>';

    expect(target.querySelector("#fallback")?.textContent).toBe("fallback");
    expect(target.querySelector("script")?.textContent).toBe(
      "globalThis.palimConformanceExecuted = true",
    );
    expect("palimConformanceExecuted" in globalThis).toBe(false);
  });

  it("uses the parent element as the outerHTML context", () => {
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
