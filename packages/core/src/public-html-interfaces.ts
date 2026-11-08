import * as HTML from "./html-elements.js";

interface NonConstructibleInterface<T> {
  readonly length: 0;
  readonly name: string;
  readonly prototype: T;
  [Symbol.hasInstance](value: unknown): value is T;
}

// The caller supplies the public value-side type for this runtime boundary.
// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
function exposeInterface<T>(value: object): T {
  Object.defineProperty(value, "length", { configurable: true, value: 0 });
  return value as T;
}

export type EventHandler = HTML.EventHandler;

export type CSSStyleDeclaration = HTML.CSSStyleDeclaration;
interface CSSStyleDeclarationInterface extends NonConstructibleInterface<CSSStyleDeclaration> {
  readonly name: "CSSStyleDeclaration";
}
export const CSSStyleDeclaration =
  exposeInterface<CSSStyleDeclarationInterface>(HTML.CSSStyleDeclaration);

export type CSSStyleProperties = HTML.CSSStyleProperties;
interface CSSStylePropertiesInterface extends NonConstructibleInterface<CSSStyleProperties> {
  readonly name: "CSSStyleProperties";
}
export const CSSStyleProperties = exposeInterface<CSSStylePropertiesInterface>(
  HTML.CSSStyleProperties,
);

export type AudioTrack = HTML.AudioTrack;
interface AudioTrackInterface extends NonConstructibleInterface<AudioTrack> {
  readonly name: "AudioTrack";
}
export const AudioTrack = exposeInterface<AudioTrackInterface>(HTML.AudioTrack);

export type AudioTrackList = HTML.AudioTrackList;
interface AudioTrackListInterface extends NonConstructibleInterface<AudioTrackList> {
  readonly name: "AudioTrackList";
}
export const AudioTrackList = exposeInterface<AudioTrackListInterface>(
  HTML.AudioTrackList,
);

export type DOMStringMap = HTML.DOMStringMap;
interface DOMStringMapInterface extends NonConstructibleInterface<DOMStringMap> {
  readonly name: "DOMStringMap";
}
export const DOMStringMap = exposeInterface<DOMStringMapInterface>(
  HTML.DOMStringMap,
);

export type HTMLAnchorElement = HTML.HTMLAnchorElement;
interface HTMLAnchorElementInterface extends NonConstructibleInterface<HTMLAnchorElement> {
  readonly name: "HTMLAnchorElement";
}
export const HTMLAnchorElement = exposeInterface<HTMLAnchorElementInterface>(
  HTML.HTMLAnchorElement,
);

export type HTMLAreaElement = HTML.HTMLAreaElement;
interface HTMLAreaElementInterface extends NonConstructibleInterface<HTMLAreaElement> {
  readonly name: "HTMLAreaElement";
}
export const HTMLAreaElement = exposeInterface<HTMLAreaElementInterface>(
  HTML.HTMLAreaElement,
);

export type HTMLAudioElement = HTML.HTMLAudioElement;
interface HTMLAudioElementInterface extends NonConstructibleInterface<HTMLAudioElement> {
  readonly name: "HTMLAudioElement";
}
export const HTMLAudioElement = exposeInterface<HTMLAudioElementInterface>(
  HTML.HTMLAudioElement,
);

export type HTMLBaseElement = HTML.HTMLBaseElement;
interface HTMLBaseElementInterface extends NonConstructibleInterface<HTMLBaseElement> {
  readonly name: "HTMLBaseElement";
}
export const HTMLBaseElement = exposeInterface<HTMLBaseElementInterface>(
  HTML.HTMLBaseElement,
);

export type HTMLBodyElement = HTML.HTMLBodyElement;
interface HTMLBodyElementInterface extends NonConstructibleInterface<HTMLBodyElement> {
  readonly name: "HTMLBodyElement";
}
export const HTMLBodyElement = exposeInterface<HTMLBodyElementInterface>(
  HTML.HTMLBodyElement,
);

export type HTMLBRElement = HTML.HTMLBRElement;
interface HTMLBRElementInterface extends NonConstructibleInterface<HTMLBRElement> {
  readonly name: "HTMLBRElement";
}
export const HTMLBRElement = exposeInterface<HTMLBRElementInterface>(
  HTML.HTMLBRElement,
);

