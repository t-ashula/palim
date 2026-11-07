import type { Node, Document, DocumentFragment, DOMTokenList } from "./dom.js";
import {
  Element,
  Event,
  EventTarget,
  HTMLCollection,
  NodeList,
  Text,
} from "./dom.js";
import { DOMException } from "./dom-exception.js";
import { bindDOMInterface, implementationFor } from "./dom/binding.js";
import { createDefinedCustomElement } from "./dom/custom-elements.js";
import { tokenizeCSS } from "./css-syntax.js";
import type { CSSToken } from "./css-syntax.js";
import {
  createCollectionImplementation,
  createHTMLCollection,
  createNodeList,
} from "./dom/collections.js";
import { EventTargetImplementation } from "./dom/event-implementation.js";
import { nodeImplementation } from "./dom/node-implementation.js";
import {
  assignedSlotNodes,
  childNodes,
  createDocumentFragment,
  createElementImplementation,
  createElementInterface,
  createText,
  setDocumentElementFactory,
  setTemplateContents,
  templateContentsDocument,
} from "./dom/nodes.js";
import { createDOMTokenList } from "./dom/token-list.js";
import {
  deleteTableItem,
  insertTableRow as insertTableRowAt,
  insertTableRowCell,
  insertTableSectionRow,
  placeTableBody,
  placeTableCaption,
  placeTableFoot,
  placeTableHead,
  tableBodies,
  tableCaption,
  tableFoot,
  tableHead,
  tableRowCells,
  tableRows,
  tableSectionRows,
} from "./html-table.js";
import { HTML_NAMESPACE } from "./namespaces.js";
import { requireArguments, toLong } from "./web-idl.js";
import { URL } from "./url/index.js";

interface URLValue {
  href: string;
  readonly origin: string;
  protocol: string;
  username: string;
  password: string;
  host: string;
  hostname: string;
  port: string;
  pathname: string;
  search: string;
  hash: string;
}

const FORM_CONTROL_RESETTERS = new WeakMap<Element, () => void>();
const INLINE_STYLE_DECLARATIONS = new WeakMap<
  HTMLElement,
  CSSStyleProperties
>();
const INLINE_STYLE_CONSTRUCTION = Symbol("inline style construction");

const DIRECT_HTML_ELEMENT_NAMES = new Set([
  "abbr",
  "acronym",
  "address",
  "article",
  "aside",
  "b",
  "basefont",
  "bdi",
  "bdo",
  "big",
  "center",
  "cite",
  "code",
  "dd",
  "dfn",
  "dt",
  "em",
  "figcaption",
  "figure",
  "footer",
  "header",
  "hgroup",
  "i",
  "kbd",
  "main",
  "mark",
  "nav",
  "nobr",
  "noembed",
  "noframes",
  "noscript",
  "plaintext",
  "rb",
  "rp",
  "rt",
  "rtc",
  "ruby",
  "s",
  "samp",
  "search",
  "section",
  "small",
  "strike",
  "strong",
  "sub",
  "summary",
  "sup",
  "tt",
  "u",
  "var",
  "wbr",
]);

const UNKNOWN_HTML_ELEMENT_NAMES = new Set([
  "applet",
  "bgsound",
  "blink",
  "isindex",
  "keygen",
  "multicol",
  "nextid",
  "spacer",
]);

const SPECIALIZED_HTML_ELEMENT_NAMES = new Set([
  "a",
  "area",
  "audio",
  "base",
  "blockquote",
  "body",
  "br",
  "button",
  "canvas",
  "caption",
  "col",
  "colgroup",
  "data",
  "datalist",
  "del",
  "details",
  "dialog",
  "dir",
  "div",
  "dl",
  "embed",
  "fieldset",
  "font",
  "form",
  "frame",
  "frameset",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "head",
  "hr",
  "html",
  "iframe",
  "img",
  "input",
  "ins",
  "label",
  "legend",
  "li",
  "link",
  "listing",
  "map",
  "marquee",
  "menu",
  "meta",
  "meter",
  "object",
  "ol",
  "optgroup",
  "option",
  "output",
  "p",
  "param",
  "picture",
  "pre",
  "progress",
  "q",
  "script",
  "select",
  "slot",
  "source",
  "span",
  "style",
  "table",
  "tbody",
  "td",
  "template",
  "textarea",
  "tfoot",
  "th",
  "thead",
  "time",
  "title",
  "tr",
  "track",
  "ul",
  "video",
  "xmp",
]);

const RESERVED_CUSTOM_ELEMENT_NAMES = new Set([
  "annotation-xml",
  "color-profile",
  "font-face",
  "font-face-src",
  "font-face-uri",
  "font-face-format",
  "font-face-name",
  "missing-glyph",
]);

export class DOMStringMap {
  [name: string]: string | undefined;

  constructor(implementation?: unknown) {
    if (!(implementation instanceof DOMStringMapImplementation)) {
      throw new TypeError("Illegal constructor");
    }
    bindDOMInterface(this, implementation);
    const proxy = new Proxy(this, {
      get(target, property): unknown {
        if (typeof property !== "string" || property in target) {
          return Reflect.get(target, property, target);
        }
        const attributeName = datasetAttributeName(property);
        return datasetElement(target).getAttribute(attributeName) ?? undefined;
      },
      set(target, property, value): boolean {
        if (typeof property !== "string") {
          return Reflect.set(target, property, value, target);
        }
        datasetElement(target).setAttribute(
          datasetAttributeName(property),
          domString(value),
        );
        return true;
      },
      deleteProperty(target, property): boolean {
        if (typeof property === "string") {
          datasetElement(target).removeAttribute(
            datasetAttributeName(property),
          );
        }
        return true;
      },
      ownKeys(target): string[] {
        return datasetElement(target)
          .getAttributeNames()
          .filter(isDatasetAttribute)
          .map(datasetPropertyName);
      },
      getOwnPropertyDescriptor(
        target,
        property,
      ): PropertyDescriptor | undefined {
        if (
          typeof property === "string" &&
          datasetElement(target).hasAttribute(datasetAttributeName(property))
        ) {
          return { configurable: true, enumerable: true, writable: true };
        }
        return undefined;
      },
    });
    bindDOMInterface(proxy, implementation);
    return proxy;
  }
}

class DOMStringMapImplementation {
  constructor(readonly element: Element) {}
}

function createDOMStringMap(element: Element): DOMStringMap {
  return new DOMStringMap(new DOMStringMapImplementation(element));
}

function datasetElement(dataset: DOMStringMap): Element {
  return (implementationFor(dataset) as DOMStringMapImplementation).element;
}

export type EventHandler = ((event: Event) => unknown) | null;

export class CSSStyleDeclaration {
  readonly [index: number]: string;

  constructor(
    readonly element: HTMLElement,
    construction?: symbol,
  ) {
    if (construction !== INLINE_STYLE_CONSTRUCTION) {
      throw new TypeError("Illegal constructor");
    }
  }

  get cssText(): string {
    return serializeInlineStyleDeclarations(
      inlineStyleDeclarations(this.element),
    );
  }

  set cssText(value: string) {
    setInlineStyleDeclarations(
      this.element,
      parseInlineStyleDeclarations(legacyNullToEmptyString(value)),
    );
  }

  get length(): number {
    return inlineStyleDeclarations(this.element).length;
  }

  item(index: number): string {
    requireArguments(arguments.length, 1);
    return (
      inlineStyleDeclarations(this.element)[toUnsignedLong(index)]?.name ?? ""
    );
  }

  getPropertyValue(property: string): string {
    requireArguments(arguments.length, 1);
    const name = normalizedCSSPropertyName(domString(property));
    return findInlineStyleDeclaration(this.element, name)?.value ?? "";
  }

  getPropertyPriority(property: string): string {
    requireArguments(arguments.length, 1);
    const name = normalizedCSSPropertyName(domString(property));
    return findInlineStyleDeclaration(this.element, name)?.important === true
      ? "important"
      : "";
  }

  setProperty(property: string, value: string, priority = ""): void {
    requireArguments(arguments.length, 2);
    const name = normalizedCSSPropertyName(domString(property));
    const convertedValue = domString(value);
    if (convertedValue === "") {
      this.removeProperty(name);
      return;
    }
    const convertedPriority = asciiLowercase(domString(priority));
    if (convertedPriority !== "" && convertedPriority !== "important") {
      return;
    }
    if (!isSupportedCSSProperty(name)) {
      return;
    }
    const parsedValue = parseCSSPropertyValue(name, convertedValue);
    if (parsedValue === null) {
      return;
    }
    const declarations = inlineStyleDeclarations(this.element);
    const declaration = {
      name,
      value: parsedValue,
      important: convertedPriority === "important",
    };
    const index = declarations.findIndex((item) => item.name === name);
    if (index < 0) {
      declarations.push(declaration);
    } else {
      declarations[index] = declaration;
    }
    setInlineStyleDeclarations(this.element, declarations);
  }

  removeProperty(property: string): string {
    requireArguments(arguments.length, 1);
    const name = normalizedCSSPropertyName(domString(property));
    const declarations = inlineStyleDeclarations(this.element);
    const declaration = declarations.find((item) => item.name === name);
    if (declaration === undefined) {
      return "";
    }
    setInlineStyleDeclarations(
      this.element,
      declarations.filter((item) => item !== declaration),
    );
    return declaration.value;
  }

  readonly parentRule = null;
}

export class CSSStyleProperties extends CSSStyleDeclaration {
  get backgroundColor(): string {
    return this.getPropertyValue("background-color");
  }

  set backgroundColor(value: string) {
    this.setProperty("background-color", legacyNullToEmptyString(value));
  }

  get color(): string {
    return this.getPropertyValue("color");
  }

  set color(value: string) {
    this.setProperty("color", legacyNullToEmptyString(value));
  }

  get cssFloat(): string {
    return this.getPropertyValue("float");
  }

  set cssFloat(value: string) {
    this.setProperty("float", legacyNullToEmptyString(value));
  }

  get float(): string {
    return this.getPropertyValue("float");
  }

  set float(value: string) {
    this.setProperty("float", legacyNullToEmptyString(value));
  }

  get display(): string {
    return this.getPropertyValue("display");
  }

  set display(value: string) {
    this.setProperty("display", legacyNullToEmptyString(value));
  }

  get visibility(): string {
    return this.getPropertyValue("visibility");
  }

  set visibility(value: string) {
    this.setProperty("visibility", legacyNullToEmptyString(value));
  }
}

export class HTMLElement extends Element {
  #dataset: DOMStringMap | null = null;
  #popoverVisible = false;

  constructor() {
    const construction = currentHTMLConstruction();
    super(
      createElementImplementation(
        construction.document,
        construction.localName,
        HTML_NAMESPACE,
        construction.prefix,
      ),
    );
  }

  get title(): string {
    return this.getAttribute("title") ?? "";
  }

  set title(value: string) {
    this.setAttribute("title", value);
  }

  get slot(): string {
    return this.getAttribute("slot") ?? "";
  }

  set slot(value: string) {
    this.setAttribute("slot", value);
  }

  get style(): CSSStyleProperties {
    let declaration = INLINE_STYLE_DECLARATIONS.get(this);
    if (declaration === undefined) {
      declaration = createInlineStyleDeclaration(this);
      INLINE_STYLE_DECLARATIONS.set(this, declaration);
    }
    return declaration;
  }

  set style(value: string | CSSStyleProperties) {
    this.style.cssText = legacyNullToEmptyString(value);
  }

  get lang(): string {
    return this.getAttribute("lang") ?? "";
  }

  set lang(value: string) {
    this.setAttribute("lang", value);
  }

  get translate(): boolean {
    return translationMode(this);
  }

  set translate(value: boolean) {
    this.setAttribute("translate", value ? "yes" : "no");
  }

  get inert(): boolean {
    return this.hasAttribute("inert");
  }

  set inert(value: boolean) {
    this.toggleAttribute("inert", value);
  }

  get accessKey(): string {
    return this.getAttribute("accesskey") ?? "";
  }

  set accessKey(value: string) {
    this.setAttribute("accesskey", value);
  }

  get dir(): string {
    return reflectedString(this, "dir");
  }

  set dir(value: string) {
    this.setAttribute("dir", value);
  }

  get hidden(): boolean | number | string | null {
    const value = this.getAttribute("hidden");
    return value === null ? false : value === "until-found" ? value : true;
  }

  set hidden(value: boolean | number | string | null) {
    if (!value) {
      this.removeAttribute("hidden");
    } else {
      this.setAttribute("hidden", value === "until-found" ? value : "");
    }
  }

  click(): void {
    this.dispatchEvent(new Event("click", { bubbles: true, cancelable: true }));
  }

  readonly accessKeyLabel = "";

  get draggable(): boolean {
    const value = asciiLowercase(this.getAttribute("draggable") ?? "");
    if (value === "true") {
      return true;
    }
    if (value === "false") {
      return false;
    }
    return this.localName === "img" || this.localName === "a";
  }

  set draggable(value: boolean) {
    this.setAttribute("draggable", value ? "true" : "false");
  }

  get spellcheck(): boolean {
    return asciiLowercase(this.getAttribute("spellcheck") ?? "") !== "false";
  }

  set spellcheck(value: boolean) {
    this.setAttribute("spellcheck", value ? "true" : "false");
  }

  get writingSuggestions(): string {
    return reflectedString(this, "writingsuggestions");
  }

  set writingSuggestions(value: string) {
    this.setAttribute("writingsuggestions", value);
  }

  get autocapitalize(): string {
    return reflectedString(this, "autocapitalize");
  }

  set autocapitalize(value: string) {
    this.setAttribute("autocapitalize", value);
  }

  get autocorrect(): boolean {
    return asciiLowercase(this.getAttribute("autocorrect") ?? "") !== "off";
  }

  set autocorrect(value: boolean) {
    this.setAttribute("autocorrect", value ? "on" : "off");
  }

  get innerText(): string {
    return this.textContent ?? "";
  }

  set innerText(value: string) {
    replaceText(this, domString(value));
  }

  get outerText(): string {
    return this.innerText;
  }

  set outerText(value: string) {
    const parent = this.parentNode;
    if (parent === null) {
      throw new DOMException(
        "The element has no parent",
        "NoModificationAllowedError",
      );
    }
    const document = this.ownerDocument;
    if (document === null) {
      throw new TypeError("Element has no owner document");
    }
    parent.replaceChild(createText(document, domString(value)), this);
  }

  attachInternals(): never {
    throw new DOMException(
      "Element internals are only available to custom elements",
      "NotSupportedError",
    );
  }

  showPopover(): void {
    if (this.popover === null) {
      throw new DOMException(
        "The element is not a popover",
        "NotSupportedError",
      );
    }
    this.#popoverVisible = true;
  }

  hidePopover(): void {
    if (this.popover === null) {
      throw new DOMException(
        "The element is not a popover",
        "NotSupportedError",
      );
    }
    this.#popoverVisible = false;
  }

  togglePopover(options?: boolean | { force?: boolean }): boolean {
    const force = typeof options === "boolean" ? options : options?.force;
    const visible = force ?? !this.#popoverVisible;
    if (visible) {
      this.showPopover();
    } else {
      this.hidePopover();
    }
    return this.#popoverVisible;
  }

  get popover(): string | null {
    const value = this.getAttribute("popover");
    return value === null
      ? null
      : asciiLowercase(value) === "manual"
        ? "manual"
        : "auto";
  }

  set popover(value: string | null) {
    if (value === null) {
      this.removeAttribute("popover");
    } else {
      this.setAttribute("popover", value);
    }
  }

  get headingOffset(): number {
    return reflectedUnsignedLongInRange(this, "headingoffset", 0, 8, 0);
  }

  set headingOffset(value: number) {
    this.setAttribute("headingoffset", String(toUnsignedLong(value)));
  }

  get headingReset(): boolean {
    return this.hasAttribute("headingreset");
  }

  set headingReset(value: boolean) {
    this.toggleAttribute("headingreset", value);
  }

  get dataset(): DOMStringMap {
    this.#dataset ??= createDOMStringMap(this);
    return this.#dataset;
  }

  get nonce(): string {
    return reflectedString(this, "nonce");
  }

  set nonce(value: string) {
    this.setAttribute("nonce", value);
  }

  get autofocus(): boolean {
    return this.hasAttribute("autofocus");
  }

  set autofocus(value: boolean) {
    this.toggleAttribute("autofocus", value);
  }

  get tabIndex(): number {
    return this.hasAttribute("tabindex")
      ? reflectedLong(this, "tabindex")
      : defaultTabIndex(this);
  }

  set tabIndex(value: number) {
    this.setAttribute("tabindex", String(toLong(value)));
  }

  focus(): void {
    this.dispatchEvent(new Event("focus"));
  }

  blur(): void {
    this.dispatchEvent(new Event("blur"));
  }

  get contentEditable(): string {
    const value = asciiLowercase(this.getAttribute("contenteditable") ?? "");
    if (value === "true" || value === "") {
      return this.hasAttribute("contenteditable") ? "true" : "inherit";
    }
    return value === "false" || value === "plaintext-only" ? value : "inherit";
  }

  set contentEditable(value: string) {
    const converted = asciiLowercase(domString(value));
    if (converted === "inherit") {
      this.removeAttribute("contenteditable");
      return;
    }
    if (!["true", "false", "plaintext-only"].includes(converted)) {
      throw new DOMException("Invalid contentEditable value", "SyntaxError");
    }
    this.setAttribute("contenteditable", converted);
  }

  get enterKeyHint(): string {
    return reflectedString(this, "enterkeyhint");
  }

  set enterKeyHint(value: string) {
    this.setAttribute("enterkeyhint", value);
  }

  get inputMode(): string {
    return reflectedString(this, "inputmode");
  }

  set inputMode(value: string) {
    this.setAttribute("inputmode", value);
  }

  get isContentEditable(): boolean {
    if (
      this.contentEditable === "true" ||
      this.contentEditable === "plaintext-only"
    ) {
      return true;
    }
    if (this.contentEditable === "false") {
      return false;
    }
    return this.parentElement instanceof HTMLElement
      ? this.parentElement.isContentEditable
      : false;
  }
}

export class HTMLUnknownElement extends HTMLElement {}

export class HTMLHtmlElement extends HTMLElement {
  get version(): string {
    return this.getAttribute("version") ?? "";
  }

