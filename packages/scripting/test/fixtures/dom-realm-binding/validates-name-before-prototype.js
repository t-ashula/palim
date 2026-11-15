let prototypeRead = false;
const constructor = new Proxy(function () {}, {
  get(target, property) {
    if (property === "prototype") {
      prototypeRead = true;
    }
    return Reflect.get(target, property);
  },
});
try {
  customElements.define("invalid", constructor);
} catch (error) {
  if (error.name !== "SyntaxError") {
    throw error;
  }
}
if (prototypeRead) {
  throw new Error("prototype was read");
}
