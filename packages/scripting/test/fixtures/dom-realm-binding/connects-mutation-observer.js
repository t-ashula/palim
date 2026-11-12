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
