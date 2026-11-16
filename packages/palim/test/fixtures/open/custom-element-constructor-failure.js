customElements.define(
  "x-constructor-failure",
  class extends HTMLElement {
    constructor() {
      super();
      throw new Error("custom element constructor failure");
    }
  },
);
