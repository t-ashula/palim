import { foreignAnchorRelList } from "../dom/foreign-anchor.js";
import { HTMLSlotElement } from "../html-elements.js";
import { normal } from "./adapter.js";
import type { DOMRealmBindingContext } from "./dom-realm-binding-context.js";

export function installForeignAnchorMembers(
  binding: DOMRealmBindingContext,
): void {
  binding.attribute(binding.foreignAnchorPrototype, "relList", (thisValue) => {
    const element = binding.foreignAnchorElement(thisValue);
    if (element === null) {
      return binding.typeError("Invalid foreign anchor receiver");
    }
    return normal(binding.wrap(foreignAnchorRelList(element)));
  });
}

export function installHTMLElementMembers(
  binding: DOMRealmBindingContext,
): void {
  binding.attribute(
    binding.htmlElementPrototype,
    "title",
    (thisValue) => {
      const element = binding.htmlElement(thisValue);
      return element === null
        ? binding.typeError("Invalid HTMLElement receiver")
        : binding.primitive(element.title);
    },
    (thisValue, argumentsList) => {
      const element = binding.htmlElement(thisValue);
      if (element === null) {
        return binding.typeError("Invalid HTMLElement receiver");
      }
      const value = binding.stringArgument(argumentsList, 0, "title");
      if (value.type === "throw") {
        return value;
      }
      element.title = value.value;
      return binding.undefined();
    },
  );
  binding.attribute(
    binding.htmlElementPrototype,
    "slot",
    (thisValue) => {
      const element = binding.htmlElement(thisValue);
      return element === null
        ? binding.typeError("Invalid HTMLElement receiver")
        : binding.primitive(element.slot);
    },
    (thisValue, argumentsList) => {
      const element = binding.htmlElement(thisValue);
      if (element === null) {
        return binding.typeError("Invalid HTMLElement receiver");
      }
      const value = binding.stringArgument(argumentsList, 0, "slot");
      if (value.type === "throw") {
        return value;
      }
      element.slot = value.value;
      return binding.undefined();
    },
  );
  binding.attribute(binding.htmlElementPrototype, "dataset", (thisValue) => {
    const element = binding.htmlElement(thisValue);
    return element === null
      ? binding.typeError("Invalid HTMLElement receiver")
      : normal(binding.wrap(element.dataset));
  });
  binding.attribute(
    binding.htmlElementPrototype,
    "style",
    (thisValue) => {
      const element = binding.htmlElement(thisValue);
      return element === null
        ? binding.typeError("Invalid HTMLElement receiver")
        : normal(binding.wrap(element.style));
    },
    (thisValue, argumentsList) => {
      const element = binding.htmlElement(thisValue);
      if (element === null) {
        return binding.typeError("Invalid HTMLElement receiver");
      }
      const argument = argumentsList[0];
      if (argument !== undefined && binding.engine.isNull(argument)) {
        element.style = "";
        return binding.undefined();
      }
      const value = binding.stringArgument(argumentsList, 0, "style");
      if (value.type === "throw") {
        return value;
      }
      element.style = value.value;
      return binding.undefined();
    },
  );
  binding.attribute(
    binding.htmlElementPrototype,
    "innerText",
    (thisValue) => {
      const element = binding.htmlElement(thisValue);
      return element === null
        ? binding.typeError("Invalid HTMLElement receiver")
        : binding.primitive(element.innerText);
    },
    (thisValue, argumentsList) => {
      const element = binding.htmlElement(thisValue);
      if (element === null) {
        return binding.typeError("Invalid HTMLElement receiver");
      }
      const value = binding.stringArgument(argumentsList, 0, "innerText");
      if (value.type === "throw") {
        return value;
      }
      element.innerText = value.value;
      return binding.undefined();
    },
  );
}

