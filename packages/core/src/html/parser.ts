import type {
  AttributeData,
  Document,
  DocumentFragment,
  Node,
} from "../dom.js";
import { DOMException } from "../dom-exception.js";
import type { FragmentParseOptions, FragmentParser } from "../dom/nodes.js";
import type {
  HTMLDocumentParserSession,
  HTMLDocumentParserSessionOptions,
} from "../dom/nodes.js";
import {
  sanitizerAction,
  sanitizerAllowsAttribute,
  sanitizerAllowsComments,
  sanitizerAllowsPI,
  type CanonicalSanitizerConfig,
} from "../dom/sanitizer.js";
import {
  documentImplementation,
  nodeImplementation,
  type ScriptingMode,
} from "../dom/node-implementation.js";
import {
  appendCharacterData,
  appendNode,
  attributeNodes,
  childNodes,
  cloneNodeIntoDocument,
  createComment,
  createDocument,
  createDocumentFragment,
  createDocumentType,
  createElementForDocument as createDOMElement,
  createProcessingInstruction,
  createText,
  documentIsQuirks,
  insertNodeBefore,
  removeNode,
  setAttributes,
  setDocumentParseErrors,
  setDocumentQuirks,
  setHTMLParsingAlgorithms,
  startHTMLDocumentParserSession,
  setTemplateContents,
  templateContents,
} from "../dom/nodes.js";
import { Element, Text } from "../dom.js";
import {
  HTML_NAMESPACE,
  MATHML_NAMESPACE,
  SVG_NAMESPACE,
  XLINK_NAMESPACE,
  XML_NAMESPACE,
  XMLNS_NAMESPACE,
} from "../namespaces.js";
import { createElementForDocument } from "../html-elements.js";
import type { Token, TokenizerState } from "./tokenizer.js";
import { HTMLTokenizer } from "./tokenizer.js";
import type { PalimParseError } from "./parse-errors.js";

export interface HTMLFragmentContext {
  readonly namespaceURI: string;
  readonly localName: string;
}

interface TreeBuilderOptions {
  readonly allowDeclarativeShadowRoots?: boolean;
  readonly context?: HTMLFragmentContext | Element;
  readonly document?: Document;
  readonly onElement?: (element: Element) => void;
  readonly onScript?: (element: Element) => Promise<void> | void;
  readonly runScripts?: boolean;
  readonly sanitizerConfig?: CanonicalSanitizerConfig;
  readonly scriptingMode?: ScriptingMode;
  readonly streamingDocument?: boolean;
  readonly streamingInsertion?: {
    readonly parent: Node;
    readonly reference: Node | null;
  };
}

const htmlFragmentParser: FragmentParser = {
  parse(input, context, options) {
    return new TreeBuilder(input, {
      allowDeclarativeShadowRoots:
        options?.allowDeclarativeShadowRoots ?? false,
      context,
      runScripts: options?.runScripts ?? false,
      ...(options?.sanitizerConfig === undefined
        ? {}
        : { sanitizerConfig: options.sanitizerConfig }),
      scriptingMode:
        context.ownerDocument === null
          ? "disabled"
          : documentImplementation(context.ownerDocument).scriptingMode,
    }).parseFragment();
  },
};

type Mode =
  | "initial"
  | "before-html"
  | "before-head"
  | "in-head"
  | "in-head-noscript"
  | "after-head"
  | "in-body"
  | "text"
  | "in-table"
  | "in-table-text"
  | "in-caption"
  | "in-column-group"
  | "in-table-body"
  | "in-row"
  | "in-cell"
  | "in-select"
  | "in-select-in-table"
  | "in-template"
  | "after-body"
  | "in-frameset"
  | "after-frameset"
  | "after-after-body"
  | "after-after-frameset";

const VOID = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "keygen",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);
const FORMATTING = new Set([
  "a",
  "b",
  "big",
  "code",
  "em",
  "font",
  "i",
  "nobr",
  "s",
  "small",
  "strike",
  "strong",
  "tt",
  "u",
]);
const BLOCK = new Set([
  "address",
  "article",
  "aside",
  "blockquote",
  "center",
  "details",
  "dialog",
  "dir",
  "div",
  "dl",
  "fieldset",
  "figcaption",
  "figure",
  "footer",
  "header",
  "hgroup",
  "main",
  "menu",
  "nav",
  "ol",
  "p",
  "search",
  "section",
  "summary",
  "ul",
]);
const IMPLIED_END = new Set([
  "dd",
  "dt",
  "li",
  "optgroup",
  "option",
  "p",
  "rb",
  "rp",
  "rt",
  "rtc",
]);
const SPECIAL_HTML = new Set([
  ...BLOCK,
  "applet",
  "area",
  "base",
  "basefont",
  "bgsound",
  "body",
  "br",
  "button",
  "caption",
  "col",
  "colgroup",
  "dd",
  "dt",
  "embed",
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
  "li",
  "link",
  "listing",
  "marquee",
  "meta",
  "noembed",
  "noframes",
  "noscript",
  "object",
  "ol",
  "p",
  "param",
  "plaintext",
  "pre",
  "script",
  "select",
  "source",
  "style",
  "table",
  "tbody",
  "td",
  "template",
  "textarea",
  "tfoot",
  "th",
  "thead",
  "title",
  "tr",
  "track",
  "ul",
  "wbr",
  "xmp",
]);
const SVG_NAMES: Readonly<Record<string, string>> = {
  altglyph: "altGlyph",
  altglyphdef: "altGlyphDef",
  altglyphitem: "altGlyphItem",
  animatecolor: "animateColor",
  animatemotion: "animateMotion",
  animatetransform: "animateTransform",
  clippath: "clipPath",
  feblend: "feBlend",
  fecolormatrix: "feColorMatrix",
  fecomponenttransfer: "feComponentTransfer",
  fecomposite: "feComposite",
  feconvolvematrix: "feConvolveMatrix",
  fediffuselighting: "feDiffuseLighting",
  fedisplacementmap: "feDisplacementMap",
  fedistantlight: "feDistantLight",
  fedropshadow: "feDropShadow",
  feflood: "feFlood",
  fefunca: "feFuncA",
  fefuncb: "feFuncB",
  fefuncg: "feFuncG",
  fefuncr: "feFuncR",
  fegaussianblur: "feGaussianBlur",
  feimage: "feImage",
  femerge: "feMerge",
  femergenode: "feMergeNode",
  femorphology: "feMorphology",
  feoffset: "feOffset",
  fepointlight: "fePointLight",
  fespecularlighting: "feSpecularLighting",
  fespotlight: "feSpotLight",
  fetile: "feTile",
  feturbulence: "feTurbulence",
  foreignobject: "foreignObject",
  glyphref: "glyphRef",
  lineargradient: "linearGradient",
  radialgradient: "radialGradient",
  textpath: "textPath",
};
const SVG_ATTRIBUTES: Readonly<Record<string, string>> = {
  attributename: "attributeName",
  attributetype: "attributeType",
  basefrequency: "baseFrequency",
  baseprofile: "baseProfile",
  calcmode: "calcMode",
  clippathunits: "clipPathUnits",
  diffuseconstant: "diffuseConstant",
  edgemode: "edgeMode",
  filterunits: "filterUnits",
  glyphref: "glyphRef",
  gradienttransform: "gradientTransform",
  gradientunits: "gradientUnits",
  kernelmatrix: "kernelMatrix",
  kernelunitlength: "kernelUnitLength",
  keypoints: "keyPoints",
  keysplines: "keySplines",
  keytimes: "keyTimes",
  lengthadjust: "lengthAdjust",
  limitingconeangle: "limitingConeAngle",
  markerheight: "markerHeight",
  markerunits: "markerUnits",
  markerwidth: "markerWidth",
  maskcontentunits: "maskContentUnits",
  maskunits: "maskUnits",
  numoctaves: "numOctaves",
  pathlength: "pathLength",
  patterncontentunits: "patternContentUnits",
  patterntransform: "patternTransform",
  patternunits: "patternUnits",
  pointsatx: "pointsAtX",
  pointsaty: "pointsAtY",
  pointsatz: "pointsAtZ",
  preservealpha: "preserveAlpha",
  preserveaspectratio: "preserveAspectRatio",
  primitiveunits: "primitiveUnits",
  refx: "refX",
  refy: "refY",
  repeatcount: "repeatCount",
  repeatdur: "repeatDur",
  requiredextensions: "requiredExtensions",
  requiredfeatures: "requiredFeatures",
  specularconstant: "specularConstant",
  specularexponent: "specularExponent",
  spreadmethod: "spreadMethod",
  startoffset: "startOffset",
  stddeviation: "stdDeviation",
  stitchtiles: "stitchTiles",
  surfacescale: "surfaceScale",
  systemlanguage: "systemLanguage",
  tablevalues: "tableValues",
  targetx: "targetX",
  targety: "targetY",
  textlength: "textLength",
  viewbox: "viewBox",
  viewtarget: "viewTarget",
  xchannelselector: "xChannelSelector",
  ychannelselector: "yChannelSelector",
  zoomandpan: "zoomAndPan",
};
const MATHML_ATTRIBUTES: Readonly<Record<string, string>> = {
  definitionurl: "definitionURL",
};

function whitespace(data: string): boolean {
  return /^[\t\n\f ]*$/.test(data);
}

