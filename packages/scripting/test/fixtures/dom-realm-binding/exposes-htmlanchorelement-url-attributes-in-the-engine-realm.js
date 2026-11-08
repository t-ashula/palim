const anchor = testDocument.getElementById("target");
anchor.href = "https://example.com/path?query#fragment";
if (
  !(anchor instanceof HTMLAnchorElement) ||
  anchor.pathname !== "/path" ||
  anchor.search !== "?query" ||
  anchor.hash !== "#fragment"
) {
  throw new Error("HTMLAnchorElement URL attributes are invalid");
}
