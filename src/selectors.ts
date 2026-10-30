import type { Attr, Document, DocumentFragment, Element, Node } from "./dom.js";
import { DOMException } from "./dom-exception.js";
import { tokenizeCSS } from "./css-syntax.js";
import type { CSSToken } from "./css-syntax.js";
import { HTML_NAMESPACE, SVG_NAMESPACE } from "./namespaces.js";

const ASCII_WHITESPACE = /[\t\n\f\r ]+/;

type SelectorRoot = Document | DocumentFragment | Element;
type NamespaceConstraint = "unspecified" | "any" | "none";
type Combinator = "descendant" | "child" | "adjacent" | "sibling" | "column";

interface ComplexSelector {
  readonly compounds: readonly CompoundSelector[];
  readonly combinators: readonly Combinator[];
  readonly leading: Combinator | null;
}

interface CompoundSelector {
  readonly selectors: readonly SimpleSelector[];
}

interface TypeSelector {
  readonly kind: "type";
  readonly name: string;
  readonly namespace: NamespaceConstraint;
}

interface UniversalSelector {
  readonly kind: "universal";
  readonly namespace: NamespaceConstraint;
}

interface IdSelector {
  readonly kind: "id";
  readonly value: string;
}

interface ClassSelector {
  readonly kind: "class";
  readonly value: string;
}

interface AttributeSelector {
  readonly kind: "attribute";
  readonly name: string;
  readonly namespace: NamespaceConstraint;
  readonly operator: "=" | "~=" | "|=" | "^=" | "$=" | "*=" | null;
  readonly value: string | null;
  readonly modifier: "i" | "s" | null;
}

interface PlainPseudoClass {
  readonly kind: "pseudo-class";
  readonly name: string;
}

interface SelectorPseudoClass {
  readonly kind: "selector-pseudo-class";
  readonly name: "is" | "where" | "not" | "host" | "host-context";
  readonly selectors: readonly ComplexSelector[];
}

interface RelativePseudoClass {
  readonly kind: "relative-pseudo-class";
  readonly name: "has";
  readonly selectors: readonly ComplexSelector[];
}

interface NthPseudoClass {
  readonly kind: "nth-pseudo-class";
  readonly name:
    "nth-child" | "nth-last-child" | "nth-of-type" | "nth-last-of-type";
  readonly a: number;
  readonly b: number;
  readonly of: readonly ComplexSelector[] | null;
}

interface LanguagePseudoClass {
  readonly kind: "language-pseudo-class";
  readonly languages: readonly string[];
}

interface DirectionPseudoClass {
  readonly kind: "direction-pseudo-class";
  readonly direction: "ltr" | "rtl";
}

interface OpaqueFunctionalPseudoClass {
  readonly kind: "opaque-functional-pseudo-class";
  readonly name: string;
}

interface PseudoElementSelector {
  readonly kind: "pseudo-element";
  readonly name: string;
}

type SimpleSelector =
  | TypeSelector
  | UniversalSelector
  | IdSelector
  | ClassSelector
  | AttributeSelector
  | PlainPseudoClass
  | SelectorPseudoClass
  | RelativePseudoClass
  | NthPseudoClass
  | LanguagePseudoClass
  | DirectionPseudoClass
  | OpaqueFunctionalPseudoClass
  | PseudoElementSelector;

const SIMPLE_PSEUDO_CLASSES = new Set([
  "active",
  "any-link",
  "autofill",
  "blank",
  "buffering",
  "checked",
  "closed",
  "current",
  "default",
  "defined",
  "disabled",
  "empty",
  "enabled",
  "first-child",
  "first-of-type",
  "focus",
  "focus-visible",
  "focus-within",
  "fullscreen",
  "future",
  "host",
  "hover",
  "in-range",
  "indeterminate",
  "invalid",
  "last-child",
  "last-of-type",
  "link",
  "local-link",
  "modal",
  "muted",
  "only-child",
  "only-of-type",
  "open",
  "optional",
  "out-of-range",
  "past",
  "paused",
  "picture-in-picture",
  "placeholder-shown",
  "playing",
  "popover-open",
  "read-only",
  "read-write",
  "required",
  "root",
  "scope",
  "seeking",
  "stalled",
  "target",
  "target-within",
  "user-invalid",
  "user-valid",
  "valid",
  "visited",
  "volume-locked",
]);

const SIMPLE_PSEUDO_ELEMENTS = new Set([
  "after",
  "backdrop",
  "before",
  "checkmark",
  "details-content",
  "file-selector-button",
  "first-letter",
  "first-line",
  "grammar-error",
  "marker",
  "picker-icon",
  "placeholder",
  "selection",
  "spelling-error",
  "target-text",
]);

const LEGACY_PSEUDO_ELEMENTS = new Set([
  "after",
  "before",
  "first-letter",
  "first-line",
]);

const OPAQUE_FUNCTIONAL_PSEUDO_CLASSES = new Set([
  "current",
  "nth-col",
  "nth-last-col",
  "state",
]);

const FUNCTIONAL_PSEUDO_ELEMENTS = new Set([
  "cue",
  "cue-region",
  "highlight",
  "part",
  "slotted",
  "view-transition-group",
  "view-transition-image-pair",
  "view-transition-new",
  "view-transition-old",
]);

