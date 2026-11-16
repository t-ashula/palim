import { describe, expect, it } from "vitest";

import {
  HTMLAnchorElement,
  HTMLElement,
  HTMLInputElement,
  HTMLUnknownElement,
} from "../src/public-html-interfaces.js";
import { parseHTML, requireElement } from "./helper/dom.js";

describe("public HTML interfaces", () => {
  it("maps parsed elements to their public interfaces", () => {
    const document = parseHTML(
      "<a></a><input><main></main><unregistered></unregistered>",
    );

    expect(requireElement(document, "a")).toBeInstanceOf(HTMLAnchorElement);
    expect(requireElement(document, "input")).toBeInstanceOf(HTMLInputElement);
    expect(requireElement(document, "main")).toBeInstanceOf(HTMLElement);
    expect(requireElement(document, "unregistered")).toBeInstanceOf(
      HTMLUnknownElement,
    );
  });

  it("keeps HTML interfaces non-constructible", () => {
    expect(() =>
      Reflect.construct(HTMLAnchorElement as unknown as new () => object, []),
    ).toThrow(TypeError);
  });
});
