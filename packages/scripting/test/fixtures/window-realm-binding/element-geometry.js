const constructed = new DOMRect(1, 2, 3, 4);
const copied = DOMRectReadOnly.fromRect(constructed);
if (
  !(constructed instanceof DOMRect) ||
  !(constructed instanceof DOMRectReadOnly) ||
  copied.right !== 4 ||
  copied.bottom !== 6 ||
  copied.toJSON().width !== 3
) {
  throw new Error("Geometry constructors are invalid");
}

const main = document.createElement("main");
main.setAttribute("style", "width: 120px; height: 20px");
document.body.append(main);
const rects = main.getClientRects();
const bounds = main.getBoundingClientRect();
if (
  !(rects instanceof DOMRectList) ||
  rects.length !== 1 ||
  rects.item(0) !== rects[0] ||
  [...rects].length !== 1 ||
  !(bounds instanceof DOMRect) ||
  bounds.width !== 120 ||
  bounds.height !== 20
) {
  throw new Error("Element geometry is invalid");
}
