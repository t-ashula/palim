import { bindDOMInterface } from "./dom/binding.js";
import type { Document, Element, ShadowRoot } from "./dom/nodes.js";
import { setStyleSheetsProvider } from "./dom/nodes.js";
import { DOMException } from "./dom-exception.js";
import type { CSSStyleProperties } from "./html-elements.js";
import {
  createCSSStyleProperties,
  setHTMLStyleSheetProvider,
} from "./html-elements.js";

const STYLE_SHEETS = new WeakMap<Element, CSSStyleSheet>();
const STYLE_SHEET_LISTS = new WeakMap<Document | ShadowRoot, StyleSheetList>();

export class CSSRule {
  static readonly STYLE_RULE = 1;
  static readonly MEDIA_RULE = 4;

  readonly STYLE_RULE = 1;
  readonly MEDIA_RULE = 4;
  readonly parentRule: CSSRule | null = null;
  readonly type: number = CSSRule.STYLE_RULE;

  constructor(
    private ruleText: string,
    readonly parentStyleSheet: CSSStyleSheet | null = null,
    parentRule: CSSRule | null = null,
  ) {
    this.parentRule = parentRule;
    bindDOMInterface(this, this);
  }

  get cssText(): string {
    return this.ruleText;
  }

  set cssText(value: string) {
    this.ruleText = value;
    this.parentStyleSheet?.ruleChanged(this);
  }
}

export class CSSStyleRule extends CSSRule {
  readonly style: CSSStyleProperties;