  set version(value: string) {
    this.setAttribute("version", value);
  }
}

export class HTMLHeadElement extends HTMLElement {}

export class HTMLTitleElement extends HTMLElement {
  get text(): string {
    return this.textContent ?? "";
  }

  set text(value: string) {
    const converted = domString(value);
    for (const child of childNodes(this)) {
      this.removeChild(child);
    }
    if (converted !== "") {
      const document = this.ownerDocument;
      if (document === null) {
        throw new TypeError("Element has no owner document");
      }
      this.appendChild(createText(document, converted));
    }
  }
}

export class HTMLPreElement extends HTMLElement {
  get width(): number {
    return reflectedLong(this, "width");
  }

  set width(value: number) {
    this.setAttribute("width", String(toLong(value)));
  }
}

export class HTMLHeadingElement extends HTMLElement {
  get align(): string {
    return reflectedString(this, "align");
  }

  set align(value: string) {
    this.setAttribute("align", value);
  }
}

export class HTMLParagraphElement extends HTMLElement {
  get align(): string {
    return reflectedString(this, "align");
  }

  set align(value: string) {
    this.setAttribute("align", value);
  }
}

export class HTMLHRElement extends HTMLElement {
  get align(): string {
    return reflectedString(this, "align");
  }

  set align(value: string) {
    this.setAttribute("align", value);
  }

  get color(): string {
    return reflectedString(this, "color");
  }

  set color(value: string) {
    this.setAttribute("color", value);
  }

  get noShade(): boolean {
    return this.hasAttribute("noshade");
  }

  set noShade(value: boolean) {
    this.toggleAttribute("noshade", value);
  }

  get size(): string {
    return reflectedString(this, "size");
  }

  set size(value: string) {
    this.setAttribute("size", value);
  }

  get width(): string {
    return reflectedString(this, "width");
  }

  set width(value: string) {
    this.setAttribute("width", value);
  }
}

export class HTMLOListElement extends HTMLElement {
  get reversed(): boolean {
    return this.hasAttribute("reversed");
  }

  set reversed(value: boolean) {
    this.toggleAttribute("reversed", value);
  }

  get start(): number {
    return reflectedLong(this, "start", 1);
  }

  set start(value: number) {
    this.setAttribute("start", String(toLong(value)));
  }

  get type(): string {
    return reflectedString(this, "type");
  }

  set type(value: string) {
    this.setAttribute("type", value);
  }

  get compact(): boolean {
    return this.hasAttribute("compact");
  }

  set compact(value: boolean) {
    this.toggleAttribute("compact", value);
  }
}

export class HTMLUListElement extends HTMLElement {
  get compact(): boolean {
    return this.hasAttribute("compact");
  }

  set compact(value: boolean) {
    this.toggleAttribute("compact", value);
  }

  get type(): string {
    return reflectedString(this, "type");
  }

  set type(value: string) {
    this.setAttribute("type", value);
  }
}

export class HTMLMenuElement extends HTMLElement {
  get compact(): boolean {
    return this.hasAttribute("compact");
  }

  set compact(value: boolean) {
    this.toggleAttribute("compact", value);
  }
}

export class HTMLLIElement extends HTMLElement {
  get value(): number {
    return reflectedLong(this, "value");
  }

  set value(value: number) {
    this.setAttribute("value", String(toLong(value)));
  }

  get type(): string {
    return reflectedString(this, "type");
  }

  set type(value: string) {
    this.setAttribute("type", value);
  }
}

export class HTMLDListElement extends HTMLElement {
  get compact(): boolean {
    return this.hasAttribute("compact");
  }

  set compact(value: boolean) {
    this.toggleAttribute("compact", value);
  }
}

export class HTMLDivElement extends HTMLElement {
  get align(): string {
    return reflectedString(this, "align");
  }

  set align(value: string) {
    this.setAttribute("align", value);
  }
}

export class HTMLDataElement extends HTMLElement {
  get value(): string {
    return reflectedString(this, "value");
  }

  set value(value: string) {
    this.setAttribute("value", value);
  }
}

export class HTMLTimeElement extends HTMLElement {
  get dateTime(): string {
    return reflectedString(this, "datetime");
  }

  set dateTime(value: string) {
    this.setAttribute("datetime", value);
  }
}

export class HTMLSpanElement extends HTMLElement {}

export class HTMLBRElement extends HTMLElement {
  get clear(): string {
    return reflectedString(this, "clear");
  }

  set clear(value: string) {
    this.setAttribute("clear", value);
  }
}

export class HTMLTemplateElement extends HTMLElement {
  readonly #content: DocumentFragment;

  constructor() {
    super();
    const document = this.ownerDocument;
    if (document === null) {
      throw new TypeError("Element has no owner document");
    }
    const ownerDocument = templateContentsOwnerDocument(document);
    this.#content = createDocumentFragment(ownerDocument);
    setTemplateContents(this, this.#content);
  }

  get content(): DocumentFragment {
    return this.#content;
  }

  declare htmlFor: string;
  declare shadowRootMode: string;
  declare shadowRootDelegatesFocus: boolean;
  declare shadowRootSerializable: boolean;
  declare shadowRootSlotAssignment: string;
  declare shadowRootClonable: boolean;
  declare shadowRootCustomElementRegistry: string;
}

export class HTMLPictureElement extends HTMLElement {}

export class HTMLSourceElement extends HTMLElement {
  get src(): string {
    return reflectedURL(this, "src");
  }

  set src(value: string) {
    this.setAttribute("src", usvString(value));
  }

  get type(): string {
    return reflectedString(this, "type");
  }

  set type(value: string) {
    this.setAttribute("type", value);
  }

  get srcset(): string {
    return reflectedString(this, "srcset");
  }

  set srcset(value: string) {
    this.setAttribute("srcset", usvString(value));
  }

  get sizes(): string {
    return reflectedString(this, "sizes");
  }

  set sizes(value: string) {
    this.setAttribute("sizes", value);
  }

  get media(): string {
    return reflectedString(this, "media");
  }

  set media(value: string) {
    this.setAttribute("media", value);
  }

  get width(): number {
    return reflectedUnsignedLong(this, "width");
  }

  set width(value: number) {
    this.setAttribute("width", String(toUnsignedLong(value)));
  }

  get height(): number {
    return reflectedUnsignedLong(this, "height");
  }

  set height(value: number) {
    this.setAttribute("height", String(toUnsignedLong(value)));
  }
}

export class HTMLBaseElement extends HTMLElement {
  get href(): string {
    return reflectedURL(this, "href");
  }

  set href(value: string) {
    this.setAttribute("href", usvString(value));
  }

  get target(): string {
    return reflectedString(this, "target");
  }

  set target(value: string) {
    this.setAttribute("target", value);
  }
}

export class HTMLLinkElement extends HTMLElement {
  readonly sheet = null;
  #relList: DOMTokenList | null = null;
  #sizes: DOMTokenList | null = null;
  #blocking: DOMTokenList | null = null;

  get href(): string {
    return reflectedURL(this, "href");
  }

  set href(value: string) {
    this.setAttribute("href", usvString(value));
  }

  get crossOrigin(): string | null {
    return reflectedNullableString(this, "crossorigin");
  }

  set crossOrigin(value: string | null) {
    setNullableString(this, "crossorigin", value);
  }

  get rel(): string {
    return reflectedString(this, "rel");
  }

  set rel(value: string) {
    this.setAttribute("rel", value);
  }

  get as(): string {
    return reflectedString(this, "as");
  }

  set as(value: string) {
    this.setAttribute("as", value);
  }

  get relList(): DOMTokenList {
    this.#relList ??= createDOMTokenList(this, "rel", [
      "alternate",
      "author",
      "bookmark",
      "canonical",
      "dns-prefetch",
      "expect",
      "external",
      "help",
      "icon",
      "license",
      "manifest",
      "modulepreload",
      "next",
      "nofollow",
      "noopener",
      "noreferrer",
      "opener",
      "pingback",
      "preconnect",
      "prefetch",
      "preload",
      "prev",
      "privacy-policy",
      "search",
      "stylesheet",
      "tag",
      "terms-of-service",
    ]);
    return this.#relList;
  }

  get media(): string {
    return reflectedString(this, "media");
  }

  set media(value: string) {
    this.setAttribute("media", value);
  }

  get integrity(): string {
    return reflectedString(this, "integrity");
  }

  set integrity(value: string) {
    this.setAttribute("integrity", value);
  }

  get hreflang(): string {
    return reflectedString(this, "hreflang");
  }

  set hreflang(value: string) {
    this.setAttribute("hreflang", value);
  }

  get type(): string {
    return reflectedString(this, "type");
  }

  set type(value: string) {
    this.setAttribute("type", value);
  }

  get sizes(): DOMTokenList {
    this.#sizes ??= createDOMTokenList(this, "sizes");
    return this.#sizes;
  }

  get imageSrcset(): string {
    return reflectedString(this, "imagesrcset");
  }

  set imageSrcset(value: string) {
    this.setAttribute("imagesrcset", usvString(value));
  }

  get imageSizes(): string {
    return reflectedString(this, "imagesizes");
  }

  set imageSizes(value: string) {
    this.setAttribute("imagesizes", value);
  }

  get referrerPolicy(): string {
    return reflectedString(this, "referrerpolicy");
  }

  set referrerPolicy(value: string) {
    this.setAttribute("referrerpolicy", value);
  }

  get blocking(): DOMTokenList {
    this.#blocking ??= createDOMTokenList(this, "blocking", ["render"]);
    return this.#blocking;
  }

  get disabled(): boolean {
    return this.hasAttribute("disabled");
  }

  set disabled(value: boolean) {
    this.toggleAttribute("disabled", value);
  }

  get fetchPriority(): string {
    return reflectedString(this, "fetchpriority");
  }

  set fetchPriority(value: string) {
    this.setAttribute("fetchpriority", value);
  }

  get charset(): string {
    return reflectedString(this, "charset");
  }

  set charset(value: string) {
    this.setAttribute("charset", value);
  }

  get rev(): string {
    return reflectedString(this, "rev");
  }

  set rev(value: string) {
    this.setAttribute("rev", value);
  }

  get target(): string {
    return reflectedString(this, "target");
  }

  set target(value: string) {
    this.setAttribute("target", value);
  }
}

export class HTMLMetaElement extends HTMLElement {
  get name(): string {
    return reflectedString(this, "name");
  }

  set name(value: string) {
    this.setAttribute("name", value);
  }

  get httpEquiv(): string {
    return reflectedString(this, "http-equiv");
  }

  set httpEquiv(value: string) {
    this.setAttribute("http-equiv", value);
  }

  get content(): string {
    return reflectedString(this, "content");
  }

  set content(value: string) {
    this.setAttribute("content", value);
  }

  get media(): string {
    return reflectedString(this, "media");
  }

  set media(value: string) {
    this.setAttribute("media", value);
  }

  get scheme(): string {
    return reflectedString(this, "scheme");
  }

  set scheme(value: string) {
    this.setAttribute("scheme", value);
  }
}

export class HTMLStyleElement extends HTMLElement {
  readonly sheet = null;
  #blocking: DOMTokenList | null = null;
  #disabled = false;

  get disabled(): boolean {
    return this.#disabled;
  }

  set disabled(value: boolean) {
    this.#disabled = value;
  }

  get media(): string {
    return reflectedString(this, "media");
  }

  set media(value: string) {
    this.setAttribute("media", value);
  }

  get blocking(): DOMTokenList {
    this.#blocking ??= createDOMTokenList(this, "blocking", ["render"]);
    return this.#blocking;
  }

  get type(): string {
    return reflectedString(this, "type");
  }

  set type(value: string) {
    this.setAttribute("type", value);
  }
}

export class HTMLBodyElement extends HTMLElement {
  get text(): string {
    return reflectedString(this, "text");
  }

  set text(value: string) {
    this.setAttribute("text", value);
  }

  get link(): string {
    return reflectedString(this, "link");
  }

  set link(value: string) {
    this.setAttribute("link", value);
  }

  get vLink(): string {
    return reflectedString(this, "vlink");
  }

  set vLink(value: string) {
    this.setAttribute("vlink", value);
  }

  get aLink(): string {
    return reflectedString(this, "alink");
  }

  set aLink(value: string) {
    this.setAttribute("alink", value);
  }

  get bgColor(): string {
    return reflectedString(this, "bgcolor");
  }

  set bgColor(value: string) {
    this.setAttribute("bgcolor", value);
  }

  get background(): string {
    return reflectedString(this, "background");
  }

  set background(value: string) {
    this.setAttribute("background", value);
  }
}

export class HTMLQuoteElement extends HTMLElement {
  get cite(): string {
    return reflectedURL(this, "cite");
  }

  set cite(value: string) {
    this.setAttribute("cite", usvString(value));
  }
}

export class HTMLAnchorElement extends HTMLElement {
  #relList: DOMTokenList | null = null;

  get download(): string {
    return reflectedString(this, "download");
  }

  set download(value: string) {
    this.setAttribute("download", value);
  }

  get ping(): string {
    return reflectedString(this, "ping");
  }

  set ping(value: string) {
    this.setAttribute("ping", usvString(value));
  }

  get rel(): string {
    return reflectedString(this, "rel");
  }

  set rel(value: string) {
    this.setAttribute("rel", value);
  }

  get relList(): DOMTokenList {
    this.#relList ??= createDOMTokenList(this, "rel");
    return this.#relList;
  }

  get text(): string {
    return this.textContent ?? "";
  }

  set text(value: string) {
    replaceText(this, domString(value));
  }

  get referrerPolicy(): string {
    return reflectedString(this, "referrerpolicy");
  }

  set referrerPolicy(value: string) {
    this.setAttribute("referrerpolicy", value);
  }

  get href(): string {
    return reflectedURL(this, "href");
  }

  set href(value: string) {
    this.setAttribute("href", usvString(value));
  }

  get target(): string {
    return reflectedString(this, "target");
  }

  set target(value: string) {
    this.setAttribute("target", value);
  }

  get origin(): string {
    return hyperlinkComponent(this, "origin");
  }

  get protocol(): string {
    return hyperlinkComponent(this, "protocol");
  }

  set protocol(value: string) {
    setHyperlinkComponent(this, "protocol", value);
  }

  get username(): string {
    return hyperlinkComponent(this, "username");
  }

  set username(value: string) {
    setHyperlinkComponent(this, "username", value);
  }

  get password(): string {
    return hyperlinkComponent(this, "password");
  }

  set password(value: string) {
    setHyperlinkComponent(this, "password", value);
  }

  get host(): string {
    return hyperlinkComponent(this, "host");
  }

  set host(value: string) {
    setHyperlinkComponent(this, "host", value);
  }

  get hostname(): string {
    return hyperlinkComponent(this, "hostname");
  }

  set hostname(value: string) {
    setHyperlinkComponent(this, "hostname", value);
  }

  get port(): string {
    return hyperlinkComponent(this, "port");
  }

  set port(value: string) {
    setHyperlinkComponent(this, "port", value);
  }

  get pathname(): string {
    return hyperlinkComponent(this, "pathname");
  }

  set pathname(value: string) {
    setHyperlinkComponent(this, "pathname", value);
  }

  get search(): string {
    return hyperlinkComponent(this, "search");
  }

  set search(value: string) {
    setHyperlinkComponent(this, "search", value);
  }

  get hash(): string {
    return hyperlinkComponent(this, "hash");
  }

  set hash(value: string) {
    setHyperlinkComponent(this, "hash", value);
  }

  get hreflang(): string {
    return reflectedString(this, "hreflang");
  }

  set hreflang(value: string) {
    this.setAttribute("hreflang", value);
  }

  get type(): string {
    return reflectedString(this, "type");
  }

  set type(value: string) {
    this.setAttribute("type", value);
  }

  get coords(): string {
    return reflectedString(this, "coords");
  }

  set coords(value: string) {
    this.setAttribute("coords", value);
  }

  get charset(): string {
    return reflectedString(this, "charset");
  }

  set charset(value: string) {
    this.setAttribute("charset", value);
  }

  get name(): string {
    return reflectedString(this, "name");
  }

  set name(value: string) {
    this.setAttribute("name", value);
  }

  get rev(): string {
    return reflectedString(this, "rev");
  }

  set rev(value: string) {
    this.setAttribute("rev", value);
  }

  get shape(): string {
    return reflectedString(this, "shape");
  }

  set shape(value: string) {
    this.setAttribute("shape", value);
  }

  toString(): string {
    return this.href;
  }
}

export class HTMLModElement extends HTMLElement {
  get cite(): string {
    return reflectedURL(this, "cite");
  }

  set cite(value: string) {
    this.setAttribute("cite", usvString(value));
  }

  get dateTime(): string {
    return reflectedString(this, "datetime");
  }

  set dateTime(value: string) {
    this.setAttribute("datetime", value);
  }
}

export class HTMLImageElement extends HTMLElement {
  get alt(): string {
    return reflectedString(this, "alt");
  }

  set alt(value: string) {
    this.setAttribute("alt", value);
  }

  get src(): string {
    return reflectedURL(this, "src");
  }

  set src(value: string) {
    this.setAttribute("src", usvString(value));
  }

  get srcset(): string {
    return reflectedString(this, "srcset");
  }

  set srcset(value: string) {
    this.setAttribute("srcset", usvString(value));
  }

  get sizes(): string {
    return reflectedString(this, "sizes");
  }

  set sizes(value: string) {
    this.setAttribute("sizes", value);
  }

  get crossOrigin(): string | null {
    return reflectedNullableString(this, "crossorigin");
  }

  set crossOrigin(value: string | null) {
    setNullableString(this, "crossorigin", value);
  }

  get useMap(): string {
    return reflectedString(this, "usemap");
  }

  set useMap(value: string) {
    this.setAttribute("usemap", value);
  }

  get isMap(): boolean {
    return this.hasAttribute("ismap");
  }

  set isMap(value: boolean) {
    this.toggleAttribute("ismap", value);
  }

  get controls(): boolean {
    return this.hasAttribute("controls");
  }

  set controls(value: boolean) {
    this.toggleAttribute("controls", value);
  }

  get width(): number {
    return reflectedUnsignedLong(this, "width");
  }

