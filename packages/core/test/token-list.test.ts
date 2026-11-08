import { describe, expect, it } from "vitest";

import type { Element } from "./public-test-api.js";
import { DOMParser, DOMTokenList } from "./public-test-api.js";
import { expectDOMException } from "./helper/assertions.js";

function element(input = "<main></main>"): Element {
  const document = new DOMParser().parseFromString(input, "text/html");
  const result = document.querySelector("main");
  if (result === null) {
    throw new Error("missing main element");
  }
  return result;
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
    expect(list.contains("two tokens")).toBe(false);
    expectDOMException(() => {
      list.add("two tokens");
    }, "InvalidCharacterError");
    expectDOMException(() => list.replace("two tokens", ""), "SyntaxError");
    expect(() => list.supports("token")).toThrow(TypeError);
  });

  it("preserves token order when replacing with an existing token", () => {
    const list = element('<main class="c b a"></main>').classList;

    expect(list.replace("c", "a")).toBe(true);
    expect(list.value).toBe("a b");
    list.value = "a a a b";
    expect(list.replace("a", "a")).toBe(true);
    expect(list.value).toBe("a b");
  });
});
