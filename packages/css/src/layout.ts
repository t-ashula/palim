import type { Document, Element } from "@palim/core/internal/dom.js";
import { setDocumentGeometryProvider } from "@palim/core/internal/dom/nodes.js";
import { DOMRect } from "@palim/core/internal/geometry.js";

import { computedStyle, invalidateComputedStyles } from "./computed-style.js";

export interface LayoutViewport {
  readonly width: number;
  readonly height: number;
}
export interface CSSBoxFragment {
  readonly element: Element;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly baseline: number;
}
export interface DocumentLayout {
  readonly viewport: LayoutViewport;
  fragments(element: Element): readonly CSSBoxFragment[];
  clientRects(element: Element): readonly DOMRect[];
}

const DOCUMENT_LAYOUTS = new WeakMap<Document, DocumentLayout>();

class LiveDocumentLayout implements DocumentLayout {
  constructor(
    readonly document: Document,
    readonly viewport: LayoutViewport,
  ) {}

  fragments(element: Element): readonly CSSBoxFragment[] {
    return layoutDocument(this.document, this.viewport).fragments(element);
  }

  clientRects(element: Element): readonly DOMRect[] {
    return layoutDocument(this.document, this.viewport).clientRects(element);
  }
}

export function updateDocumentLayout(
  document: Document,
  viewport: LayoutViewport,
): DocumentLayout {
  const layout = new LiveDocumentLayout(document, viewport);
  DOCUMENT_LAYOUTS.set(document, layout);
  setDocumentGeometryProvider(document, (element) =>
    layout.clientRects(element),
  );
  return layout;
}

export function documentLayout(document: Document): DocumentLayout | null {
  return DOCUMENT_LAYOUTS.get(document) ?? null;
}

class LayoutResult implements DocumentLayout {
  readonly #values = new Map<Element, CSSBoxFragment[]>();
  constructor(readonly viewport: LayoutViewport) {}
  add(value: CSSBoxFragment): void {
    const values = this.#values.get(value.element) ?? [];
    values.push(value);
    this.#values.set(value.element, values);
  }
  fragments(element: Element): readonly CSSBoxFragment[] {
    return this.#values.get(element) ?? [];
  }
  clientRects(element: Element): readonly DOMRect[] {
    return this.fragments(element).map(
      ({ x, y, width, height }) => new DOMRect(x, y, width, height),
    );
  }
}

interface FontMetrics {
  readonly ascent: number;
  readonly descent: number;
  readonly lineGap: number;
  advance(text: string): number;
}
class BuiltinFontMetrics implements FontMetrics {
  readonly ascent: number;
  readonly descent: number;
  readonly lineGap: number;
  constructor(readonly size: number) {
    this.ascent = size * 0.8;
    this.descent = size * 0.2;
    this.lineGap = size * 0.2;
  }
  advance(text: string): number {
    let result = 0;
    for (const character of text) {
      result += /\s/u.test(character)
        ? this.size * 0.25
        : (character.codePointAt(0) ?? 0) > 0xff
          ? this.size
          : this.size * 0.5;
    }
    return result;
  }
}

export function layoutDocument(
  document: Document,
  viewport: LayoutViewport,
): DocumentLayout {
  invalidateComputedStyles(document);
  const result = new LayoutResult(viewport);
  if (document.documentElement !== null) {
    layoutBlock(document.documentElement, 0, 0, viewport.width, result);
  }
  return result;
}

