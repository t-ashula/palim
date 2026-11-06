const titledElement = testDocument.querySelector("main");
const untitledElement = testDocument.querySelector("aside");

if (titledElement.title !== "before" || untitledElement.title !== "") {
  throw new Error("HTMLElement.title getter is invalid");
}

titledElement.title = 7;
if (titledElement.title !== "7") {
  throw new Error("HTMLElement.title setter is invalid");
}