export type HTMLButtonElement = HTML.HTMLButtonElement;
interface HTMLButtonElementInterface extends NonConstructibleInterface<HTMLButtonElement> {
  readonly name: "HTMLButtonElement";
}
export const HTMLButtonElement = exposeInterface<HTMLButtonElementInterface>(
  HTML.HTMLButtonElement,
);

export type HTMLCanvasElement = HTML.HTMLCanvasElement;
interface HTMLCanvasElementInterface extends NonConstructibleInterface<HTMLCanvasElement> {
  readonly name: "HTMLCanvasElement";
}
export const HTMLCanvasElement = exposeInterface<HTMLCanvasElementInterface>(
  HTML.HTMLCanvasElement,
);

export type HTMLDListElement = HTML.HTMLDListElement;
interface HTMLDListElementInterface extends NonConstructibleInterface<HTMLDListElement> {
  readonly name: "HTMLDListElement";
}
export const HTMLDListElement = exposeInterface<HTMLDListElementInterface>(
  HTML.HTMLDListElement,
);

export type HTMLDataElement = HTML.HTMLDataElement;
interface HTMLDataElementInterface extends NonConstructibleInterface<HTMLDataElement> {
  readonly name: "HTMLDataElement";
}
export const HTMLDataElement = exposeInterface<HTMLDataElementInterface>(
  HTML.HTMLDataElement,
);

export type HTMLDataListElement = HTML.HTMLDataListElement;
interface HTMLDataListElementInterface extends NonConstructibleInterface<HTMLDataListElement> {
  readonly name: "HTMLDataListElement";
}
export const HTMLDataListElement =
  exposeInterface<HTMLDataListElementInterface>(HTML.HTMLDataListElement);

export type HTMLDetailsElement = HTML.HTMLDetailsElement;
interface HTMLDetailsElementInterface extends NonConstructibleInterface<HTMLDetailsElement> {
  readonly name: "HTMLDetailsElement";
}
export const HTMLDetailsElement = exposeInterface<HTMLDetailsElementInterface>(
  HTML.HTMLDetailsElement,
);

export type HTMLDialogElement = HTML.HTMLDialogElement;
interface HTMLDialogElementInterface extends NonConstructibleInterface<HTMLDialogElement> {
  readonly name: "HTMLDialogElement";
}
export const HTMLDialogElement = exposeInterface<HTMLDialogElementInterface>(
  HTML.HTMLDialogElement,
);

export type HTMLDirectoryElement = HTML.HTMLDirectoryElement;
interface HTMLDirectoryElementInterface extends NonConstructibleInterface<HTMLDirectoryElement> {
  readonly name: "HTMLDirectoryElement";
}
export const HTMLDirectoryElement =
  exposeInterface<HTMLDirectoryElementInterface>(HTML.HTMLDirectoryElement);

export type HTMLDivElement = HTML.HTMLDivElement;
interface HTMLDivElementInterface extends NonConstructibleInterface<HTMLDivElement> {
  readonly name: "HTMLDivElement";
}
export const HTMLDivElement = exposeInterface<HTMLDivElementInterface>(
  HTML.HTMLDivElement,
);

export type HTMLElement = HTML.HTMLElement & HTML.GlobalEventHandlers;
interface HTMLElementInterface extends NonConstructibleInterface<HTMLElement> {
  readonly name: "HTMLElement";
}
export const HTMLElement = exposeInterface<HTMLElementInterface>(
  HTML.HTMLElement,
);

export type HTMLEmbedElement = HTML.HTMLEmbedElement;
interface HTMLEmbedElementInterface extends NonConstructibleInterface<HTMLEmbedElement> {
  readonly name: "HTMLEmbedElement";
}
export const HTMLEmbedElement = exposeInterface<HTMLEmbedElementInterface>(
  HTML.HTMLEmbedElement,
);

export type HTMLFieldSetElement = HTML.HTMLFieldSetElement;
interface HTMLFieldSetElementInterface extends NonConstructibleInterface<HTMLFieldSetElement> {
  readonly name: "HTMLFieldSetElement";
}
export const HTMLFieldSetElement =
  exposeInterface<HTMLFieldSetElementInterface>(HTML.HTMLFieldSetElement);

export type HTMLFontElement = HTML.HTMLFontElement;
interface HTMLFontElementInterface extends NonConstructibleInterface<HTMLFontElement> {
  readonly name: "HTMLFontElement";
}
export const HTMLFontElement = exposeInterface<HTMLFontElementInterface>(
  HTML.HTMLFontElement,
);

