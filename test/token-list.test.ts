import { describe, expect, it } from "vitest";

import type { Element } from "../src/index.js";
import { DOMException, DOMParser, DOMTokenList } from "../src/index.js";

function element(input = "<main></main>"): Element {
  const document = new DOMParser().parseFromString(input, "text/html");
  const result = document.querySelector("main");
  if (result === null) {
    throw new Error("missing main element");
  }
  return result;
}

function expectDOMException(operation: () => unknown, name: string): void {
  try {
    operation();
  } catch (error: unknown) {
    expect(error).toBeInstanceOf(DOMException);
    expect((error as DOMException).name).toBe(name);
    return;
  }
  throw new Error(`expected ${name}`);
}

describe("DOMTokenList", () => {
  it("exposes a live class token list", () => {
    const target = element('<main class="first  second first"></main>');
    const list = target.classList;

    expect(list).toBeInstanceOf(DOMTokenList);
    expect(target.classList).toBe(list);
    expect(Array.from(list)).toEqual(["first", "second"]);
    expect(list[0]).toBe("first");
    expect(list.item(1)).toBe("second");
    expect(list.length).toBe(2);

    target.setAttribute("class", "external change");
    expect(Array.from(list)).toEqual(["external", "change"]);
  });

  it("updates the associated class attribute", () => {
    const target = element('<main class="first second"></main>');
    const list = target.classList;

    list.add("third", "first");
    expect(target.getAttribute("class")).toBe("first second third");
    list.remove("second");
    expect(list.value).toBe("first third");
    expect(list.toggle("first")).toBe(false);
    expect(list.toggle("fourth", true)).toBe(true);
    expect(list.replace("third", "fourth")).toBe(true);
    expect(Array.from(list)).toEqual(["fourth"]);

    list.value = "assigned tokens";
    expect(target.getAttribute("class")).toBe("assigned tokens");
    expect(list.toString()).toBe("assigned tokens");
  });

  it("does not create an absent attribute for an empty update", () => {
    const target = element();

    target.classList.remove("missing");

    expect(target.hasAttribute("class")).toBe(false);
  });

  it("validates tokens", () => {
    const list = element().classList;

    expectDOMException(() => {
      list.add("");
    }, "SyntaxError");
    expectDOMException(
      () => list.contains("two tokens"),
      "InvalidCharacterError",
    );
    expect(() => list.supports("token")).toThrow(TypeError);
  });
});
