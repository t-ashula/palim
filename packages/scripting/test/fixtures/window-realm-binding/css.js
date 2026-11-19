if (Object.prototype.toString.call(CSS) !== "[object CSS]") {
  throw new Error("CSS must have the CSS toStringTag");
}
const tag = Object.getOwnPropertyDescriptor(CSS, Symbol.toStringTag);
if (
  tag?.value !== "CSS" ||
  tag.writable !== false ||
  tag.enumerable !== false ||
  tag.configurable !== true
) {
  throw new Error("CSS has an invalid toStringTag descriptor");
}
if (CSS.escape("0a") !== "\\30 a") {
  throw new Error("CSS.escape did not serialize the identifier");
}
if (!CSS.supports("color", "red") || CSS.supports("color", "rainbow")) {
  throw new Error("CSS.supports did not evaluate declarations");
}
if (!CSS.supports("(color: red) and (display: block)")) {
  throw new Error("CSS.supports did not evaluate the condition");
}