export function installHTMLSlotElementMembers(
  binding: DOMRealmBindingContext,
): void {
  const prototype = binding.htmlElementInterfacePrototype(HTMLSlotElement);
  const receiver = (value: Parameters<typeof binding.htmlElement>[0]) => {
    const element = binding.htmlElement(value);
    return element instanceof HTMLSlotElement ? element : null;
  };
  binding.attribute(
    prototype,
    "name",
    (thisValue) => {
      const slot = receiver(thisValue);
      return slot === null
        ? binding.typeError("Invalid HTMLSlotElement receiver")
        : binding.primitive(slot.name);
    },
    (thisValue, argumentsList) => {
      const slot = receiver(thisValue);
      if (slot === null) {
        return binding.typeError("Invalid HTMLSlotElement receiver");
      }
      const value = binding.stringArgument(argumentsList, 0, "name");
      if (value.type === "throw") {
        return value;
      }
      slot.name = value.value;
      return binding.undefined();
    },
  );
  for (const name of ["assignedNodes", "assignedElements"] as const) {
    binding.method(prototype, name, 0, (thisValue, argumentsList) => {
      const slot = receiver(thisValue);
      if (slot === null) {
        return binding.typeError("Invalid HTMLSlotElement receiver");
      }
      let flatten = false;
      const optionsValue = argumentsList[0];
      if (
        optionsValue !== undefined &&
        !binding.engine.isUndefined(optionsValue) &&
        !binding.engine.isNull(optionsValue)
      ) {
        const options = binding.engine.asObject(optionsValue);
        if (options === null) {
          return binding.typeError("AssignedNodesOptions must be an object");
        }
        const value = binding.engine.get(binding.realm, options, "flatten");
        if (value.type === "throw") {
          return value;
        }
        flatten = binding.engine.toBoolean(value.value);
      }
      return normal(
        binding.engine.createArray(
          binding.realm,
          slot[name]({ flatten }).map((node) => binding.wrap(node)),
        ),
      );
    });
  }
}

export function installHTMLAnchorElementMembers(
  binding: DOMRealmBindingContext,
): void {
  binding.attribute(
    binding.htmlAnchorElementPrototype,
    "relList",
    (thisValue) => {
      const anchor = binding.htmlAnchorElement(thisValue);
      return anchor === null
        ? binding.typeError("Invalid HTMLAnchorElement receiver")
        : normal(binding.wrap(anchor.relList));
    },
  );
  binding.attribute(
    binding.htmlAnchorElementPrototype,
    "href",
    (thisValue) => {
      const anchor = binding.htmlAnchorElement(thisValue);
      return anchor === null
        ? binding.typeError("Invalid HTMLAnchorElement receiver")
        : binding.primitive(anchor.href);
    },
    (thisValue, argumentsList) => {
      const anchor = binding.htmlAnchorElement(thisValue);
      if (anchor === null) {
        return binding.typeError("Invalid HTMLAnchorElement receiver");
      }
      const value = binding.stringArgument(argumentsList, 0, "href");
      if (value.type === "throw") {
        return value;
      }
      anchor.href = value.value;
      return binding.undefined();
    },
  );
  for (const name of ["pathname", "search", "hash"] as const) {
    binding.attribute(binding.htmlAnchorElementPrototype, name, (thisValue) => {
      const anchor = binding.htmlAnchorElement(thisValue);
      return anchor === null
        ? binding.typeError("Invalid HTMLAnchorElement receiver")
        : binding.primitive(anchor[name]);
    });
  }
}

export function installHTMLAreaElementMembers(
  binding: DOMRealmBindingContext,
): void {
  binding.attribute(
    binding.htmlAreaElementPrototype,
    "relList",
    (thisValue) => {
      const area = binding.htmlAreaElement(thisValue);
      return area === null
        ? binding.typeError("Invalid HTMLAreaElement receiver")
        : normal(binding.wrap(area.relList));
    },
  );
}

