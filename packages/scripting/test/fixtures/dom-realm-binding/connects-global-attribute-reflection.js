if (testDocument.dir !== "ltr") {
  throw new Error("Document.dir getter is invalid");
}
testDocument.dir = "x-garbage";
if (
  testDocument.dir !== "" ||
  testDocument.documentElement.getAttribute("dir") !== "x-garbage"
) {
  throw new Error("Document.dir setter is invalid");
}

const main = testDocument.querySelector("main");
if (
  main.lang !== "en" ||
  main.hidden !== "until-found" ||
  main.translate !== true ||
  main.inert !== false ||
  main.accessKey !== "" ||
  main.accessKeyLabel !== ""
) {
  throw new Error("HTMLElement global attribute getters are invalid");
}
main.lang = "ja";
main.translate = false;
main.inert = true;
main.accessKey = "k";
main.hidden = false;
if (
  main.lang !== "ja" ||
  main.translate !== false ||
  main.inert !== true ||
  main.accessKey !== "k" ||
  main.hidden !== false
) {
  throw new Error("HTMLElement global attribute setters are invalid");
}

const anchor = testDocument.querySelector("a");
if (anchor.draggable !== true) {
  throw new Error("HTMLElement.draggable getter is invalid");
}
anchor.draggable = 0;
if (
  anchor.draggable !== false ||
  anchor.getAttribute("draggable") !== "false"
) {
  throw new Error("HTMLElement.draggable setter conversion is invalid");
}

const span = testDocument.querySelector("span");
if (span.spellcheck !== false) {
  throw new Error("HTMLElement.spellcheck getter is invalid");
}
span.spellcheck = "false";
if (span.spellcheck !== true || span.getAttribute("spellcheck") !== "true") {
  throw new Error("HTMLElement.spellcheck setter conversion is invalid");
}
