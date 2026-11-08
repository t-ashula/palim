if (HTMLDocument !== Document) {
  throw new Error("HTMLDocument must alias Document");
}
if (
  HTMLDocument.prototype !== Document.prototype ||
  Object.getPrototypeOf(testDocument) !== HTMLDocument.prototype ||
  testDocument.constructor !== HTMLDocument
) {
  throw new Error("HTMLDocument prototype relationship is invalid");
}

const descriptor = Object.getOwnPropertyDescriptor(globalThis, "HTMLDocument");
if (
  descriptor.value !== Document ||
  !descriptor.writable ||
  descriptor.enumerable ||
  !descriptor.configurable
) {
  throw new Error("HTMLDocument property descriptor is invalid");
}

const created = testDocument.implementation.createHTMLDocument("");
if (
  Object.getPrototypeOf(created) !== HTMLDocument.prototype ||
  created.constructor !== HTMLDocument
) {
  throw new Error("Created HTML document prototype is invalid");
}
