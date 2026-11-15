import type { Document, Element } from "@palim/core";
import { DOMParser } from "@palim/core";
import { expect, test } from "vitest";

import { layoutDocument } from "../src/index.js";

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

test("does not create a line box for collapsible whitespace", () => {
  const document = parse('<body>\n<div style="height: 20px"></div>\n</body>');
  const layout = layoutDocument(document, { width: 100, height: 100 });
  expect(layout.fragments(required(document, "body"))[0]).toMatchObject({
    height: 20,
  });
  expect(
    layout.elementsFromPoint(10, 20).map((element) => element.localName),
  ).toEqual(["html"]);
});

test("hit tests normal-flow boxes from front to back", () => {
  const document = parse(
    '<main style="width: 100px; height: 100px"><div style="width: 80px; height: 80px"><span>front</span></div><p style="width: 40px; height: 40px"></p></main>',
  );
  const layout = layoutDocument(document, { width: 100, height: 100 });
  const root = required(document, "html");
  const body = required(document, "body");
  const main = required(document, "main");
  const div = required(document, "div");
  const span = required(document, "span");
  const paragraph = required(document, "p");

  expect(
    layout.elementsFromPoint(10, 10).map((element) => element.localName),
  ).toEqual([
    span.localName,
    div.localName,
    main.localName,
    body.localName,
    root.localName,
  ]);
  expect(
    layout.elementsFromPoint(10, 90).map((element) => element.localName),
  ).toEqual([
    paragraph.localName,
    main.localName,
    body.localName,
    root.localName,
  ]);
  expect(layout.elementsFromPoint(-1, 10)).toEqual([]);
  expect(layout.elementsFromPoint(101, 10)).toEqual([]);
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
