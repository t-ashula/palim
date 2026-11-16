import { describe, expect, it } from "vitest";

import {
  foreignAnchorRelList,
  isForeignAnchorElement,
} from "../../src/dom/foreign-anchor.js";
import { parseHTML } from "../helper/dom.js";

describe("foreign anchor relList", () => {
  it("reflects changes between the rel attribute and its stable DOMTokenList", () => {
    const document = parseHTML();
    const anchor = document.createElementNS("http://www.w3.org/2000/svg", "a");

    expect(isForeignAnchorElement(anchor)).toBe(true);

    const relList = foreignAnchorRelList(anchor);
    relList.add("noopener");

    expect(anchor.getAttribute("rel")).toBe("noopener");
    expect(foreignAnchorRelList(anchor)).toBe(relList);

    anchor.setAttribute("rel", "external");

    expect(Array.from(relList)).toEqual(["external"]);
  });

  it("rejects HTML anchor elements", () => {
    const document = parseHTML();

    expect(() => foreignAnchorRelList(document.createElement("a"))).toThrow(
      TypeError,
    );
  });
});
