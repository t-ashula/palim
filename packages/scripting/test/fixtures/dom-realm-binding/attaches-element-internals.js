let internals;
let closedShadowRoot;
class InternalsElement extends HTMLElement {
  constructor() {
    super();
    internals = this.attachInternals();
    closedShadowRoot = this.attachShadow({ mode: "closed" });
  }
}
customElements.define("x-internals", InternalsElement);

const element = testDocument.createElement("x-internals");
if (!(internals instanceof ElementInternals)) {
  throw new Error("attachInternals did not return ElementInternals");
}
if (internals.shadowRoot !== closedShadowRoot) {
  throw new Error("ElementInternals did not expose the closed shadow root");
}
if (element.shadowRoot !== null) {
  throw new Error("the closed shadow root was exposed on HTMLElement");
}

let secondAttachmentError;
try {
  element.attachInternals();
} catch (error) {
  secondAttachmentError = error;
}
if (secondAttachmentError?.name !== "NotSupportedError") {
  throw new Error("a second attachInternals call did not fail");
}

class DisabledInternalsElement extends HTMLElement {
  static disabledFeatures = ["internals"];
}
customElements.define("x-disabled-internals", DisabledInternalsElement);
const disabledElement = testDocument.createElement("x-disabled-internals");
let disabledError;
try {
  disabledElement.attachInternals();
} catch (error) {
  disabledError = error;
}
if (disabledError?.name !== "NotSupportedError") {
  throw new Error("disabledFeatures did not disable attachInternals");
}
