import {
  CSSConditionRule,
  CSSGroupingRule,
  CSSMediaRule,
  CSSRule,
  CSSRuleList,
  CSSStyleRule,
  CSSStyleSheet,
  MediaList,
  StyleSheetList,
} from "@palim/core";

import type { EngineResult, EngineValue } from "./adapter.js";
import { normal, thrown } from "./adapter.js";
import type { DOMRealmBindingContext } from "./dom-realm-binding-context.js";

export function installCSSOMMembers(binding: DOMRealmBindingContext): void {
  installRuleMembers(binding);
  installGroupingRuleMembers(binding);
  installConditionRuleMembers(binding);
  installMediaRuleMembers(binding);
  installRuleListMembers(binding);
  installMediaListMembers(binding);
  installStyleSheetMembers(binding);
  installStyleSheetListMembers(binding);
}

function installGroupingRuleMembers(binding: DOMRealmBindingContext): void {
  binding.attribute(
    binding.cssGroupingRulePrototype,
    "cssRules",
    (thisValue) => {
      const rule = cssGroupingRule(binding, thisValue);
      return rule === null
        ? binding.typeError("Invalid CSSGroupingRule receiver")
        : normal(binding.wrap(rule.cssRules));
    },
  );
  binding.method(
    binding.cssGroupingRulePrototype,
    "insertRule",
    1,
    (thisValue, argumentsList) => {
      const groupingRule = cssGroupingRule(binding, thisValue);
      if (groupingRule === null) {
        return binding.typeError("Invalid CSSGroupingRule receiver");
      }
      const rule = binding.stringArgument(argumentsList, 0, "insertRule");
      if (rule.type === "throw") {
        return rule;
      }
      if (argumentsList[1] === undefined) {
        return binding.domOperationResult(() =>
          binding.primitive(groupingRule.insertRule(rule.value)),
        );
      }
      const index = binding.unsignedLongArgument(
        argumentsList,
        1,
        "insertRule",
      );
      return index.type === "throw"
        ? index
        : binding.domOperationResult(() =>
            binding.primitive(groupingRule.insertRule(rule.value, index.value)),
          );
    },
  );
  binding.method(
    binding.cssGroupingRulePrototype,
    "deleteRule",
    1,
    (thisValue, argumentsList) => {
      const rule = cssGroupingRule(binding, thisValue);
      if (rule === null) {
        return binding.typeError("Invalid CSSGroupingRule receiver");
      }
      const index = binding.unsignedLongArgument(
        argumentsList,
        0,
        "deleteRule",
      );
      if (index.type === "throw") {
        return index;
      }
      return binding.domOperationResult(() => {
        rule.deleteRule(index.value);
        return binding.undefined();
      });
    },
  );
}

function installConditionRuleMembers(binding: DOMRealmBindingContext): void {
  binding.attribute(
    binding.cssConditionRulePrototype,
    "conditionText",
    (thisValue) => {
      const rule = cssConditionRule(binding, thisValue);
      return rule === null
        ? binding.typeError("Invalid CSSConditionRule receiver")
        : binding.primitive(rule.conditionText);
    },
  );
}

function installMediaRuleMembers(binding: DOMRealmBindingContext): void {
  binding.attribute(binding.cssMediaRulePrototype, "media", (thisValue) => {
    const rule = cssMediaRule(binding, thisValue);
    return rule === null
      ? binding.typeError("Invalid CSSMediaRule receiver")
      : normal(binding.wrap(rule.media));
  });
}

