for (const [prototype, names] of [
  [Document.prototype, ["prepend", "append", "replaceChildren"]],
  [DocumentFragment.prototype, ["prepend", "append", "replaceChildren"]],
  [
    Element.prototype,
    [
      "before",
      "after",
      "replaceWith",
      "remove",
      "prepend",
      "append",
      "replaceChildren",
    ],
  ],
  [CharacterData.prototype, ["before", "after", "replaceWith", "remove"]],
  [DocumentType.prototype, ["before", "after", "replaceWith", "remove"]],
]) {
  for (const name of names) {
    if (typeof prototype[name] !== "function" || prototype[name].length !== 0) {
      throw new Error(name + " has an invalid descriptor");
    }
  }
}
for (const prototype of [
  Document.prototype,
  DocumentFragment.prototype,
  Element.prototype,
]) {
  if (
    typeof prototype.moveBefore !== "function" ||
    prototype.moveBefore.length !== 2
  ) {
    throw new Error("moveBefore has an invalid descriptor");
  }
}

const main = testDocument.querySelector("main");
const first = main.children[0];
const second = main.children[1];
const third = main.children[2];
second.before(third, second);
second.after(first, second);
second.replaceWith(first, "tail");
main.prepend("head");
main.append("foot");
if (main.textContent !== "headtailfoot") {
  throw new Error("ChildNode mutation order is invalid");
}
main.replaceChildren(first, "replacement");
first.remove();
if (main.textContent !== "replacement" || main.children.length !== 0) {
  throw new Error("ParentNode replacement result is invalid");
}

const detached = testDocument.createElement("detached");
let converted = false;
detached.before({
  toString() {
    converted = true;
    return "detached";
  },
});
if (!converted) {
  throw new Error("detached ChildNode argument was not converted");
}

const moveParent = testDocument.createElement("section");
const moveFirst = testDocument.createElement("i");
const moveSecond = testDocument.createTextNode("moved");
main.append(moveParent);
moveParent.append(moveFirst, moveSecond);
if (!main.isConnected || !moveParent.isConnected) {
  throw new Error("Node.isConnected is invalid");
}
if (
  moveParent.moveBefore(moveSecond, moveFirst) !== undefined ||
  moveParent.firstChild !== moveSecond
) {
  throw new Error("moveBefore order or return value is invalid");
}
moveParent.moveBefore(moveFirst, undefined);
let missingSecondArgumentThrew = false;
try {
  moveParent.moveBefore(moveFirst);
} catch (error) {
  missingSecondArgumentThrew = error instanceof TypeError;
}
if (!missingSecondArgumentThrew) {
  throw new Error("moveBefore accepted a missing second argument");
}
moveParent.remove();
