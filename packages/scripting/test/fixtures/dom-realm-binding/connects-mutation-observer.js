const root = testDocument.querySelector("div");
const oldParent = testDocument.querySelector("section");
const newParent = testDocument.querySelector("main");
const target = testDocument.querySelector("span");
const observer = new MutationObserver(() => {});

observer.observe(root, { childList: true, subtree: true });
newParent.moveBefore(target, null);

const records = observer.takeRecords();
if (records.length !== 2) throw new Error("expected two mutation records");
if (records[0].type !== "childList") throw new Error("unexpected record type");
if (records[0].target !== oldParent) throw new Error("wrong removal target");
if (records[0].removedNodes[0] !== target)
  throw new Error("wrong removed node");
if (records[1].target !== newParent) throw new Error("wrong insertion target");
if (records[1].addedNodes[0] !== target) throw new Error("wrong added node");

const replacementParent = testDocument.createElement("article");
const before = testDocument.createElement("before");
const replaced = testDocument.createElement("replaced");
const after = testDocument.createElement("after");
const replacement = testDocument.createElement("replacement");
replacementParent.append(before, replaced, after);
const replacementObserver = new MutationObserver(() => {});
replacementObserver.observe(replacementParent, { childList: true });

replacementParent.replaceChild(replacement, replaced);

const replacementRecords = replacementObserver.takeRecords();
if (replacementRecords.length !== 1)
  throw new Error("expected one replacement mutation record");
if (replacementRecords[0].target !== replacementParent)
  throw new Error("wrong replacement target");
if (replacementRecords[0].addedNodes[0] !== replacement)
  throw new Error("wrong replacement added node");
if (replacementRecords[0].removedNodes[0] !== replaced)
  throw new Error("wrong replacement removed node");
if (replacementRecords[0].previousSibling !== before)
  throw new Error("wrong replacement previous sibling");
if (replacementRecords[0].nextSibling !== after)
  throw new Error("wrong replacement next sibling");

const replaceAllParent = testDocument.createElement("replace-all-parent");
const replaceAllFirst = testDocument.createElement("replace-all-first");
const replaceAllRetained = testDocument.createElement("replace-all-retained");
const replaceAllLast = testDocument.createElement("replace-all-last");
replaceAllParent.append(replaceAllFirst, replaceAllRetained, replaceAllLast);
const replaceAllObserver = new MutationObserver(() => {});
replaceAllObserver.observe(replaceAllParent, { childList: true });

replaceAllParent.replaceChildren(replaceAllRetained);

const replaceAllRecords = replaceAllObserver.takeRecords();
if (replaceAllRecords.length !== 1)
  throw new Error("expected one replace-all mutation record");
if (replaceAllRecords[0].target !== replaceAllParent)
  throw new Error("wrong replace-all target");
if (
  replaceAllRecords[0].addedNodes.length !== 1 ||
  replaceAllRecords[0].addedNodes[0] !== replaceAllRetained
)
  throw new Error("wrong replace-all added nodes");
if (
  replaceAllRecords[0].removedNodes.length !== 3 ||
  replaceAllRecords[0].removedNodes[0] !== replaceAllFirst ||
  replaceAllRecords[0].removedNodes[1] !== replaceAllRetained ||
  replaceAllRecords[0].removedNodes[2] !== replaceAllLast
)
  throw new Error("wrong replace-all removed nodes");

const attributeTarget = testDocument.createElement("attribute-target");
attributeTarget.setAttribute("data-kept", "before");
const attributeObserver = new MutationObserver(() => {});
attributeObserver.observe(attributeTarget, {
  attributeOldValue: true,
  attributeFilter: ["data-kept"],
});
attributeTarget.setAttribute("data-ignored", "ignored");
attributeTarget.setAttribute("data-kept", "after");
const attributeRecords = attributeObserver.takeRecords();
if (attributeRecords.length !== 1)
  throw new Error("expected one filtered attribute record");
if (attributeRecords[0].type !== "attributes")
  throw new Error("wrong attribute record type");
if (attributeRecords[0].target !== attributeTarget)
  throw new Error("wrong attribute target");
if (attributeRecords[0].attributeName !== "data-kept")
  throw new Error("wrong attribute name");
if (attributeRecords[0].attributeNamespace !== null)
  throw new Error("wrong attribute namespace");
if (attributeRecords[0].oldValue !== "before")
  throw new Error("wrong attribute old value");
if (attributeRecords[0].addedNodes.length !== 0)
  throw new Error("attribute record has added nodes");

const text = testDocument.createTextNode("before");
const characterObserver = new MutationObserver(() => {});
characterObserver.observe(text, { characterDataOldValue: true });
text.data = "after";
const characterRecords = characterObserver.takeRecords();
if (characterRecords.length !== 1)
  throw new Error("expected one character data record");
if (characterRecords[0].type !== "characterData")
  throw new Error("wrong character data record type");
if (characterRecords[0].target !== text)
  throw new Error("wrong character data target");
if (characterRecords[0].oldValue !== "before") {
  throw new Error("wrong character data old value");
}
