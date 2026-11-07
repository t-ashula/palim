const main = testDocument.querySelector("main");
const aside = testDocument.querySelector("aside");
const text = main.nextSibling;
if (
  main.nextElementSibling !== aside ||
  aside.previousElementSibling !== main ||
  text.previousElementSibling !== main ||
  text.nextElementSibling !== aside
) {
  throw new Error("element sibling binding is invalid");
}

const original = main.attributes[0];
const replacement = aside.attributes[0];
aside.removeAttributeNode(replacement);
const old = main.setAttributeNodeNS(replacement);
if (
  old !== original ||
  main.attributes[0] !== replacement ||
  main.removeAttributeNode(replacement) !== replacement ||
  main.attributes.length !== 0
) {
  throw new Error("attribute node binding is invalid");
}

testDocument.title = "Updated title";
if (testDocument.title !== "Updated title") {
  throw new Error("Document title binding is invalid");
}

const style = main.style;
if (
  !(style instanceof CSSStyleDeclaration) ||
  !(style instanceof CSSStyleProperties) ||
  style !== main.style ||
  style.parentRule !== null
) {
  throw new Error("style object binding is invalid");
}
main.setAttribute("style", "color: green");
if (style.cssText !== "color: green;" || style.color !== "green") {
  throw new Error("style color binding is invalid");
}
style.backgroundColor = "blue";
if (
  style.backgroundColor !== "blue" ||
  main.getAttribute("style") !== "color: green; background-color: blue;"
) {
  throw new Error("style backgroundColor binding is invalid");
}
style.cssText = "";
style.setProperty("display", "none", "important");
style.visibility = "hidden";
if (
  style.length !== 2 ||
  style[0] !== "display" ||
  style.item(1) !== "visibility" ||
  style.getPropertyValue("display") !== "none" ||
  style.getPropertyPriority("display") !== "important" ||
  style.float !== ""
) {
  throw new Error("style declaration binding is invalid");
}
main.style = "display: flex;";
if (style.display !== "flex") {
  throw new Error("style PutForwards binding is invalid");
}
main.style = null;
if (main.getAttribute("style") !== "" || style.length !== 0) {
  throw new Error("style cssText forwarding is invalid");
}
