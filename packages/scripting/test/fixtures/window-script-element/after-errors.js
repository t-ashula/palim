if (!globalThis.beforeRuntimeError) {
  throw new Error("the script before the runtime error did not execute");
}

document.body.setAttribute("data-after-errors", "executed");
