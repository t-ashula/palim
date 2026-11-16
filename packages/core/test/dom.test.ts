import { describe, expect, it } from "vitest";

import * as DOM from "../src/dom.js";
import { Event } from "../src/dom/events.js";
import { Document, Element } from "../src/dom/nodes.js";
import { DOMRect } from "../src/geometry.js";

describe("DOM module exports", () => {
  it("re-exports DOM implementations without replacing their identity", () => {
    expect(DOM.Event).toBe(Event);
    expect(DOM.Document).toBe(Document);
    expect(DOM.Element).toBe(Element);
    expect(DOM.DOMRect).toBe(DOMRect);
  });
});
