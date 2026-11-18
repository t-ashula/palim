const selection = window.getSelection();
if (
  !(selection instanceof Selection) ||
  selection !== window.getSelection() ||
  selection !== document.getSelection() ||
  selection.rangeCount !== 0 ||
  selection.type !== "None"
) {
  throw new Error("Selection identity or initial state is invalid");
}

const main = document.createElement("main");
main.textContent = "text";
document.body.append(main);
const data = main.firstChild;
selection.setBaseAndExtent(data, 3, data, 1);
if (
  selection.direction !== "backward" ||
  selection.anchorOffset !== 3 ||
  selection.focusOffset !== 1 ||
  selection.toString() !== "ex" ||
  selection.getRangeAt(0).toString() !== "ex"
) {
  throw new Error("Selection endpoints are invalid");
}

data.insertData(0, "A");
if (
  selection.anchorOffset !== 4 ||
  selection.focusOffset !== 2 ||
  selection.toString() !== "ex"
) {
  throw new Error("Selection did not follow its live Range");
}

const detached = document.implementation.createHTMLDocument("");
if (detached.getSelection() !== null) {
  throw new Error("A Document without a Window must not have a Selection");
}
