import { normal } from "./adapter.js";
import type { DOMRealmBindingContext } from "./dom-realm-binding-context.js";

export function installSelectionMembers(binding: DOMRealmBindingContext): void {
  for (const name of [
    "anchorNode",
    "anchorOffset",
    "focusNode",
    "focusOffset",
    "isCollapsed",
    "rangeCount",
    "type",
    "direction",
  ] as const) {
    binding.attribute(binding.selectionPrototype, name, (thisValue) => {
      const selection = binding.selection(thisValue);
      if (selection === null) {
        return binding.typeError("Invalid Selection receiver");
      }
      const value = selection[name];
      return name === "anchorNode" || name === "focusNode"
        ? normal(
            value === null
              ? binding.engine.fromPrimitive(null)
              : binding.wrap(value as object),
          )
        : binding.primitive(value as number | boolean | string);
    });
  }

  binding.method(
    binding.selectionPrototype,
    "getRangeAt",
    1,
    (thisValue, argumentsList) => {
      const selection = binding.selection(thisValue);
      if (selection === null) {
        return binding.typeError("Invalid Selection receiver");
      }
      const index = binding.unsignedLongArgument(
        argumentsList,
        0,
        "getRangeAt",
      );
      return index.type === "throw"
        ? index
        : binding.domOperationResult(() =>
            normal(binding.wrap(selection.getRangeAt(index.value))),
          );
    },
  );

  for (const name of ["addRange", "removeRange"] as const) {
    binding.method(
      binding.selectionPrototype,
      name,
      1,
      (thisValue, argumentsList) => {
        const selection = binding.selection(thisValue);
        const range = binding.range(
          argumentsList[0] ?? binding.engine.fromPrimitive(undefined),
        );
        if (selection === null) {
          return binding.typeError("Invalid Selection receiver");
        }
        if (range === null) {
          return binding.typeError(`${name} requires a Range`);
        }
        return binding.domOperationResult(() => {
          selection[name](range);
          return binding.undefined();
        });
      },
    );
  }

  for (const name of [
    "removeAllRanges",
    "empty",
    "collapseToStart",
    "collapseToEnd",
    "deleteFromDocument",
  ] as const) {
    binding.method(binding.selectionPrototype, name, 0, (thisValue) => {
      const selection = binding.selection(thisValue);
      if (selection === null) {
        return binding.typeError("Invalid Selection receiver");
      }
      return binding.domOperationResult(() => {
        selection[name]();
        return binding.undefined();
      });
    });
  }

  for (const name of ["collapse", "setPosition", "extend"] as const) {
    binding.method(
      binding.selectionPrototype,
      name,
      1,
      (thisValue, argumentsList) => {
        const selection = binding.selection(thisValue);
        if (selection === null) {
          return binding.typeError("Invalid Selection receiver");
        }
        const nodeValue = argumentsList[0];
        if (nodeValue === undefined) {
          return binding.typeError(`${name} requires a Node`);
        }
        const node = binding.engine.isNull(nodeValue)
          ? null
          : binding.node(nodeValue);
        if (node === null && !binding.engine.isNull(nodeValue)) {
          return binding.typeError(`${name} requires a Node`);
        }
        if (name === "extend" && node === null) {
          return binding.typeError("extend requires a Node");
        }
        const offset =
          argumentsList[1] === undefined
            ? normal(0)
            : binding.unsignedLongArgument(argumentsList, 1, name);
        if (offset.type === "throw") {
          return offset;
        }
        return binding.domOperationResult(() => {
          if (name === "extend") {
            if (node === null) {
              throw new TypeError("extend requires a Node");
            }
            selection.extend(node, offset.value);
          } else {
            selection[name](node, offset.value);
          }
          return binding.undefined();
        });
      },
    );
  }

  binding.method(
    binding.selectionPrototype,
    "setBaseAndExtent",
    4,
    (thisValue, argumentsList) => {
      const selection = binding.selection(thisValue);
      const anchorNode = binding.node(
        argumentsList[0] ?? binding.engine.fromPrimitive(undefined),
      );
      const focusNode = binding.node(
        argumentsList[2] ?? binding.engine.fromPrimitive(undefined),
      );
      if (selection === null) {
        return binding.typeError("Invalid Selection receiver");
      }
      if (anchorNode === null || focusNode === null) {
        return binding.typeError("setBaseAndExtent requires Nodes");
      }
      const anchorOffset = binding.unsignedLongArgument(
        argumentsList,
        1,
        "setBaseAndExtent",
      );
      if (anchorOffset.type === "throw") {
        return anchorOffset;
      }
      const focusOffset = binding.unsignedLongArgument(
        argumentsList,
        3,
        "setBaseAndExtent",
      );
      if (focusOffset.type === "throw") {
        return focusOffset;
      }
      return binding.domOperationResult(() => {
        selection.setBaseAndExtent(
          anchorNode,
          anchorOffset.value,
          focusNode,
          focusOffset.value,
        );
        return binding.undefined();
      });
    },
  );

  binding.method(
    binding.selectionPrototype,
    "selectAllChildren",
    1,
    (thisValue, argumentsList) => {
      const selection = binding.selection(thisValue);
      const node = binding.node(
        argumentsList[0] ?? binding.engine.fromPrimitive(undefined),
      );
      if (selection === null) {
        return binding.typeError("Invalid Selection receiver");
      }
      if (node === null) {
        return binding.typeError("selectAllChildren requires a Node");
      }
      return binding.domOperationResult(() => {
        selection.selectAllChildren(node);
        return binding.undefined();
      });
    },
  );

  binding.method(
    binding.selectionPrototype,
    "containsNode",
    1,
    (thisValue, argumentsList) => {
      const selection = binding.selection(thisValue);
      const node = binding.node(
        argumentsList[0] ?? binding.engine.fromPrimitive(undefined),
      );
      if (selection === null) {
        return binding.typeError("Invalid Selection receiver");
      }
      if (node === null) {
        return binding.typeError("containsNode requires a Node");
      }
      const allowPartial =
        argumentsList[1] === undefined
          ? false
          : binding.engine.toBoolean(argumentsList[1]);
      return binding.domOperationResult(() =>
        binding.primitive(selection.containsNode(node, allowPartial)),
      );
    },
  );

  binding.method(
    binding.selectionPrototype,
    "getComposedRanges",
    0,
    (thisValue) => {
      const selection = binding.selection(thisValue);
      return selection === null
        ? binding.typeError("Invalid Selection receiver")
        : binding.domOperationResult(() =>
            normal(
              binding.engine.createArray(
                binding.realm,
                selection
                  .getComposedRanges()
                  .map((range) => binding.wrap(range)),
              ),
            ),
          );
    },
  );

  binding.method(
    binding.selectionPrototype,
    "modify",
    0,
    (thisValue, argumentsList) => {
      const selection = binding.selection(thisValue);
      if (selection === null) {
        return binding.typeError("Invalid Selection receiver");
      }
      const values: string[] = [];
      for (const value of argumentsList.slice(0, 3)) {
        const converted = binding.engine.toString(binding.realm, value);
        if (converted.type === "throw") {return converted;}
        values.push(converted.value);
      }
      selection.modify(values[0] ?? "", values[1] ?? "", values[2] ?? "");
      return binding.undefined();
    },
  );

  binding.method(binding.selectionPrototype, "toString", 0, (thisValue) => {
    const selection = binding.selection(thisValue);
    return selection === null
      ? binding.typeError("Invalid Selection receiver")
      : binding.primitive(selection.toString());
  });

  binding.interfaceTag(binding.selectionPrototype, "Selection");
}
