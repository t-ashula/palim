const target = new EventTarget();
let onceCalls = 0;
function onceListener() {
  onceCalls += 1;
  target.dispatchEvent(new Event("once"));
}
target.addEventListener("once", onceListener, { once: true });
target.dispatchEvent(new Event("once"));
target.dispatchEvent(new Event("once"));
if (onceCalls !== 1) {
  throw new Error("once listener was not removed before invocation");
}

let removeOnceGetterCalls = 0;
function removableListener() {}
target.addEventListener("remove", removableListener);
target.removeEventListener("remove", removableListener, {
  get once() {
    removeOnceGetterCalls += 1;
    return true;
  },
});
if (removeOnceGetterCalls !== 0) {
  throw new Error("removeEventListener read the once option");
}

let immediateCalls = 0;
for (let index = 0; index < 2; index += 1) {
  target.addEventListener(
    "immediate",
    (event) => {
      immediateCalls += 1;
      event.stopImmediatePropagation();
    },
    { once: true },
  );
}
target.dispatchEvent(new Event("immediate"));
target.dispatchEvent(new Event("immediate"));
if (immediateCalls !== 2) {
  throw new Error("remaining once listener was not retained");
}
