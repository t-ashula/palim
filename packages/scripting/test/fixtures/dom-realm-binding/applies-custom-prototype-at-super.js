const candidate = testDocument.querySelector("x-timing");
class TimingElement extends HTMLElement {
  constructor() {
    if (candidate instanceof TimingElement) {
      throw new Error("prototype applied before super");
    }
    super();
    if (!(candidate instanceof TimingElement)) {
      throw new Error("prototype missing after super");
    }
  }
}
customElements.define("x-timing", TimingElement);
