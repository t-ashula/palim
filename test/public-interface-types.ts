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
} from "../src/index.js";
import { Window, createWindow } from "../src/window.js";

type Assert<T extends true> = T;
export type NodeHasNoRemove = Assert<
  "remove" extends keyof Node ? false : true
>;

export function verifyPublicConstructorTypes(): void {
  new Document();
  new DocumentFragment();
  new Text();
  new Comment();
  new ProcessingInstruction("target");
  createWindow();

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
