for (const [prototype, name, length] of [
  [Document.prototype, "createAttributeNS", 2],
  [Element.prototype, "getAttributeNS", 2],
  [Element.prototype, "getAttributeNodeNS", 2],
  [Element.prototype, "hasAttributeNS", 2],
  [Element.prototype, "setAttributeNS", 3],
  [Element.prototype, "removeAttributeNS", 2],
]) {
  if (
    typeof prototype[name] !== "function" ||
    prototype[name].length !== length
  ) {
    throw new Error(name + " has an invalid descriptor");
  }
}

const main = testDocument.querySelector("main");
const attribute = testDocument.createAttributeNS("urn:test", "p:name");
attribute.value = "before";
if (
  attribute.ownerDocument !== testDocument ||
  attribute.ownerElement !== null ||
  attribute.namespaceURI !== "urn:test" ||
  attribute.prefix !== "p" ||
  attribute.localName !== "name"
) {
  throw new Error("createAttributeNS returned an invalid Attr");
}
main.setAttributeNodeNS(attribute);
main.setAttributeNS("urn:test", "q:name", "after");
if (
  main.getAttributeNS("urn:test", "name") !== "after" ||
  main.getAttributeNodeNS("urn:test", "name") !== attribute ||
  !main.hasAttributeNS("urn:test", "name") ||
  attribute.name !== "p:name" ||
  attribute.nodeValue !== "after"
) {
  throw new Error("namespace-aware attribute update is invalid");
}

main.setAttributeNS(undefined, "plain", "value");
if (main.getAttributeNS(null, "plain") !== "value") {
  throw new Error("undefined namespace was not converted to null");
}
main.removeAttributeNS("urn:test", "name");
if (main.getAttributeNodeNS("urn:test", "name") !== null) {
  throw new Error("removeAttributeNS did not remove the Attr");
}

let error = null;
try {
  testDocument.createAttributeNS(null, "p:name");
} catch (caught) {
  error = caught;
}
if (!(error instanceof DOMException) || error.name !== "NamespaceError") {
  throw new Error("createAttributeNS did not expose NamespaceError");
}