  set width(value: number) {
    this.setAttribute("width", String(toUnsignedLong(value)));
  }

  get height(): number {
    return reflectedUnsignedLong(this, "height");
  }

  set height(value: number) {
    this.setAttribute("height", String(toUnsignedLong(value)));
  }

  readonly naturalWidth = 0;
  readonly naturalHeight = 0;

  get complete(): boolean {
    return !this.hasAttribute("src") || this.getAttribute("src") === "";
  }

  get currentSrc(): string {
    return this.src;
  }

  get referrerPolicy(): string {
    return reflectedString(this, "referrerpolicy");
  }

  set referrerPolicy(value: string) {
    this.setAttribute("referrerpolicy", value);
  }

  get decoding(): string {
    return reflectedString(this, "decoding");
  }

  set decoding(value: string) {
    this.setAttribute("decoding", value);
  }

  get loading(): string {
    return reflectedString(this, "loading");
  }

  set loading(value: string) {
    this.setAttribute("loading", value);
  }

  get fetchPriority(): string {
    return reflectedString(this, "fetchpriority");
  }

  set fetchPriority(value: string) {
    this.setAttribute("fetchpriority", value);
  }

  decode(): Promise<undefined> {
    return Promise.resolve(undefined);
  }

  get name(): string {
    return reflectedString(this, "name");
  }

  set name(value: string) {
    this.setAttribute("name", value);
  }

  get lowsrc(): string {
    return reflectedURL(this, "lowsrc");
  }

  set lowsrc(value: string) {
    this.setAttribute("lowsrc", usvString(value));
  }

  get align(): string {
    return reflectedString(this, "align");
  }

  set align(value: string) {
    this.setAttribute("align", value);
  }

  get hspace(): number {
    return reflectedUnsignedLong(this, "hspace");
  }

  set hspace(value: number) {
    this.setAttribute("hspace", String(toUnsignedLong(value)));
  }

  get vspace(): number {
    return reflectedUnsignedLong(this, "vspace");
  }

  set vspace(value: number) {
    this.setAttribute("vspace", String(toUnsignedLong(value)));
  }

  get longDesc(): string {
    return reflectedURL(this, "longdesc");
  }

  set longDesc(value: string) {
    this.setAttribute("longdesc", usvString(value));
  }

  get border(): string {
    return reflectedString(this, "border");
  }

  set border(value: string) {
    this.setAttribute("border", value);
  }
}

export class HTMLIFrameElement extends HTMLElement {
  #sandbox: DOMTokenList | null = null;

  get src(): string {
    return reflectedURL(this, "src");
  }

  set src(value: string) {
    this.setAttribute("src", usvString(value));
  }

  get srcdoc(): string {
    return reflectedString(this, "srcdoc");
  }

  set srcdoc(value: string) {
    this.setAttribute("srcdoc", value);
  }

  get name(): string {
    return reflectedString(this, "name");
  }

  set name(value: string) {
    this.setAttribute("name", value);
  }

  get sandbox(): DOMTokenList {
    this.#sandbox ??= createDOMTokenList(this, "sandbox");
    return this.#sandbox;
  }

  get allow(): string {
    return reflectedString(this, "allow");
  }

  set allow(value: string) {
    this.setAttribute("allow", value);
  }

  get allowFullscreen(): boolean {
    return this.hasAttribute("allowfullscreen");
  }

  set allowFullscreen(value: boolean) {
    this.toggleAttribute("allowfullscreen", value);
  }

  get width(): string {
    return reflectedString(this, "width");
  }

  set width(value: string) {
    this.setAttribute("width", value);
  }

  get height(): string {
    return reflectedString(this, "height");
  }

  set height(value: string) {
    this.setAttribute("height", value);
  }

  get referrerPolicy(): string {
    return reflectedString(this, "referrerpolicy");
  }

  set referrerPolicy(value: string) {
    this.setAttribute("referrerpolicy", value);
  }

  get loading(): string {
    return reflectedString(this, "loading");
  }

  set loading(value: string) {
    this.setAttribute("loading", value);
  }

  readonly contentDocument: Document | null = null;
  readonly contentWindow = null;

  getSVGDocument(): Document | null {
    return null;
  }

  get align(): string {
    return reflectedString(this, "align");
  }

  set align(value: string) {
    this.setAttribute("align", value);
  }

  get scrolling(): string {
    return reflectedString(this, "scrolling");
  }

  set scrolling(value: string) {
    this.setAttribute("scrolling", value);
  }

  get frameBorder(): string {
    return reflectedString(this, "frameborder");
  }

  set frameBorder(value: string) {
    this.setAttribute("frameborder", value);
  }

  get longDesc(): string {
    return reflectedURL(this, "longdesc");
  }

  set longDesc(value: string) {
    this.setAttribute("longdesc", usvString(value));
  }

  get marginHeight(): string {
    return reflectedString(this, "marginheight");
  }

  set marginHeight(value: string) {
    this.setAttribute("marginheight", value);
  }

  get marginWidth(): string {
    return reflectedString(this, "marginwidth");
  }

  set marginWidth(value: string) {
    this.setAttribute("marginwidth", value);
  }
}

export class HTMLEmbedElement extends HTMLElement {
  get src(): string {
    return reflectedURL(this, "src");
  }

  set src(value: string) {
    this.setAttribute("src", usvString(value));
  }

  get type(): string {
    return reflectedString(this, "type");
  }

  set type(value: string) {
    this.setAttribute("type", value);
  }

  get width(): string {
    return reflectedString(this, "width");
  }

  set width(value: string) {
    this.setAttribute("width", value);
  }

  get height(): string {
    return reflectedString(this, "height");
  }

  set height(value: string) {
    this.setAttribute("height", value);
  }

  getSVGDocument(): Document | null {
    return null;
  }

  get align(): string {
    return reflectedString(this, "align");
  }

  set align(value: string) {
    this.setAttribute("align", value);
  }

  get name(): string {
    return reflectedString(this, "name");
  }

  set name(value: string) {
    this.setAttribute("name", value);
  }
}

export class HTMLObjectElement extends HTMLElement {
  #validation = new ValidationState(this);

  declare align: string;
  declare archive: string;
  declare code: string;
  declare declare: boolean;
  declare hspace: number;
  declare standby: string;
  declare vspace: number;
  declare codeBase: string;
  declare codeType: string;
  declare useMap: string;
  declare border: string;

  get data(): string {
    return reflectedURL(this, "data");
  }

  set data(value: string) {
    this.setAttribute("data", usvString(value));
  }

  get type(): string {
    return reflectedString(this, "type");
  }

  set type(value: string) {
    this.setAttribute("type", value);
  }

  get name(): string {
    return reflectedString(this, "name");
  }

  set name(value: string) {
    this.setAttribute("name", value);
  }

  get form(): HTMLFormElement | null {
    return formOwner(this);
  }

  get width(): string {
    return reflectedString(this, "width");
  }

  set width(value: string) {
    this.setAttribute("width", value);
  }

  get height(): string {
    return reflectedString(this, "height");
  }

  set height(value: string) {
    this.setAttribute("height", value);
  }

  readonly contentDocument: Document | null = null;
  readonly contentWindow = null;

  getSVGDocument(): Document | null {
    return null;
  }

  readonly willValidate = false;

  get validity(): ValidityState {
    return this.#validation.validity;
  }

  get validationMessage(): string {
    return this.#validation.message;
  }

  checkValidity(): boolean {
    return this.#validation.valid;
  }

  reportValidity(): boolean {
    return this.checkValidity();
  }

  setCustomValidity(error: string): void {
    this.#validation.message = domString(error);
  }
}

export class TimeRanges {
  readonly #ranges: readonly (readonly [number, number])[];

  constructor(implementation?: unknown) {
    if (!(implementation instanceof TimeRangesImplementation)) {
      throw new TypeError("Illegal constructor");
    }
    this.#ranges = implementation.ranges;
  }

  get length(): number {
    return this.#ranges.length;
  }

  start(index: number): number {
    return this.#range(index)[0];
  }

  end(index: number): number {
    return this.#range(index)[1];
  }

  #range(index: number): readonly [number, number] {
    const range = this.#ranges[toUnsignedLong(index)];
    if (range === undefined) {
      throw new DOMException(
        "The index is outside the range",
        "IndexSizeError",
      );
    }
    return range;
  }
}

class TimeRangesImplementation {
  constructor(readonly ranges: readonly (readonly [number, number])[]) {}
}

function createTimeRanges(
  ranges: readonly (readonly [number, number])[] = [],
): TimeRanges {
  return new TimeRanges(new TimeRangesImplementation(ranges));
}

export class HTMLMediaElement extends HTMLElement {
  static readonly NETWORK_EMPTY = 0;
  static readonly NETWORK_IDLE = 1;
  static readonly NETWORK_LOADING = 2;
  static readonly NETWORK_NO_SOURCE = 3;
  static readonly HAVE_NOTHING = 0;
  static readonly HAVE_METADATA = 1;
  static readonly HAVE_CURRENT_DATA = 2;
  static readonly HAVE_FUTURE_DATA = 3;
  static readonly HAVE_ENOUGH_DATA = 4;
  readonly NETWORK_EMPTY = 0;
  readonly NETWORK_IDLE = 1;
  readonly NETWORK_LOADING = 2;
  readonly NETWORK_NO_SOURCE = 3;
  readonly HAVE_NOTHING = 0;
  readonly HAVE_METADATA = 1;
  readonly HAVE_CURRENT_DATA = 2;
  readonly HAVE_FUTURE_DATA = 3;
  readonly HAVE_ENOUGH_DATA = 4;
  #currentTime = 0;
  #defaultPlaybackRate = 1;
  #playbackRate = 1;
  #preservesPitch = true;
  #paused = true;
  #volume = 1;
  #muted = false;
  #srcObject: unknown = null;
  readonly #audioTracks = createAudioTrackList();
  readonly #videoTracks = createVideoTrackList();
  readonly #textTracks = createTextTrackList();

  readonly error = null;

  get src(): string {
    return reflectedURL(this, "src");
  }

  set src(value: string) {
    this.setAttribute("src", usvString(value));
  }

  get srcObject(): unknown {
    return this.#srcObject;
  }

  set srcObject(value: unknown) {
    this.#srcObject = value;
  }

  get currentSrc(): string {
    return this.src;
  }

  get crossOrigin(): string | null {
    return reflectedNullableString(this, "crossorigin");
  }

  set crossOrigin(value: string | null) {
    setNullableString(this, "crossorigin", value);
  }

  get networkState(): number {
    return this.hasAttribute("src") ? this.NETWORK_IDLE : this.NETWORK_EMPTY;
  }

  get preload(): string {
    return reflectedString(this, "preload");
  }

  set preload(value: string) {
    this.setAttribute("preload", value);
  }

  get buffered(): TimeRanges {
    return createTimeRanges();
  }

  load(): void {
    this.#currentTime = 0;
    this.#paused = true;
  }

  canPlayType(type: string): "" | "maybe" | "probably" {
    requireArguments(arguments.length, 1);
    domString(type);
    return "";
  }

  get readyState(): number {
    return this.HAVE_NOTHING;
  }

  readonly seeking = false;

  get currentTime(): number {
    return this.#currentTime;
  }

  set currentTime(value: number) {
    this.#currentTime = finiteDouble(value);
  }

  fastSeek(time: number): void {
    this.currentTime = time;
  }

  get duration(): number {
    return Number.NaN;
  }

  getStartDate(): Date {
    return new Date(Number.NaN);
  }

  get paused(): boolean {
    return this.#paused;
  }

  get defaultPlaybackRate(): number {
    return this.#defaultPlaybackRate;
  }

  set defaultPlaybackRate(value: number) {
    this.#defaultPlaybackRate = finiteDouble(value);
  }

  get playbackRate(): number {
    return this.#playbackRate;
  }

  set playbackRate(value: number) {
    this.#playbackRate = finiteDouble(value);
  }

  get preservesPitch(): boolean {
    return this.#preservesPitch;
  }

  set preservesPitch(value: boolean) {
    this.#preservesPitch = value;
  }

  get played(): TimeRanges {
    return createTimeRanges();
  }

  get seekable(): TimeRanges {
    return createTimeRanges();
  }

  readonly ended = false;

  get autoplay(): boolean {
    return this.hasAttribute("autoplay");
  }

  set autoplay(value: boolean) {
    this.toggleAttribute("autoplay", value);
  }

  get loop(): boolean {
    return this.hasAttribute("loop");
  }

  set loop(value: boolean) {
    this.toggleAttribute("loop", value);
  }

  play(): Promise<undefined> {
    this.#paused = false;
    return Promise.resolve(undefined);
  }

  pause(): void {
    this.#paused = true;
  }

  get controls(): boolean {
    return this.hasAttribute("controls");
  }

  set controls(value: boolean) {
    this.toggleAttribute("controls", value);
  }

  get volume(): number {
    return this.#volume;
  }

  set volume(value: number) {
    const converted = finiteDouble(value);
    if (converted < 0 || converted > 1) {
      throw new DOMException(
        "Volume must be between 0 and 1",
        "IndexSizeError",
      );
    }
    this.#volume = converted;
  }

  get muted(): boolean {
    return this.#muted;
  }

  set muted(value: boolean) {
    this.#muted = value;
  }

  get defaultMuted(): boolean {
    return this.hasAttribute("muted");
  }

  set defaultMuted(value: boolean) {
    this.toggleAttribute("muted", value);
  }

  get loading(): string {
    return reflectedString(this, "loading");
  }

  set loading(value: string) {
    this.setAttribute("loading", value);
  }

  get audioTracks(): AudioTrackList {
    return this.#audioTracks;
  }

  get videoTracks(): VideoTrackList {
    return this.#videoTracks;
  }

  get textTracks(): TextTrackList {
    return this.#textTracks;
  }

  addTextTrack(kind: string, label = "", language = ""): TextTrack {
    const track = createTextTrack(
      asciiLowercase(domString(kind)),
      domString(label),
      domString(language),
    );
    addTrack(this.#textTracks, track);
    return track;
  }
}

export class HTMLVideoElement extends HTMLMediaElement {
  get width(): number {
    return reflectedUnsignedLong(this, "width");
  }

  set width(value: number) {
    this.setAttribute("width", String(toUnsignedLong(value)));
  }

  get height(): number {
    return reflectedUnsignedLong(this, "height");
  }

  set height(value: number) {
    this.setAttribute("height", String(toUnsignedLong(value)));
  }

  readonly videoWidth = 0;
  readonly videoHeight = 0;

  get poster(): string {
    return reflectedURL(this, "poster");
  }

  set poster(value: string) {
    this.setAttribute("poster", usvString(value));
  }

  get playsInline(): boolean {
    return this.hasAttribute("playsinline");
  }

  set playsInline(value: boolean) {
    this.toggleAttribute("playsinline", value);
  }
}

export class HTMLAudioElement extends HTMLMediaElement {}

class TrackList<T extends { readonly id: string }>
  extends EventTarget
  implements Iterable<T>
{
  readonly [index: number]: T | undefined;

  constructor(implementation?: unknown) {
    super();
    if (!(implementation instanceof TrackListImplementation)) {
      throw new TypeError("Illegal constructor");
    }
    bindDOMInterface(this, implementation);
    const proxy = new Proxy(this, {
      get(target, property): unknown {
        if (typeof property === "string" && /^(0|[1-9]\d*)$/.test(property)) {
          return tracks(target)[Number(property)];
        }
        const value: unknown = Reflect.get(target, property, target);
        return typeof value === "function"
          ? (value as (...args: unknown[]) => unknown).bind(target)
          : value;
      },
    });
    bindDOMInterface(proxy, implementation);
    return proxy;
  }

  get length(): number {
    return tracks(this).length;
  }

  item(index: number): T | null {
    return tracks(this)[toUnsignedLong(index)] ?? null;
  }

  getTrackById(id: string): T | null {
    const converted = domString(id);
    return tracks(this).find((track) => track.id === converted) ?? null;
  }

  [Symbol.iterator](): Iterator<T> {
    return tracks(this)[Symbol.iterator]();
  }
}

class TrackListImplementation<
  T extends { readonly id: string },
> extends EventTargetImplementation {
  readonly tracks: T[] = [];
}

function trackListImplementation<T extends { readonly id: string }>(
  list: TrackList<T>,
): TrackListImplementation<T> {
  return implementationFor(list) as TrackListImplementation<T>;
}

function tracks<T extends { readonly id: string }>(list: TrackList<T>): T[] {
  return trackListImplementation(list).tracks;
}

function addTrack<T extends { readonly id: string }>(
  list: TrackList<T>,
  track: T,
): void {
  tracks(list).push(track);
}

export class AudioTrack {
  readonly id: string;
  readonly kind: string;
  readonly label: string;
  readonly language: string;
  enabled = false;

  constructor(implementation?: unknown) {
    if (!(implementation instanceof TrackImplementation)) {
      throw new TypeError("Illegal constructor");
    }
    this.id = implementation.id;
    this.kind = implementation.kind;
    this.label = implementation.label;
    this.language = implementation.language;
  }
}

export class VideoTrack {
  readonly id: string;
  readonly kind: string;
  readonly label: string;
  readonly language: string;
  selected = false;

  constructor(implementation?: unknown) {
    if (!(implementation instanceof TrackImplementation)) {
      throw new TypeError("Illegal constructor");
    }
    this.id = implementation.id;
    this.kind = implementation.kind;
    this.label = implementation.label;
    this.language = implementation.language;
  }
}

export class AudioTrackList extends TrackList<AudioTrack> {}

export class VideoTrackList extends TrackList<VideoTrack> {
  get selectedIndex(): number {
    return tracks(this).findIndex((track) => track.selected);
  }
}

export class TextTrack extends EventTarget {
  readonly kind: string;
  readonly label: string;
  readonly language: string;
  readonly id = "";
  readonly inBandMetadataTrackDispatchType = "";
  mode: "disabled" | "hidden" | "showing" = "disabled";
  readonly #cues: unknown[] = [];

  constructor(implementation?: unknown) {
    super();
    if (!(implementation instanceof TextTrackImplementation)) {
      throw new TypeError("Illegal constructor");
    }
    this.kind = implementation.kind;
    this.label = implementation.label;
    this.language = implementation.language;
  }

