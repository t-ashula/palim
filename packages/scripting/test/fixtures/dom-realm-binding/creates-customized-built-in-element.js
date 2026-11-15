class TestButton extends HTMLButtonElement {
  constructor() {
    super();
    this.setAttribute("constructed", "yes");
  }
}

customElements.define("test-button", TestButton, { extends: "button" });

const element = testDocument.createElement("button", { is: "test-button" });
if (!(element instanceof TestButton)) {
  throw new Error("createElement did not use the customized definition");
}
if (element.getAttribute("constructed") !== "yes") {
  throw new Error("createElement did not invoke the custom constructor");
}
