const event = new Event("event", {
  bubbles: true,
  cancelable: true,
});
if (
  event.target !== null ||
  event.srcElement !== null ||
  event.currentTarget !== null ||
  event.eventPhase !== Event.NONE ||
  !event.bubbles ||
  !event.cancelable ||
  event.defaultPrevented ||
  event.returnValue !== true ||
  event.isTrusted ||
  event.timeStamp <= 0 ||
  typeof event.initEvent !== "function"
) {
  throw new Error("Event constructor state is invalid");
}

const custom = new CustomEvent("custom", {
  detail: 54,
  cancelable: true,
});
if (
  !(custom instanceof CustomEvent) ||
  !(custom instanceof Event) ||
  custom.detail !== 54 ||
  !custom.cancelable
) {
  throw new Error("CustomEvent constructor state is invalid");
}
