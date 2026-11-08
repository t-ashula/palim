const first = new Document();
const second = new Document();

if (
  !(first instanceof Document) ||
  Object.getPrototypeOf(first) !== Document.prototype ||
  first === second ||
  first === document ||
  first.defaultView !== null
) {
  throw new Error("Document constructor identity is invalid");
}

first.appendChild(first.createElement("root"));
recordConstructedDocument(first);
