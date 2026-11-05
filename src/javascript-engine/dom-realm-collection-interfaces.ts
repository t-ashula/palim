import type { DOMRealmBindingContext } from "./dom-realm-binding-context.js";

const DATA_PROPERTY = {
  configurable: true,
  enumerable: true,
  writable: true,
} as const;

export function installHTMLCollectionMembers(
  binding: DOMRealmBindingContext,
): void {
  binding.attribute(binding.htmlCollectionPrototype, "length", (thisValue) => {
    const collection = binding.htmlCollection(thisValue);
    return collection === null
      ? binding.typeError("Invalid HTMLCollection receiver")
      : binding.primitive(collection.length);
  });
  binding.method(
    binding.htmlCollectionPrototype,
    "item",
    1,
    (thisValue, argumentsList) => {
      const collection = binding.htmlCollection(thisValue);
      if (collection === null) {
        return binding.typeError("Invalid HTMLCollection receiver");
      }
      const index = binding.stringArgument(argumentsList, 0, "item");
      return index.type === "throw"
        ? index
        : binding.platformValue(collection.item(Number(index.value) >>> 0));
    },
  );
  binding.method(
    binding.htmlCollectionPrototype,
    "namedItem",
    1,
    (thisValue, argumentsList) => {
      const collection = binding.htmlCollection(thisValue);
      if (collection === null) {
        return binding.typeError("Invalid HTMLCollection receiver");
      }
      const name = binding.stringArgument(argumentsList, 0, "namedItem");
      return name.type === "throw"
        ? name
        : binding.platformValue(collection.namedItem(name.value));
    },
  );
  binding.installIterator(
    binding.htmlCollectionPrototype,
    (thisValue) => binding.htmlCollection(thisValue),
    "HTMLCollection",
  );
}

export function installNamedNodeMapMembers(
  binding: DOMRealmBindingContext,
): void {
  binding.attribute(binding.namedNodeMapPrototype, "length", (thisValue) => {
    const attributes = binding.namedNodeMap(thisValue);
    return attributes === null
      ? binding.typeError("Invalid NamedNodeMap receiver")
      : binding.primitive(attributes.length);
  });
  binding.method(
    binding.namedNodeMapPrototype,
    "item",
    1,
    (thisValue, argumentsList) => {
      const attributes = binding.namedNodeMap(thisValue);
      if (attributes === null) {
        return binding.typeError("Invalid NamedNodeMap receiver");
      }
      const index = binding.stringArgument(argumentsList, 0, "item");
      return index.type === "throw"
        ? index
        : binding.platformValue(attributes.item(Number(index.value) >>> 0));
    },
  );
}

export function installNodeListMembers(binding: DOMRealmBindingContext): void {
  binding.attribute(binding.nodeListPrototype, "length", (thisValue) => {
    const list = binding.nodeList(thisValue);
    return list === null
      ? binding.typeError("Invalid NodeList receiver")
      : binding.primitive(list.length);
  });
  binding.method(
    binding.nodeListPrototype,
    "item",
    1,
    (thisValue, argumentsList) => {
      const list = binding.nodeList(thisValue);
      if (list === null) {
        return binding.typeError("Invalid NodeList receiver");
      }
      const index = binding.stringArgument(argumentsList, 0, "item");
      return index.type === "throw"
        ? index
        : binding.platformValue(list.item(Number(index.value) >>> 0));
    },
  );
  binding.installIterator(
    binding.nodeListPrototype,
    (thisValue) => binding.nodeList(thisValue),
    "NodeList",
  );
}

