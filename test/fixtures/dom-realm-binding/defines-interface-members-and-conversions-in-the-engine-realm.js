const id = Object.getOwnPropertyDescriptor(Element.prototype, "id");
const setAttribute = Object.getOwnPropertyDescriptor(
  Element.prototype,
  "setAttribute",
);
if (
  typeof id.get !== "function" ||
  typeof id.set !== "function" ||
  !id.configurable ||
  !id.enumerable ||
  typeof setAttribute.value !== "function" ||
  setAttribute.value.length !== 2
) {
  throw new Error("interface property descriptors are invalid");
}
const target = testDocument.getElementById("target");
target.setAttribute("data-number", 12);
try {
  target.setAttribute("data-missing");
  throw new Error("missing argument was accepted");
} catch (error) {
  if (!(error instanceof TypeError)) {
    throw error;
  }
}
