import { DOMParser } from "@palim/core";
import type { Document, Element } from "@palim/core/internal/dom.js";
import { layoutDocument } from "@palim/css";
import { expect, test } from "vitest";

test("places blocks and wraps inline boxes using font advances", () => {
  const document = parse(
    '<main style="width: 40px; font-size: 10px"><div style="height: 20px"></div><span>12345</span><span>67890</span></main>',
  );
  const layout = layoutDocument(document, { width: 100, height: 200 });
  const div = required(document, "div");
  const spans = [...document.querySelectorAll("span")];
  expect(layout.fragments(div)[0]).toMatchObject({
    x: 0,
    y: 0,
    width: 40,
    height: 20,
  });
  expect(layout.fragments(requiredAt(spans, 0))[0]).toMatchObject({
    x: 0,
    y: 20,
    width: 25,
    height: 12,
  });
  expect(layout.fragments(requiredAt(spans, 1))[0]).toMatchObject({
    x: 0,
    y: 32,
    width: 25,
    height: 12,
  });
});

test("suppresses display none boxes", () => {
  const document = parse('<div style="display: none">hidden</div>');
  const div = required(document, "div");
  expect(
    layoutDocument(document, { width: 100, height: 100 }).fragments(div),
  ).toEqual([]);
});

function parse(source: string): Document {
  return new DOMParser().parseFromString(source, "text/html");
}
function required(document: Document, selector: string): Element {
  const element = document.querySelector(selector);
  if (element === null) {
    throw new TypeError(`Missing ${selector}`);
  }
  return element;
}

function requiredAt(elements: readonly Element[], index: number): Element {
  const element = elements[index];
  if (element === undefined) {
    throw new TypeError(`Missing element at ${String(index)}`);
  }
  return element;
}
