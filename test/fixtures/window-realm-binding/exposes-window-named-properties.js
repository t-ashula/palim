const single = document.createElement("div");
single.setAttribute("id", "singleNamedProperty");
document.body.appendChild(single);

if (
  window.singleNamedProperty !== single ||
  singleNamedProperty !== single ||
  !("singleNamedProperty" in window)
) {
  throw new Error("an element id was not exposed as a Window named property");
}

const namedImage = document.createElement("img");
namedImage.setAttribute("name", "imageNamedProperty");
document.body.appendChild(namedImage);
const namedDiv = document.createElement("div");
namedDiv.setAttribute("name", "ignoredNamedProperty");
document.body.appendChild(namedDiv);
if (
  window.imageNamedProperty !== namedImage ||
  "ignoredNamedProperty" in window
) {
  throw new Error("name-based Window named properties are invalid");
}

const namespaced = document.createElement("img");
namespaced.setAttributeNS("urn:example", "id", "namespacedIdProperty");
namespaced.setAttributeNS("urn:example", "name", "namespacedNameProperty");
document.body.appendChild(namespaced);
if ("namespacedIdProperty" in window || "namespacedNameProperty" in window) {
  throw new Error("namespaced attributes became Window named properties");
}

const numeric = document.createElement("div");
numeric.setAttribute("id", "4");
document.body.appendChild(numeric);
if (window[4] !== numeric || !(4 in window)) {
  throw new Error("a numeric element id was not exposed");
}

const first = document.createElement("div");
first.setAttribute("id", "multipleNamedProperty");
const second = document.createElement("span");
second.setAttribute("id", "multipleNamedProperty");
document.body.appendChild(first);
document.body.appendChild(second);
const collection = window.multipleNamedProperty;
if (
  !(collection instanceof HTMLCollection) ||
  collection.length !== 2 ||
  collection[0] !== first ||
  collection[1] !== second
) {
  throw new Error("multiple Window named property matches are invalid");
}
first.remove();
if (collection.length !== 1 || collection[0] !== second) {
  throw new Error("a Window named property collection is not live");
}

single.setAttribute("id", "changedNamedProperty");
if ("singleNamedProperty" in window || window.changedNamedProperty !== single) {
  throw new Error("Window named properties did not follow an id change");
}
single.remove();
if ("changedNamedProperty" in window) {
  throw new Error("a removed element remained a Window named property");
}

window.shadowedNamedProperty = "user value";
const shadowed = document.createElement("div");
shadowed.setAttribute("id", "shadowedNamedProperty");
document.body.appendChild(shadowed);
if (window.shadowedNamedProperty !== "user value") {
  throw new Error("a Window named property shadowed an existing property");
}

const namedPropertiesObject = Object.getPrototypeOf(Window.prototype);
const descriptor = Object.getOwnPropertyDescriptor(
  namedPropertiesObject,
  "imageNamedProperty",
);
if (
  descriptor.value !== namedImage ||
  !descriptor.writable ||
  descriptor.enumerable ||
  !descriptor.configurable
) {
  throw new Error("the Window named property descriptor is invalid");
}
