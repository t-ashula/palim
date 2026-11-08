const collection = testDocument.getElementsByTagName("meta");
if (
  !(collection instanceof HTMLCollection) ||
  collection.length !== 2 ||
  collection[0].localName !== "meta" ||
  collection.item(1).localName !== "meta"
) {
  throw new Error("HTMLCollection was not exposed correctly");
}
testDocument
  .querySelector("main")
  .appendChild(testDocument.createElement("meta"));
if (collection.length !== 3) {
  throw new Error("HTMLCollection is not live");
}