export type HTMLFormElement = HTML.HTMLFormElement;
interface HTMLFormElementInterface extends NonConstructibleInterface<HTMLFormElement> {
  readonly name: "HTMLFormElement";
}
export const HTMLFormElement = exposeInterface<HTMLFormElementInterface>(
  HTML.HTMLFormElement,
);

export type HTMLFormControlsCollection = HTML.HTMLFormControlsCollection;
interface HTMLFormControlsCollectionInterface extends NonConstructibleInterface<HTMLFormControlsCollection> {
  readonly name: "HTMLFormControlsCollection";
}
export const HTMLFormControlsCollection =
  exposeInterface<HTMLFormControlsCollectionInterface>(
    HTML.HTMLFormControlsCollection,
  );

export type HTMLFrameElement = HTML.HTMLFrameElement;
interface HTMLFrameElementInterface extends NonConstructibleInterface<HTMLFrameElement> {
  readonly name: "HTMLFrameElement";
}
export const HTMLFrameElement = exposeInterface<HTMLFrameElementInterface>(
  HTML.HTMLFrameElement,
);

export type HTMLFrameSetElement = HTML.HTMLFrameSetElement;
interface HTMLFrameSetElementInterface extends NonConstructibleInterface<HTMLFrameSetElement> {
  readonly name: "HTMLFrameSetElement";
}
export const HTMLFrameSetElement =
  exposeInterface<HTMLFrameSetElementInterface>(HTML.HTMLFrameSetElement);

export type HTMLHeadElement = HTML.HTMLHeadElement;
interface HTMLHeadElementInterface extends NonConstructibleInterface<HTMLHeadElement> {
  readonly name: "HTMLHeadElement";
}
export const HTMLHeadElement = exposeInterface<HTMLHeadElementInterface>(
  HTML.HTMLHeadElement,
);

export type HTMLHeadingElement = HTML.HTMLHeadingElement;
interface HTMLHeadingElementInterface extends NonConstructibleInterface<HTMLHeadingElement> {
  readonly name: "HTMLHeadingElement";
}
export const HTMLHeadingElement = exposeInterface<HTMLHeadingElementInterface>(
  HTML.HTMLHeadingElement,
);

export type HTMLHRElement = HTML.HTMLHRElement;
interface HTMLHRElementInterface extends NonConstructibleInterface<HTMLHRElement> {
  readonly name: "HTMLHRElement";
}
export const HTMLHRElement = exposeInterface<HTMLHRElementInterface>(
  HTML.HTMLHRElement,
);

export type HTMLHtmlElement = HTML.HTMLHtmlElement;
interface HTMLHtmlElementInterface extends NonConstructibleInterface<HTMLHtmlElement> {
  readonly name: "HTMLHtmlElement";
}
export const HTMLHtmlElement = exposeInterface<HTMLHtmlElementInterface>(
  HTML.HTMLHtmlElement,
);

export type HTMLIFrameElement = HTML.HTMLIFrameElement;
interface HTMLIFrameElementInterface extends NonConstructibleInterface<HTMLIFrameElement> {
  readonly name: "HTMLIFrameElement";
}
export const HTMLIFrameElement = exposeInterface<HTMLIFrameElementInterface>(
  HTML.HTMLIFrameElement,
);

export type HTMLImageElement = HTML.HTMLImageElement;
interface HTMLImageElementInterface extends NonConstructibleInterface<HTMLImageElement> {
  readonly name: "HTMLImageElement";
}
export const HTMLImageElement = exposeInterface<HTMLImageElementInterface>(
  HTML.HTMLImageElement,
);

export type HTMLInputElement = HTML.HTMLInputElement;
interface HTMLInputElementInterface extends NonConstructibleInterface<HTMLInputElement> {
  readonly name: "HTMLInputElement";
}
export const HTMLInputElement = exposeInterface<HTMLInputElementInterface>(
  HTML.HTMLInputElement,
);

export type HTMLLabelElement = HTML.HTMLLabelElement;
interface HTMLLabelElementInterface extends NonConstructibleInterface<HTMLLabelElement> {
  readonly name: "HTMLLabelElement";
}
export const HTMLLabelElement = exposeInterface<HTMLLabelElementInterface>(
  HTML.HTMLLabelElement,
);