const ASCII_INSENSITIVE_HTML_ATTRIBUTES = new Set([
  "accept",
  "autocomplete",
  "charset",
  "contenteditable",
  "crossorigin",
  "dir",
  "draggable",
  "enctype",
  "formenctype",
  "formmethod",
  "http-equiv",
  "kind",
  "method",
  "preload",
  "rel",
  "scope",
  "shape",
  "spellcheck",
  "target",
  "translate",
  "type",
  "wrap",
]);

export function querySelector(
  root: SelectorRoot,
  selectors: string,
): Element | null {
  const parsed = parseSelectors(selectors);
  for (const element of descendantElements(root)) {
    if (matchesSelectorList(element, parsed, root)) {
      return element;
    }
  }
  return null;
}

export function querySelectorAll(
  root: SelectorRoot,
  selectors: string,
): readonly Element[] {
  const parsed = parseSelectors(selectors);
  return descendantElements(root).filter((element) =>
    matchesSelectorList(element, parsed, root),
  );
}

export function matches(element: Element, selectors: string): boolean {
  return matchesSelectorList(element, parseSelectors(selectors), element);
}

export function closest(element: Element, selectors: string): Element | null {
  const parsed = parseSelectors(selectors);
  let candidate: Element | null = element;
  while (candidate !== null) {
    if (matchesSelectorList(candidate, parsed, element)) {
      return candidate;
    }
    candidate = parentElement(candidate);
  }
  return null;
}

function parseSelectors(input: string): readonly ComplexSelector[] {
  const tokens = tokenizeCSS(input);
  if (tokens.some((token) => token.type === "bad-string")) {
    throw selectorSyntaxError();
  }
  return parseSelectorList(tokens, false, false, false);
}

function parseSelectorList(
  tokens: readonly CSSToken[],
  forgiving: boolean,
  relative: boolean,
  insideHas: boolean,
): readonly ComplexSelector[] {
  const selectors: ComplexSelector[] = [];
  for (const part of splitSelectorList(tokens)) {
    if (onlyWhitespace(part)) {
      if (forgiving) {
        continue;
      }
      throw selectorSyntaxError();
    }
    try {
      const parser = new SelectorParser(part, insideHas);
      selectors.push(parser.parseComplex(relative));
      parser.finish();
    } catch (error) {
      if (!forgiving || !(error instanceof DOMException)) {
        throw error;
      }
    }
  }
  if (!forgiving && selectors.length === 0) {
    throw selectorSyntaxError();
  }
  return selectors;
}

class SelectorParser {
  readonly #tokens: readonly CSSToken[];
  readonly #insideHas: boolean;
  #position = 0;

  constructor(tokens: readonly CSSToken[], insideHas: boolean) {
    this.#tokens = tokens;
    this.#insideHas = insideHas;
  }

  parseComplex(relative: boolean): ComplexSelector {
    this.#skipWhitespace();
    let leading: Combinator | null = null;
    if (this.#isCombinator()) {
      if (!relative) {
        throw selectorSyntaxError();
      }
      leading = this.#consumeCombinator();
      this.#skipWhitespace();
    }

    const compounds: CompoundSelector[] = [this.#parseCompound()];
    const combinators: Combinator[] = [];
    for (;;) {
      const hadWhitespace = this.#skipWhitespace();
      if (this.#done()) {
        break;
      }
      if (hasPseudoElement(compounds.at(-1))) {
        throw selectorSyntaxError();
      }
      let combinator: Combinator;
      if (this.#isCombinator()) {
        combinator = this.#consumeCombinator();
        this.#skipWhitespace();
      } else if (hadWhitespace) {
        combinator = "descendant";
      } else {
        throw selectorSyntaxError();
      }
      if (this.#done()) {
        throw selectorSyntaxError();
      }
      combinators.push(combinator);
      compounds.push(this.#parseCompound());
    }
    return { compounds, combinators, leading };
  }

  finish(): void {
    this.#skipWhitespace();
    if (!this.#done()) {
      throw selectorSyntaxError();
    }
  }

  #parseCompound(): CompoundSelector {
    const selectors: SimpleSelector[] = [];
    const type = this.#parseTypeSelector();
    if (type !== null) {
      selectors.push(type);
    }

    let hasPseudoElement = false;
    for (;;) {
      const token = this.#peek();
      let selector: SimpleSelector | null = null;
      if (token?.type === "hash") {
        this.#position += 1;
        selector = { kind: "id", value: token.value };
      } else if (isDelim(token, ".")) {
        this.#position += 1;
        const name = this.#consume("ident");
        selector = { kind: "class", value: name.value };
      } else if (token?.type === "open-square") {
        this.#position += 1;
        selector = parseAttributeSelector(this.#takeBracketContents());
      } else if (token?.type === "colon") {
        selector = this.#parsePseudo();
      }

      if (selector === null) {
        break;
      }
      if (hasPseudoElement) {
        throw selectorSyntaxError();
      }
      if (selector.kind === "pseudo-element") {
        hasPseudoElement = true;
      }
      selectors.push(selector);
    }

    if (selectors.length === 0) {
      throw selectorSyntaxError();
    }
    return { selectors };
  }

  #parseTypeSelector(): TypeSelector | UniversalSelector | null {
    const first = this.#peek();
    if (first === undefined) {
      return null;
    }

    if (isDelim(first, "|")) {
      this.#position += 1;
      return this.#consumeTypeName("none");
    }

    const second = this.#peek(1);
    if (first.type === "ident") {
      if (isDelim(second, "|")) {
        this.#position += 2;
        throw selectorSyntaxError();
      }
      this.#position += 1;
      return { kind: "type", name: first.value, namespace: "unspecified" };
    }

    if (!isDelim(first, "*")) {
      return null;
    }
    if (isDelim(second, "|")) {
      this.#position += 2;
      return this.#consumeTypeName("any");
    }
    this.#position += 1;
    return { kind: "universal", namespace: "unspecified" };
  }

  #consumeTypeName(
    namespace: NamespaceConstraint,
  ): TypeSelector | UniversalSelector {
    const token = this.#peek();
    if (token?.type === "ident") {
      this.#position += 1;
      return { kind: "type", name: token.value, namespace };
    }
    if (isDelim(token, "*")) {
      this.#position += 1;
      return { kind: "universal", namespace };
    }
    throw selectorSyntaxError();
  }

