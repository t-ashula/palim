import { describe, expect, it } from "vitest";

import {
  HTML_NAMESPACE,
  MATHML_NAMESPACE,
  SVG_NAMESPACE,
  XLINK_NAMESPACE,
  XML_NAMESPACE,
  XMLNS_NAMESPACE,
} from "../src/namespaces.js";

describe("namespace constants", () => {
  it("uses the namespace URLs required by DOM and HTML", () => {
    expect({
      html: HTML_NAMESPACE,
      mathml: MATHML_NAMESPACE,
      svg: SVG_NAMESPACE,
      xlink: XLINK_NAMESPACE,
      xml: XML_NAMESPACE,
      xmlns: XMLNS_NAMESPACE,
    }).toEqual({
      html: "http://www.w3.org/1999/xhtml",
      mathml: "http://www.w3.org/1998/Math/MathML",
      svg: "http://www.w3.org/2000/svg",
      xlink: "http://www.w3.org/1999/xlink",
      xml: "http://www.w3.org/XML/1998/namespace",
      xmlns: "http://www.w3.org/2000/xmlns/",
    });
  });
});