export type HTMLLegendElement = HTML.HTMLLegendElement;
interface HTMLLegendElementInterface extends NonConstructibleInterface<HTMLLegendElement> {
  readonly name: "HTMLLegendElement";
}
export const HTMLLegendElement = exposeInterface<HTMLLegendElementInterface>(
  HTML.HTMLLegendElement,
);

export type HTMLLIElement = HTML.HTMLLIElement;
interface HTMLLIElementInterface extends NonConstructibleInterface<HTMLLIElement> {
  readonly name: "HTMLLIElement";
}
export const HTMLLIElement = exposeInterface<HTMLLIElementInterface>(
  HTML.HTMLLIElement,
);

export type HTMLLinkElement = HTML.HTMLLinkElement;
interface HTMLLinkElementInterface extends NonConstructibleInterface<HTMLLinkElement> {
  readonly name: "HTMLLinkElement";
}
export const HTMLLinkElement = exposeInterface<HTMLLinkElementInterface>(
  HTML.HTMLLinkElement,
);

export type HTMLMapElement = HTML.HTMLMapElement;
interface HTMLMapElementInterface extends NonConstructibleInterface<HTMLMapElement> {
  readonly name: "HTMLMapElement";
}
export const HTMLMapElement = exposeInterface<HTMLMapElementInterface>(
  HTML.HTMLMapElement,
);

export type HTMLMarqueeElement = HTML.HTMLMarqueeElement;
interface HTMLMarqueeElementInterface extends NonConstructibleInterface<HTMLMarqueeElement> {
  readonly name: "HTMLMarqueeElement";
}
export const HTMLMarqueeElement = exposeInterface<HTMLMarqueeElementInterface>(
  HTML.HTMLMarqueeElement,
);

export type HTMLMediaElement = HTML.HTMLMediaElement;
interface HTMLMediaElementInterface extends NonConstructibleInterface<HTMLMediaElement> {
  readonly name: "HTMLMediaElement";
  readonly NETWORK_EMPTY: 0;
  readonly NETWORK_IDLE: 1;
  readonly NETWORK_LOADING: 2;
  readonly NETWORK_NO_SOURCE: 3;
  readonly HAVE_NOTHING: 0;
  readonly HAVE_METADATA: 1;
  readonly HAVE_CURRENT_DATA: 2;
  readonly HAVE_FUTURE_DATA: 3;
  readonly HAVE_ENOUGH_DATA: 4;
}
export const HTMLMediaElement = exposeInterface<HTMLMediaElementInterface>(
  HTML.HTMLMediaElement,
);

export type HTMLMenuElement = HTML.HTMLMenuElement;
interface HTMLMenuElementInterface extends NonConstructibleInterface<HTMLMenuElement> {
  readonly name: "HTMLMenuElement";
}
export const HTMLMenuElement = exposeInterface<HTMLMenuElementInterface>(
  HTML.HTMLMenuElement,
);

export type HTMLMetaElement = HTML.HTMLMetaElement;
interface HTMLMetaElementInterface extends NonConstructibleInterface<HTMLMetaElement> {
  readonly name: "HTMLMetaElement";
}
export const HTMLMetaElement = exposeInterface<HTMLMetaElementInterface>(
  HTML.HTMLMetaElement,
);

export type HTMLMeterElement = HTML.HTMLMeterElement;
interface HTMLMeterElementInterface extends NonConstructibleInterface<HTMLMeterElement> {
  readonly name: "HTMLMeterElement";
}
export const HTMLMeterElement = exposeInterface<HTMLMeterElementInterface>(
  HTML.HTMLMeterElement,
);

export type HTMLModElement = HTML.HTMLModElement;
interface HTMLModElementInterface extends NonConstructibleInterface<HTMLModElement> {
  readonly name: "HTMLModElement";
}
export const HTMLModElement = exposeInterface<HTMLModElementInterface>(
  HTML.HTMLModElement,
);

export type HTMLObjectElement = HTML.HTMLObjectElement;
interface HTMLObjectElementInterface extends NonConstructibleInterface<HTMLObjectElement> {
  readonly name: "HTMLObjectElement";
}
export const HTMLObjectElement = exposeInterface<HTMLObjectElementInterface>(
  HTML.HTMLObjectElement,
);

export type HTMLOListElement = HTML.HTMLOListElement;
interface HTMLOListElementInterface extends NonConstructibleInterface<HTMLOListElement> {
  readonly name: "HTMLOListElement";
}
export const HTMLOListElement = exposeInterface<HTMLOListElementInterface>(
  HTML.HTMLOListElement,
);

