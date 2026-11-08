const svg = new DOMParser().parseFromString(
  '<p:svg xmlns:p="http://www.w3.org/2000/svg"></p:svg>',
  "image/svg+xml",
);
const xml = new DOMParser().parseFromString("<svg></svg>", "text/xml");

if (svg.rootElement !== svg.documentElement) {
  throw new Error("rootElement did not expose the SVG document element");
}
if (xml.rootElement !== null || testDocument.rootElement !== null) {
  throw new Error("rootElement exposed a non-SVG document element");
}
