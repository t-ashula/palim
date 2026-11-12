import type { Document, Element, Node } from "@palim/core";
import { DOMParser } from "@palim/core";

export function verifyCorePublicTypes(): Node | null {
  const document: Document = new DOMParser().parseFromString(
    "<main>core</main>",
    "text/html",
  );
  const element: Element | null = document.querySelector("main");
  const node: Node | null = element;
  return node;
}