class TreeBuilder {
  readonly document: Document;
  readonly #tokenizer: HTMLTokenizer;
  readonly #errors: PalimParseError[] = [];
  readonly #allowDeclarativeShadowRoots: boolean;
  readonly #context: Element | null;
  readonly #onElement: ((element: Element) => void) | undefined;
  readonly #onScript: ((element: Element) => Promise<void> | void) | undefined;
  readonly #runScripts: boolean;
  readonly #sanitizerConfig: CanonicalSanitizerConfig | null;
  readonly #streamingInsertion: {
    readonly parent: Node;
    readonly reference: Node | null;
  } | null;
  readonly #streamingDocument: boolean;
  readonly #scripting: boolean;
  readonly #stack: Element[] = [];
  readonly #formatting: (Element | null)[] = [];
  readonly #templateModes: Mode[] = [];
  readonly #sanitizerRedirections = new WeakMap<
    Element,
    { readonly parent: Node; readonly reference: Node | null }
  >();
  readonly #sanitizerActions = new WeakMap<
    Element,
    "keep" | "remove" | "replace"
  >();
  readonly #sourceAttributes = new WeakMap<Element, readonly AttributeData[]>();
  readonly #templatesInSanitizerRedirection = new WeakSet<Element>();
  #mode: Mode = "initial";
  #originalMode: Mode = "initial";
  #head: Element | null = null;
  #body: Element | null = null;
  #form: Element | null = null;
  #framesetOk = true;
  #ignoreNextLineFeed = false;
  #pendingTableCharacters = "";
  #pendingScript: Promise<void> | null = null;
  #recordedTokenizerErrors = 0;
  #streamingAbortRequested = false;
  #streamingCloseRequested = false;
  #streamingRoot: Element | null = null;
  #streamingFinished = false;
  #streamingRunning = false;
  #documentStreamingRunning = false;
  #documentStreamingPending: Promise<void> | null = null;
  #documentStreamingState: HTMLDocumentParserSession["state"] = "writable";
  readonly #documentStreamingFinished: Promise<Document>;
  readonly #resolveDocumentStreaming: (document: Document) => void;
  readonly #rejectDocumentStreaming: (error: unknown) => void;

  constructor(input: string, options: TreeBuilderOptions = {}) {
    this.document =
      options.document ??
      createDocument(htmlFragmentParser, "text/html", createElementForDocument);
    this.#onElement = options.onElement;
    this.#onScript = options.onScript;
    this.#allowDeclarativeShadowRoots =
      options.allowDeclarativeShadowRoots ?? false;
    this.#runScripts = options.runScripts ?? false;
    this.#sanitizerConfig = options.sanitizerConfig ?? null;
    this.#streamingInsertion = options.streamingInsertion ?? null;
    this.#streamingDocument = options.streamingDocument ?? false;
    let resolveDocumentStreaming!: (document: Document) => void;
    let rejectDocumentStreaming!: (error: unknown) => void;
    this.#documentStreamingFinished = new Promise<Document>(
      (resolve, reject) => {
        resolveDocumentStreaming = resolve;
        rejectDocumentStreaming = reject;
      },
    );
    this.#resolveDocumentStreaming = resolveDocumentStreaming;
    this.#rejectDocumentStreaming = rejectDocumentStreaming;
    const implementation = documentImplementation(this.document);
    const scriptingMode = options.scriptingMode ?? implementation.scriptingMode;
    implementation.scriptingMode = scriptingMode;
    this.#scripting = scriptingMode === "enabled";
    const context = options.context;
    this.#context =
      context === undefined
        ? null
        : context instanceof Element
          ? context
          : createDOMElement(
              this.document,
              context.localName,
              context.namespaceURI,
            );
    if (context instanceof Element && context.ownerDocument !== null) {
      documentImplementation(this.document).relevantRealmDocument =
        documentImplementation(context.ownerDocument).relevantRealmDocument;
    }
    this.#tokenizer = new HTMLTokenizer(input, {
      initialState: this.#initialTokenizerState(),
      streaming: this.#streamingInsertion !== null || this.#streamingDocument,
    });
    if (this.#context !== null) {
      if (context instanceof Element) {
        setDocumentQuirks(
          this.document,
          context.ownerDocument === null
            ? true
            : documentIsQuirks(context.ownerDocument),
        );
        for (
          let ancestor: Element | null = context;
          ancestor !== null;
          ancestor = ancestor.parentElement
        ) {
          if (
            ancestor.namespaceURI === HTML_NAMESPACE &&
            ancestor.localName === "form"
          ) {
            this.#form = ancestor;
            break;
          }
        }
      }
      const html = createDOMElement(this.document, "html", HTML_NAMESPACE);
      appendNode(this.document, html);
      this.#stack.push(html);
      if (this.#streamingInsertion !== null) {
        this.#streamingRoot = html;
      }
      if (this.#context.localName === "template") {
        this.#templateModes.push("in-template");
      }
      this.#mode = this.#modeForContext();
    }
  }

  parse(): Document {
    while (this.#processNextDocumentToken()) {
      if (this.#pendingScript !== null) {
        throw new TypeError(
          "The synchronous parser cannot await script processing",
        );
      }
    }
    return this.#finishDocument();
  }

  async parseAsync(): Promise<Document> {
    while (this.#processNextDocumentToken()) {
      const pendingScript = this.#pendingScript;
      this.#pendingScript = null;
      if (pendingScript !== null) {
        await pendingScript;
      }
    }
    return this.#finishDocument();
  }

  #processNextDocumentToken(): boolean {
    this.#tokenizer.setAllowCdata(
      this.#current() !== null &&
        this.#current()?.namespaceURI !== HTML_NAMESPACE,
    );
    const token = this.#nextToken();
    if (token === null) {
      if (this.#mode === "in-table-text") {
        this.#flushTableCharacters();
      }
      this.#endOfFile();
      return false;
    }
    this.#process(token);
    return true;
  }

  #finishDocument(): Document {
    if (this.#mode === "in-table-text") {
      this.#flushTableCharacters();
    }
    this.#finish();
    setDocumentParseErrors(this.document, this.#errors);
    return this.document;
  }

  parseFragment(): DocumentFragment {
    for (;;) {
      const current = this.#adjustedCurrent();
      this.#tokenizer.setAllowCdata(
        current !== null && current.namespaceURI !== HTML_NAMESPACE,
      );
      const token = this.#nextToken();
      if (token === null) {
        break;
      }
      this.#process(token);
    }
    if (this.#mode === "in-table-text") {
      this.#flushTableCharacters();
    }
    if (
      this.#context?.namespaceURI === HTML_NAMESPACE &&
      this.#context.localName === "html"
    ) {
      this.#finish();
    }
    const fragment = createDocumentFragment(this.document);
    const root = this.document.documentElement;
    while (root?.firstChild !== null && root?.firstChild !== undefined) {
      appendNode(fragment, root.firstChild);
    }
    return fragment;
  }

  get documentStreamingFinished(): Promise<Document> {
    return this.#documentStreamingFinished;
  }

  get documentStreamingState(): HTMLDocumentParserSession["state"] {
    return this.#documentStreamingState;
  }

  writeStreamingDocument(input: string): void {
    if (
      !this.#streamingDocument ||
      this.#documentStreamingState !== "writable"
    ) {
      throw new TypeError("The document parser session is not writable");
    }
    this.#tokenizer.insert(input);
    this.#runStreamingDocument();
  }

  closeStreamingDocument(): void {
    if (
      !this.#streamingDocument ||
      this.#documentStreamingState !== "writable"
    ) {
      return;
    }
    this.#tokenizer.close();
    this.#runStreamingDocument();
  }

  abortStreamingDocument(): void {
    if (
      !this.#streamingDocument ||
      this.#documentStreamingState !== "writable"
    ) {
      return;
    }
    this.#tokenizer.discard();
    this.#documentStreamingState = "aborted";
    this.#resolveDocumentStreaming(this.document);
  }

  #runStreamingDocument(): void {
    if (
      this.#documentStreamingRunning ||
      this.#documentStreamingPending !== null ||
      this.#documentStreamingState !== "writable"
    ) {
      return;
    }
    this.#documentStreamingRunning = true;
    try {
      for (;;) {
        this.#tokenizer.setAllowCdata(
          this.#current() !== null &&
            this.#current()?.namespaceURI !== HTML_NAMESPACE,
        );
        const token = this.#nextToken();
        if (token === null) {
          if (this.#tokenizer.closed) {
            const document = this.#finishDocument();
            this.#documentStreamingState = "closed";
            this.#completeStreamingDocument(document);
          }
          return;
        }
        this.#process(token);
        const pendingScript = this.#pendingScript;
        this.#pendingScript = null;
        if (pendingScript !== null) {
          this.#documentStreamingPending = pendingScript;
          void pendingScript.then(
            () => {
              this.#documentStreamingPending = null;
              this.#runStreamingDocument();
            },
            (error: unknown) => {
              this.#documentStreamingPending = null;
              this.#failStreamingDocument(error);
            },
          );
          return;
        }
      }
    } catch (error: unknown) {
      this.#failStreamingDocument(error);
      throw error;
    } finally {
      this.#documentStreamingRunning = false;
    }
  }

  #completeStreamingDocument(document: Document): void {
    this.#resolveDocumentStreaming(document);
  }

  #failStreamingDocument(error: unknown): void {
    if (this.#documentStreamingState !== "writable") {
      return;
    }
    this.#documentStreamingState = "errored";
    this.#tokenizer.discard();
    this.#rejectDocumentStreaming(error);
  }

  writeStreamingFragment(input: string): void {
    if (this.#streamingInsertion === null || this.#streamingFinished) {
      throw new TypeError("The streaming fragment parser is not writable");
    }
    this.#tokenizer.append(input);
    this.#runStreamingFragment();
  }

  closeStreamingFragment(): void {
    if (this.#streamingInsertion === null || this.#streamingFinished) {
      return;
    }
    this.#tokenizer.close();
    this.#streamingCloseRequested = true;
    this.#runStreamingFragment();
  }

  #finishStreamingFragment(): void {
    if (this.#streamingFinished) {
      return;
    }
    if (this.#mode === "in-table-text") {
      this.#flushTableCharacters();
    }
    this.#endOfFile();
    this.#streamingFinished = true;
    setDocumentParseErrors(this.document, this.#errors);
  }

  abortStreamingFragment(): void {
    if (this.#streamingInsertion === null || this.#streamingFinished) {
      return;
    }
    if (this.#streamingRunning) {
      this.#streamingAbortRequested = true;
      return;
    }
    this.#abortStreamingFragmentNow();
  }

  #abortStreamingFragmentNow(): void {
    this.#tokenizer.discard();
    if (this.#mode === "in-table-text") {
      this.#flushTableCharacters();
    }
    this.#stack.length = 0;
    this.#streamingFinished = true;
    setDocumentParseErrors(this.document, this.#errors);
  }

  #runStreamingFragment(): void {
    if (this.#streamingRunning) {
      return;
    }
    this.#streamingRunning = true;
    try {
      this.#processAvailableFragmentTokens();
    } finally {
      this.#streamingRunning = false;
    }
    if (this.#streamingAbortRequested) {
      this.#streamingAbortRequested = false;
      this.#abortStreamingFragmentNow();
    } else if (this.#streamingCloseRequested) {
      this.#finishStreamingFragment();
    }
  }

  #processAvailableFragmentTokens(): void {
    for (;;) {
      if (this.#streamingAbortRequested) {
        return;
      }
      const current = this.#adjustedCurrent();
      this.#tokenizer.setAllowCdata(
        current !== null && current.namespaceURI !== HTML_NAMESPACE,
      );
      const token = this.#nextToken();
      if (token === null) {
        return;
      }
      this.#process(token);
    }
  }

  #nextToken(): Token | null {
    const token = this.#tokenizer.nextToken();
    const errors = this.#tokenizer.errors;
    for (
      let index = this.#recordedTokenizerErrors;
      index < errors.length;
      index++
    ) {
      const error = errors[index];
      if (error !== undefined) {
        this.#errors.push({
          source: "tokenizer",
          code: error.code,
          line: error.line,
          column: error.column,
        });
      }
    }
    this.#recordedTokenizerErrors = errors.length;
    return token;
  }

  #treeError(code: string): void {
    this.#errors.push({
      source: "tree-construction",
      code,
      line: null,
      column: null,
    });
  }

  #endOfFile(): void {
    if (this.#mode === "initial") {
      this.#treeError("missing-doctype");
      return;
    }

    if (this.#mode === "text") {
      this.#treeError("unexpected-eof-in-text");
      this.#finishTextElement();
    }

    if (this.#mode === "in-head-noscript") {
      this.#treeError("unexpected-eof-in-head-noscript");
      this.#stack.pop();
      this.#mode = "in-head";
    }

    while (this.#contains("template")) {
      this.#treeError("unexpected-eof-in-template");
      this.#close("template");
      this.#clearFormatting();
      this.#templateModes.pop();
      this.#resetMode();
    }

    if (
      [
        "in-body",
        "in-table",
        "in-caption",
        "in-column-group",
        "in-table-body",
        "in-row",
        "in-cell",
        "in-select",
        "in-select-in-table",
      ].includes(this.#mode) &&
      this.#hasUnexpectedOpenElements()
    ) {
      this.#treeError("unexpected-open-elements-at-eof");
    } else if (
      this.#mode === "in-frameset" &&
      this.#current()?.localName !== "html"
    ) {
      this.#treeError("unexpected-eof-in-frameset");
    }
  }

  #initialTokenizerState(): TokenizerState {
    if (this.#context?.namespaceURI !== HTML_NAMESPACE) {
      return "Data state";
    }
    const name = this.#context.localName;
    if (["title", "textarea"].includes(name)) {
      return "RCDATA state";
    }
    if (
      ["style", "xmp", "iframe", "noembed", "noframes"].includes(name) ||
      (name === "noscript" && this.#scripting)
    ) {
      return "RAWTEXT state";
    }
    if (name === "script") {
      return "Script data state";
    }
    return name === "plaintext" ? "PLAINTEXT state" : "Data state";
  }

  #modeForContext(): Mode {
    const name = this.#context?.localName;
    if (this.#context?.namespaceURI === HTML_NAMESPACE && name === "html") {
      return "before-head";
    }
    if (name === "select") {
      return "in-select";
    }
    if (name === "td" || name === "th") {
      return "in-cell";
    }
    if (name === "tr") {
      return "in-row";
    }
    if (["tbody", "thead", "tfoot"].includes(name ?? "")) {
      return "in-table-body";
    }
    if (name === "caption") {
      return "in-caption";
    }
    if (name === "colgroup") {
      return "in-column-group";
    }
    if (name === "table") {
      return "in-table";
    }
    if (name === "template") {
      return "in-template";
    }
    if (name === "head") {
      return "in-head";
    }
    if (name === "frameset") {
      return "in-frameset";
    }
    return "in-body";
  }

  #adjustedCurrent(): Element | null {
    return this.#context !== null && this.#stack.length === 1
      ? this.#context
      : this.#current();
  }

  #process(token: Token): void {
    if (this.#ignoreNextLineFeed) {
      this.#ignoreNextLineFeed = false;
      if (token.type === "Character" && token.data.startsWith("\n")) {
        token = { ...token, data: token.data.slice(1) };
        if (token.data === "") {
          return;
        }
      }
    }
    if (this.#foreign(token)) {
      return;
    }
    let repeat = true;
    while (repeat) {
      repeat = false;
      switch (this.#mode) {
        case "initial":
          if (token.type === "Character" && whitespace(token.data)) {
            break;
          }
          if (token.type === "Comment") {
            appendNode(this.document, createComment(this.document, token.data));
          } else if (token.type === "ProcessingInstruction") {
            appendNode(
              this.document,
              createProcessingInstruction(
                this.document,
                token.target,
                token.data,
              ),
            );
          } else if (token.type === "DOCTYPE") {
            if (
              token.name !== "html" ||
              token.publicId !== null ||
              (token.systemId !== null &&
                token.systemId !== "about:legacy-compat")
            ) {
              this.#treeError("invalid-doctype");
            }
            appendNode(
              this.document,
              createDocumentType(
                this.document,
                token.name ?? "",
                token.publicId ?? "",
                token.systemId ?? "",
              ),
            );
            setDocumentQuirks(this.document, this.#doctypeCausesQuirks(token));
            this.#mode = "before-html";
          } else {
            this.#treeError("missing-doctype");
            setDocumentQuirks(this.document, true);
            this.#mode = "before-html";
            repeat = true;
          }
          break;
        case "before-html":
          if (token.type === "Character" && whitespace(token.data)) {
            break;
          }
          if (token.type === "Comment") {
            appendNode(this.document, createComment(this.document, token.data));
          } else if (token.type === "ProcessingInstruction") {
            appendNode(
              this.document,
              createProcessingInstruction(
                this.document,
                token.target,
                token.data,
              ),
            );
          } else if (token.type === "StartTag" && token.name === "html") {
            const html = this.#element(token, HTML_NAMESPACE);
            appendNode(this.document, html);
            this.#stack.push(html);
            this.#mode = "before-head";
          } else if (token.type === "DOCTYPE") {
            this.#treeError("unexpected-doctype");
          } else if (
            token.type === "EndTag" &&
            !["head", "body", "html", "br"].includes(token.name)
          ) {
            this.#treeError("unexpected-end-tag-before-html");
          } else {
            const html = createDOMElement(
              this.document,
              "html",
              HTML_NAMESPACE,
            );
            appendNode(this.document, html);
            this.#stack.push(html);
            this.#mode = "before-head";
            repeat = true;
          }
          break;
        case "before-head":
          if (token.type === "Character" && whitespace(token.data)) {
            break;
          }
          if (token.type === "Comment") {
            this.#comment(token.data);
          } else if (token.type === "ProcessingInstruction") {
            this.#processingInstruction(token);
          } else if (token.type === "StartTag" && token.name === "head") {
            this.#head = this.#insert(token);
            this.#mode = "in-head";
          } else if (
            token.type === "EndTag" &&
            !["head", "body", "html", "br"].includes(token.name)
          ) {
            this.#treeError("unexpected-end-tag-before-head");
          } else if (token.type === "DOCTYPE") {
            this.#treeError("unexpected-doctype");
          } else {
            this.#head = this.#insert(this.#start("head"));
            this.#mode = "in-head";
            repeat = true;
          }
          break;
        case "in-head":
          repeat = this.#inHead(token);
          break;
        case "in-head-noscript":
          repeat = this.#inHeadNoscript(token);
          break;
        case "after-head":
          repeat = this.#afterHead(token);
          break;
        case "in-body":
          this.#inBody(token);
          break;
        case "text":
          if (token.type === "Character") {
            this.#text(token.data);
          } else if (token.type === "EndTag") {
            this.#finishTextElement();
          }
          break;
        case "in-table":
          this.#inTable(token);
          break;
        case "in-table-text":
          this.#inTableText(token);
          break;
        case "in-caption":
          this.#inCaption(token);
          break;
        case "in-column-group":
          this.#inColumnGroup(token);
          break;
        case "in-table-body":
          this.#inTableBody(token);
          break;
        case "in-row":
          this.#inRow(token);
          break;
        case "in-cell":
          this.#inCell(token);
          break;
        case "in-select":
          this.#inSelect(token);
          break;
        case "in-select-in-table":
          this.#inSelectInTable(token);
          break;
        case "in-template":
          this.#inTemplate(token);
          break;
        case "after-body":
          if (token.type === "Character" && whitespace(token.data)) {
            this.#inBody(token);
          } else if (token.type === "Comment") {
            appendToDocumentElement(
              this.document,
              createComment(this.document, token.data),
            );
          } else if (token.type === "ProcessingInstruction") {
            appendToDocumentElement(
              this.document,
              createProcessingInstruction(
                this.document,
                token.target,
                token.data,
              ),
            );
          } else if (token.type === "EndTag" && token.name === "html") {
            this.#mode = "after-after-body";
          } else if (token.type === "DOCTYPE") {
            this.#inBody(token);
          } else {
            this.#treeError("unexpected-token-after-body");
            this.#mode = "in-body";
            repeat = true;
          }
          break;
        case "in-frameset":
          this.#inFrameset(token);
          break;
        case "after-frameset":
          this.#afterFrameset(token);
          break;
        case "after-after-body":
          if (token.type === "Comment") {
            if (this.#context === null) {
              appendNode(
                this.document,
                createComment(this.document, token.data),
              );
            } else {
              appendToDocumentElement(
                this.document,
                createComment(this.document, token.data),
              );
            }
          } else if (token.type === "ProcessingInstruction") {
            const instruction = createProcessingInstruction(
              this.document,
              token.target,
              token.data,
            );
            if (this.#context === null) {
              appendNode(this.document, instruction);
            } else {
              appendToDocumentElement(this.document, instruction);
            }
          } else if (token.type === "Character" && whitespace(token.data)) {
            this.#inBody(token);
          } else if (token.type === "StartTag" && token.name === "html") {
            this.#inBody(token);
          } else if (token.type === "DOCTYPE") {
            this.#inBody(token);
          } else {
            this.#treeError("unexpected-token-after-after-body");
            this.#mode = "in-body";
            repeat = true;
          }
          break;
        case "after-after-frameset":
          if (token.type === "Comment") {
            appendNode(this.document, createComment(this.document, token.data));
          } else if (
            (token.type === "Character" && whitespace(token.data)) ||
            (token.type === "StartTag" && token.name === "html")
          ) {
            this.#inBody(token);
          } else if (token.type === "StartTag" && token.name === "noframes") {
            this.#inHead(token);
          } else {
            this.#treeError("unexpected-token-after-after-frameset");
          }
          break;
      }
    }
  }

  #inHead(token: Token, foster = false): boolean {
    if (token.type === "DOCTYPE") {
      this.#treeError("unexpected-doctype");
    } else if (
      token.type === "Character" &&
      (whitespace(token.data) || this.#current() !== this.#head)
    ) {
      this.#text(token.data);
    } else if (token.type === "Comment") {
      this.#comment(token.data);
    } else if (token.type === "ProcessingInstruction") {
      this.#processingInstruction(token);
    } else if (token.type === "StartTag") {
      if (
        ["base", "basefont", "bgsound", "link", "meta"].includes(token.name)
      ) {
        this.#insert(token, false, foster);
      } else if (token.name === "title") {
        this.#startText(token, "RCDATA state", foster);
      } else if (["style", "noframes"].includes(token.name)) {
        this.#startText(token, "RAWTEXT state", foster);
      } else if (token.name === "script") {
        this.#startText(token, "Script data state", foster);
      } else if (token.name === "noscript") {
        if (this.#scripting) {
          this.#startText(token, "RAWTEXT state", foster);
        } else {
          this.#insert(token, true, foster);
          this.#mode = "in-head-noscript";
        }
      } else if (token.name === "template") {
        const template = this.#insert(token, true, foster);
        const shadowRootMode = template.getAttribute("shadowrootmode");
        const declarativeHost = template.parentElement;
        if (
          this.#allowDeclarativeShadowRoots &&
          !this.#templatesInSanitizerRedirection.has(template) &&
          declarativeHost !== null &&
          (shadowRootMode === "open" || shadowRootMode === "closed")
        ) {
          try {
            const shadowRoot = declarativeHost.attachShadow({
              mode: shadowRootMode,
            });
            setTemplateContents(template, shadowRoot);
            removeNode(template);
          } catch (error) {
            if (!(error instanceof DOMException)) {
              throw error;
            }
          }
        }
        if (templateContents(template) === null) {
          setTemplateContents(template, createDocumentFragment(this.document));
        }
        this.#formatting.push(null);
        if (this.#body !== null) {
          this.#framesetOk = false;
        }
        this.#templateModes.push("in-template");
        this.#mode = "in-template";
      } else if (token.name === "html") {
        this.#inBody(token);
      } else if (token.name === "head") {
        this.#treeError("unexpected-head-start-tag");
      } else {
        this.#close("head");
        this.#mode = "after-head";
        return true;
      }
    } else if (token.type === "EndTag") {
      if (token.name === "head") {
        this.#close("head");
        this.#mode = "after-head";
      } else if (token.name === "template") {
        if (this.#contains("template")) {
          this.#generateImpliedEndTags();
          if (this.#current()?.localName !== "template") {
            this.#treeError("misnested-template-end-tag");
          }
          this.#close("template");
          this.#clearFormatting();
          this.#templateModes.pop();
          this.#resetMode();
        } else {
          this.#treeError("unexpected-template-end-tag");
        }
      } else if (this.#current()?.localName === token.name) {
        this.#treeError("unexpected-end-tag-in-head");
        this.#stack.pop();
      } else if (["body", "html", "br"].includes(token.name)) {
        this.#close("head");
        this.#mode = "after-head";
        return true;
      } else {
        this.#treeError("unexpected-end-tag-in-head");
      }
    } else {
      this.#close("head");
      this.#mode = "after-head";
      return true;
    }
    return false;
  }

  #inHeadNoscript(token: Token): boolean {
    if (token.type === "EndTag" && token.name === "noscript") {
      this.#stack.pop();
      this.#mode = "in-head";
    } else if (
      (token.type === "Character" && whitespace(token.data)) ||
      token.type === "Comment" ||
      token.type === "ProcessingInstruction" ||
      (token.type === "StartTag" &&
        ["basefont", "bgsound", "link", "meta", "noframes", "style"].includes(
          token.name,
        ))
    ) {
      return this.#inHead(token);
    } else if (token.type === "StartTag" && token.name === "html") {
      this.#inBody(token);
    } else if (
      token.type === "DOCTYPE" ||
      (token.type === "StartTag" && ["head", "noscript"].includes(token.name))
    ) {
      this.#treeError("unexpected-token-in-head-noscript");
      return false;
    } else if (
      (token.type === "Character" && !whitespace(token.data)) ||
      token.type === "StartTag" ||
      (token.type === "EndTag" && token.name === "br")
    ) {
      this.#treeError("unexpected-token-in-head-noscript");
      this.#stack.pop();
      this.#mode = "in-head";
      return true;
    } else {
      this.#treeError("unexpected-end-tag-in-head-noscript");
    }
    return false;
  }

  #afterHead(token: Token): boolean {
    if (token.type === "Character" && whitespace(token.data)) {
      this.#text(token.data);
    } else if (token.type === "Comment") {
      this.#comment(token.data);
    } else if (token.type === "ProcessingInstruction") {
      this.#processingInstruction(token);
    } else if (token.type === "StartTag" && token.name === "body") {
      this.#body = this.#insert(token);
      this.#setFramesetNotOk();
      this.#mode = "in-body";
    } else if (token.type === "StartTag" && token.name === "frameset") {
      this.#insert(token);
      this.#mode = "in-frameset";
    } else if (
      token.type === "StartTag" &&
      [
        "base",
        "basefont",
        "bgsound",
        "link",
        "meta",
        "noframes",
        "script",
        "style",
        "template",
        "title",
      ].includes(token.name)
    ) {
      this.#treeError("head-content-after-head");
      if (this.#head !== null) {
        this.#stack.push(this.#head);
      }
      this.#inHead(token);
      if (this.#current() === this.#head) {
        this.#stack.pop();
      }
    } else if (
      token.type === "DOCTYPE" ||
      (token.type === "StartTag" && token.name === "head") ||
      (token.type === "EndTag" &&
        !["body", "html", "br", "template"].includes(token.name))
    ) {
      this.#treeError("unexpected-token-after-head");
    } else {
      this.#ensureBody();
      this.#mode = "in-body";
      return true;
    }
    return false;
  }

  #inBody(token: Token, foster = false): void {
    if (token.type === "Character") {
      for (const character of token.data) {
        if (character === "\0") {
          this.#treeError("null-character-in-body");
        }
      }
      const data = token.data.replaceAll("\0", "");
      if (data === "") {
        return;
      }
      this.#reconstructFormatting(foster);
      this.#text(data, foster);
      if (!whitespace(data)) {
        this.#setFramesetNotOk();
      }
      return;
    }
    if (token.type === "Comment") {
      this.#comment(token.data, foster);
      return;
    }
    if (token.type === "ProcessingInstruction") {
      this.#processingInstruction(token, foster);
      return;
    }
    if (token.type === "DOCTYPE") {
      this.#treeError("unexpected-doctype");
      return;
    }
    if (token.type === "StartTag") {
      const name = token.name;
      if (name === "html") {
        this.#treeError("unexpected-html-start-tag");
        if (!this.#inTemplateContext()) {
          this.#merge(this.document.documentElement, token);
        }
      } else if (name === "head") {
        this.#treeError("unexpected-head-start-tag");
        return;
      } else if (name === "body") {
        this.#treeError("unexpected-body-start-tag");
        if (!this.#inTemplateContext()) {
          this.#merge(this.#body, token);
          this.#setFramesetNotOk();
        }
      } else if (name === "frameset") {
        this.#treeError("unexpected-frameset-start-tag");
        if (!this.#framesetOk || this.#body === null) {
          return;
        }
        removeNode(this.#body);
        while (this.#stack.length > 1) {
          this.#stack.pop();
        }
        this.#insert(token);
        this.#mode = "in-frameset";
      } else if (
        [
          "base",
          "basefont",
          "bgsound",
          "link",
          "meta",
          "noframes",
          "script",
          "style",
          "template",
          "title",
        ].includes(name)
      ) {
        this.#inHead(token, foster);
      } else if (BLOCK.has(name)) {
        this.#closeParagraph();
        this.#insert(token, true, foster);
      } else if (name === "pre" || name === "listing") {
        this.#closeParagraph();
        this.#insert(token, true, foster);
        this.#ignoreNextLineFeed = true;
        this.#setFramesetNotOk();
      } else if (name === "form") {
        if (this.#form !== null && !this.#inTemplateContext()) {
          this.#treeError("nested-form");
          return;
        }
        this.#closeParagraph();
        const form = this.#insert(token, true, foster);
        if (!this.#inTemplateContext()) {
          this.#form = form;
        }
      } else if (name === "button") {
        if (this.#hasInScope("button", "button")) {
          this.#treeError("nested-button");
          this.#generateImpliedEndTags();
          this.#close("button");
        }
        this.#reconstructFormatting(foster);
        this.#insert(token, true, foster);
        this.#setFramesetNotOk();
      } else if (/^h[1-6]$/.test(name)) {
        this.#closeParagraph();
        if (/^h[1-6]$/.test(this.#current()?.localName ?? "")) {
          this.#treeError("nested-heading");
          this.#stack.pop();
        }
        this.#insert(token, true, foster);
      } else if (name === "p") {
        this.#closeParagraph();
        this.#insert(token, true, foster);
      } else if (name === "li") {
        this.#closeListItem("li");
        this.#closeParagraph();
        this.#insert(token, true, foster);
        this.#setFramesetNotOk();
      } else if (name === "dd" || name === "dt") {
        this.#closeListItem(name);
        this.#closeParagraph();
        this.#insert(token, true, foster);
        this.#setFramesetNotOk();
      } else if (FORMATTING.has(name)) {
        if (name === "a") {
          const active = this.#activeFormatting("a");
          if (active !== null) {
            this.#treeError("nested-anchor");
            this.#adopt("a");
            this.#removeFromStack(active);
            this.#removeFromFormatting(active);
          }
        } else if (name === "nobr" && this.#hasInScope("nobr")) {
          this.#treeError("nested-nobr");
          this.#adopt("nobr");
          this.#reconstructFormatting(foster);
        }
        this.#reconstructFormatting(foster);
        const element = this.#insert(token, true, foster);
        this.#pushFormatting(element);
      } else if (["applet", "marquee", "object"].includes(name)) {
        this.#reconstructFormatting(foster);
        this.#insert(token, true, foster);
        this.#formatting.push(null);
        this.#setFramesetNotOk();
      } else if (name === "table") {
        if (!documentIsQuirks(this.document)) {
          this.#closeParagraph();
        }
        this.#insert(token, true, foster);
        this.#setFramesetNotOk();
        this.#mode = "in-table";
      } else if (name === "select") {
        this.#reconstructFormatting(foster);
        this.#insert(token, true, foster);
        this.#setFramesetNotOk();
        this.#mode = this.#inTableContext()
          ? "in-select-in-table"
          : "in-select";
      } else if (name === "option") {
        if (this.#current()?.localName === "option") {
          this.#stack.pop();
        }
        this.#reconstructFormatting(foster);
        this.#insert(token, true, foster);
      } else if (name === "optgroup") {
        if (this.#current()?.localName === "option") {
          this.#stack.pop();
        }
        if (this.#current()?.localName === "optgroup") {
          this.#stack.pop();
        }
        this.#reconstructFormatting(foster);
        this.#insert(token, true, foster);
      } else if (name === "textarea") {
        this.#startText(token, "RCDATA state", foster);
        this.#ignoreNextLineFeed = true;
        this.#setFramesetNotOk();
      } else if (["xmp", "iframe", "noembed"].includes(name)) {
        if (name === "xmp") {
          this.#closeParagraph();
          this.#reconstructFormatting(foster);
        }
        this.#startText(token, "RAWTEXT state", foster);
        this.#setFramesetNotOk();
      } else if (name === "noscript" && this.#scripting) {
        this.#startText(token, "RAWTEXT state", foster);
        this.#setFramesetNotOk();
      } else if (name === "plaintext") {
        this.#closeParagraph();
        this.#insert(token, true, foster);
        this.#tokenizer.setState("PLAINTEXT state", name);
        this.#setFramesetNotOk();
      } else if (name === "hr") {
        this.#closeParagraph();
        this.#insert(token, false, foster);
        this.#setFramesetNotOk();
      } else if (name === "input") {
        this.#reconstructFormatting(foster);
        this.#insert(token, false, foster);
        if ((token.attributes.type ?? "").toLowerCase() !== "hidden") {
          this.#setFramesetNotOk();
        }
      } else if (["param", "source", "track"].includes(name)) {
        this.#insert(token, false, foster);
      } else if (name === "image") {
        this.#treeError("image-start-tag");
        this.#inBody({ ...token, name: "img" }, foster);
      } else if (
        [
          "caption",
          "col",
          "colgroup",
          "frame",
          "tbody",
          "td",
          "tfoot",
          "th",
          "thead",
          "tr",
        ].includes(name)
      ) {
        this.#treeError("unexpected-table-content-start-tag");
        return;
      } else if (name === "svg" || name === "math") {
        this.#reconstructFormatting(foster);
        this.#insert(
          token,
          !token.selfClosing,
          foster,
          name === "svg" ? SVG_NAMESPACE : MATHML_NAMESPACE,
        );
      } else if (["rb", "rtc"].includes(name)) {
        if (this.#hasInScope("ruby")) {
          this.#generateImpliedEndTags();
          if (this.#current()?.localName !== "ruby") {
            this.#treeError("misnested-ruby-content");
          }
        }
        this.#insert(token, true, foster);
      } else if (["rp", "rt"].includes(name)) {
        if (this.#hasInScope("ruby")) {
          this.#generateImpliedEndTags("rtc");
          if (!["rtc", "ruby"].includes(this.#current()?.localName ?? "")) {
            this.#treeError("misnested-ruby-text");
          }
        }
        this.#insert(token, true, foster);
      } else if (VOID.has(name)) {
        this.#reconstructFormatting(foster);
        this.#insert(token, false, foster);
        this.#setFramesetNotOk();
      } else {
        this.#reconstructFormatting(foster);
        this.#insert(token, true, foster);
      }
      return;
    }
    const name = token.name;
    if (name === "template") {
      this.#inHead(token);
    } else if (name === "body") {
      if (this.#hasInScope("body")) {
        if (this.#hasUnexpectedOpenElements()) {
          this.#treeError("unexpected-open-elements-before-body-end-tag");
        }
        this.#mode = "after-body";
      } else {
        this.#treeError("unexpected-body-end-tag");
      }
    } else if (name === "html") {
      if (this.#hasInScope("body")) {
        if (this.#hasUnexpectedOpenElements()) {
          this.#treeError("unexpected-open-elements-before-html-end-tag");
        }
        this.#mode = "after-body";
        this.#process(token);
      } else {
        this.#treeError("unexpected-html-end-tag");
      }
    } else if (
      (BLOCK.has(name) && name !== "p") ||
      name === "pre" ||
      name === "listing"
    ) {
      if (this.#hasInScope(name)) {
        this.#generateImpliedEndTags();
        if (this.#current()?.localName !== name) {
          this.#treeError("misnested-block-end-tag");
        }
        this.#close(name);
      } else {
        this.#treeError("unexpected-block-end-tag");
      }
    } else if (name === "form") {
      if (this.#inTemplateContext()) {
        if (this.#hasInScope("form")) {
          this.#generateImpliedEndTags();
          if (this.#current()?.localName !== "form") {
            this.#treeError("misnested-form-end-tag");
          }
          this.#close("form");
        } else {
          this.#treeError("unexpected-form-end-tag");
        }
      } else if (this.#form !== null) {
        const form = this.#form;
        this.#form = null;
        if (!this.#hasInScope("form")) {
          this.#treeError("unexpected-form-end-tag");
        } else {
          this.#generateImpliedEndTags();
          if (this.#current() !== form) {
            this.#treeError("misnested-form-end-tag");
          }
          this.#removeFromStack(form);
        }
      } else {
        this.#treeError("unexpected-form-end-tag");
      }
    } else if (name === "p") {
      if (!this.#hasInScope("p", "button")) {
        this.#treeError("unexpected-paragraph-end-tag");
        this.#insert(this.#start("p"), true, foster);
      }
      this.#generateImpliedEndTags("p");
      if (this.#current()?.localName !== "p") {
        this.#treeError("misnested-paragraph-end-tag");
      }
      this.#close("p");
    } else if (name === "li") {
      if (this.#hasInScope("li", "list")) {
        this.#generateImpliedEndTags("li");
        if (this.#current()?.localName !== "li") {
          this.#treeError("misnested-list-item-end-tag");
        }
        this.#close("li");
      } else {
        this.#treeError("unexpected-list-item-end-tag");
      }
    } else if (name === "dd" || name === "dt") {
      if (this.#hasInScope(name)) {
        this.#generateImpliedEndTags(name);
        if (this.#current()?.localName !== name) {
          this.#treeError("misnested-description-item-end-tag");
        }
        this.#close(name);
      } else {
        this.#treeError("unexpected-description-item-end-tag");
      }
    } else if (name === "button") {
      if (this.#hasInScope("button", "button")) {
        this.#generateImpliedEndTags();
        if (this.#current()?.localName !== "button") {
          this.#treeError("misnested-button-end-tag");
        }
        this.#close("button");
      } else {
        this.#treeError("unexpected-button-end-tag");
      }
    } else if (/^h[1-6]$/.test(name)) {
      if (this.#hasHeadingInScope()) {
        this.#generateImpliedEndTags();
        if (this.#current()?.localName !== name) {
          this.#treeError("misnested-heading-end-tag");
        }
        this.#closeNearest(["h1", "h2", "h3", "h4", "h5", "h6"]);
      } else {
        this.#treeError("unexpected-heading-end-tag");
      }
    } else if (FORMATTING.has(name)) {
      this.#adopt(name);
    } else if (["applet", "marquee", "object"].includes(name)) {
      if (this.#hasInScope(name)) {
        this.#generateImpliedEndTags();
        if (this.#current()?.localName !== name) {
          this.#treeError("misnested-special-end-tag");
        }
        this.#close(name);
        this.#clearFormatting();
      } else {
        this.#treeError("unexpected-special-end-tag");
      }
    } else if (name === "br") {
      this.#treeError("unexpected-br-end-tag");
      this.#inBody(this.#start("br"), foster);
    } else {
      this.#genericEndTag(name);
    }
  }

  #inTable(token: Token): void {
    if (
      token.type === "Character" &&
      ["table", "tbody", "tfoot", "thead", "tr"].includes(
        this.#current()?.localName ?? "",
      )
    ) {
      this.#pendingTableCharacters = token.data;
      this.#originalMode = this.#mode;
      this.#mode = "in-table-text";
    } else if (token.type === "Comment") {
      this.#comment(token.data);
    } else if (token.type === "ProcessingInstruction") {
      this.#processingInstruction(token);
    } else if (
      token.type === "StartTag" &&
      ["tbody", "thead", "tfoot"].includes(token.name)
    ) {
      this.#clearTo(["table", "template", "html"]);
      this.#insert(token);
      this.#mode = "in-table-body";
    } else if (
      token.type === "StartTag" &&
      ["tr", "td", "th"].includes(token.name)
    ) {
      if (["td", "th"].includes(token.name)) {
        this.#treeError("cell-start-tag-before-row");
      }
      this.#clearTo(["table", "template", "html"]);
      this.#insert(this.#start("tbody"));
      this.#mode = "in-table-body";
      this.#inTableBody(token);
    } else if (token.type === "StartTag" && token.name === "caption") {
      this.#clearTo(["table", "template", "html"]);
      this.#formatting.push(null);
      this.#insert(token);
      this.#mode = "in-caption";
    } else if (token.type === "StartTag" && token.name === "colgroup") {
      this.#clearTo(["table", "template", "html"]);
      this.#insert(token);
      this.#mode = "in-column-group";
    } else if (token.type === "StartTag" && token.name === "col") {
      this.#clearTo(["table", "template", "html"]);
      this.#insert(this.#start("colgroup"));
      this.#mode = "in-column-group";
      this.#inColumnGroup(token);
    } else if (token.type === "StartTag" && token.name === "table") {
      this.#treeError("nested-table");
      if (this.#hasInScope("table", "table")) {
        this.#close("table");
        this.#resetMode();
        this.#process(token);
      }
    } else if (token.type === "EndTag" && token.name === "table") {
      if (this.#hasInScope("table", "table")) {
        this.#close("table");
        this.#resetMode();
      } else {
        this.#treeError("unexpected-table-end-tag");
      }
    } else if (
      (token.type === "StartTag" &&
        ["style", "script", "template"].includes(token.name)) ||
      (token.type === "EndTag" && token.name === "template")
    ) {
      this.#inHead(token);
    } else if (
      token.type === "StartTag" &&
      token.name === "input" &&
      (token.attributes.type ?? "").toLowerCase() === "hidden"
    ) {
      this.#treeError("hidden-input-in-table");
      this.#insert(token, false);
    } else if (token.type === "StartTag" && token.name === "form") {
      this.#treeError("form-in-table");
      if (this.#form !== null && !this.#inTemplateContext()) {
        return;
      }
      const form = this.#insert(token, false);
      if (!this.#inTemplateContext()) {
        this.#form = form;
      }
    } else if (
      token.type === "EndTag" &&
      [
        "body",
        "caption",
        "col",
        "colgroup",
        "html",
        "tbody",
        "td",
        "tfoot",
        "th",
        "thead",
        "tr",
      ].includes(token.name)
    ) {
      this.#treeError("unexpected-end-tag-in-table");
      return;
    } else {
      this.#treeError("unexpected-token-in-table");
      this.#inBody(token, true);
    }
  }

  #inTableText(token: Token): void {
    if (token.type === "Character") {
      this.#pendingTableCharacters += token.data;
      return;
    }
    this.#flushTableCharacters();
    this.#process(token);
  }

  #flushTableCharacters(): void {
    const data = this.#pendingTableCharacters;
    this.#pendingTableCharacters = "";
    this.#mode = this.#originalMode;
    if (whitespace(data)) {
      this.#text(data);
    } else {
      this.#treeError("non-whitespace-in-table");
      this.#inBody({ type: "Character", data }, true);
    }
  }

  #closeCaption(): boolean {
    if (!this.#hasInScope("caption", "table")) {
      this.#treeError("unexpected-caption-end-tag");
      return false;
    }
    this.#generateImpliedEndTags();
    if (this.#current()?.localName !== "caption") {
      this.#treeError("misnested-caption-end-tag");
    }
    this.#close("caption");
    this.#clearFormatting();
    this.#mode = "in-table";
    return true;
  }

  #inCaption(token: Token): void {
    if (token.type === "EndTag" && token.name === "caption") {
      this.#closeCaption();
    } else if (
      (token.type === "StartTag" &&
        [
          "caption",
          "col",
          "colgroup",
          "tbody",
          "td",
          "tfoot",
          "th",
          "thead",
          "tr",
        ].includes(token.name)) ||
      (token.type === "EndTag" && token.name === "table")
    ) {
      if (this.#closeCaption()) {
        this.#process(token);
      }
    } else if (
      token.type === "EndTag" &&
      [
        "body",
        "col",
        "colgroup",
        "html",
        "tbody",
        "td",
        "tfoot",
        "th",
        "thead",
        "tr",
      ].includes(token.name)
    ) {
      this.#treeError("unexpected-end-tag-in-caption");
      return;
    } else {
      this.#inBody(token);
    }
  }

  #inColumnGroup(token: Token): void {
    if (token.type === "Character" && whitespace(token.data)) {
      this.#text(token.data);
    } else if (token.type === "Comment") {
      this.#comment(token.data);
    } else if (token.type === "ProcessingInstruction") {
      this.#processingInstruction(token);
    } else if (token.type === "StartTag" && token.name === "html") {
      this.#inBody(token);
    } else if (token.type === "StartTag" && token.name === "col") {
      this.#insert(token, false);
    } else if (
      (token.type === "StartTag" || token.type === "EndTag") &&
      token.name === "template"
    ) {
      this.#inHead(token);
    } else if (token.type === "EndTag" && token.name === "colgroup") {
      if (this.#current()?.localName === "colgroup") {
        this.#stack.pop();
        this.#mode = "in-table";
      } else {
        this.#treeError("unexpected-colgroup-end-tag");
      }
    } else if (token.type === "EndTag" && token.name === "col") {
      this.#treeError("unexpected-col-end-tag");
      return;
    } else if (this.#current()?.localName === "colgroup") {
      this.#stack.pop();
      this.#mode = "in-table";
      this.#process(token);
    } else {
      this.#treeError("unexpected-token-in-column-group");
    }
  }

  #inTableBody(token: Token): void {
    if (token.type === "StartTag" && token.name === "tr") {
      this.#clearTo(["tbody", "thead", "tfoot", "template", "html"]);
      this.#insert(token);
      this.#mode = "in-row";
    } else if (token.type === "StartTag" && ["td", "th"].includes(token.name)) {
      this.#treeError("cell-start-tag-before-row");
      this.#clearTo(["tbody", "thead", "tfoot", "template", "html"]);
      this.#insert(this.#start("tr"));
      this.#mode = "in-row";
      this.#inRow(token);
    } else if (
      (token.type === "EndTag" && token.name === "table") ||
      (token.type === "StartTag" &&
        ["caption", "col", "colgroup", "tbody", "thead", "tfoot"].includes(
          token.name,
        ))
    ) {
      if (!this.#hasAnyInScope(["tbody", "thead", "tfoot"], "table")) {
        this.#treeError("unexpected-table-body-boundary");
        return;
      }
      this.#closeNearest(["tbody", "thead", "tfoot"]);
      this.#mode = "in-table";
      this.#inTable(token);
    } else if (
      token.type === "EndTag" &&
      ["tbody", "thead", "tfoot"].includes(token.name)
    ) {
      if (this.#hasInScope(token.name, "table")) {
        this.#close(token.name);
        this.#mode = "in-table";
      } else {
        this.#treeError("unexpected-table-body-end-tag");
      }
    } else {
      this.#inTable(token);
    }
  }

  #inRow(token: Token): void {
    if (token.type === "StartTag" && ["td", "th"].includes(token.name)) {
      this.#clearTo(["tr", "template", "html"]);
      this.#insert(token);
      this.#formatting.push(null);
      this.#mode = "in-cell";
    } else if (
      (token.type === "EndTag" && ["tr", "table"].includes(token.name)) ||
      (token.type === "StartTag" &&
        [
          "caption",
          "col",
          "colgroup",
          "tr",
          "tbody",
          "thead",
          "tfoot",
        ].includes(token.name))
    ) {
      if (!this.#hasInScope("tr", "table")) {
        this.#treeError("unexpected-row-boundary");
        return;
      }
      this.#close("tr");
      this.#mode = "in-table-body";
      if (!(token.type === "EndTag" && token.name === "tr")) {
        this.#inTableBody(token);
      }
    } else {
      this.#inTable(token);
    }
  }

  #inCell(token: Token): void {
    if (token.type === "EndTag" && ["td", "th"].includes(token.name)) {
      if (this.#hasInScope(token.name, "table")) {
        this.#generateImpliedEndTags();
        if (this.#current()?.localName !== token.name) {
          this.#treeError("misnested-cell-end-tag");
        }
        this.#close(token.name);
        this.#clearFormatting();
        this.#mode = "in-row";
      } else {
        this.#treeError("unexpected-cell-end-tag");
      }
    } else if (
      (token.type === "EndTag" &&
        ["table", "tr", "tbody", "thead", "tfoot"].includes(token.name)) ||
      (token.type === "StartTag" &&
        [
          "caption",
          "col",
          "colgroup",
          "td",
          "th",
          "tr",
          "tbody",
          "thead",
          "tfoot",
        ].includes(token.name))
    ) {
      if (token.type === "EndTag" && !this.#hasInScope(token.name, "table")) {
        this.#treeError("unexpected-table-end-tag-in-cell");
        return;
      }
      if (!this.#hasAnyInScope(["td", "th"], "table")) {
        return;
      }
      this.#generateImpliedEndTags();
      if (!["td", "th"].includes(this.#current()?.localName ?? "")) {
        this.#treeError("misnested-cell");
      }
      this.#closeNearest(["td", "th"]);
      this.#clearFormatting();
      this.#mode = "in-row";
      this.#process(token);
    } else {
      this.#inBody(token);
    }
  }

  #inSelect(token: Token): void {
    if (token.type === "Character") {
      for (const character of token.data) {
        if (character === "\0") {
          this.#treeError("null-character-in-select");
        }
      }
      this.#reconstructFormatting();
      this.#text(token.data.replaceAll("\0", ""));
    } else if (token.type === "Comment") {
      this.#comment(token.data);
    } else if (token.type === "ProcessingInstruction") {
      this.#processingInstruction(token);
    } else if (token.type === "StartTag" && token.name === "option") {
      if (this.#current()?.localName === "option") {
        this.#stack.pop();
      }
      this.#reconstructFormatting();
      this.#insert(token);
    } else if (token.type === "StartTag" && token.name === "optgroup") {
      if (this.#current()?.localName === "option") {
        this.#stack.pop();
      }
      if (this.#current()?.localName === "optgroup") {
        this.#stack.pop();
      }
      this.#insert(token);
    } else if (token.type === "StartTag" && token.name === "hr") {
      if (this.#current()?.localName === "option") {
        this.#stack.pop();
      }
      if (this.#current()?.localName === "optgroup") {
        this.#stack.pop();
      }
      this.#insert(token, false);
    } else if (token.type === "StartTag" && token.name === "input") {
      this.#treeError("input-in-select");
      if (this.#hasInScope("select")) {
        this.#close("select");
        this.#resetMode();
        this.#process(token);
      }
    } else if (token.type === "StartTag" && token.name === "textarea") {
      this.#treeError("textarea-in-select");
      this.#inBody(token);
    } else if (token.type === "EndTag" && token.name === "optgroup") {
      if (
        this.#current()?.localName === "option" &&
        this.#stack.at(-2)?.localName === "optgroup"
      ) {
        this.#stack.pop();
      }
      if (this.#current()?.localName === "optgroup") {
        this.#stack.pop();
      } else {
        this.#treeError("unexpected-optgroup-end-tag");
      }
    } else if (token.type === "EndTag" && token.name === "option") {
      if (this.#current()?.localName === "option") {
        this.#stack.pop();
      } else {
        this.#treeError("unexpected-option-end-tag");
      }
    } else if (token.type === "EndTag" && token.name === "select") {
      if (this.#hasInScope("select")) {
        this.#generateImpliedEndTags();
        if (this.#current()?.localName !== "select") {
          this.#treeError("misnested-select-end-tag");
        }
        this.#close("select");
        this.#resetMode();
      } else {
        this.#treeError("unexpected-select-end-tag");
      }
    } else if (token.type === "StartTag" && token.name === "select") {
      this.#treeError("nested-select");
      if (this.#hasInScope("select")) {
        this.#close("select");
        this.#resetMode();
      }
    } else if (
      (token.type === "StartTag" || token.type === "EndTag") &&
      token.name === "template"
    ) {
      this.#inHead(token);
    } else if (
      (token.type === "StartTag" || token.type === "EndTag") &&
      [
        "caption",
        "table",
        "tbody",
        "tfoot",
        "thead",
        "tr",
        "td",
        "th",
      ].includes(token.name)
    ) {
      this.#treeError("table-token-in-select");
      return;
    } else if (token.type === "DOCTYPE") {
      this.#treeError("unexpected-doctype");
    } else {
      if (token.type === "EndTag") {
        const selectIndex = this.#stack.findLastIndex(
          (element) => element.localName === "select",
        );
        const targetIndex = this.#stack.findLastIndex(
          (element) =>
            element.namespaceURI === HTML_NAMESPACE &&
            element.localName === token.name,
        );
        if (targetIndex <= selectIndex) {
          this.#treeError("unexpected-end-tag-in-select");
          return;
        }
      }
      this.#inBody(token);
    }
  }

  #inSelectInTable(token: Token): void {
    const tableNames = [
      "caption",
      "table",
      "tbody",
      "tfoot",
      "thead",
      "tr",
      "td",
      "th",
    ];
    if (
      (token.type === "StartTag" && tableNames.includes(token.name)) ||
      (token.type === "EndTag" && tableNames.includes(token.name))
    ) {
      this.#treeError("table-token-in-select-in-table");
      if (this.#hasInScope("select")) {
        this.#close("select");
        this.#resetMode();
        this.#process(token);
      }
      return;
    }
    this.#inSelect(token);
  }

  #replaceTemplateMode(mode: Mode): void {
    if (this.#templateModes.length > 0) {
      this.#templateModes.pop();
    }
    this.#templateModes.push(mode);
    this.#mode = mode;
  }

  #inTemplate(token: Token): void {
    if (
      token.type === "Character" ||
      token.type === "Comment" ||
      token.type === "ProcessingInstruction" ||
      token.type === "DOCTYPE"
    ) {
      this.#inBody(token);
    } else if (
      token.type === "StartTag" &&
      [
        "base",
        "basefont",
        "bgsound",
        "link",
        "meta",
        "noframes",
        "script",
        "style",
        "template",
        "title",
      ].includes(token.name)
    ) {
      this.#inHead(token);
    } else if (token.type === "EndTag" && token.name === "template") {
      this.#inHead(token);
    } else if (
      token.type === "StartTag" &&
      ["caption", "colgroup", "tbody", "tfoot", "thead"].includes(token.name)
    ) {
      this.#replaceTemplateMode("in-table");
      this.#process(token);
    } else if (token.type === "StartTag" && token.name === "col") {
      this.#replaceTemplateMode("in-column-group");
      this.#process(token);
    } else if (token.type === "StartTag" && token.name === "tr") {
      this.#replaceTemplateMode("in-table-body");
      this.#process(token);
    } else if (token.type === "StartTag" && ["td", "th"].includes(token.name)) {
      this.#replaceTemplateMode("in-row");
      this.#process(token);
    } else if (token.type !== "EndTag") {
      this.#replaceTemplateMode("in-body");
      this.#process(token);
    } else {
      this.#treeError("unexpected-end-tag-in-template");
    }
  }

  #inFrameset(token: Token): void {
    if (token.type === "Character" && whitespace(token.data)) {
      this.#text(token.data);
    } else if (token.type === "Comment") {
      this.#comment(token.data);
    } else if (token.type === "ProcessingInstruction") {
      this.#processingInstruction(token);
    } else if (token.type === "StartTag" && token.name === "html") {
      this.#inBody(token);
    } else if (token.type === "StartTag" && token.name === "frameset") {
      this.#insert(token);
    } else if (token.type === "StartTag" && token.name === "frame") {
      this.#insert(token, false);
    } else if (token.type === "StartTag" && token.name === "noframes") {
      this.#inHead(token);
    } else if (token.type === "EndTag" && token.name === "frameset") {
      if (this.#current()?.localName !== "html") {
        this.#stack.pop();
        if (this.#current()?.localName !== "frameset") {
          this.#mode = "after-frameset";
        }
      } else {
        this.#treeError("unexpected-frameset-end-tag");
      }
    } else if (token.type === "DOCTYPE") {
      this.#treeError("unexpected-doctype");
    } else {
      this.#treeError("unexpected-token-in-frameset");
    }
  }

  #afterFrameset(token: Token): void {
    if (token.type === "Character" && whitespace(token.data)) {
      this.#text(token.data);
    } else if (token.type === "Comment") {
      this.#comment(token.data);
    } else if (token.type === "ProcessingInstruction") {
      this.#processingInstruction(token);
    } else if (token.type === "StartTag" && token.name === "html") {
      this.#inBody(token);
    } else if (token.type === "StartTag" && token.name === "noframes") {
      this.#inHead(token);
    } else if (token.type === "EndTag" && token.name === "html") {
      this.#mode = "after-after-frameset";
    } else if (token.type === "DOCTYPE") {
      this.#treeError("unexpected-doctype");
    } else {
      this.#treeError("unexpected-token-after-frameset");
    }
  }

  #foreign(token: Token): boolean {
    const current = this.#adjustedCurrent();
    if (
      current === null ||
      current.namespaceURI === HTML_NAMESPACE ||
      (this.#isHtmlIntegrationPoint(current) &&
        (token.type === "Character" || token.type === "StartTag")) ||
      (this.#isMathMlTextIntegrationPoint(current) &&
        (token.type === "Character" ||
          (token.type === "StartTag" &&
            token.name !== "mglyph" &&
            token.name !== "malignmark"))) ||
      (current.namespaceURI === MATHML_NAMESPACE &&
        current.localName === "annotation-xml" &&
        token.type === "StartTag" &&
        token.name === "svg")
    ) {
      return false;
    }
    if (token.type === "Character") {
      for (const character of token.data) {
        if (character === "\0") {
          this.#treeError("null-character-in-foreign-content");
        }
      }
      const data = token.data.replaceAll("\0", "\ufffd");
      this.#text(data);
      if (!whitespace(token.data.replaceAll("\0", ""))) {
        this.#setFramesetNotOk();
      }
    } else if (token.type === "Comment") {
      this.#comment(token.data);
    } else if (token.type === "ProcessingInstruction") {
      this.#processingInstruction(token);
    } else if (token.type === "StartTag") {
      const htmlBreakout = [
        "b",
        "big",
        "blockquote",
        "body",
        "br",
        "center",
        "code",
        "dd",
        "div",
        "dl",
        "dt",
        "em",
        "embed",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "head",
        "hr",
        "i",
        "img",
        "li",
        "listing",
        "menu",
        "meta",
        "nobr",
        "ol",
        "p",
        "pre",
        "ruby",
        "s",
        "small",
        "span",
        "strong",
        "strike",
        "sub",
        "sup",
        "table",
        "tt",
        "u",
        "ul",
        "var",
      ];
      if (
        htmlBreakout.includes(token.name) ||
        (token.name === "font" &&
          ["color", "face", "size"].some((name) =>
            Object.hasOwn(token.attributes, name),
          ))
      ) {
        this.#treeError("html-start-tag-in-foreign-content");
        let currentElement = this.#current();
        while (
          currentElement !== null &&
          currentElement.namespaceURI !== HTML_NAMESPACE &&
          !this.#isHtmlIntegrationPoint(currentElement) &&
          !this.#isMathMlTextIntegrationPoint(currentElement)
        ) {
          this.#stack.pop();
          currentElement = this.#current();
        }
        return false;
      }
      this.#insert(
        token,
        !token.selfClosing,
        false,
        current.namespaceURI ?? HTML_NAMESPACE,
      );
    } else if (token.type === "EndTag") {
      if (current.localName.toLowerCase() !== token.name) {
        this.#treeError("misnested-end-tag-in-foreign-content");
      }
      if (["p", "br"].includes(token.name)) {
        let currentElement = this.#current();
        while (
          currentElement !== null &&
          currentElement.namespaceURI !== HTML_NAMESPACE &&
          !this.#isHtmlIntegrationPoint(currentElement) &&
          !this.#isMathMlTextIntegrationPoint(currentElement)
        ) {
          this.#stack.pop();
          currentElement = this.#current();
        }
        return false;
      }
      for (let index = this.#stack.length - 1; index >= 0; index -= 1) {
        const node = this.#stack[index];
        if (node === undefined) {
          continue;
        }
        if (node.namespaceURI === HTML_NAMESPACE) {
          return false;
        }
        if (node.localName.toLowerCase() === token.name) {
          this.#stack.length = index;
          return true;
        }
      }
    } else {
      this.#treeError("unexpected-doctype-in-foreign-content");
      return false;
    }
    return true;
  }

  #isHtmlIntegrationPoint(element: Element): boolean {
    if (
      element.namespaceURI === SVG_NAMESPACE &&
      ["foreignObject", "desc", "title"].includes(element.localName)
    ) {
      return true;
    }
    if (
      element.namespaceURI !== MATHML_NAMESPACE ||
      element.localName !== "annotation-xml"
    ) {
      return false;
    }
    const encoding = attributeNodes(element)
      .find((attribute) => attribute.name === "encoding")
      ?.value.toLowerCase();
    return encoding === "text/html" || encoding === "application/xhtml+xml";
  }

  #isMathMlTextIntegrationPoint(element: Element): boolean {
    return (
      element.namespaceURI === MATHML_NAMESPACE &&
      ["mi", "mo", "mn", "ms", "mtext"].includes(element.localName)
    );
  }

  #element(
    token: Extract<Token, { type: "StartTag" }>,
    namespace: string,
  ): Element {
    const localName =
      namespace === SVG_NAMESPACE
        ? (SVG_NAMES[token.name] ?? token.name)
        : token.name;
    const element = createDOMElement(this.document, localName, namespace);
    const attributes = Object.entries(token.attributes).map(
      ([sourceName, value]): AttributeData => {
        const name =
          namespace === SVG_NAMESPACE
            ? (SVG_ATTRIBUTES[sourceName] ?? sourceName)
            : namespace === MATHML_NAMESPACE
              ? (MATHML_ATTRIBUTES[sourceName] ?? sourceName)
              : sourceName;
        const colon = name.indexOf(":");
        if (namespace === HTML_NAMESPACE) {
          return { name, value };
        }
        if (name === "xmlns") {
          return {
            name,
            value,
            localName: name,
            namespaceURI: XMLNS_NAMESPACE,
          };
        }
        if (colon < 0) {
          return { name, value };
        }
        const prefix = name.slice(0, colon);
        const local = name.slice(colon + 1);
        const namespaceURI =
          prefix === "xlink" &&
          [
            "actuate",
            "arcrole",
            "href",
            "role",
            "show",
            "title",
            "type",
          ].includes(local)
            ? XLINK_NAMESPACE
            : prefix === "xml" && ["lang", "space"].includes(local)
              ? XML_NAMESPACE
              : prefix === "xmlns" && local === "xlink"
                ? XMLNS_NAMESPACE
                : null;
        if (namespaceURI === null) {
          return { name, value };
        }
        return { name, value, prefix, localName: local, namespaceURI };
      },
    );
    setAttributes(
      element,
      attributes.filter((attribute) =>
        this.#sanitizerConfig === null
          ? true
          : sanitizerAllowsAttribute(
              this.#sanitizerConfig,
              attribute.localName ?? attribute.name,
              attribute.namespaceURI ?? null,
              attribute.value,
              localName,
              namespace,
            ),
      ),
    );
    this.#sourceAttributes.set(element, attributes);
    return element;
  }

  #insert(
    token: Extract<Token, { type: "StartTag" }>,
    push = true,
    foster = false,
    namespace = HTML_NAMESPACE,
  ): Element {
    if (namespace === HTML_NAMESPACE && push && token.selfClosing) {
      this.#treeError("self-closing-non-void-html-element");
    }
    const element = this.#element(token, namespace);
    const current = this.#current();
    const redirectedInsertion =
      current !== null && this.#sanitizerRedirections.has(current);
    const action =
      this.#sanitizerConfig === null
        ? "keep"
        : sanitizerAction(
            this.#sanitizerConfig,
            element.localName,
            element.namespaceURI,
          );
    this.#sanitizerActions.set(element, action);
    if (namespace === HTML_NAMESPACE && token.name === "script") {
      const implementation = nodeImplementation(element);
      if (this.#context === null) {
        implementation.scriptAlreadyStarted = true;
        implementation.scriptForceAsync = false;
      } else {
        implementation.scriptAlreadyStarted =
          this.#streamingInsertion !== null || !this.#runScripts;
        implementation.scriptForceAsync = !element.hasAttribute("async");
      }
    }
    if (action === "keep") {
      this.#insertNode(element, foster);
      if (redirectedInsertion && element.localName === "template") {
        this.#templatesInSanitizerRedirection.add(element);
      }
      this.#onElement?.(element);
    } else if (action === "replace" && element.localName !== "template") {
      this.#sanitizerRedirections.set(
        element,
        foster && this.#shouldFosterParent()
          ? this.#fosterParentLocation()
          : this.#currentInsertionLocation(),
      );
    }
    if (push) {
      this.#stack.push(element);
    }
    return element;
  }

  #insertNode(node: Node, foster: boolean): void {
    if (foster && this.#shouldFosterParent()) {
      this.#insertAtFosterParent(node);
      return;
    }
    const location = this.#currentInsertionLocation();
    if (!this.#isValidInsertionLocation(location)) {
      return;
    }
    this.#insertAtLocation(location, node);
  }

  #insertAtLocation(
    location: { readonly parent: Node; readonly reference: Node | null },
    node: Node,
  ): void {
    if (node instanceof Element) {
      const action = this.#sanitizerActions.get(node);
      if (action === "remove") {
        return;
      }
      if (action === "replace") {
        this.#sanitizerRedirections.set(node, location);
        return;
      }
    }
    if (this.#streamingInsertion !== null) {
      location.parent.insertBefore(node, location.reference);
    } else if (location.reference === null) {
      appendNode(location.parent, node);
    } else {
      insertNodeBefore(location.parent, node, location.reference);
    }
  }

  #currentInsertionLocation(): {
    readonly parent: Node;
    readonly reference: Node | null;
  } {
    const current = this.#current();
    if (current === null) {
      return { parent: this.document, reference: null };
    }
    const redirected = this.#sanitizerRedirections.get(current);
    if (redirected !== undefined) {
      return redirected;
    }
    if (current === this.#streamingRoot && this.#streamingInsertion !== null) {
      return this.#streamingInsertion;
    }
    if (current.localName === "template") {
      return { parent: templateContents(current) ?? current, reference: null };
    }
    return { parent: current, reference: null };
  }

  #isValidInsertionLocation(location: {
    readonly parent: Node;
    readonly reference: Node | null;
  }): boolean {
    const streamingInsertion = this.#streamingInsertion;
    if (
      streamingInsertion !== null &&
      streamingInsertion.reference !== null &&
      streamingInsertion.reference.parentNode !== streamingInsertion.parent
    ) {
      return false;
    }
    return (
      location.reference === null ||
      location.reference.parentNode === location.parent
    );
  }

  #fosterParentLocation(): { parent: Node; reference: Node | null } {
    const templateIndex = this.#stack.findLastIndex(
      (element) => element.localName === "template",
    );
    const tableIndex = this.#stack.findLastIndex(
      (element) => element.localName === "table",
    );
    if (templateIndex > tableIndex) {
      const template = this.#stack[templateIndex];
      if (template !== undefined) {
        const contents = templateContents(template);
        if (contents !== null) {
          return { parent: contents, reference: null };
        }
      }
    }
    if (tableIndex >= 0) {
      const table = this.#stack[tableIndex];
      if (table?.parentNode !== null && table?.parentNode !== undefined) {
        return { parent: table.parentNode, reference: table };
      }
      const beforeTable = this.#stack[tableIndex - 1];
      if (beforeTable !== undefined) {
        if (
          beforeTable === this.#streamingRoot &&
          this.#streamingInsertion !== null
        ) {
          return this.#streamingInsertion;
        }
        return { parent: beforeTable, reference: null };
      }
    }
    const first = this.#stack[0];
    if (first !== undefined) {
      if (first === this.#streamingRoot && this.#streamingInsertion !== null) {
        return this.#streamingInsertion;
      }
      return { parent: first, reference: null };
    }
    return { parent: this.document, reference: null };
  }

  #shouldFosterParent(): boolean {
    const current = this.#current();
    return (
      current?.namespaceURI === HTML_NAMESPACE &&
      ["table", "tbody", "tfoot", "thead", "tr"].includes(current.localName)
    );
  }

  #insertAtFosterParent(node: Node): void {
    const location = this.#fosterParentLocation();
    if (!this.#isValidInsertionLocation(location)) {
      return;
    }
    this.#insertAtLocation(location, node);
  }

  #text(data: string, foster = false): void {
    if (data === "") {
      return;
    }
    if (foster && this.#shouldFosterParent()) {
      const location = this.#fosterParentLocation();
      if (!this.#isValidInsertionLocation(location)) {
        return;
      }
      const previous =
        location.reference === null
          ? location.parent.lastChild
          : location.reference.previousSibling;
      if (previous instanceof Text) {
        appendCharacterData(previous, data);
        return;
      }
      const text = createText(this.document, data);
      this.#insertAtLocation(location, text);
      return;
    }
    const location = this.#currentInsertionLocation();
    if (!this.#isValidInsertionLocation(location)) {
      return;
    }
    const previous =
      location.reference === null
        ? location.parent.lastChild
        : location.reference.previousSibling;
    if (previous instanceof Text) {
      appendCharacterData(previous, data);
      return;
    }
    const text = createText(this.document, data);
    this.#insertAtLocation(location, text);
  }

  #comment(data: string, foster = false): void {
    if (
      this.#sanitizerConfig !== null &&
      !sanitizerAllowsComments(this.#sanitizerConfig)
    ) {
      return;
    }
    this.#insertNode(createComment(this.document, data), foster);
  }

  #processingInstruction(
    token: Extract<Token, { type: "ProcessingInstruction" }>,
    foster = false,
  ): void {
    if (
      this.#sanitizerConfig !== null &&
      !sanitizerAllowsPI(this.#sanitizerConfig, token.target)
    ) {
      return;
    }
    this.#insertNode(
      createProcessingInstruction(this.document, token.target, token.data),
      foster,
    );
  }

  #start(name: string): Extract<Token, { type: "StartTag" }> {
    return { type: "StartTag", name, attributes: {}, selfClosing: false };
  }

  #setFramesetNotOk(): void {
    if (!this.#inTemplateContext()) {
      this.#framesetOk = false;
    }
  }

  #inTemplateContext(): boolean {
    return (
      this.#context?.localName === "template" || this.#contains("template")
    );
  }

  #doctypeCausesQuirks(token: Extract<Token, { type: "DOCTYPE" }>): boolean {
    if (token.forceQuirks || token.name !== "html") {
      return true;
    }
    const publicId = token.publicId?.toLowerCase() ?? "";
    const systemId = token.systemId?.toLowerCase() ?? "";
    if (
      publicId === "html" ||
      systemId === "http://www.ibm.com/data/dtd/v11/ibmxhtml1-transitional.dtd"
    ) {
      return true;
    }
    return [
      "+//silmaril//dtd html pro v0r11 19970101//",
      "-//advasoft ltd//dtd html 3.0 aswedit + extensions//",
      "-//as//dtd html 3.0 aswedit + extensions//",
      "-//ietf//dtd html 2.0",
      "-//ietf//dtd html 3.0",
      "-//metrius//dtd metrius presentational//",
      "-//microsoft//dtd internet explorer 2.0 html",
      "-//microsoft//dtd internet explorer 3.0 html",
      "-//netscape comm. corp.//dtd html//",
      "-//o'reilly and associates//dtd html",
      "-//softquad software//dtd hotmetal pro 6.0::19990601::extensions to html 4.0//",
      "-//spyglass//dtd html 2.0 extended//",
      "-//sq//dtd html 2.0 hotmetal + extensions//",
      "-//sun microsystems corp.//dtd hotjava html//",
      "-//w3c//dtd html 3",
      "-//w3o//dtd w3 html strict 3.0//",
      "-//webtechs//dtd mozilla html 2.0//",
      "-//webtechs//dtd w3 html//",
    ].some((prefix) => publicId.startsWith(prefix));
  }

  #current(): Element | null {
    return this.#stack.at(-1) ?? null;
  }

  #contains(name: string): boolean {
    return this.#stack.some((element) => element.localName === name);
  }

  #close(name: string): void {
    const index = this.#stack.findLastIndex(
      (element) =>
        element.localName === name && element.namespaceURI === HTML_NAMESPACE,
    );
    if (index >= 0) {
      this.#stack.length = index;
    }
  }

  #closeNearest(names: string[]): void {
    for (let index = this.#stack.length - 1; index >= 0; index -= 1) {
      if (
        this.#stack[index]?.namespaceURI === HTML_NAMESPACE &&
        names.includes(this.#stack[index]?.localName ?? "")
      ) {
        this.#stack.length = index;
        return;
      }
    }
  }

  #closeParagraph(): void {
    if (this.#hasInScope("p", "button")) {
      this.#generateImpliedEndTags("p");
      if (this.#current()?.localName !== "p") {
        this.#treeError("misnested-paragraph");
      }
      this.#close("p");
    }
  }

  #hasUnexpectedOpenElements(): boolean {
    const allowed = new Set([
      "dd",
      "dt",
      "li",
      "optgroup",
      "option",
      "p",
      "rb",
      "rp",
      "rt",
      "rtc",
      "tbody",
      "td",
      "tfoot",
      "th",
      "thead",
      "tr",
      "body",
      "html",
    ]);
    return this.#stack.some(
      (element) =>
        element.namespaceURI !== HTML_NAMESPACE ||
        !allowed.has(element.localName),
    );
  }

  #isSpecial(element: Element): boolean {
    if (element.namespaceURI === HTML_NAMESPACE) {
      return SPECIAL_HTML.has(element.localName);
    }
    if (element.namespaceURI === MATHML_NAMESPACE) {
      return ["annotation-xml", "mi", "mo", "mn", "ms", "mtext"].includes(
        element.localName,
      );
    }
    return (
      element.namespaceURI === SVG_NAMESPACE &&
      ["foreignObject", "desc", "title"].includes(element.localName)
    );
  }

  #hasInScope(
    name: string,
    type: "default" | "button" | "list" | "table" | "select" = "default",
  ): boolean {
    for (let index = this.#stack.length - 1; index >= 0; index -= 1) {
      const element = this.#stack[index];
      if (element === undefined) {
        continue;
      }
      if (
        element.localName === name &&
        element.namespaceURI === HTML_NAMESPACE
      ) {
        return true;
      }
      if (type === "select") {
        if (
          element.namespaceURI !== HTML_NAMESPACE ||
          !["option", "optgroup"].includes(element.localName)
        ) {
          return false;
        }
        continue;
      }
      if (type === "table") {
        if (
          element.namespaceURI === HTML_NAMESPACE &&
          ["html", "table", "template"].includes(element.localName)
        ) {
          return false;
        }
        continue;
      }
      if (
        element.namespaceURI === HTML_NAMESPACE &&
        [
          "applet",
          "caption",
          "html",
          "table",
          "td",
          "th",
          "marquee",
          "object",
          "template",
          ...(type === "button" ? ["button"] : []),
          ...(type === "list" ? ["ol", "ul"] : []),
        ].includes(element.localName)
      ) {
        return false;
      }
      if (
        element.namespaceURI === MATHML_NAMESPACE &&
        ["annotation-xml", "mi", "mo", "mn", "ms", "mtext"].includes(
          element.localName,
        )
      ) {
        return false;
      }
      if (
        element.namespaceURI === SVG_NAMESPACE &&
        ["foreignObject", "desc", "title"].includes(element.localName)
      ) {
        return false;
      }
    }
    return false;
  }

  #hasHeadingInScope(): boolean {
    return ["h1", "h2", "h3", "h4", "h5", "h6"].some((name) =>
      this.#hasInScope(name),
    );
  }

  #hasAnyInScope(
    names: readonly string[],
    type: "default" | "button" | "list" | "table" | "select" = "default",
  ): boolean {
    return names.some((name) => this.#hasInScope(name, type));
  }

  #generateImpliedEndTags(except?: string): void {
    while (
      this.#current() !== null &&
      IMPLIED_END.has(this.#current()?.localName ?? "") &&
      this.#current()?.localName !== except
    ) {
      this.#stack.pop();
    }
  }

  #closeListItem(name: "li" | "dd" | "dt"): void {
    for (let index = this.#stack.length - 1; index >= 0; index -= 1) {
      const element = this.#stack[index];
      if (element === undefined) {
        continue;
      }
      const matches =
        name === "li"
          ? element.localName === "li"
          : element.localName === "dd" || element.localName === "dt";
      if (matches) {
        this.#generateImpliedEndTags(element.localName);
        if (this.#current() !== element) {
          this.#treeError("misnested-list-item");
        }
        this.#stack.length = index;
        return;
      }
      if (
        this.#isSpecial(element) &&
        !["address", "div", "p"].includes(element.localName)
      ) {
        return;
      }
    }
  }

  #genericEndTag(name: string): void {
    for (let index = this.#stack.length - 1; index >= 0; index -= 1) {
      const element = this.#stack[index];
      if (element === undefined) {
        continue;
      }
      if (element.localName === name) {
        this.#generateImpliedEndTags(name);
        if (this.#current() !== element) {
          this.#treeError("misnested-end-tag");
        }
        this.#stack.length = index;
        return;
      }
      if (this.#isSpecial(element)) {
        this.#treeError("unexpected-end-tag");
        return;
      }
    }
  }

  #inTableContext(): boolean {
    for (let index = this.#stack.length - 1; index >= 0; index -= 1) {
      const name = this.#stack[index]?.localName;
      if (name === "template") {
        return false;
      }
      if (name === "table") {
        return true;
      }
    }
    return false;
  }

  #startText(
    token: Extract<Token, { type: "StartTag" }>,
    state: "RCDATA state" | "RAWTEXT state" | "Script data state",
    foster = false,
  ): void {
    this.#insert(token, true, foster);
    this.#tokenizer.setState(state, token.name);
    this.#originalMode = this.#mode;
    this.#mode = "text";
  }

  #finishTextElement(): void {
    const element = this.#stack.pop();
    this.#mode = this.#originalMode;
    if (this.#mode === "after-head" && this.#current() === this.#head) {
      this.#stack.pop();
    }
    if (
      element?.namespaceURI !== HTML_NAMESPACE ||
      element.localName !== "script"
    ) {
      return;
    }
    const implementation = nodeImplementation(element);
    if (this.#context === null) {
      implementation.scriptAlreadyStarted = false;
      const pendingScript = this.#onScript?.(element);
      if (pendingScript !== undefined) {
        this.#pendingScript = pendingScript;
      }
    } else if (this.#streamingInsertion !== null && this.#runScripts) {
      implementation.scriptAlreadyStarted = false;
      const document = element.ownerDocument;
      if (document !== null) {
        documentImplementation(document).childrenChangedSteps?.(element);
      }
      implementation.scriptAlreadyStarted = true;
    }
  }

  #clearTo(names: string[]): void {
    let current = this.#current();
    while (current !== null && !names.includes(current.localName)) {
      this.#stack.pop();
      current = this.#current();
    }
  }

  #merge(
    element: Element | null,
    token: Extract<Token, { type: "StartTag" }>,
  ): void {
    if (element === null) {
      return;
    }
    const existing = new Set(
      attributeNodes(element).map((attribute) => attribute.name),
    );
    setAttributes(
      element,
      Object.entries(token.attributes)
        .filter(([name]) => !existing.has(name))
        .map(([name, value]) => ({ name, value })),
    );
  }

  #activeFormatting(name: string): Element | null {
    for (let index = this.#formatting.length - 1; index >= 0; index -= 1) {
      const element = this.#formatting[index];
      if (element === null) {
        return null;
      }
      if (element?.localName === name) {
        return element;
      }
    }
    return null;
  }

  #pushFormatting(element: Element): void {
    const elementAttributes = this.#formattingAttributes(element);
    const matching: number[] = [];
    for (let index = this.#formatting.length - 1; index >= 0; index -= 1) {
      const candidate = this.#formatting[index];
      if (candidate === null) {
        break;
      }
      if (candidate === undefined) {
        continue;
      }
      if (
        candidate.localName === element.localName &&
        candidate.namespaceURI === element.namespaceURI &&
        this.#formattingAttributes(candidate).length ===
          elementAttributes.length &&
        this.#formattingAttributes(candidate).every((attribute) =>
          elementAttributes.some(
            (other) =>
              (other.namespaceURI ?? null) ===
                (attribute.namespaceURI ?? null) &&
              (other.localName ?? other.name) ===
                (attribute.localName ?? attribute.name) &&
              other.value === attribute.value,
          ),
        )
      ) {
        matching.push(index);
      }
    }
    if (matching.length >= 3) {
      const earliest = matching.at(-1);
      if (earliest !== undefined) {
        this.#formatting.splice(earliest, 1);
      }
    }
    this.#formatting.push(element);
  }

  #formattingAttributes(element: Element): readonly AttributeData[] {
    return (
      this.#sourceAttributes.get(element) ??
      attributeNodes(element).map((attribute) => ({
        name: attribute.name,
        value: attribute.value,
        localName: attribute.localName,
        namespaceURI: attribute.namespaceURI,
        prefix: attribute.prefix,
      }))
    );
  }

  #removeFromStack(element: Element): void {
    const index = this.#stack.indexOf(element);
    if (index >= 0) {
      this.#stack.splice(index, 1);
    }
  }

  #removeFromFormatting(element: Element): void {
    const index = this.#formatting.indexOf(element);
    if (index >= 0) {
      this.#formatting.splice(index, 1);
    }
  }

  #cloneElement(element: Element): Element {
    const clone = cloneNodeIntoDocument(element, this.document, false);
    if (!(clone instanceof Element)) {
      throw new TypeError("Element clone has an unexpected interface");
    }
    const sourceAttributes = this.#sourceAttributes.get(element);
    if (sourceAttributes !== undefined) {
      this.#sourceAttributes.set(clone, sourceAttributes);
    }
    const action = this.#sanitizerActions.get(element);
    if (action !== undefined) {
      this.#sanitizerActions.set(clone, action);
    }
    return clone;
  }

  #appendToElement(parent: Element, node: Node): void {
    const redirected = this.#sanitizerRedirections.get(parent);
    const target =
      redirected?.parent ??
      (parent.localName === "template"
        ? (templateContents(parent) ?? parent)
        : parent);
    const reference = redirected?.reference ?? null;
    this.#insertAtLocation({ parent: target, reference }, node);
  }

  #adopt(name: string): void {
    for (let outer = 0; outer < 8; outer += 1) {
      const formattingElement = this.#activeFormatting(name);
      if (formattingElement === null) {
        this.#genericEndTag(name);
        return;
      }
      const formattingStackIndex = this.#stack.indexOf(formattingElement);
      if (formattingStackIndex < 0) {
        this.#treeError("formatting-element-not-open");
        this.#removeFromFormatting(formattingElement);
        return;
      }
      if (!this.#hasInScope(formattingElement.localName)) {
        this.#treeError("formatting-element-not-in-scope");
        return;
      }
      if (formattingElement !== this.#current()) {
        this.#treeError("misnested-formatting-end-tag");
      }

      let furthestBlock: Element | null = null;
      for (
        let index = formattingStackIndex + 1;
        index < this.#stack.length;
        index += 1
      ) {
        const candidate = this.#stack[index];
        if (candidate !== undefined && this.#isSpecial(candidate)) {
          furthestBlock = candidate;
          break;
        }
      }
      if (furthestBlock === null) {
        this.#stack.length = formattingStackIndex;
        this.#removeFromFormatting(formattingElement);
        return;
      }

      const commonAncestor = this.#stack[formattingStackIndex - 1];
      if (commonAncestor === undefined) {
        return;
      }
      let bookmark = this.#formatting.indexOf(formattingElement);
      let lastNode: Element = furthestBlock;
      let nodeIndex = this.#stack.indexOf(furthestBlock);

      for (let inner = 1; ; inner += 1) {
        nodeIndex -= 1;
        const node = this.#stack[nodeIndex];
        if (node === undefined || node === formattingElement) {
          break;
        }
        const formattingIndex = this.#formatting.indexOf(node);
        if (inner > 3 && formattingIndex >= 0) {
          this.#formatting.splice(formattingIndex, 1);
        }
        if (!this.#formatting.includes(node)) {
          this.#stack.splice(nodeIndex, 1);
          continue;
        }

        const replacement = this.#cloneElement(node);
        const activeIndex = this.#formatting.indexOf(node);
        if (activeIndex >= 0) {
          this.#formatting[activeIndex] = replacement;
        }
        this.#stack[nodeIndex] = replacement;
        if (lastNode === furthestBlock) {
          bookmark = activeIndex + 1;
        }
        this.#appendToElement(replacement, lastNode);
        lastNode = replacement;
      }

      if (
        ["table", "tbody", "tfoot", "thead", "tr"].includes(
          commonAncestor.localName,
        )
      ) {
        this.#insertAtFosterParent(lastNode);
      } else {
        this.#appendToElement(commonAncestor, lastNode);
      }

      const replacement = this.#cloneElement(formattingElement);
      for (const child of childNodes(furthestBlock)) {
        this.#appendToElement(replacement, child);
      }
      this.#appendToElement(furthestBlock, replacement);

      const oldFormattingIndex = this.#formatting.indexOf(formattingElement);
      if (oldFormattingIndex >= 0) {
        this.#formatting.splice(oldFormattingIndex, 1);
        if (oldFormattingIndex < bookmark) {
          bookmark -= 1;
        }
      }
      this.#formatting.splice(bookmark, 0, replacement);
      this.#removeFromStack(formattingElement);
      const furthestIndex = this.#stack.indexOf(furthestBlock);
      this.#stack.splice(furthestIndex + 1, 0, replacement);
    }
  }

  #reconstructFormatting(foster = false): void {
    let index = this.#formatting.length - 1;
    const last = this.#formatting[index];
    if (last === undefined || last === null || this.#stack.includes(last)) {
      return;
    }
    while (index > 0) {
      const item = this.#formatting[index - 1];
      if (item === null || item === undefined || this.#stack.includes(item)) {
        break;
      }
      index -= 1;
    }
    for (; index < this.#formatting.length; index += 1) {
      const old = this.#formatting[index];
      if (old === null || old === undefined) {
        continue;
      }
      const clone = this.#cloneElement(old);
      this.#insertNode(clone, foster);
      this.#stack.push(clone);
      this.#formatting[index] = clone;
    }
  }

  #clearFormatting(): void {
    while (this.#formatting.length > 0 && this.#formatting.pop() !== null) {
      // Pop through the most recent marker.
    }
  }

  #closeTemplate(): void {
    this.#close("template");
    this.#clearFormatting();
    this.#resetMode();
  }

  #resetMode(): void {
    for (let index = this.#stack.length - 1; index >= 0; index -= 1) {
      const name = this.#stack[index]?.localName;
      if (name === "select") {
        this.#mode = this.#stack
          .slice(0, index)
          .some((element) => element.localName === "table")
          ? "in-select-in-table"
          : "in-select";
      } else if (name === "td" || name === "th") {
        this.#mode = "in-cell";
      } else if (name === "tr") {
        this.#mode = "in-row";
      } else if (["tbody", "thead", "tfoot"].includes(name ?? "")) {
        this.#mode = "in-table-body";
      } else if (name === "table") {
        this.#mode = "in-table";
      } else if (name === "template") {
        this.#mode = this.#templateModes.at(-1) ?? "in-template";
      } else if (name === "head") {
        this.#mode = "in-head";
      } else if (name === "body") {
        this.#mode = "in-body";
      } else if (name === "frameset") {
        this.#mode = "in-frameset";
      } else {
        continue;
      }
      return;
    }
    this.#mode = this.#context === null ? "in-body" : this.#modeForContext();
  }

  #ensureBody(): void {
    if (this.#body === null) {
      this.#body = this.#insert(this.#start("body"));
    }
  }

  #cloneSubtree(node: Node): Node {
    return cloneNodeIntoDocument(node, this.document, true);
  }

  #syncSelectedContent(): void {
    for (const select of this.document.querySelectorAll("select")) {
      const selectedContent = select.querySelector("selectedcontent");
      if (selectedContent === null) {
        continue;
      }
      const options = [...select.querySelectorAll("option")];
      const selected =
        options.findLast((option) => option.hasAttribute("selected")) ??
        options[0];
      if (selected === undefined) {
        continue;
      }
      while (selectedContent.firstChild !== null) {
        removeNode(selectedContent.firstChild);
      }
      for (const child of selected.childNodes) {
        appendNode(selectedContent, this.#cloneSubtree(child));
      }
    }
  }

  #finish(): void {
    if (this.document.documentElement === null) {
      const html = createDOMElement(this.document, "html", HTML_NAMESPACE);
      appendNode(this.document, html);
      this.#stack.push(html);
    }
    if (this.document.head === null) {
      const head = createDOMElement(this.document, "head", HTML_NAMESPACE);
      const documentElement = this.document.documentElement;
      const body = (
        documentElement === null ? [] : childNodes(documentElement)
      ).find((node) => node instanceof Element && node.localName === "body");
      if (documentElement === null) {
        throw new TypeError("Document has no document element");
      }
      if (body === undefined) {
        appendNode(documentElement, head);
      } else {
        insertNodeBefore(documentElement, head, body);
      }
    }
    if (this.document.body === null) {
      appendToDocumentElement(
        this.document,
        createDOMElement(this.document, "body", HTML_NAMESPACE),
      );
    }
    this.#syncSelectedContent();
  }
}

