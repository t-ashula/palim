import { describe, expect, it } from "vitest";

import { parseHTML as parse } from "../helper/dom.js";

function implementationMemberNames(value: object): string[] {
  const names = new Set<string>();
  let current: object | null = value;
  while (current !== null && current !== Object.prototype) {
    for (const name of Object.getOwnPropertyNames(current)) {
      if (name.startsWith("_")) {
        names.add(name);
      }
    }
    current = Object.getPrototypeOf(current) as object | null;
  }
  return [...names];
}

describe("DOM interface binding", () => {
  it.each([
    ["Document", (document: ReturnType<typeof parse>) => document],
    [
      "Element",
      (document: ReturnType<typeof parse>) => document.querySelector("main"),
    ],
    [
      "Attr",
      (document: ReturnType<typeof parse>) =>
        document.querySelector("main")?.attributes.item(0),
    ],
    [
      "Text",
      (document: ReturnType<typeof parse>) =>
        document.querySelector("main")?.firstChild,
    ],
  ])("does not expose implementation members on %s", (_, selectObject) => {
    const object = selectObject(parse('<main id="root">content</main>'));
    if (object === null || object === undefined) {
      throw new Error("missing DOM object");
    }

    expect(implementationMemberNames(object)).toEqual([]);
  });
});
