import {
  Attr,
  Comment,
  Document,
  DocumentFragment,
  DOMStringMap,
  Element,
  HTMLElement,
  Node,
  ProcessingInstruction,
  Text,
  open,
} from "palim";
import type { OpenResult } from "palim";
import type { open as openWindow } from "@palim/window";
import { Window, createWindow } from "@palim/window/internal/window.js";

type Assert<T extends true> = T;
export type NodeHasNoRemove = Assert<
  "remove" extends keyof Node ? false : true
>;
export type OpenAPIsMatch = Assert<
  typeof open extends typeof openWindow
    ? typeof openWindow extends typeof open
      ? true
      : false
    : false
>;

export function verifyPublicConstructorTypes(): void {
  new Document();
  new DocumentFragment();
  new Text();
  new Comment();
  new ProcessingInstruction("target");
  createWindow();
  const openedFromURL: Promise<OpenResult> = open("https://example.test/");
  const openedFromHTML: Promise<OpenResult> = open({
    html: "<p></p>",
    baseURL: "https://example.test/",
  });
  const openedWithScripting: Promise<OpenResult> = open(
    "https://example.test/",
    { scripting: "enabled" },
  );
  void openedFromURL;
  void openedFromHTML;
  void openedWithScripting;

  // @ts-expect-error URL loading does not accept HTML options as a second argument.
  void open("https://example.test/", { html: "<p></p>" });

  // @ts-expect-error Attr has no Web IDL constructor.
  new Attr();
  // @ts-expect-error DOMStringMap has no Web IDL constructor.
  new DOMStringMap();
  // @ts-expect-error Element has no Web IDL constructor.
  new Element();
  // @ts-expect-error HTMLElement uses the HTML construction algorithm.
  new HTMLElement();
  // @ts-expect-error Node has no Web IDL constructor.
  new Node();
  // @ts-expect-error Window has no Web IDL constructor.
  new Window();

  const attribute = null as unknown as Attr;
  // @ts-expect-error Attr.name is readonly.
  attribute.name = "renamed";

  const element = null as unknown as HTMLElement;
  element.onclick = null;
  // @ts-expect-error Arbitrary event handler properties are not exposed.
  element.onpalim = null;
}