  #parsePseudo(): SimpleSelector {
    this.#consume("colon");
    const pseudoElement = this.#peek()?.type === "colon";
    if (pseudoElement) {
      this.#position += 1;
    }
    const token = this.#peek();
    if (token?.type === "ident") {
      this.#position += 1;
      const name = asciiLower(token.value);
      if (pseudoElement || LEGACY_PSEUDO_ELEMENTS.has(name)) {
        if (!SIMPLE_PSEUDO_ELEMENTS.has(name)) {
          throw selectorSyntaxError();
        }
        return { kind: "pseudo-element", name };
      }
      if (!SIMPLE_PSEUDO_CLASSES.has(name)) {
        throw selectorSyntaxError();
      }
      return { kind: "pseudo-class", name };
    }

    if (token?.type !== "function") {
      throw selectorSyntaxError();
    }
    this.#position += 1;
    const name = asciiLower(token.value);
    const contents = this.#takeFunctionContents();
    if (pseudoElement) {
      if (!FUNCTIONAL_PSEUDO_ELEMENTS.has(name) || onlyWhitespace(contents)) {
        throw selectorSyntaxError();
      }
      return { kind: "pseudo-element", name };
    }
    return this.#parseFunctionalPseudoClass(name, contents);
  }

  #parseFunctionalPseudoClass(
    name: string,
    contents: readonly CSSToken[],
  ): SimpleSelector {
    if (name === "is" || name === "where") {
      return {
        kind: "selector-pseudo-class",
        name,
        selectors: parseSelectorList(contents, true, false, this.#insideHas),
      };
    }
    if (name === "not") {
      return {
        kind: "selector-pseudo-class",
        name,
        selectors: parseSelectorList(contents, false, false, this.#insideHas),
      };
    }
    if (name === "has") {
      if (this.#insideHas) {
        throw selectorSyntaxError();
      }
      return {
        kind: "relative-pseudo-class",
        name,
        selectors: parseSelectorList(contents, false, true, true),
      };
    }
    if (
      name === "nth-child" ||
      name === "nth-last-child" ||
      name === "nth-of-type" ||
      name === "nth-last-of-type"
    ) {
      const nth = parseNth(contents, name, this.#insideHas);
      return { kind: "nth-pseudo-class", name, ...nth };
    }
    if (name === "lang") {
      return {
        kind: "language-pseudo-class",
        languages: parseLanguages(contents),
      };
    }
    if (name === "dir") {
      const value = trimTokens(contents);
      if (
        value.length !== 1 ||
        value[0]?.type !== "ident" ||
        !["ltr", "rtl"].includes(asciiLower(value[0].value))
      ) {
        throw selectorSyntaxError();
      }
      return {
        kind: "direction-pseudo-class",
        direction: asciiLower(value[0].value) as "ltr" | "rtl",
      };
    }
    if (name === "host" || name === "host-context") {
      return {
        kind: "selector-pseudo-class",
        name,
        selectors: parseSelectorList(contents, false, false, this.#insideHas),
      };
    }
    if (OPAQUE_FUNCTIONAL_PSEUDO_CLASSES.has(name)) {
      if (onlyWhitespace(contents)) {
        throw selectorSyntaxError();
      }
      return { kind: "opaque-functional-pseudo-class", name };
    }
    throw selectorSyntaxError();
  }

  #takeFunctionContents(): readonly CSSToken[] {
    const result: CSSToken[] = [];
    let depth = 1;
    while (!this.#done()) {
      const token = this.#tokens[this.#position++];
      if (token === undefined) {
        break;
      }
      if (token.type === "function" || token.type === "open-paren") {
        depth += 1;
      } else if (token.type === "close-paren") {
        depth -= 1;
        if (depth === 0) {
          return result;
        }
      }
      result.push(token);
    }
    throw selectorSyntaxError();
  }

  #takeBracketContents(): readonly CSSToken[] {
    const result: CSSToken[] = [];
    while (!this.#done()) {
      const token = this.#tokens[this.#position++];
      if (token?.type === "close-square") {
        return result;
      }
      if (token === undefined || token.type === "open-square") {
        throw selectorSyntaxError();
      }
      result.push(token);
    }
    throw selectorSyntaxError();
  }

  #isCombinator(): boolean {
    const token = this.#peek();
    return (
      isDelim(token, ">") ||
      isDelim(token, "+") ||
      isDelim(token, "~") ||
      (isDelim(token, "|") && isDelim(this.#peek(1), "|"))
    );
  }

  #consumeCombinator(): Combinator {
    const token = this.#tokens[this.#position++];
    if (isDelim(token, ">")) {
      return "child";
    }
    if (isDelim(token, "+")) {
      return "adjacent";
    }
    if (isDelim(token, "~")) {
      return "sibling";
    }
    if (isDelim(token, "|") && isDelim(this.#peek(), "|")) {
      this.#position += 1;
      return "column";
    }
    throw selectorSyntaxError();
  }

  #skipWhitespace(): boolean {
    const start = this.#position;
    while (this.#peek()?.type === "whitespace") {
      this.#position += 1;
    }
    return this.#position !== start;
  }

  #consume<Type extends CSSToken["type"]>(
    type: Type,
  ): Extract<CSSToken, { readonly type: Type }> {
    const token = this.#tokens[this.#position];
    if (token?.type !== type) {
      throw selectorSyntaxError();
    }
    this.#position += 1;
    return token as Extract<CSSToken, { readonly type: Type }>;
  }

  #peek(offset = 0): CSSToken | undefined {
    return this.#tokens[this.#position + offset];
  }

  #done(): boolean {
    return this.#position >= this.#tokens.length;
  }
}

