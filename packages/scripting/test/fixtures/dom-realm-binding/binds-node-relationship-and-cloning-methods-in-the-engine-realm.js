const main = testDocument.querySelector("main");
const first = main.firstChild;
const second = main.lastChild;
if (
  main.getRootNode() !== testDocument ||
  main.getRootNode({ composed: true }) !== testDocument ||
  !main.hasChildNodes() ||
  !main.contains(first) ||
  main.contains(null) ||
  !main.isSameNode(main) ||
  main.isSameNode(first) ||
  !main.isEqualNode(main.cloneNode(true)) ||
  main.compareDocumentPosition(first) !==
    (Node.DOCUMENT_POSITION_CONTAINED_BY | Node.DOCUMENT_POSITION_FOLLOWING) ||
  first.compareDocumentPosition(second) !== Node.DOCUMENT_POSITION_FOLLOWING
) {
  throw new Error("Node relationship methods are invalid");
}
const clone = main.cloneNode(true);
clone.firstChild.appendChild(testDocument.createTextNode(""));
clone.firstChild.appendChild(testDocument.createTextNode("three"));
clone.firstChild.normalize();
if (
  clone === main ||
  clone.firstChild.textContent !== "onethree" ||
  clone.firstChild.childNodes.length !== 1
) {
  throw new Error("Node cloning or normalization is invalid");
}
for (const operation of [
  () => main.contains(),
  () => main.isEqualNode(),
  () => main.isSameNode(),
  () => main.compareDocumentPosition(),
]) {
  try {
    operation();
    throw new Error("missing Node argument was accepted");
  } catch (error) {
    if (!(error instanceof TypeError)) {
      throw error;
    }
  }
}
