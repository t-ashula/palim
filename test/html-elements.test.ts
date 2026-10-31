import { describe, expect, it } from "vitest";

import * as Palim from "../src/index.js";
import {
  Event,
  HTMLAnchorElement,
  HTMLButtonElement,
  HTMLCanvasElement,
  HTMLDataListElement,
  HTMLDetailsElement,
  HTMLDialogElement,
  HTMLFieldSetElement,
  HTMLFormElement,
  HTMLImageElement,
  HTMLInputElement,
  HTMLLinkElement,
  HTMLMediaElement,
  HTMLMetaElement,
  HTMLObjectElement,
  HTMLOptionElement,
  HTMLProgressElement,
  HTMLScriptElement,
  HTMLSelectElement,
  HTMLTableCellElement,
  HTMLTableElement,
  HTMLTableRowElement,
  HTMLTextAreaElement,
  HTMLTrackElement,
} from "../src/index.js";

import {
  DOMParser,
  Element,
  HTMLBRElement,
  HTMLDListElement,
  HTMLDataElement,
  HTMLDivElement,
  HTMLElement,
  HTMLHeadElement,
  HTMLHeadingElement,
  HTMLHRElement,
  HTMLHtmlElement,
  HTMLLIElement,
  HTMLMenuElement,
  HTMLOListElement,
  HTMLParagraphElement,
  HTMLPictureElement,
  HTMLPreElement,
  HTMLSourceElement,
  HTMLSpanElement,
  HTMLTemplateElement,
  HTMLTimeElement,
  HTMLTitleElement,
  HTMLUListElement,
  HTMLUnknownElement,
} from "../src/index.js";
import type { Document } from "../src/index.js";

function parse(input: string): Document {
  return new DOMParser().parseFromString(input, "text/html");
}

function select(document: Document, selector: string): Element {
  const element = document.querySelector(selector);
  if (element === null) {
    throw new Error(`missing test element: ${selector}`);
  }
  return element;
}

