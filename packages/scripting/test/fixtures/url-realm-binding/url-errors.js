for (const operation of [
  () => new URL("http://["),
  () => {
    const url = new URL("https://example.test/");
    url.href = "./relative";
  },
  () => URL.prototype.toString.call({}),
  () => URLSearchParams.prototype.append.call({}, "name", "value"),
  () => new URLSearchParams([["only-one"]]),
]) {
  let error;
  try {
    operation();
  } catch (caught) {
    error = caught;
  }
  if (!(error instanceof TypeError)) {
    throw new Error("operation did not throw a realm TypeError");
  }
}
