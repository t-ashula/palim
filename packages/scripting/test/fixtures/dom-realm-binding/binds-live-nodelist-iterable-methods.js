const container = testDocument.querySelector("main");
const list = container.childNodes;
for (const name of ["entries", "keys", "values", "forEach"]) {
  if (typeof NodeList.prototype[name] !== "function") {
    throw new Error(name + " is not exposed");
  }
}
if (NodeList.prototype[Symbol.iterator] !== NodeList.prototype.values) {
  throw new Error("NodeList iterator is not values");
}

const iterator = list.values();
if (iterator.next().value.id !== "first") {
  throw new Error("NodeList iterator returned an invalid first value");
}
const added = testDocument.createElement("b");
added.id = "second";
container.appendChild(added);
const next = iterator.next();
if (next.done || next.value !== added || !iterator.next().done) {
  throw new Error("NodeList iterator is not live");
}

const visited = [];
list.forEach((node, index, receiver) => {
  if (receiver !== list) {
    throw new Error("NodeList forEach receiver is invalid");
  }
  visited.push(index + ":" + node.id);
});
if (visited.join("|") !== "0:first|1:second") {
  throw new Error("NodeList forEach values are invalid: " + visited);
}
if (
  list.keys().next().value !== 0 ||
  list.entries().next().value[1].id !== "first"
) {
  throw new Error("NodeList keys or entries are invalid");
}
