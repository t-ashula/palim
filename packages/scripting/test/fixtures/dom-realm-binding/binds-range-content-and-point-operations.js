const paragraph = testDocument.querySelector("p");
const bold = paragraph.querySelector("b");
const range = testDocument.createRange();
range.selectNode(bold);
const contextual = range.createContextualFragment("<i>fragment</i>");
if (
  typeof Range.prototype.createContextualFragment !== "function" ||
  Range.prototype.createContextualFragment.length !== 1 ||
  !(contextual instanceof DocumentFragment) ||
  contextual.firstChild.localName !== "i" ||
  contextual.textContent !== "fragment" ||
  contextual.firstChild.ownerDocument !== testDocument ||
  range.comparePoint(paragraph, 0) !== -1 ||
  range.comparePoint(paragraph, 1) !== 0 ||
  !range.isPointInRange(paragraph, 1) ||
  !range.intersectsNode(bold) ||
  range.cloneContents().textContent !== "two"
) {
  throw new Error("Range point or clone operation is invalid");
}
const extracted = range.extractContents();
if (
  extracted.textContent !== "two" ||
  paragraph.textContent !== "onethree" ||
  !range.collapsed
) {
  throw new Error("Range extraction is invalid");
}
const wrapper = testDocument.createElement("strong");
range.insertNode(wrapper);
range.selectNode(wrapper);
range.surroundContents(testDocument.createElement("section"));
if (paragraph.querySelector("section > strong") !== wrapper) {
  throw new Error("Range insertion or surrounding is invalid");
}
range.selectNode(wrapper);
range.deleteContents();
if (paragraph.querySelector("strong") !== null) {
  throw new Error("Range deletion is invalid");
}
