import { Attr, CharacterData, DocumentType, Text } from "../dom.js";
import { normal } from "./adapter.js";
import type { DOMRealmBindingContext } from "./dom-realm-binding-context.js";

export function installNodeMembers(binding: DOMRealmBindingContext): void {
  binding.attribute(binding.nodePrototype, "nodeType", (thisValue) => {
    const node = binding.node(thisValue);
    return node === null
      ? binding.typeError("Invalid Node receiver")
      : binding.primitive(node.nodeType);
  });
  binding.attribute(binding.nodePrototype, "nodeName", (thisValue) => {
    const node = binding.node(thisValue);
    return node === null
      ? binding.typeError("Invalid Node receiver")
      : binding.primitive(node.nodeName);
  });
  binding.attribute(binding.nodePrototype, "parentNode", (thisValue) => {
    const node = binding.node(thisValue);
    return node === null
      ? binding.typeError("Invalid Node receiver")
      : binding.platformValue(node.parentNode);
  });
  binding.attribute(binding.nodePrototype, "ownerDocument", (thisValue) => {
    const node = binding.node(thisValue);
    return node === null
      ? binding.typeError("Invalid Node receiver")
      : binding.platformValue(node.ownerDocument);
  });
  binding.attribute(binding.nodePrototype, "baseURI", (thisValue) => {
    const node = binding.node(thisValue);
    return node === null
      ? binding.typeError("Invalid Node receiver")
      : binding.primitive(node.baseURI);
  });
  binding.attribute(binding.nodePrototype, "isConnected", (thisValue) => {
    const node = binding.node(thisValue);
    return node === null
      ? binding.typeError("Invalid Node receiver")
      : binding.primitive(node.isConnected);
  });
  for (const name of [
    "firstChild",
    "lastChild",
    "previousSibling",
    "nextSibling",
  ] as const) {
    binding.attribute(binding.nodePrototype, name, (thisValue) => {
      const node = binding.node(thisValue);
      return node === null
        ? binding.typeError("Invalid Node receiver")
        : binding.platformValue(node[name]);
    });
  }
  binding.attribute(binding.nodePrototype, "childNodes", (thisValue) => {
    const node = binding.node(thisValue);
    return node === null
      ? binding.typeError("Invalid Node receiver")
      : normal(binding.wrap(node.childNodes));
  });
  binding.attribute(
    binding.nodePrototype,
    "textContent",
    (thisValue) => {
      const node = binding.node(thisValue);
      return node === null
        ? binding.typeError("Invalid Node receiver")
        : binding.primitive(node.textContent);
    },
    (thisValue, argumentsList) => {
      const node = binding.node(thisValue);
      const value = argumentsList[0];
      if (node === null) {
        return binding.typeError("Invalid Node receiver");
      }
      if (value === undefined) {
        node.textContent = "undefined";
        return binding.undefined();
      }
      if (binding.engine.isNull(value)) {
        node.textContent = null;
        return binding.undefined();
      }
      const converted = binding.engine.toString(binding.realm, value);
      if (converted.type === "throw") {
        return converted;
      }
      node.textContent = converted.value;
      return binding.undefined();
    },
  );
  binding.attribute(binding.nodePrototype, "nodeValue", (thisValue) => {
    const node = binding.node(thisValue);
    return node === null
      ? binding.typeError("Invalid Node receiver")
      : binding.primitive(
          node instanceof CharacterData
            ? node.data
            : node instanceof Attr
              ? node.value
              : null,
        );
  });
  binding.method(
    binding.nodePrototype,
    "appendChild",
    1,
    (thisValue, argumentsList) => {
      const node = binding.node(thisValue);
      const childValue = argumentsList[0];
      const child = childValue === undefined ? null : binding.node(childValue);
      if (node === null || child === null) {
        return binding.typeError("The argument is not a Node");
      }
      return normal(binding.wrap(node.appendChild(child)));
    },
  );
  binding.method(
    binding.nodePrototype,
    "removeChild",
    1,
    (thisValue, argumentsList) => {
      const node = binding.node(thisValue);
      const childValue = argumentsList[0];
      const child = childValue === undefined ? null : binding.node(childValue);
      if (node === null || child === null) {
        return binding.typeError("The argument is not a Node");
      }
      return normal(binding.wrap(node.removeChild(child)));
    },
  );
  binding.method(
    binding.nodePrototype,
    "insertBefore",
    2,
    (thisValue, argumentsList) => {
      const node = binding.node(thisValue);
      const childValue = argumentsList[0];
      const child = childValue === undefined ? null : binding.node(childValue);
      if (node === null || child === null) {
        return binding.typeError("The argument is not a Node");
      }
      const referenceValue = argumentsList[1];
      const reference =
        referenceValue === undefined || binding.engine.isNull(referenceValue)
          ? null
          : binding.node(referenceValue);
      if (referenceValue === undefined || reference === null) {
        if (
          referenceValue !== undefined &&
          !binding.engine.isNull(referenceValue)
        ) {
          return binding.typeError("The reference is not a Node");
        }
      }
      return normal(binding.wrap(node.insertBefore(child, reference)));
    },
  );
  binding.method(binding.nodePrototype, "hasChildNodes", 0, (thisValue) => {
    const node = binding.node(thisValue);
    return node === null
      ? binding.typeError("Invalid Node receiver")
      : binding.primitive(node.firstChild !== null);
  });
}

