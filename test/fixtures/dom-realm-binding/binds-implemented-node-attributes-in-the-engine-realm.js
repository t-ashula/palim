const main = testDocument.querySelector("main");
const instruction = testDocument.createProcessingInstruction("target", "data");
if (
  main.parentElement !== testDocument.body ||
  main.prefix !== null ||
  main.childElementCount !== 2 ||
  main.firstElementChild.localName !== "span" ||
  main.lastElementChild.localName !== "b" ||
  !(instruction instanceof ProcessingInstruction) ||
  instruction.target !== "target"
) {
  throw new Error("Node attributes are invalid");
}

const text = testDocument.createTextNode("before");
const comment = testDocument.createComment("before");
const attribute = testDocument.createAttribute("data-value");
text.nodeValue = "text";
comment.nodeValue = null;
attribute.nodeValue = 12;
main.nodeValue = "ignored";
if (
  text.data !== "text" ||
  comment.data !== "" ||
  attribute.value !== "12" ||
  main.nodeValue !== null
) {
  throw new Error("Node.nodeValue is invalid");
}

attribute.textContent = undefined;
main.textContent = undefined;
testDocument.textContent = "ignored";
const doctype = testDocument.implementation.createDocumentType("html", "", "");
doctype.textContent = "ignored";
if (
  attribute.value !== "" ||
  main.textContent !== "" ||
  main.firstChild !== null ||
  testDocument.textContent !== null ||
  doctype.textContent !== null
) {
  throw new Error("Node.textContent is invalid");
}