describe("HTML element interfaces", () => {
  it("rejects direct construction of HTML element interfaces", () => {
    const document = parse("<main></main>");
    const interfaces = [
      HTMLElement,
      HTMLUnknownElement,
      HTMLHtmlElement,
      HTMLHeadElement,
      HTMLTitleElement,
      HTMLPreElement,
      HTMLHeadingElement,
      HTMLParagraphElement,
      HTMLHRElement,
      HTMLOListElement,
      HTMLUListElement,
      HTMLMenuElement,
      HTMLLIElement,
      HTMLDListElement,
      HTMLDivElement,
      HTMLDataElement,
      HTMLTimeElement,
      HTMLSpanElement,
      HTMLBRElement,
      HTMLTemplateElement,
      HTMLPictureElement,
      HTMLSourceElement,
    ];

    for (const Interface of interfaces) {
      expect(() => {
        Reflect.construct(Interface, []);
      }).toThrow(TypeError);
      expect(() => {
        Reflect.construct(Interface, [document, "main"]);
      }).toThrow(TypeError);
    }
  });

  it("uses HTMLElement for element types whose interface is HTMLElement", () => {
    const document = parse("<main></main><abbr></abbr><summary></summary>");

    for (const selector of ["main", "abbr", "summary"]) {
      const element = select(document, selector);
      expect(element).toBeInstanceOf(HTMLElement);
      expect(element).toBeInstanceOf(Element);
      expect(element).not.toBeInstanceOf(HTMLUnknownElement);
    }
  });

  it("distinguishes unknown elements from valid custom element names", () => {
    const document = parse(
      "<unknown></unknown><x-widget></x-widget><applet></applet><acronym></acronym>",
    );

    expect(select(document, "unknown")).toBeInstanceOf(HTMLUnknownElement);
    expect(select(document, "applet")).toBeInstanceOf(HTMLUnknownElement);
    expect(select(document, "x-widget")).toBeInstanceOf(HTMLElement);
    expect(select(document, "x-widget")).not.toBeInstanceOf(HTMLUnknownElement);
    expect(select(document, "acronym")).toBeInstanceOf(HTMLElement);
    expect(select(document, "acronym")).not.toBeInstanceOf(HTMLUnknownElement);
  });

  it("does not use HTMLElement for foreign elements", () => {
    const document = parse(
      '<svg><g id="svg-child"></g></svg><math><mi id="math-child">x</mi></math>',
    );

    expect(select(document, "#svg-child")).toBeInstanceOf(Element);
    expect(select(document, "#svg-child")).not.toBeInstanceOf(HTMLElement);
    expect(select(document, "#math-child")).toBeInstanceOf(Element);
    expect(select(document, "#math-child")).not.toBeInstanceOf(HTMLElement);
  });

  it("reflects the common title, lang, inert, and accesskey attributes", () => {
    const element = select(
      parse('<main title="before" lang="en" accesskey="a"></main>'),
      "main",
    );
    if (!(element instanceof HTMLElement)) {
      throw new Error("main is not an HTMLElement");
    }

    expect(element.title).toBe("before");
    expect(element.lang).toBe("en");
    expect(element.inert).toBe(false);
    expect(element.accessKey).toBe("a");

    element.title = "after";
    element.lang = "ja";
    element.inert = true;
    element.accessKey = "b";

    expect(element.getAttribute("title")).toBe("after");
    expect(element.getAttribute("lang")).toBe("ja");
    expect(element.getAttribute("inert")).toBe("");
    expect(element.getAttribute("accesskey")).toBe("b");

    element.inert = false;
    expect(element.hasAttribute("inert")).toBe(false);
  });

  it("gets and sets translate according to inherited translation mode", () => {
    const document = parse(
      '<main translate="no"><section id="inherited"></section><section id="enabled" translate="yes"></section></main>',
    );
    const inherited = select(document, "#inherited");
    const enabled = select(document, "#enabled");
    if (
      !(inherited instanceof HTMLElement) ||
      !(enabled instanceof HTMLElement)
    ) {
      throw new Error("section is not an HTMLElement");
    }

    expect(inherited.translate).toBe(false);
    expect(enabled.translate).toBe(true);

    inherited.translate = true;
    enabled.translate = false;

    expect(inherited.getAttribute("translate")).toBe("yes");
    expect(enabled.getAttribute("translate")).toBe("no");
  });

  it("uses document structure interfaces and their members", () => {
    const document = parse(
      '<html version="5"><head><title>before</title></head><body></body></html>',
    );
    const html = document.documentElement;
    const head = document.head;
    const title = select(document, "title");

    expect(html).toBeInstanceOf(HTMLHtmlElement);
    expect(head).toBeInstanceOf(HTMLHeadElement);
    expect(title).toBeInstanceOf(HTMLTitleElement);

    if (!(html instanceof HTMLHtmlElement)) {
      throw new Error("html is not an HTMLHtmlElement");
    }
    if (!(title instanceof HTMLTitleElement)) {
      throw new Error("title is not an HTMLTitleElement");
    }

    expect(html.version).toBe("5");
    html.version = "next";
    expect(html.getAttribute("version")).toBe("next");

    expect(title.text).toBe("before");
    title.text = "after";
    expect(title.textContent).toBe("after");
  });

  it("uses HTMLPreElement for pre, listing, and xmp", () => {
    const document = parse(
      '<pre width="12"></pre><listing width="invalid"></listing><xmp width="7"></xmp>',
    );
    const pre = select(document, "pre");
    const listing = select(document, "listing");
    const xmp = select(document, "xmp");

    expect(pre).toBeInstanceOf(HTMLPreElement);
    expect(listing).toBeInstanceOf(HTMLPreElement);
    expect(xmp).toBeInstanceOf(HTMLPreElement);

    if (!(pre instanceof HTMLPreElement)) {
      throw new Error("pre is not an HTMLPreElement");
    }
    if (!(listing instanceof HTMLPreElement)) {
      throw new Error("listing is not an HTMLPreElement");
    }

    expect(pre.width).toBe(12);
    expect(listing.width).toBe(0);
    listing.width = 24;
    expect(listing.getAttribute("width")).toBe("24");
  });

  it("uses grouping and text element interfaces", () => {
    const document = parse(`
      <h2></h2><p></p><hr><ol></ol><ul></ul><menu></menu>
      <li></li><dl></dl><div></div><data></data><time></time>
      <span></span><br>
    `);

    expect(select(document, "h2")).toBeInstanceOf(HTMLHeadingElement);
    expect(select(document, "p")).toBeInstanceOf(HTMLParagraphElement);
    expect(select(document, "hr")).toBeInstanceOf(HTMLHRElement);
    expect(select(document, "ol")).toBeInstanceOf(HTMLOListElement);
    expect(select(document, "ul")).toBeInstanceOf(HTMLUListElement);
    expect(select(document, "menu")).toBeInstanceOf(HTMLMenuElement);
    expect(select(document, "li")).toBeInstanceOf(HTMLLIElement);
    expect(select(document, "dl")).toBeInstanceOf(HTMLDListElement);
    expect(select(document, "div")).toBeInstanceOf(HTMLDivElement);
    expect(select(document, "data")).toBeInstanceOf(HTMLDataElement);
    expect(select(document, "time")).toBeInstanceOf(HTMLTimeElement);
    expect(select(document, "span")).toBeInstanceOf(HTMLSpanElement);
    expect(select(document, "br")).toBeInstanceOf(HTMLBRElement);
  });

  it("reflects grouping and text element members", () => {
    const document = parse(`
      <h2 align="left"></h2><p align="right"></p>
      <hr align="center" color="red" noshade size="4" width="50%">
      <ol reversed start="3" type="A" compact></ol>
      <ul compact type="square"></ul><menu compact></menu>
      <li value="2" type="disc"></li><dl compact></dl>
      <div align="justify"></div><data value="datum"></data>
      <time datetime="2026-10-30"></time><br clear="all">
    `);
    const heading = select(document, "h2") as HTMLHeadingElement;
    const paragraph = select(document, "p") as HTMLParagraphElement;
    const rule = select(document, "hr") as HTMLHRElement;
    const ordered = select(document, "ol") as HTMLOListElement;
    const unordered = select(document, "ul") as HTMLUListElement;
    const menu = select(document, "menu") as HTMLMenuElement;
    const item = select(document, "li") as HTMLLIElement;
    const list = select(document, "dl") as HTMLDListElement;
    const division = select(document, "div") as HTMLDivElement;
    const data = select(document, "data") as HTMLDataElement;
    const time = select(document, "time") as HTMLTimeElement;
    const br = select(document, "br") as HTMLBRElement;

    expect(heading.align).toBe("left");
    expect(paragraph.align).toBe("right");
    expect(rule.align).toBe("center");
    expect(rule.color).toBe("red");
    expect(rule.noShade).toBe(true);
    expect(rule.size).toBe("4");
    expect(rule.width).toBe("50%");
    expect(ordered.reversed).toBe(true);
    expect(ordered.start).toBe(3);
    expect(ordered.type).toBe("A");
    expect(ordered.compact).toBe(true);
    expect(unordered.compact).toBe(true);
    expect(unordered.type).toBe("square");
    expect(menu.compact).toBe(true);
    expect(item.value).toBe(2);
    expect(item.type).toBe("disc");
    expect(list.compact).toBe(true);
    expect(division.align).toBe("justify");
    expect(data.value).toBe("datum");
    expect(time.dateTime).toBe("2026-10-30");
    expect(br.clear).toBe("all");

    ordered.start = 5;
    ordered.reversed = false;
    item.value = 7;
    rule.noShade = false;
    data.value = "next";

    expect(ordered.getAttribute("start")).toBe("5");
    expect(ordered.hasAttribute("reversed")).toBe(false);
    expect(item.getAttribute("value")).toBe("7");
    expect(rule.hasAttribute("noshade")).toBe(false);
    expect(data.getAttribute("value")).toBe("next");
  });

  it("exposes template contents through HTMLTemplateElement", () => {
    const document = parse(
      '<template id="template"><section id="content"></section></template>',
    );
    const template = select(document, "#template");

    expect(template).toBeInstanceOf(HTMLTemplateElement);
    if (!(template instanceof HTMLTemplateElement)) {
      throw new Error("template is not an HTMLTemplateElement");
    }

    expect(template.childNodes).toHaveLength(0);
    expect(template.content.querySelector("#content")?.localName).toBe(
      "section",
    );
    expect(template.content.ownerDocument).not.toBe(document);
    expect(template.content.ownerDocument?.contentType).toBe("text/html");
  });

  it("uses picture and source interfaces with reflected members", () => {
    const document = parse(`
      <picture id="picture">
        <source id="source" src="https://example.com/image.png"
          type="image/png" srcset="one.png 1x" sizes="100vw"
          media="screen" width="320" height="240">
      </picture>
    `);
    const picture = select(document, "#picture");
    const source = select(document, "#source");

    expect(picture).toBeInstanceOf(HTMLPictureElement);
    expect(source).toBeInstanceOf(HTMLSourceElement);
    if (!(source instanceof HTMLSourceElement)) {
      throw new Error("source is not an HTMLSourceElement");
    }

    expect(source.src).toBe("https://example.com/image.png");
    expect(source.type).toBe("image/png");
    expect(source.srcset).toBe("one.png 1x");
    expect(source.sizes).toBe("100vw");
    expect(source.media).toBe("screen");
    expect(source.width).toBe(320);
    expect(source.height).toBe(240);

    source.src = "https://example.com/next.png";
    source.type = "image/webp";
    source.srcset = "two.png 2x";
    source.sizes = "50vw";
    source.media = "print";
    source.width = 640;
    source.height = 480;

    expect(source.getAttribute("src")).toBe("https://example.com/next.png");
    expect(source.getAttribute("type")).toBe("image/webp");
    expect(source.getAttribute("srcset")).toBe("two.png 2x");
    expect(source.getAttribute("sizes")).toBe("50vw");
    expect(source.getAttribute("media")).toBe("print");
    expect(source.getAttribute("width")).toBe("640");
    expect(source.getAttribute("height")).toBe("480");
  });
});