function appendToDocumentElement(document: Document, node: Node): void {
  const documentElement = document.documentElement;
  if (documentElement !== null) {
    appendNode(documentElement, node);
  }
}

export function parseHTML(
  input: string,
  scriptingMode: ScriptingMode = "disabled",
  allowDeclarativeShadowRoots = false,
  sanitizerConfig: CanonicalSanitizerConfig | null = null,
): Document {
  return new TreeBuilder(input, {
    allowDeclarativeShadowRoots,
    ...(sanitizerConfig === null ? {} : { sanitizerConfig }),
    scriptingMode,
  }).parse();
}

export function parseHTMLIntoDocument(
  input: string,
  document: Document,
  onScript: (element: Element) => void,
): Document {
  while (document.firstChild !== null) {
    removeNode(document.firstChild);
  }
  return new TreeBuilder(input, {
    document,
    onScript,
    scriptingMode: documentImplementation(document).scriptingMode,
  }).parse();
}

export async function parseHTMLIntoDocumentAsync(
  input: string,
  document: Document,
  onScript: (element: Element) => Promise<void> | void,
  onElement?: (element: Element) => void,
): Promise<Document> {
  const session = startHTMLDocumentParserSession(document, {
    ...(onElement === undefined ? {} : { onElement }),
    onScript,
  });
  session.write(input);
  session.close();
  return session.finished;
}