function parseAttributeSelector(
  source: readonly CSSToken[],
): AttributeSelector {
  const tokens = trimTokens(source);
  let position = 0;
  let namespace: NamespaceConstraint = "none";

  if (isDelim(tokens[position], "|")) {
    namespace = "none";
    position += 1;
  } else if (
    (tokens[position]?.type === "ident" || isDelim(tokens[position], "*")) &&
    isDelim(tokens[position + 1], "|") &&
    !isDelim(tokens[position + 2], "=")
  ) {
    if (tokens[position]?.type === "ident") {
      throw selectorSyntaxError();
    }
    namespace = "any";
    position += 2;
  }

  const nameToken = tokens[position];
  if (nameToken?.type !== "ident") {
    throw selectorSyntaxError();
  }
  position += 1;
  position = skipWhitespace(tokens, position);
  if (position === tokens.length) {
    return {
      kind: "attribute",
      name: nameToken.value,
      namespace,
      operator: null,
      value: null,
      modifier: null,
    };
  }

  let operator: AttributeSelector["operator"] = null;
  if (isDelim(tokens[position], "=")) {
    operator = "=";
    position += 1;
  } else if (
    ["~", "|", "^", "$", "*"].some((value) =>
      isDelim(tokens[position], value),
    ) &&
    isDelim(tokens[position + 1], "=")
  ) {
    operator = `${(tokens[position] as { readonly value: string }).value}=` as
      "~=" | "|=" | "^=" | "$=" | "*=";
    position += 2;
  } else {
    throw selectorSyntaxError();
  }

  position = skipWhitespace(tokens, position);
  const valueToken = tokens[position];
  if (valueToken?.type !== "ident" && valueToken?.type !== "string") {
    throw selectorSyntaxError();
  }
  const value = valueToken.value;
  position += 1;
  position = skipWhitespace(tokens, position);

  let modifier: "i" | "s" | null = null;
  const modifierToken = tokens[position];
  if (modifierToken?.type === "ident") {
    const normalized = asciiLower(modifierToken.value);
    if (normalized !== "i" && normalized !== "s") {
      throw selectorSyntaxError();
    }
    modifier = normalized;
    position += 1;
    position = skipWhitespace(tokens, position);
  }
  if (position !== tokens.length) {
    throw selectorSyntaxError();
  }
  return {
    kind: "attribute",
    name: nameToken.value,
    namespace,
    operator,
    value,
    modifier,
  };
}

function parseNth(
  source: readonly CSSToken[],
  name: NthPseudoClass["name"],
  insideHas: boolean,
): Pick<NthPseudoClass, "a" | "b" | "of"> {
  const tokens = trimTokens(source);
  let ofIndex = -1;
  let depth = 0;
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (token?.type === "function" || token?.type === "open-paren") {
      depth += 1;
    } else if (token?.type === "close-paren") {
      depth -= 1;
    } else if (
      depth === 0 &&
      token?.type === "ident" &&
      asciiLower(token.value) === "of"
    ) {
      ofIndex = index;
      break;
    }
  }

  const formulaTokens = ofIndex < 0 ? tokens : tokens.slice(0, ofIndex);
  const formula = formulaTokens
    .filter((token) => token.type !== "whitespace")
    .map(nthTokenText)
    .join("")
    .toLowerCase();
  let a: number;
  let b: number;
  if (formula === "odd") {
    a = 2;
    b = 1;
  } else if (formula === "even") {
    a = 2;
    b = 0;
  } else if (/^[+-]?\d+$/.test(formula)) {
    a = 0;
    b = Number(formula);
  } else {
    const match = /^([+-]?\d*)n(?:([+-]\d+))?$/.exec(formula);
    if (match === null) {
      throw selectorSyntaxError();
    }
    const coefficient = match[1] ?? "";
    a =
      coefficient === "" || coefficient === "+"
        ? 1
        : coefficient === "-"
          ? -1
          : Number(coefficient);
    b = match[2] === undefined ? 0 : Number(match[2]);
  }

  let of: readonly ComplexSelector[] | null = null;
  if (ofIndex >= 0) {
    if (name === "nth-of-type" || name === "nth-last-of-type") {
      throw selectorSyntaxError();
    }
    of = parseSelectorList(tokens.slice(ofIndex + 1), false, false, insideHas);
  }
  return { a, b, of };
}

