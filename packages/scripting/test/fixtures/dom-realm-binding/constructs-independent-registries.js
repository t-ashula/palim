const registry = new CustomElementRegistry();
class ScopedElement extends HTMLElement {}
registry.define("x-scoped", ScopedElement);
if (registry === customElements) throw new Error("registry was global");
if (registry.get("x-scoped") !== ScopedElement) {
  throw new Error("missing scoped definition");
}
if (customElements.get("x-scoped") !== undefined) {
  throw new Error("definition leaked globally");
}
