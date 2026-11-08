const list = testDocument.getElementsByName("target");
if (
  !(list instanceof NodeList) ||
  Object.prototype.toString.call(list) !== "[object NodeList]" ||
  list.length !== 1 ||
  list[0].localName !== "p"
) {
  throw new Error("getElementsByName result is invalid");
}
const added = testDocument.createElement("section");
added.setAttribute("name", "target");
testDocument.body.appendChild(added);
if (list.length !== 2 || list[1] !== added) {
  throw new Error("getElementsByName result is not live");
}