export type HTMLOptGroupElement = HTML.HTMLOptGroupElement;
interface HTMLOptGroupElementInterface extends NonConstructibleInterface<HTMLOptGroupElement> {
  readonly name: "HTMLOptGroupElement";
}
export const HTMLOptGroupElement =
  exposeInterface<HTMLOptGroupElementInterface>(HTML.HTMLOptGroupElement);

export type HTMLOptionElement = HTML.HTMLOptionElement;
interface HTMLOptionElementInterface extends NonConstructibleInterface<HTMLOptionElement> {
  readonly name: "HTMLOptionElement";
}
export const HTMLOptionElement = exposeInterface<HTMLOptionElementInterface>(
  HTML.HTMLOptionElement,
);

export type HTMLOptionsCollection = HTML.HTMLOptionsCollection;
interface HTMLOptionsCollectionInterface extends NonConstructibleInterface<HTMLOptionsCollection> {
  readonly name: "HTMLOptionsCollection";
}
export const HTMLOptionsCollection =
  exposeInterface<HTMLOptionsCollectionInterface>(HTML.HTMLOptionsCollection);

export type HTMLOutputElement = HTML.HTMLOutputElement;
interface HTMLOutputElementInterface extends NonConstructibleInterface<HTMLOutputElement> {
  readonly name: "HTMLOutputElement";
}
export const HTMLOutputElement = exposeInterface<HTMLOutputElementInterface>(
  HTML.HTMLOutputElement,
);

export type HTMLParamElement = HTML.HTMLParamElement;
interface HTMLParamElementInterface extends NonConstructibleInterface<HTMLParamElement> {
  readonly name: "HTMLParamElement";
}
export const HTMLParamElement = exposeInterface<HTMLParamElementInterface>(
  HTML.HTMLParamElement,
);

export type HTMLParagraphElement = HTML.HTMLParagraphElement;
interface HTMLParagraphElementInterface extends NonConstructibleInterface<HTMLParagraphElement> {
  readonly name: "HTMLParagraphElement";
}
export const HTMLParagraphElement =
  exposeInterface<HTMLParagraphElementInterface>(HTML.HTMLParagraphElement);

export type HTMLPictureElement = HTML.HTMLPictureElement;
interface HTMLPictureElementInterface extends NonConstructibleInterface<HTMLPictureElement> {
  readonly name: "HTMLPictureElement";
}
export const HTMLPictureElement = exposeInterface<HTMLPictureElementInterface>(
  HTML.HTMLPictureElement,
);

export type HTMLPreElement = HTML.HTMLPreElement;
interface HTMLPreElementInterface extends NonConstructibleInterface<HTMLPreElement> {
  readonly name: "HTMLPreElement";
}
export const HTMLPreElement = exposeInterface<HTMLPreElementInterface>(
  HTML.HTMLPreElement,
);

export type HTMLProgressElement = HTML.HTMLProgressElement;
interface HTMLProgressElementInterface extends NonConstructibleInterface<HTMLProgressElement> {
  readonly name: "HTMLProgressElement";
}
export const HTMLProgressElement =
  exposeInterface<HTMLProgressElementInterface>(HTML.HTMLProgressElement);

export type HTMLQuoteElement = HTML.HTMLQuoteElement;
interface HTMLQuoteElementInterface extends NonConstructibleInterface<HTMLQuoteElement> {
  readonly name: "HTMLQuoteElement";
}
export const HTMLQuoteElement = exposeInterface<HTMLQuoteElementInterface>(
  HTML.HTMLQuoteElement,
);

export type HTMLScriptElement = HTML.HTMLScriptElement;
interface HTMLScriptElementInterface extends NonConstructibleInterface<HTMLScriptElement> {
  readonly name: "HTMLScriptElement";
  supports(type: string): boolean;
}
export const HTMLScriptElement = exposeInterface<HTMLScriptElementInterface>(
  HTML.HTMLScriptElement,
);

export type HTMLSelectElement = HTML.HTMLSelectElement;
interface HTMLSelectElementInterface extends NonConstructibleInterface<HTMLSelectElement> {
  readonly name: "HTMLSelectElement";
}
export const HTMLSelectElement = exposeInterface<HTMLSelectElementInterface>(
  HTML.HTMLSelectElement,
);

