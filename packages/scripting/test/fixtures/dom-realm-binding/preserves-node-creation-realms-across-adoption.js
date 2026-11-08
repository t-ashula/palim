const crossCreated = Document.prototype.createComment.call(otherDocument, "x");
if (
  !(crossCreated instanceof firstComment) ||
  crossCreated instanceof Comment
) {
  throw new Error("cross-realm factory used the running realm");
}

const framelessDocument = otherDocument.implementation.createHTMLDocument("");
const framelessNode = framelessDocument.createElement("section");
testDocument.adoptNode(framelessNode);
if (
  framelessNode.ownerDocument !== testDocument ||
  !(framelessNode instanceof firstHTMLElement) ||
  framelessNode instanceof HTMLElement
) {
  throw new Error("frameless document node did not keep its associated realm");
}

const adopted = testDocument.adoptNode(crossRealmNode);
if (
  adopted !== crossRealmNode ||
  adopted.ownerDocument !== testDocument ||
  !(adopted instanceof firstHTMLElement) ||
  adopted instanceof HTMLElement
) {
  throw new Error("adoption changed the node creation realm");
}

if (
  neverWrappedNode.ownerDocument !== testDocument ||
  !(neverWrappedNode instanceof firstHTMLElement) ||
  neverWrappedNode instanceof HTMLElement
) {
  throw new Error("a lazily wrapped adopted node used its new document realm");
}

testDocument.body.appendChild(adoptedContainer);
adoptedContainer.innerHTML = "<p></p><!--comment-->";
const parsedElement = adoptedContainer.firstChild;
const parsedComment = adoptedContainer.lastChild;
if (parsedElement === null || parsedComment === null) {
  throw new Error("adopted container parsing did not create child nodes");
}
if (!(parsedElement instanceof HTMLElement)) {
  throw new Error("parsed element did not use the current document realm");
}
if (parsedElement instanceof firstHTMLElement) {
  throw new Error("parsed element kept the container creation realm");
}
if (!(parsedComment instanceof Comment)) {
  throw new Error("parsed comment did not use the current document realm");
}
if (parsedComment instanceof firstComment) {
  throw new Error("parsed comment kept the container creation realm");
}
