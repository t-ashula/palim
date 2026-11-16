const element = testDocument.querySelector("x-upgrade-observed");
if (element === null) {
  throw new Error("upgrade candidate is missing");
}

const reactions = [];
class UpgradeObservedElement extends HTMLElement {
  static observedAttributes = ["data-first", "data-second"];

  constructor() {
    super();
    reactions.push(["constructor"]);
  }

  attributeChangedCallback(name, oldValue, newValue, namespace) {
    reactions.push([name, oldValue, newValue, namespace]);
  }

  connectedCallback() {
    reactions.push(["connected"]);
  }
}

customElements.define("x-upgrade-observed", UpgradeObservedElement);

const expected = JSON.stringify([
  ["constructor"],
  ["data-first", null, "one", null],
  ["data-second", null, "two", null],
  ["connected"],
]);
if (JSON.stringify(reactions) !== expected) {
  throw new Error(`unexpected upgrade reactions: ${JSON.stringify(reactions)}`);
}

class NoAttributeCallback extends HTMLElement {
  static get observedAttributes() {
    throw new Error("observedAttributes must not be read");
  }
}
customElements.define("x-no-attribute-callback", NoAttributeCallback);
