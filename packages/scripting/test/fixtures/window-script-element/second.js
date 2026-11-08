if (
  document.querySelector("#before") === null ||
  document.querySelector("#after") !== null
) {
  throw new Error("the second script observed an invalid Document state");
}

globalThis.executionOrder.push("second");
document.body.setAttribute("data-order", globalThis.executionOrder.join(","));
