import type { CSSToken } from "./css-syntax.js";
import { tokenizeCSS } from "./css-syntax.js";
import { asciiLowercase } from "./dom/conversions.js";

const SUPPORTED_PROPERTIES = new Set([
  "background-color",
  "color",
  "display",
  "float",
  "font",
  "font-size",
  "margin",
  "margin-bottom",
  "margin-left",
  "margin-right",
  "margin-top",
  "visibility",
  "width",
]);
const BASIC_COLOR_KEYWORDS = new Set([
  "aqua",
  "black",
  "blue",
  "fuchsia",
  "gray",
  "green",
  "lime",
  "maroon",
  "navy",
  "olive",
  "orange",
  "purple",
  "red",
  "silver",
  "teal",
  "white",
  "yellow",
]);
const WIDE_KEYWORDS = new Set([
  "initial",
  "inherit",
  "unset",
  "revert",
  "revert-layer",
]);
const DISPLAY_KEYWORDS = new Set([
  "none",
  "contents",
  "block",
  "inline",
  "run-in",
  "flow",
  "flow-root",
  "table",
  "flex",
  "grid",
  "ruby",
  "list-item",
  "inline-block",
  "inline-table",
  "inline-flex",
  "inline-grid",
  "table-row-group",
  "table-header-group",
  "table-footer-group",
  "table-row",
  "table-cell",
  "table-column-group",
  "table-column",
  "table-caption",
  "ruby-base",
  "ruby-text",
  "ruby-base-container",
  "ruby-text-container",
]);

export function isSupportedCSSProperty(property: string): boolean {
  return property.startsWith("--") || SUPPORTED_PROPERTIES.has(property);
}

export function parseCSSDeclarationValue(
  name: string,
  sourceTokens: readonly CSSToken[],
): { readonly value: string; readonly important: boolean } | null {
  let tokens = trimWhitespace(sourceTokens);
  if (!validComponentValues(tokens)) {
    return null;
  }
  let important = false;
  let last = tokens.length - 1;
  const lastToken = tokens[last];
  if (
    lastToken?.type === "ident" &&
    asciiLowercase(lastToken.value) === "important"
  ) {
    last -= 1;
    while (tokens[last]?.type === "whitespace") {
      last -= 1;
    }
    const marker = tokens[last];
    if (marker?.type === "delim" && marker.value === "!") {
      important = true;
      tokens = trimWhitespace(tokens.slice(0, last));
    }
  }
  const value = tokens.map((token) => token.raw).join("");
  return isValidCSSPropertyValue(name, tokens, value)
    ? { value, important }
    : null;
}

export function supportsCSSDeclaration(
  property: string,
  value: string,
): boolean {
  if (property !== property.trim()) {
    return false;
  }
  const name = property.startsWith("--") ? property : asciiLowercase(property);
  if (!isSupportedCSSProperty(name)) {
    return false;
  }
  const parsed = parseCSSDeclarationValue(name, tokenizeCSS(value));
  return parsed !== null && !parsed.important;
}

function validComponentValues(tokens: readonly CSSToken[]): boolean {
  const stack: string[] = [];
  for (const token of tokens) {
    if (token.type === "bad-string") {
      return false;
    }
    if (
      token.type === "close-paren" ||
      token.type === "close-square" ||
      token.type === "close-curly"
    ) {
      if (stack.at(-1) !== token.type) {
        return false;
      }
      stack.pop();
    } else if (token.type === "function" || token.type === "open-paren") {
      stack.push("close-paren");
    } else if (token.type === "open-square") {
      stack.push("close-square");
    } else if (token.type === "open-curly") {
      stack.push("close-curly");
    }
  }
  return stack.length === 0;
}

function trimWhitespace(tokens: readonly CSSToken[]): CSSToken[] {
  let start = 0;
  let end = tokens.length;
  while (tokens[start]?.type === "whitespace") {
    start += 1;
  }
  while (tokens[end - 1]?.type === "whitespace") {
    end -= 1;
  }
  return tokens.slice(start, end);
}

