for (const [prototype, name] of [
  [Document.prototype, "importNode"],
  [Document.prototype, "adoptNode"],
  [DocumentFragment.prototype, "getElementById"],
]) {
  if (typeof prototype[name] !== "function" || prototype[name].length !== 1) {
    throw new Error(name + " has an invalid descriptor");
  }
}

const sourceDocument = testDocument.implementation.createHTMLDocument("");
const source = sourceDocument.createElement("main");
source.appendChild(sourceDocument.createElement("span"));
sourceDocument.body.appendChild(source);
const htmlCollection = source.getElementsByTagName("SPAN");

const shallow = testDocument.importNode(source);
const explicitShallow = testDocument.importNode(source, undefined);
const booleanDeep = testDocument.importNode(source, true);
const dictionaryDeep = testDocument.importNode(source, {});
const dictionaryShallow = testDocument.importNode(source, {
  selfOnly: true,
});
const nullDictionary = testDocument.importNode(source, null);
if (
  shallow.ownerDocument !== testDocument ||
  shallow.firstChild !== null ||
  explicitShallow.firstChild !== null ||
  booleanDeep.firstChild.localName !== "span" ||
  dictionaryDeep.firstChild.localName !== "span" ||
  dictionaryShallow.firstChild !== null ||
  nullDictionary.firstChild.localName !== "span" ||
  source.ownerDocument !== sourceDocument
) {
  throw new Error("Document.importNode binding is invalid");
}

const adopted = testDocument.adoptNode(source);
if (
  adopted !== source ||
  adopted.parentNode !== null ||
  adopted.ownerDocument !== testDocument ||
  adopted.firstChild.ownerDocument !== testDocument
) {
  throw new Error("Document.adoptNode binding is invalid");
}

const xmlDocument = testDocument.implementation.createDocument(
  "http://www.w3.org/1999/xhtml",
  "html",
);
xmlDocument.adoptNode(adopted);
if (
  adopted.tagName !== "main" ||
  adopted.nodeName !== "main" ||
  htmlCollection.item(0) !== adopted.firstChild ||
  adopted.getElementsByTagName("SPAN").length !== 0 ||
  adopted.getElementsByTagName("span").item(0) !== adopted.firstChild
) {
  throw new Error("adoption did not update document HTMLness");
}
testDocument.adoptNode(adopted);
if (adopted.tagName !== "MAIN" || adopted.nodeName !== "MAIN") {
  throw new Error("HTML element names did not recover after adoption");
}

const fragment = testDocument.createDocumentFragment();
const first = testDocument.createElement("p");
const second = testDocument.createElement("p");
first.id = "target";
second.id = "target";
fragment.append(first, second);
if (
  fragment.getElementById("target") !== first ||
  fragment.getElementById("missing") !== null ||
  fragment.getElementById({
    toString() {
      return "target";
    },
  }) !== first
) {
  throw new Error("DocumentFragment.getElementById binding is invalid");
}

for (const callback of [
  () => testDocument.importNode(),
  () => testDocument.adoptNode(null),
  () => Document.prototype.importNode.call(fragment, first),
  () => DocumentFragment.prototype.getElementById.call(testDocument, "target"),
  () => fragment.getElementById(),
]) {
  try {
    callback();
    throw new Error("invalid binding call was accepted");
  } catch (error) {
    if (!(error instanceof TypeError)) throw error;
  }
}
try {
  testDocument.adoptNode(sourceDocument);
  throw new Error("adopting a Document was accepted");
} catch (error) {
  if (
    !(error instanceof DOMException) ||
    error.name !== "NotSupportedError" ||
    error.code !== DOMException.NOT_SUPPORTED_ERR
  ) {
    throw error;
  }
}
