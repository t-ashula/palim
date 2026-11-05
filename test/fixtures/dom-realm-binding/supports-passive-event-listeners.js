const target = new EventTarget();
let passiveGetterCalls = 0;
target.addEventListener("probe", null, {
  get passive() {
    passiveGetterCalls += 1;
    return false;
  },
});
if (passiveGetterCalls !== 1) {
  throw new Error("passive option was not read");
}

target.addEventListener(
  "passive",
  (event) => {
    if (event.defaultPrevented) {
      throw new Error("event was canceled before listener invocation");
    }
    event.preventDefault();
    event.returnValue = false;
  },
  { passive: true },
);
const event = new Event("passive", { cancelable: true });
if (!target.dispatchEvent(event) || event.defaultPrevented) {
  throw new Error("passive listener canceled the event");
}
