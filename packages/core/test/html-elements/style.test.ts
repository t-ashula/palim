import { describe, expect, it } from "vitest";

import { parseHTML, requireElement } from "../helper/dom.js";
import type { HTMLElement } from "../public-test-api.js";

function styledElement(style = ""): HTMLElement {
  return requireElement(
    parseHTML(`<main style="${style}"></main>`),
    "main",
  ) as HTMLElement;
}

describe("HTMLElement style", () => {
  it("drops unsupported color values and reflects supported changes", () => {
    const element = styledElement(
      "color: red; background-color: #00ff00; color: unknown-color",
    );

    expect(element.style.cssText).toBe(
      "color: red; background-color: #00ff00;",
    );
    expect(element.style.color).toBe("red");
    expect(element.style.backgroundColor).toBe("#00ff00");

    element.style.color = "transparent";
    element.style.backgroundColor = "blue";

    expect(element.getAttribute("style")).toBe(
      "color: transparent; background-color: blue;",
    );
  });

  it("preserves declaration order and important priority", () => {
    const element = styledElement(
      "unknown: value; display: none; visibility: hidden !important; display: block",
    );

    expect(element.style).toBe(element.style);
    expect(element.style.display).toBe("block");
    expect(element.style.visibility).toBe("hidden");
    expect(element.style.getPropertyPriority("visibility")).toBe("important");
    expect(element.style.length).toBe(2);
    expect(element.style.item(0)).toBe("visibility");
    expect(element.style[1]).toBe("display");

    expect(element.style.removeProperty("visibility")).toBe("hidden");
    expect(element.getAttribute("style")).toBe("display: block;");
  });

  it("keeps the declaration object synchronized with the style attribute", () => {
    const element = styledElement();
    const style = element.style;

    element.setAttribute("style", "display: none; --theme: dark;");
    expect(style.display).toBe("none");
    expect(style.getPropertyValue("--theme")).toBe("dark");

    style.setProperty("visibility", "hidden", "IMPORTANT");
    style.setProperty("display", "invalid-value");
    expect(style.display).toBe("none");
    expect(style.getPropertyPriority("visibility")).toBe("important");

    style.cssText = "float: left; display: grid;";
    expect(style.cssFloat).toBe("left");
    expect(style.float).toBe("left");
    expect(style.display).toBe("grid");
    expect(element.getAttribute("style")).toBe("float: left; display: grid;");

    element.style = "display: flex;";
    expect(style.display).toBe("flex");

    style.cssText = "";
    expect(element.getAttribute("style")).toBe("");
  });
});