export function installCharacterDataMembers(
  binding: DOMRealmBindingContext,
): void {
  binding.attribute(
    binding.characterDataPrototype,
    "data",
    (thisValue) => {
      const data = binding.characterData(thisValue);
      return data === null
        ? binding.typeError("Invalid CharacterData receiver")
        : binding.primitive(data.data);
    },
    (thisValue, argumentsList) => {
      const characterData = binding.characterData(thisValue);
      if (characterData === null) {
        return binding.typeError("Invalid CharacterData receiver");
      }
      const data = binding.legacyNullToEmptyStringArgument(
        argumentsList,
        0,
        "data",
      );
      if (data.type === "throw") {
        return data;
      }
      return binding.domOperationResult(() => {
        characterData.data = data.value;
        return binding.undefined();
      });
    },
  );
  binding.attribute(binding.characterDataPrototype, "length", (thisValue) => {
    const data = binding.characterData(thisValue);
    return data === null
      ? binding.typeError("Invalid CharacterData receiver")
      : binding.primitive(data.length);
  });
  for (const name of [
    "previousElementSibling",
    "nextElementSibling",
  ] as const) {
    binding.attribute(binding.characterDataPrototype, name, (thisValue) => {
      const data = binding.characterData(thisValue);
      return data === null
        ? binding.typeError("Invalid CharacterData receiver")
        : binding.platformValue(data[name]);
    });
  }
  binding.method(
    binding.characterDataPrototype,
    "substringData",
    2,
    (thisValue, argumentsList) => {
      const data = binding.characterData(thisValue);
      if (data === null) {
        return binding.typeError("Invalid CharacterData receiver");
      }
      const offset = binding.unsignedLongArgument(
        argumentsList,
        0,
        "substringData",
      );
      if (offset.type === "throw") {
        return offset;
      }
      const count = binding.unsignedLongArgument(
        argumentsList,
        1,
        "substringData",
      );
      return count.type === "throw"
        ? count
        : binding.domOperationResult(() =>
            binding.primitive(data.substringData(offset.value, count.value)),
          );
    },
  );
  binding.method(
    binding.characterDataPrototype,
    "appendData",
    1,
    (thisValue, argumentsList) => {
      const characterData = binding.characterData(thisValue);
      if (characterData === null) {
        return binding.typeError("Invalid CharacterData receiver");
      }
      const data = binding.stringArgument(argumentsList, 0, "appendData");
      if (data.type === "throw") {
        return data;
      }
      return binding.domOperationResult(() => {
        characterData.appendData(data.value);
        return binding.undefined();
      });
    },
  );
  binding.method(
    binding.characterDataPrototype,
    "insertData",
    2,
    (thisValue, argumentsList) => {
      const characterData = binding.characterData(thisValue);
      if (characterData === null) {
        return binding.typeError("Invalid CharacterData receiver");
      }
      const offset = binding.unsignedLongArgument(
        argumentsList,
        0,
        "insertData",
      );
      if (offset.type === "throw") {
        return offset;
      }
      const data = binding.stringArgument(argumentsList, 1, "insertData");
      if (data.type === "throw") {
        return data;
      }
      return binding.domOperationResult(() => {
        characterData.insertData(offset.value, data.value);
        return binding.undefined();
      });
    },
  );
  binding.method(
    binding.characterDataPrototype,
    "deleteData",
    2,
    (thisValue, argumentsList) => {
      const characterData = binding.characterData(thisValue);
      if (characterData === null) {
        return binding.typeError("Invalid CharacterData receiver");
      }
      const offset = binding.unsignedLongArgument(
        argumentsList,
        0,
        "deleteData",
      );
      if (offset.type === "throw") {
        return offset;
      }
      const count = binding.unsignedLongArgument(
        argumentsList,
        1,
        "deleteData",
      );
      if (count.type === "throw") {
        return count;
      }
      return binding.domOperationResult(() => {
        characterData.deleteData(offset.value, count.value);
        return binding.undefined();
      });
    },
  );
  binding.method(
    binding.characterDataPrototype,
    "replaceData",
    3,
    (thisValue, argumentsList) => {
      const characterData = binding.characterData(thisValue);
      if (characterData === null) {
        return binding.typeError("Invalid CharacterData receiver");
      }
      const offset = binding.unsignedLongArgument(
        argumentsList,
        0,
        "replaceData",
      );
      if (offset.type === "throw") {
        return offset;
      }
      const count = binding.unsignedLongArgument(
        argumentsList,
        1,
        "replaceData",
      );
      if (count.type === "throw") {
        return count;
      }
      const data = binding.stringArgument(argumentsList, 2, "replaceData");
      if (data.type === "throw") {
        return data;
      }
      return binding.domOperationResult(() => {
        characterData.replaceData(offset.value, count.value, data.value);
        return binding.undefined();
      });
    },
  );
  binding.installChildNodeMutationMembers(
    binding.characterDataPrototype,
    (value) => binding.characterData(value),
    "CharacterData",
  );
  binding.method(
    binding.textPrototype,
    "splitText",
    1,
    (thisValue, argumentsList) => {
      const characterData = binding.characterData(thisValue);
      if (!(characterData instanceof Text)) {
        return binding.typeError("Invalid Text receiver");
      }
      const offset = binding.unsignedLongArgument(
        argumentsList,
        0,
        "splitText",
      );
      return offset.type === "throw"
        ? offset
        : binding.domOperationResult(() =>
            normal(binding.wrap(characterData.splitText(offset.value))),
          );
    },
  );
}