function installMediaListMembers(binding: DOMRealmBindingContext): void {
  binding.attribute(
    binding.mediaListPrototype,
    "mediaText",
    (thisValue) => {
      const list = mediaList(binding, thisValue);
      return list === null
        ? binding.typeError("Invalid MediaList receiver")
        : binding.primitive(list.mediaText);
    },
    (thisValue, argumentsList) => {
      const list = mediaList(binding, thisValue);
      if (list === null) {
        return binding.typeError("Invalid MediaList receiver");
      }
      const value = binding.legacyNullToEmptyStringArgument(
        argumentsList,
        0,
        "mediaText",
      );
      if (value.type === "throw") {
        return value;
      }
      list.mediaText = value.value;
      return binding.undefined();
    },
  );
  binding.attribute(binding.mediaListPrototype, "length", (thisValue) => {
    const list = mediaList(binding, thisValue);
    return list === null
      ? binding.typeError("Invalid MediaList receiver")
      : binding.primitive(list.length);
  });
  binding.method(
    binding.mediaListPrototype,
    "item",
    1,
    (thisValue, argumentsList) => {
      const list = mediaList(binding, thisValue);
      if (list === null) {
        return binding.typeError("Invalid MediaList receiver");
      }
      const index = binding.unsignedLongArgument(argumentsList, 0, "item");
      return index.type === "throw"
        ? index
        : binding.primitive(list.item(index.value));
    },
  );
  for (const name of ["appendMedium", "deleteMedium"] as const) {
    binding.method(
      binding.mediaListPrototype,
      name,
      1,
      (thisValue, argumentsList) => {
        const list = mediaList(binding, thisValue);
        if (list === null) {
          return binding.typeError("Invalid MediaList receiver");
        }
        const medium = binding.stringArgument(argumentsList, 0, name);
        if (medium.type === "throw") {
          return medium;
        }
        return binding.domOperationResult(() => {
          list[name](medium.value);
          return binding.undefined();
        });
      },
    );
  }
  binding.method(binding.mediaListPrototype, "toString", 0, (thisValue) => {
    const list = mediaList(binding, thisValue);
    return list === null
      ? binding.typeError("Invalid MediaList receiver")
      : binding.primitive(list.toString());
  });
}

function installRuleMembers(binding: DOMRealmBindingContext): void {
  binding.attribute(binding.cssRulePrototype, "cssText", (thisValue) => {
    const rule = cssRule(binding, thisValue);
    return rule === null
      ? binding.typeError("Invalid CSSRule receiver")
      : binding.primitive(rule.cssText);
  });
  binding.attribute(binding.cssRulePrototype, "parentRule", (thisValue) => {
    const rule = cssRule(binding, thisValue);
    return rule === null
      ? binding.typeError("Invalid CSSRule receiver")
      : binding.platformValue(rule.parentRule);
  });
  binding.attribute(
    binding.cssRulePrototype,
    "parentStyleSheet",
    (thisValue) => {
      const rule = cssRule(binding, thisValue);
      return rule === null
        ? binding.typeError("Invalid CSSRule receiver")
        : binding.platformValue(rule.parentStyleSheet);
    },
  );
  binding.attribute(binding.cssRulePrototype, "type", (thisValue) => {
    const rule = cssRule(binding, thisValue);
    return rule === null
      ? binding.typeError("Invalid CSSRule receiver")
      : binding.primitive(rule.type);
  });
  binding.attribute(
    binding.cssStyleRulePrototype,
    "selectorText",
    (thisValue) => {
      const rule = cssStyleRule(binding, thisValue);
      return rule === null
        ? binding.typeError("Invalid CSSStyleRule receiver")
        : binding.primitive(rule.selectorText);
    },
    (thisValue, argumentsList) => {
      const rule = cssStyleRule(binding, thisValue);
      if (rule === null) {
        return binding.typeError("Invalid CSSStyleRule receiver");
      }
      const value = binding.stringArgument(argumentsList, 0, "selectorText");
      if (value.type === "throw") {
        return value;
      }
      rule.selectorText = value.value;
      return binding.undefined();
    },
  );
  binding.attribute(binding.cssStyleRulePrototype, "style", (thisValue) => {
    const rule = cssStyleRule(binding, thisValue);
    return rule === null
      ? binding.typeError("Invalid CSSStyleRule receiver")
      : normal(binding.wrap(rule.style));
  });
}

function installRuleListMembers(binding: DOMRealmBindingContext): void {
  binding.attribute(binding.cssRuleListPrototype, "length", (thisValue) => {
    const list = cssRuleList(binding, thisValue);
    return list === null
      ? binding.typeError("Invalid CSSRuleList receiver")
      : binding.primitive(list.length);
  });
  binding.method(
    binding.cssRuleListPrototype,
    "item",
    1,
    (thisValue, argumentsList) => {
      const list = cssRuleList(binding, thisValue);
      if (list === null) {
        return binding.typeError("Invalid CSSRuleList receiver");
      }
      const index = binding.unsignedLongArgument(argumentsList, 0, "item");
      return index.type === "throw"
        ? index
        : binding.platformValue(list.item(index.value));
    },
  );
}

