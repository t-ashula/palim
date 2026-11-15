class RegisteredElement extends HTMLElement {}
let invalidNameError;
try {
  customElements.define("invalid", RegisteredElement);
} catch (error) {
  invalidNameError = error;
}
if (
  !(invalidNameError instanceof DOMException) ||
  invalidNameError.name !== "SyntaxError"
) {
  throw new Error("invalid custom element name was not a SyntaxError");
}

customElements.define("x-registered", RegisteredElement);
let duplicateNameError;
try {
  customElements.define("x-registered", RegisteredElement);
} catch (error) {
  duplicateNameError = error;
}
if (
  !(duplicateNameError instanceof DOMException) ||
  duplicateNameError.name !== "NotSupportedError"
) {
  throw new Error("duplicate custom element name was not supported");
}
