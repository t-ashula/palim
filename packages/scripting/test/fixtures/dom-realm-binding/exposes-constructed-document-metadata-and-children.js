const document = new Document();
if (
  document instanceof XMLDocument ||
  document.firstChild !== null ||
  document.lastChild !== null ||
  !(document.childNodes instanceof NodeList) ||
  document.childNodes.length !== 0 ||
  document.location !== null ||
  document.URL !== "about:blank" ||
  document.documentURI !== "about:blank" ||
  document.baseURI !== "about:blank" ||
  document.compatMode !== "CSS1Compat" ||
  document.characterSet !== "UTF-8" ||
  document.charset !== "UTF-8" ||
  document.inputEncoding !== "UTF-8" ||
  document.contentType !== "application/xml"
) {
  throw new Error("constructed Document state is invalid");
}
