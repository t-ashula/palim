import type { Element, Node } from "./nodes.js";

export function descendantElements(root: Node): Element[] {
  const result: Element[] = [];
  const visit = (node: Node): void => {
    for (const child of node._childNodes) {
      if (child.nodeType === 1) {
        const element = child as Element;
        result.push(element);
        visit(element);
      }
    }
  };
  visit(root);
  return result;
}