export function installAttrMembers(binding: DOMRealmBindingContext): void {
  for (const name of [
    "namespaceURI",
    "prefix",
    "localName",
    "name",
    "ownerElement",
  ] as const) {
    binding.attribute(binding.attrPrototype, name, (thisValue) => {
      const attribute = binding.attr(thisValue);
      return attribute === null
        ? binding.typeError("Invalid Attr receiver")
        : name === "ownerElement"
          ? binding.platformValue(attribute.ownerElement)
          : binding.primitive(attribute[name]);
    });
  }
  binding.attribute(binding.attrPrototype, "specified", (thisValue) => {
    const attribute = binding.attr(thisValue);
    return attribute === null
      ? binding.typeError("Invalid Attr receiver")
      : binding.primitive(true);
  });
  binding.attribute(
    binding.attrPrototype,
    "value",
    (thisValue) => {
      const attribute = binding.attr(thisValue);
      return attribute === null
        ? binding.typeError("Invalid Attr receiver")
        : binding.primitive(attribute.value);
    },
    (thisValue, argumentsList) => {
      const attribute = binding.attr(thisValue);
      if (attribute === null) {
        return binding.typeError("Invalid Attr receiver");
      }
      const value = binding.stringArgument(argumentsList, 0, "value");
      if (value.type === "throw") {
        return value;
      }
      attribute.value = value.value;
      return binding.undefined();
    },
  );
}