function layoutBlock(
  element: Element,
  x: number,
  y: number,
  availableWidth: number,
  result: LayoutResult,
): number {
  const style = computedStyle(element);
  if (style.display === "none") {
    return 0;
  }
  const margin = edges(style, "margin");
  const padding = edges(style, "padding");
  const border = borderEdges(style);
  const width =
    length(style.width) ??
    Math.max(
      0,
      availableWidth -
        margin.left -
        margin.right -
        padding.left -
        padding.right -
        border.left -
        border.right,
    );
  const boxX = x + margin.left;
  const contentX = boxX + border.left + padding.left;
  const contentY = y + margin.top + border.top + padding.top;
  const contentHeight =
    length(style.height) ??
    layoutChildren(element, contentX, contentY, width, result);
  const boxWidth =
    width + padding.left + padding.right + border.left + border.right;
  const boxHeight =
    contentHeight + padding.top + padding.bottom + border.top + border.bottom;
  const metrics = fontMetrics(element);
  result.add({
    element,
    x: boxX,
    y: y + margin.top,
    width: boxWidth,
    height: boxHeight,
    baseline: contentY + metrics.ascent,
  });
  return margin.top + boxHeight + margin.bottom;
}

function layoutChildren(
  element: Element,
  x: number,
  y: number,
  width: number,
  result: LayoutResult,
): number {
  let cursorY = y;
  let cursorX = x;
  let lineHeight = 0;
  for (const node of element.childNodes) {
    if (node.nodeType === 1) {
      const child = node as Element;
      const style = computedStyle(child);
      if (style.display === "none") {
        continue;
      }
      if (style.display === "block") {
        if (cursorX !== x) {
          cursorY += lineHeight;
          cursorX = x;
          lineHeight = 0;
        }
        cursorY += layoutBlock(child, x, cursorY, width, result);
        continue;
      }
      const metrics = fontMetrics(child);
      const childWidth = metrics.advance(
        normalizeText(child.textContent ?? "", style["white-space"]),
      );
      const childHeight = usedLineHeight(style["line-height"], metrics);
      if (cursorX > x && cursorX + childWidth > x + width) {
        cursorY += lineHeight;
        cursorX = x;
        lineHeight = 0;
      }
      result.add({
        element: child,
        x: cursorX,
        y: cursorY,
        width: childWidth,
        height: childHeight,
        baseline: cursorY + metrics.ascent,
      });
      cursorX += childWidth;
      lineHeight = Math.max(lineHeight, childHeight);
    } else if (node.nodeType === 3) {
      const metrics = fontMetrics(element);
      const text = normalizeText(
        node.nodeValue ?? "",
        computedStyle(element)["white-space"],
      );
      for (const segment of text.match(/\S+\s*|\s+/gu) ?? []) {
        const advance = metrics.advance(segment);
        if (cursorX > x && cursorX + advance > x + width) {
          cursorY += lineHeight;
          cursorX = x;
          lineHeight = 0;
        }
        cursorX += advance;
        lineHeight = Math.max(
          lineHeight,
          usedLineHeight(computedStyle(element)["line-height"], metrics),
        );
      }
    }
  }
  return cursorY + lineHeight - y;
}

function fontMetrics(element: Element): FontMetrics {
  return new BuiltinFontMetrics(
    length(computedStyle(element)["font-size"]) ?? 16,
  );
}
function usedLineHeight(value: string, metrics: FontMetrics): number {
  return length(value) ?? metrics.ascent + metrics.descent + metrics.lineGap;
}
function normalizeText(value: string, whiteSpace: string): string {
  return whiteSpace === "pre" || whiteSpace === "pre-wrap"
    ? value
    : value.replace(/\s+/gu, " ");
}
function length(value: string): number | null {
  const match = /^(-?(?:\d+|\d*\.\d+))px$/u.exec(value);
  return match?.[1] === undefined ? null : Number(match[1]);
}
function edges(
  style: ReturnType<typeof computedStyle>,
  prefix: "margin" | "padding",
) {
  return {
    top: length(style[`${prefix}-top`]) ?? 0,
    right: length(style[`${prefix}-right`]) ?? 0,
    bottom: length(style[`${prefix}-bottom`]) ?? 0,
    left: length(style[`${prefix}-left`]) ?? 0,
  };
}
function borderEdges(style: ReturnType<typeof computedStyle>) {
  return {
    top: length(style["border-top-width"]) ?? 0,
    right: length(style["border-right-width"]) ?? 0,
    bottom: length(style["border-bottom-width"]) ?? 0,
    left: length(style["border-left-width"]) ?? 0,
  };
}
