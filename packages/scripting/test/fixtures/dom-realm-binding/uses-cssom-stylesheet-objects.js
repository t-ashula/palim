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

const media = sheet.media;
if (
  !(media instanceof MediaList) ||
  media !== sheet.media ||
  media.mediaText !== "screen, print" ||
  media.length !== 2 ||
  media[0] !== "screen" ||
  media[1] !== "print" ||
  media[2] !== undefined ||
  media.item(-1) !== null ||
  String(media) !== "screen, print"
) {
  throw new Error("stylesheet media binding is invalid");
}

media.deleteMedium("screen");
media.appendMedium("speech");
if (
  media.mediaText !== "print, speech" ||
  styleElement.getAttribute("media") !== "print, speech"
) {
  throw new Error("stylesheet media mutation is invalid");
}

styleElement.setAttribute("media", "SCREEN and (min-width:480px)");
if (media.mediaText !== "screen and (min-width: 480px)") {
  throw new Error("stylesheet media attribute reflection is invalid");
}

const rule = sheet.cssRules[0];
if (
  !(rule instanceof CSSStyleRule) ||
  !(rule instanceof CSSRule) ||
  rule.selectorText !== "main" ||
  rule.parentStyleSheet !== sheet ||
  !(rule.style instanceof CSSStyleDeclaration) ||
  rule.style !== rule.style ||
  rule.style.parentRule !== rule ||
  rule.style.getPropertyValue("display") !== "block"
) {
  throw new Error("style rule binding is invalid");
}

rule.style.setProperty("display", "none");
if (
  rule.cssText !== "main { display: none; }" ||
  !styleElement.textContent.includes("main { display: none; }")
) {
  throw new Error("style rule declaration binding is invalid");
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

sheet.insertRule("@media SCREEN { main { display: block } }", 1);
const mediaRule = sheet.cssRules[1];
if (
  !(mediaRule instanceof CSSMediaRule) ||
  !(mediaRule instanceof CSSConditionRule) ||
  !(mediaRule instanceof CSSGroupingRule) ||
  mediaRule.type !== CSSRule.MEDIA_RULE ||
  mediaRule.conditionText !== "screen" ||
  mediaRule.media.mediaText !== "screen" ||
  mediaRule.media !== mediaRule.media ||
  mediaRule.cssRules !== mediaRule.cssRules ||
  mediaRule.cssRules.length !== 1 ||
  mediaRule.cssRules[0].parentRule !== mediaRule
) {
  throw new Error("media rule binding is invalid");
}

mediaRule.insertRule("aside { display: none }", 0);
mediaRule.deleteRule(1);
mediaRule.media.mediaText = "print";
if (
  mediaRule.cssRules.length !== 1 ||
  mediaRule.cssRules[0].selectorText !== "aside" ||
  mediaRule.conditionText !== "print" ||
  !styleElement.textContent.includes("@media print")
) {
  throw new Error("media rule mutation binding is invalid");
}
