const element = testDocument.getElementById("target");
if (!(element instanceof HTMLElement)) {
  throw new Error("HTMLElement realm identity is invalid");
}
if (
  !(element.dataset instanceof DOMStringMap) ||
  element.dataset.userId !== "42"
) {
  throw new Error("DOMStringMap getter is invalid");
}
element.dataset.runtimeValue = 7;
if (
  element.getAttribute("data-runtime-value") !== "7" ||
  Object.getOwnPropertyNames(element.dataset).join("|") !==
    "userId|runtimeValue"
) {
  throw new Error("DOMStringMap setter is invalid");
}
delete element.dataset.userId;
if (element.dataset.userId !== undefined) {
  throw new Error("DOMStringMap deleter is invalid");
}
const attributes = element.attributes;
if (
  !(attributes instanceof NamedNodeMap) ||
  !(attributes[0] instanceof Attr) ||
  Object.getOwnPropertyNames(attributes).join("|") !==
    "0|1|2|id|class|data-runtime-value"
) {
  throw new Error("NamedNodeMap properties are invalid");
}
