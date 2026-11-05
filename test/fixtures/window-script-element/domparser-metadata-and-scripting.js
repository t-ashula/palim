const scriptMarkup = "<script>window.domParserScriptRan = true;</sc" + "ript>";

for (const type of [
  "text/html",
  "text/xml",
  "application/xml",
  "application/xhtml+xml",
  "image/svg+xml",
]) {
  const source =
    type === "text/html"
      ? "<main></main>"
      : type === "application/xhtml+xml"
        ? '<html xmlns="http://www.w3.org/1999/xhtml"></html>'
        : type === "image/svg+xml"
          ? '<svg xmlns="http://www.w3.org/2000/svg"></svg>'
          : "<root></root>";
  const parsed = new DOMParser().parseFromString(source, type);
  if (
    parsed.URL !== document.URL ||
    parsed.documentURI !== document.URL ||
    parsed.baseURI !== document.URL ||
    parsed.contentType !== type ||
    parsed.characterSet !== "UTF-8"
  ) {
    throw new Error(`invalid DOMParser metadata for ${type}`);
  }
}

const parsedHTML = new DOMParser().parseFromString(
  `<body>${scriptMarkup}</body>`,
  "text/html",
);
document.body.appendChild(parsedHTML.body);

function xhtmlScript() {
  const parsed = new DOMParser().parseFromString(
    `<html xmlns="http://www.w3.org/1999/xhtml"><body>${scriptMarkup}</body></html>`,
    "application/xhtml+xml",
  );
  return parsed.querySelector("script");
}

document.body.appendChild(document.importNode(xhtmlScript(), true));
document.body.appendChild(document.adoptNode(xhtmlScript()));
document.body.appendChild(xhtmlScript().cloneNode(true));

if (window.domParserScriptRan !== undefined) {
  throw new Error("DOMParser script executed after tree transfer");
}
document.body.setAttribute("data-domparser-state", "valid");