function nthTokenText(token: CSSToken): string {
  switch (token.type) {
    case "ident":
      return token.value;
    case "dimension":
      return `${String(token.value)}${token.unit}`;
    case "number":
      return token.raw;
    case "delim":
      return token.value;
    default:
      return token.raw;
  }
}

function parseLanguages(tokens: readonly CSSToken[]): readonly string[] {
  const languages: string[] = [];
  for (const part of splitSelectorList(tokens)) {
    const value = trimTokens(part);
    if (
      value.length !== 1 ||
      (value[0]?.type !== "ident" && value[0]?.type !== "string")
    ) {
      throw selectorSyntaxError();
    }
    languages.push(value[0].value);
  }
  if (languages.length === 0) {
    throw selectorSyntaxError();
  }
  return languages;
}

function splitSelectorList(
  tokens: readonly CSSToken[],
): readonly (readonly CSSToken[])[] {
  const result: CSSToken[][] = [];
  let current: CSSToken[] = [];
  let parentheses = 0;
  let brackets = 0;
  for (const token of tokens) {
    if (token.type === "function" || token.type === "open-paren") {
      parentheses += 1;
    } else if (token.type === "close-paren") {
      parentheses -= 1;
    } else if (token.type === "open-square") {
      brackets += 1;
    } else if (token.type === "close-square") {
      brackets -= 1;
    }
    if (parentheses < 0 || brackets < 0) {
      throw selectorSyntaxError();
    }
    if (token.type === "comma" && parentheses === 0 && brackets === 0) {
      result.push(current);
      current = [];
    } else {
      current.push(token);
    }
  }
  result.push(current);
  return result;
}

function matchesSelectorList(
  element: Element,
  selectors: readonly ComplexSelector[],
  scope: SelectorRoot,
): boolean {
  return selectors.some((selector) => matchesComplex(element, selector, scope));
}

function matchesComplex(
  element: Element,
  selector: ComplexSelector,
  scope: SelectorRoot,
): boolean {
  const matchAt = (candidate: Element, index: number): boolean => {
    const compound = selector.compounds[index];
    if (
      compound === undefined ||
      !matchesCompound(candidate, compound, scope)
    ) {
      return false;
    }
    if (index === 0) {
      return true;
    }
    const combinator = selector.combinators[index - 1];
    if (combinator === "child") {
      const parent = candidate._parentNode;
      if (parent?.nodeType === 1) {
        return matchAt(parent as Element, index - 1);
      }
      return (
        parent === scope &&
        index === 1 &&
        isVirtualScopeCompound(selector.compounds[0])
      );
    }
    if (combinator === "descendant") {
      let parent = candidate._parentNode;
      while (parent !== null) {
        if (parent.nodeType === 1 && matchAt(parent as Element, index - 1)) {
          return true;
        }
        if (
          parent === scope &&
          index === 1 &&
          isVirtualScopeCompound(selector.compounds[0])
        ) {
          return true;
        }
        parent = parent._parentNode;
      }
      return false;
    }
    if (combinator === "adjacent") {
      const sibling = previousElementSibling(candidate);
      return sibling !== null && matchAt(sibling, index - 1);
    }
    if (combinator === "sibling") {
      let sibling = previousElementSibling(candidate);
      while (sibling !== null) {
        if (matchAt(sibling, index - 1)) {
          return true;
        }
        sibling = previousElementSibling(sibling);
      }
    }
    return false;
  };
  return matchAt(element, selector.compounds.length - 1);
}

function matchesCompound(
  element: Element,
  compound: CompoundSelector,
  scope: SelectorRoot,
): boolean {
  return compound.selectors.every((selector) =>
    matchesSimpleSelector(element, selector, scope),
  );
}

function isVirtualScopeCompound(
  compound: CompoundSelector | undefined,
): boolean {
  return (
    compound?.selectors.length === 1 &&
    compound.selectors[0]?.kind === "pseudo-class" &&
    compound.selectors[0].name === "scope"
  );
}

function hasPseudoElement(compound: CompoundSelector | undefined): boolean {
  return (
    compound?.selectors.some(
      (selector) => selector.kind === "pseudo-element",
    ) ?? false
  );
}

