const implementation = testDocument.implementation;
const omitted = implementation.createHTMLDocument();
const explicitUndefined = implementation.createHTMLDocument(undefined);
const explicitNull = implementation.createHTMLDocument(null);

if (omitted.title !== "" || omitted.querySelector("title") !== null) {
  throw new Error("an omitted title created a title element");
}
if (
  explicitUndefined.title !== "" ||
  explicitUndefined.querySelector("title") !== null
) {
  throw new Error("an undefined title was not treated as omitted");
}
if (
  explicitNull.title !== "null" ||
  explicitNull.querySelector("title").textContent !== "null"
) {
  throw new Error("a null title was not converted to a string");
}
