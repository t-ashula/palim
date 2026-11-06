const image = testDocument.createElement("img");
image.setAttribute("id", "imageId");
testDocument.body.appendChild(image);
if ("imageId" in testDocument) {
  throw new Error("an unnamed image was exposed by id");
}

image.setAttribute("name", "imageName");
if (
  testDocument.imageId !== image ||
  testDocument.imageName !== image ||
  !Object.getOwnPropertyNames(testDocument).includes("imageId")
) {
  throw new Error("a named image was not exposed by id and name");
}
image.removeAttribute("name");
if ("imageId" in testDocument || "imageName" in testDocument) {
  throw new Error("an image remained exposed after removing its name");
}

const first = testDocument.createElement("object");
first.setAttribute("id", "multiple");
const second = testDocument.createElement("object");
second.setAttribute("id", "multiple");
testDocument.body.appendChild(first);
testDocument.body.appendChild(second);
const collection = testDocument.multiple;
if (
  !(collection instanceof HTMLCollection) ||
  collection.length !== 2 ||
  collection[0] !== first ||
  collection[1] !== second
) {
  throw new Error("multiple Document named items are invalid");
}
first.setAttribute("id", "other");
if (
  testDocument.multiple !== second ||
  collection.length !== 1 ||
  collection[0] !== second
) {
  throw new Error("a Document named item collection is not live");
}

const form = testDocument.createElement("form");
form.setAttribute("id", "formId");
form.setAttribute("name", "formName");
testDocument.body.appendChild(form);
if ("formId" in testDocument || testDocument.formName !== form) {
  throw new Error("form Document named item matching is invalid");
}

const numeric = testDocument.createElement("object");
numeric.setAttribute("id", "42");
testDocument.body.appendChild(numeric);
if (testDocument[42] !== numeric || !(42 in testDocument)) {
  throw new Error("a numeric Document named property was not exposed");
}