function matchesSimpleSelector(
  element: Element,
  selector: SimpleSelector,
  scope: SelectorRoot,
): boolean {
  switch (selector.kind) {
    case "type":
      return (
        matchesNamespace(element, selector.namespace) &&
        namesEqual(element, element.localName, selector.name)
      );
    case "universal":
      return matchesNamespace(element, selector.namespace);
    case "id":
      return identifierEquals(
        element,
        attributeValue(element, "id"),
        selector.value,
      );
    case "class":
      return (attributeValue(element, "class") ?? "")
        .split(ASCII_WHITESPACE)
        .some((value) => identifierEquals(element, value, selector.value));
    case "attribute":
      return matchesAttribute(element, selector);
    case "pseudo-class":
      return matchesPlainPseudoClass(element, selector.name, scope);
    case "selector-pseudo-class": {
      const matched = matchesSelectorList(element, selector.selectors, scope);
      return selector.name === "not" ? !matched : matched;
    }
    case "relative-pseudo-class":
      return selector.selectors.some((relative) =>
        matchesRelativeSelector(element, relative),
      );
    case "nth-pseudo-class":
      return matchesNth(element, selector, scope);
    case "language-pseudo-class":
      return matchesLanguage(element, selector.languages);
    case "direction-pseudo-class":
      return directionOf(element) === selector.direction;
    case "opaque-functional-pseudo-class":
    case "pseudo-element":
      return false;
  }
}

function matchesRelativeSelector(
  anchor: Element,
  selector: ComplexSelector,
): boolean {
  const root = treeRoot(anchor);
  const candidates = [anchor, ...descendantElements(root as SelectorRoot)];
  const matchAt = (candidate: Element, index: number): boolean => {
    const compound = selector.compounds[index];
    if (
      compound === undefined ||
      !matchesCompound(candidate, compound, anchor)
    ) {
      return false;
    }
    if (index === 0) {
      return matchesLeadingRelation(anchor, candidate, selector.leading);
    }
    const combinator = selector.combinators[index - 1];
    if (combinator === "child") {
      const parent = parentElement(candidate);
      return parent !== null && matchAt(parent, index - 1);
    }
    if (combinator === "descendant") {
      let parent = parentElement(candidate);
      while (parent !== null) {
        if (matchAt(parent, index - 1)) {
          return true;
        }
        parent = parentElement(parent);
      }
      return false;
    }
    if (combinator === "adjacent") {
      const sibling = previousElementSibling(candidate);
      return sibling !== null && matchAt(sibling, index - 1);
    }
    if (combinator === "sibling") {
      let sibling = previousElementSibling(candidate);
      while (sibling !== null) {
        if (matchAt(sibling, index - 1)) {
          return true;
        }
        sibling = previousElementSibling(sibling);
      }
    }
    return false;
  };
  return candidates.some((candidate) =>
    matchAt(candidate, selector.compounds.length - 1),
  );
}

function matchesLeadingRelation(
  anchor: Element,
  candidate: Element,
  leading: Combinator | null,
): boolean {
  const relation = leading ?? "descendant";
  if (relation === "child") {
    return parentElement(candidate) === anchor;
  }
  if (relation === "descendant") {
    return isDescendant(candidate, anchor);
  }
  if (relation === "adjacent") {
    return nextElementSibling(anchor) === candidate;
  }
  if (relation === "sibling") {
    let sibling = nextElementSibling(anchor);
    while (sibling !== null) {
      if (sibling === candidate) {
        return true;
      }
      sibling = nextElementSibling(sibling);
    }
  }
  return false;
}

function matchesAttribute(
  element: Element,
  selector: AttributeSelector,
): boolean {
  const attribute = findAttribute(element, selector.name, selector.namespace);
  if (attribute === null) {
    return false;
  }
  if (selector.operator === null || selector.value === null) {
    return true;
  }

  const insensitive =
    selector.modifier === "i" ||
    (selector.modifier === null &&
      element.namespaceURI === HTML_NAMESPACE &&
      attribute.namespaceURI === null &&
      ASCII_INSENSITIVE_HTML_ATTRIBUTES.has(asciiLower(attribute.localName)));
  const actual = insensitive ? asciiLower(attribute.value) : attribute.value;
  const expected = insensitive ? asciiLower(selector.value) : selector.value;

  switch (selector.operator) {
    case "=":
      return actual === expected;
    case "~=":
      return (
        expected !== "" && actual.split(ASCII_WHITESPACE).includes(expected)
      );
    case "|=":
      return actual === expected || actual.startsWith(`${expected}-`);
    case "^=":
      return expected !== "" && actual.startsWith(expected);
    case "$=":
      return expected !== "" && actual.endsWith(expected);
    case "*=":
      return expected !== "" && actual.includes(expected);
  }
}