export function createHTMLDocumentParserSession(
  document: Document,
  options: HTMLDocumentParserSessionOptions = {},
): HTMLDocumentParserSession {
  documentImplementation(document).parserOpenedSteps?.();
  while (document.firstChild !== null) {
    removeNode(document.firstChild);
  }
  const implementation = documentImplementation(document);
  const builder = new TreeBuilder("", {
    document,
    ...(options.onElement === undefined
      ? {}
      : { onElement: options.onElement }),
    ...(options.onScript === undefined ? {} : { onScript: options.onScript }),
    scriptingMode: implementation.scriptingMode,
    streamingDocument: true,
  });
  const finished = builder.documentStreamingFinished.then(async (result) => {
    if (builder.documentStreamingState === "closed") {
      await options.onClosed?.();
    }
    return result;
  });
  return {
    get state() {
      return builder.documentStreamingState;
    },
    finished,
    write(input) {
      builder.writeStreamingDocument(input);
    },
    close() {
      builder.closeStreamingDocument();
    },
    abort() {
      builder.abortStreamingDocument();
    },
  };
}

export function parseHTMLFragment(
  input: string,
  context: HTMLFragmentContext | Element,
  scriptingMode: ScriptingMode = "disabled",
): DocumentFragment {
  return new TreeBuilder(input, { context, scriptingMode }).parseFragment();
}

export interface HTMLStreamingParserSession {
  write(input: string): void;
  close(): void;
  abort(): void;
}

export function createHTMLStreamingParser(
  target: Node,
  context: Element,
  reference: Node | null,
  options: FragmentParseOptions = {},
): HTMLStreamingParserSession {
  const builder = new TreeBuilder("", {
    allowDeclarativeShadowRoots: options.allowDeclarativeShadowRoots ?? false,
    context,
    runScripts: options.runScripts ?? false,
    ...(options.sanitizerConfig === undefined
      ? {}
      : { sanitizerConfig: options.sanitizerConfig }),
    scriptingMode:
      context.ownerDocument === null
        ? "disabled"
        : documentImplementation(context.ownerDocument).scriptingMode,
    streamingInsertion: { parent: target, reference },
  });
  return {
    write(input) {
      builder.writeStreamingFragment(input);
    },
    close() {
      builder.closeStreamingFragment();
    },
    abort() {
      builder.abortStreamingFragment();
    },
  };
}

setHTMLParsingAlgorithms(
  htmlFragmentParser,
  (input, allow, sanitizerConfig) =>
    parseHTML(input, "disabled", allow, sanitizerConfig),
  createHTMLDocumentParserSession,
  createHTMLStreamingParser,
);
