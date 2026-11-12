const parser = new DOMParser();
const htmlWithMetaEncoding = parser.parseFromString(
  '<meta charset="windows-1252"><p>€</p>',
  "text/html",
);
if (
  htmlWithMetaEncoding.characterSet !== "UTF-8" ||
  htmlWithMetaEncoding.querySelector("p").textContent !== "€"
) {
  throw new Error("DOMParser applied byte encoding sniffing to string input");
}
const xml = parser.parseFromString("<root>value</root>", "text/xml");
const malformedXML = parser.parseFromString("<root>", "text/xml");
const xmlWithDoctype = parser.parseFromString(
  '<!DOCTYPE root SYSTEM "urn:test"><root/>',
  "text/xml",
);
const html = parser.parseFromString("<main>value</main>", "text/html");
for (const [document, data, name] of [
  [html, "]]>", "NotSupportedError"],
  [xml, "]]>", "InvalidCharacterError"],
]) {
  try {
    document.createCDATASection(data);
    throw new Error("invalid CDATA section was accepted");
  } catch (error) {
    if (!(error instanceof DOMException) || error.name !== name) {
      throw error;
    }
  }
}
if (
  !(parser instanceof DOMParser) ||
  Object.prototype.toString.call(parser) !== "[object DOMParser]" ||
  !(xml instanceof Document) ||
  xml instanceof XMLDocument ||
  !(malformedXML instanceof Document) ||
  malformedXML instanceof XMLDocument ||
  xml.contentType !== "text/xml" ||
  xml.documentElement.localName !== "root" ||
  xml.documentElement.tagName !== "root" ||
  xml.documentElement.textContent !== "value" ||
  xml.readyState !== "complete" ||
  !(xmlWithDoctype.doctype instanceof DocumentType) ||
  xmlWithDoctype.doctype.name !== "root" ||
  xmlWithDoctype.doctype.publicId !== "" ||
  xmlWithDoctype.doctype.systemId !== "urn:test" ||
  html.contentType !== "text/html" ||
  html.querySelector("main").textContent !== "value"
) {
  throw new Error("DOMParser binding is invalid");
}
for (const argumentsList of [[], ["<root />"]]) {
  try {
    parser.parseFromString(...argumentsList);
    throw new Error("missing DOMParser argument was accepted");
  } catch (error) {
    if (!(error instanceof TypeError)) {
      throw error;
    }
  }
}
try {
  DOMParser.prototype.parseFromString.call({}, "<root />", "text/xml");
  throw new Error("invalid DOMParser receiver was accepted");
} catch (error) {
  if (!(error instanceof TypeError)) {
    throw error;
  }
}
const xhtml = parser.parseFromString(
  "<html xmlns='http://www.w3.org/1999/xhtml'></html>",
  "application/xhtml+xml",
);
const serializer = new XMLSerializer();
if (
  !(serializer instanceof XMLSerializer) ||
  Object.prototype.toString.call(serializer) !== "[object XMLSerializer]" ||
  serializer.serializeToString(xml) !== "<root>value</root>"
) {
  throw new Error("XMLSerializer binding is invalid");
}
for (const serialize of [
  () => serializer.serializeToString(),
  () => serializer.serializeToString("<root />"),
  () => XMLSerializer.prototype.serializeToString.call({}, xml),
]) {
  try {
    serialize();
    throw new Error("invalid XMLSerializer call was accepted");
  } catch (error) {
    if (!(error instanceof TypeError)) {
      throw error;
    }
  }
}
try {
  xhtml.documentElement.innerHTML = "\uD800";
  throw new Error("invalid XML fragment was accepted");
} catch (error) {
  if (
    !(error instanceof DOMException) ||
    error.name !== "SyntaxError" ||
    error.code !== DOMException.SYNTAX_ERR
  ) {
    throw error;
  }
}
