for (const [name, length] of [
  ["replaceChild", 2],
  ["lookupPrefix", 1],
  ["lookupNamespaceURI", 1],
  ["isDefaultNamespace", 1],
]) {
  if (
    typeof Node.prototype[name] !== "function" ||
    Node.prototype[name].length !== length
  ) {
    throw new Error(name + " has an invalid descriptor");
  }
}
for (const [name, value] of [
  ["ENTITY_REFERENCE_NODE", 5],
  ["ENTITY_NODE", 6],
  ["NOTATION_NODE", 12],
]) {
  if (
    Node[name] !== value ||
    Node.prototype[name] !== value ||
    testDocument[name] !== value
  ) {
    throw new Error(name + " is invalid");
  }
}

const main = testDocument.querySelector("main");
const first = main.firstChild;
const second = main.lastChild;
if (main.replaceChild(second, first) !== first || main.firstChild !== second) {
  throw new Error("replaceChild result is invalid");
}
if (
  main.lookupNamespaceURI(null) !== "http://www.w3.org/1999/xhtml" ||
  main.lookupNamespaceURI("xml") !== "http://www.w3.org/XML/1998/namespace" ||
  main.lookupPrefix("http://www.w3.org/1999/xhtml") !== null ||
  !main.isDefaultNamespace("http://www.w3.org/1999/xhtml") ||
  main.isDefaultNamespace(null)
) {
  throw new Error("namespace lookup result is invalid");
}

let error = null;
try {
  testDocument.createTextNode("parent").replaceChild(second, main);
} catch (caught) {
  error = caught;
}
if (
  !(error instanceof DOMException) ||
  error.name !== "HierarchyRequestError" ||
  error.code !== 3
) {
  throw new Error("replaceChild did not expose HierarchyRequestError");
}
