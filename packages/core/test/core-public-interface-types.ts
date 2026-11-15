import type { Document, Element, Node } from "../src/index.js";
import { DOMParser } from "../src/index.js";

export function verifyCorePublicTypes(): Node | null {
  const document: Document = new DOMParser().parseFromString(
    "<main>core</main>",
    "text/html",
  );
  const element: Element | null = document.querySelector("main");
  const node: Node | null = element;
  return node;
}