export function installDOMTokenListMembers(
  binding: DOMRealmBindingContext,
): void {
  binding.attribute(binding.domTokenListPrototype, "length", (thisValue) => {
    const list = binding.domTokenList(thisValue);
    return list === null
      ? binding.typeError("Invalid DOMTokenList receiver")
      : binding.primitive(list.length);
  });
  binding.attribute(
    binding.domTokenListPrototype,
    "value",
    (thisValue) => {
      const list = binding.domTokenList(thisValue);
      return list === null
        ? binding.typeError("Invalid DOMTokenList receiver")
        : binding.primitive(list.value);
    },
    (thisValue, argumentsList) => {
      const list = binding.domTokenList(thisValue);
      if (list === null) {
        return binding.typeError("Invalid DOMTokenList receiver");
      }
      const value = binding.stringArgument(argumentsList, 0, "value");
      if (value.type === "throw") {
        return value;
      }
      list.value = value.value;
      return binding.undefined();
    },
  );
  binding.method(
    binding.domTokenListPrototype,
    "item",
    1,
    (thisValue, argumentsList) => {
      const list = binding.domTokenList(thisValue);
      if (list === null) {
        return binding.typeError("Invalid DOMTokenList receiver");
      }
      const index = binding.stringArgument(argumentsList, 0, "item");
      return index.type === "throw"
        ? index
        : binding.primitive(list.item(Number(index.value) >>> 0));
    },
  );
  binding.method(binding.domTokenListPrototype, "toString", 0, (thisValue) => {
    const list = binding.domTokenList(thisValue);
    return list === null
      ? binding.typeError("Invalid DOMTokenList receiver")
      : binding.primitive(list.toString());
  });
  binding.method(
    binding.domTokenListPrototype,
    "contains",
    1,
    (thisValue, argumentsList) => {
      const list = binding.domTokenList(thisValue);
      if (list === null) {
        return binding.typeError("Invalid DOMTokenList receiver");
      }
      const token = binding.stringArgument(argumentsList, 0, "contains");
      return token.type === "throw"
        ? token
        : binding.domOperationResult(() =>
            binding.primitive(list.contains(token.value)),
          );
    },
  );
  for (const name of ["add", "remove"] as const) {
    binding.method(
      binding.domTokenListPrototype,
      name,
      0,
      (thisValue, argumentsList) => {
        const list = binding.domTokenList(thisValue);
        if (list === null) {
          return binding.typeError("Invalid DOMTokenList receiver");
        }
        const tokens: string[] = [];
        for (let index = 0; index < argumentsList.length; index += 1) {
          const token = binding.stringArgument(argumentsList, index, name);
          if (token.type === "throw") {
            return token;
          }
          tokens.push(token.value);
        }
        return binding.domOperationResult(() => {
          list[name](...tokens);
          return binding.undefined();
        });
      },
    );
  }
  binding.method(
    binding.domTokenListPrototype,
    "toggle",
    1,
    (thisValue, argumentsList) => {
      const list = binding.domTokenList(thisValue);
      if (list === null) {
        return binding.typeError("Invalid DOMTokenList receiver");
      }
      const token = binding.stringArgument(argumentsList, 0, "toggle");
      if (token.type === "throw") {
        return token;
      }
      const force = argumentsList[1];
      return binding.domOperationResult(() =>
        binding.primitive(
          force === undefined || binding.engine.isUndefined(force)
            ? list.toggle(token.value)
            : list.toggle(token.value, binding.engine.toBoolean(force)),
        ),
      );
    },
  );
  binding.method(
    binding.domTokenListPrototype,
    "replace",
    2,
    (thisValue, argumentsList) => {
      const list = binding.domTokenList(thisValue);
      if (list === null) {
        return binding.typeError("Invalid DOMTokenList receiver");
      }
      const token = binding.stringArgument(argumentsList, 0, "replace");
      if (token.type === "throw") {
        return token;
      }
      const replacement = binding.stringArgument(argumentsList, 1, "replace");
      return replacement.type === "throw"
        ? replacement
        : binding.domOperationResult(() =>
            binding.primitive(list.replace(token.value, replacement.value)),
          );
    },
  );
  binding.method(
    binding.domTokenListPrototype,
    "supports",
    1,
    (thisValue, argumentsList) => {
      const list = binding.domTokenList(thisValue);
      if (list === null) {
        return binding.typeError("Invalid DOMTokenList receiver");
      }
      const token = binding.stringArgument(argumentsList, 0, "supports");
      if (token.type === "throw") {
        return token;
      }
      try {
        return binding.primitive(list.supports(token.value));
      } catch (error: unknown) {
        if (error instanceof TypeError) {
          return binding.typeError(error.message);
        }
        throw error;
      }
    },
  );

  const array = binding.engine.createArray(binding.realm, []);
  for (const name of ["entries", "keys", "values", "forEach"] as const) {
    const method = binding.engine.get(binding.realm, array, name);
    if (method.type === "throw") {
      throw new TypeError(
        binding.engine.exceptionMessage(binding.realm, method.value),
      );
    }
    binding.engine.defineDataProperty(
      binding.domTokenListPrototype,
      name,
      method.value,
      DATA_PROPERTY,
    );
  }
  const iterator = binding.engine.get(
    binding.realm,
    array,
    binding.engine.wellKnownSymbol("iterator"),
  );
  if (iterator.type === "throw") {
    throw new TypeError(
      binding.engine.exceptionMessage(binding.realm, iterator.value),
    );
  }
  binding.engine.defineDataProperty(
    binding.domTokenListPrototype,
    binding.engine.wellKnownSymbol("iterator"),
    iterator.value,
    DATA_PROPERTY,
  );
  binding.engine.defineDataProperty(
    binding.domTokenListPrototype,
    binding.engine.wellKnownSymbol("toStringTag"),
    binding.engine.fromPrimitive("DOMTokenList"),
    { configurable: true, enumerable: false, writable: false },
  );
}

