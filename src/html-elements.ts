import type { Node } from "./dom.js";
import {
  Document,
  DocumentFragment,
  Element,
  Event,
  EventTarget,
  HTMLCollection,
  NodeList,
  Text,
} from "./dom.js";
import { DOMException } from "./dom-exception.js";
import { HTML_NAMESPACE } from "./namespaces.js";

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

type URLConstructor = new (input: string, base?: string) => URLValue;

const platform = globalThis as typeof globalThis & {
  readonly URL: URLConstructor;
};

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

export class DOMTokenList implements Iterable<string> {
  readonly [index: number]: string | undefined;
  readonly _element: Element;
  readonly _attributeName: string;
  readonly _supportedTokens: ReadonlySet<string> | null;

  constructor(
    element: Element,
    attributeName: string,
    supportedTokens: readonly string[] | null = null,
  ) {
    this._element = element;
    this._attributeName = attributeName;
    this._supportedTokens =
      supportedTokens === null ? null : new Set(supportedTokens);
    return new Proxy(this, {
      get(target, property): unknown {
        if (typeof property === "string" && /^(0|[1-9]\d*)$/.test(property)) {
          return target._tokens()[Number(property)];
        }
        const value: unknown = Reflect.get(target, property, target);
        return typeof value === "function"
          ? (value as (...arguments_: unknown[]) => unknown).bind(target)
          : value;
      },
    });
  }

  get length(): number {
    return this._tokens().length;
  }

  get value(): string {
    return this._element.getAttribute(this._attributeName) ?? "";
  }

  set value(value: string) {
    this._element.setAttribute(this._attributeName, domString(value));
  }

  item(index: number): string | null {
    return this._tokens()[toUnsignedLong(index)] ?? null;
  }

  contains(token: string): boolean {
    const converted = validateToken(token);
    return this._tokens().includes(converted);
  }

  add(...tokens: string[]): void {
    const converted = tokens.map(validateToken);
    const values = this._tokens();
    for (const token of converted) {
      if (!values.includes(token)) {
        values.push(token);
      }
    }
    this._setTokens(values);
  }

  remove(...tokens: string[]): void {
    const converted = tokens.map(validateToken);
    this._setTokens(
      this._tokens().filter((token) => !converted.includes(token)),
    );
  }

  toggle(token: string, force?: boolean): boolean {
    const converted = validateToken(token);
    const values = this._tokens();
    const index = values.indexOf(converted);
    if (index >= 0) {
      if (arguments.length < 2 || !Boolean(force)) {
        values.splice(index, 1);
        this._setTokens(values);
        return false;
      }
      return true;
    }
    if (arguments.length < 2 || Boolean(force)) {
      values.push(converted);
      this._setTokens(values);
      return true;
    }
    return false;
  }

  replace(token: string, newToken: string): boolean {
    const converted = validateToken(token);
    const replacement = validateToken(newToken);
    const values = this._tokens();
    const index = values.indexOf(converted);
    if (index < 0) {
      return false;
    }
    const replacementIndex = values.indexOf(replacement);
    if (replacementIndex >= 0) {
      values.splice(index, 1);
    } else {
      values[index] = replacement;
    }
    this._setTokens(values);
    return true;
  }

  supports(token: string): boolean {
    if (this._supportedTokens === null) {
      throw new TypeError("This DOMTokenList has no supported tokens");
    }
    return this._supportedTokens.has(asciiLowercase(domString(token)));
  }

  entries(): IterableIterator<[number, string]> {
    return this._tokens().entries();
  }

  keys(): IterableIterator<number> {
    return this._tokens().keys();
  }

  values(): IterableIterator<string> {
    return this._tokens().values();
  }

  forEach(
    callback: (value: string, key: number, parent: DOMTokenList) => void,
    thisArgument?: unknown,
  ): void {
    for (const [index, token] of this._tokens().entries()) {
      callback.call(thisArgument, token, index, this);
    }
  }

  [Symbol.iterator](): IterableIterator<string> {
    return this.values();
  }

  toString(): string {
    return this.value;
  }

  _tokens(): string[] {
    const value = this._element.getAttribute(this._attributeName) ?? "";
    return [...new Set(value.split(/[\t\n\f\r ]+/).filter(Boolean))];
  }