function installStyleSheetMembers(binding: DOMRealmBindingContext): void {
  binding.attribute(binding.cssStyleSheetPrototype, "media", (thisValue) => {
    const sheet = cssStyleSheet(binding, thisValue);
    return sheet === null
      ? binding.typeError("Invalid CSSStyleSheet receiver")
      : normal(binding.wrap(sheet.media));
  });
  binding.attribute(
    binding.cssStyleSheetPrototype,
    "ownerNode",
    (thisValue) => {
      const sheet = cssStyleSheet(binding, thisValue);
      return sheet === null
        ? binding.typeError("Invalid CSSStyleSheet receiver")
        : binding.platformValue(sheet.ownerNode);
    },
  );
  for (const name of ["cssRules", "rules"] as const) {
    binding.attribute(binding.cssStyleSheetPrototype, name, (thisValue) => {
      const sheet = cssStyleSheet(binding, thisValue);
      return sheet === null
        ? binding.typeError("Invalid CSSStyleSheet receiver")
        : normal(binding.wrap(sheet[name]));
    });
  }
  binding.method(
    binding.cssStyleSheetPrototype,
    "insertRule",
    1,
    (thisValue, argumentsList) => {
      const sheet = cssStyleSheet(binding, thisValue);
      if (sheet === null) {
        return binding.typeError("Invalid CSSStyleSheet receiver");
      }
      const rule = binding.stringArgument(argumentsList, 0, "insertRule");
      if (rule.type === "throw") {
        return rule;
      }
      if (argumentsList[1] === undefined) {
        return binding.domOperationResult(() =>
          binding.primitive(sheet.insertRule(rule.value)),
        );
      }
      const index = binding.unsignedLongArgument(
        argumentsList,
        1,
        "insertRule",
      );
      return index.type === "throw"
        ? index
        : binding.domOperationResult(() =>
            binding.primitive(sheet.insertRule(rule.value, index.value)),
          );
    },
  );
  binding.method(
    binding.cssStyleSheetPrototype,
    "deleteRule",
    1,
    (thisValue, argumentsList) => {
      const sheet = cssStyleSheet(binding, thisValue);
      if (sheet === null) {
        return binding.typeError("Invalid CSSStyleSheet receiver");
      }
      const index = binding.unsignedLongArgument(
        argumentsList,
        0,
        "deleteRule",
      );
      if (index.type === "throw") {
        return index;
      }
      return binding.domOperationResult(() => {
        sheet.deleteRule(index.value);
        return binding.undefined();
      });
    },
  );
  binding.method(
    binding.cssStyleSheetPrototype,
    "replaceSync",
    1,
    (thisValue, argumentsList) => {
      const sheet = cssStyleSheet(binding, thisValue);
      if (sheet === null) {
        return binding.typeError("Invalid CSSStyleSheet receiver");
      }
      const text = binding.stringArgument(argumentsList, 0, "replaceSync");
      if (text.type === "throw") {
        return text;
      }
      return binding.domOperationResult(() => {
        sheet.replaceSync(text.value);
        return binding.undefined();
      });
    },
  );
  binding.method(
    binding.cssStyleSheetPrototype,
    "replace",
    1,
    (thisValue, argumentsList) => {
      const sheet = cssStyleSheet(binding, thisValue);
      if (sheet === null) {
        return binding.typeError("Invalid CSSStyleSheet receiver");
      }
      const text = binding.stringArgument(argumentsList, 0, "replace");
      if (text.type === "throw") {
        return text;
      }
      const replacement = binding.domOperationResult(() => {
        sheet.replaceSync(text.value);
        return normal(binding.wrap(sheet));
      });
      return replacement.type === "throw"
        ? realmPromise(binding, "reject", replacement.value)
        : realmPromise(binding, "resolve", replacement.value);
    },
  );
}

