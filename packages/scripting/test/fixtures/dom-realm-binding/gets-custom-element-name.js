const registry = new CustomElementRegistry();
class NamedElement extends HTMLElement {}
registry.define("x-named", NamedElement);
if (registry.getName(NamedElement) !== "x-named") {
  throw new Error("name not found");
}
if (customElements.getName(NamedElement) !== null) {
  throw new Error("name leaked globally");
}
