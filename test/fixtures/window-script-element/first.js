if (
  document.defaultView !== window ||
  window.document !== document ||
  document.querySelector("#before") === null ||
  document.querySelector("#after") !== null
) {
  throw new Error("the first script observed an invalid Document state");
}

globalThis.executionOrder = ["first"];
document.body.setAttribute(
  "data-first",
  document.querySelector("#before").textContent,
);
