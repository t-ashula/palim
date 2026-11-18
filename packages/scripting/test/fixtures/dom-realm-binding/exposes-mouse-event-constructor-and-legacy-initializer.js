const relatedTarget = testDocument.createElement("div");
const view = { name: "view" };
const event = new MouseEvent("mousedown", {
  bubbles: true,
  cancelable: true,
  composed: true,
  view,
  detail: 2,
  screenX: 11,
  screenY: 12,
  clientX: 21,
  clientY: 22,
  ctrlKey: true,
  shiftKey: true,
  button: 1,
  buttons: 4,
  relatedTarget,
});
if (
  !(event instanceof MouseEvent) ||
  !(event instanceof Event) ||
  event.type !== "mousedown" ||
  !event.bubbles ||
  !event.cancelable ||
  !event.composed ||
  event.view !== view ||
  event.detail !== 2 ||
  event.screenX !== 11 ||
  event.screenY !== 12 ||
  event.clientX !== 21 ||
  event.clientY !== 22 ||
  !event.ctrlKey ||
  !event.shiftKey ||
  event.altKey ||
  event.metaKey ||
  event.button !== 1 ||
  event.buttons !== 4 ||
  event.relatedTarget !== relatedTarget ||
  !event.getModifierState("Control") ||
  !event.getModifierState("Shift") ||
  event.getModifierState("AltGraph")
) {
  throw new Error("MouseEvent constructor state is invalid");
}

const legacy = testDocument.createEvent("MouseEvents");
legacy.initMouseEvent(
  "mouseup",
  true,
  true,
  view,
  3,
  31,
  32,
  41,
  42,
  false,
  true,
  false,
  true,
  2,
  relatedTarget,
);
if (
  !(legacy instanceof MouseEvent) ||
  legacy.type !== "mouseup" ||
  legacy.view !== view ||
  legacy.detail !== 3 ||
  legacy.screenX !== 31 ||
  legacy.screenY !== 32 ||
  legacy.clientX !== 41 ||
  legacy.clientY !== 42 ||
  legacy.ctrlKey ||
  !legacy.altKey ||
  legacy.shiftKey ||
  !legacy.metaKey ||
  legacy.button !== 2 ||
  legacy.buttons !== 0 ||
  legacy.relatedTarget !== relatedTarget
) {
  throw new Error("Legacy MouseEvent initialization is invalid");
}

const getterError = (() => {
  try {
    new MouseEvent("error", {
      get clientX() {
        throw 54;
      },
    });
    return undefined;
  } catch (error) {
    return error;
  }
})();
if (getterError !== 54) {
  throw new Error("MouseEventInit getter error did not return to the page");
}