  constructor(
    private selector: string,
    private declarations: string,
    parentStyleSheet: CSSStyleSheet | null = null,
    parentRule: CSSRule | null = null,
  ) {
    super(
      serializeStyleRule(selector, declarations),
      parentStyleSheet,
      parentRule,
    );
    this.style = createCSSStyleProperties(
      () => this.declarations,
      (value) => {
        this.declarations = value;
        this.updateRuleText();
      },
      this,
    );
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

export class CSSGroupingRule extends CSSRule {
  readonly #rules: CSSRule[];
  readonly #cssRules = new CSSRuleList(() => this.#rules);

  constructor(
    private readonly ruleName: string,
    block: string,
    parentStyleSheet: CSSStyleSheet | null = null,
    parentRule: CSSRule | null = null,
  ) {
    super("", parentStyleSheet, parentRule);
    this.#rules = parseRuleList(block, parentStyleSheet, this);
  }

  get cssRules(): CSSRuleList {
    return this.#cssRules;
  }

  insertRule(rule: string, index = this.#rules.length): number {
    const insertionIndex = index >>> 0;
    if (insertionIndex > this.#rules.length) {
      throw new DOMException(
        "Rule index is outside the rule list",
        "IndexSizeError",
      );
    }
    const ruleText = rule.trim();
    if (/^@(import|namespace)\b/iu.test(ruleText)) {
      throw new DOMException(
        "The rule is not allowed inside a grouping rule",
        "HierarchyRequestError",
      );
    }
    const parsed = createRule(ruleText, this.parentStyleSheet, this);
    if (parsed === null) {
      throw new DOMException("The rule could not be parsed", "SyntaxError");
    }
    this.#rules.splice(insertionIndex, 0, parsed);
    this.ruleChanged();
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
    this.ruleChanged();
  }

  override get cssText(): string {
    return `${this.ruleName} { ${serializeRules(this.#rules)} }`;
  }

  override set cssText(value: string) {
    if (value === this.cssText) {
      return;
    }
  }

  protected serializedRules(): string {
    return serializeRules(this.#rules);
  }

  protected ruleChanged(): void {
    this.parentStyleSheet?.ruleChanged(this);
  }
}

export class CSSConditionRule extends CSSGroupingRule {
  constructor(
    ruleName: string,
    private condition: string,
    block: string,
    parentStyleSheet: CSSStyleSheet | null = null,
    parentRule: CSSRule | null = null,
  ) {
    super(`${ruleName} ${condition}`, block, parentStyleSheet, parentRule);
  }

  get conditionText(): string {
    return this.condition;
  }

  protected setConditionText(value: string): void {
    this.condition = value;
    this.ruleChanged();
  }
}

export class CSSMediaRule extends CSSConditionRule {
  readonly #media: MediaList;

  constructor(
    condition: string,
    block: string,
    parentStyleSheet: CSSStyleSheet | null = null,
    parentRule: CSSRule | null = null,
  ) {
    const normalizedCondition = serializeMediaQueryList(
      parseMediaQueryList(condition),
    );
    super("@media", normalizedCondition, block, parentStyleSheet, parentRule);
    this.#media = new MediaList(
      () => this.conditionText,
      (value) => {
        this.setConditionText(value);
      },
    );
  }

  override readonly type = CSSRule.MEDIA_RULE;

  get media(): MediaList {
    return this.#media;
  }

  override get cssText(): string {
    return `@media ${this.conditionText} { ${this.serializedRules()} }`;
  }

  override set cssText(value: string) {
    if (value === this.cssText) {
      return;
    }
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

export class MediaList implements Iterable<string> {
  readonly [index: number]: string;

  constructor(
    private readonly read: () => string,
    private readonly write: (value: string) => void,
  ) {
    bindDOMInterface(this, this);
  }

  get mediaText(): string {
    return serializeMediaQueryList(parseMediaQueryList(this.read()));
  }

  set mediaText(value: string) {
    this.write(serializeMediaQueryList(parseMediaQueryList(value)));
  }

  get length(): number {
    return parseMediaQueryList(this.read()).length;
  }

  item(index: number): string | null {
    if (!Number.isInteger(index) || index < 0) {
      return null;
    }
    return parseMediaQueryList(this.read())[index] ?? null;
  }

  appendMedium(medium: string): void {
    const parsed = parseMediaQueryList(medium);
    if (parsed.length !== 1) {
      return;
    }
    const query = parsed[0];
    if (query === undefined) {
      return;
    }
    const media = parseMediaQueryList(this.read());
    if (!media.includes(query)) {
      media.push(query);
      this.write(serializeMediaQueryList(media));
    }
  }

  deleteMedium(medium: string): void {
    const parsed = parseMediaQueryList(medium);
    const media = parseMediaQueryList(this.read());
    const retained =
      parsed.length === 1 ? media.filter((item) => item !== parsed[0]) : media;
    if (retained.length === media.length) {
      throw new DOMException("The medium was not found", "NotFoundError");
    }
    this.write(serializeMediaQueryList(retained));
  }

  toString(): string {
    return this.mediaText;
  }

  [Symbol.iterator](): Iterator<string> {
    return parseMediaQueryList(this.read())[Symbol.iterator]();
  }
}

export class CSSStyleSheet {
  readonly #rules: CSSRule[] = [];
  readonly #cssRules = new CSSRuleList(() => this.#rules);
  readonly #media: MediaList;
  #constructedMedia = "";

  constructor(readonly ownerNode: Element | null = null) {
    bindDOMInterface(this, this);
    this.#media = new MediaList(
      () => this.ownerNode?.getAttribute("media") ?? this.#constructedMedia,
      (value) => {
        if (this.ownerNode === null) {
          this.#constructedMedia = value;
        } else {
          this.ownerNode.setAttribute("media", value);
        }
      },
    );
    this.replaceFromOwnerNode();
  }

  get media(): MediaList {
    return this.#media;
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

  ruleChanged(_rule: CSSRule): void {
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

setHTMLStyleSheetProvider(styleSheetForElement);
setStyleSheetsProvider(styleSheetsForRoot);

function parseMediaQueryList(source: string): string[] {
  if (source.trim() === "") {
    return [];
  }
  return splitMediaQueries(source).map(serializeMediaQuery);
}

function splitMediaQueries(source: string): string[] {
  const queries: string[] = [];
  let start = 0;
  let depth = 0;
  for (let index = 0; index < source.length; index += 1) {
    if (source[index] === "(") {
      depth += 1;
    } else if (source[index] === ")") {
      depth -= 1;
    } else if (source[index] === "," && depth === 0) {
      queries.push(source.slice(start, index));
      start = index + 1;
    }
  }
  queries.push(source.slice(start));
  return queries;
}

function serializeMediaQuery(source: string): string {
  const query = source.trim().toLowerCase();
  if (
    query === "" ||
    !hasBalancedParentheses(query) ||
    /[^a-z0-9\s():./%_-]/u.test(query)
  ) {
    return "not all";
  }
  return query
    .replace(/\s+/gu, " ")
    .replace(/\s*:\s*/gu, ": ")
    .replace(/\(\s+/gu, "(")
    .replace(/\s+\)/gu, ")");
}

function hasBalancedParentheses(source: string): boolean {
  let depth = 0;
  for (const character of source) {
    if (character === "(") {
      depth += 1;
    } else if (character === ")") {
      depth -= 1;
      if (depth < 0) {
        return false;
      }
    }
  }
  return depth === 0;
}

function serializeMediaQueryList(queries: readonly string[]): string {
  return queries.join(", ");
}

function parseRuleList(
  source: string,
  sheet: CSSStyleSheet | null,
  parentRule: CSSRule | null = null,
): CSSRule[] {
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
        const rule = createRule(
          source.slice(start, index + 1).trim(),
          sheet,
          parentRule,
        );
        if (rule !== null) {
          rules.push(rule);
        }
        start = index + 1;
      }
    }
  }
  return rules;
}

function createRule(
  source: string,
  sheet: CSSStyleSheet | null,
  parentRule: CSSRule | null = null,
): CSSRule | null {
  if (/^@media\b/iu.test(source) && hasBalancedBlock(source)) {
    const openingBrace = source.indexOf("{");
    return new CSSMediaRule(
      source.slice("@media".length, openingBrace).trim(),
      source.slice(openingBrace + 1, -1).trim(),
      sheet,
      parentRule,
    );
  }
  if (source.startsWith("@") && hasBalancedBlock(source)) {
    return new CSSRule(source, sheet, parentRule);
  }
  const parsed = parseStyleRule(source);
  return parsed === null
    ? null
    : new CSSStyleRule(parsed.selector, parsed.declarations, sheet, parentRule);
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