  _setTokens(tokens: readonly string[]): void {
    this._element.setAttribute(this._attributeName, tokens.join(" "));
  }
}

export class DOMStringMap {
  [name: string]: string | undefined;
  readonly #element: Element;

  constructor(element: Element) {
    this.#element = element;
    return new Proxy(this, {
      get(target, property): unknown {
        if (typeof property !== "string" || property in target) {
          return Reflect.get(target, property, target);
        }
        const attributeName = datasetAttributeName(property);
        return target.#element.getAttribute(attributeName) ?? undefined;
      },
      set(target, property, value): boolean {
        if (typeof property !== "string") {
          return Reflect.set(target, property, value, target);
        }
        target.#element.setAttribute(
          datasetAttributeName(property),
          domString(value),
        );
        return true;
      },
      deleteProperty(target, property): boolean {
        if (typeof property === "string") {
          target.#element.removeAttribute(datasetAttributeName(property));
        }
        return true;
      },
      ownKeys(target): string[] {
        return target.#element
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
          target.#element.hasAttribute(datasetAttributeName(property))
        ) {
          return { configurable: true, enumerable: true, writable: true };
        }
        return undefined;
      },
    });
  }
}

export type EventHandler = ((event: Event) => unknown) | null;

export class HTMLElement extends Element {
  [eventHandler: `on${string}`]: EventHandler;
  #dataset: DOMStringMap | null = null;
  #popoverVisible = false;

  constructor() {
    const construction = currentHTMLConstruction();
    super(construction.document, construction.localName, HTML_NAMESPACE);
  }

  get title(): string {
    return this.getAttribute("title") ?? "";
  }

