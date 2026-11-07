const collection = testDocument.getElementsByClassName("text1");
const table = testDocument.getElementsByTagName("table")[0];
if (!(table instanceof HTMLTableElement) || collection.length !== 1) {
  throw new Error("missing table fixture");
}

table.deleteRow(1);
if (collection.length !== 0) {
  throw new Error("deleteRow did not update the live collection");
}

let missingArgument;
try {
  table.deleteRow();
} catch (error) {
  missingArgument = error;
}
if (!(missingArgument instanceof TypeError)) {
  throw new Error("deleteRow did not require its index argument");
}

let invalidIndex;
try {
  table.deleteRow(99);
} catch (error) {
  invalidIndex = error;
}
if (
  !(invalidIndex instanceof DOMException) ||
  invalidIndex.name !== "IndexSizeError"
) {
  throw new Error("deleteRow did not throw a realm DOMException");
}
