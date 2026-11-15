class WrongInterface extends HTMLElement {}

let prototypeGets = 0;
const constructor = new Proxy(WrongInterface, {
  get(target, property, receiver) {
    if (property === "prototype") {
      prototypeGets += 1;
    }
    return Reflect.get(target, property, receiver);
  },
});

customElements.define("wrong-interface", constructor, { extends: "button" });
prototypeGets = 0;

let threw = false;
try {
  new constructor();
} catch (error) {
  threw = error instanceof TypeError;
}
if (!threw) {
  throw new Error("an HTMLElement subclass constructed a button definition");
}
if (prototypeGets !== 0) {
  throw new Error("NewTarget.prototype was read before interface validation");
}
