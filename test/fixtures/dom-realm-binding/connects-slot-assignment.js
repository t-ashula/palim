const host = testDocument.querySelector("div");
const slottable = testDocument.querySelector("p");
const shadowRoot = host.attachShadow({ mode: "open" });
const slot = testDocument.createElement("slot");

slot.name = "content";
slottable.slot = "content";
shadowRoot.append(slot);
host.moveBefore(slottable, null);

if (slot.name !== "content") throw new Error("slot name was not reflected");
if (slot.assignedNodes().length !== 1) throw new Error("node not assigned");
if (slot.assignedNodes()[0] !== slottable) throw new Error("wrong assignment");
if (slot.assignedElements()[0] !== slottable) {
  throw new Error("wrong element assignment");
}