  get cues(): readonly unknown[] {
    return this.#cues;
  }

  get activeCues(): readonly unknown[] {
    return [];
  }

  addCue(cue: unknown): void {
    if (!this.#cues.includes(cue)) {
      this.#cues.push(cue);
    }
  }

  removeCue(cue: unknown): void {
    const index = this.#cues.indexOf(cue);
    if (index >= 0) {
      this.#cues.splice(index, 1);
    }
  }
}

export class TextTrackList extends TrackList<TextTrack> {}

class TrackImplementation {
  constructor(
    readonly id: string,
    readonly kind: string,
    readonly label: string,
    readonly language: string,
  ) {}
}

class TextTrackImplementation {
  constructor(
    readonly kind: string,
    readonly label: string,
    readonly language: string,
  ) {}
}

function createAudioTrackList(): AudioTrackList {
  return new AudioTrackList(new TrackListImplementation<AudioTrack>());
}

function createVideoTrackList(): VideoTrackList {
  return new VideoTrackList(new TrackListImplementation<VideoTrack>());
}

function createTextTrackList(): TextTrackList {
  return new TextTrackList(new TrackListImplementation<TextTrack>());
}

function createTextTrack(
  kind = "subtitles",
  label = "",
  language = "",
): TextTrack {
  return new TextTrack(new TextTrackImplementation(kind, label, language));
}

export class HTMLTrackElement extends HTMLElement {
  static readonly NONE = 0;
  static readonly LOADING = 1;
  static readonly LOADED = 2;
  static readonly ERROR = 3;
  readonly NONE = 0;
  readonly LOADING = 1;
  readonly LOADED = 2;
  readonly ERROR = 3;
  #track: TextTrack | null = null;

  get kind(): string {
    return reflectedString(this, "kind");
  }

  set kind(value: string) {
    this.setAttribute("kind", value);
  }

  get src(): string {
    return reflectedURL(this, "src");
  }

  set src(value: string) {
    this.setAttribute("src", usvString(value));
  }

  get srclang(): string {
    return reflectedString(this, "srclang");
  }

  set srclang(value: string) {
    this.setAttribute("srclang", value);
  }

  get label(): string {
    return reflectedString(this, "label");
  }

  set label(value: string) {
    this.setAttribute("label", value);
  }

  get default(): boolean {
    return this.hasAttribute("default");
  }

  set default(value: boolean) {
    this.toggleAttribute("default", value);
  }

  get readyState(): number {
    return this.NONE;
  }

  get track(): TextTrack {
    this.#track ??= createTextTrack(this.kind, this.label, this.srclang);
    return this.#track;
  }
}

export class HTMLMapElement extends HTMLElement {
  #areas: HTMLCollection<HTMLAreaElement> | null = null;

  get name(): string {
    return reflectedString(this, "name");
  }

  set name(value: string) {
    this.setAttribute("name", value);
  }

  get areas(): HTMLCollection<HTMLAreaElement> {
    this.#areas ??= createHTMLCollection(() =>
      descendants(this).filter(
        (element): element is HTMLAreaElement =>
          element instanceof HTMLAreaElement,
      ),
    );
    return this.#areas;
  }
}

export class HTMLAreaElement extends HTMLElement {
  #relList: DOMTokenList | null = null;

  get alt(): string {
    return reflectedString(this, "alt");
  }

  set alt(value: string) {
    this.setAttribute("alt", value);
  }

  declare coords: string;
  declare shape: string;
  declare download: string;
  declare ping: string;
  declare rel: string;
  declare referrerPolicy: string;
  declare href: string;
  declare target: string;
  declare hreflang: string;
  declare type: string;

  get relList(): DOMTokenList {
    this.#relList ??= createDOMTokenList(this, "rel");
    return this.#relList;
  }

  get origin(): string {
    return hyperlinkComponent(this, "origin");
  }

  get protocol(): string {
    return hyperlinkComponent(this, "protocol");
  }

  set protocol(value: string) {
    setHyperlinkComponent(this, "protocol", value);
  }

  get username(): string {
    return hyperlinkComponent(this, "username");
  }

  set username(value: string) {
    setHyperlinkComponent(this, "username", value);
  }

  get password(): string {
    return hyperlinkComponent(this, "password");
  }

  set password(value: string) {
    setHyperlinkComponent(this, "password", value);
  }

  get host(): string {
    return hyperlinkComponent(this, "host");
  }

  set host(value: string) {
    setHyperlinkComponent(this, "host", value);
  }

  get hostname(): string {
    return hyperlinkComponent(this, "hostname");
  }

  set hostname(value: string) {
    setHyperlinkComponent(this, "hostname", value);
  }

  get port(): string {
    return hyperlinkComponent(this, "port");
  }

  set port(value: string) {
    setHyperlinkComponent(this, "port", value);
  }

  get pathname(): string {
    return hyperlinkComponent(this, "pathname");
  }

  set pathname(value: string) {
    setHyperlinkComponent(this, "pathname", value);
  }

  get search(): string {
    return hyperlinkComponent(this, "search");
  }

  set search(value: string) {
    setHyperlinkComponent(this, "search", value);
  }

  get hash(): string {
    return hyperlinkComponent(this, "hash");
  }

  set hash(value: string) {
    setHyperlinkComponent(this, "hash", value);
  }

  get noHref(): boolean {
    return this.hasAttribute("nohref");
  }

  set noHref(value: boolean) {
    this.toggleAttribute("nohref", value);
  }

  toString(): string {
    return this.href;
  }
}

export class HTMLTableElement extends HTMLElement {
  #tBodies: HTMLCollection<HTMLTableSectionElement> | null = null;
  #rows: HTMLCollection<HTMLTableRowElement> | null = null;

  get caption(): HTMLTableCaptionElement | null {
    return tableElement(tableCaption(this), HTMLTableCaptionElement);
  }

  set caption(value: HTMLTableCaptionElement | null) {
    if (value !== null && !(value instanceof HTMLTableCaptionElement)) {
      throw new TypeError("caption must be an HTMLTableCaptionElement or null");
    }
    this.deleteCaption();
    if (value !== null) {
      placeTableCaption(this, value);
    }
  }

  createCaption(): HTMLTableCaptionElement {
    const existing = this.caption;
    if (existing !== null) {
      return existing;
    }
    const caption = createChild(this, "caption", HTMLTableCaptionElement);
    placeTableCaption(this, caption);
    return caption;
  }

  deleteCaption(): void {
    this.caption?.remove();
  }

  get tHead(): HTMLTableSectionElement | null {
    return tableElement(tableHead(this), HTMLTableSectionElement);
  }

  set tHead(value: HTMLTableSectionElement | null) {
    setTableSection(this, "thead", value);
  }

  createTHead(): HTMLTableSectionElement {
    const existing = this.tHead;
    if (existing !== null) {
      return existing;
    }
    const head = createChild(this, "thead", HTMLTableSectionElement);
    placeTableHead(this, head);
    return head;
  }

  deleteTHead(): void {
    this.tHead?.remove();
  }

  get tFoot(): HTMLTableSectionElement | null {
    return tableElement(tableFoot(this), HTMLTableSectionElement);
  }

  set tFoot(value: HTMLTableSectionElement | null) {
    setTableSection(this, "tfoot", value);
  }

  createTFoot(): HTMLTableSectionElement {
    const existing = this.tFoot;
    if (existing !== null) {
      return existing;
    }
    const foot = createChild(this, "tfoot", HTMLTableSectionElement);
    placeTableFoot(this, foot);
    return foot;
  }

  deleteTFoot(): void {
    this.tFoot?.remove();
  }

  get tBodies(): HTMLCollection<HTMLTableSectionElement> {
    this.#tBodies ??= createHTMLCollection(() =>
      tableElements(tableBodies(this), HTMLTableSectionElement),
    );
    return this.#tBodies;
  }

  createTBody(): HTMLTableSectionElement {
    const body = createChild(this, "tbody", HTMLTableSectionElement);
    placeTableBody(this, body);
    return body;
  }

  get rows(): HTMLCollection<HTMLTableRowElement> {
    this.#rows ??= createHTMLCollection(() =>
      tableElements(tableRows(this), HTMLTableRowElement),
    );
    return this.#rows;
  }

  insertRow(index = -1): HTMLTableRowElement {
    return requiredTableElement(
      insertTableRowAt(this, toLong(index), tableElementCreator(this)),
      HTMLTableRowElement,
    );
  }

  deleteRow(index: number): void {
    requireArguments(arguments.length, 1);
    const converted = toLong(index);
    deleteTableItem(tableRows(this), converted);
  }

  declare align: string;
  declare border: string;
  declare frame: string;
  declare rules: string;
  declare summary: string;
  declare width: string;
  declare bgColor: string;
  declare cellPadding: string;
  declare cellSpacing: string;
}

export class HTMLTableCaptionElement extends HTMLElement {
  declare align: string;
}

export class HTMLTableColElement extends HTMLElement {
  get span(): number {
    return reflectedUnsignedLongInRange(this, "span", 1, 1000, 1);
  }

  set span(value: number) {
    this.setAttribute("span", String(toUnsignedLong(value)));
  }

  declare align: string;
  declare ch: string;
  declare chOff: string;
  declare vAlign: string;
  declare width: string;
}

export class HTMLTableSectionElement extends HTMLElement {
  #rows: HTMLCollection<HTMLTableRowElement> | null = null;

  get rows(): HTMLCollection<HTMLTableRowElement> {
    this.#rows ??= createHTMLCollection(() =>
      tableElements(tableSectionRows(this), HTMLTableRowElement),
    );
    return this.#rows;
  }

  insertRow(index = -1): HTMLTableRowElement {
    return requiredTableElement(
      insertTableSectionRow(this, toLong(index), tableElementCreator(this)),
      HTMLTableRowElement,
    );
  }

  deleteRow(index: number): void {
    requireArguments(arguments.length, 1);
    const converted = toLong(index);
    deleteTableItem(tableSectionRows(this), converted);
  }

  declare align: string;
  declare ch: string;
  declare chOff: string;
  declare vAlign: string;
}

export class HTMLTableRowElement extends HTMLElement {
  #cells: HTMLCollection<HTMLTableCellElement> | null = null;

  get rowIndex(): number {
    const table = nearestAncestor(this, HTMLTableElement);
    return table === null ? -1 : collectionIndex(table.rows, this);
  }

  get sectionRowIndex(): number {
    const section = this.parentElement;
    if (section instanceof HTMLTableSectionElement) {
      return collectionIndex(section.rows, this);
    }
    if (section instanceof HTMLTableElement) {
      return collectionIndex(section.rows, this);
    }
    return -1;
  }

  get cells(): HTMLCollection<HTMLTableCellElement> {
    this.#cells ??= createHTMLCollection(() =>
      tableElements(tableRowCells(this), HTMLTableCellElement),
    );
    return this.#cells;
  }

  insertCell(index = -1): HTMLTableCellElement {
    return requiredTableElement(
      insertTableRowCell(this, toLong(index), tableElementCreator(this)),
      HTMLTableCellElement,
    );
  }

  deleteCell(index: number): void {
    requireArguments(arguments.length, 1);
    const converted = toLong(index);
    deleteTableItem(tableRowCells(this), converted);
  }

  declare align: string;
  declare ch: string;
  declare chOff: string;
  declare vAlign: string;
  declare bgColor: string;
}

export class HTMLTableCellElement extends HTMLElement {
  get colSpan(): number {
    return reflectedUnsignedLongInRange(this, "colspan", 1, 1000, 1);
  }

  set colSpan(value: number) {
    this.setAttribute("colspan", String(toUnsignedLong(value)));
  }

  get rowSpan(): number {
    return reflectedUnsignedLongInRange(this, "rowspan", 0, 65534, 1);
  }

  set rowSpan(value: number) {
    this.setAttribute("rowspan", String(toUnsignedLong(value)));
  }

  get headers(): string {
    return reflectedString(this, "headers");
  }

  set headers(value: string) {
    this.setAttribute("headers", value);
  }

  get cellIndex(): number {
    return this.parentElement instanceof HTMLTableRowElement
      ? collectionIndex(this.parentElement.cells, this)
      : -1;
  }

  get scope(): string {
    return reflectedString(this, "scope");
  }

  set scope(value: string) {
    this.setAttribute("scope", value);
  }

  get abbr(): string {
    return reflectedString(this, "abbr");
  }

  set abbr(value: string) {
    this.setAttribute("abbr", value);
  }

  declare align: string;
  declare axis: string;
  declare height: string;
  declare width: string;
  declare ch: string;
  declare chOff: string;
  declare noWrap: boolean;
  declare vAlign: string;
  declare bgColor: string;
}

export class ValidityState {
  readonly #validation: ValidationState;

  constructor(validation?: unknown) {
    if (!(validation instanceof ValidationState)) {
      throw new TypeError("Illegal constructor");
    }
    this.#validation = validation;
  }

  get valueMissing(): boolean {
    return this.#validation.valueMissing;
  }

  readonly typeMismatch = false;
  readonly patternMismatch = false;
  readonly tooLong = false;
  readonly tooShort = false;
  readonly rangeUnderflow = false;
  readonly rangeOverflow = false;
  readonly stepMismatch = false;
  readonly badInput = false;

  get customError(): boolean {
    return this.#validation.message !== "";
  }

  get valid(): boolean {
    return !this.valueMissing && !this.customError;
  }
}

class ValidationState {
  readonly validity: ValidityState;
  readonly element: HTMLElement;
  message = "";

  constructor(element: HTMLElement) {
    this.element = element;
    this.validity = new ValidityState(this);
  }

  get valueMissing(): boolean {
    return (
      this.element.hasAttribute("required") &&
      "value" in this.element &&
      String(this.element.value) === ""
    );
  }

  get valid(): boolean {
    return this.validity.valid;
  }
}

export class RadioNodeList extends NodeList<Element> {
  get value(): string {
    for (const element of this) {
      if (
        element instanceof HTMLInputElement &&
        element.type === "radio" &&
        element.checked
      ) {
        return element.value;
      }
    }
    return "";
  }

  set value(value: string) {
    const converted = domString(value);
    for (const element of this) {
      if (element instanceof HTMLInputElement && element.type === "radio") {
        element.checked = element.value === converted;
      }
    }
  }
}

function createRadioNodeList(values: () => readonly Element[]): RadioNodeList {
  return new RadioNodeList(createCollectionImplementation(values));
}

export class HTMLFormControlsCollection extends HTMLCollection<
  Element,
  RadioNodeList | Element
> {
  namedItem(name: string): RadioNodeList | Element | null {
    requireArguments(arguments.length, 1);
    const converted = domString(name);
    const matches = [...this].filter(
      (element) =>
        element.getAttribute("id") === converted ||
        element.getAttribute("name") === converted,
    );
    if (matches.length === 0) {
      return null;
    }
    return matches.length === 1
      ? (matches[0] ?? null)
      : createRadioNodeList(() => matches);
  }
}

function createHTMLFormControlsCollection(
  values: () => readonly Element[],
): HTMLFormControlsCollection {
  return new HTMLFormControlsCollection(createCollectionImplementation(values));
}

export class HTMLOptionsCollection extends HTMLCollection<HTMLOptionElement> {
  readonly #select: HTMLSelectElement;

  constructor(construction?: unknown) {
    if (!(construction instanceof HTMLOptionsCollectionConstruction)) {
      throw new TypeError("Illegal constructor");
    }
    super(construction.implementation);
    this.#select = construction.select;
  }

  override get length(): number {
    return super.length;
  }

  set length(value: number) {
    const converted = toUnsignedLong(value);
    while (super.length > converted) {
      super.item(super.length - 1)?.remove();
    }
    while (super.length < converted) {
      this.#select.appendChild(
        createChild(this.#select, "option", HTMLOptionElement),
      );
    }
  }

  add(
    element: HTMLOptionElement | HTMLOptGroupElement,
    before: HTMLElement | number | null = null,
  ): void {
    this.#select.add(element, before);
  }

  remove(index: number): void {
    super.item(toLong(index))?.remove();
  }

  get selectedIndex(): number {
    return this.#select.selectedIndex;
  }

  set selectedIndex(value: number) {
    this.#select.selectedIndex = value;
  }
}

class HTMLOptionsCollectionConstruction {
  readonly implementation: object;

  constructor(readonly select: HTMLSelectElement) {
    this.implementation = createCollectionImplementation(() =>
      optionDescendants(select),
    );
  }
}

function createHTMLOptionsCollection(
  select: HTMLSelectElement,
): HTMLOptionsCollection {
  return new HTMLOptionsCollection(
    new HTMLOptionsCollectionConstruction(select),
  );
}

export class HTMLFormElement extends HTMLElement {
  #elements: HTMLFormControlsCollection | null = null;
  #relList: DOMTokenList | null = null;

  declare acceptCharset: string;
  declare action: string;
  declare autocomplete: string;
  declare enctype: string;
  declare method: string;
  declare name: string;
  declare noValidate: boolean;
  declare target: string;
  declare rel: string;

  get encoding(): string {
    return this.enctype;
  }

  set encoding(value: string) {
    this.enctype = value;
  }

  get relList(): DOMTokenList {
    this.#relList ??= createDOMTokenList(this, "rel");
    return this.#relList;
  }

  get elements(): HTMLFormControlsCollection {
    this.#elements ??= createHTMLFormControlsCollection(() =>
      formControls(this),
    );
    return this.#elements;
  }

  get length(): number {
    return this.elements.length;
  }

  item(index: number): Element | null {
    return this.elements.item(index);
  }

  namedItem(name: string): RadioNodeList | Element | null {
    return this.elements.namedItem(name);
  }

  submit(): void {
    this.dispatchEvent(new Event("submit", { cancelable: true }));
  }

  requestSubmit(submitter: HTMLElement | null = null): void {
    if (
      submitter !== null &&
      !(submitter instanceof HTMLButtonElement) &&
      !(
        submitter instanceof HTMLInputElement &&
        ["submit", "image"].includes(submitter.type)
      )
    ) {
      throw new TypeError("The submitter is not a submit button");
    }
    if (submitter !== null && formOwner(submitter) !== this) {
      throw new DOMException(
        "The submitter does not belong to this form",
        "NotFoundError",
      );
    }
  }

  reset(): void {
    for (const control of this.elements) {
      resetFormControl(control);
    }
  }

  checkValidity(): boolean {
    return [...this.elements].every((element) =>
      "checkValidity" in element
        ? (element as Element & { checkValidity(): boolean }).checkValidity()
        : true,
    );
  }

  reportValidity(): boolean {
    return this.checkValidity();
  }
}

