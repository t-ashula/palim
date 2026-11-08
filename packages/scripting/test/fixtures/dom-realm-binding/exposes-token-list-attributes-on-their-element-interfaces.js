const html = "http://www.w3.org/1999/xhtml";
const svg = "http://www.w3.org/2000/svg";
const mathml = "http://www.w3.org/1998/Math/MathML";
const cases = [
  [html, "a", "relList", HTMLAnchorElement],
  [html, "area", "relList", HTMLAreaElement],
  [html, "link", "relList", HTMLLinkElement],
  [html, "link", "sizes", HTMLLinkElement],
  [html, "iframe", "sandbox", HTMLIFrameElement],
  [html, "output", "htmlFor", HTMLOutputElement],
  [svg, "a", "relList", Element],
  [mathml, "a", "relList", Element],
];
for (const [namespace, localName, attribute, Interface] of cases) {
  const element = testDocument.createElementNS(namespace, localName);
  if (
    !(element instanceof Interface) ||
    Object.prototype.toString.call(element[attribute]) !==
      "[object DOMTokenList]"
  ) {
    throw new Error(localName + "." + attribute + " is invalid");
  }
}
for (const [namespace, localName, attribute] of [
  [html, "td", "relList"],
  [svg, "area", "relList"],
  [mathml, "link", "sizes"],
]) {
  const element = testDocument.createElementNS(namespace, localName);
  if (element[attribute] !== undefined) {
    throw new Error(localName + "." + attribute + " is overexposed");
  }
}
