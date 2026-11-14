const target = testDocument.getElementById("target");
const focusMembers = ["autofocus", "tabIndex", "focus", "blur"];
const missingFocusMembers = focusMembers.filter(
  (name) => !Object.prototype.hasOwnProperty.call(HTMLElement.prototype, name),
);
if (missingFocusMembers.length !== 0) {
  throw new Error(
    `HTMLElement.prototype does not expose ${missingFocusMembers.join(", ")}`,
  );
}
if (
  target.autofocus !== false ||
  target.tabIndex !== -1 ||
  target.focus.length !== 0 ||
  target.blur.length !== 0
) {
  throw new Error("HTMLElement focus member defaults are invalid");
}

target.autofocus = true;
target.tabIndex = 4.9;
if (
  target.autofocus !== true ||
  !target.hasAttribute("autofocus") ||
  target.tabIndex !== 4
) {
  throw new Error("HTMLElement focus attribute setters are invalid");
}

target.autofocus = false;
target.focus({ preventScroll: true });
if (testDocument.activeElement !== target || !target.matches(":focus")) {
  throw new Error("HTMLElement.focus does not update activeElement");
}

const host = testDocument.createElement("div");
testDocument.body.append(host);
const shadowRoot = host.attachShadow({
  mode: "open",
  delegatesFocus: true,
});
const input = testDocument.createElement("input");
shadowRoot.append(input);
host.focus();
if (
  shadowRoot.delegatesFocus !== true ||
  testDocument.activeElement !== host ||
  shadowRoot.activeElement !== input
) {
  throw new Error("Shadow DOM focus state is not exposed in the engine realm");
}

let relatedTarget = null;
input.addEventListener("blur", (event) => {
  if (!(event instanceof FocusEvent)) {
    throw new Error("focus transition does not expose FocusEvent");
  }
  relatedTarget = event.relatedTarget;
});
const next = testDocument.createElement("button");
testDocument.body.append(next);
next.focus();
if (relatedTarget !== next) {
  throw new Error("FocusEvent.relatedTarget is not exposed");
}
