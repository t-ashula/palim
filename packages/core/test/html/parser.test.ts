import { describe, expect, it } from "vitest";

import { parseHTML } from "../helper/dom.js";

describe("HTML parser", () => {
  it("continues with siblings after a style raw text element", () => {
    const document = parseHTML(
      '<body><style>@import url(/dummy.css)</style><script id="script">document.x = 8</script><main id="following"></main></body>',
    );
    const style = document.querySelector("style");
    const script = document.querySelector("#script");
    const following = document.querySelector("#following");

    expect(document.body?.children.length).toBe(3);
    expect(style?.parentElement).toBe(document.body);
    expect(style?.nextElementSibling).toBe(script);
    expect(style?.textContent).toBe("@import url(/dummy.css)");
    expect(script?.textContent).toBe("document.x = 8");
    expect(script?.nextElementSibling).toBe(following);
  });
});
