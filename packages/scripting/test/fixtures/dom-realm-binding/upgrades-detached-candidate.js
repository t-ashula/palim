const candidate = testDocument.createElement("x-detached");
class DetachedElement extends HTMLElement {}
customElements.define("x-detached", DetachedElement);
customElements.upgrade(candidate);
if (!(candidate instanceof DetachedElement)) {
  throw new Error("candidate was not upgraded");
}
