import { foreignAnchorRelList } from "../dom/foreign-anchor.js";
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
