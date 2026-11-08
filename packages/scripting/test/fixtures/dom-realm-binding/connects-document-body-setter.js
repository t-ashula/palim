let stringError;
try {
  testDocument.body = "text";
} catch (error) {
  stringError = error;
}
if (!(stringError instanceof TypeError)) {
  throw new Error("Document.body did not reject a non-Element value");
}

let elementError;
try {
  testDocument.body = testDocument.createElement("div");
} catch (error) {
  elementError = error;
}
if (
  !(elementError instanceof DOMException) ||
  elementError.name !== "HierarchyRequestError"
) {
  throw new Error("Document.body did not reject an invalid element");
}

const oldBody = testDocument.body;
const body = testDocument.createElement("body");
testDocument.body = body;
if (testDocument.body !== body || oldBody.parentNode !== null) {
  throw new Error("Document.body did not replace the current body");
}

const frameset = testDocument.createElement("frameset");
testDocument.body = frameset;
if (testDocument.body !== frameset || body.parentNode !== null) {
  throw new Error("Document.body did not replace a body with a frameset");
}
