import { describe, expect, it } from "vitest";

import {
  Comment,
  Document,
  Element,
  Event,
  Text,
} from "../src/public-dom-interfaces.js";
import { parseHTML, requireElement } from "./helper/dom.js";

describe("public DOM interfaces", () => {
  it("recognizes DOM values created by the implementation", () => {
    const document = parseHTML("<main>text</main>");
    const element = requireElement(document, "main");

    expect(document).toBeInstanceOf(Document);
    expect(element).toBeInstanceOf(Element);
    expect(element.firstChild).toBeInstanceOf(Text);
    expect(new Comment("note")).toBeInstanceOf(Comment);
    expect(new Event("ready")).toBeInstanceOf(Event);
  });

  it("exposes Web IDL constructor lengths", () => {
    expect(Document.length).toBe(0);
    expect(Comment.length).toBe(0);
    expect(Event.length).toBe(1);
  });
});
