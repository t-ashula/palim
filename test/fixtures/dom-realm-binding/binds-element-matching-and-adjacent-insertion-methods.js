for (const [name, length] of [
  ["matches", 1],
  ["closest", 1],
  ["hasAttributes", 0],
  ["insertAdjacentElement", 2],
  ["insertAdjacentText", 2],
]) {
  if (
    typeof Element.prototype[name] !== "function" ||
    Element.prototype[name].length !== length
  ) {
    throw new Error(name + " has an invalid descriptor");
  }
}

const main = testDocument.querySelector("main");
const target = testDocument.getElementById("target");
if (
  !target.matches("section#target") ||
  target.closest("main") !== main ||
  !target.hasAttributes()
) {
  throw new Error("Element query result is invalid");
}
const before = testDocument.createElement("before");
if (target.insertAdjacentElement("beforebegin", before) !== before) {
  throw new Error("insertAdjacentElement result is invalid");
}
if (target.insertAdjacentText("afterbegin", "content") !== undefined) {
  throw new Error("insertAdjacentText return value is invalid");
}
let error = null;
try {
  target.insertAdjacentElement("invalid", testDocument.createElement("item"));
} catch (caught) {
  error = caught;
}
if (
  !(error instanceof DOMException) ||
  error.name !== "SyntaxError" ||
  error.code !== 12
) {
  throw new Error("adjacent insertion did not expose SyntaxError");
}
