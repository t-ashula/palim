const anchor = testDocument.createElementNS(
  "http://www.w3.org/1999/xhtml",
  "a",
);
if (
  !(anchor instanceof HTMLAnchorElement) ||
  anchor.namespaceURI !== "http://www.w3.org/1999/xhtml"
) {
  throw new Error("createElementNS returned an invalid element");
}
