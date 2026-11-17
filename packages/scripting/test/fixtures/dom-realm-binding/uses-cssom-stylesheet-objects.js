const styleElement = testDocument.querySelector("style");
const sheet = styleElement.sheet;

if (
  !(sheet instanceof CSSStyleSheet) ||
  sheet !== styleElement.sheet ||
  testDocument.styleSheets[0] !== sheet ||
  testDocument.styleSheets.item(0) !== sheet
) {
  throw new Error("stylesheet identity or list binding is invalid");
}

const rule = sheet.cssRules[0];
if (
  !(rule instanceof CSSStyleRule) ||
  !(rule instanceof CSSRule) ||
  rule.selectorText !== "main" ||
  rule.parentStyleSheet !== sheet
) {
  throw new Error("style rule binding is invalid");
}

const index = sheet.insertRule("aside { display: none }", 1);
if (
  index !== 1 ||
  sheet.cssRules.length !== 2 ||
  sheet.cssRules.item(1).selectorText !== "aside" ||
  !styleElement.textContent.includes("aside { display: none }")
) {
  throw new Error("insertRule binding is invalid");
}

sheet.deleteRule(0);
if (sheet.cssRules.length !== 1) {
  throw new Error("deleteRule binding is invalid");
}
