const htmlElementInterfaces = [
  ["HTMLUnknownElement", "bgsound"],
  ["HTMLHtmlElement", "html"],
  ["HTMLHeadElement", "head"],
  ["HTMLTitleElement", "title"],
  ["HTMLPreElement", "pre"],
  ["HTMLHeadingElement", "h1"],
  ["HTMLParagraphElement", "p"],
  ["HTMLHRElement", "hr"],
  ["HTMLOListElement", "ol"],
  ["HTMLUListElement", "ul"],
  ["HTMLMenuElement", "menu"],
  ["HTMLLIElement", "li"],
  ["HTMLDListElement", "dl"],
  ["HTMLDivElement", "div"],
  ["HTMLDataElement", "data"],
  ["HTMLTimeElement", "time"],
  ["HTMLSpanElement", "span"],
  ["HTMLBRElement", "br"],
  ["HTMLTemplateElement", "template"],
  ["HTMLPictureElement", "picture"],
  ["HTMLSourceElement", "source"],
  ["HTMLBaseElement", "base"],
  ["HTMLLinkElement", "link"],
  ["HTMLMetaElement", "meta"],
  ["HTMLStyleElement", "style"],
  ["HTMLBodyElement", "body"],
  ["HTMLQuoteElement", "blockquote"],
  ["HTMLAnchorElement", "a"],
  ["HTMLModElement", "ins"],
  ["HTMLImageElement", "img"],
  ["HTMLIFrameElement", "iframe"],
  ["HTMLEmbedElement", "embed"],
  ["HTMLObjectElement", "object"],
  ["HTMLMediaElement", null],
  ["HTMLVideoElement", "video"],
  ["HTMLAudioElement", "audio"],
  ["HTMLTrackElement", "track"],
  ["HTMLMapElement", "map"],
  ["HTMLAreaElement", "area"],
  ["HTMLTableElement", "table"],
  ["HTMLTableCaptionElement", "caption"],
  ["HTMLTableColElement", "col"],
  ["HTMLTableSectionElement", "tbody"],
  ["HTMLTableRowElement", "tr"],
  ["HTMLTableCellElement", "td"],
  ["HTMLFormElement", "form"],
  ["HTMLLabelElement", "label"],
  ["HTMLInputElement", "input"],
  ["HTMLButtonElement", "button"],
  ["HTMLSelectElement", "select"],
  ["HTMLDataListElement", "datalist"],
  ["HTMLOptGroupElement", "optgroup"],
  ["HTMLOptionElement", "option"],
  ["HTMLTextAreaElement", "textarea"],
  ["HTMLOutputElement", "output"],
  ["HTMLProgressElement", "progress"],
  ["HTMLMeterElement", "meter"],
  ["HTMLFieldSetElement", "fieldset"],
  ["HTMLLegendElement", "legend"],
  ["HTMLSelectedContentElement", "selectedcontent"],
  ["HTMLDetailsElement", "details"],
  ["HTMLDialogElement", "dialog"],
  ["HTMLScriptElement", "script"],
  ["HTMLSlotElement", "slot"],
  ["HTMLCanvasElement", "canvas"],
  ["HTMLMarqueeElement", "marquee"],
  ["HTMLFrameSetElement", "frameset"],
  ["HTMLFrameElement", "frame"],
  ["HTMLDirectoryElement", "dir"],
  ["HTMLFontElement", "font"],
  ["HTMLParamElement", "param"],
];

if (htmlElementInterfaces.length !== 71) {
  throw new Error("The HTML element interface test list is incomplete");
}

for (const [name, localName] of htmlElementInterfaces) {
  const interfaceConstructor = globalThis[name];
  if (typeof interfaceConstructor !== "function") {
    throw new Error(`${name} is not exposed`);
  }
  const parentConstructor =
    name === "HTMLAudioElement" || name === "HTMLVideoElement"
      ? HTMLMediaElement
      : HTMLElement;
  if (
    Object.getPrototypeOf(interfaceConstructor.prototype) !==
    parentConstructor.prototype
  ) {
    throw new Error(`${name} has the wrong prototype parent`);
  }
  if (localName === null) {
    continue;
  }
  const element = testDocument.createElement(localName);
  if (!(element instanceof interfaceConstructor)) {
    throw new Error(`${localName} is not an instance of ${name}`);
  }
  if (Object.getPrototypeOf(element) !== interfaceConstructor.prototype) {
    throw new Error(`${localName} does not use ${name}.prototype`);
  }
  if (element.constructor !== interfaceConstructor) {
    throw new Error(`${localName}.constructor is not ${name}`);
  }
}
