const registry = new CustomElementRegistry();
const pending = registry.whenDefined("x-later");
if (pending !== registry.whenDefined("x-later")) {
  throw new Error("pending promise changed");
}
class LaterElement extends HTMLElement {}
registry.define("x-later", LaterElement);
pending.then((constructor) => {
  if (constructor !== LaterElement) {
    throw new Error("wrong constructor");
  }
});
