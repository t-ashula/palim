customElements.define(
  "x-shared",
  class extends HTMLElement {
    constructor() {
      super();
      this.setAttribute("constructed", "yes");
    }

    connectedCallback() {
      this.setAttribute("connected-in-first-realm", "yes");
    }
  },
);
