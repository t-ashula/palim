const main = testDocument.querySelector("main");
const first = testDocument.getElementById("first");
const second = testDocument.getElementById("second");
if (first.outerHTML !== '<p id="first">old</p>') {
  throw new Error("outerHTML getter is invalid");
}
first.outerHTML = null;
second.outerHTML = undefined;
if (main.innerHTML !== "undefined") {
  throw new Error("outerHTML conversion is invalid");
}
main.innerHTML = null;
if (main.innerHTML !== "") {
  throw new Error("innerHTML null conversion is invalid");
}
main.innerHTML = '<span id="target"></span>';
const target = testDocument.getElementById("target");
target.insertAdjacentHTML("beforebegin", "<b>before</b>");
target.insertAdjacentHTML("afterbegin", "<i>first</i>");
target.insertAdjacentHTML("beforeend", "<i>last</i>");
target.insertAdjacentHTML("afterend", "<b>after</b>");
if (
  main.innerHTML !==
  '<b>before</b><span id="target"><i>first</i><i>last</i></span><b>after</b>'
) {
  throw new Error("insertAdjacentHTML is invalid");
}
try {
  target.insertAdjacentHTML("invalid", "");
  throw new Error("invalid insertAdjacentHTML position was accepted");
} catch (error) {
  if (!(error instanceof DOMException) || error.name !== "SyntaxError") {
    throw error;
  }
}
try {
  testDocument.documentElement.outerHTML = "<html></html>";
  throw new Error("document child outerHTML was accepted");
} catch (error) {
  if (
    !(error instanceof DOMException) ||
    error.name !== "NoModificationAllowedError"
  ) {
    throw error;
  }
}
