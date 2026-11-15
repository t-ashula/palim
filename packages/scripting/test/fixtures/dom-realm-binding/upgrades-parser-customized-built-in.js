const candidate = testDocument.querySelector("button");
if (candidate === null) {
  throw new Error("parser candidate is missing");
}

class ParserButton extends HTMLButtonElement {
  constructor() {
    super();
    this.setAttribute("upgraded", "yes");
  }
}

customElements.define("parser-button", ParserButton, { extends: "button" });

if (!(candidate instanceof ParserButton)) {
  throw new Error("parser candidate did not receive the custom prototype");
}
if (candidate.getAttribute("upgraded") !== "yes") {
  throw new Error("parser candidate constructor was not invoked");
}
