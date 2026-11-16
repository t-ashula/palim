import { describe, expect, it } from "vitest";

import { DOMParser } from "../src/dom-parser.js";
import * as Core from "../src/index.js";
import { Document } from "../src/public-dom-interfaces.js";
import { HTMLAnchorElement } from "../src/public-html-interfaces.js";
import { URL } from "../src/url/index.js";

describe("core package exports", () => {
  it("preserves the identity of public constructors", () => {
    expect(Core.DOMParser).toBe(DOMParser);
    expect(Core.Document).toBe(Document);
    expect(Core.HTMLAnchorElement).toBe(HTMLAnchorElement);
    expect(Core.URL).toBe(URL);
  });
});
