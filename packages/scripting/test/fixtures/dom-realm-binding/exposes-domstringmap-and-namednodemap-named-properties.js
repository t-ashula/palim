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
element.setAttribute("data-to-string", "named value");
if (element.dataset.toString !== "named value") {
  throw new Error("DOMStringMap must override inherited properties");
}
element.dataset.runtimeValue = 7;
if (
  element.getAttribute("data-runtime-value") !== "7" ||
  Object.getOwnPropertyNames(element.dataset).join("|") !==
    "userId|toString|runtimeValue"
) {
  throw new Error("DOMStringMap setter is invalid");
}
delete element.dataset.userId;
if (element.dataset.userId !== undefined) {
  throw new Error("DOMStringMap deleter is invalid");
}
element.setAttribute("data--lower", "kept");
delete element.dataset["-lower"];
if (element.getAttribute("data--lower") !== "kept") {
  throw new Error("DOMStringMap invalid-name deleter is invalid");
}
element.dataset[9] = "numeric";
const numericDescriptor = Object.getOwnPropertyDescriptor(element.dataset, "9");
if (
  element.getAttribute("data-9") !== "numeric" ||
  numericDescriptor.value !== "numeric" ||
  !numericDescriptor.writable ||
  !numericDescriptor.enumerable ||
  !numericDescriptor.configurable
) {
  throw new Error("DOMStringMap numeric named property is invalid");
}
try {
  element.dataset["-lower"] = "invalid";
  throw new Error("DOMStringMap invalid setter did not throw");
} catch (error) {
  if (!(error instanceof DOMException) || error.name !== "SyntaxError") {
    throw error;
  }
}
try {
  element.dataset["invalid name"] = "invalid";
  throw new Error("DOMStringMap invalid attribute name did not throw");
} catch (error) {
  if (
    !(error instanceof DOMException) ||
    error.name !== "InvalidCharacterError"
  ) {
    throw error;
  }
}
const attributes = element.attributes;
if (
  !(attributes instanceof NamedNodeMap) ||
  !(attributes[0] instanceof Attr) ||
  Object.getOwnPropertyNames(attributes).join("|") !==
    "0|1|2|3|4|5|id|class|data-to-string|data-runtime-value|data--lower|data-9"
) {
  throw new Error("NamedNodeMap properties are invalid");
}