function realmPromise(
  binding: DOMRealmBindingContext,
  methodName: "resolve" | "reject",
  value: EngineValue,
): EngineResult<EngineValue> {
  const constructorResult = binding.engine.get(
    binding.realm,
    binding.engine.globalObject(binding.realm),
    "Promise",
  );
  if (constructorResult.type === "throw") {
    return constructorResult;
  }
  const constructor = binding.engine.asObject(constructorResult.value);
  if (constructor === null) {
    return thrown(
      binding.engine.createTypeError(binding.realm, "Promise is unavailable"),
    );
  }
  const methodResult = binding.engine.get(
    binding.realm,
    constructor,
    methodName,
  );
  if (methodResult.type === "throw") {
    return methodResult;
  }
  const method = binding.engine.asCallable(methodResult.value);
  return method === null
    ? thrown(
        binding.engine.createTypeError(
          binding.realm,
          `Promise.${methodName} is not callable`,
        ),
      )
    : binding.context.call(method, constructor, [value]);
}

function installStyleSheetListMembers(binding: DOMRealmBindingContext): void {
  binding.attribute(binding.styleSheetListPrototype, "length", (thisValue) => {
    const list = styleSheetList(binding, thisValue);
    return list === null
      ? binding.typeError("Invalid StyleSheetList receiver")
      : binding.primitive(list.length);
  });
  binding.method(
    binding.styleSheetListPrototype,
    "item",
    1,
    (thisValue, argumentsList) => {
      const list = styleSheetList(binding, thisValue);
      if (list === null) {
        return binding.typeError("Invalid StyleSheetList receiver");
      }
      const index = binding.unsignedLongArgument(argumentsList, 0, "item");
      return index.type === "throw"
        ? index
        : binding.platformValue(list.item(index.value));
    },
  );
}

function cssRule(
  binding: DOMRealmBindingContext,
  value: Parameters<DOMRealmBindingContext["interfaceObject"]>[0],
): CSSRule | null {
  const object = binding.interfaceObject(value);
  return object instanceof CSSRule ? object : null;
}

function cssGroupingRule(
  binding: DOMRealmBindingContext,
  value: Parameters<DOMRealmBindingContext["interfaceObject"]>[0],
): CSSGroupingRule | null {
  const object = binding.interfaceObject(value);
  return object instanceof CSSGroupingRule ? object : null;
}

function cssConditionRule(
  binding: DOMRealmBindingContext,
  value: Parameters<DOMRealmBindingContext["interfaceObject"]>[0],
): CSSConditionRule | null {
  const object = binding.interfaceObject(value);
  return object instanceof CSSConditionRule ? object : null;
}

function cssMediaRule(
  binding: DOMRealmBindingContext,
  value: Parameters<DOMRealmBindingContext["interfaceObject"]>[0],
): CSSMediaRule | null {
  const object = binding.interfaceObject(value);
  return object instanceof CSSMediaRule ? object : null;
}

function cssStyleRule(
  binding: DOMRealmBindingContext,
  value: Parameters<DOMRealmBindingContext["interfaceObject"]>[0],
): CSSStyleRule | null {
  const object = binding.interfaceObject(value);
  return object instanceof CSSStyleRule ? object : null;
}

function cssRuleList(
  binding: DOMRealmBindingContext,
  value: Parameters<DOMRealmBindingContext["interfaceObject"]>[0],
): CSSRuleList | null {
  const object = binding.interfaceObject(value);
  return object instanceof CSSRuleList ? object : null;
}

function cssStyleSheet(
  binding: DOMRealmBindingContext,
  value: Parameters<DOMRealmBindingContext["interfaceObject"]>[0],
): CSSStyleSheet | null {
  const object = binding.interfaceObject(value);
  return object instanceof CSSStyleSheet ? object : null;
}

function mediaList(
  binding: DOMRealmBindingContext,
  value: Parameters<DOMRealmBindingContext["interfaceObject"]>[0],
): MediaList | null {
  const object = binding.interfaceObject(value);
  return object instanceof MediaList ? object : null;
}

function styleSheetList(
  binding: DOMRealmBindingContext,
  value: Parameters<DOMRealmBindingContext["interfaceObject"]>[0],
): StyleSheetList | null {
  const object = binding.interfaceObject(value);
  return object instanceof StyleSheetList ? object : null;
}
