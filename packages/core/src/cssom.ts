import { bindDOMInterface } from "./dom/binding.js";
import type { Document, Element, ShadowRoot } from "./dom/nodes.js";
import { DOMException } from "./dom-exception.js";

const STYLE_SHEETS = new WeakMap<Element, CSSStyleSheet>();
const STYLE_SHEET_LISTS = new WeakMap<Document | ShadowRoot, StyleSheetList>();

export class CSSRule {
  static readonly STYLE_RULE = 1;

  readonly STYLE_RULE = 1;
  readonly parentRule: CSSRule | null = null;
  readonly type = CSSRule.STYLE_RULE;

  constructor(
    private ruleText: string,
    readonly parentStyleSheet: CSSStyleSheet | null = null,
  ) {
    bindDOMInterface(this, this);
  }

  get cssText(): string {
    return this.ruleText;
  }

  set cssText(value: string) {
    this.ruleText = value;
    this.parentStyleSheet?.replaceRuleText(this, this.ruleText);
  }
}

export class CSSStyleRule extends CSSRule {
  constructor(
    private selector: string,
    private declarations: string,
    parentStyleSheet: CSSStyleSheet | null = null,
  ) {
    super(serializeStyleRule(selector, declarations), parentStyleSheet);
  }

  get selectorText(): string {
    return this.selector;
  }

  set selectorText(value: string) {
    const selector = value.trim();
    if (selector === "") {
      return;
    }
    this.selector = selector;
    this.updateRuleText();
  }

  override set cssText(value: string) {
    const parsed = parseStyleRule(value);
    if (parsed === null) {
      return;
    }
    this.selector = parsed.selector;
    this.declarations = parsed.declarations;
    this.updateRuleText();
  }

  override get cssText(): string {
    return super.cssText;
  }

  private updateRuleText(): void {
    super.cssText = serializeStyleRule(this.selector, this.declarations);
  }
}

export class CSSRuleList implements Iterable<CSSRule> {
  readonly [index: number]: CSSRule;

  constructor(private readonly rules: () => readonly CSSRule[]) {
    bindDOMInterface(this, this);
  }

  get length(): number {
    return this.rules().length;
  }

  item(index: number): CSSRule | null {
    return this.rules()[index] ?? null;
  }

  [Symbol.iterator](): Iterator<CSSRule> {
    return this.rules()[Symbol.iterator]();
  }
}

export class CSSStyleSheet {
  readonly #rules: CSSRule[] = [];
  readonly #cssRules = new CSSRuleList(() => this.#rules);

  constructor(readonly ownerNode: Element | null = null) {
    bindDOMInterface(this, this);
    this.replaceFromOwnerNode();
  }

  get cssRules(): CSSRuleList {
    this.replaceFromOwnerNodeIfChanged();
    return this.#cssRules;
  }

  get rules(): CSSRuleList {
    return this.cssRules;
  }

  insertRule(rule: string, index = this.cssRules.length): number {
    const ruleText = rule.trim();
    const insertionIndex = index >>> 0;
    if (insertionIndex > this.#rules.length) {
      throw new DOMException(
        "Rule index is outside the rule list",
        "IndexSizeError",
      );
    }
    const parsed = createRule(ruleText, this);
    if (parsed === null) {
      throw new DOMException("The rule could not be parsed", "SyntaxError");
    }
    this.#rules.splice(insertionIndex, 0, parsed);
    this.updateOwnerNode();
    return insertionIndex;
  }

  deleteRule(index: number): void {
    const deletionIndex = index >>> 0;
    if (deletionIndex >= this.#rules.length) {
      throw new DOMException(
        "Rule index is outside the rule list",
        "IndexSizeError",
      );
    }
    this.#rules.splice(deletionIndex, 1);
    this.updateOwnerNode();
  }

  replaceRuleText(rule: CSSRule, ruleText: string): void {
    const index = this.#rules.indexOf(rule);
    if (index < 0) {
      return;
    }
    const replacement = createRule(ruleText, this);
    if (replacement === null) {
      return;
    }
    this.#rules[index] = replacement;
    this.updateOwnerNode();
  }