export type HTMLSelectedContentElement = HTML.HTMLSelectedContentElement;
interface HTMLSelectedContentElementInterface extends NonConstructibleInterface<HTMLSelectedContentElement> {
  readonly name: "HTMLSelectedContentElement";
}
export const HTMLSelectedContentElement =
  exposeInterface<HTMLSelectedContentElementInterface>(
    HTML.HTMLSelectedContentElement,
  );

export type HTMLSlotElement = HTML.HTMLSlotElement;
interface HTMLSlotElementInterface extends NonConstructibleInterface<HTMLSlotElement> {
  readonly name: "HTMLSlotElement";
}
export const HTMLSlotElement = exposeInterface<HTMLSlotElementInterface>(
  HTML.HTMLSlotElement,
);

export type HTMLSourceElement = HTML.HTMLSourceElement;
interface HTMLSourceElementInterface extends NonConstructibleInterface<HTMLSourceElement> {
  readonly name: "HTMLSourceElement";
}
export const HTMLSourceElement = exposeInterface<HTMLSourceElementInterface>(
  HTML.HTMLSourceElement,
);

export type HTMLSpanElement = HTML.HTMLSpanElement;
interface HTMLSpanElementInterface extends NonConstructibleInterface<HTMLSpanElement> {
  readonly name: "HTMLSpanElement";
}
export const HTMLSpanElement = exposeInterface<HTMLSpanElementInterface>(
  HTML.HTMLSpanElement,
);

export type HTMLStyleElement = HTML.HTMLStyleElement;
interface HTMLStyleElementInterface extends NonConstructibleInterface<HTMLStyleElement> {
  readonly name: "HTMLStyleElement";
}
export const HTMLStyleElement = exposeInterface<HTMLStyleElementInterface>(
  HTML.HTMLStyleElement,
);

export type HTMLTableCaptionElement = HTML.HTMLTableCaptionElement;
interface HTMLTableCaptionElementInterface extends NonConstructibleInterface<HTMLTableCaptionElement> {
  readonly name: "HTMLTableCaptionElement";
}
export const HTMLTableCaptionElement =
  exposeInterface<HTMLTableCaptionElementInterface>(
    HTML.HTMLTableCaptionElement,
  );

export type HTMLTableCellElement = HTML.HTMLTableCellElement;
interface HTMLTableCellElementInterface extends NonConstructibleInterface<HTMLTableCellElement> {
  readonly name: "HTMLTableCellElement";
}
export const HTMLTableCellElement =
  exposeInterface<HTMLTableCellElementInterface>(HTML.HTMLTableCellElement);

export type HTMLTableColElement = HTML.HTMLTableColElement;
interface HTMLTableColElementInterface extends NonConstructibleInterface<HTMLTableColElement> {
  readonly name: "HTMLTableColElement";
}
export const HTMLTableColElement =
  exposeInterface<HTMLTableColElementInterface>(HTML.HTMLTableColElement);

export type HTMLTableElement = HTML.HTMLTableElement;
interface HTMLTableElementInterface extends NonConstructibleInterface<HTMLTableElement> {
  readonly name: "HTMLTableElement";
}
export const HTMLTableElement = exposeInterface<HTMLTableElementInterface>(
  HTML.HTMLTableElement,
);

export type HTMLTableRowElement = HTML.HTMLTableRowElement;
interface HTMLTableRowElementInterface extends NonConstructibleInterface<HTMLTableRowElement> {
  readonly name: "HTMLTableRowElement";
}
export const HTMLTableRowElement =
  exposeInterface<HTMLTableRowElementInterface>(HTML.HTMLTableRowElement);

export type HTMLTableSectionElement = HTML.HTMLTableSectionElement;
interface HTMLTableSectionElementInterface extends NonConstructibleInterface<HTMLTableSectionElement> {
  readonly name: "HTMLTableSectionElement";
}
export const HTMLTableSectionElement =
  exposeInterface<HTMLTableSectionElementInterface>(
    HTML.HTMLTableSectionElement,
  );

export type HTMLTemplateElement = HTML.HTMLTemplateElement;
interface HTMLTemplateElementInterface extends NonConstructibleInterface<HTMLTemplateElement> {
  readonly name: "HTMLTemplateElement";
}
export const HTMLTemplateElement =
  exposeInterface<HTMLTemplateElementInterface>(HTML.HTMLTemplateElement);

