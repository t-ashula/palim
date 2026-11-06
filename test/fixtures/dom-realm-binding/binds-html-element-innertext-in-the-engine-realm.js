const target = testDocument.getElementById("target");
if (target.innerText !== "before child") {
  throw new Error("HTMLElement.innerText getter is invalid");
}
if (!Object.prototype.hasOwnProperty.call(HTMLElement.prototype, "innerText")) {
  throw new Error("HTMLElement.prototype does not expose innerText");
}

target.innerText = {
  toString() {
    return "after";
  },
};
if (target.textContent !== "after" || target.children.length !== 0) {
  throw new Error("HTMLElement.innerText setter is invalid");
}
