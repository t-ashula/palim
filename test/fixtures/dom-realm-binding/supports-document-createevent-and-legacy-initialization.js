const legacyEvent = testDocument.createEvent("eVeNtS");
if (
  !(legacyEvent instanceof Event) ||
  legacyEvent.type !== "" ||
  legacyEvent.target !== null ||
  legacyEvent.bubbles ||
  legacyEvent.cancelable
) {
  throw new Error("Legacy Event factory state is invalid");
}

let uninitializedError;
try {
  testDocument.dispatchEvent(legacyEvent);
} catch (error) {
  uninitializedError = error;
}
if (
  !(uninitializedError instanceof DOMException) ||
  uninitializedError.name !== "InvalidStateError"
) {
  throw new Error("An uninitialized Event must not be dispatched");
}

legacyEvent.initEvent("ready", true, true);
testDocument.addEventListener("ready", () => {
  legacyEvent.initEvent("changed", false, false);
  if (
    legacyEvent.type !== "ready" ||
    !legacyEvent.bubbles ||
    !legacyEvent.cancelable
  ) {
    throw new Error("initEvent changed an Event during dispatch");
  }

  let redispatchError;
  try {
    testDocument.dispatchEvent(legacyEvent);
  } catch (error) {
    redispatchError = error;
  }
  if (
    !(redispatchError instanceof DOMException) ||
    redispatchError.name !== "InvalidStateError"
  ) {
    throw new Error("An Event must not be redispatched during dispatch");
  }
});
testDocument.dispatchEvent(legacyEvent);

legacyEvent.initEvent("reset");
if (
  legacyEvent.type !== "reset" ||
  legacyEvent.target !== null ||
  legacyEvent.bubbles ||
  legacyEvent.cancelable
) {
  throw new Error("initEvent did not reset the Event state");
}

const detail = { value: 54 };
const customEvent = testDocument.createEvent("CUSTOMevent");
customEvent.initCustomEvent("custom", true, true, detail);
if (
  !(customEvent instanceof CustomEvent) ||
  customEvent.type !== "custom" ||
  !customEvent.bubbles ||
  !customEvent.cancelable ||
  customEvent.detail !== detail
) {
  throw new Error("Legacy CustomEvent initialization is invalid");
}

for (const unsupported of ["foo", "U\u0130Event", "MouseEvent"]) {
  let unsupportedError;
  try {
    testDocument.createEvent(unsupported);
  } catch (error) {
    unsupportedError = error;
  }
  if (
    !(unsupportedError instanceof DOMException) ||
    unsupportedError.name !== "NotSupportedError"
  ) {
    throw new Error(`Expected NotSupportedError for ${unsupported}`);
  }
}
