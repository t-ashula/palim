const failure = {};
class FailingElement extends HTMLElement {}
Object.defineProperty(FailingElement.prototype, "connectedCallback", {
  get() {
    throw failure;
  },
});
let caught;
try {
  customElements.define("x-failing-callback", FailingElement);
} catch (error) {
  caught = error;
}
if (caught !== failure) {
  throw new Error("custom element callback exception identity changed");
}
