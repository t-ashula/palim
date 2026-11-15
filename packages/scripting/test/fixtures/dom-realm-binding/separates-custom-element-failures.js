globalThis.constructorFailure = {};
globalThis.reactionFailure = {};
let failedElementReactions = 0;
class FailingElement extends HTMLElement {
  constructor() {
    super();
    throw constructorFailure;
  }

  connectedCallback() {
    failedElementReactions += 1;
  }
}
customElements.define("x-construction-failure", FailingElement);
const failed = testDocument.createElement("x-construction-failure");
if (failed instanceof FailingElement) {
  throw new Error("failed constructor retained its custom prototype");
}
testDocument.body.append(failed);
if (failedElementReactions !== 0) {
  throw new Error("failed custom element ran a reaction");
}

class FailingReactionElement extends HTMLElement {
  connectedCallback() {
    throw reactionFailure;
  }
}
customElements.define("x-reaction-failure", FailingReactionElement);
testDocument.body.append(testDocument.createElement("x-reaction-failure"));
testDocument.body.setAttribute("data-after-reaction", "continued");