function matchesPlainPseudoClass(
  element: Element,
  name: string,
  scope: SelectorRoot,
): boolean {
  const siblings = elementSiblings(element);
  const typeSiblings = siblings.filter((candidate) =>
    sameType(candidate, element),
  );
  switch (name) {
    case "root":
      return element.ownerDocument?.documentElement === element;
    case "scope":
      return scope.nodeType === 9
        ? (scope as Document).documentElement === element
        : scope.nodeType === 1 && scope === element;
    case "empty":
      return !element._childNodes.some(
        (child) =>
          child.nodeType === 1 ||
          (child.nodeType === 3 && child.textContent !== ""),
      );
    case "first-child":
      return siblings[0] === element;
    case "last-child":
      return siblings.at(-1) === element;
    case "only-child":
      return siblings.length === 1;
    case "first-of-type":
      return typeSiblings[0] === element;
    case "last-of-type":
      return typeSiblings.at(-1) === element;
    case "only-of-type":
      return typeSiblings.length === 1;
    case "any-link":
    case "link":
      return isLink(element);
    case "visited":
      return false;
    case "enabled":
      return supportsDisabled(element) && !isDisabled(element);
    case "disabled":
      return supportsDisabled(element) && isDisabled(element);
    case "checked":
      return isChecked(element);
    case "required":
      return supportsRequired(element) && hasAttribute(element, "required");
    case "optional":
      return supportsRequired(element) && !hasAttribute(element, "required");
    case "read-write":
      return isReadWrite(element);
    case "read-only":
      return !isReadWrite(element);
    case "placeholder-shown":
      return (
        ["input", "textarea"].includes(asciiLower(element.localName)) &&
        hasAttribute(element, "placeholder") &&
        (attributeValue(element, "value") ?? "") === ""
      );
    case "default":
      return isChecked(element) || hasAttribute(element, "selected");
    case "open":
    case "popover-open":
      return hasAttribute(element, "open");
    case "closed":
      return !hasAttribute(element, "open");
    case "defined":
      return (
        element.namespaceURI !== HTML_NAMESPACE ||
        !element.localName.includes("-")
      );
    case "active":
    case "autofill":
    case "blank":
    case "buffering":
    case "current":
    case "focus":
    case "focus-visible":
    case "focus-within":
    case "fullscreen":
    case "future":
    case "host":
    case "hover":
    case "in-range":
    case "indeterminate":
    case "invalid":
    case "local-link":
    case "modal":
    case "muted":
    case "out-of-range":
    case "past":
    case "paused":
    case "picture-in-picture":
    case "playing":
    case "seeking":
    case "stalled":
    case "target":
    case "target-within":
    case "user-invalid":
    case "user-valid":
    case "valid":
    case "volume-locked":
      return false;
    default:
      return false;
  }
}

function matchesNth(
  element: Element,
  selector: NthPseudoClass,
  scope: SelectorRoot,
): boolean {
  let siblings = elementSiblings(element);
  if (selector.name === "nth-of-type" || selector.name === "nth-last-of-type") {
    siblings = siblings.filter((candidate) => sameType(candidate, element));
  } else if (selector.of !== null) {
    siblings = siblings.filter((candidate) =>
      matchesSelectorList(candidate, selector.of ?? [], scope),
    );
  }
  let index = siblings.indexOf(element) + 1;
  if (
    selector.name === "nth-last-child" ||
    selector.name === "nth-last-of-type"
  ) {
    index = siblings.length - index + 1;
  }
  if (index <= 0) {
    return false;
  }
  if (selector.a === 0) {
    return index === selector.b;
  }
  const n = (index - selector.b) / selector.a;
  return Number.isInteger(n) && n >= 0;
}

function matchesLanguage(element: Element, ranges: readonly string[]): boolean {
  const language = languageOf(element);
  if (language === null) {
    return false;
  }
  const normalized = asciiLower(language);
  return ranges.some((range) => {
    const expected = asciiLower(range);
    return (
      expected === "*" ||
      normalized === expected ||
      normalized.startsWith(`${expected}-`)
    );
  });
}

function languageOf(element: Element): string | null {
  let current: Element | null = element;
  while (current !== null) {
    const language = attributeValue(current, "lang");
    if (language !== null) {
      return language === "" ? null : language;
    }
    const xmlLanguage = current._attributeNodes.find(
      (attribute) =>
        attribute.prefix === "xml" && attribute.localName === "lang",
    );
    if (xmlLanguage !== undefined) {
      return xmlLanguage.value === "" ? null : xmlLanguage.value;
    }
    current = parentElement(current);
  }
  return null;
}

function directionOf(element: Element): "ltr" | "rtl" {
  let current: Element | null = element;
  while (current !== null) {
    const direction = asciiLower(attributeValue(current, "dir") ?? "");
    if (direction === "ltr" || direction === "rtl") {
      return direction;
    }
    current = parentElement(current);
  }
  return "ltr";
}

function findAttribute(
  element: Element,
  name: string,
  namespace: NamespaceConstraint,
): Attr | null {
  for (const attribute of element._attributeNodes) {
    const namespaceMatches =
      namespace === "any" ||
      namespace === "unspecified" ||
      attribute.namespaceURI === null;
    if (!namespaceMatches) {
      continue;
    }
    const actualName = attribute.localName;
    const nameMatches =
      element.namespaceURI === HTML_NAMESPACE && attribute.namespaceURI === null
        ? asciiLower(actualName) === asciiLower(name)
        : actualName === name;
    if (nameMatches) {
      return attribute;
    }
  }
  return null;
}

function attributeValue(element: Element, name: string): string | null {
  return findAttribute(element, name, "none")?.value ?? null;
}

function hasAttribute(element: Element, name: string): boolean {
  return findAttribute(element, name, "none") !== null;
}

