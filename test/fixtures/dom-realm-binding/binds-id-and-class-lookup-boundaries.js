const emptyId = testDocument.createElement("div");
const namespacedId = testDocument.createElement("div");
emptyId.id = "";
namespacedId.id = "plain";
namespacedId.setAttributeNS("urn:example", "id", "namespaced");
testDocument.body.append(emptyId, namespacedId);
if (
  testDocument.getElementById("") !== null ||
  testDocument.getElementById("plain") !== namespacedId ||
  testDocument.getElementById("namespaced") !== null
) {
  throw new Error("Document ID lookup boundaries are invalid");
}
namespacedId.removeAttribute("id");
if (
  testDocument.getElementById("plain") !== null ||
  testDocument.getElementById("namespaced") !== null
) {
  throw new Error("namespaced ID affected lookup after plain ID removal");
}

const fragment = testDocument.createDocumentFragment();
fragment.appendChild(emptyId);
if (fragment.getElementById("") !== null) {
  throw new Error("DocumentFragment returned an empty ID");
}

const xmlDocument = testDocument.implementation.createDocument(null, "root");
const root = xmlDocument.documentElement;
const first = xmlDocument.createElement("item");
const second = xmlDocument.createElementNS("urn:element", "p:item");
const third = xmlDocument.createElement("item");
first.setAttribute("class", "a b");
second.setAttribute("class", "a");
third.setAttributeNS("urn:attribute", "p:class", "a");
root.append(first, second, third);
const collection = xmlDocument.getElementsByClassName("a");
if (
  collection.length !== 2 ||
  collection.item(0) !== first ||
  collection.item(1) !== second
) {
  throw new Error("XML class lookup boundaries are invalid");
}
third.setAttribute("class", "a");
first.removeAttribute("class");
root.removeChild(second);
if (collection.length !== 1 || collection.item(0) !== third) {
  throw new Error("XML class collection is not live");
}
