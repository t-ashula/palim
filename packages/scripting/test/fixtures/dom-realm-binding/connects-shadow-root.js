const host = testDocument.querySelector("div");
const lightChild = testDocument.querySelector("p");
const shadowRoot = host.attachShadow({ mode: "open" });
const first = testDocument.createElement("span");
const destination = testDocument.createElement("section");

shadowRoot.append(first, destination);
destination.moveBefore(lightChild, null);
shadowRoot.moveBefore(destination, first);

if (!(shadowRoot instanceof ShadowRoot)) throw new Error("wrong interface");
if (host.shadowRoot !== shadowRoot) throw new Error("wrong open shadow root");
if (shadowRoot.firstChild !== destination) throw new Error("move failed");
if (lightChild.getRootNode() !== shadowRoot) throw new Error("wrong root");
if (lightChild.getRootNode({ composed: true }) !== testDocument) {
  throw new Error("wrong composed root");
}
