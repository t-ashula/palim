class DirectElement extends HTMLElement {}
customElements.define("x-direct", DirectElement);
const element = new DirectElement();
if (!(element instanceof DirectElement)) {
  throw new Error("wrong prototype");
}
if (element.localName !== "x-direct") {
  throw new Error("wrong local name");
}
