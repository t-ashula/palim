class TestButton extends HTMLButtonElement {}

customElements.define("test-button", TestButton, { extends: "button" });

const element = new TestButton();
if (element.localName !== "button") {
  throw new Error("direct construction did not preserve the local name");
}
if (!(element instanceof TestButton)) {
  throw new Error("direct construction did not apply the custom prototype");
}
if (!(element instanceof HTMLButtonElement)) {
  throw new Error("direct construction used the wrong HTML interface");
}
