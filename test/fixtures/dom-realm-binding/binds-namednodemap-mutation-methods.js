const element = testDocument.querySelector("main");
const attributes = element.attributes;
for (const [name, length] of [
  ["setNamedItem", 1],
  ["setNamedItemNS", 1],
  ["removeNamedItem", 1],
  ["removeNamedItemNS", 2],
]) {
  if (
    typeof NamedNodeMap.prototype[name] !== "function" ||
    NamedNodeMap.prototype[name].length !== length
  ) {
    throw new Error(name + " has an invalid descriptor");
  }
}

const plain = testDocument.createAttribute("data-value");
plain.value = "plain";
if (attributes.setNamedItem(plain) !== null || attributes.dataValue) {
  throw new Error("setNamedItem returned an invalid value");
}
if (attributes.removeNamedItem("data-value") !== plain) {
  throw new Error("removeNamedItem returned an invalid value");
}

const namespaced = testDocument.createAttributeNS("urn:test", "p:value");
namespaced.value = "namespaced";
if (attributes.setNamedItemNS(namespaced) !== null) {
  throw new Error("setNamedItemNS returned an invalid value");
}
if (attributes.removeNamedItemNS("urn:test", "value") !== namespaced) {
  throw new Error("removeNamedItemNS returned an invalid value");
}

let exception;
try {
  attributes.removeNamedItem("missing");
} catch (error) {
  exception = error;
}
if (
  !(exception instanceof DOMException) ||
  exception.name !== "NotFoundError"
) {
  throw new Error("removeNamedItem did not throw NotFoundError");
}