  private replaceFromOwnerNodeIfChanged(): void {
    if (
      this.ownerNode !== null &&
      serializeRules(this.#rules) !== (this.ownerNode.textContent ?? "")
    ) {
      this.replaceFromOwnerNode();
    }
  }

  private replaceFromOwnerNode(): void {
    if (this.ownerNode === null) {
      return;
    }
    this.#rules.splice(
      0,
      this.#rules.length,
      ...parseRuleList(this.ownerNode.textContent ?? "", this),
    );
  }

  private updateOwnerNode(): void {
    if (this.ownerNode !== null) {
      this.ownerNode.textContent = serializeRules(this.#rules);
    }
  }
}

export class StyleSheetList implements Iterable<CSSStyleSheet> {
  readonly [index: number]: CSSStyleSheet;

  constructor(private readonly root: Document | ShadowRoot) {
    bindDOMInterface(this, this);
  }

  get length(): number {
    return this.sheets().length;
  }

  item(index: number): CSSStyleSheet | null {
    return this.sheets()[index] ?? null;
  }

  [Symbol.iterator](): Iterator<CSSStyleSheet> {
    return this.sheets()[Symbol.iterator]();
  }

  private sheets(): CSSStyleSheet[] {
    const elements = this.root.querySelectorAll("style");
    const sheets: CSSStyleSheet[] = [];
    for (let index = 0; index < elements.length; index += 1) {
      const element = elements.item(index);
      if (element === null) {
        continue;
      }
      const sheet = styleSheetForElement(element);
      if (sheet !== null) {
        sheets.push(sheet);
      }
    }
    return sheets;
  }
}

export function styleSheetForElement(element: Element): CSSStyleSheet | null {
  if (!element.isConnected) {
    return null;
  }
  let sheet = STYLE_SHEETS.get(element);
  if (sheet === undefined) {
    sheet = new CSSStyleSheet(element);
    STYLE_SHEETS.set(element, sheet);
  }
  return sheet;
}

export function styleSheetsForRoot(
  root: Document | ShadowRoot,
): StyleSheetList {
  let list = STYLE_SHEET_LISTS.get(root);
  if (list === undefined) {
    list = new StyleSheetList(root);
    STYLE_SHEET_LISTS.set(root, list);
  }
  return list;
}

function parseRuleList(source: string, sheet: CSSStyleSheet): CSSRule[] {
  const rules: CSSRule[] = [];
  let start = 0;
  let depth = 0;
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (character === "{") {
      depth += 1;
    } else if (character === "}") {
      depth -= 1;
      if (depth === 0) {
        const rule = createRule(source.slice(start, index + 1).trim(), sheet);
        if (rule !== null) {
          rules.push(rule);
        }
        start = index + 1;
      }
    }
  }
  return rules;
}

function createRule(source: string, sheet: CSSStyleSheet): CSSRule | null {
  if (source.startsWith("@") && hasBalancedBlock(source)) {
    return new CSSRule(source, sheet);
  }
  const parsed = parseStyleRule(source);
  return parsed === null
    ? null
    : new CSSStyleRule(parsed.selector, parsed.declarations, sheet);
}

function parseStyleRule(
  source: string,
): { selector: string; declarations: string } | null {
  if (!hasBalancedBlock(source)) {
    return null;
  }
  const openingBrace = source.indexOf("{");
  const selector = source.slice(0, openingBrace).trim();
  if (selector === "" || selector.startsWith("@")) {
    return null;
  }
  return {
    selector,
    declarations: source.slice(openingBrace + 1, -1).trim(),
  };
}

function hasBalancedBlock(source: string): boolean {
  const openingBrace = source.indexOf("{");
  if (openingBrace < 1 || !source.endsWith("}")) {
    return false;
  }
  let depth = 0;
  for (let index = openingBrace; index < source.length; index += 1) {
    if (source[index] === "{") {
      depth += 1;
    } else if (source[index] === "}") {
      depth -= 1;
      if (depth === 0 && index !== source.length - 1) {
        return false;
      }
      if (depth < 0) {
        return false;
      }
    }
  }
  return depth === 0;
}

function serializeStyleRule(selector: string, declarations: string): string {
  return `${selector} { ${declarations} }`;
}

function serializeRules(rules: readonly CSSRule[]): string {
  return rules.map((rule) => rule.cssText).join("\n");
}