export function installElementMembers(binding: DOMRealmBindingContext): void {
  for (const name of ["localName", "tagName"] as const) {
    binding.attribute(binding.elementPrototype, name, (thisValue) => {
      const element = binding.element(thisValue);
      return element === null
        ? binding.typeError("Invalid Element receiver")
        : binding.primitive(element[name]);
    });
  }
  binding.attribute(binding.elementPrototype, "namespaceURI", (thisValue) => {
    const element = binding.element(thisValue);
    return element === null
      ? binding.typeError("Invalid Element receiver")
      : binding.primitive(element.namespaceURI);
  });
  binding.attribute(binding.elementPrototype, "attributes", (thisValue) => {
    const element = binding.element(thisValue);
    return element === null
      ? binding.typeError("Invalid Element receiver")
      : normal(binding.wrap(element.attributes));
  });
  binding.attribute(binding.elementPrototype, "children", (thisValue) => {
    const element = binding.element(thisValue);
    return element === null
      ? binding.typeError("Invalid Element receiver")
      : normal(binding.wrap(element.children));
  });
  for (const name of [
    "previousElementSibling",
    "nextElementSibling",
  ] as const) {
    binding.attribute(binding.elementPrototype, name, (thisValue) => {
      const element = binding.element(thisValue);
      return element === null
        ? binding.typeError("Invalid Element receiver")
        : binding.platformValue(element[name]);
    });
  }
  binding.attribute(
    binding.elementPrototype,
    "id",
    (thisValue) => {
      const element = binding.element(thisValue);
      return element === null
        ? binding.typeError("Invalid Element receiver")
        : binding.primitive(element.id);
    },
    (thisValue, argumentsList) => {
      const element = binding.element(thisValue);
      if (element === null) {
        return binding.typeError("Invalid Element receiver");
      }
      const value = binding.stringArgument(argumentsList, 0, "id");
      if (value.type === "throw") {
        return value;
      }
      element.id = value.value;
      return binding.undefined();
    },
  );
  binding.attribute(
    binding.elementPrototype,
    "className",
    (thisValue) => {
      const element = binding.element(thisValue);
      return element === null
        ? binding.typeError("Invalid Element receiver")
        : binding.primitive(element.className);
    },
    (thisValue, argumentsList) => {
      const element = binding.element(thisValue);
      if (element === null) {
        return binding.typeError("Invalid Element receiver");
      }
      const value = binding.stringArgument(argumentsList, 0, "className");
      if (value.type === "throw") {
        return value;
      }
      element.className = value.value;
      return binding.undefined();
    },
  );
  binding.attribute(
    binding.elementPrototype,
    "classList",
    (thisValue) => {
      const element = binding.element(thisValue);
      return element === null
        ? binding.typeError("Invalid Element receiver")
        : normal(binding.wrap(element.classList));
    },
    (thisValue, argumentsList) => {
      const element = binding.element(thisValue);
      if (element === null) {
        return binding.typeError("Invalid Element receiver");
      }
      const value = binding.stringArgument(argumentsList, 0, "classList");
      if (value.type === "throw") {
        return value;
      }
      element.classList.value = value.value;
      return binding.undefined();
    },
  );
  binding.attribute(
    binding.elementPrototype,
    "innerHTML",
    (thisValue) => {
      const element = binding.element(thisValue);
      return element === null
        ? binding.typeError("Invalid Element receiver")
        : binding.domOperationResult(() =>
            binding.primitive(element.innerHTML),
          );
    },
    (thisValue, argumentsList) => {
      const element = binding.element(thisValue);
      if (element === null) {
        return binding.typeError("Invalid Element receiver");
      }
      const value = binding.legacyNullToEmptyStringArgument(
        argumentsList,
        0,
        "innerHTML",
      );
      if (value.type === "throw") {
        return value;
      }
      return binding.domOperationResult(() => {
        element.innerHTML = value.value;
        return binding.undefined();
      });
    },
  );
  binding.attribute(
    binding.elementPrototype,
    "outerHTML",
    (thisValue) => {
      const element = binding.element(thisValue);
      return element === null
        ? binding.typeError("Invalid Element receiver")
        : binding.domOperationResult(() =>
            binding.primitive(element.outerHTML),
          );
    },
    (thisValue, argumentsList) => {
      const element = binding.element(thisValue);
      if (element === null) {
        return binding.typeError("Invalid Element receiver");
      }
      const value = binding.legacyNullToEmptyStringArgument(
        argumentsList,
        0,
        "outerHTML",
      );
      if (value.type === "throw") {
        return value;
      }
      return binding.domOperationResult(() => {
        element.outerHTML = value.value;
        return binding.undefined();
      });
    },
  );
  binding.method(
    binding.elementPrototype,
    "insertAdjacentHTML",
    2,
    (thisValue, argumentsList) => {
      const element = binding.element(thisValue);
      if (element === null) {
        return binding.typeError("Invalid Element receiver");
      }
      const position = binding.stringArgument(
        argumentsList,
        0,
        "insertAdjacentHTML",
      );
      if (position.type === "throw") {
        return position;
      }
      const text = binding.stringArgument(
        argumentsList,
        1,
        "insertAdjacentHTML",
      );
      if (text.type === "throw") {
        return text;
      }
      return binding.domOperationResult(() => {
        element.insertAdjacentHTML(position.value, text.value);
        return binding.undefined();
      });
    },
  );
  binding.method(
    binding.elementPrototype,
    "getAttribute",
    1,
    (thisValue, argumentsList) => {
      const element = binding.element(thisValue);
      if (element === null) {
        return binding.typeError("Invalid Element receiver");
      }
      const name = binding.stringArgument(argumentsList, 0, "getAttribute");
      return name.type === "throw"
        ? name
        : binding.primitive(element.getAttribute(name.value));
    },
  );
  binding.method(
    binding.elementPrototype,
    "getAttributeNode",
    1,
    (thisValue, argumentsList) => {
      const element = binding.element(thisValue);
      if (element === null) {
        return binding.typeError("Invalid Element receiver");
      }
      const name = binding.stringArgument(argumentsList, 0, "getAttributeNode");
      return name.type === "throw"
        ? name
        : binding.platformValue(element.getAttributeNode(name.value));
    },
  );
  binding.method(
    binding.elementPrototype,
    "getAttributeNames",
    0,
    (thisValue) => {
      const element = binding.element(thisValue);
      return element === null
        ? binding.typeError("Invalid Element receiver")
        : normal(
            binding.engine.createArray(
              binding.realm,
              element
                .getAttributeNames()
                .map((name) => binding.engine.fromPrimitive(name)),
            ),
          );
    },
  );
  for (const name of [
    "getAttributeNS",
    "getAttributeNodeNS",
    "hasAttributeNS",
  ] as const) {
    binding.method(
      binding.elementPrototype,
      name,
      2,
      (thisValue, argumentsList) => {
        const element = binding.element(thisValue);
        if (element === null) {
          return binding.typeError("Invalid Element receiver");
        }
        const namespace = binding.nullableStringArgument(
          argumentsList,
          0,
          name,
        );
        if (namespace.type === "throw") {
          return namespace;
        }
        const localName = binding.stringArgument(argumentsList, 1, name);
        if (localName.type === "throw") {
          return localName;
        }
        if (name === "getAttributeNodeNS") {
          return binding.platformValue(
            element.getAttributeNodeNS(namespace.value, localName.value),
          );
        }
        return binding.primitive(
          name === "getAttributeNS"
            ? element.getAttributeNS(namespace.value, localName.value)
            : element.hasAttributeNS(namespace.value, localName.value),
        );
      },
    );
  }
  binding.method(
    binding.elementPrototype,
    "setAttribute",
    2,
    (thisValue, argumentsList) => {
      const element = binding.element(thisValue);
      if (element === null) {
        return binding.typeError("Invalid Element receiver");
      }
      const name = binding.stringArgument(argumentsList, 0, "setAttribute");
      if (name.type === "throw") {
        return name;
      }
      const value = binding.stringArgument(argumentsList, 1, "setAttribute");
      if (value.type === "throw") {
        return value;
      }
      return binding.domOperationResult(() => {
        element.setAttribute(name.value, value.value);
        return binding.undefined();
      });
    },
  );
  binding.method(
    binding.elementPrototype,
    "setAttributeNS",
    3,
    (thisValue, argumentsList) => {
      const element = binding.element(thisValue);
      if (element === null) {
        return binding.typeError("Invalid Element receiver");
      }
      const namespace = binding.nullableStringArgument(
        argumentsList,
        0,
        "setAttributeNS",
      );
      if (namespace.type === "throw") {
        return namespace;
      }
      const qualifiedName = binding.stringArgument(
        argumentsList,
        1,
        "setAttributeNS",
      );
      if (qualifiedName.type === "throw") {
        return qualifiedName;
      }
      const value = binding.stringArgument(argumentsList, 2, "setAttributeNS");
      if (value.type === "throw") {
        return value;
      }
      return binding.domOperationResult(() => {
        element.setAttributeNS(
          namespace.value,
          qualifiedName.value,
          value.value,
        );
        return binding.undefined();
      });
    },
  );
  binding.method(
    binding.elementPrototype,
    "removeAttribute",
    1,
    (thisValue, argumentsList) => {
      const element = binding.element(thisValue);
      if (element === null) {
        return binding.typeError("Invalid Element receiver");
      }
      const name = binding.stringArgument(argumentsList, 0, "removeAttribute");
      if (name.type === "throw") {
        return name;
      }
      element.removeAttribute(name.value);
      return binding.undefined();
    },
  );
  binding.method(
    binding.elementPrototype,
    "removeAttributeNS",
    2,
    (thisValue, argumentsList) => {
      const element = binding.element(thisValue);
      if (element === null) {
        return binding.typeError("Invalid Element receiver");
      }
      const namespace = binding.nullableStringArgument(
        argumentsList,
        0,
        "removeAttributeNS",
      );
      if (namespace.type === "throw") {
        return namespace;
      }
      const localName = binding.stringArgument(
        argumentsList,
        1,
        "removeAttributeNS",
      );
      if (localName.type === "throw") {
        return localName;
      }
      element.removeAttributeNS(namespace.value, localName.value);
      return binding.undefined();
    },
  );
  for (const name of [
    "setAttributeNode",
    "setAttributeNodeNS",
    "removeAttributeNode",
  ] as const) {
    binding.method(
      binding.elementPrototype,
      name,
      1,
      (thisValue, argumentsList) => {
        const element = binding.element(thisValue);
        const argument = argumentsList[0];
        const attribute =
          argument === undefined ? null : binding.attr(argument);
        if (element === null) {
          return binding.typeError("Invalid Element receiver");
        }
        if (attribute === null) {
          return binding.typeError(`${name} requires an Attr argument`);
        }
        return binding.domOperationResult(() =>
          binding.platformValue(element[name](attribute)),
        );
      },
    );
  }
  binding.method(
    binding.elementPrototype,
    "hasAttribute",
    1,
    (thisValue, argumentsList) => {
      const element = binding.element(thisValue);
      if (element === null) {
        return binding.typeError("Invalid Element receiver");
      }
      const name = binding.stringArgument(argumentsList, 0, "hasAttribute");
      return name.type === "throw"
        ? name
        : binding.primitive(element.hasAttribute(name.value));
    },
  );
  binding.method(
    binding.elementPrototype,
    "toggleAttribute",
    1,
    (thisValue, argumentsList) => {
      const element = binding.element(thisValue);
      if (element === null) {
        return binding.typeError("Invalid Element receiver");
      }
      const name = binding.stringArgument(argumentsList, 0, "toggleAttribute");
      if (name.type === "throw") {
        return name;
      }
      const force = argumentsList[1];
      return binding.domOperationResult(() =>
        binding.primitive(
          force === undefined || binding.engine.isUndefined(force)
            ? element.toggleAttribute(name.value)
            : element.toggleAttribute(
                name.value,
                binding.engine.toBoolean(force),
              ),
        ),
      );
    },
  );
  binding.method(
    binding.elementPrototype,
    "querySelector",
    1,
    (thisValue, argumentsList) => {
      const element = binding.element(thisValue);
      if (element === null) {
        return binding.typeError("Invalid Element receiver");
      }
      const selectors = binding.stringArgument(
        argumentsList,
        0,
        "querySelector",
      );
      return selectors.type === "throw"
        ? selectors
        : binding.platformValue(element.querySelector(selectors.value));
    },
  );
  binding.method(
    binding.elementPrototype,
    "querySelectorAll",
    1,
    (thisValue, argumentsList) => {
      const element = binding.element(thisValue);
      if (element === null) {
        return binding.typeError("Invalid Element receiver");
      }
      const selectors = binding.stringArgument(
        argumentsList,
        0,
        "querySelectorAll",
      );
      return selectors.type === "throw"
        ? selectors
        : normal(binding.wrap(element.querySelectorAll(selectors.value)));
    },
  );
  binding.method(
    binding.elementPrototype,
    "getElementsByTagName",
    1,
    (thisValue, argumentsList) => {
      const element = binding.element(thisValue);
      if (element === null) {
        return binding.typeError("Invalid Element receiver");
      }
      const qualifiedName = binding.stringArgument(
        argumentsList,
        0,
        "getElementsByTagName",
      );
      return qualifiedName.type === "throw"
        ? qualifiedName
        : normal(
            binding.wrap(element.getElementsByTagName(qualifiedName.value)),
          );
    },
  );
  binding.method(
    binding.elementPrototype,
    "getElementsByTagNameNS",
    2,
    (thisValue, argumentsList) => {
      const element = binding.element(thisValue);
      if (element === null) {
        return binding.typeError("Invalid Element receiver");
      }
      const namespace = binding.nullableStringArgument(
        argumentsList,
        0,
        "getElementsByTagNameNS",
      );
      if (namespace.type === "throw") {
        return namespace;
      }
      const localName = binding.stringArgument(
        argumentsList,
        1,
        "getElementsByTagNameNS",
      );
      return localName.type === "throw"
        ? localName
        : normal(
            binding.wrap(
              element.getElementsByTagNameNS(namespace.value, localName.value),
            ),
          );
    },
  );
  binding.method(
    binding.elementPrototype,
    "getElementsByClassName",
    1,
    (thisValue, argumentsList) => {
      const element = binding.element(thisValue);
      if (element === null) {
        return binding.typeError("Invalid Element receiver");
      }
      const classNames = binding.stringArgument(
        argumentsList,
        0,
        "getElementsByClassName",
      );
      return classNames.type === "throw"
        ? classNames
        : normal(
            binding.wrap(element.getElementsByClassName(classNames.value)),
          );
    },
  );
  binding.installParentNodeMutationMembers(
    binding.elementPrototype,
    (value) => binding.element(value),
    "Element",
  );
  binding.installChildNodeMutationMembers(
    binding.elementPrototype,
    (value) => binding.element(value),
    "Element",
  );
}