export function installCSSStyleDeclarationMembers(
  binding: DOMRealmBindingContext,
): void {
  binding.attribute(
    binding.cssStyleDeclarationPrototype,
    "cssText",
    (thisValue) => {
      const style = binding.cssStyleDeclaration(thisValue);
      return style === null
        ? binding.typeError("Invalid CSSStyleDeclaration receiver")
        : binding.primitive(style.cssText);
    },
    (thisValue, argumentsList) => {
      const style = binding.cssStyleDeclaration(thisValue);
      if (style === null) {
        return binding.typeError("Invalid CSSStyleDeclaration receiver");
      }
      const argument = argumentsList[0];
      if (argument !== undefined && binding.engine.isNull(argument)) {
        style.cssText = "";
        return binding.undefined();
      }
      const value = binding.stringArgument(argumentsList, 0, "cssText");
      if (value.type === "throw") {
        return value;
      }
      style.cssText = value.value;
      return binding.undefined();
    },
  );
  binding.attribute(
    binding.cssStyleDeclarationPrototype,
    "length",
    (thisValue) => {
      const style = binding.cssStyleDeclaration(thisValue);
      return style === null
        ? binding.typeError("Invalid CSSStyleDeclaration receiver")
        : binding.primitive(style.length);
    },
  );
  binding.attribute(
    binding.cssStyleDeclarationPrototype,
    "parentRule",
    (thisValue) => {
      const style = binding.cssStyleDeclaration(thisValue);
      return style === null
        ? binding.typeError("Invalid CSSStyleDeclaration receiver")
        : binding.primitive(style.parentRule);
    },
  );
  binding.method(
    binding.cssStyleDeclarationPrototype,
    "item",
    1,
    (thisValue, argumentsList) => {
      const style = binding.cssStyleDeclaration(thisValue);
      if (style === null) {
        return binding.typeError("Invalid CSSStyleDeclaration receiver");
      }
      const argument = argumentsList[0];
      if (argument === undefined) {
        return binding.typeError("item requires 1 argument(s)");
      }
      const index = binding.engine.toNumber(binding.realm, argument);
      return index.type === "throw"
        ? index
        : binding.primitive(style.item(index.value));
    },
  );
  for (const name of ["getPropertyValue", "getPropertyPriority"] as const) {
    binding.method(
      binding.cssStyleDeclarationPrototype,
      name,
      1,
      (thisValue, argumentsList) => {
        const style = binding.cssStyleDeclaration(thisValue);
        if (style === null) {
          return binding.typeError("Invalid CSSStyleDeclaration receiver");
        }
        const property = binding.stringArgument(argumentsList, 0, name);
        return property.type === "throw"
          ? property
          : binding.primitive(style[name](property.value));
      },
    );
  }
  binding.method(
    binding.cssStyleDeclarationPrototype,
    "setProperty",
    2,
    (thisValue, argumentsList) => {
      const style = binding.cssStyleDeclaration(thisValue);
      if (style === null) {
        return binding.typeError("Invalid CSSStyleDeclaration receiver");
      }
      const property = binding.stringArgument(argumentsList, 0, "setProperty");
      if (property.type === "throw") {
        return property;
      }
      const value = binding.stringArgument(argumentsList, 1, "setProperty");
      if (value.type === "throw") {
        return value;
      }
      const priority = binding.optionalStringArgument(argumentsList[2], "");
      if (priority.type === "throw") {
        return priority;
      }
      style.setProperty(property.value, value.value, priority.value);
      return binding.undefined();
    },
  );
  binding.method(
    binding.cssStyleDeclarationPrototype,
    "removeProperty",
    1,
    (thisValue, argumentsList) => {
      const style = binding.cssStyleDeclaration(thisValue);
      if (style === null) {
        return binding.typeError("Invalid CSSStyleDeclaration receiver");
      }
      const property = binding.stringArgument(
        argumentsList,
        0,
        "removeProperty",
      );
      return property.type === "throw"
        ? property
        : binding.primitive(style.removeProperty(property.value));
    },
  );
}

export function installCSSStylePropertiesMembers(
  binding: DOMRealmBindingContext,
): void {
  for (const name of ["cssFloat", "float", "display", "visibility"] as const) {
    binding.attribute(
      binding.cssStylePropertiesPrototype,
      name,
      (thisValue) => {
        const style = binding.cssStyleProperties(thisValue);
        return style === null
          ? binding.typeError("Invalid CSSStyleProperties receiver")
          : binding.primitive(style[name]);
      },
      (thisValue, argumentsList) => {
        const style = binding.cssStyleProperties(thisValue);
        if (style === null) {
          return binding.typeError("Invalid CSSStyleProperties receiver");
        }
        const argument = argumentsList[0];
        if (argument !== undefined && binding.engine.isNull(argument)) {
          style[name] = "";
          return binding.undefined();
        }
        const value = binding.stringArgument(argumentsList, 0, name);
        if (value.type === "throw") {
          return value;
        }
        style[name] = value.value;
        return binding.undefined();
      },
    );
  }
}
