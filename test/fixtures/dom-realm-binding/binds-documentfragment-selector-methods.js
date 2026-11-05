const fragment = testDocument.createDocumentFragment();
const first = testDocument.createElement("p");
first.className = "target";
const second = testDocument.createElement("span");
second.className = "target";
fragment.append(first, second);
const list = fragment.querySelectorAll(".target");
if (
  fragment.querySelector(".target") !== first ||
  !(list instanceof NodeList) ||
  list.length !== 2 ||
  list[1] !== second
) {
  throw new Error("DocumentFragment selector binding is invalid");
}