export function isValidCSSPropertyValue(
  name: string,
  tokens: readonly CSSToken[],
  value: string,
): boolean {
  if (name.startsWith("--")) {
    return true;
  }
  if (value === "") {
    return false;
  }
  if (
    tokens.some(
      (token) =>
        token.type === "function" &&
        ["var", "env"].includes(asciiLowercase(token.value)),
    )
  ) {
    return true;
  }
  const significant = tokens.filter((token) => token.type !== "whitespace");
  const keywords = significant.map((token) =>
    token.type === "ident" ? asciiLowercase(token.value) : null,
  );
  if (
    keywords.length === 1 &&
    typeof keywords[0] === "string" &&
    WIDE_KEYWORDS.has(keywords[0])
  ) {
    return true;
  }
  if (name === "color" || name === "background-color") {
    return validColor(significant);
  }
  if (name === "font-size") {
    return validFontSize(significant);
  }
  if (name === "font") {
    return false;
  }
  if (name === "width" && significant[0]?.type === "function") {
    return true;
  }
  if (name === "width" || name.startsWith("margin")) {
    const maximum = name === "margin" ? 4 : 1;
    return (
      significant.length >= 1 &&
      significant.length <= maximum &&
      significant.every(validLength)
    );
  }
  if (keywords.some((keyword) => keyword === null)) {
    return false;
  }
  const values = keywords as string[];
  if (name === "visibility") {
    return (
      values.length === 1 &&
      ["visible", "hidden", "force-hidden", "collapse"].includes(
        values[0] ?? "",
      )
    );
  }
  if (name === "float") {
    return (
      values.length === 1 &&
      ["left", "right", "none", "inline-start", "inline-end"].includes(
        values[0] ?? "",
      )
    );
  }
  return validDisplay(values);
}

function validLength(token: CSSToken): boolean {
  return (
    token.type === "dimension" ||
    token.type === "percentage" ||
    (token.type === "number" && token.value === 0) ||
    (token.type === "ident" && asciiLowercase(token.value) === "auto")
  );
}

function validFontSize(tokens: readonly CSSToken[]): boolean {
  if (tokens.length !== 1) {
    return false;
  }
  const token = tokens[0];
  return (
    (token?.type === "dimension" && token.value >= 0) ||
    (token?.type === "percentage" && token.value >= 0) ||
    (token?.type === "number" && token.value === 0) ||
    (token?.type === "ident" &&
      [
        "xx-small",
        "x-small",
        "small",
        "medium",
        "large",
        "x-large",
        "xx-large",
        "xxx-large",
        "larger",
        "smaller",
      ].includes(asciiLowercase(token.value)))
  );
}

function validColor(tokens: readonly CSSToken[]): boolean {
  if (tokens.length !== 1) {
    return false;
  }
  const token = tokens[0];
  if (token?.type === "ident") {
    const keyword = asciiLowercase(token.value);
    return (
      keyword === "currentcolor" ||
      keyword === "transparent" ||
      BASIC_COLOR_KEYWORDS.has(keyword)
    );
  }
  return (
    token?.type === "hash" &&
    /^(?:[\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})$/iu.test(token.value)
  );
}

function validDisplay(values: readonly string[]): boolean {
  if (values.length === 1) {
    return DISPLAY_KEYWORDS.has(values[0] ?? "");
  }
  if (
    values.length < 2 ||
    values.length > 3 ||
    new Set(values).size !== values.length
  ) {
    return false;
  }
  const outside = values.filter((value) =>
    ["block", "inline", "run-in"].includes(value),
  );
  const inside = values.filter((value) =>
    ["flow", "flow-root", "table", "flex", "grid", "ruby"].includes(value),
  );
  if (values.includes("list-item")) {
    return (
      outside.length <= 1 &&
      inside.length <= 1 &&
      inside.every((value) => value === "flow" || value === "flow-root") &&
      outside.length + inside.length + 1 === values.length
    );
  }
  return outside.length === 1 && inside.length === 1 && values.length === 2;
}
