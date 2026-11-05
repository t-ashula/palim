const main = testDocument.querySelector("main");
const text = main.firstChild;
const constructed = new Range();
const created = testDocument.createRange();
if (
  !(constructed instanceof Range) ||
  !(created instanceof Range) ||
  constructed.startContainer !== testDocument ||
  constructed.endContainer !== testDocument ||
  !constructed.collapsed
) {
  throw new Error("Range construction is invalid");
}
created.setStart(text, 1);
created.setEnd(text, 3);
if (created.toString() !== "ex" || created.commonAncestorContainer !== text) {
  throw new Error("Range binding is invalid");
}
const split = text.splitText(2);
if (!(split instanceof Text) || split.data !== "xt") {
  throw new Error("Text.splitText binding is invalid");
}
const snapshot = new StaticRange({
  startContainer: text,
  startOffset: 1,
  endContainer: text,
  endOffset: 3,
});
if (
  !(snapshot instanceof StaticRange) ||
  snapshot.startContainer !== text ||
  snapshot.startOffset !== 1 ||
  snapshot.endContainer !== text ||
  snapshot.endOffset !== 3 ||
  snapshot.collapsed
) {
  throw new Error("StaticRange construction is invalid");
}
