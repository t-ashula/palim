const target = new EventTarget();
const controller = new AbortController();
let calls = 0;
function listener() {
  calls += 1;
}
target.addEventListener("signal", listener, {
  signal: controller.signal,
});
target.dispatchEvent(new Event("signal"));
controller.abort();
target.dispatchEvent(new Event("signal"));
target.addEventListener("signal", listener, {
  signal: controller.signal,
});
target.dispatchEvent(new Event("signal"));
if (calls !== 1 || !controller.signal.aborted) {
  throw new Error("abort signal did not remove the listener");
}

let threw = false;
try {
  target.addEventListener("signal", null, { signal: null });
} catch (error) {
  threw = error instanceof TypeError;
}
if (!threw) {
  throw new Error("null signal did not throw a TypeError");
}