export function installDocumentMembers(binding: DOMRealmBindingContext): void {
  binding.attribute(
    binding.documentPrototype,
    "implementation",
    (thisValue) => {
      const document = binding.document(thisValue);
      return document === null
        ? binding.typeError("Invalid Document receiver")
        : normal(binding.wrap(document.implementation));
    },
  );
  binding.attribute(binding.documentPrototype, "defaultView", (thisValue) => {
    const document = binding.document(thisValue);
    return document === null
      ? binding.typeError("Invalid Document receiver")
      : binding.platformValue(document.defaultView);
  });
  for (const name of ["head", "body"] as const) {
    binding.attribute(binding.documentPrototype, name, (thisValue) => {
      const document = binding.document(thisValue);
      return document === null
        ? binding.typeError("Invalid Document receiver")
        : binding.platformValue(document[name]);
    });
  }
  for (const name of ["doctype", "documentElement"] as const) {
    binding.attribute(binding.documentPrototype, name, (thisValue) => {
      const document = binding.document(thisValue);
      return document === null
        ? binding.typeError("Invalid Document receiver")
        : binding.platformValue(document[name]);
    });
  }
  binding.attribute(binding.documentPrototype, "location", (thisValue) => {
    const document = binding.document(thisValue);
    return document === null
      ? binding.typeError("Invalid Document receiver")
      : binding.primitive(document.location);
  });
  binding.attribute(
    binding.documentPrototype,
    "title",
    (thisValue) => {
      const document = binding.document(thisValue);
      return document === null
        ? binding.typeError("Invalid Document receiver")
        : binding.primitive(document.title);
    },
    (thisValue, argumentsList) => {
      const document = binding.document(thisValue);
      if (document === null) {
        return binding.typeError("Invalid Document receiver");
      }
      const value = binding.stringArgument(argumentsList, 0, "title");
      if (value.type === "throw") {
        return value;
      }
      document.title = value.value;
      return binding.undefined();
    },
  );
  for (const name of [
    "URL",
    "documentURI",
    "compatMode",
    "characterSet",
    "charset",
    "inputEncoding",
    "contentType",
    "readyState",
  ] as const) {
    binding.attribute(binding.documentPrototype, name, (thisValue) => {
      const document = binding.document(thisValue);
      return document === null
        ? binding.typeError("Invalid Document receiver")
        : binding.primitive(document[name]);
    });
  }
  binding.method(
    binding.documentPrototype,
    "querySelector",
    1,
    (thisValue, argumentsList) => {
      const document = binding.document(thisValue);
      if (document === null) {
        return binding.typeError("Invalid Document receiver");
      }
      const selectors = binding.stringArgument(
        argumentsList,
        0,
        "querySelector",
      );
      return selectors.type === "throw"
        ? selectors
        : binding.platformValue(document.querySelector(selectors.value));
    },
  );
  binding.method(
    binding.documentPrototype,
    "querySelectorAll",
    1,
    (thisValue, argumentsList) => {
      const document = binding.document(thisValue);
      if (document === null) {
        return binding.typeError("Invalid Document receiver");
      }
      const selectors = binding.stringArgument(
        argumentsList,
        0,
        "querySelectorAll",
      );
      return selectors.type === "throw"
        ? selectors
        : normal(binding.wrap(document.querySelectorAll(selectors.value)));
    },
  );
  binding.method(
    binding.documentPrototype,
    "getElementById",
    1,
    (thisValue, argumentsList) => {
      const document = binding.document(thisValue);
      if (document === null) {
        return binding.typeError("Invalid Document receiver");
      }
      const id = binding.stringArgument(argumentsList, 0, "getElementById");
      return id.type === "throw"
        ? id
        : binding.platformValue(document.getElementById(id.value));
    },
  );
  binding.method(
    binding.documentPrototype,
    "getElementsByTagName",
    1,
    (thisValue, argumentsList) => {
      const document = binding.document(thisValue);
      if (document === null) {
        return binding.typeError("Invalid Document receiver");
      }
      const qualifiedName = binding.stringArgument(
        argumentsList,
        0,
        "getElementsByTagName",
      );
      return qualifiedName.type === "throw"
        ? qualifiedName
        : normal(
            binding.wrap(document.getElementsByTagName(qualifiedName.value)),
          );
    },
  );
  binding.method(
    binding.documentPrototype,
    "getElementsByTagNameNS",
    2,
    (thisValue, argumentsList) => {
      const document = binding.document(thisValue);
      if (document === null) {
        return binding.typeError("Invalid Document receiver");
      }
      const namespace = binding.nullableStringArgument(
        argumentsList,
        0,
        "getElementsByTagNameNS",
      );
      if (namespace.type === "throw") {
        return namespace;
      }
      const localName = binding.stringArgument(
        argumentsList,
        1,
        "getElementsByTagNameNS",
      );
      return localName.type === "throw"
        ? localName
        : normal(
            binding.wrap(
              document.getElementsByTagNameNS(namespace.value, localName.value),
            ),
          );
    },
  );
  binding.method(
    binding.documentPrototype,
    "getElementsByClassName",
    1,
    (thisValue, argumentsList) => {
      const document = binding.document(thisValue);
      if (document === null) {
        return binding.typeError("Invalid Document receiver");
      }
      const classNames = binding.stringArgument(
        argumentsList,
        0,
        "getElementsByClassName",
      );
      return classNames.type === "throw"
        ? classNames
        : normal(
            binding.wrap(document.getElementsByClassName(classNames.value)),
          );
    },
  );
  binding.method(
    binding.documentPrototype,
    "getElementsByName",
    1,
    (thisValue, argumentsList) => {
      const document = binding.document(thisValue);
      if (document === null) {
        return binding.typeError("Invalid Document receiver");
      }
      const elementName = binding.stringArgument(
        argumentsList,
        0,
        "getElementsByName",
      );
      return elementName.type === "throw"
        ? elementName
        : normal(binding.wrap(document.getElementsByName(elementName.value)));
    },
  );
  binding.method(
    binding.documentPrototype,
    "createElement",
    1,
    (thisValue, argumentsList) => {
      const document = binding.document(thisValue);
      if (document === null) {
        return binding.typeError("Invalid Document receiver");
      }
      const localName = binding.stringArgument(
        argumentsList,
        0,
        "createElement",
      );
      return localName.type === "throw"
        ? localName
        : normal(binding.wrap(document.createElement(localName.value)));
    },
  );
  binding.method(
    binding.documentPrototype,
    "createElementNS",
    2,
    (thisValue, argumentsList) => {
      const document = binding.document(thisValue);
      if (document === null) {
        return binding.typeError("Invalid Document receiver");
      }
      const namespaceValue = argumentsList[0];
      if (namespaceValue === undefined) {
        return binding.typeError("createElementNS requires 2 argument(s)");
      }
      const namespace = binding.engine.isNull(namespaceValue)
        ? normal(null)
        : binding.engine.toString(binding.realm, namespaceValue);
      if (namespace.type === "throw") {
        return namespace;
      }
      const qualifiedName = binding.stringArgument(
        argumentsList,
        1,
        "createElementNS",
      );
      return qualifiedName.type === "throw"
        ? qualifiedName
        : normal(
            binding.wrap(
              document.createElementNS(namespace.value, qualifiedName.value),
            ),
          );
    },
  );
  binding.method(
    binding.documentPrototype,
    "createAttributeNS",
    2,
    (thisValue, argumentsList) => {
      const document = binding.document(thisValue);
      if (document === null) {
        return binding.typeError("Invalid Document receiver");
      }
      const namespace = binding.nullableStringArgument(
        argumentsList,
        0,
        "createAttributeNS",
      );
      if (namespace.type === "throw") {
        return namespace;
      }
      const qualifiedName = binding.stringArgument(
        argumentsList,
        1,
        "createAttributeNS",
      );
      if (qualifiedName.type === "throw") {
        return qualifiedName;
      }
      return binding.domOperationResult(() =>
        normal(
          binding.wrap(
            document.createAttributeNS(namespace.value, qualifiedName.value),
          ),
        ),
      );
    },
  );
  binding.method(
    binding.documentPrototype,
    "createAttribute",
    1,
    (thisValue, argumentsList) => {
      const document = binding.document(thisValue);
      if (document === null) {
        return binding.typeError("Invalid Document receiver");
      }
      const localName = binding.stringArgument(
        argumentsList,
        0,
        "createAttribute",
      );
      if (localName.type === "throw") {
        return localName;
      }
      return binding.domOperationResult(() =>
        normal(binding.wrap(document.createAttribute(localName.value))),
      );
    },
  );
  for (const name of [
    "createTextNode",
    "createComment",
    "createCDATASection",
  ] as const) {
    binding.method(
      binding.documentPrototype,
      name,
      1,
      (thisValue, argumentsList) => {
        const document = binding.document(thisValue);
        if (document === null) {
          return binding.typeError("Invalid Document receiver");
        }
        const data = binding.stringArgument(argumentsList, 0, name);
        return data.type === "throw"
          ? data
          : normal(binding.wrap(document[name](data.value)));
      },
    );
  }
  binding.method(
    binding.documentPrototype,
    "createProcessingInstruction",
    2,
    (thisValue, argumentsList) => {
      const document = binding.document(thisValue);
      if (document === null) {
        return binding.typeError("Invalid Document receiver");
      }
      const target = binding.stringArgument(
        argumentsList,
        0,
        "createProcessingInstruction",
      );
      if (target.type === "throw") {
        return target;
      }
      const data = binding.stringArgument(
        argumentsList,
        1,
        "createProcessingInstruction",
      );
      return data.type === "throw"
        ? data
        : normal(
            binding.wrap(
              document.createProcessingInstruction(target.value, data.value),
            ),
          );
    },
  );
  binding.method(
    binding.documentPrototype,
    "createDocumentFragment",
    0,
    (thisValue) => {
      const document = binding.document(thisValue);
      return document === null
        ? binding.typeError("Invalid Document receiver")
        : normal(binding.wrap(document.createDocumentFragment()));
    },
  );
  binding.method(binding.documentPrototype, "createRange", 0, (thisValue) => {
    const document = binding.document(thisValue);
    return document === null
      ? binding.typeError("Invalid Document receiver")
      : normal(binding.wrap(document.createRange()));
  });
  binding.method(
    binding.documentPrototype,
    "createNodeIterator",
    1,
    (thisValue, argumentsList) =>
      binding.createTraversal(thisValue, argumentsList, "iterator"),
  );
  binding.method(
    binding.documentPrototype,
    "createTreeWalker",
    1,
    (thisValue, argumentsList) =>
      binding.createTraversal(thisValue, argumentsList, "walker"),
  );
  binding.installParentNodeMutationMembers(
    binding.documentPrototype,
    (value) => binding.document(value),
    "Document",
  );
}

