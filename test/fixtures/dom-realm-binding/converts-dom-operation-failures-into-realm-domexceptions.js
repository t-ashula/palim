function assertDOMException(callback, name, code) {
  try {
    callback();
  } catch (error) {
    if (
      !(error instanceof DOMException) ||
      error.name !== name ||
      error.code !== code
    ) {
      throw new Error(
        "Expected " +
          name +
          " code " +
          code +
          ", got " +
          error.name +
          " code " +
          error.code,
      );
    }
    return;
  }
  throw new Error("Expected " + name);
}

const constructed = new DOMException("detail", "SyntaxError");
if (
  constructed.message !== "detail" ||
  constructed.name !== "SyntaxError" ||
  constructed.code !== DOMException.SYNTAX_ERR
) {
  throw new Error("Constructed DOMException attributes are invalid");
}
for (const name of ["message", "name", "code"]) {
  let threw = false;
  try {
    Reflect.get(DOMException.prototype, name);
  } catch (error) {
    threw = error instanceof TypeError;
  }
  if (!threw) {
    throw new Error("DOMException.prototype." + name + " was not branded");
  }
}

const text = testDocument.createTextNode("text");
assertDOMException(
  () => text.appendChild(testDocument.createTextNode("child")),
  "HierarchyRequestError",
  DOMException.HIERARCHY_REQUEST_ERR,
);
assertDOMException(
  () => testDocument.body.removeChild(text),
  "NotFoundError",
  DOMException.NOT_FOUND_ERR,
);
assertDOMException(
  () => testDocument.body.insertBefore(testDocument.body, null),
  "HierarchyRequestError",
  DOMException.HIERARCHY_REQUEST_ERR,
);
assertDOMException(
  () => text.insertBefore(text, testDocument.createTextNode("reference")),
  "HierarchyRequestError",
  DOMException.HIERARCHY_REQUEST_ERR,
);
assertDOMException(
  () => testDocument.createElement(""),
  "InvalidCharacterError",
  DOMException.INVALID_CHARACTER_ERR,
);
assertDOMException(
  () => testDocument.createElementNS(null, "prefix:name"),
  "NamespaceError",
  DOMException.NAMESPACE_ERR,
);
if (testDocument.createElementNS(undefined, "name").namespaceURI !== null) {
  throw new Error("undefined namespace was not converted to null");
}
assertDOMException(
  () => testDocument.createProcessingInstruction("pi", "?>"),
  "InvalidCharacterError",
  DOMException.INVALID_CHARACTER_ERR,
);

const element = testDocument.getElementById("target");
const fragment = testDocument.createDocumentFragment();
for (const parent of [testDocument, element, fragment]) {
  assertDOMException(
    () => parent.querySelector("// invalid"),
    "SyntaxError",
    DOMException.SYNTAX_ERR,
  );
  assertDOMException(
    () => parent.querySelectorAll("// invalid"),
    "SyntaxError",
    DOMException.SYNTAX_ERR,
  );
}
