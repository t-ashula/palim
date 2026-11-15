let prototypeRead = false;
const constructor = new Proxy(function () {}, {
  get(target, property) {
    if (property === "prototype") prototypeRead = true;
    return Reflect.get(target, property);
  },
});
for (const extendedName of ["x-other", "unknown-built-in"]) {
  try {
    customElements.define(`x-extended-${extendedName}`, constructor, {
      extends: extendedName,
    });
    throw new Error("invalid extends accepted");
  } catch (error) {
    if (error.name !== "NotSupportedError") throw error;
  }
}
if (prototypeRead) {
  throw new Error("prototype read before extends validation");
}
