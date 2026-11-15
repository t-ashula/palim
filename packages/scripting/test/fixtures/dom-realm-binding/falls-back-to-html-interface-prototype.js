function TestParagraph() {
  return Reflect.construct(HTMLParagraphElement, [], new.target);
}

let primitivePrototype = false;
const constructor = new Proxy(TestParagraph, {
  get(target, property, receiver) {
    if (property === "prototype" && primitivePrototype) {
      return null;
    }
    return Reflect.get(target, property, receiver);
  },
});

customElements.define("test-paragraph", constructor, { extends: "p" });
primitivePrototype = true;

const element = new constructor();
if (Object.getPrototypeOf(element) !== HTMLParagraphElement.prototype) {
  throw new Error("primitive prototype did not use the interface fallback");
}