function element(document: Palim.Document, selector: string): Palim.Element {
  const result = document.querySelector(selector);
  if (result === null) {
    throw new Error(`missing test element: ${selector}`);
  }
  return result;
}

describe("HTML element interface mapping", () => {
  it("rejects direct construction of every HTML element interface", () => {
    const interfaces = [
      Palim.HTMLElement,
      Palim.HTMLUnknownElement,
      Palim.HTMLHtmlElement,
      Palim.HTMLHeadElement,
      Palim.HTMLTitleElement,
      Palim.HTMLBaseElement,
      Palim.HTMLLinkElement,
      Palim.HTMLMetaElement,
      Palim.HTMLStyleElement,
      Palim.HTMLBodyElement,
      Palim.HTMLHeadingElement,
      Palim.HTMLParagraphElement,
      Palim.HTMLHRElement,
      Palim.HTMLPreElement,
      Palim.HTMLQuoteElement,
      Palim.HTMLOListElement,
      Palim.HTMLUListElement,
      Palim.HTMLMenuElement,
      Palim.HTMLLIElement,
      Palim.HTMLDListElement,
      Palim.HTMLDivElement,
      Palim.HTMLAnchorElement,
      Palim.HTMLDataElement,
      Palim.HTMLTimeElement,
      Palim.HTMLSpanElement,
      Palim.HTMLBRElement,
      Palim.HTMLModElement,
      Palim.HTMLPictureElement,
      Palim.HTMLSourceElement,
      Palim.HTMLImageElement,
      Palim.HTMLIFrameElement,
      Palim.HTMLEmbedElement,
      Palim.HTMLObjectElement,
      Palim.HTMLMediaElement,
      Palim.HTMLVideoElement,
      Palim.HTMLAudioElement,
      Palim.HTMLTrackElement,
      Palim.HTMLMapElement,
      Palim.HTMLAreaElement,
      Palim.HTMLTableElement,
      Palim.HTMLTableCaptionElement,
      Palim.HTMLTableColElement,
      Palim.HTMLTableSectionElement,
      Palim.HTMLTableRowElement,
      Palim.HTMLTableCellElement,
      Palim.HTMLFormElement,
      Palim.HTMLLabelElement,
      Palim.HTMLInputElement,
      Palim.HTMLButtonElement,
      Palim.HTMLSelectElement,
      Palim.HTMLDataListElement,
      Palim.HTMLOptGroupElement,
      Palim.HTMLOptionElement,
      Palim.HTMLTextAreaElement,
      Palim.HTMLOutputElement,
      Palim.HTMLProgressElement,
      Palim.HTMLMeterElement,
      Palim.HTMLFieldSetElement,
      Palim.HTMLLegendElement,
      Palim.HTMLSelectedContentElement,
      Palim.HTMLDetailsElement,
      Palim.HTMLDialogElement,
      Palim.HTMLScriptElement,
      Palim.HTMLTemplateElement,
      Palim.HTMLSlotElement,
      Palim.HTMLCanvasElement,
      Palim.HTMLMarqueeElement,
      Palim.HTMLFrameSetElement,
      Palim.HTMLFrameElement,
      Palim.HTMLDirectoryElement,
      Palim.HTMLFontElement,
      Palim.HTMLParamElement,
    ];

    for (const Interface of interfaces) {
      expect(() => {
        Reflect.construct(Interface, []);
      }).toThrow(TypeError);
    }
  });

  it.each([
    ["base", Palim.HTMLBaseElement],
    ["link", Palim.HTMLLinkElement],
    ["meta", Palim.HTMLMetaElement],
    ["style", Palim.HTMLStyleElement],
    ["body", Palim.HTMLBodyElement],
    ["blockquote", Palim.HTMLQuoteElement],
    ["q", Palim.HTMLQuoteElement],
    ["a", Palim.HTMLAnchorElement],
    ["ins", Palim.HTMLModElement],
    ["del", Palim.HTMLModElement],
    ["img", Palim.HTMLImageElement],
    ["iframe", Palim.HTMLIFrameElement],
    ["embed", Palim.HTMLEmbedElement],
    ["object", Palim.HTMLObjectElement],
    ["video", Palim.HTMLVideoElement],
    ["audio", Palim.HTMLAudioElement],
    ["track", Palim.HTMLTrackElement],
    ["map", Palim.HTMLMapElement],
    ["area", Palim.HTMLAreaElement],
    ["form", Palim.HTMLFormElement],
    ["label", Palim.HTMLLabelElement],
    ["input", Palim.HTMLInputElement],
    ["button", Palim.HTMLButtonElement],
    ["select", Palim.HTMLSelectElement],
    ["datalist", Palim.HTMLDataListElement],
    ["optgroup", Palim.HTMLOptGroupElement],
    ["option", Palim.HTMLOptionElement],
    ["textarea", Palim.HTMLTextAreaElement],
    ["output", Palim.HTMLOutputElement],
    ["progress", Palim.HTMLProgressElement],
    ["meter", Palim.HTMLMeterElement],
    ["fieldset", Palim.HTMLFieldSetElement],
    ["legend", Palim.HTMLLegendElement],
    ["selectedcontent", Palim.HTMLSelectedContentElement],
    ["details", Palim.HTMLDetailsElement],
    ["dialog", Palim.HTMLDialogElement],
    ["script", Palim.HTMLScriptElement],
    ["slot", Palim.HTMLSlotElement],
    ["canvas", Palim.HTMLCanvasElement],
    ["marquee", Palim.HTMLMarqueeElement],
    ["dir", Palim.HTMLDirectoryElement],
    ["font", Palim.HTMLFontElement],
    ["param", Palim.HTMLParamElement],
  ])("uses the specified interface for <%s>", (localName, Interface) => {
    const document = parse(`<${localName}></${localName}>`);

    expect(element(document, localName)).toBeInstanceOf(Interface);
  });

  it("uses the specified table interfaces", () => {
    const document = parse(`
      <table>
        <caption></caption>
        <colgroup><col></colgroup>
        <thead><tr><th></th></tr></thead>
        <tbody><tr><td></td></tr></tbody>
        <tfoot><tr></tr></tfoot>
      </table>
    `);

    expect(element(document, "table")).toBeInstanceOf(Palim.HTMLTableElement);
    expect(element(document, "caption")).toBeInstanceOf(
      Palim.HTMLTableCaptionElement,
    );
    expect(element(document, "colgroup")).toBeInstanceOf(
      Palim.HTMLTableColElement,
    );
    expect(element(document, "col")).toBeInstanceOf(Palim.HTMLTableColElement);
    expect(element(document, "thead")).toBeInstanceOf(
      Palim.HTMLTableSectionElement,
    );
    expect(element(document, "tbody")).toBeInstanceOf(
      Palim.HTMLTableSectionElement,
    );
    expect(element(document, "tfoot")).toBeInstanceOf(
      Palim.HTMLTableSectionElement,
    );
    expect(element(document, "tr")).toBeInstanceOf(Palim.HTMLTableRowElement);
    expect(element(document, "th")).toBeInstanceOf(Palim.HTMLTableCellElement);
    expect(element(document, "td")).toBeInstanceOf(Palim.HTMLTableCellElement);
  });

  it("uses the specified frame interfaces", () => {
    const document = parse("<frameset><frame></frameset>");

    expect(element(document, "frameset")).toBeInstanceOf(
      Palim.HTMLFrameSetElement,
    );
    expect(element(document, "frame")).toBeInstanceOf(Palim.HTMLFrameElement);
  });
});