export class HTMLLabelElement extends HTMLElement {
  get form(): HTMLFormElement | null {
    return this.control === null ? null : formOwner(this.control);
  }

  get htmlFor(): string {
    return reflectedString(this, "for");
  }

  set htmlFor(value: string) {
    this.setAttribute("for", value);
  }

  get control(): HTMLElement | null {
    const document = this.ownerDocument;
    const htmlFor = this.htmlFor;
    if (htmlFor !== "" && document !== null) {
      const candidate = descendants(document).find(
        (element) => element.getAttribute("id") === htmlFor,
      );
      return candidate instanceof HTMLElement ? candidate : null;
    }
    return descendants(this).find(isLabelableElement) ?? null;
  }
}

export class HTMLInputElement extends HTMLElement {
  #checked: boolean | null = null;
  #value: string | null = null;
  #files: unknown = null;
  #valueAsDate: object | null = null;
  #validation = new ValidationState(this);
  #selectionStart: number | null = 0;
  #selectionEnd: number | null = 0;
  #selectionDirection: string | null = "none";

  declare accept: string;
  declare alpha: boolean;
  declare alt: string;
  declare autocomplete: string;
  declare colorSpace: string;
  declare dirName: string;
  declare disabled: boolean;
  declare formAction: string;
  declare formEnctype: string;
  declare formMethod: string;
  declare formNoValidate: boolean;
  declare formTarget: string;
  declare height: number;
  declare max: string;
  declare min: string;
  declare multiple: boolean;
  declare name: string;
  declare pattern: string;
  declare placeholder: string;
  declare readOnly: boolean;
  declare required: boolean;
  declare src: string;
  declare step: string;
  declare width: number;
  declare align: string;
  declare useMap: string;
  declare hspace: number;
  declare vspace: number;

  constructor() {
    super();
    FORM_CONTROL_RESETTERS.set(this, () => {
      this.#value = null;
      this.#checked = null;
    });
  }

  get popoverTargetElement(): Element | null {
    return elementReference(this, "popovertarget");
  }

  set popoverTargetElement(value: Element | null) {
    setElementReference(this, "popovertarget", value);
  }

  get popoverTargetAction(): string {
    const value = asciiLowercase(reflectedString(this, "popovertargetaction"));
    return ["show", "hide", "toggle"].includes(value) ? value : "toggle";
  }

  set popoverTargetAction(value: string) {
    this.setAttribute("popovertargetaction", value);
  }

  get defaultChecked(): boolean {
    return this.hasAttribute("checked");
  }

  set defaultChecked(value: boolean) {
    this.toggleAttribute("checked", value);
  }

  get checked(): boolean {
    return this.#checked ?? this.defaultChecked;
  }

  set checked(value: boolean) {
    this.#checked = value;
  }

  get form(): HTMLFormElement | null {
    return formOwner(this);
  }

  get files(): unknown {
    return this.#files;
  }

  set files(value: unknown) {
    this.#files = value;
  }

  get indeterminate(): boolean {
    return this.hasAttribute("data-palim-indeterminate");
  }

  set indeterminate(value: boolean) {
    this.toggleAttribute("data-palim-indeterminate", value);
  }

  get list(): HTMLDataListElement | null {
    const id = this.getAttribute("list");
    if (id === null || this.ownerDocument === null) {
      return null;
    }
    const candidate = descendants(this.ownerDocument).find(
      (element) => element.getAttribute("id") === id,
    );
    return candidate instanceof HTMLDataListElement ? candidate : null;
  }

  get maxLength(): number {
    return reflectedNonNegativeLong(this, "maxlength", -1);
  }

  set maxLength(value: number) {
    setNonNegativeLong(this, "maxlength", value);
  }

  get minLength(): number {
    return reflectedNonNegativeLong(this, "minlength", -1);
  }

  set minLength(value: number) {
    setNonNegativeLong(this, "minlength", value);
  }

  get size(): number {
    const value = reflectedUnsignedLong(this, "size");
    return value === 0 ? 20 : value;
  }

  set size(value: number) {
    this.setAttribute("size", String(toUnsignedLong(value)));
  }

  get type(): string {
    const value = asciiLowercase(reflectedString(this, "type"));
    return INPUT_TYPES.has(value) ? value : "text";
  }

  set type(value: string) {
    this.setAttribute("type", asciiLowercase(domString(value)));
  }

  get defaultValue(): string {
    return reflectedString(this, "value");
  }

  set defaultValue(value: string) {
    this.setAttribute("value", value);
  }

  get value(): string {
    return this.#value ?? this.defaultValue;
  }

  set value(value: string) {
    this.#value = domString(value);
  }

  get valueAsDate(): object | null {
    return this.#valueAsDate;
  }

  set valueAsDate(value: object | null) {
    this.#valueAsDate = value;
  }

  get valueAsNumber(): number {
    const value = Number(this.value);
    return this.value === "" || !Number.isFinite(value) ? Number.NaN : value;
  }

  set valueAsNumber(value: number) {
    const converted = value;
    if (Number.isNaN(converted)) {
      this.value = "";
      return;
    }
    if (!Number.isFinite(converted)) {
      throw new TypeError("valueAsNumber must be finite or NaN");
    }
    this.value = String(converted);
  }

  stepUp(n = 1): void {
    this.valueAsNumber =
      (Number.isNaN(this.valueAsNumber) ? 0 : this.valueAsNumber) + toLong(n);
  }

  stepDown(n = 1): void {
    this.stepUp(-toLong(n));
  }

  get willValidate(): boolean {
    return !this.disabled && this.type !== "hidden";
  }

  get validity(): ValidityState {
    return this.#validation.validity;
  }

  get validationMessage(): string {
    return this.#validation.message;
  }

  checkValidity(): boolean {
    return !this.willValidate || this.#validation.valid;
  }

  reportValidity(): boolean {
    return this.checkValidity();
  }

  setCustomValidity(error: string): void {
    requireArguments(arguments.length, 1);
    this.#validation.message = domString(error);
  }

  get labels(): NodeList<HTMLLabelElement> | null {
    return labelsFor(this);
  }

  select(): void {
    this.#selectionStart = 0;
    this.#selectionEnd = this.value.length;
    this.#selectionDirection = "none";
  }

  get selectionStart(): number | null {
    return this.#selectionStart;
  }

  set selectionStart(value: number | null) {
    this.#selectionStart = value === null ? null : toUnsignedLong(value);
  }

  get selectionEnd(): number | null {
    return this.#selectionEnd;
  }

  set selectionEnd(value: number | null) {
    this.#selectionEnd = value === null ? null : toUnsignedLong(value);
  }

  get selectionDirection(): string | null {
    return this.#selectionDirection;
  }

  set selectionDirection(value: string | null) {
    this.#selectionDirection = value === null ? null : domString(value);
  }

  setRangeText(
    replacement: string,
    start = this.selectionStart ?? 0,
    end = this.selectionEnd ?? 0,
    selectionMode = "preserve",
  ): void {
    if (arguments.length === 0 || arguments.length === 2) {
      throw new TypeError("1 or at least 3 arguments required");
    }
    setRangeText(this, replacement, start, end, selectionMode);
  }

  setSelectionRange(start: number, end: number, direction = "none"): void {
    requireArguments(arguments.length, 2);
    this.#selectionStart = Math.min(toUnsignedLong(start), this.value.length);
    this.#selectionEnd = Math.max(
      this.#selectionStart,
      Math.min(toUnsignedLong(end), this.value.length),
    );
    this.#selectionDirection = domString(direction);
  }

  showPicker(): void {
    this.focus();
  }
}

export class HTMLButtonElement extends HTMLElement {
  #validation = new ValidationState(this);

  declare command: string;
  declare disabled: boolean;
  declare formAction: string;
  declare formEnctype: string;
  declare formMethod: string;
  declare formNoValidate: boolean;
  declare formTarget: string;
  declare name: string;
  declare value: string;

  get popoverTargetElement(): Element | null {
    return elementReference(this, "popovertarget");
  }

  set popoverTargetElement(value: Element | null) {
    setElementReference(this, "popovertarget", value);
  }

  get popoverTargetAction(): string {
    const value = asciiLowercase(reflectedString(this, "popovertargetaction"));
    return ["show", "hide", "toggle"].includes(value) ? value : "toggle";
  }

  set popoverTargetAction(value: string) {
    this.setAttribute("popovertargetaction", value);
  }

  get commandForElement(): Element | null {
    return elementReference(this, "commandfor");
  }

  set commandForElement(value: Element | null) {
    setElementReference(this, "commandfor", value);
  }

  get form(): HTMLFormElement | null {
    return formOwner(this);
  }

  get type(): string {
    const value = asciiLowercase(reflectedString(this, "type"));
    return ["submit", "reset", "button"].includes(value) ? value : "submit";
  }

  set type(value: string) {
    this.setAttribute("type", value);
  }

  get willValidate(): boolean {
    return !this.disabled;
  }

  get validity(): ValidityState {
    return this.#validation.validity;
  }

  get validationMessage(): string {
    return this.#validation.message;
  }

  checkValidity(): boolean {
    return !this.willValidate || this.#validation.valid;
  }

  reportValidity(): boolean {
    return this.checkValidity();
  }

  setCustomValidity(error: string): void {
    requireArguments(arguments.length, 1);
    this.#validation.message = domString(error);
  }

  get labels(): NodeList<HTMLLabelElement> {
    return labelsFor(this);
  }
}

export class HTMLSelectElement extends HTMLElement {
  #options: HTMLOptionsCollection | null = null;
  #selectedOptions: HTMLCollection<HTMLOptionElement> | null = null;
  #validation = new ValidationState(this);

  declare autocomplete: string;
  declare disabled: boolean;
  declare multiple: boolean;
  declare name: string;
  declare required: boolean;

  get form(): HTMLFormElement | null {
    return formOwner(this);
  }

  get size(): number {
    return reflectedUnsignedLong(this, "size");
  }

  set size(value: number) {
    this.setAttribute("size", String(toUnsignedLong(value)));
  }

  get type(): string {
    return this.multiple ? "select-multiple" : "select-one";
  }

  get options(): HTMLOptionsCollection {
    this.#options ??= createHTMLOptionsCollection(this);
    return this.#options;
  }

  get length(): number {
    return this.options.length;
  }

  set length(value: number) {
    this.options.length = value;
  }

  item(index: number): HTMLOptionElement | null {
    return this.options.item(index);
  }

  namedItem(name: string): HTMLOptionElement | null {
    requireArguments(arguments.length, 1);
    const converted = domString(name);
    return (
      optionDescendants(this).find(
        (option) =>
          option.getAttribute("id") === converted || option.name === converted,
      ) ?? null
    );
  }

  add(
    element: HTMLOptionElement | HTMLOptGroupElement,
    before: HTMLElement | number | null = null,
  ): void {
    requireArguments(arguments.length, 1);
    if (
      !(element instanceof HTMLOptionElement) &&
      !(element instanceof HTMLOptGroupElement)
    ) {
      throw new TypeError("The element is not an option or optgroup");
    }
    const reference =
      typeof before === "number" ? this.options.item(toLong(before)) : before;
    this.insertBefore(element, reference);
  }

  remove(index?: number): void {
    if (index === undefined) {
      super.remove();
    } else {
      this.options.item(toLong(index))?.remove();
    }
  }

  get selectedOptions(): HTMLCollection<HTMLOptionElement> {
    this.#selectedOptions ??= createHTMLCollection(() =>
      optionDescendants(this).filter((option) => option.selected),
    );
    return this.#selectedOptions;
  }

  get selectedIndex(): number {
    return optionDescendants(this).findIndex((option) => option.selected);
  }

  set selectedIndex(value: number) {
    const selected = toLong(value);
    for (const [index, option] of optionDescendants(this).entries()) {
      option.selected = index === selected;
    }
  }

  get value(): string {
    return (
      optionDescendants(this).find((option) => option.selected)?.value ?? ""
    );
  }

  set value(value: string) {
    const converted = domString(value);
    let found = false;
    for (const option of optionDescendants(this)) {
      option.selected = !found && option.value === converted;
      found ||= option.selected;
    }
  }

  get willValidate(): boolean {
    return !this.disabled;
  }

  get validity(): ValidityState {
    return this.#validation.validity;
  }

  get validationMessage(): string {
    return this.#validation.message;
  }

  checkValidity(): boolean {
    return !this.willValidate || this.#validation.valid;
  }

  reportValidity(): boolean {
    return this.checkValidity();
  }

  setCustomValidity(error: string): void {
    requireArguments(arguments.length, 1);
    this.#validation.message = domString(error);
  }

  showPicker(): void {
    this.focus();
  }

  get labels(): NodeList<HTMLLabelElement> {
    return labelsFor(this);
  }
}

export class HTMLDataListElement extends HTMLElement {
  #options: HTMLCollection<HTMLOptionElement> | null = null;

  get options(): HTMLCollection<HTMLOptionElement> {
    this.#options ??= createHTMLCollection(() => optionDescendants(this));
    return this.#options;
  }
}

export class HTMLOptGroupElement extends HTMLElement {
  declare disabled: boolean;
  declare label: string;
}

export class HTMLOptionElement extends HTMLElement {
  #selected: boolean | null = null;

  declare disabled: boolean;
  declare name: string;

  constructor() {
    super();
    FORM_CONTROL_RESETTERS.set(this, () => {
      this.#selected = null;
    });
  }

  get form(): HTMLFormElement | null {
    return formOwner(this);
  }

  get label(): string {
    const attribute = this.getAttribute("label");
    return attribute ?? optionText(this);
  }

  set label(value: string) {
    this.setAttribute("label", value);
  }

  get defaultSelected(): boolean {
    return this.hasAttribute("selected");
  }

  set defaultSelected(value: boolean) {
    this.toggleAttribute("selected", value);
  }

  get selected(): boolean {
    if (this.#selected !== null) {
      return this.#selected;
    }
    if (this.defaultSelected) {
      return true;
    }
    const select = nearestAncestor(this, HTMLSelectElement);
    return (
      select !== null &&
      !select.multiple &&
      !optionDescendants(select).some((option) => option.defaultSelected) &&
      select.options.item(0) === this
    );
  }

  set selected(value: boolean) {
    this.#selected = value;
  }

  get value(): string {
    return this.getAttribute("value") ?? optionText(this);
  }

  set value(value: string) {
    this.setAttribute("value", value);
  }

  get text(): string {
    return optionText(this);
  }

  set text(value: string) {
    replaceText(this, domString(value));
  }

  get index(): number {
    const select = nearestAncestor(this, HTMLSelectElement);
    return select === null ? 0 : collectionIndex(select.options, this);
  }
}

export class HTMLTextAreaElement extends HTMLElement {
  #value: string | null = null;
  #validation = new ValidationState(this);
  #selectionStart = 0;
  #selectionEnd = 0;
  #selectionDirection = "none";

  declare autocomplete: string;
  declare dirName: string;
  declare disabled: boolean;
  declare name: string;
  declare placeholder: string;
  declare readOnly: boolean;
  declare required: boolean;
  declare wrap: string;

  constructor() {
    super();
    FORM_CONTROL_RESETTERS.set(this, () => {
      this.#value = null;
    });
  }

  get cols(): number {
    return reflectedPositiveUnsignedLong(this, "cols", 20);
  }

  set cols(value: number) {
    this.setAttribute("cols", String(toUnsignedLong(value)));
  }

  get form(): HTMLFormElement | null {
    return formOwner(this);
  }

  get maxLength(): number {
    return reflectedNonNegativeLong(this, "maxlength", -1);
  }

  set maxLength(value: number) {
    setNonNegativeLong(this, "maxlength", value);
  }

  get minLength(): number {
    return reflectedNonNegativeLong(this, "minlength", -1);
  }

  set minLength(value: number) {
    setNonNegativeLong(this, "minlength", value);
  }

  get rows(): number {
    return reflectedPositiveUnsignedLong(this, "rows", 2);
  }

  set rows(value: number) {
    this.setAttribute("rows", String(toUnsignedLong(value)));
  }

  readonly type = "textarea";

  get defaultValue(): string {
    return this.textContent ?? "";
  }

  set defaultValue(value: string) {
    replaceText(this, domString(value));
  }

  get value(): string {
    return this.#value ?? this.defaultValue;
  }

  set value(value: string) {
    this.#value = domString(value);
  }

  get textLength(): number {
    return this.value.length;
  }

  get willValidate(): boolean {
    return !this.disabled;
  }

  get validity(): ValidityState {
    return this.#validation.validity;
  }

  get validationMessage(): string {
    return this.#validation.message;
  }

  checkValidity(): boolean {
    return !this.willValidate || this.#validation.valid;
  }

  reportValidity(): boolean {
    return this.checkValidity();
  }

  setCustomValidity(error: string): void {
    this.#validation.message = domString(error);
  }

  get labels(): NodeList<HTMLLabelElement> {
    return labelsFor(this);
  }

  select(): void {
    this.#selectionStart = 0;
    this.#selectionEnd = this.value.length;
  }

  get selectionStart(): number {
    return this.#selectionStart;
  }

  set selectionStart(value: number) {
    this.#selectionStart = Math.min(toUnsignedLong(value), this.value.length);
  }

  get selectionEnd(): number {
    return this.#selectionEnd;
  }

  set selectionEnd(value: number) {
    this.#selectionEnd = Math.min(toUnsignedLong(value), this.value.length);
  }

  get selectionDirection(): string {
    return this.#selectionDirection;
  }

  set selectionDirection(value: string) {
    this.#selectionDirection = domString(value);
  }

  setRangeText(
    replacement: string,
    start = this.selectionStart,
    end = this.selectionEnd,
    selectionMode = "preserve",
  ): void {
    if (arguments.length === 0 || arguments.length === 2) {
      throw new TypeError("1 or at least 3 arguments required");
    }
    setRangeText(this, replacement, start, end, selectionMode);
  }

