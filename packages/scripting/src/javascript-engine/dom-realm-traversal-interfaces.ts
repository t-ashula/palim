import {
  traverseNodeIterator,
  traverseTreeWalker,
} from "@palim/core/internal/dom/traversal.js";
import { normal } from "./adapter.js";
import type { DOMRealmBindingContext } from "./dom-realm-binding-context.js";

export function installNodeIteratorMembers(
  binding: DOMRealmBindingContext,
): void {
  for (const name of ["root", "referenceNode"] as const) {
    binding.attribute(binding.nodeIteratorPrototype, name, (thisValue) => {
      const iterator = binding.nodeIterator(thisValue);
      return iterator === null
        ? binding.typeError("Invalid NodeIterator receiver")
        : normal(binding.wrap(iterator[name]));
    });
  }
  for (const name of ["pointerBeforeReferenceNode", "whatToShow"] as const) {
    binding.attribute(binding.nodeIteratorPrototype, name, (thisValue) => {
      const iterator = binding.nodeIterator(thisValue);
      return iterator === null
        ? binding.typeError("Invalid NodeIterator receiver")
        : binding.primitive(iterator[name]);
    });
  }
  binding.attribute(binding.nodeIteratorPrototype, "filter", (thisValue) => {
    const iterator = binding.nodeIterator(thisValue);
    return iterator === null
      ? binding.typeError("Invalid NodeIterator receiver")
      : normal(
          binding.traversalFilters.get(iterator) ??
            binding.engine.fromPrimitive(null),
        );
  });
  for (const name of ["nextNode", "previousNode"] as const) {
    binding.method(binding.nodeIteratorPrototype, name, 0, (thisValue) => {
      const iterator = binding.nodeIterator(thisValue);
      return iterator === null
        ? binding.typeError("Invalid NodeIterator receiver")
        : binding.traversalCompletion(() =>
            traverseNodeIterator(
              iterator,
              name === "nextNode" ? "next" : "previous",
            ),
          );
    });
  }
  binding.method(binding.nodeIteratorPrototype, "detach", 0, (thisValue) => {
    const iterator = binding.nodeIterator(thisValue);
    if (iterator === null) {
      return binding.typeError("Invalid NodeIterator receiver");
    }
    iterator.detach();
    return binding.undefined();
  });
  binding.interfaceTag(binding.nodeIteratorPrototype, "NodeIterator");
}

export function installTreeWalkerMembers(
  binding: DOMRealmBindingContext,
): void {
  binding.attribute(binding.treeWalkerPrototype, "root", (thisValue) => {
    const walker = binding.treeWalker(thisValue);
    return walker === null
      ? binding.typeError("Invalid TreeWalker receiver")
      : normal(binding.wrap(walker.root));
  });
  binding.attribute(binding.treeWalkerPrototype, "whatToShow", (thisValue) => {
    const walker = binding.treeWalker(thisValue);
    return walker === null
      ? binding.typeError("Invalid TreeWalker receiver")
      : binding.primitive(walker.whatToShow);
  });
  binding.attribute(binding.treeWalkerPrototype, "filter", (thisValue) => {
    const walker = binding.treeWalker(thisValue);
    return walker === null
      ? binding.typeError("Invalid TreeWalker receiver")
      : normal(
          binding.traversalFilters.get(walker) ??
            binding.engine.fromPrimitive(null),
        );
  });
  binding.attribute(
    binding.treeWalkerPrototype,
    "currentNode",
    (thisValue) => {
      const walker = binding.treeWalker(thisValue);
      return walker === null
        ? binding.typeError("Invalid TreeWalker receiver")
        : normal(binding.wrap(walker.currentNode));
    },
    (thisValue, argumentsList) => {
      const walker = binding.treeWalker(thisValue);
      const nodeValue = argumentsList[0];
      const node = nodeValue === undefined ? null : binding.node(nodeValue);
      if (walker === null || node === null) {
        return binding.typeError("currentNode must be a Node");
      }
      walker.currentNode = node;
      return binding.undefined();
    },
  );
  for (const name of [
    "parentNode",
    "firstChild",
    "lastChild",
    "previousSibling",
    "nextSibling",
    "previousNode",
    "nextNode",
  ] as const) {
    binding.method(binding.treeWalkerPrototype, name, 0, (thisValue) => {
      const walker = binding.treeWalker(thisValue);
      return walker === null
        ? binding.typeError("Invalid TreeWalker receiver")
        : binding.traversalCompletion(() => traverseTreeWalker(walker, name));
    });
  }
  binding.interfaceTag(binding.treeWalkerPrototype, "TreeWalker");
}
