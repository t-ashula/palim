import { describe, expect, it } from "vitest";

import { selectionForDocument } from "../../src/dom/selection-implementation.js";
import { parseHTML as parse, requireElement } from "../helper/dom.js";
import { Text } from "../public-test-api.js";

describe("Selection", () => {
  it("keeps one live range and exposes forward and backward endpoints", () => {
    const document = parse("<main>text</main>");
    const main = requireElement(document, "main");
    const data = main.firstChild;
    if (!(data instanceof Text)) {
      throw new Error("missing text node");
    }
    const selection = selectionForDocument(document);

    expect(selection.rangeCount).toBe(0);
    expect(selection.type).toBe("None");

    selection.setBaseAndExtent(data, 3, data, 1);
    expect(selection.direction).toBe("backward");
    expect(selection.anchorOffset).toBe(3);
    expect(selection.focusOffset).toBe(1);
    expect(selection.getRangeAt(0).toString()).toBe("ex");

    data.insertData(0, "A");
    expect(selection.anchorOffset).toBe(4);
    expect(selection.focusOffset).toBe(2);
    expect(selection.toString()).toBe("ex");
  });

  it("collapses, selects contents, and deletes through DOM mutation", () => {
    const document = parse("<main><span>one</span><b>two</b></main>");
    const main = requireElement(document, "main");
    const selection = selectionForDocument(document);

    selection.selectAllChildren(main);
    expect(selection.rangeCount).toBe(1);
    expect(selection.toString()).toBe("onetwo");
    selection.deleteFromDocument();
    expect(main.childNodes).toHaveLength(0);
    expect(selection.isCollapsed).toBe(true);

    selection.collapse(main, 0);
    expect(selection.type).toBe("Caret");
    selection.removeAllRanges();
    expect(selection.anchorNode).toBeNull();
    expect(selection.type).toBe("None");
  });
});
