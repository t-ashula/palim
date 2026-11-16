const reactions = [];

class ObservedElement extends HTMLElement {
  static get observedAttributes() {
    return ["data-value", "style"];
  }

  attributeChangedCallback(name, oldValue, newValue, namespace) {
    if (this !== element) {
      throw new Error("attribute callback receiver is not the element");
    }
    reactions.push([name, oldValue, newValue, namespace]);
  }
}

customElements.define("x-observed", ObservedElement);
const element = testDocument.createElement("x-observed");
element.setAttribute("data-value", "first");
element.setAttribute("data-value", "second");
element.style.fontSize = "10px";
element.removeAttribute("data-value");
element.setAttribute("ignored", "value");

const expected = JSON.stringify([
  ["data-value", null, "first", null],
  ["data-value", "first", "second", null],
  ["style", null, "font-size: 10px;", null],
  ["data-value", "second", null, null],
]);
if (JSON.stringify(reactions) !== expected) {
  throw new Error(
    `unexpected attribute reactions: ${JSON.stringify(reactions)}`,
  );
}
