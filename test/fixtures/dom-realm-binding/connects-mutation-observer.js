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