export function installDocumentFragmentMembers(
  binding: DOMRealmBindingContext,
): void {
  binding.attribute(
    binding.documentFragmentPrototype,
    "children",
    (thisValue) => {
      const fragment = binding.documentFragment(thisValue);
      return fragment === null
        ? binding.typeError("Invalid DocumentFragment receiver")
        : normal(binding.wrap(fragment.children));
    },
  );
  binding.method(
    binding.documentFragmentPrototype,
    "querySelector",
    1,
    (thisValue, argumentsList) => {
      const fragment = binding.documentFragment(thisValue);
      if (fragment === null) {
        return binding.typeError("Invalid DocumentFragment receiver");
      }
      const selectors = binding.stringArgument(
        argumentsList,
        0,
        "querySelector",
      );
      return selectors.type === "throw"
        ? selectors
        : binding.platformValue(fragment.querySelector(selectors.value));
    },
  );
  binding.method(
    binding.documentFragmentPrototype,
    "querySelectorAll",
    1,
    (thisValue, argumentsList) => {
      const fragment = binding.documentFragment(thisValue);
      if (fragment === null) {
        return binding.typeError("Invalid DocumentFragment receiver");
      }
      const selectors = binding.stringArgument(
        argumentsList,
        0,
        "querySelectorAll",
      );
      return selectors.type === "throw"
        ? selectors
        : normal(binding.wrap(fragment.querySelectorAll(selectors.value)));
    },
  );
  binding.installParentNodeMutationMembers(
    binding.documentFragmentPrototype,
    (value) => binding.documentFragment(value),
    "DocumentFragment",
  );
}

