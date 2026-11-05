for (const [prototype, name, length] of [
  [Document.prototype, "createAttribute", 1],
  [Element.prototype, "getAttributeNames", 0],
  [Element.prototype, "getAttributeNode", 1],
  [Element.prototype, "toggleAttribute", 1],
]) {
  if (
    typeof prototype[name] !== "function" ||
    prototype[name].length !== length
  ) {
    throw new Error(name + " has an invalid descriptor");
  }
}

const main = testDocument.querySelector("main");
const attribute = testDocument.createAttribute("DATA^VALUE");
attribute.value = "content";
main.setAttributeNode(attribute);
if (
  attribute.name !== "data^value" ||
  main.getAttributeNode("DATA^VALUE") !== attribute ||
  main.getAttributeNames().join(",") !== "data^value"
) {
  throw new Error("non-namespaced Attr lookup is invalid");
}
if (
  !main.toggleAttribute("FLAG", undefined) ||
  !main.hasAttribute("flag") ||
  main.toggleAttribute("flag", false) ||
  main.hasAttribute("flag")
) {
  throw new Error("toggleAttribute conversion is invalid");
}

let error = null;
try {
  main.setAttribute("", "value");
} catch (caught) {
  error = caught;
}
if (
  !(error instanceof DOMException) ||
  error.name !== "InvalidCharacterError"
) {
  throw new Error("setAttribute did not expose InvalidCharacterError");
}
