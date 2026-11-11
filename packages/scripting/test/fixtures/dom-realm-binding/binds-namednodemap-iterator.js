const attributes = testDocument.querySelector("main").attributes;
const values = [...attributes];
if (
  values.length !== 2 ||
  !(values[0] instanceof Attr) ||
  values[0].name !== "id" ||
  values[1].name !== "class" ||
  Object.prototype.toString.call(attributes) !== "[object NamedNodeMap]"
) {
  throw new Error("NamedNodeMap iterator is invalid");
}
