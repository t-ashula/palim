import type { Document, Element } from "@palim/core";
import { CSSStyleRule } from "@palim/core";

export type CSSComputedProperty =
  | "display"
  | "position"
  | "width"
  | "height"
  | "min-width"
  | "min-height"
  | "max-width"
  | "max-height"
  | "margin-top"
  | "margin-right"
  | "margin-bottom"
  | "margin-left"
  | "padding-top"
  | "padding-right"
  | "padding-bottom"
  | "padding-left"
  | "border-top-width"
  | "border-right-width"
  | "border-bottom-width"
  | "border-left-width"
  | "box-sizing"
  | "writing-mode"
  | "font-family"
  | "font-size"
  | "line-height"
  | "white-space";

export type ComputedStyle = Readonly<Record<CSSComputedProperty, string>>;

interface Declaration {
  readonly name: CSSComputedProperty;
  readonly value: string;
  readonly important: boolean;
}

interface Candidate extends Declaration {
  readonly origin: 0 | 1 | 2;
  readonly specificity: readonly [number, number, number];
  readonly order: number;
}

interface StyleRule {
  readonly selectors: readonly string[];
  readonly declarations: readonly Declaration[];
  readonly order: number;
}

const INITIAL_STYLE: ComputedStyle = Object.freeze({
  display: "inline",
  position: "static",
  width: "auto",
  height: "auto",
  "min-width": "auto",
  "min-height": "auto",
  "max-width": "none",
  "max-height": "none",
  "margin-top": "0px",
  "margin-right": "0px",
  "margin-bottom": "0px",
  "margin-left": "0px",
  "padding-top": "0px",
  "padding-right": "0px",
  "padding-bottom": "0px",
  "padding-left": "0px",
  "border-top-width": "0px",
  "border-right-width": "0px",
  "border-bottom-width": "0px",
  "border-left-width": "0px",
  "box-sizing": "content-box",
  "writing-mode": "horizontal-tb",
  "font-family": "palim monospace",
  "font-size": "16px",
  "line-height": "normal",
  "white-space": "normal",
});

const INHERITED_PROPERTIES = new Set<CSSComputedProperty>([
  "writing-mode",
  "font-family",
  "font-size",
  "line-height",
  "white-space",
]);
const COMPUTED_PROPERTIES = Object.keys(INITIAL_STYLE) as CSSComputedProperty[];
const BLOCK_ELEMENTS = new Set([
  "address",
  "article",
  "aside",
  "blockquote",
  "body",
  "div",
  "dl",
  "fieldset",
  "footer",
  "form",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "header",
  "html",
  "main",
  "nav",
  "ol",
  "p",
  "pre",
  "section",
  "ul",
]);
const HIDDEN_ELEMENTS = new Set(["head", "link", "meta", "script", "style"]);
const CACHE = new WeakMap<Element, ComputedStyle>();

export function computedStyle(element: Element): ComputedStyle {
  const cached = CACHE.get(element);
  if (cached !== undefined) {
    return cached;
  }
  const parentStyle =
    element.parentElement === null
      ? null
      : computedStyle(element.parentElement);
  const candidates = new Map<CSSComputedProperty, Candidate>();
  let order = 0;
  for (const declaration of userAgentDeclarations(element)) {
    selectCandidate(candidates, {
      ...declaration,
      origin: 0,
      specificity: [0, 0, 0],
      order,
    });
    order += 1;
  }
  const document = element.ownerDocument;
  if (document !== null) {
    for (const rule of documentRules(document)) {
      for (const selector of rule.selectors) {
        if (!element.matches(selector)) {
          continue;
        }
        const specificity = selectorSpecificity(selector);
        for (const declaration of rule.declarations) {
          selectCandidate(candidates, {
            ...declaration,
            origin: 1,
            specificity,
            order: rule.order,
          });
        }
      }
    }
  }
  for (const declaration of parseDeclarations(
    element.getAttribute("style") ?? "",
  )) {
    selectCandidate(candidates, {
      ...declaration,
      origin: 2,
      specificity: [1, 0, 0],
      order,
    });
    order += 1;
  }
  const values = {} as Record<CSSComputedProperty, string>;
  for (const property of COMPUTED_PROPERTIES) {
    values[property] = resolveValue(
      property,
      candidates.get(property)?.value,
      parentStyle,
    );
  }
  const result = Object.freeze(values);
  CACHE.set(element, result);
  return result;
}

