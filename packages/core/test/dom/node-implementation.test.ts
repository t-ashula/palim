import { describe, expect, it } from "vitest";

import {
  documentImplementation,
  elementImplementation,
  nodeImplementation,
  nodeInterface,
} from "../../src/dom/node-implementation.js";
import { parseHTML, requireElement } from "../helper/dom.js";

describe("node implementations", () => {
  it("resolves interfaces and their stored implementation state", () => {
    const document = parseHTML("<main></main>");
    const element = requireElement(document, "main");

    expect(nodeInterface(nodeImplementation(element))).toBe(element);
    expect(elementImplementation(element).ownerDocument).toBe(
      documentImplementation(document),
    );
    expect(documentImplementation(document).contentType).toBe("text/html");
  });
});
