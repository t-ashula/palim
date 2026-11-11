const anchor = testDocument.getElementById("target");
const area = testDocument.getElementById("area");
for (const [element, Interface] of [
  [anchor, HTMLAnchorElement],
  [area, HTMLAreaElement],
]) {
  element.href = "../path?query#fragment";
  if (
    !(element instanceof Interface) ||
    element.href !== "https://example.test/path?query#fragment" ||
    element.origin !== "https://example.test" ||
    element.protocol !== "https:" ||
    element.host !== "example.test" ||
    element.hostname !== "example.test" ||
    element.port !== "" ||
    element.pathname !== "/path" ||
    element.search !== "?query" ||
    element.hash !== "#fragment"
  ) {
    throw new Error("HTML hyperlink URL attributes are invalid");
  }
  element.hostname = "other.example.test";
  element.pathname = "/next";
  if (element.href !== "https://other.example.test/next?query#fragment") {
    throw new Error("HTML hyperlink URL setters are invalid");
  }
  element.href = "http://[";
  if (element.href !== "http://[" || element.protocol !== ":") {
    throw new Error("Invalid HTML hyperlink URL state is invalid");
  }
}
