import { normal } from "./adapter.js";
import type { DOMRealmBindingContext } from "./dom-realm-binding-context.js";

export function installRangeMembers(binding: DOMRealmBindingContext): void {
  for (const name of [
    "startContainer",
    "startOffset",
    "endContainer",
    "endOffset",
    "collapsed",
  ] as const) {
    binding.attribute(binding.abstractRangePrototype, name, (thisValue) => {
      const range = binding.range(thisValue) ?? binding.staticRange(thisValue);
      if (range === null) {
        return binding.typeError("Invalid AbstractRange receiver");
      }
      const value = range[name];
      return name === "startContainer" || name === "endContainer"
        ? normal(binding.wrap(value as typeof range.startContainer))
        : binding.primitive(value as number | boolean);
    });
  }

  binding.attribute(
    binding.rangePrototype,
    "commonAncestorContainer",
    (thisValue) => {
      const range = binding.range(thisValue);
      return range === null
        ? binding.typeError("Invalid Range receiver")
        : normal(binding.wrap(range.commonAncestorContainer));
    },
  );

  for (const name of [
    "setStart",
    "setEnd",
    "isPointInRange",
    "comparePoint",
  ] as const) {
    binding.method(
      binding.rangePrototype,
      name,
      2,
      (thisValue, argumentsList) => {
        const range = binding.range(thisValue);
        const nodeValue = argumentsList[0];
        const node = nodeValue === undefined ? null : binding.node(nodeValue);
        if (range === null) {
          return binding.typeError("Invalid Range receiver");
        }
        if (node === null) {
          return binding.typeError(`${name} requires a Node`);
        }
        const offset = binding.unsignedLongArgument(argumentsList, 1, name);
        if (offset.type === "throw") {
          return offset;
        }
        return binding.domOperationResult(() => {
          const result = range[name](node, offset.value);
          return result === undefined
            ? binding.undefined()
            : binding.primitive(result);
        });
      },
    );
  }

  for (const name of [
    "setStartBefore",
    "setStartAfter",
    "setEndBefore",
    "setEndAfter",
    "selectNode",
    "selectNodeContents",
    "insertNode",
    "surroundContents",
    "intersectsNode",
  ] as const) {
    binding.method(
      binding.rangePrototype,
      name,
      1,
      (thisValue, argumentsList) => {
        const range = binding.range(thisValue);
        const nodeValue = argumentsList[0];
        const node = nodeValue === undefined ? null : binding.node(nodeValue);
        if (range === null) {
          return binding.typeError("Invalid Range receiver");
        }
        if (node === null) {
          return binding.typeError(`${name} requires a Node`);
        }
        return binding.domOperationResult(() => {
          const result = range[name](node);
          return result === undefined
            ? binding.undefined()
            : binding.primitive(result);
        });
      },
    );
  }

  binding.method(
    binding.rangePrototype,
    "collapse",
    0,
    (thisValue, argumentsList) => {
      const range = binding.range(thisValue);
      if (range === null) {
        return binding.typeError("Invalid Range receiver");
      }
      const toStart = argumentsList[0];
      range.collapse(
        toStart === undefined || binding.engine.isUndefined(toStart)
          ? false
          : binding.engine.toBoolean(toStart),
      );
      return binding.undefined();
    },
  );

  binding.method(
    binding.rangePrototype,
    "compareBoundaryPoints",
    2,
    (thisValue, argumentsList) => {
      const range = binding.range(thisValue);
      if (range === null) {
        return binding.typeError("Invalid Range receiver");
      }
      const how = binding.unsignedLongArgument(
        argumentsList,
        0,
        "compareBoundaryPoints",
      );
      if (how.type === "throw") {
        return how;
      }
      const sourceValue = argumentsList[1];
      const source =
        sourceValue === undefined ? null : binding.range(sourceValue);
      if (source === null) {
        return binding.typeError("compareBoundaryPoints requires a Range");
      }
      return binding.domOperationResult(() =>
        binding.primitive(range.compareBoundaryPoints(how.value, source)),
      );
    },
  );

  for (const name of ["deleteContents", "detach"] as const) {
    binding.method(binding.rangePrototype, name, 0, (thisValue) => {
      const range = binding.range(thisValue);
      if (range === null) {
        return binding.typeError("Invalid Range receiver");
      }
      return binding.domOperationResult(() => {
        range[name]();
        return binding.undefined();
      });
    });
  }

  for (const name of ["extractContents", "cloneContents"] as const) {
    binding.method(binding.rangePrototype, name, 0, (thisValue) => {
      const range = binding.range(thisValue);
      return range === null
        ? binding.typeError("Invalid Range receiver")
        : binding.domOperationResult(() => normal(binding.wrap(range[name]())));
    });
  }

  binding.method(
    binding.rangePrototype,
    "createContextualFragment",
    1,
    (thisValue, argumentsList) => {
      const range = binding.range(thisValue);
      if (range === null) {
        return binding.typeError("Invalid Range receiver");
      }
      const fragment = binding.stringArgument(
        argumentsList,
        0,
        "createContextualFragment",
      );
      return fragment.type === "throw"
        ? fragment
        : binding.domOperationResult(() =>
            normal(
              binding.wrap(range.createContextualFragment(fragment.value)),
            ),
          );
    },
  );

  binding.method(binding.rangePrototype, "cloneRange", 0, (thisValue) => {
    const range = binding.range(thisValue);
    return range === null
      ? binding.typeError("Invalid Range receiver")
      : normal(binding.wrap(range.cloneRange()));
  });
  binding.method(binding.rangePrototype, "toString", 0, (thisValue) => {
    const range = binding.range(thisValue);
    return range === null
      ? binding.typeError("Invalid Range receiver")
      : binding.primitive(range.toString());
  });

  binding.interfaceTag(binding.abstractRangePrototype, "AbstractRange");
  binding.interfaceTag(binding.rangePrototype, "Range");
  binding.interfaceTag(binding.staticRangePrototype, "StaticRange");
}
