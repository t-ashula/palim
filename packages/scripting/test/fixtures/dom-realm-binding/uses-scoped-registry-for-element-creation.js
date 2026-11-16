const registry = new CustomElementRegistry();

class ScopedElement extends HTMLElement {}

registry.define("x-scoped-creation", ScopedElement);

const created = testDocument.createElement("x-scoped-creation", {
  customElementRegistry: registry,
});
if (!(created instanceof ScopedElement)) {
  throw new Error("createElement did not use the scoped registry");
}
if (created.customElementRegistry !== registry) {
  throw new Error("createElement did not retain the scoped registry");
}

const namespaced = testDocument.createElementNS(
  "http://www.w3.org/1999/xhtml",
  "x-scoped-creation",
  { customElementRegistry: registry },
);
if (!(namespaced instanceof ScopedElement)) {
  throw new Error("createElementNS did not use the scoped registry");
}
if (namespaced.customElementRegistry !== registry) {
  throw new Error("createElementNS did not retain the scoped registry");
}

const withoutRegistry = testDocument.createElement("x-scoped-creation", {
  customElementRegistry: null,
});
if (withoutRegistry instanceof ScopedElement) {
  throw new Error("a null registry used the scoped definition");
}
if (withoutRegistry.customElementRegistry !== null) {
  throw new Error("createElement did not retain the null registry");
}

class ShadowElement extends HTMLElement {}

registry.define("x-shadow-creation", ShadowElement);
const host = testDocument.createElement("div");
const shadow = host.attachShadow({
  mode: "open",
  customElementRegistry: registry,
});
shadow.innerHTML = "<x-shadow-creation></x-shadow-creation>";
const shadowElement = shadow.firstElementChild;
if (!(shadowElement instanceof ShadowElement)) {
  throw new Error("ShadowRoot.innerHTML did not use the scoped registry");
}
if (shadowElement.customElementRegistry !== registry) {
  throw new Error("a shadow child did not retain the scoped registry");
}

const lateRegistry = new CustomElementRegistry();
const lateHost = testDocument.createElement("div");
const lateShadow = lateHost.attachShadow({
  mode: "open",
  customElementRegistry: lateRegistry,
});
lateShadow.innerHTML = "<x-late-definition></x-late-definition>";
testDocument.body.append(lateHost);

class LateElement extends HTMLElement {}

lateRegistry.define("x-late-definition", LateElement);
if (!(lateShadow.firstElementChild instanceof LateElement)) {
  throw new Error("define did not upgrade a connected scoped candidate");
}