describe("HTML element members", () => {
  it("implements EventTarget and GlobalEventHandlers", () => {
    const element = select(parse("<button></button>"), "button");
    if (!(element instanceof HTMLElement)) {
      throw new Error("button is not an HTMLElement");
    }
    const events: string[] = [];
    element.addEventListener("click", (event) => {
      expect(event).toBeInstanceOf(Event);
      events.push("listener");
    });
    element.onclick = () => {
      events.push("handler");
    };

    element.click();

    expect(events).toEqual(["listener", "handler"]);
  });

  it("implements HTMLElement reflection and mixin members", () => {
    const element = select(
      parse(
        '<main dir="rtl" hidden draggable="false" spellcheck="true" data-user-id="42" tabindex="3"></main>',
      ),
      "main",
    );
    if (!(element instanceof HTMLElement)) {
      throw new Error("main is not an HTMLElement");
    }

    expect(element.dir).toBe("rtl");
    expect(element.hidden).toBe(true);
    expect(element.draggable).toBe(false);
    expect(element.spellcheck).toBe(true);
    expect(element.dataset.userId).toBe("42");
    expect(element.tabIndex).toBe(3);

    element.dataset.userId = "84";
    element.autofocus = true;
    element.contentEditable = "true";

    expect(element.getAttribute("data-user-id")).toBe("84");
    expect(element.hasAttribute("autofocus")).toBe(true);
    expect(element.isContentEditable).toBe(true);
  });

  it("implements metadata element members", () => {
    const document = parse(`
      <base href="https://example.com/path" target="_blank">
      <link href="https://example.com/style.css" rel="stylesheet preload" disabled>
      <meta name="description" http-equiv="refresh" content="value" media="screen">
      <style media="print" blocking="render"></style>
    `);
    const link = select(document, "link");
    const meta = select(document, "meta");

    expect(select(document, "base")).toMatchObject({
      href: "https://example.com/path",
      target: "_blank",
    });
    expect(link).toBeInstanceOf(HTMLLinkElement);
    expect(link).toMatchObject({
      href: "https://example.com/style.css",
      rel: "stylesheet preload",
      disabled: true,
    });
    expect((link as HTMLLinkElement).relList.contains("preload")).toBe(true);
    expect(meta).toBeInstanceOf(HTMLMetaElement);
    expect(meta).toMatchObject({
      name: "description",
      httpEquiv: "refresh",
      content: "value",
      media: "screen",
    });
  });

  it("implements hyperlink members and URL decomposition", () => {
    const anchor = select(
      parse(
        '<a href="https://user:pass@example.com:8443/path?q=1#part" download="file" rel="next">text</a>',
      ),
      "a",
    );
    if (!(anchor instanceof HTMLAnchorElement)) {
      throw new Error("a is not an HTMLAnchorElement");
    }

    expect(anchor.origin).toBe("https://example.com:8443");
    expect(anchor.protocol).toBe("https:");
    expect(anchor.username).toBe("user");
    expect(anchor.password).toBe("pass");
    expect(anchor.host).toBe("example.com:8443");
    expect(anchor.pathname).toBe("/path");
    expect(anchor.search).toBe("?q=1");
    expect(anchor.hash).toBe("#part");
    expect(anchor.text).toBe("text");

    anchor.hostname = "example.org";
    anchor.text = "next";

    expect(anchor.href).toContain("example.org");
    expect(anchor.textContent).toBe("next");
  });

  it("implements image, media, and track members", () => {
    const document = parse(`
      <img src="https://example.com/a.png" alt="a" width="320" height="240" ismap>
      <video src="movie.mp4" controls autoplay loop muted></video>
      <track kind="captions" src="captions.vtt" srclang="en" label="English" default>
    `);
    const image = select(document, "img");
    const media = select(document, "video");
    const track = select(document, "track");
    if (!(image instanceof HTMLImageElement)) {
      throw new Error("img is not an HTMLImageElement");
    }
    if (!(media instanceof HTMLMediaElement)) {
      throw new Error("video is not an HTMLMediaElement");
    }
    if (!(track instanceof HTMLTrackElement)) {
      throw new Error("track is not an HTMLTrackElement");
    }

    expect(image).toMatchObject({ alt: "a", width: 320, height: 240 });
    expect(image.isMap).toBe(true);
    expect(media.controls).toBe(true);
    expect(media.autoplay).toBe(true);
    expect(media.loop).toBe(true);
    expect(media.paused).toBe(true);
    expect(media.volume).toBe(1);
    expect(media.canPlayType("video/unknown")).toBe("");
    expect(media.audioTracks.length).toBe(0);
    expect(media.videoTracks.length).toBe(0);
    expect(media.textTracks.length).toBe(0);
    expect(media.addTextTrack("captions", "English", "en").label).toBe(
      "English",
    );
    expect(media.textTracks.length).toBe(1);
    expect(track.kind).toBe("captions");
    expect(track.srclang).toBe("en");
    expect(track.default).toBe(true);
  });

  it("implements link style and popover target mixins", () => {
    const document = parse(`
      <link rel="stylesheet"><style></style>
      <div id="popover" popover></div>
      <button id="button" popovertarget="popover" popovertargetaction="show"></button>
      <input id="input" popovertarget="popover" popovertargetaction="hide">
    `);
    const link = select(document, "link");
    const style = select(document, "style");
    const popover = select(document, "#popover");
    const button = select(document, "#button");
    const input = select(document, "#input");
    if (!(link instanceof HTMLLinkElement)) {
      throw new Error("link is not an HTMLLinkElement");
    }
    if (!(button instanceof HTMLButtonElement)) {
      throw new Error("button is not an HTMLButtonElement");
    }
    if (!(input instanceof HTMLInputElement)) {
      throw new Error("input is not an HTMLInputElement");
    }

    expect(link.sheet).toBe(null);
    expect("sheet" in style).toBe(true);
    expect(button.popoverTargetElement).toBe(popover);
    expect(button.popoverTargetAction).toBe("show");
    expect(input.popoverTargetElement).toBe(popover);
    expect(input.popoverTargetAction).toBe("hide");
  });

  it("implements the complete HTMLObjectElement member surface", () => {
    const object = select(
      parse(
        '<object archive="one.jar two.jar" code="Main" declare hspace="4" vspace="5" codebase="https://example.com/"></object>',
      ),
      "object",
    );
    if (!(object instanceof HTMLObjectElement)) {
      throw new Error("object is not an HTMLObjectElement");
    }

    expect(object.archive).toBe("one.jar two.jar");
    expect(object.code).toBe("Main");
    expect(object.declare).toBe(true);
    expect(object.hspace).toBe(4);
    expect(object.vspace).toBe(5);
    expect(object.codeBase).toBe("https://example.com/");
  });

  it("implements table structure mutation and indices", () => {
    const table = select(parse("<table></table>"), "table");
    if (!(table instanceof HTMLTableElement)) {
      throw new Error("table is not an HTMLTableElement");
    }

    const caption = table.createCaption();
    const head = table.createTHead();
    const body = table.createTBody();
    const row = body.insertRow();
    const cell = row.insertCell();

    expect(table.caption).toBe(caption);
    expect(table.tHead).toBe(head);
    expect(table.tBodies.length).toBe(1);
    expect(table.rows.length).toBe(1);
    expect(row).toBeInstanceOf(HTMLTableRowElement);
    expect(row.rowIndex).toBe(0);
    expect(cell).toBeInstanceOf(HTMLTableCellElement);
    expect(cell.cellIndex).toBe(0);

    row.deleteCell(0);
    expect(row.cells.length).toBe(0);
  });

  it("implements form controls and validation members", () => {
    const document = parse(`
      <form id="form" action="https://example.com/submit">
        <input id="input" name="field" required value="before">
        <button id="button" name="submitter" value="go">Go</button>
        <select id="select" name="choice">
          <option value="one">One</option><option id="two" value="two" selected>Two</option>
        </select>
        <textarea id="textarea">text</textarea>
      </form>
    `);
    const form = select(document, "#form");
    const input = select(document, "#input");
    const button = select(document, "#button");
    const selectElement = select(document, "#select");
    const option = select(document, "option[selected]");
    const textarea = select(document, "#textarea");
    if (!(form instanceof HTMLFormElement)) {
      throw new Error("form is not an HTMLFormElement");
    }
    if (!(input instanceof HTMLInputElement)) {
      throw new Error("input is not an HTMLInputElement");
    }
    if (!(button instanceof HTMLButtonElement)) {
      throw new Error("button is not an HTMLButtonElement");
    }
    if (!(selectElement instanceof HTMLSelectElement)) {
      throw new Error("select is not an HTMLSelectElement");
    }
    if (!(option instanceof HTMLOptionElement)) {
      throw new Error("option is not an HTMLOptionElement");
    }
    if (!(textarea instanceof HTMLTextAreaElement)) {
      throw new Error("textarea is not an HTMLTextAreaElement");
    }

    expect(form.elements.length).toBe(4);
    expect(input.form).toBe(form);
    expect(input.value).toBe("before");
    expect(input.checkValidity()).toBe(true);
    expect(button.form).toBe(form);
    expect(selectElement.options.length).toBe(2);
    expect(selectElement.options.namedItem("two")).toBe(option);
    expect(selectElement.selectedIndex).toBe(1);
    expect(selectElement.value).toBe("two");
    expect(option.index).toBe(1);
    expect(textarea.value).toBe("text");

    input.setCustomValidity("invalid");
    expect(input.validity.customError).toBe(true);
    expect(input.validationMessage).toBe("invalid");
    expect(form.checkValidity()).toBe(false);
  });

  it("keeps SameObject form collections stable", () => {
    const document = parse(`
      <form><fieldset><input></fieldset></form>
      <select><option selected></option></select>
      <datalist><option></option></datalist>
    `);
    const form = select(document, "form");
    const fieldset = select(document, "fieldset");
    const selectElement = select(document, "select");
    const datalist = select(document, "datalist");
    if (!(form instanceof HTMLFormElement)) {
      throw new Error("form is not an HTMLFormElement");
    }
    if (!(fieldset instanceof HTMLFieldSetElement)) {
      throw new Error("fieldset is not an HTMLFieldSetElement");
    }
    if (!(selectElement instanceof HTMLSelectElement)) {
      throw new Error("select is not an HTMLSelectElement");
    }
    if (!(datalist instanceof HTMLDataListElement)) {
      throw new Error("datalist is not an HTMLDataListElement");
    }

    expect(form.elements).toBe(form.elements);
    expect(fieldset.elements).toBe(fieldset.elements);
    expect(selectElement.options).toBe(selectElement.options);
    expect(selectElement.selectedOptions).toBe(selectElement.selectedOptions);
    expect(datalist.options).toBe(datalist.options);
  });

  it("implements progress, details, dialog, script, and canvas members", () => {
    const document = parse(`
      <progress value="0.5" max="2"></progress>
      <details name="group" open></details>
      <dialog></dialog>
      <script type="module">let value = 1;</script>
      <canvas width="640" height="480"></canvas>
    `);
    const progress = select(document, "progress");
    const details = select(document, "details");
    const dialog = select(document, "dialog");
    const script = select(document, "script");
    const canvas = select(document, "canvas");
    if (!(progress instanceof HTMLProgressElement)) {
      throw new Error("progress is not an HTMLProgressElement");
    }
    if (!(details instanceof HTMLDetailsElement)) {
      throw new Error("details is not an HTMLDetailsElement");
    }
    if (!(dialog instanceof HTMLDialogElement)) {
      throw new Error("dialog is not an HTMLDialogElement");
    }
    if (!(script instanceof HTMLScriptElement)) {
      throw new Error("script is not an HTMLScriptElement");
    }
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error("canvas is not an HTMLCanvasElement");
    }

    expect(progress.value).toBe(0.5);
    expect(progress.max).toBe(2);
    expect(progress.position).toBe(0.25);
    expect(details.name).toBe("group");
    expect(details.open).toBe(true);
    dialog.showModal();
    expect(dialog.open).toBe(true);
    dialog.close("done");
    expect(dialog.open).toBe(false);
    expect(dialog.returnValue).toBe("done");
    expect(script.text).toBe("let value = 1;");
    expect(HTMLScriptElement.supports("module")).toBe(true);
    expect(canvas.width).toBe(640);
    expect(canvas.height).toBe(480);
    expect(canvas.getContext("2d")).toBe(null);
  });

  it("applies Web IDL required argument checks", () => {
    const document = parse(`
      <table></table><video></video><input><select></select>
      <textarea></textarea><canvas></canvas>
    `);
    const methods = [
      [select(document, "table"), "deleteRow", []],
      [select(document, "video"), "canPlayType", []],
      [select(document, "input"), "setCustomValidity", []],
      [select(document, "select"), "namedItem", []],
      [select(document, "textarea"), "setSelectionRange", [0]],
      [select(document, "canvas"), "getContext", []],
    ] as const;

    for (const [receiver, name, arguments_] of methods) {
      expect(() => {
        const method: unknown = Reflect.get(receiver, name);
        if (typeof method !== "function") {
          throw new TypeError(`${name} is not a function`);
        }
        Reflect.apply(method, receiver, arguments_);
      }).toThrow(TypeError);
    }
  });
});
