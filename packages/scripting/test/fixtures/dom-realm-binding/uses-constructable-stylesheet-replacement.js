const sheet = new CSSStyleSheet();
const rules = sheet.cssRules;

sheet.replaceSync("main { display: block } aside { color: red }");
if (
  sheet.cssRules !== rules ||
  rules.length !== 2 ||
  rules[0].parentStyleSheet !== sheet ||
  rules[1].selectorText !== "aside"
) {
  throw new Error("replaceSync binding is invalid");
}

const oldRule = rules[0];
const replacement = sheet.replace("article { display: none }");
if (!(replacement instanceof Promise)) {
  throw new Error("replace must return a realm Promise");
}
if (
  sheet.cssRules !== rules ||
  rules.length !== 1 ||
  rules[0].selectorText !== "article" ||
  oldRule.parentStyleSheet !== null
) {
  throw new Error("replace binding did not update the stylesheet");
}

let missingArgumentThrew = false;
try {
  sheet.replaceSync();
} catch (error) {
  missingArgumentThrew = error instanceof TypeError;
}
if (!missingArgumentThrew) {
  throw new Error("replaceSync must require its text argument");
}

let incompatibleReceiverThrew = false;
try {
  CSSStyleSheet.prototype.replaceSync.call({});
} catch (error) {
  incompatibleReceiverThrew = error instanceof TypeError;
}
if (!incompatibleReceiverThrew) {
  throw new Error("replaceSync must reject an incompatible receiver");
}

let credentialBaseURLThrew = false;
try {
  new CSSStyleSheet({ baseURL: "https://user:password@example.test/" });
} catch (error) {
  credentialBaseURLThrew =
    error instanceof DOMException && error.name === "NotAllowedError";
}
if (!credentialBaseURLThrew) {
  throw new Error("CSSStyleSheet must reject credentials in baseURL");
}
