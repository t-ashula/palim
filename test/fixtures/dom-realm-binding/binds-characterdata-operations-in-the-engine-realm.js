const data = Object.getOwnPropertyDescriptor(CharacterData.prototype, "data");
const replaceData = Object.getOwnPropertyDescriptor(
  CharacterData.prototype,
  "replaceData",
);
if (
  typeof data.get !== "function" ||
  typeof data.set !== "function" ||
  typeof replaceData.value !== "function" ||
  replaceData.value.length !== 3
) {
  throw new Error("CharacterData descriptors are invalid");
}

const text = new Text("test");
if (
  text.data !== "test" ||
  text.wholeText !== "test" ||
  text.ownerDocument !== testDocument
) {
  throw new Error("Text constructor did not use data or the realm document");
}
const calls = [];
const convertedComment = new Comment(
  {
    toString() {
      calls.push("first");
      return "comment";
    },
  },
  {
    toString() {
      calls.push("second");
      throw new Error("second constructor argument was read");
    },
  },
);
if (
  convertedComment.data !== "comment" ||
  convertedComment.ownerDocument !== testDocument ||
  calls.join(",") !== "first" ||
  new Text(undefined).data !== "" ||
  new Comment(null).data !== "null"
) {
  throw new Error("CharacterData constructor conversion is invalid");
}
text.data = "🌠 test 🌠 TEST";
if (text.substringData(1, 8) !== "\uDF20 test \uD83C") {
  throw new Error("substringData did not use UTF-16 code units");
}
text.replaceData(1, 4, "--");
text.deleteData(1, 2);
text.insertData(1, "\uDF1F ");
text.appendData(null);
if (text.data !== "🌟 st 🌠 TESTnull") {
  throw new Error("CharacterData mutation result is invalid");
}

try {
  text.substringData(0);
  throw new Error("missing count was accepted");
} catch (error) {
  if (!(error instanceof TypeError)) throw error;
}
try {
  text.substringData(0xffffffff, 0);
  throw new Error("out-of-bounds offset was accepted");
} catch (error) {
  if (!(error instanceof DOMException) || error.name !== "IndexSizeError") {
    throw error;
  }
}
text.data = null;
if (text.data !== "") {
  throw new Error("data did not apply LegacyNullToEmptyString");
}
