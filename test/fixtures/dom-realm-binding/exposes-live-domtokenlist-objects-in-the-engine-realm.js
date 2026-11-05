const list = testDocument.querySelector("span").classList;
if (
  !(list instanceof DOMTokenList) ||
  Object.prototype.toString.call(list) !== "[object DOMTokenList]" ||
  String(list) !== "   a  a b " ||
  list.value !== "   a  a b " ||
  list.length !== 2 ||
  list[0] !== "a" ||
  list[1] !== "b" ||
  list[Symbol.iterator] !== Array.prototype[Symbol.iterator] ||
  list.keys !== Array.prototype.keys ||
  list.values !== Array.prototype.values ||
  list.entries !== Array.prototype.entries ||
  list.forEach !== Array.prototype.forEach ||
  typeof list.contains !== "function" ||
  typeof list.add !== "function" ||
  typeof list.remove !== "function" ||
  typeof list.toggle !== "function" ||
  typeof list.replace !== "function" ||
  typeof list.supports !== "function" ||
  [...list].join("|") !== "a|b" ||
  [...list.keys()].join("|") !== "0|1" ||
  [...list.values()].join("|") !== "a|b" ||
  [...list.entries()].map((entry) => entry.join(":")).join("|") !== "0:a|1:b"
) {
  throw new Error("DOMTokenList binding is invalid");
}
const receiver = {};
let calls = 0;
list.forEach(function (value, index, parent) {
  if (this !== receiver || parent !== list || value !== list[index]) {
    throw new Error("DOMTokenList forEach is invalid");
  }
  calls += 1;
}, receiver);
if (calls !== 2) {
  throw new Error("DOMTokenList forEach length is invalid");
}
list.value = " foo bar foo ";
if (list.value !== " foo bar foo " || list.length !== 2) {
  throw new Error("DOMTokenList value is invalid");
}
list.add("baz", "foo");
list.remove("bar");
if (
  !list.contains("baz") ||
  list.toggle("baz") ||
  !list.toggle("qux", true) ||
  !list.replace("qux", "replaced") ||
  list.value !== "foo replaced"
) {
  throw new Error("DOMTokenList mutation methods are invalid");
}
testDocument.querySelector("span").classList = "assigned";
if (list.value !== "assigned") {
  throw new Error("DOMTokenList PutForwards is invalid");
}
let supportsError = null;
try {
  list.supports("token");
} catch (error) {
  supportsError = error;
}
if (!(supportsError instanceof TypeError)) {
  throw new Error("DOMTokenList supports TypeError is invalid");
}
