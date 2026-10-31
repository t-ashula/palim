import type { AttributeData, Node } from "../dom.js";
import {
  Comment,
  Document,
  DocumentFragment,
  DocumentType,
  Element,
  ProcessingInstruction,
  Text,
} from "../dom.js";
import {
  HTML_NAMESPACE,
  MATHML_NAMESPACE,
  SVG_NAMESPACE,
  XLINK_NAMESPACE,
  XML_NAMESPACE,
  XMLNS_NAMESPACE,
} from "../namespaces.js";
import { createHTMLElement } from "../html-elements.js";
import type { Token } from "./tokenizer.js";
import { HTMLTokenizer } from "./tokenizer.js";

type Mode =
  | "initial"
  | "before-html"
  | "before-head"
  | "in-head"
  | "after-head"
  | "in-body"
  | "in-table"
  | "in-table-body"
  | "in-row"
  | "in-cell"
  | "in-select"
  | "after-body";

const VOID = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
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
  gradienttransform: "gradientTransform",
  gradientunits: "gradientUnits",
  kernelmatrix: "kernelMatrix",
  kernelunitlength: "kernelUnitLength",
  keypoints: "keyPoints",
  keysplines: "keySplines",
  keytimes: "keyTimes",
  lengthadjust: "lengthAdjust",
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
  readonly document = new Document();
  readonly #tokenizer: HTMLTokenizer;
  readonly #stack: Element[] = [];
  readonly #formatting: (Element | null)[] = [];
  #mode: Mode = "initial";
  #head: Element | null = null;
  #body: Element | null = null;

  constructor(input: string) {
    this.#tokenizer = new HTMLTokenizer(input);
  }

  parse(): Document {
    for (;;) {
      this.#tokenizer.setAllowCdata(
        this.#current() !== null &&
          this.#current()?.namespaceURI !== HTML_NAMESPACE,
      );
      const token = this.#tokenizer.nextToken();
      if (token === null) {
        break;
      }
      this.#process(token);
    }
    this.#finish();
    return this.document;
  }

  #process(token: Token): void {
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
            this.document._append(new Comment(this.document, token.data));
          } else if (token.type === "ProcessingInstruction") {
            this.document._append(
              new ProcessingInstruction(
                this.document,
                token.target,
                token.data,
              ),
            );
          } else if (token.type === "DOCTYPE") {
            this.document._append(
              new DocumentType(
                this.document,
                token.name ?? "",
                token.publicId ?? "",
                token.systemId ?? "",
              ),
            );
            this.document._quirks = token.forceQuirks || token.name !== "html";
            this.#mode = "before-html";
          } else {
            this.document._quirks = true;
            this.#mode = "before-html";
            repeat = true;
          }
          break;
        case "before-html":
          if (token.type === "Character" && whitespace(token.data)) {
            break;
          }
          if (token.type === "Comment") {
            this.document._append(new Comment(this.document, token.data));
          } else if (token.type === "ProcessingInstruction") {
            this.document._append(
              new ProcessingInstruction(
                this.document,
                token.target,
                token.data,
              ),
            );
          } else if (token.type === "StartTag" && token.name === "html") {
            const html = this.#element(token, HTML_NAMESPACE);
            this.document._append(html);
            this.#stack.push(html);
            this.#mode = "before-head";
          } else if (token.type !== "DOCTYPE") {
            const html = new Element(this.document, "html");
            this.document._append(html);
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
          } else if (token.type !== "DOCTYPE") {
            this.#head = this.#insert(this.#start("head"));
            this.#mode = "in-head";
            repeat = true;
          }
          break;
        case "in-head":
          repeat = this.#inHead(token);
          break;
        case "after-head":
          repeat = this.#afterHead(token);
          break;
        case "in-body":
          this.#inBody(token);
          break;
        case "in-table":
          this.#inTable(token);
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
        case "after-body":
          if (token.type === "Character" && whitespace(token.data)) {
            this.#inBody(token);
          } else if (token.type === "Comment") {
            this.document.documentElement?._append(
              new Comment(this.document, token.data),
            );
          } else if (token.type === "ProcessingInstruction") {
            this.document.documentElement?._append(
              new ProcessingInstruction(
                this.document,
                token.target,
                token.data,
              ),
            );
          } else if (!(token.type === "EndTag" && token.name === "html")) {
            this.#mode = "in-body";
            repeat = true;
          }
          break;
      }
    }
  }

  #inHead(token: Token): boolean {
    if (
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
        this.#insert(token, false);
      } else if (token.name === "title") {
        this.#insert(token);
        this.#tokenizer.setState("RCDATA state", token.name);
      } else if (["style", "noframes", "noembed"].includes(token.name)) {
        this.#insert(token);
        this.#tokenizer.setState("RAWTEXT state", token.name);
      } else if (token.name === "script") {
        this.#insert(token);
        this.#tokenizer.setState("Script data state", token.name);
      } else if (token.name === "template") {
        const template = this.#insert(token);
        template._templateContents ??= new DocumentFragment(this.document);
        this.#formatting.push(null);
        this.#mode = "in-body";
      } else if (token.name === "html") {
        this.#inBody(token);
      } else if (token.name !== "head") {
        this.#close("head");
        this.#mode = "after-head";
        return true;
      }
    } else if (token.type === "EndTag") {
      if (token.name === "head") {
        this.#close("head");
        this.#mode = "after-head";
      } else if (token.name === "template") {
        this.#closeTemplate();
      } else if (this.#current()?.localName === token.name) {
        this.#stack.pop();
      } else if (["body", "html", "br"].includes(token.name)) {
        this.#close("head");
        this.#mode = "after-head";
        return true;
      }
    } else if (token.type !== "DOCTYPE") {
      this.#close("head");
      this.#mode = "after-head";
      return true;
    }
    return false;
  }

  #afterHead(token: Token): boolean {
    if (token.type === "Comment") {
      this.#comment(token.data);
    } else if (token.type === "ProcessingInstruction") {
      this.#processingInstruction(token);
    } else if (token.type === "StartTag" && token.name === "body") {
      this.#body = this.#insert(token);
      this.#mode = "in-body";
    } else if (token.type === "StartTag" && token.name === "frameset") {
      this.#body = this.#insert(token);
      this.#mode = "in-body";
    } else if (
      token.type === "StartTag" &&
      [
        "base",
        "link",
        "meta",
        "noframes",
        "script",
        "style",
        "template",
        "title",
      ].includes(token.name)
    ) {
      if (this.#head !== null) {
        this.#stack.push(this.#head);
      }
      this.#inHead(token);
      if (this.#current() === this.#head) {
        this.#stack.pop();
      }
    } else if (
      token.type !== "DOCTYPE" &&
      !(token.type === "StartTag" && token.name === "head")
    ) {
      this.#ensureBody();
      this.#mode = "in-body";
      return true;
    }
    return false;
  }

  #inBody(token: Token, foster = false): void {
    if (token.type === "Character") {
      this.#reconstructFormatting();
      this.#text(token.data, foster);
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
      return;
    }
    if (token.type === "StartTag") {
      const name = token.name;
      if (name === "html") {
        this.#merge(this.document.documentElement, token);
      } else if (name === "body") {
        this.#merge(this.#body, token);
      } else if (
        [
          "base",
          "link",
          "meta",
          "noframes",
          "script",
          "style",
          "template",
          "title",
        ].includes(name)
      ) {
        this.#inHead(token);
      } else if (BLOCK.has(name)) {
        this.#closeParagraph();
        this.#insert(token, true, foster);
      } else if (/^h[1-6]$/.test(name)) {
        this.#closeParagraph();
        if (/^h[1-6]$/.test(this.#current()?.localName ?? "")) {
          this.#stack.pop();
        }
        this.#insert(token, true, foster);
      } else if (name === "p") {
        this.#closeParagraph();
        this.#insert(token, true, foster);
      } else if (name === "li") {
        this.#closeNearest(["li"]);
        this.#closeParagraph();
        this.#insert(token, true, foster);
      } else if (name === "dd" || name === "dt") {
        this.#closeNearest(["dd", "dt"]);
        this.#closeParagraph();
        this.#insert(token, true, foster);
      } else if (FORMATTING.has(name)) {
        if (name === "a") {
          this.#adopt("a");
        }
        this.#reconstructFormatting();
        const element = this.#insert(token, true, foster);
        this.#formatting.push(element);
      } else if (name === "table") {
        this.#closeParagraph();
        this.#insert(token, true, foster);
        this.#mode = "in-table";
      } else if (name === "select") {
        this.#insert(token, true, foster);
        this.#mode = "in-select";
      } else if (name === "textarea") {
        this.#insert(token, true, foster);
        this.#tokenizer.setState("RCDATA state", name);
      } else if (["xmp", "iframe", "noembed"].includes(name)) {
        this.#insert(token, true, foster);
        this.#tokenizer.setState("RAWTEXT state", name);
      } else if (name === "plaintext") {
        this.#insert(token, true, foster);
        this.#tokenizer.setState("PLAINTEXT state", name);
      } else if (name === "svg" || name === "math") {
        this.#insert(
          token,
          !token.selfClosing,
          foster,
          name === "svg" ? SVG_NAMESPACE : MATHML_NAMESPACE,
        );
      } else if (VOID.has(name) || name === "image") {
        this.#insert(
          name === "image" ? { ...token, name: "img" } : token,
          false,
          foster,
        );
      } else {
        this.#insert(token, !token.selfClosing, foster);
      }
      return;
    }
    const name = token.name;
    if (name === "body") {
      this.#mode = "after-body";
    } else if (name === "html") {
      this.#mode = "after-body";
    } else if (name === "template") {
      this.#closeTemplate();
    } else if (name === "p") {
      if (!this.#contains("p")) {
        this.#insert(this.#start("p"));
      }
      this.#close("p");
    } else if (FORMATTING.has(name)) {
      this.#adopt(name);
    } else if (name === "br") {
      this.#insert(this.#start("br"), false);
    } else {
      this.#close(name);
    }
  }

  #inTable(token: Token): void {
    if (token.type === "Character") {
      if (whitespace(token.data)) {
        this.#text(token.data);
      } else {
        this.#inBody(token, true);
      }
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
      this.#clearTo(["table", "template", "html"]);
      this.#insert(this.#start("tbody"));
      this.#mode = "in-table-body";
      this.#inTableBody(token);
    } else if (token.type === "StartTag" && token.name === "caption") {
      this.#clearTo(["table", "template", "html"]);
      this.#formatting.push(null);
      this.#insert(token);
      this.#mode = "in-body";
    } else if (token.type === "StartTag" && token.name === "colgroup") {
      this.#clearTo(["table", "template", "html"]);
      this.#insert(token);
    } else if (token.type === "StartTag" && token.name === "col") {
      this.#clearTo(["table", "template", "html"]);
      this.#insert(this.#start("colgroup"));
      this.#insert(token, false);
    } else if (token.type === "EndTag" && token.name === "table") {
      this.#close("table");
      this.#resetMode();
    } else {
      this.#inBody(token, true);
    }
  }

  #inTableBody(token: Token): void {
    if (token.type === "StartTag" && token.name === "tr") {
      this.#clearTo(["tbody", "thead", "tfoot", "html"]);
      this.#insert(token);
      this.#mode = "in-row";
    } else if (token.type === "StartTag" && ["td", "th"].includes(token.name)) {
      this.#insert(this.#start("tr"));
      this.#mode = "in-row";
      this.#inRow(token);
    } else if (
      (token.type === "EndTag" && token.name === "table") ||
      (token.type === "StartTag" &&
        ["tbody", "thead", "tfoot"].includes(token.name))
    ) {
      this.#closeNearest(["tbody", "thead", "tfoot"]);
      this.#mode = "in-table";
      this.#inTable(token);
    } else if (
      token.type === "EndTag" &&
      ["tbody", "thead", "tfoot"].includes(token.name)
    ) {
      this.#close(token.name);
      this.#mode = "in-table";
    } else {
      this.#inTable(token);
    }
  }

  #inRow(token: Token): void {
    if (token.type === "StartTag" && ["td", "th"].includes(token.name)) {
      this.#clearTo(["tr", "html"]);
      this.#insert(token);
      this.#formatting.push(null);
      this.#mode = "in-cell";
    } else if (
      (token.type === "EndTag" && ["tr", "table"].includes(token.name)) ||
      (token.type === "StartTag" &&
        ["tr", "tbody", "thead", "tfoot"].includes(token.name))
    ) {
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
      this.#close(token.name);
      this.#clearFormatting();
      this.#mode = "in-row";
    } else if (
      (token.type === "EndTag" &&
        ["table", "tr", "tbody", "thead", "tfoot"].includes(token.name)) ||
      (token.type === "StartTag" &&
        ["td", "th", "tr", "tbody", "thead", "tfoot"].includes(token.name))
    ) {
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
      this.#text(token.data);
    } else if (token.type === "Comment") {
      this.#comment(token.data);
    } else if (token.type === "ProcessingInstruction") {
      this.#processingInstruction(token);
    } else if (token.type === "StartTag" && token.name === "option") {
      if (this.#current()?.localName === "option") {
        this.#stack.pop();
      }
      this.#insert(token);
    } else if (token.type === "StartTag" && token.name === "optgroup") {
      if (this.#current()?.localName === "option") {
        this.#stack.pop();
      }
      if (this.#current()?.localName === "optgroup") {
        this.#stack.pop();
      }
      this.#insert(token);
    } else if (
      token.type === "EndTag" &&
      ["option", "optgroup"].includes(token.name)
    ) {
      this.#close(token.name);
    } else if (token.type === "EndTag" && token.name === "select") {
      this.#close("select");
      this.#resetMode();
    }
  }

  #foreign(token: Token): boolean {
    const current = this.#current();
    if (
      current === null ||
      current.namespaceURI === HTML_NAMESPACE ||
      this.#isHtmlIntegrationPoint(current) ||
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
      this.#text(token.data);
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
      if (htmlBreakout.includes(token.name)) {
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
      this.#close(token.name);
    }
    return token.type !== "DOCTYPE";
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
    const encoding = element._attributeNodes
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
    const element =
      namespace === HTML_NAMESPACE
        ? createHTMLElement(this.document, localName)
        : new Element(this.document, localName, namespace);
    element._setAttributes(
      Object.entries(token.attributes).map(
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
            prefix === "xlink"
              ? XLINK_NAMESPACE
              : prefix === "xml"
                ? XML_NAMESPACE
                : prefix === "xmlns"
                  ? XMLNS_NAMESPACE
                  : null;
          return { name, value, prefix, localName: local, namespaceURI };
        },
      ),
    );
    return element;
  }

  #insert(
    token: Extract<Token, { type: "StartTag" }>,
    push = true,
    foster = false,
    namespace = HTML_NAMESPACE,
  ): Element {
    const element = this.#element(token, namespace);
    this.#insertNode(element, foster);
    if (push) {
      this.#stack.push(element);
    }
    return element;
  }

  #insertNode(node: Node, foster: boolean): void {
    if (foster) {
      const table = [...this.#stack]
        .reverse()
        .find((element) => element.localName === "table");
      if (table?.parentNode !== null && table?.parentNode !== undefined) {
        table.parentNode._insertBefore(node, table);
        return;
      }
    }
    const current = this.#current();
    if (current === null) {
      this.document._append(node);
    } else if (
      current.localName === "template" &&
      current._templateContents !== null
    ) {
      current._templateContents._append(node);
    } else {
      current._append(node);
    }
  }

  #text(data: string, foster = false): void {
    if (data === "") {
      return;
    }
    let parent: Node = this.#current() ?? this.document;
    let table: Element | undefined;
    if (
      parent instanceof Element &&
      parent.localName === "template" &&
      parent._templateContents !== null
    ) {
      parent = parent._templateContents;
    }
    if (foster) {
      table = [...this.#stack]
        .reverse()
        .find((element) => element.localName === "table");
      if (table?.parentNode !== null && table?.parentNode !== undefined) {
        parent = table.parentNode;
      }
    }
    const reference = table;
    const previous = reference?.previousSibling ?? parent.lastChild;
    const text = new Text(
      this.document,
      (previous instanceof Text ? previous.data : "") + data,
    );
    if (previous instanceof Text) {
      previous._remove();
    }
    if (reference !== undefined) {
      parent._insertBefore(text, reference);
    } else {
      parent._append(text);
    }
  }

  #comment(data: string, foster = false): void {
    this.#insertNode(new Comment(this.document, data), foster);
  }

  #processingInstruction(
    token: Extract<Token, { type: "ProcessingInstruction" }>,
    foster = false,
  ): void {
    this.#insertNode(
      new ProcessingInstruction(this.document, token.target, token.data),
      foster,
    );
  }

  #start(name: string): Extract<Token, { type: "StartTag" }> {
    return { type: "StartTag", name, attributes: {}, selfClosing: false };
  }

  #current(): Element | null {
    return this.#stack.at(-1) ?? null;
  }

  #contains(name: string): boolean {
    return this.#stack.some((element) => element.localName === name);
  }

  #close(name: string): void {
    const index = this.#stack.findLastIndex(
      (element) => element.localName === name,
    );
    if (index >= 0) {
      this.#stack.length = index;
    }
  }

  #closeNearest(names: string[]): void {
    for (let index = this.#stack.length - 1; index >= 0; index -= 1) {
      if (names.includes(this.#stack[index]?.localName ?? "")) {
        this.#stack.length = index;
        return;
      }
    }
  }

  #closeParagraph(): void {
    if (this.#contains("p")) {
      this.#close("p");
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
      element._attributeNodes.map((attribute) => attribute.name),
    );
    element._setAttributes(
      Object.entries(token.attributes)
        .filter(([name]) => !existing.has(name))
        .map(([name, value]) => ({ name, value })),
    );
  }

  #adopt(name: string): void {
    const formattingIndex = this.#formatting.findLastIndex(
      (element) => element?.localName === name,
    );
    if (formattingIndex < 0) {
      this.#close(name);
      return;
    }
    const element = this.#formatting[formattingIndex];
    if (element !== null && element !== undefined) {
      const stackIndex = this.#stack.lastIndexOf(element);
      if (stackIndex >= 0) {
        this.#stack.length = stackIndex;
      }
    }
    this.#formatting.splice(formattingIndex, 1);
  }

  #reconstructFormatting(): void {
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
      const clone = new Element(
        this.document,
        old.localName,
        old.namespaceURI,
        old.prefix,
      );
      clone._setAttributes(
        old._attributeNodes.map((attribute) => ({
          name: attribute.name,
          value: attribute.value,
          namespaceURI: attribute.namespaceURI,
          prefix: attribute.prefix,
          localName: attribute.localName,
        })),
      );
      this.#insertNode(clone, false);
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
        this.#mode = "in-select";
      } else if (name === "td" || name === "th") {
        this.#mode = "in-cell";
      } else if (name === "tr") {
        this.#mode = "in-row";
      } else if (["tbody", "thead", "tfoot"].includes(name ?? "")) {
        this.#mode = "in-table-body";
      } else if (name === "table") {
        this.#mode = "in-table";
      } else if (name === "head") {
        this.#mode = "in-head";
      } else if (name === "body") {
        this.#mode = "in-body";
      } else {
        continue;
      }
      return;
    }
    this.#mode = "in-body";
  }

  #ensureBody(): void {
    if (this.#body === null) {
      this.#body = this.#insert(this.#start("body"));
    }
  }

  #finish(): void {
    if (this.document.documentElement === null) {
      const html = new Element(this.document, "html");
      this.document._append(html);
      this.#stack.push(html);
    }
    if (this.document.head === null) {
      const head = new Element(this.document, "head");
      const documentElement = this.document.documentElement;
      const firstChild = documentElement?.firstChild;
      if (firstChild === null || firstChild === undefined) {
        documentElement?._append(head);
      } else {
        documentElement?._insertBefore(head, firstChild);
      }
    }
    if (this.document.body === null) {
      this.document.documentElement?._append(
        new Element(this.document, "body"),
      );
    }
  }
}

export function parseHTML(input: string): Document {
  return new TreeBuilder(input).parse();
}
