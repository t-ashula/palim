const reactions = [];

class ReflectedButton extends HTMLButtonElement {
  static get observedAttributes() {
    return ["disabled", "name"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    reactions.push([name, oldValue, newValue]);
  }
}

customElements.define("reflected-button", ReflectedButton, {
  extends: "button",
});
const button = testDocument.createElement("button", {
  is: "reflected-button",
});
button.disabled = true;
button.name = 42;
button.disabled = false;

const expectedReactions = JSON.stringify([
  ["disabled", null, ""],
  ["name", null, "42"],
  ["disabled", "", null],
]);
if (JSON.stringify(reactions) !== expectedReactions) {
  throw new Error(
    `unexpected reflected reactions: ${JSON.stringify(reactions)}`,
  );
}