export function installDocumentTypeMembers(
  binding: DOMRealmBindingContext,
): void {
  for (const name of ["name", "publicId", "systemId"] as const) {
    binding.attribute(binding.documentTypePrototype, name, (thisValue) => {
      const documentType = binding.documentType(thisValue);
      return documentType === null
        ? binding.typeError("Invalid DocumentType receiver")
        : binding.primitive(documentType[name]);
    });
  }
  binding.installChildNodeMutationMembers(
    binding.documentTypePrototype,
    (value) => binding.documentType(value),
    "DocumentType",
  );
  binding.interfaceTag(binding.documentTypePrototype, "DocumentType");
}

export function installDOMImplementationMembers(
  binding: DOMRealmBindingContext,
): void {
  binding.method(
    binding.domImplementationPrototype,
    "createDocumentType",
    3,
    (thisValue, argumentsList) => {
      const implementation = binding.domImplementation(thisValue);
      if (implementation === null) {
        return binding.typeError("Invalid DOMImplementation receiver");
      }
      const values: string[] = [];
      for (const [index, name] of [
        "qualifiedName",
        "publicId",
        "systemId",
      ].entries()) {
        const value = binding.stringArgument(
          argumentsList,
          index,
          `createDocumentType ${name}`,
        );
        if (value.type === "throw") {
          return value;
        }
        values.push(value.value);
      }
      return normal(
        binding.wrap(
          implementation.createDocumentType(
            values[0] ?? "",
            values[1] ?? "",
            values[2] ?? "",
          ),
        ),
      );
    },
  );
  binding.method(
    binding.domImplementationPrototype,
    "createDocument",
    2,
    (thisValue, argumentsList) => {
      const implementation = binding.domImplementation(thisValue);
      if (implementation === null) {
        return binding.typeError("Invalid DOMImplementation receiver");
      }
      const namespace = binding.nullableStringArgument(
        argumentsList,
        0,
        "createDocument",
      );
      if (namespace.type === "throw") {
        return namespace;
      }
      const qualifiedNameValue = argumentsList[1];
      if (qualifiedNameValue === undefined) {
        return binding.typeError("createDocument requires 2 argument(s)");
      }
      const qualifiedName = binding.engine.isNull(qualifiedNameValue)
        ? normal("")
        : binding.engine.toString(binding.realm, qualifiedNameValue);
      if (qualifiedName.type === "throw") {
        return qualifiedName;
      }
      const doctypeValue = argumentsList[2];
      let doctype: DocumentType | null = null;
      if (doctypeValue !== undefined && !binding.engine.isNull(doctypeValue)) {
        const interfaceObject = binding.interfaceObject(doctypeValue);
        if (!(interfaceObject instanceof DocumentType)) {
          return binding.typeError("doctype must be a DocumentType");
        }
        doctype = interfaceObject;
      }
      return normal(
        binding.wrap(
          implementation.createDocument(
            namespace.value,
            qualifiedName.value,
            doctype,
          ),
        ),
      );
    },
  );
  binding.method(
    binding.domImplementationPrototype,
    "createHTMLDocument",
    0,
    (thisValue, argumentsList) => {
      const implementation = binding.domImplementation(thisValue);
      if (implementation === null) {
        return binding.typeError("Invalid DOMImplementation receiver");
      }
      if (argumentsList[0] === undefined) {
        return normal(binding.wrap(implementation.createHTMLDocument()));
      }
      const title = binding.engine.toString(binding.realm, argumentsList[0]);
      return title.type === "throw"
        ? title
        : normal(binding.wrap(implementation.createHTMLDocument(title.value)));
    },
  );
}
