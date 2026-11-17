const target = document.getElementById("target");
if (window.getComputedStyle !== getComputedStyle) {
  throw new Error("getComputedStyle is not exposed on Window");
}
const style = window.getComputedStyle(target, null);

if (!(style instanceof CSSStyleDeclaration)) {
  throw new Error("getComputedStyle did not return CSSStyleDeclaration");
}
if (style.display !== "none") {
  throw new Error("getComputedStyle did not expose display");
}
if (style.getPropertyValue("width") !== "30px") {
  throw new Error("getComputedStyle did not expose width");
}

let modificationError;
try {
  style.setProperty("width", "10px");
} catch (error) {
  modificationError = error;
}
if (
  !(modificationError instanceof DOMException) ||
  modificationError.name !== "NoModificationAllowedError"
) {
  throw new Error("getComputedStyle result did not reject modification");
}
if (style.getPropertyValue("width") !== "30px") {
  throw new Error("getComputedStyle result was mutable");
}
