if (
  typeof window.requestAnimationFrame !== "function" ||
  typeof window.cancelAnimationFrame !== "function" ||
  window.requestAnimationFrame !== requestAnimationFrame ||
  window.cancelAnimationFrame !== cancelAnimationFrame ||
  window.requestAnimationFrame.length !== 1 ||
  window.cancelAnimationFrame.length !== 1
) {
  throw new Error("Window animation frame operations are invalid");
}

const calls = [];
function record(value) {
  calls.push(value);
  document.body.setAttribute("data-animation-frame-calls", calls.join("|"));
}

onerror = function (_message, _source, _line, _column, error) {
  record(`error:${error.message}`);
  return true;
};

const cancelled = window.requestAnimationFrame(() => record("cancelled"));
window.cancelAnimationFrame(cancelled);
window.requestAnimationFrame(function (timestamp) {
  record(`first:${timestamp}:${this === window}`);
  queueMicrotask(() => record("microtask"));
  window.requestAnimationFrame((nextTimestamp) =>
    record(`next:${nextTimestamp}`),
  );
  throw new Error("frame failure");
});
window.requestAnimationFrame((timestamp) => record(`second:${timestamp}`));
