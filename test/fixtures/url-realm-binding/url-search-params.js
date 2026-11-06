const sequence = new URLSearchParams([
  ["first", 1],
  ["first", 2],
  ["third", "three words"],
]);
if (
  sequence.toString() !== "first=1&first=2&third=three+words" ||
  sequence.size !== 3 ||
  !Array.isArray(sequence.getAll("first")) ||
  sequence.getAll("first").join(",") !== "1,2"
) {
  throw new Error("sequence conversion is invalid");
}

const record = new URLSearchParams({ first: 1, second: "two" });
if (record.toString() !== "first=1&second=two") {
  throw new Error("record conversion is invalid");
}
const surrogateRecord = new URLSearchParams({
  "\uD835x": "first",
  "\uD83Dx": "last",
});
if (surrogateRecord.toString() !== "%EF%BF%BDx=last") {
  throw new Error("record key conversion is invalid");
}
const copy = new URLSearchParams(sequence);
sequence.set("first", "changed");
if (
  copy.getAll("first").join(",") !== "1,2" ||
  sequence.get("first") !== "changed" ||
  !sequence.has("first", "changed")
) {
  throw new Error("URLSearchParams copy is invalid");
}

const entries = [...copy];
if (
  entries.length !== 3 ||
  entries[0][0] !== "first" ||
  entries[0][1] !== "1" ||
  [...copy.keys()].join(",") !== "first,first,third" ||
  [...copy.values()].join(",") !== "1,2,three words"
) {
  throw new Error("URLSearchParams iterators are invalid");
}
const iterator = copy.entries();
if (iterator[Symbol.iterator]() !== iterator) {
  throw new Error("URLSearchParams iterator is not iterable");
}

const receiver = { count: 0 };
copy.forEach(function (value, name, parent) {
  if (this !== receiver || parent !== copy) {
    throw new Error("forEach callback arguments are invalid");
  }
  this.count += name.length + value.length;
}, receiver);
if (receiver.count !== 28) {
  throw new Error("forEach did not visit each pair");
}

copy[Symbol.iterator] = function* () {
  yield ["custom", "iterator"];
};
if (new URLSearchParams(copy).toString() !== "custom=iterator") {
  throw new Error("custom iterator was not used");
}

copy.delete("first", "1");
copy.append("last", "value");
copy.sort();
if (copy.toString() !== "first=2&last=value&third=three+words") {
  throw new Error("URLSearchParams mutations are invalid");
}

let prototypeThrew = false;
try {
  new URLSearchParams(DOMException.prototype);
} catch (error) {
  prototypeThrew = error instanceof TypeError;
}
if (!prototypeThrew) {
  throw new Error("DOMException.prototype did not enforce branding");
}

const formData = new FormData();
formData.append("first", "one");
formData.append("first", "two");
formData.set("last", "three");
if (
  !(formData instanceof FormData) ||
  formData.get("first") !== "one" ||
  formData.getAll("first").join(",") !== "one,two" ||
  !formData.has("last") ||
  [...formData.keys()].join(",") !== "first,first,last" ||
  [...formData.values()].join(",") !== "one,two,three"
) {
  throw new Error("FormData string entry list is invalid");
}
const fromFormData = new URLSearchParams(formData);
if (fromFormData.toString() !== "first=one&first=two&last=three") {
  throw new Error("URLSearchParams did not copy FormData entries");
}
formData.delete("first");
if (formData.has("first") || fromFormData.getAll("first").length !== 2) {
  throw new Error("FormData mutation or URLSearchParams copy is invalid");
}