export function installHTMLButtonElementMembers(
  binding: DOMRealmBindingContext,
): void {
  binding.attribute(binding.htmlButtonElementPrototype, "form", (thisValue) => {
    const button = binding.htmlButtonElement(thisValue);
    return button === null
      ? binding.typeError("Invalid HTMLButtonElement receiver for form")
      : binding.platformValue(button.form);
  });
}

export function installHTMLIFrameElementMembers(
  binding: DOMRealmBindingContext,
): void {
  binding.attribute(
    binding.htmlIFrameElementPrototype,
    "sandbox",
    (thisValue) => {
      const iframe = binding.htmlIFrameElement(thisValue);
      return iframe === null
        ? binding.typeError("Invalid HTMLIFrameElement receiver")
        : normal(binding.wrap(iframe.sandbox));
    },
  );
}

export function installHTMLLinkElementMembers(
  binding: DOMRealmBindingContext,
): void {
  for (const name of ["relList", "sizes"] as const) {
    binding.attribute(binding.htmlLinkElementPrototype, name, (thisValue) => {
      const link = binding.htmlLinkElement(thisValue);
      return link === null
        ? binding.typeError("Invalid HTMLLinkElement receiver")
        : normal(binding.wrap(link[name]));
    });
  }
}

export function installHTMLOutputElementMembers(
  binding: DOMRealmBindingContext,
): void {
  binding.attribute(
    binding.htmlOutputElementPrototype,
    "htmlFor",
    (thisValue) => {
      const output = binding.htmlOutputElement(thisValue);
      return output === null
        ? binding.typeError("Invalid HTMLOutputElement receiver")
        : normal(binding.wrap(output.htmlFor));
    },
  );
}

export function installHTMLTableElementMembers(
  binding: DOMRealmBindingContext,
): void {
  for (const name of ["tBodies", "rows"] as const) {
    binding.attribute(binding.htmlTableElementPrototype, name, (thisValue) => {
      const table = binding.htmlTableElement(thisValue);
      return table === null
        ? binding.typeError(`Invalid HTMLTableElement receiver for ${name}`)
        : normal(binding.wrap(table[name]));
    });
  }
  binding.method(
    binding.htmlTableElementPrototype,
    "deleteRow",
    1,
    (thisValue, argumentsList) => {
      const table = binding.htmlTableElement(thisValue);
      if (table === null) {
        return binding.typeError("Invalid HTMLTableElement receiver");
      }
      const index = binding.longArgument(argumentsList, 0, "deleteRow");
      if (index.type === "throw") {
        return index;
      }
      return binding.domOperationResult(() => {
        table.deleteRow(index.value);
        return binding.undefined();
      });
    },
  );
}

export function installHTMLTableSectionElementMembers(
  binding: DOMRealmBindingContext,
): void {
  binding.attribute(
    binding.htmlTableSectionElementPrototype,
    "rows",
    (thisValue) => {
      const section = binding.htmlTableSectionElement(thisValue);
      return section === null
        ? binding.typeError("Invalid HTMLTableSectionElement receiver for rows")
        : normal(binding.wrap(section.rows));
    },
  );
}

export function installHTMLTableRowElementMembers(
  binding: DOMRealmBindingContext,
): void {
  binding.attribute(
    binding.htmlTableRowElementPrototype,
    "cells",
    (thisValue) => {
      const row = binding.htmlTableRowElement(thisValue);
      return row === null
        ? binding.typeError("Invalid HTMLTableRowElement receiver for cells")
        : normal(binding.wrap(row.cells));
    },
  );
}

export function installHTMLTemplateElementMembers(
  binding: DOMRealmBindingContext,
): void {
  binding.attribute(
    binding.htmlTemplateElementPrototype,
    "content",
    (thisValue) => {
      const template = binding.htmlTemplateElement(thisValue);
      return template === null
        ? binding.typeError("Invalid HTMLTemplateElement receiver")
        : normal(binding.wrap(template.content));
    },
  );
}