  set title(value: string) {
    this.setAttribute("title", value);
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
    parent.replaceChild(new Text(document, domString(value)), this);
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
    this.#dataset ??= new DOMStringMap(this);
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
    for (const child of [...this._childNodes]) {
      this.removeChild(child);
    }
    if (converted !== "") {
      const document = this.ownerDocument;
      if (document === null) {
        throw new TypeError("Element has no owner document");
      }
      this.appendChild(new Text(document, converted));
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
    this.#content = new DocumentFragment(ownerDocument);
    this._templateContents = this.#content;
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
    this.#relList ??= new DOMTokenList(this, "rel", [
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
    this.#sizes ??= new DOMTokenList(this, "sizes");
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
    this.#blocking ??= new DOMTokenList(this, "blocking", ["render"]);
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
    this.#blocking ??= new DOMTokenList(this, "blocking", ["render"]);
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
    this.#relList ??= new DOMTokenList(this, "rel");
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
    this.#sandbox ??= new DOMTokenList(this, "sandbox");
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

  constructor(ranges: readonly (readonly [number, number])[] = []) {
    this.#ranges = ranges;
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
  readonly #audioTracks = new AudioTrackList();
  readonly #videoTracks = new VideoTrackList();
  readonly #textTracks = new TextTrackList();

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
    return new TimeRanges();
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
    return new TimeRanges();
  }

  get seekable(): TimeRanges {
    return new TimeRanges();
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
    const track = new TextTrack(
      asciiLowercase(domString(kind)),
      domString(label),
      domString(language),
    );
    this.#textTracks._add(track);
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
  readonly _tracks: T[] = [];

  constructor() {
    super();
    return new Proxy(this, {
      get(target, property): unknown {
        if (typeof property === "string" && /^(0|[1-9]\d*)$/.test(property)) {
          return target._tracks[Number(property)];
        }
        const value: unknown = Reflect.get(target, property, target);
        return typeof value === "function"
          ? (value as (...arguments_: unknown[]) => unknown).bind(target)
          : value;
      },
    });
  }

  get length(): number {
    return this._tracks.length;
  }

  item(index: number): T | null {
    return this._tracks[toUnsignedLong(index)] ?? null;
  }

  getTrackById(id: string): T | null {
    const converted = domString(id);
    return this._tracks.find((track) => track.id === converted) ?? null;
  }

  _add(track: T): void {
    this._tracks.push(track);
  }

  [Symbol.iterator](): Iterator<T> {
    return this._tracks[Symbol.iterator]();
  }
}

export class AudioTrack {
  readonly id: string;
  readonly kind: string;
  readonly label: string;
  readonly language: string;
  enabled = false;

  constructor(id = "", kind = "", label = "", language = "") {
    this.id = id;
    this.kind = kind;
    this.label = label;
    this.language = language;
  }
}

export class VideoTrack {
  readonly id: string;
  readonly kind: string;
  readonly label: string;
  readonly language: string;
  selected = false;

  constructor(id = "", kind = "", label = "", language = "") {
    this.id = id;
    this.kind = kind;
    this.label = label;
    this.language = language;
  }
}

export class AudioTrackList extends TrackList<AudioTrack> {}

export class VideoTrackList extends TrackList<VideoTrack> {
  get selectedIndex(): number {
    return this._tracks.findIndex((track) => track.selected);
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

  constructor(kind = "subtitles", label = "", language = "") {
    super();
    this.kind = kind;
    this.label = label;
    this.language = language;
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
    this.#track ??= new TextTrack(this.kind, this.label, this.srclang);
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
    this.#areas ??= new HTMLCollection(() =>
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
    this.#relList ??= new DOMTokenList(this, "rel");
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
    return (
      directChildren(this).find(
        (element): element is HTMLTableCaptionElement =>
          element instanceof HTMLTableCaptionElement,
      ) ?? null
    );
  }

  set caption(value: HTMLTableCaptionElement | null) {
    if (value !== null && !(value instanceof HTMLTableCaptionElement)) {
      throw new TypeError("caption must be an HTMLTableCaptionElement or null");
    }
    this.deleteCaption();
    if (value !== null) {
      this.insertBefore(value, this.firstChild);
    }
  }

  createCaption(): HTMLTableCaptionElement {
    const existing = this.caption;
    if (existing !== null) {
      return existing;
    }
    const caption = createChild(this, "caption", HTMLTableCaptionElement);
    this.insertBefore(caption, this.firstChild);
    return caption;
  }

  deleteCaption(): void {
    this.caption?.remove();
  }

  get tHead(): HTMLTableSectionElement | null {
    return (
      directChildren(this).find(
        (element): element is HTMLTableSectionElement =>
          element instanceof HTMLTableSectionElement &&
          element.localName === "thead",
      ) ?? null
    );
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
    const firstBody = this.tBodies.item(0);
    this.insertBefore(head, firstBody ?? this.tFoot);
    return head;
  }

  deleteTHead(): void {
    this.tHead?.remove();
  }

  get tFoot(): HTMLTableSectionElement | null {
    return (
      directChildren(this).find(
        (element): element is HTMLTableSectionElement =>
          element instanceof HTMLTableSectionElement &&
          element.localName === "tfoot",
      ) ?? null
    );
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
    this.appendChild(foot);
    return foot;
  }

  deleteTFoot(): void {
    this.tFoot?.remove();
  }

  get tBodies(): HTMLCollection<HTMLTableSectionElement> {
    this.#tBodies ??= new HTMLCollection(() =>
      directChildren(this).filter(
        (element): element is HTMLTableSectionElement =>
          element instanceof HTMLTableSectionElement &&
          element.localName === "tbody",
      ),
    );
    return this.#tBodies;
  }

  createTBody(): HTMLTableSectionElement {
    const body = createChild(this, "tbody", HTMLTableSectionElement);
    this.appendChild(body);
    return body;
  }

  get rows(): HTMLCollection<HTMLTableRowElement> {
    this.#rows ??= new HTMLCollection(() => tableRows(this));
    return this.#rows;
  }

  insertRow(index = -1): HTMLTableRowElement {
    const normalized = tableInsertionIndex(index, this.rows.length);
    if (normalized < this.rows.length) {
      const reference = this.rows.item(normalized);
      const parent = reference?.parentNode;
      if (parent === null || parent === undefined) {
        throw new DOMException(
          "The row reference is missing",
          "InvalidStateError",
        );
      }
      const row = createChild(this, "tr", HTMLTableRowElement);
      parent.insertBefore(row, reference);
      return row;
    }
    const parent = this.tBodies.item(this.tBodies.length - 1) ?? this;
    const row = createChild(this, "tr", HTMLTableRowElement);
    parent.appendChild(row);
    return row;
  }

  deleteRow(index: number): void {
    requireArguments(arguments.length, 1);
    const row = indexedDelete(this.rows, index);
    row.remove();
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
    this.#rows ??= new HTMLCollection(() =>
      directChildren(this).filter(
        (element): element is HTMLTableRowElement =>
          element instanceof HTMLTableRowElement,
      ),
    );
    return this.#rows;
  }

  insertRow(index = -1): HTMLTableRowElement {
    const normalized = tableInsertionIndex(index, this.rows.length);
    const row = createChild(this, "tr", HTMLTableRowElement);
    const reference = this.rows.item(normalized);
    this.insertBefore(row, reference);
    return row;
  }

  deleteRow(index: number): void {
    requireArguments(arguments.length, 1);
    indexedDelete(this.rows, index).remove();
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
    this.#cells ??= new HTMLCollection(() =>
      directChildren(this).filter(
        (element): element is HTMLTableCellElement =>
          element instanceof HTMLTableCellElement,
      ),
    );
    return this.#cells;
  }

  insertCell(index = -1): HTMLTableCellElement {
    const normalized = tableInsertionIndex(index, this.cells.length);
    const cell = createChild(this, "td", HTMLTableCellElement);
    this.insertBefore(cell, this.cells.item(normalized));
    return cell;
  }

  deleteCell(index: number): void {
    requireArguments(arguments.length, 1);
    indexedDelete(this.cells, index).remove();
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

  constructor(validation: ValidationState) {
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
      : new RadioNodeList(() => matches);
  }
}

export class HTMLOptionsCollection extends HTMLCollection<HTMLOptionElement> {
  readonly #select: HTMLSelectElement;

  constructor(select: HTMLSelectElement) {
    super(() => optionDescendants(select));
    this.#select = select;
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
    this.#relList ??= new DOMTokenList(this, "rel");
    return this.#relList;
  }

  get elements(): HTMLFormControlsCollection {
    this.#elements ??= new HTMLFormControlsCollection(() => formControls(this));
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

  _reset(): void {
    this.#value = null;
    this.#checked = null;
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
    this.#options ??= new HTMLOptionsCollection(this);
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
    this.#selectedOptions ??= new HTMLCollection(() =>
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
    this.#options ??= new HTMLCollection(() => optionDescendants(this));
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

  _reset(): void {
    this.#selected = null;
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

  _reset(): void {
    this.#value = null;
  }
}

export class HTMLOutputElement extends HTMLElement {
  #htmlFor: DOMTokenList | null = null;
  #defaultValue: string | null = null;
  #validation = new ValidationState(this);

  declare name: string;

  get htmlFor(): DOMTokenList {
    this.#htmlFor ??= new DOMTokenList(this, "for");
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
    this.#elements ??= new HTMLCollection(() => formControls(this));
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
  #async: boolean | null = null;

  declare type: string;
  declare src: string;
  declare noModule: boolean;
  declare defer: boolean;
  declare integrity: string;
  declare charset: string;
  declare event: string;
  declare htmlFor: string;

  get async(): boolean {
    return this.#async ?? this.hasAttribute("async");
  }

  set async(value: boolean) {
    this.#async = value;
    this.toggleAttribute("async", value);
  }

  get blocking(): DOMTokenList {
    this.#blocking ??= new DOMTokenList(this, "blocking", ["render"]);
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
    Reflect.get(options, "flatten");
    return this.#assigned === null
      ? [...this._childNodes]
      : [...this.#assigned];
  }

  assignedElements(options: { flatten?: boolean } = {}): Element[] {
    Reflect.get(options, "flatten");
    return this.assignedNodes().filter(
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

installEventHandlerProperties(HTMLElement, [
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
]);
installEventHandlerProperties(HTMLBodyElement, [
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
]);
installEventHandlerProperties(HTMLFrameSetElement, [
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
]);

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
): Element {
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
    return new Element(document, localName, HTML_NAMESPACE);
  }
  return constructHTMLElement(HTMLUnknownElement, document, localName);
}

interface HTMLConstruction {
  readonly document: Document;
  readonly localName: string;
}

type HTMLInterfaceConstructor<T extends HTMLElement> = new () => T;

const htmlConstructionStack: HTMLConstruction[] = [];

function constructHTMLElement<T extends HTMLElement>(
  Interface: HTMLInterfaceConstructor<T>,
  document: Document,
  localName: string,
): T {
  htmlConstructionStack.push({ document, localName });
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

function toLong(value: unknown): number {
  const number = Number(value);
  if (!Number.isFinite(number) || number === 0) {
    return 0;
  }
  const integer = Math.trunc(number);
  const unsigned = ((integer % 4_294_967_296) + 4_294_967_296) % 4_294_967_296;
  return unsigned >= 2_147_483_648 ? unsigned - 4_294_967_296 : unsigned;
}

function domString(value: unknown): string {
  if (typeof value === "symbol") {
    throw new TypeError("Cannot convert a Symbol value to a string");
  }
  return String(value);
}

function templateContentsOwnerDocument(document: Document): Document {
  document._templateContentsOwnerDocument ??= new Document();
  return document._templateContentsOwnerDocument;
}

function reflectedString(element: Element, name: string): string {
  return element.getAttribute(name) ?? "";
}

function reflectedURL(element: Element, name: string): string {
  const value = element.getAttribute(name) ?? "";
  if (value === "") {
    return "";
  }
  try {
    return new platform.URL(value).href;
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

function validateToken(value: unknown): string {
  const token = domString(value);
  if (token === "") {
    throw new DOMException("A token cannot be empty", "SyntaxError");
  }
  if (/[\t\n\f\r ]/.test(token)) {
    throw new DOMException(
      "A token cannot contain ASCII whitespace",
      "InvalidCharacterError",
    );
  }
  return token;
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
  for (const child of [...element._childNodes]) {
    element.removeChild(child);
  }
  if (value === "") {
    return;
  }
  const document = element.ownerDocument;
  if (document === null) {
    throw new TypeError("Element has no owner document");
  }
  element.appendChild(new Text(document, value));
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
    return new platform.URL(value);
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

function requireArguments(actual: number, required: number): void {
  if (actual < required) {
    throw new TypeError(
      `${String(required)} argument${required === 1 ? "" : "s"} required, but only ${String(actual)} present`,
    );
  }
}

function descendants(root: Node): Element[] {
  const result: Element[] = [];
  for (const child of root._childNodes) {
    if (child instanceof Element) {
      result.push(child);
    }
    result.push(...descendants(child));
  }
  return result;
}

function directChildren(element: Element): Element[] {
  return element._childNodes.filter(
    (child): child is Element => child instanceof Element,
  );
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
  if (
    value !== null &&
    (!(value instanceof HTMLTableSectionElement) ||
      value.localName !== localName)
  ) {
    throw new TypeError(`The value must be a ${localName} element or null`);
  }
  const current = localName === "thead" ? table.tHead : table.tFoot;
  current?.remove();
  if (value !== null) {
    table.appendChild(value);
  }
}

function tableRows(table: HTMLTableElement): HTMLTableRowElement[] {
  const rows: HTMLTableRowElement[] = [];
  for (const child of directChildren(table)) {
    if (child instanceof HTMLTableRowElement) {
      rows.push(child);
    } else if (child instanceof HTMLTableSectionElement) {
      rows.push(...child.rows);
    }
  }
  return rows;
}

function tableInsertionIndex(index: unknown, length: number): number {
  const converted = toLong(index);
  if (converted === -1) {
    return length;
  }
  if (converted < 0 || converted > length) {
    throw new DOMException(
      "The index is outside the permitted range",
      "IndexSizeError",
    );
  }
  return converted;
}

function indexedDelete<T extends Element>(
  collection: HTMLCollection<T>,
  index: unknown,
): T {
  const converted = toLong(index);
  const normalized = converted === -1 ? collection.length - 1 : converted;
  const item = collection.item(normalized);
  if (item === null) {
    throw new DOMException(
      "The index is outside the permitted range",
      "IndexSizeError",
    );
  }
  return item;
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
    element._reset();
  } else if (element instanceof HTMLOptionElement) {
    element._reset();
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
  return new NodeList(() => {
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
