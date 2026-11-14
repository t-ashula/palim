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
target.blur();