  setSelectionRange(start: number, end: number, direction = "none"): void {
    requireArguments(arguments.length, 2);
    this.#selectionStart = Math.min(toUnsignedLong(start), this.value.length);
    this.#selectionEnd = Math.max(
      this.#selectionStart,
      Math.min(toUnsignedLong(end), this.value.length),
    );
    this.#selectionDirection = domString(direction);
  }
}

export class HTMLOutputElement extends HTMLElement {
  #htmlFor: DOMTokenList | null = null;
  #defaultValue: string | null = null;
  #validation = new ValidationState(this);

  declare name: string;

  get htmlFor(): DOMTokenList {
    this.#htmlFor ??= createDOMTokenList(this, "for");
    return this.#htmlFor;
  }

  get form(): HTMLFormElement | null {
    return formOwner(this);
  }

  readonly type = "output";

  get defaultValue(): string {
    return this.#defaultValue ?? this.textContent ?? "";
  }

  set defaultValue(value: string) {
    this.#defaultValue = domString(value);
  }

  get value(): string {
    return this.textContent ?? "";
  }

  set value(value: string) {
    replaceText(this, domString(value));
  }

  readonly willValidate = false;

  get validity(): ValidityState {
    return this.#validation.validity;
  }

  get validationMessage(): string {
    return this.#validation.message;
  }

  checkValidity(): boolean {
    return true;
  }

  reportValidity(): boolean {
    return true;
  }

  setCustomValidity(error: string): void {
    requireArguments(arguments.length, 1);
    this.#validation.message = domString(error);
  }

  get labels(): NodeList<HTMLLabelElement> {
    return labelsFor(this);
  }
}

export class HTMLProgressElement extends HTMLElement {
  get value(): number {
    return Math.max(0, reflectedDouble(this, "value", 0));
  }

  set value(value: number) {
    this.setAttribute("value", String(finiteDouble(value)));
  }

  get max(): number {
    const value = reflectedDouble(this, "max", 1);
    return value > 0 ? value : 1;
  }

  set max(value: number) {
    this.setAttribute("max", String(finiteDouble(value)));
  }

  get position(): number {
    return this.hasAttribute("value") ? Math.min(this.value / this.max, 1) : -1;
  }

  get labels(): NodeList<HTMLLabelElement> {
    return labelsFor(this);
  }
}

export class HTMLMeterElement extends HTMLElement {
  declare value: number;
  declare min: number;
  declare max: number;
  declare low: number;
  declare high: number;
  declare optimum: number;

  get labels(): NodeList<HTMLLabelElement> {
    return labelsFor(this);
  }
}

export class HTMLFieldSetElement extends HTMLElement {
  #validation = new ValidationState(this);
  #elements: HTMLCollection | null = null;

  declare disabled: boolean;
  declare name: string;

  get form(): HTMLFormElement | null {
    return formOwner(this);
  }

  readonly type = "fieldset";

  get elements(): HTMLCollection {
    this.#elements ??= createHTMLCollection(() => formControls(this));
    return this.#elements;
  }

  readonly willValidate = false;

  get validity(): ValidityState {
    return this.#validation.validity;
  }

  get validationMessage(): string {
    return this.#validation.message;
  }

  checkValidity(): boolean {
    return true;
  }

  reportValidity(): boolean {
    return true;
  }

  setCustomValidity(error: string): void {
    requireArguments(arguments.length, 1);
    this.#validation.message = domString(error);
  }
}

export class HTMLLegendElement extends HTMLElement {
  get form(): HTMLFormElement | null {
    const fieldSet = nearestAncestor(this, HTMLFieldSetElement);
    return fieldSet?.form ?? null;
  }

  declare align: string;
}

export class HTMLSelectedContentElement extends HTMLElement {}

export class HTMLDetailsElement extends HTMLElement {
  declare name: string;
  declare open: boolean;
}

export class HTMLDialogElement extends HTMLElement {
  #returnValue = "";

  declare open: boolean;
  declare closedBy: string;

  get returnValue(): string {
    return this.#returnValue;
  }

  set returnValue(value: string) {
    this.#returnValue = domString(value);
  }

  show(): void {
    if (this.open) {
      return;
    }
    this.open = true;
  }

  showModal(): void {
    if (this.open) {
      throw new DOMException("The dialog is already open", "InvalidStateError");
    }
    this.open = true;
  }

  close(returnValue?: string): void {
    if (!this.open) {
      return;
    }
    if (returnValue !== undefined) {
      this.returnValue = returnValue;
    }
    this.open = false;
  }

  requestClose(returnValue?: string): void {
    this.close(returnValue);
  }
}

export class HTMLScriptElement extends HTMLElement {
  #blocking: DOMTokenList | null = null;

  declare type: string;
  declare src: string;
  declare noModule: boolean;
  declare defer: boolean;
  declare integrity: string;
  declare charset: string;
  declare event: string;
  declare htmlFor: string;

  get async(): boolean {
    return (
      nodeImplementation(this).scriptForceAsync || this.hasAttribute("async")
    );
  }

  set async(value: boolean) {
    nodeImplementation(this).scriptForceAsync = false;
    this.toggleAttribute("async", value);
  }

  get blocking(): DOMTokenList {
    this.#blocking ??= createDOMTokenList(this, "blocking", ["render"]);
    return this.#blocking;
  }

  get crossOrigin(): string | null {
    return reflectedNullableString(this, "crossorigin");
  }

  set crossOrigin(value: string | null) {
    setNullableString(this, "crossorigin", value);
  }

  get referrerPolicy(): string {
    return reflectedString(this, "referrerpolicy");
  }

  set referrerPolicy(value: string) {
    this.setAttribute("referrerpolicy", value);
  }

  get fetchPriority(): string {
    return reflectedString(this, "fetchpriority");
  }

  set fetchPriority(value: string) {
    this.setAttribute("fetchpriority", value);
  }

  override get innerText(): string {
    return this.text;
  }

  override set innerText(value: string) {
    this.text = value;
  }

  override get textContent(): string {
    return super.textContent ?? "";
  }

  override set textContent(value: string | null) {
    this.text = value ?? "";
  }

  get text(): string {
    return super.textContent ?? "";
  }

  set text(value: string) {
    replaceText(this, domString(value));
  }

  static supports(type: string): boolean {
    return ["classic", "module", "importmap", "speculationrules"].includes(
      asciiLowercase(domString(type)),
    );
  }
}

export class HTMLSlotElement extends HTMLElement {
  #assigned: (Element | Text)[] | null = null;

  declare name: string;

  assignedNodes(options: { flatten?: boolean } = {}): Node[] {
    const flatten = Boolean(Reflect.get(options, "flatten"));
    return this.#assigned === null
      ? assignedSlotNodes(this, flatten)
      : [...this.#assigned];
  }

  assignedElements(options: { flatten?: boolean } = {}): Element[] {
    return this.assignedNodes(options).filter(
      (node): node is Element => node instanceof Element,
    );
  }

  assign(...nodes: (Element | Text)[]): void {
    for (const node of nodes) {
      if (!(node instanceof Element) && !(node instanceof Text)) {
        throw new TypeError("Assigned nodes must be Element or Text objects");
      }
    }
    this.#assigned = [...nodes];
  }
}

export class HTMLCanvasElement extends HTMLElement {
  get width(): number {
    return reflectedUnsignedLongWithDefault(this, "width", 300);
  }

  set width(value: number) {
    this.setAttribute("width", String(toUnsignedLong(value)));
  }

  get height(): number {
    return reflectedUnsignedLongWithDefault(this, "height", 150);
  }

  set height(value: number) {
    this.setAttribute("height", String(toUnsignedLong(value)));
  }

  getContext(contextId: string, options: unknown = null): null {
    requireArguments(arguments.length, 1);
    if (domString(contextId) !== "2d") {
      return null;
    }
    if (options !== null) {
      Object(options);
    }
    return null;
  }

  toDataURL(type = "image/png", quality?: unknown): string {
    if (quality !== undefined) {
      Number(quality);
    }
    const converted = asciiLowercase(domString(type));
    const mediaType = converted === "image/png" ? converted : "image/png";
    return `data:${mediaType};base64,`;
  }

  toBlob(
    callback: (blob: null) => void,
    type = "image/png",
    quality?: unknown,
  ): void {
    domString(type);
    if (quality !== undefined) {
      Number(quality);
    }
    if (typeof callback !== "function") {
      throw new TypeError("callback must be a function");
    }
    void Promise.resolve().then(() => {
      callback(null);
    });
  }

  transferControlToOffscreen(): never {
    throw new DOMException(
      "OffscreenCanvas is not available",
      "NotSupportedError",
    );
  }
}

export class HTMLMarqueeElement extends HTMLElement {
  #running = false;
  declare behavior: string;
  declare bgColor: string;
  declare direction: string;
  declare height: string;
  declare hspace: number;
  declare loop: number;
  declare scrollAmount: number;
  declare scrollDelay: number;
  declare trueSpeed: boolean;
  declare vspace: number;
  declare width: string;

  start(): void {
    this.#running = true;
  }

  stop(): void {
    this.#running = false;
  }
}

export class HTMLFrameSetElement extends HTMLElement {
  declare cols: string;
  declare rows: string;
}

export class HTMLFrameElement extends HTMLElement {
  declare name: string;
  declare scrolling: string;
  declare src: string;
  declare frameBorder: string;
  declare longDesc: string;
  declare noResize: boolean;
  declare marginHeight: string;
  declare marginWidth: string;

