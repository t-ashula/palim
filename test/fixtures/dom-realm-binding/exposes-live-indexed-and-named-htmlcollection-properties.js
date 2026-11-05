const collection = testDocument.getElementsByTagName("span");
const first = testDocument.getElementById("first");
if (
  collection[0] !== first ||
  collection.first !== first ||
  collection.namedItem("alpha") !== first
) {
  throw new Error("HTMLCollection named properties are invalid");
}
const descriptor = Object.getOwnPropertyDescriptor(collection, "first");
if (
  descriptor.value !== first ||
  descriptor.enumerable ||
  !descriptor.configurable ||
  descriptor.writable
) {
  throw new Error("HTMLCollection named descriptor is invalid");
}
const third = testDocument.createElement("span");
third.id = "third";
third.className = "runtime";
const runtime = testDocument.getElementsByClassName("runtime");
testDocument.querySelector("main").append(third);
if (collection[2] !== third || collection.third !== third) {
  throw new Error("HTMLCollection properties are not live");
}
if (runtime[0] !== third || third.getAttribute("class") !== "runtime") {
  throw new Error("ParentNode.append or className binding is invalid");
}
const names = Object.getOwnPropertyNames(collection);
const expected = ["0", "1", "2", "first", "alpha", "beta", "third"];
if (names.join("|") !== expected.join("|")) {
  throw new Error("HTMLCollection property names are invalid: " + names);
}
collection.first = "ignored";
delete collection.first;
if (collection.first !== first) {
  throw new Error("HTMLCollection named property was replaced");
}
const derived = Object.create(collection);
derived.first = "shadow";
if (derived.first !== "shadow" || collection.first !== first) {
  throw new Error("HTMLCollection prototype property cannot be shadowed");
}