export function invalidateComputedStyles(document: Document): void {
  for (const element of document.querySelectorAll("*")) {
    CACHE.delete(element);
  }
}

function userAgentDeclarations(element: Element): readonly Declaration[] {
  const localName = element.localName;
  const display = HIDDEN_ELEMENTS.has(localName)
    ? "none"
    : BLOCK_ELEMENTS.has(localName)
      ? "block"
      : "inline";
  return [{ name: "display", value: display, important: false }];
}

function documentRules(document: Document): readonly StyleRule[] {
  const rules: StyleRule[] = [];
  let order = 0;
  for (const sheet of document.styleSheets) {
    for (const cssRule of sheet.cssRules) {
      if (!(cssRule instanceof CSSStyleRule)) {
        continue;
      }
      const rule = parseRule(cssRule.cssText);
      if (rule !== null) {
        rules.push({ ...rule, order });
      }
      order += 1;
    }
  }
  return rules;
}

function parseRule(source: string): Omit<StyleRule, "order"> | null {
  const openingBrace = source.indexOf("{");
  if (openingBrace < 0 || !source.endsWith("}")) {
    return null;
  }
  const selectors = source
    .slice(0, openingBrace)
    .split(",")
    .map((selector) => selector.trim())
    .filter(Boolean);
  return selectors.length === 0
    ? null
    : {
        selectors,
        declarations: parseDeclarations(source.slice(openingBrace + 1, -1)),
      };
}

function parseDeclarations(source: string): readonly Declaration[] {
  const declarations: Declaration[] = [];
  for (const part of source.split(";")) {
    const colon = part.indexOf(":");
    if (colon < 0) {
      continue;
    }
    const name = part.slice(0, colon).trim().toLowerCase();
    if (!isComputedProperty(name)) {
      continue;
    }
    let value = part
      .slice(colon + 1)
      .trim()
      .toLowerCase();
    const important = /\s*!important\s*$/u.test(value);
    if (important) {
      value = value.replace(/\s*!important\s*$/u, "").trim();
    }
    if (value !== "") {
      declarations.push({ name, value, important });
    }
  }
  return declarations;
}

function isComputedProperty(value: string): value is CSSComputedProperty {
  return Object.hasOwn(INITIAL_STYLE, value);
}

function selectCandidate(
  candidates: Map<CSSComputedProperty, Candidate>,
  candidate: Candidate,
): void {
  const current = candidates.get(candidate.name);
  if (current === undefined || compareCandidate(current, candidate) <= 0) {
    candidates.set(candidate.name, candidate);
  }
}

function compareCandidate(left: Candidate, right: Candidate): number {
  if (left.important !== right.important) {
    return left.important ? 1 : -1;
  }
  if (left.origin !== right.origin) {
    return left.origin - right.origin;
  }
  for (let index = 0; index < 3; index += 1) {
    const difference =
      (left.specificity[index] ?? 0) - (right.specificity[index] ?? 0);
    if (difference !== 0) {
      return difference;
    }
  }
  return left.order - right.order;
}

function selectorSpecificity(
  selector: string,
): readonly [number, number, number] {
  const ids = selector.match(/#[\w-]+/gu)?.length ?? 0;
  const classes =
    selector.match(/\.[\w-]+|\[[^\]]+\]|:(?!:)[\w-]+/gu)?.length ?? 0;
  const withoutSpecial = selector.replace(
    /#[\w-]+|\.[\w-]+|\[[^\]]+\]|::?[\w-]+(?:\([^)]*\))?/gu,
    " ",
  );
  const types =
    withoutSpecial
      .match(/(?:^|[\s>+~])(?:[a-zA-Z][\w-]*|\*)/gu)
      ?.filter((value) => !value.trim().endsWith("*")).length ?? 0;
  return [ids, classes, types];
}

function resolveValue(
  property: CSSComputedProperty,
  specified: string | undefined,
  parent: ComputedStyle | null,
): string {
  if (
    specified === "inherit" ||
    (specified === "unset" && INHERITED_PROPERTIES.has(property))
  ) {
    return parent?.[property] ?? INITIAL_STYLE[property];
  }
  if (
    specified === undefined ||
    specified === "initial" ||
    specified === "revert" ||
    specified === "revert-layer" ||
    specified === "unset"
  ) {
    return INHERITED_PROPERTIES.has(property)
      ? (parent?.[property] ?? INITIAL_STYLE[property])
      : INITIAL_STYLE[property];
  }
  return specified;
}
