const element = testDocument.querySelector("main");
for (const [namespace, name] of [
  ["urn:first", "same"],
  ["urn:second", "same"],
  ["urn:upper", "A:B"],
  ["urn:lower", "c:d"],
]) {
  const attribute = testDocument.createAttributeNS(namespace, name);
  element.setAttributeNodeNS(attribute);
}
const names = Object.getOwnPropertyNames(element.attributes);
const expected = ["0", "1", "2", "3", "same", "c:d"];
if (names.join("|") !== expected.join("|")) {
  throw new Error(
    "NamedNodeMap supported property names are invalid: " + names,
  );
}
