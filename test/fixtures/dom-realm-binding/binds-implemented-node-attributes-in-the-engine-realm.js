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