function namesEqual(
  element: Element,
  actual: string,
  expected: string,
): boolean {
  return element.namespaceURI === HTML_NAMESPACE
    ? asciiLower(actual) === asciiLower(expected)
    : actual === expected;
}

function identifierEquals(
  element: Element,
  actual: string | null,
  expected: string,
): boolean {
  if (actual === null) {
    return false;
  }
  return element.ownerDocument?._quirks === true
    ? asciiLower(actual) === asciiLower(expected)
    : actual === expected;
}

function matchesNamespace(
  element: Element,
  namespace: NamespaceConstraint,
): boolean {
  return namespace !== "none" || element.namespaceURI === null;
}

function isLink(element: Element): boolean {
  if (
    element.namespaceURI === HTML_NAMESPACE &&
    ["a", "area"].includes(asciiLower(element.localName))
  ) {
    return hasAttribute(element, "href");
  }
  return (
    element.namespaceURI === SVG_NAMESPACE &&
    element.localName === "a" &&
    hasAttribute(element, "href")
  );
}

function supportsDisabled(element: Element): boolean {
  return (
    element.namespaceURI === HTML_NAMESPACE &&
    [
      "button",
      "fieldset",
      "input",
      "optgroup",
      "option",
      "select",
      "textarea",
    ].includes(asciiLower(element.localName))
  );
}

function isDisabled(element: Element): boolean {
  if (hasAttribute(element, "disabled")) {
    return true;
  }
  if (asciiLower(element.localName) === "option") {
    const parent = parentElement(element);
    return (
      parent !== null &&
      asciiLower(parent.localName) === "optgroup" &&
      hasAttribute(parent, "disabled")
    );
  }
  return false;
}

function supportsRequired(element: Element): boolean {
  return (
    element.namespaceURI === HTML_NAMESPACE &&
    ["input", "select", "textarea"].includes(asciiLower(element.localName))
  );
}

function isChecked(element: Element): boolean {
  const name = asciiLower(element.localName);
  if (name === "option") {
    return hasAttribute(element, "selected");
  }
  if (name !== "input") {
    return false;
  }
  const type = asciiLower(attributeValue(element, "type") ?? "text");
  return (
    ["checkbox", "radio"].includes(type) && hasAttribute(element, "checked")
  );
}

function isReadWrite(element: Element): boolean {
  const contentEditable = asciiLower(
    attributeValue(element, "contenteditable") ?? "",
  );
  if (contentEditable === "" || contentEditable === "true") {
    if (hasAttribute(element, "contenteditable")) {
      return true;
    }
  }
  const name = asciiLower(element.localName);
  return (
    ["input", "textarea"].includes(name) &&
    !isDisabled(element) &&
    !hasAttribute(element, "readonly")
  );
}

function sameType(left: Element, right: Element): boolean {
  return (
    left.namespaceURI === right.namespaceURI &&
    left.localName === right.localName
  );
}

function descendantElements(root: SelectorRoot): Element[] {
  const result: Element[] = [];
  const visit = (node: Node): void => {
    for (const child of node._childNodes) {
      if (child.nodeType === 1) {
        const element = child as Element;
        result.push(element);
        visit(element);
      }
    }
  };
  visit(root);
  return result;
}

function elementChildren(node: Node): Element[] {
  return node._childNodes.filter(
    (child): child is Element => child.nodeType === 1,
  );
}

function elementSiblings(element: Element): Element[] {
  const parent = element._parentNode;
  return parent === null ? [element] : elementChildren(parent);
}

function parentElement(element: Element): Element | null {
  return element._parentNode?.nodeType === 1
    ? (element._parentNode as Element)
    : null;
}

function previousElementSibling(element: Element): Element | null {
  const siblings = elementSiblings(element);
  const index = siblings.indexOf(element);
  return index > 0 ? (siblings[index - 1] ?? null) : null;
}

function nextElementSibling(element: Element): Element | null {
  const siblings = elementSiblings(element);
  const index = siblings.indexOf(element);
  return index < 0 ? null : (siblings[index + 1] ?? null);
}

function isDescendant(element: Element, ancestor: Element): boolean {
  let parent = parentElement(element);
  while (parent !== null) {
    if (parent === ancestor) {
      return true;
    }
    parent = parentElement(parent);
  }
  return false;
}

function treeRoot(node: Node): Node {
  let root = node;
  while (root._parentNode !== null) {
    root = root._parentNode;
  }
  return root;
}

function trimTokens(tokens: readonly CSSToken[]): readonly CSSToken[] {
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

function onlyWhitespace(tokens: readonly CSSToken[]): boolean {
  return tokens.every((token) => token.type === "whitespace");
}

function skipWhitespace(tokens: readonly CSSToken[], start: number): number {
  let position = start;
  while (tokens[position]?.type === "whitespace") {
    position += 1;
  }
  return position;
}

function isDelim(
  token: CSSToken | undefined,
  value: string,
): token is Extract<CSSToken, { readonly type: "delim" }> {
  return token?.type === "delim" && token.value === value;
}

function asciiLower(value: string): string {
  return value.replace(/[A-Z]/g, (character) => character.toLowerCase());
}

function selectorSyntaxError(): DOMException {
  return new DOMException("The selector is invalid.", "SyntaxError");
}