export type HTMLTextAreaElement = HTML.HTMLTextAreaElement;
interface HTMLTextAreaElementInterface extends NonConstructibleInterface<HTMLTextAreaElement> {
  readonly name: "HTMLTextAreaElement";
}
export const HTMLTextAreaElement =
  exposeInterface<HTMLTextAreaElementInterface>(HTML.HTMLTextAreaElement);

export type HTMLTimeElement = HTML.HTMLTimeElement;
interface HTMLTimeElementInterface extends NonConstructibleInterface<HTMLTimeElement> {
  readonly name: "HTMLTimeElement";
}
export const HTMLTimeElement = exposeInterface<HTMLTimeElementInterface>(
  HTML.HTMLTimeElement,
);

export type HTMLTitleElement = HTML.HTMLTitleElement;
interface HTMLTitleElementInterface extends NonConstructibleInterface<HTMLTitleElement> {
  readonly name: "HTMLTitleElement";
}
export const HTMLTitleElement = exposeInterface<HTMLTitleElementInterface>(
  HTML.HTMLTitleElement,
);

export type HTMLTrackElement = HTML.HTMLTrackElement;
interface HTMLTrackElementInterface extends NonConstructibleInterface<HTMLTrackElement> {
  readonly name: "HTMLTrackElement";
  readonly NONE: 0;
  readonly LOADING: 1;
  readonly LOADED: 2;
  readonly ERROR: 3;
}
export const HTMLTrackElement = exposeInterface<HTMLTrackElementInterface>(
  HTML.HTMLTrackElement,
);

export type HTMLUListElement = HTML.HTMLUListElement;
interface HTMLUListElementInterface extends NonConstructibleInterface<HTMLUListElement> {
  readonly name: "HTMLUListElement";
}
export const HTMLUListElement = exposeInterface<HTMLUListElementInterface>(
  HTML.HTMLUListElement,
);

export type HTMLUnknownElement = HTML.HTMLUnknownElement;
interface HTMLUnknownElementInterface extends NonConstructibleInterface<HTMLUnknownElement> {
  readonly name: "HTMLUnknownElement";
}
export const HTMLUnknownElement = exposeInterface<HTMLUnknownElementInterface>(
  HTML.HTMLUnknownElement,
);

export type HTMLVideoElement = HTML.HTMLVideoElement;
interface HTMLVideoElementInterface extends NonConstructibleInterface<HTMLVideoElement> {
  readonly name: "HTMLVideoElement";
}
export const HTMLVideoElement = exposeInterface<HTMLVideoElementInterface>(
  HTML.HTMLVideoElement,
);

export type RadioNodeList = HTML.RadioNodeList;
interface RadioNodeListInterface extends NonConstructibleInterface<RadioNodeList> {
  readonly name: "RadioNodeList";
}
export const RadioNodeList = exposeInterface<RadioNodeListInterface>(
  HTML.RadioNodeList,
);

export type TextTrack = HTML.TextTrack;
interface TextTrackInterface extends NonConstructibleInterface<TextTrack> {
  readonly name: "TextTrack";
}
export const TextTrack = exposeInterface<TextTrackInterface>(HTML.TextTrack);

export type TextTrackList = HTML.TextTrackList;
interface TextTrackListInterface extends NonConstructibleInterface<TextTrackList> {
  readonly name: "TextTrackList";
}
export const TextTrackList = exposeInterface<TextTrackListInterface>(
  HTML.TextTrackList,
);

export type TimeRanges = HTML.TimeRanges;
interface TimeRangesInterface extends NonConstructibleInterface<TimeRanges> {
  readonly name: "TimeRanges";
}
export const TimeRanges = exposeInterface<TimeRangesInterface>(HTML.TimeRanges);

export type ValidityState = HTML.ValidityState;
interface ValidityStateInterface extends NonConstructibleInterface<ValidityState> {
  readonly name: "ValidityState";
}
export const ValidityState = exposeInterface<ValidityStateInterface>(
  HTML.ValidityState,
);

export type VideoTrack = HTML.VideoTrack;
interface VideoTrackInterface extends NonConstructibleInterface<VideoTrack> {
  readonly name: "VideoTrack";
}
export const VideoTrack = exposeInterface<VideoTrackInterface>(HTML.VideoTrack);

export type VideoTrackList = HTML.VideoTrackList;
interface VideoTrackListInterface extends NonConstructibleInterface<VideoTrackList> {
  readonly name: "VideoTrackList";
}
export const VideoTrackList = exposeInterface<VideoTrackListInterface>(
  HTML.VideoTrackList,
);