  readonly contentDocument: Document | null = null;
  readonly contentWindow = null;
}

export class HTMLDirectoryElement extends HTMLElement {
  declare compact: boolean;
}

export class HTMLFontElement extends HTMLElement {
  declare color: string;
  declare face: string;
  declare size: string;
}

export class HTMLParamElement extends HTMLElement {
  declare name: string;
  declare value: string;
  declare type: string;
  declare valueType: string;
}

const GLOBAL_EVENT_HANDLER_NAMES = [
  "abort",
  "animationcancel",
  "animationend",
  "animationiteration",
  "animationstart",
  "auxclick",
  "beforeinput",
  "beforematch",
  "beforetoggle",
  "blur",
  "cancel",
  "canplay",
  "canplaythrough",
  "change",
  "click",
  "close",
  "command",
  "contextlost",
  "contextmenu",
  "contextrestored",
  "copy",
  "cuechange",
  "cut",
  "dblclick",
  "drag",
  "dragend",
  "dragenter",
  "dragleave",
  "dragover",
  "dragstart",
  "drop",
  "durationchange",
  "emptied",
  "ended",
  "error",
  "focus",
  "formdata",
  "input",
  "invalid",
  "keydown",
  "keypress",
  "keyup",
  "load",
  "loadeddata",
  "loadedmetadata",
  "loadstart",
  "mousedown",
  "mouseenter",
  "mouseleave",
  "mousemove",
  "mouseout",
  "mouseover",
  "mouseup",
  "paste",
  "pause",
  "play",
  "playing",
  "progress",
  "ratechange",
  "reset",
  "resize",
  "scroll",
  "scrollend",
  "securitypolicyviolation",
  "seeked",
  "seeking",
  "select",
  "slotchange",
  "stalled",
  "submit",
  "suspend",
  "timeupdate",
  "toggle",
  "transitioncancel",
  "transitionend",
  "transitionrun",
  "transitionstart",
  "volumechange",
  "waiting",
  "webkitanimationend",
  "webkitanimationiteration",
  "webkitanimationstart",
  "webkittransitionend",
  "wheel",
] as const;

type EventHandlerProperties<Names extends readonly string[]> = {
  [Name in Names[number] as `on${Name}`]: EventHandler;
};

export type GlobalEventHandlers = EventHandlerProperties<
  typeof GLOBAL_EVENT_HANDLER_NAMES
>;

installEventHandlerProperties(HTMLElement, GLOBAL_EVENT_HANDLER_NAMES);

const WINDOW_EVENT_HANDLER_NAMES = [
  "afterprint",
  "beforeprint",
  "beforeunload",
  "hashchange",
  "languagechange",
  "message",
  "messageerror",
  "offline",
  "online",
  "pagehide",
  "pagereveal",
  "pageshow",
  "pageswap",
  "popstate",
  "rejectionhandled",
  "storage",
  "unhandledrejection",
  "unload",
] as const;

export type WindowEventHandlers = EventHandlerProperties<
  typeof WINDOW_EVENT_HANDLER_NAMES
>;

installEventHandlerProperties(HTMLBodyElement, WINDOW_EVENT_HANDLER_NAMES);
installEventHandlerProperties(HTMLFrameSetElement, WINDOW_EVENT_HANDLER_NAMES);

installStringReflectors(HTMLTableElement, {
  align: "align",
  border: "border",
  frame: "frame",
  rules: "rules",
  summary: "summary",
  width: "width",
  bgColor: "bgcolor",
  cellPadding: "cellpadding",
  cellSpacing: "cellspacing",
});
installStringReflectors(HTMLTableCaptionElement, { align: "align" });
installStringReflectors(HTMLTableColElement, {
  align: "align",
  ch: "char",
  chOff: "charoff",
  vAlign: "valign",
  width: "width",
});
installStringReflectors(HTMLTableSectionElement, {
  align: "align",
  ch: "char",
  chOff: "charoff",
  vAlign: "valign",
});
installStringReflectors(HTMLTableRowElement, {
  align: "align",
  ch: "char",
  chOff: "charoff",
  vAlign: "valign",
  bgColor: "bgcolor",
});
installStringReflectors(HTMLTableCellElement, {
  align: "align",
  axis: "axis",
  height: "height",
  width: "width",
  ch: "char",
  chOff: "charoff",
  vAlign: "valign",
  bgColor: "bgcolor",
});
installBooleanReflectors(HTMLTableCellElement, { noWrap: "nowrap" });
installStringReflectors(HTMLAreaElement, {
  coords: "coords",
  shape: "shape",
  download: "download",
  ping: "ping",
  rel: "rel",
  referrerPolicy: "referrerpolicy",
  target: "target",
  hreflang: "hreflang",
  type: "type",
});
installURLReflectors(HTMLAreaElement, { href: "href" });
installStringReflectors(HTMLObjectElement, {
  align: "align",
  archive: "archive",
  code: "code",
  standby: "standby",
  codeType: "codetype",
  useMap: "usemap",
  border: "border",
});
installBooleanReflectors(HTMLObjectElement, { declare: "declare" });
installUnsignedLongReflectors(HTMLObjectElement, {
  hspace: "hspace",
  vspace: "vspace",
});
installURLReflectors(HTMLObjectElement, { codeBase: "codebase" });
installStringReflectors(HTMLFormElement, {
  acceptCharset: "accept-charset",
  autocomplete: "autocomplete",
  enctype: "enctype",
  method: "method",
  name: "name",
  target: "target",
  rel: "rel",
});
installURLReflectors(HTMLFormElement, { action: "action" });
installBooleanReflectors(HTMLFormElement, { noValidate: "novalidate" });
installStringReflectors(HTMLInputElement, {
  accept: "accept",
  alt: "alt",
  autocomplete: "autocomplete",
  colorSpace: "colorspace",
  dirName: "dirname",
  formEnctype: "formenctype",
  formMethod: "formmethod",
  formTarget: "formtarget",
  max: "max",
  min: "min",
  name: "name",
  pattern: "pattern",
  placeholder: "placeholder",
  step: "step",
  align: "align",
  useMap: "usemap",
});
installURLReflectors(HTMLInputElement, {
  formAction: "formaction",
  src: "src",
});
installBooleanReflectors(HTMLInputElement, {
  alpha: "alpha",
  disabled: "disabled",
  formNoValidate: "formnovalidate",
  multiple: "multiple",
  readOnly: "readonly",
  required: "required",
});
installUnsignedLongReflectors(HTMLInputElement, {
  height: "height",
  width: "width",
  hspace: "hspace",
  vspace: "vspace",
});
installStringReflectors(HTMLButtonElement, {
  command: "command",
  formEnctype: "formenctype",
  formMethod: "formmethod",
  formTarget: "formtarget",
  name: "name",
  value: "value",
});
installURLReflectors(HTMLButtonElement, { formAction: "formaction" });
installBooleanReflectors(HTMLButtonElement, {
  disabled: "disabled",
  formNoValidate: "formnovalidate",
});
installStringReflectors(HTMLSelectElement, {
  autocomplete: "autocomplete",
  name: "name",
});
installBooleanReflectors(HTMLSelectElement, {
  disabled: "disabled",
  multiple: "multiple",
  required: "required",
});
installStringReflectors(HTMLOptGroupElement, { label: "label" });
installBooleanReflectors(HTMLOptGroupElement, { disabled: "disabled" });
installStringReflectors(HTMLOptionElement, { name: "name" });
installBooleanReflectors(HTMLOptionElement, { disabled: "disabled" });
installStringReflectors(HTMLTextAreaElement, {
  autocomplete: "autocomplete",
  dirName: "dirname",
  name: "name",
  placeholder: "placeholder",
  wrap: "wrap",
});
installBooleanReflectors(HTMLTextAreaElement, {
  disabled: "disabled",
  readOnly: "readonly",
  required: "required",
});
installStringReflectors(HTMLOutputElement, { name: "name" });
installDoubleReflectors(HTMLMeterElement, {
  value: "value",
  min: "min",
  max: "max",
  low: "low",
  high: "high",
  optimum: "optimum",
});
installStringReflectors(HTMLFieldSetElement, { name: "name" });
installBooleanReflectors(HTMLFieldSetElement, { disabled: "disabled" });
installStringReflectors(HTMLLegendElement, { align: "align" });
installStringReflectors(HTMLTemplateElement, {
  htmlFor: "for",
  shadowRootMode: "shadowrootmode",
  shadowRootSlotAssignment: "shadowrootslotassignment",
  shadowRootCustomElementRegistry: "shadowrootcustomelementregistry",
});
installBooleanReflectors(HTMLTemplateElement, {
  shadowRootDelegatesFocus: "shadowrootdelegatesfocus",
  shadowRootSerializable: "shadowrootserializable",
  shadowRootClonable: "shadowrootclonable",
});
installStringReflectors(HTMLDetailsElement, { name: "name" });
installBooleanReflectors(HTMLDetailsElement, { open: "open" });
installStringReflectors(HTMLDialogElement, { closedBy: "closedby" });
installBooleanReflectors(HTMLDialogElement, { open: "open" });
installStringReflectors(HTMLScriptElement, {
  type: "type",
  integrity: "integrity",
  charset: "charset",
  event: "event",
  htmlFor: "for",
});
installURLReflectors(HTMLScriptElement, { src: "src" });
installBooleanReflectors(HTMLScriptElement, {
  noModule: "nomodule",
  defer: "defer",
});
installStringReflectors(HTMLSlotElement, { name: "name" });
installStringReflectors(HTMLMarqueeElement, {
  behavior: "behavior",
  bgColor: "bgcolor",
  direction: "direction",
  height: "height",
  width: "width",
});
installUnsignedLongReflectors(HTMLMarqueeElement, {
  hspace: "hspace",
  vspace: "vspace",
});
installLongReflectors(HTMLMarqueeElement, { loop: "loop" });
installUnsignedLongReflectors(HTMLMarqueeElement, {
  scrollAmount: "scrollamount",
  scrollDelay: "scrolldelay",
});
installBooleanReflectors(HTMLMarqueeElement, { trueSpeed: "truespeed" });
installStringReflectors(HTMLFrameSetElement, { cols: "cols", rows: "rows" });
installStringReflectors(HTMLFrameElement, {
  name: "name",
  scrolling: "scrolling",
  frameBorder: "frameborder",
  marginHeight: "marginheight",
  marginWidth: "marginwidth",
});
installURLReflectors(HTMLFrameElement, { src: "src", longDesc: "longdesc" });
installBooleanReflectors(HTMLFrameElement, { noResize: "noresize" });
installBooleanReflectors(HTMLDirectoryElement, { compact: "compact" });
installStringReflectors(HTMLFontElement, {
  color: "color",
  face: "face",
  size: "size",
});
installStringReflectors(HTMLParamElement, {
  name: "name",
  value: "value",
  type: "type",
  valueType: "valuetype",
});

export function createHTMLElement(
  document: Document,
  localName: string,
  prefix: string | null = null,
): Element {
  htmlConstructionPrefixStack.push(prefix);
  switch (localName) {
    case "html":
      return constructHTMLElement(HTMLHtmlElement, document, localName);
    case "head":
      return constructHTMLElement(HTMLHeadElement, document, localName);
    case "title":
      return constructHTMLElement(HTMLTitleElement, document, localName);
    case "pre":
    case "listing":
    case "xmp":
      return constructHTMLElement(HTMLPreElement, document, localName);
    case "h1":
    case "h2":
    case "h3":
    case "h4":
    case "h5":
    case "h6":
      return constructHTMLElement(HTMLHeadingElement, document, localName);
    case "p":
      return constructHTMLElement(HTMLParagraphElement, document, localName);
    case "hr":
      return constructHTMLElement(HTMLHRElement, document, localName);
    case "ol":
      return constructHTMLElement(HTMLOListElement, document, localName);
    case "ul":
      return constructHTMLElement(HTMLUListElement, document, localName);
    case "menu":
      return constructHTMLElement(HTMLMenuElement, document, localName);
    case "li":
      return constructHTMLElement(HTMLLIElement, document, localName);
    case "dl":
      return constructHTMLElement(HTMLDListElement, document, localName);
    case "div":
      return constructHTMLElement(HTMLDivElement, document, localName);
    case "data":
      return constructHTMLElement(HTMLDataElement, document, localName);
    case "time":
      return constructHTMLElement(HTMLTimeElement, document, localName);
    case "span":
      return constructHTMLElement(HTMLSpanElement, document, localName);
    case "br":
      return constructHTMLElement(HTMLBRElement, document, localName);
    case "template":
      return constructHTMLElement(HTMLTemplateElement, document, localName);
    case "picture":
      return constructHTMLElement(HTMLPictureElement, document, localName);
    case "source":
      return constructHTMLElement(HTMLSourceElement, document, localName);
    case "base":
      return constructHTMLElement(HTMLBaseElement, document, localName);
    case "link":
      return constructHTMLElement(HTMLLinkElement, document, localName);
    case "meta":
      return constructHTMLElement(HTMLMetaElement, document, localName);
    case "style":
      return constructHTMLElement(HTMLStyleElement, document, localName);
    case "body":
      return constructHTMLElement(HTMLBodyElement, document, localName);
    case "blockquote":
    case "q":
      return constructHTMLElement(HTMLQuoteElement, document, localName);
    case "a":
      return constructHTMLElement(HTMLAnchorElement, document, localName);
    case "ins":
    case "del":
      return constructHTMLElement(HTMLModElement, document, localName);
    case "img":
      return constructHTMLElement(HTMLImageElement, document, localName);
    case "iframe":
      return constructHTMLElement(HTMLIFrameElement, document, localName);
    case "embed":
      return constructHTMLElement(HTMLEmbedElement, document, localName);
    case "object":
      return constructHTMLElement(HTMLObjectElement, document, localName);
    case "video":
      return constructHTMLElement(HTMLVideoElement, document, localName);
    case "audio":
      return constructHTMLElement(HTMLAudioElement, document, localName);
    case "track":
      return constructHTMLElement(HTMLTrackElement, document, localName);
    case "map":
      return constructHTMLElement(HTMLMapElement, document, localName);
    case "area":
      return constructHTMLElement(HTMLAreaElement, document, localName);
    case "table":
      return constructHTMLElement(HTMLTableElement, document, localName);
    case "caption":
      return constructHTMLElement(HTMLTableCaptionElement, document, localName);
    case "col":
    case "colgroup":
      return constructHTMLElement(HTMLTableColElement, document, localName);
    case "thead":
    case "tbody":
    case "tfoot":
      return constructHTMLElement(HTMLTableSectionElement, document, localName);
    case "tr":
      return constructHTMLElement(HTMLTableRowElement, document, localName);
    case "td":
    case "th":
      return constructHTMLElement(HTMLTableCellElement, document, localName);
    case "form":
      return constructHTMLElement(HTMLFormElement, document, localName);
    case "label":
      return constructHTMLElement(HTMLLabelElement, document, localName);
    case "input":
      return constructHTMLElement(HTMLInputElement, document, localName);
    case "button":
      return constructHTMLElement(HTMLButtonElement, document, localName);
    case "select":
      return constructHTMLElement(HTMLSelectElement, document, localName);
    case "datalist":
      return constructHTMLElement(HTMLDataListElement, document, localName);
    case "optgroup":
      return constructHTMLElement(HTMLOptGroupElement, document, localName);
    case "option":
      return constructHTMLElement(HTMLOptionElement, document, localName);
    case "textarea":
      return constructHTMLElement(HTMLTextAreaElement, document, localName);
    case "output":
      return constructHTMLElement(HTMLOutputElement, document, localName);
    case "progress":
      return constructHTMLElement(HTMLProgressElement, document, localName);
    case "meter":
      return constructHTMLElement(HTMLMeterElement, document, localName);
    case "fieldset":
      return constructHTMLElement(HTMLFieldSetElement, document, localName);
    case "legend":
      return constructHTMLElement(HTMLLegendElement, document, localName);
    case "selectedcontent":
      return constructHTMLElement(
        HTMLSelectedContentElement,
        document,
        localName,
      );
    case "details":
      return constructHTMLElement(HTMLDetailsElement, document, localName);
    case "dialog":
      return constructHTMLElement(HTMLDialogElement, document, localName);
    case "script":
      return constructHTMLElement(HTMLScriptElement, document, localName);
    case "slot":
      return constructHTMLElement(HTMLSlotElement, document, localName);
    case "canvas":
      return constructHTMLElement(HTMLCanvasElement, document, localName);
    case "marquee":
      return constructHTMLElement(HTMLMarqueeElement, document, localName);
    case "frameset":
      return constructHTMLElement(HTMLFrameSetElement, document, localName);
    case "frame":
      return constructHTMLElement(HTMLFrameElement, document, localName);
    case "dir":
      return constructHTMLElement(HTMLDirectoryElement, document, localName);
    case "font":
      return constructHTMLElement(HTMLFontElement, document, localName);
    case "param":
      return constructHTMLElement(HTMLParamElement, document, localName);
  }
  if (
    DIRECT_HTML_ELEMENT_NAMES.has(localName) ||
    isValidCustomElementName(localName)
  ) {
    return constructHTMLElement(HTMLElement, document, localName);
  }
  if (UNKNOWN_HTML_ELEMENT_NAMES.has(localName)) {
    return constructHTMLElement(HTMLUnknownElement, document, localName);
  }
  if (SPECIALIZED_HTML_ELEMENT_NAMES.has(localName)) {
    htmlConstructionPrefixStack.pop();
    return createElementInterface(document, localName, HTML_NAMESPACE, prefix);
  }
  return constructHTMLElement(HTMLUnknownElement, document, localName);
}

export function createElementForDocument(
  document: Document,
  localName: string,
  namespaceURI: string | null,
  prefix: string | null,
): Element {
  if (namespaceURI === HTML_NAMESPACE) {
    return (
      createDefinedCustomElement(document, localName, prefix) ??
      createHTMLElement(document, localName, prefix)
    );
  }
  return createElementInterface(document, localName, namespaceURI, prefix);
}

export function createCustomHTMLElementBase(
  document: Document,
  localName: string,
  prefix: string | null,
): HTMLElement {
  htmlConstructionPrefixStack.push(prefix);
  return constructHTMLElement(HTMLElement, document, localName);
}

setDocumentElementFactory(createElementForDocument);

interface HTMLConstruction {
  readonly document: Document;
  readonly localName: string;
  readonly prefix: string | null;
}

type HTMLInterfaceConstructor<T extends HTMLElement> = new () => T;

const htmlConstructionStack: HTMLConstruction[] = [];
const htmlConstructionPrefixStack: (string | null)[] = [];

function constructHTMLElement<T extends HTMLElement>(
  Interface: HTMLInterfaceConstructor<T>,
  document: Document,
  localName: string,
): T {
  const prefix = htmlConstructionPrefixStack.pop() ?? null;
  htmlConstructionStack.push({
    document,
    localName,
    prefix,
  });
  try {
    return new Interface();
  } finally {
    htmlConstructionStack.pop();
  }
}

function currentHTMLConstruction(): HTMLConstruction {
  const construction = htmlConstructionStack.at(-1);
  if (construction === undefined) {
    throw new TypeError("Illegal constructor");
  }
  return construction;
}

function isValidCustomElementName(name: string): boolean {
  return (
    !RESERVED_CUSTOM_ELEMENT_NAMES.has(name) &&
    /^[a-z][.0-9_a-z\-\u00B7\u00C0-\uD6FF\uF900-\uFFFD]*-[.0-9_a-z\-\u00B7\u00C0-\uD6FF\uF900-\uFFFD]*$/u.test(
      name,
    )
  );
}

function asciiLowercase(value: string): string {
  return value.replaceAll(/[A-Z]/g, (character) => character.toLowerCase());
}

function translationMode(element: Element): boolean {
  const value = asciiLowercase(element.getAttribute("translate") ?? "");
  if ((value === "yes" || value === "") && element.hasAttribute("translate")) {
    return true;
  }
  if (value === "no") {
    return false;
  }
  return element.parentElement === null
    ? true
    : translationMode(element.parentElement);
}

function reflectedLong(
  element: Element,
  name: string,
  defaultValue = 0,
): number {
  const value = element.getAttribute(name);
  if (value === null) {
    return defaultValue;
  }
  const match = /^[\t\n\f\r ]*([+-]?\d+)/.exec(value);
  if (match?.[1] === undefined) {
    return defaultValue;
  }
  const number = Number(match[1]);
  return number < -2_147_483_648 || number > 2_147_483_647
    ? defaultValue
    : number;
}

function domString(value: unknown): string {
  if (typeof value === "symbol") {
    throw new TypeError("Cannot convert a Symbol value to a string");
  }
  return String(value);
}

function templateContentsOwnerDocument(document: Document): Document {
  return templateContentsDocument(document);
}

function reflectedString(element: Element, name: string): string {
  return element.getAttribute(name) ?? "";
}

interface InlineStyleProperty {
  readonly name: string;
  readonly value: string;
  readonly important: boolean;
}

const SUPPORTED_CSS_PROPERTIES = new Set([
  "background-color",
  "color",
  "display",
  "float",
  "visibility",
]);
const CSS_BASIC_COLOR_KEYWORDS = new Set([
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
const CSS_WIDE_KEYWORDS = new Set([
  "initial",
  "inherit",
  "unset",
  "revert",
  "revert-layer",
]);
const DISPLAY_SINGLE_KEYWORDS = new Set([
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

function createInlineStyleDeclaration(
  element: HTMLElement,
): CSSStyleProperties {
  const target = new CSSStyleProperties(element, INLINE_STYLE_CONSTRUCTION);
  const declaration = new Proxy(target, {
    get(target, property, receiver): unknown {
      const index = cssDeclarationIndex(property);
      if (index !== null) {
        return target.item(index);
      }
      const value: unknown = Reflect.get(target, property, receiver);
      return value;
    },
    has(target, property) {
      const index = cssDeclarationIndex(property);
      return index === null
        ? Reflect.has(target, property)
        : index < target.length;
    },
    ownKeys(target) {
      return [
        ...Array.from({ length: target.length }, (_value, index) =>
          String(index),
        ),
        ...Reflect.ownKeys(target),
      ];
    },
    getOwnPropertyDescriptor(target, property) {
      const index = cssDeclarationIndex(property);
      return index === null
        ? Reflect.getOwnPropertyDescriptor(target, property)
        : index < target.length
          ? {
              configurable: true,
              enumerable: true,
              value: target.item(index),
              writable: false,
            }
          : undefined;
    },
  });
  bindDOMInterface(declaration, target);
  return declaration;
}

function cssDeclarationIndex(property: string | symbol): number | null {
  if (typeof property !== "string" || !/^(?:0|[1-9]\d*)$/u.test(property)) {
    return null;
  }
  const index = Number(property);
  return index < 4_294_967_295 ? index : null;
}

function normalizedCSSPropertyName(property: string): string {
  return property.startsWith("--") ? property : asciiLowercase(property);
}

function legacyNullToEmptyString(value: unknown): string {
  return value === null ? "" : domString(value);
}

function isSupportedCSSProperty(property: string): boolean {
  return property.startsWith("--") || SUPPORTED_CSS_PROPERTIES.has(property);
}

function inlineStyleDeclarations(element: Element): InlineStyleProperty[] {
  return parseInlineStyleDeclarations(element.getAttribute("style") ?? "");
}

function findInlineStyleDeclaration(
  element: Element,
  property: string,
): InlineStyleProperty | undefined {
  if (!isSupportedCSSProperty(property)) {
    return undefined;
  }
  return inlineStyleDeclarations(element).find(
    (declaration) => declaration.name === property,
  );
}

function parseInlineStyleDeclarations(source: string): InlineStyleProperty[] {
  const declarations: InlineStyleProperty[] = [];
  for (const component of splitCSSComponents(
    tokenizeCSS(source),
    "semicolon",
  )) {
    const separator = topLevelTokenIndex(component, "colon");
    if (separator < 0) {
      continue;
    }
    const nameTokens = trimCSSWhitespace(component.slice(0, separator));
    if (nameTokens.length !== 1 || nameTokens[0]?.type !== "ident") {
      continue;
    }
    const name = normalizedCSSPropertyName(nameTokens[0].value);
    if (!isSupportedCSSProperty(name)) {
      continue;
    }
    const parsed = parseDeclarationValue(name, component.slice(separator + 1));
    if (parsed === null) {
      continue;
    }
    const oldIndex = declarations.findIndex(
      (declaration) => declaration.name === name,
    );
    if (oldIndex >= 0) {
      const old = declarations[oldIndex];
      if (old?.important === true && !parsed.important) {
        continue;
      }
      declarations.splice(oldIndex, 1);
    }
    declarations.push({ name, ...parsed });
  }
  return declarations;
}

function splitCSSComponents(
  tokens: readonly CSSToken[],
  separator: CSSToken["type"],
): CSSToken[][] {
  const result: CSSToken[][] = [];
  let current: CSSToken[] = [];
  const stack: string[] = [];
  for (const token of tokens) {
    if (token.type === separator && stack.length === 0) {
      result.push(current);
      current = [];
      continue;
    }
    updateCSSNesting(stack, token);
    current.push(token);
  }
  result.push(current);
  return result;
}

function topLevelTokenIndex(
  tokens: readonly CSSToken[],
  type: CSSToken["type"],
): number {
  const stack: string[] = [];
  for (const [index, token] of tokens.entries()) {
    if (token.type === type && stack.length === 0) {
      return index;
    }
    updateCSSNesting(stack, token);
  }
  return -1;
}

function updateCSSNesting(stack: string[], token: CSSToken): void {
  if (token.type === "function" || token.type === "open-paren") {
    stack.push("close-paren");
  } else if (token.type === "open-square") {
    stack.push("close-square");
  } else if (token.type === "open-curly") {
    stack.push("close-curly");
  } else if (token.type === stack.at(-1)) {
    stack.pop();
  }
}

function trimCSSWhitespace(tokens: readonly CSSToken[]): CSSToken[] {
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

function parseDeclarationValue(
  name: string,
  sourceTokens: readonly CSSToken[],
): { readonly value: string; readonly important: boolean } | null {
  let tokens = trimCSSWhitespace(sourceTokens);
  if (!validCSSComponentValues(tokens)) {
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
      tokens = trimCSSWhitespace(tokens.slice(0, last));
    }
  }
  const value = serializeCSSValue(tokens);
  return isValidCSSPropertyValue(name, tokens, value)
    ? { value, important }
    : null;
}

function parseCSSPropertyValue(name: string, source: string): string | null {
  const parsed = parseDeclarationValue(name, tokenizeCSS(source));
  return parsed === null || parsed.important ? null : parsed.value;
}

function validCSSComponentValues(tokens: readonly CSSToken[]): boolean {
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
      continue;
    }
    updateCSSNesting(stack, token);
  }
  return stack.length === 0;
}

function serializeCSSValue(tokens: readonly CSSToken[]): string {
  return tokens.map((token) => token.raw).join("");
}

function isValidCSSPropertyValue(
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
        (asciiLowercase(token.value) === "var" ||
          asciiLowercase(token.value) === "env"),
    )
  ) {
    return true;
  }
  const significantTokens = tokens.filter(
    (token) => token.type !== "whitespace",
  );
  const keywords = significantTokens.map((token) =>
    token.type === "ident" ? asciiLowercase(token.value) : null,
  );
  const onlyKeyword = keywords[0];
  if (
    keywords.length === 1 &&
    typeof onlyKeyword === "string" &&
    CSS_WIDE_KEYWORDS.has(onlyKeyword)
  ) {
    return true;
  }
  if (name === "color" || name === "background-color") {
    return validCSSColor(significantTokens);
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
  return validDisplayValue(values);
}

function validCSSColor(tokens: readonly CSSToken[]): boolean {
  if (tokens.length !== 1) {
    return false;
  }
  const token = tokens[0];
  if (token?.type === "ident") {
    const keyword = asciiLowercase(token.value);
    return (
      keyword === "currentcolor" ||
      keyword === "transparent" ||
      CSS_BASIC_COLOR_KEYWORDS.has(keyword)
    );
  }
  return (
    token?.type === "hash" &&
    /^(?:[\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})$/iu.test(token.value)
  );
}

function validDisplayValue(values: readonly string[]): boolean {
  if (values.length === 1) {
    return DISPLAY_SINGLE_KEYWORDS.has(values[0] ?? "");
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
  const listItem = values.includes("list-item");
  if (listItem) {
    return (
      outside.length <= 1 &&
      inside.length <= 1 &&
      inside.every((value) => value === "flow" || value === "flow-root") &&
      outside.length + inside.length + 1 === values.length
    );
  }
  return outside.length === 1 && inside.length === 1 && values.length === 2;
}

function serializeInlineStyleDeclarations(
  declarations: readonly InlineStyleProperty[],
): string {
  return declarations
    .map(
      ({ name, value, important }) =>
        `${name}: ${value}${important ? " !important" : ""};`,
    )
    .join(" ");
}

function setInlineStyleDeclarations(
  element: Element,
  declarations: readonly InlineStyleProperty[],
): void {
  element.setAttribute("style", serializeInlineStyleDeclarations(declarations));
}

function reflectedURL(element: Element, name: string): string {
  const value = element.getAttribute(name) ?? "";
  if (value === "") {
    return "";
  }
  try {
    return new URL(value, element.baseURI).href;
  } catch {
    return value;
  }
}

function reflectedUnsignedLong(element: Element, name: string): number {
  const value = element.getAttribute(name);
  if (value === null) {
    return 0;
  }
  const match = /^[\t\n\f\r ]*(\d+)/.exec(value);
  if (match?.[1] === undefined) {
    return 0;
  }
  const number = Number(match[1]);
  return number > 4_294_967_295 ? 0 : number;
}

function toUnsignedLong(value: unknown): number {
  const number = Number(value);
  if (!Number.isFinite(number) || number === 0) {
    return 0;
  }
  const integer = Math.trunc(number);
  return ((integer % 4_294_967_296) + 4_294_967_296) % 4_294_967_296;
}

function usvString(value: unknown): string {
  return domString(value).toWellFormed();
}

function datasetAttributeName(property: string): string {
  if (/-[a-z]/.test(property)) {
    throw new DOMException("Invalid dataset property name", "SyntaxError");
  }
  return `data-${property.replaceAll(
    /[A-Z]/g,
    (character) => `-${character.toLowerCase()}`,
  )}`;
}

function isDatasetAttribute(name: string): boolean {
  return name.startsWith("data-") && !/[A-Z]/.test(name.slice(5));
}

function datasetPropertyName(name: string): string {
  return name
    .slice(5)
    .replaceAll(/-([a-z])/g, (_match, character: string) =>
      character.toUpperCase(),
    );
}

function replaceText(element: Element, value: string): void {
  for (const child of childNodes(element)) {
    element.removeChild(child);
  }
  if (value === "") {
    return;
  }
  const document = element.ownerDocument;
  if (document === null) {
    throw new TypeError("Element has no owner document");
  }
  element.appendChild(createText(document, value));
}

function defaultTabIndex(element: HTMLElement): number {
  return [
    "a",
    "area",
    "button",
    "iframe",
    "input",
    "object",
    "select",
    "textarea",
  ].includes(element.localName)
    ? 0
    : -1;
}

function reflectedNullableString(
  element: Element,
  name: string,
): string | null {
  return element.getAttribute(name);
}

function setNullableString(
  element: Element,
  name: string,
  value: string | null,
): void {
  if (value === null) {
    element.removeAttribute(name);
  } else {
    element.setAttribute(name, value);
  }
}

type URLComponent = Exclude<keyof URLValue, "href" | "origin">;

function hyperlinkURL(element: Element): URLValue | null {
  const value = element.getAttribute("href") ?? "";
  if (value === "") {
    return null;
  }
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function hyperlinkComponent(
  element: Element,
  component: URLComponent | "origin",
): string {
  return hyperlinkURL(element)?.[component] ?? "";
}

function setHyperlinkComponent(
  element: Element,
  component: URLComponent,
  value: string,
): void {
  const url = hyperlinkURL(element);
  if (url === null) {
    return;
  }
  url[component] = usvString(value);
  element.setAttribute("href", url.href);
}

function finiteDouble(value: unknown): number {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    throw new TypeError("The value must be a finite number");
  }
  return number;
}

function descendants(root: Node): Element[] {
  const result: Element[] = [];
  for (const child of childNodes(root)) {
    if (child instanceof Element) {
      result.push(child);
    }
    result.push(...descendants(child));
  }
  return result;
}

function createChild<T extends HTMLElement>(
  parent: Element,
  localName: string,
  Interface: new () => T,
): T {
  const document = parent.ownerDocument;
  if (document === null) {
    throw new TypeError("Element has no owner document");
  }
  const element = createHTMLElement(document, localName);
  if (!(element instanceof Interface)) {
    throw new TypeError(`Unexpected interface for ${localName}`);
  }
  return element;
}

function setTableSection(
  table: HTMLTableElement,
  localName: "thead" | "tfoot",
  value: HTMLTableSectionElement | null,
): void {
  if (value !== null && !(value instanceof HTMLTableSectionElement)) {
    throw new TypeError("The value must be a table section element or null");
  }
  if (value !== null && value.localName !== localName) {
    throw new DOMException(
      `The value is not a ${localName} element`,
      "HierarchyRequestError",
    );
  }
  const current = localName === "thead" ? table.tHead : table.tFoot;
  current?.remove();
  if (value !== null) {
    if (localName === "thead") {
      placeTableHead(table, value);
    } else {
      placeTableFoot(table, value);
    }
  }
}

function tableElement<T extends HTMLElement>(
  element: Element | null,
  Interface: new () => T,
): T | null {
  if (element === null) {
    return null;
  }
  return requiredTableElement(element, Interface);
}

function tableElements<T extends HTMLElement>(
  elements: readonly Element[],
  Interface: new () => T,
): T[] {
  return elements.map((element) => requiredTableElement(element, Interface));
}

function requiredTableElement<T extends HTMLElement>(
  element: Element,
  Interface: new () => T,
): T {
  if (!(element instanceof Interface)) {
    throw new TypeError("Unexpected table element interface");
  }
  return element;
}

function tableElementCreator(
  parent: Element,
): (localName: "tbody" | "tr" | "td") => Element {
  return (localName) => {
    const document = parent.ownerDocument;
    if (document === null) {
      throw new TypeError("Element has no owner document");
    }
    return createHTMLElement(document, localName);
  };
}

function nearestAncestor<T extends HTMLElement>(
  element: Element,
  Interface: new () => T,
): T | null {
  let ancestor = element.parentElement;
  while (ancestor !== null) {
    if (ancestor instanceof Interface) {
      return ancestor;
    }
    ancestor = ancestor.parentElement;
  }
  return null;
}

function collectionIndex<T extends Element>(
  collection: HTMLCollection<T>,
  element: T,
): number {
  return [...collection].indexOf(element);
}

function reflectedUnsignedLongInRange(
  element: Element,
  name: string,
  minimum: number,
  maximum: number,
  defaultValue: number,
): number {
  const value = reflectedUnsignedLong(element, name);
  return value < minimum || value > maximum ? defaultValue : value;
}

function reflectedUnsignedLongWithDefault(
  element: Element,
  name: string,
  defaultValue: number,
): number {
  return element.hasAttribute(name)
    ? reflectedUnsignedLong(element, name)
    : defaultValue;
}

function reflectedPositiveUnsignedLong(
  element: Element,
  name: string,
  defaultValue: number,
): number {
  const value = reflectedUnsignedLong(element, name);
  return value === 0 ? defaultValue : value;
}

function reflectedNonNegativeLong(
  element: Element,
  name: string,
  defaultValue: number,
): number {
  const value = reflectedLong(element, name, defaultValue);
  return value < 0 ? defaultValue : value;
}

function setNonNegativeLong(
  element: Element,
  name: string,
  value: unknown,
): void {
  const converted = toLong(value);
  if (converted < 0) {
    throw new DOMException("The value cannot be negative", "IndexSizeError");
  }
  element.setAttribute(name, String(converted));
}

function reflectedDouble(
  element: Element,
  name: string,
  defaultValue: number,
): number {
  const value = Number(element.getAttribute(name));
  return Number.isFinite(value) ? value : defaultValue;
}

const INPUT_TYPES = new Set([
  "button",
  "checkbox",
  "color",
  "date",
  "datetime-local",
  "email",
  "file",
  "hidden",
  "image",
  "month",
  "number",
  "password",
  "radio",
  "range",
  "reset",
  "search",
  "submit",
  "tel",
  "text",
  "time",
  "url",
  "week",
]);

function formOwner(element: HTMLElement): HTMLFormElement | null {
  const formId = element.getAttribute("form");
  if (formId !== null && element.ownerDocument !== null) {
    const referenced = descendants(element.ownerDocument).find(
      (candidate) => candidate.getAttribute("id") === formId,
    );
    return referenced instanceof HTMLFormElement ? referenced : null;
  }
  return nearestAncestor(element, HTMLFormElement);
}

function isFormControl(element: Element): boolean {
  return (
    element instanceof HTMLButtonElement ||
    element instanceof HTMLFieldSetElement ||
    element instanceof HTMLInputElement ||
    element instanceof HTMLObjectElement ||
    element instanceof HTMLOutputElement ||
    element instanceof HTMLSelectElement ||
    element instanceof HTMLTextAreaElement
  );
}

function formControls(root: Element): Element[] {
  return descendants(root).filter(
    (element) =>
      isFormControl(element) && formOwner(element as HTMLElement) === root,
  );
}

function resetFormControl(element: Element): void {
  if (
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement
  ) {
    FORM_CONTROL_RESETTERS.get(element)?.();
  } else if (element instanceof HTMLOptionElement) {
    FORM_CONTROL_RESETTERS.get(element)?.();
  }
}

function isLabelableElement(element: Element): element is HTMLElement {
  return (
    element instanceof HTMLButtonElement ||
    element instanceof HTMLInputElement ||
    element instanceof HTMLMeterElement ||
    element instanceof HTMLOutputElement ||
    element instanceof HTMLProgressElement ||
    element instanceof HTMLSelectElement ||
    element instanceof HTMLTextAreaElement
  );
}

function labelsFor(element: HTMLElement): NodeList<HTMLLabelElement> {
  return createNodeList(() => {
    const document = element.ownerDocument;
    if (document === null) {
      return [];
    }
    const id = element.getAttribute("id");
    return descendants(document).filter(
      (candidate): candidate is HTMLLabelElement =>
        candidate instanceof HTMLLabelElement &&
        (candidate.control === element ||
          (id !== null && candidate.htmlFor === id)),
    );
  });
}

const elementReferences = new WeakMap<Element, Map<string, Element | null>>();

function elementReference(element: Element, attribute: string): Element | null {
  const stored = elementReferences.get(element)?.get(attribute);
  if (stored !== undefined) {
    return stored;
  }
  const id = element.getAttribute(attribute);
  if (id === null || element.ownerDocument === null) {
    return null;
  }
  return (
    descendants(element.ownerDocument).find(
      (candidate) => candidate.getAttribute("id") === id,
    ) ?? null
  );
}

function setElementReference(
  element: Element,
  attribute: string,
  value: Element | null,
): void {
  let references = elementReferences.get(element);
  if (references === undefined) {
    references = new Map();
    elementReferences.set(element, references);
  }
  references.set(attribute, value);
  if (value === null) {
    element.removeAttribute(attribute);
  } else {
    const id = value.getAttribute("id");
    if (id === null) {
      element.removeAttribute(attribute);
    } else {
      element.setAttribute(attribute, id);
    }
  }
}

function optionDescendants(root: Element): HTMLOptionElement[] {
  return descendants(root).filter(
    (element): element is HTMLOptionElement =>
      element instanceof HTMLOptionElement,
  );
}

function optionText(option: HTMLOptionElement): string {
  return (option.textContent ?? "").replaceAll(/[\t\n\f\r ]+/g, " ").trim();
}

interface TextControl {
  value: string;
  selectionStart: number | null;
  selectionEnd: number | null;
  selectionDirection: string | null;
  setSelectionRange(start: number, end: number, direction?: string): void;
}

function setRangeText(
  control: TextControl,
  replacement: unknown,
  start: unknown,
  end: unknown,
  selectionMode: unknown,
): void {
  const convertedReplacement = domString(replacement);
  const convertedStart = toUnsignedLong(start);
  const convertedEnd = toUnsignedLong(end);
  if (convertedStart > convertedEnd) {
    throw new DOMException(
      "Start cannot be greater than end",
      "IndexSizeError",
    );
  }
  const oldStart = control.selectionStart ?? 0;
  const oldEnd = control.selectionEnd ?? 0;
  const value = control.value;
  control.value =
    value.slice(0, convertedStart) +
    convertedReplacement +
    value.slice(convertedEnd);
  const newEnd = convertedStart + convertedReplacement.length;
  switch (domString(selectionMode)) {
    case "select":
      control.setSelectionRange(convertedStart, newEnd);
      break;
    case "start":
      control.setSelectionRange(convertedStart, convertedStart);
      break;
    case "end":
      control.setSelectionRange(newEnd, newEnd);
      break;
    default: {
      const delta =
        convertedReplacement.length - (convertedEnd - convertedStart);
      const adjust = (position: number): number =>
        position <= convertedStart
          ? position
          : position >= convertedEnd
            ? position + delta
            : newEnd;
      control.setSelectionRange(
        adjust(oldStart),
        adjust(oldEnd),
        control.selectionDirection ?? "none",
      );
    }
  }
}

interface HTMLElementClass {
  readonly prototype: HTMLElement;
}

const eventHandlerValues = new WeakMap<
  HTMLElement,
  Map<string, EventHandler>
>();

function installEventHandlerProperties(
  Interface: HTMLElementClass,
  eventTypes: readonly string[],
): void {
  for (const eventType of eventTypes) {
    const property = `on${eventType}`;
    Object.defineProperty(Interface.prototype, property, {
      configurable: true,
      enumerable: true,
      get(this: HTMLElement): EventHandler {
        return eventHandlerValues.get(this)?.get(property) ?? null;
      },
      set(this: HTMLElement, value: unknown): void {
        let values = eventHandlerValues.get(this);
        if (values === undefined) {
          values = new Map();
          eventHandlerValues.set(this, values);
        }
        values.set(
          property,
          typeof value === "function" ? (value as EventHandler) : null,
        );
      },
    });
  }
}

function installStringReflectors(
  Interface: HTMLElementClass,
  properties: Readonly<Record<string, string>>,
): void {
  for (const [property, attribute] of Object.entries(properties)) {
    Object.defineProperty(Interface.prototype, property, {
      configurable: true,
      enumerable: true,
      get(this: Element): string {
        return reflectedString(this, attribute);
      },
      set(this: Element, value: string): void {
        this.setAttribute(attribute, domString(value));
      },
    });
  }
}

function installURLReflectors(
  Interface: HTMLElementClass,
  properties: Readonly<Record<string, string>>,
): void {
  for (const [property, attribute] of Object.entries(properties)) {
    Object.defineProperty(Interface.prototype, property, {
      configurable: true,
      enumerable: true,
      get(this: Element): string {
        return reflectedURL(this, attribute);
      },
      set(this: Element, value: string): void {
        this.setAttribute(attribute, usvString(value));
      },
    });
  }
}

function installBooleanReflectors(
  Interface: HTMLElementClass,
  properties: Readonly<Record<string, string>>,
): void {
  for (const [property, attribute] of Object.entries(properties)) {
    Object.defineProperty(Interface.prototype, property, {
      configurable: true,
      enumerable: true,
      get(this: Element): boolean {
        return this.hasAttribute(attribute);
      },
      set(this: Element, value: boolean): void {
        this.toggleAttribute(attribute, value);
      },
    });
  }
}

function installUnsignedLongReflectors(
  Interface: HTMLElementClass,
  properties: Readonly<Record<string, string>>,
): void {
  for (const [property, attribute] of Object.entries(properties)) {
    Object.defineProperty(Interface.prototype, property, {
      configurable: true,
      enumerable: true,
      get(this: Element): number {
        return reflectedUnsignedLong(this, attribute);
      },
      set(this: Element, value: number): void {
        this.setAttribute(attribute, String(toUnsignedLong(value)));
      },
    });
  }
}

function installLongReflectors(
  Interface: HTMLElementClass,
  properties: Readonly<Record<string, string>>,
): void {
  for (const [property, attribute] of Object.entries(properties)) {
    Object.defineProperty(Interface.prototype, property, {
      configurable: true,
      enumerable: true,
      get(this: Element): number {
        return reflectedLong(this, attribute);
      },
      set(this: Element, value: number): void {
        this.setAttribute(attribute, String(toLong(value)));
      },
    });
  }
}

function installDoubleReflectors(
  Interface: HTMLElementClass,
  properties: Readonly<Record<string, string>>,
): void {
  for (const [property, attribute] of Object.entries(properties)) {
    Object.defineProperty(Interface.prototype, property, {
      configurable: true,
      enumerable: true,
      get(this: Element): number {
        return reflectedDouble(this, attribute, 0);
      },
      set(this: Element, value: number): void {
        this.setAttribute(attribute, String(finiteDouble(value)));
      },
    });
  }
}
