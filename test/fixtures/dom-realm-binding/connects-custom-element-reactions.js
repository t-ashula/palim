const reactions = [];

class MovingElement extends HTMLElement {
  constructor() {
    super();
    this.markConstructed();
  }

  markConstructed() {
    this.setAttribute("constructed", "");
  }

  connectedCallback() {
    reactions.push(`connected:${this.isConnected}`);
  }

  disconnectedCallback() {
    reactions.push(`disconnected:${this.isConnected}`);
  }
}
customElements.define("x-moving", MovingElement);

const element = testDocument.createElement("x-moving");
const destination = testDocument.createElement("section");
testDocument.body.append(element, destination);
if (!element.hasAttribute("constructed")) {
  throw new Error("custom element constructor was not called");
}
if (!(element instanceof MovingElement)) {
  throw new Error("custom element prototype was not installed");
}
reactions.length = 0;
destination.moveBefore(element, null);
if (
  reactions.length !== 2 ||
  reactions[0] !== "disconnected:true" ||
  reactions[1] !== "connected:true"
) {
  throw new Error(`unexpected fallback reactions: ${reactions.join(",")}`);
}

customElements.define(
  "x-shadow-moving",
  class extends HTMLElement {
    connectedMoveCallback() {
      reactions.push("connectedMove");
    }
  },
);
const host = testDocument.createElement("div");
const nested = testDocument.createElement("x-shadow-moving");
host.attachShadow({ mode: "open" }).append(nested);
testDocument.body.append(host);
reactions.length = 0;
destination.moveBefore(host, null);
if (reactions.length !== 1 || reactions[0] !== "connectedMove") {
  throw new Error(`unexpected shadow reaction: ${reactions.join(",")}`);
}
