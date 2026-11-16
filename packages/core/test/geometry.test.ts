import { describe, expect, test } from "vitest";

import { setDocumentGeometryProvider } from "../src/dom/nodes.js";
import { createDOMRectList } from "../src/geometry.js";
import {
  DOMRect,
  DOMRectList,
  DOMRectReadOnly,
} from "../src/public-dom-interfaces.js";
import { parseHTML, requireElement } from "./helper/dom.js";

describe("Geometry Interfaces", () => {
  test("DOMRectReadOnly derives edges from signed dimensions", () => {
    const rect = new DOMRectReadOnly(10, 20, -4, -6);

    expect(rect).toMatchObject({
      x: 10,
      y: 20,
      width: -4,
      height: -6,
      top: 14,
      right: 10,
      bottom: 20,
      left: 6,
    });
    expect(rect.toJSON()).toEqual({
      x: 10,
      y: 20,
      width: -4,
      height: -6,
      top: 14,
      right: 10,
      bottom: 20,
      left: 6,
    });
  });

  test("DOMRect is mutable and fromRect reads rectangle members", () => {
    const rect = DOMRect.fromRect({ x: 1, y: 2, width: 3, height: 4 });

    rect.x = 5;
    rect.height = -8;

    expect(rect).toMatchObject({
      x: 5,
      y: 2,
      width: 3,
      height: -8,
      top: -6,
      right: 8,
      bottom: 2,
      left: 5,
    });
    expect(DOMRectReadOnly.fromRect()).toMatchObject({
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    });
  });

  test("DOMRectList snapshots its input and exposes indexed iteration", () => {
    const rects = [new DOMRect(1, 2, 3, 4)];
    const list = createDOMRectList(rects);

    rects.push(new DOMRect(5, 6, 7, 8));

    expect(list).toBeInstanceOf(DOMRectList);
    expect(list.length).toBe(1);
    expect(list[0]).toBe(rects[0]);
    expect(list.item(0)).toBe(rects[0]);
    expect(list.item(1)).toBeNull();
    expect([...list]).toEqual([rects[0]]);
    expect(() =>
      Reflect.construct(DOMRectList as unknown as new () => object, []),
    ).toThrow("Illegal constructor");
  });

  test("Element geometry uses its Document provider", () => {
    const document = parseHTML("<main></main>");
    const main = requireElement(document, "main");
    setDocumentGeometryProvider(document, {
      clientRects: () => [
        new DOMRect(10, 20, 30, 40),
        new DOMRect(50, 15, 10, 5),
      ],
      elementsFromPoint: () => [main],
    });

    expect([...main.getClientRects()]).toHaveLength(2);
    expect(main.getBoundingClientRect()).toMatchObject({
      x: 10,
      y: 15,
      width: 50,
      height: 45,
    });
    expect(document.elementFromPoint(10, 20)).toBe(main);
    expect(document.elementsFromPoint(10, 20)).toEqual([main]);
  });
});
