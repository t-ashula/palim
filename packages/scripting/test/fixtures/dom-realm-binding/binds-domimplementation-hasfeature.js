const implementation = testDocument.implementation;

if (!(implementation instanceof DOMImplementation)) {
  throw new Error("implementation does not use DOMImplementation");
}
if (implementation !== testDocument.implementation) {
  throw new Error("implementation identity changed");
}
if (implementation.hasFeature() !== true) {
  throw new Error("hasFeature did not return true");
}
if (DOMImplementation.prototype.hasFeature.length !== 0) {
  throw new Error("hasFeature length is not zero");
}

let converted = false;
if (
  implementation.hasFeature({
    toString() {
      converted = true;
      return "Core";
    },
  }) !== true ||
  converted
) {
  throw new Error("hasFeature converted an ignored argument");
}

let incompatibleReceiverThrew = false;
try {
  DOMImplementation.prototype.hasFeature.call({});
} catch (error) {
  incompatibleReceiverThrew = error instanceof TypeError;
}
if (!incompatibleReceiverThrew) {
  throw new Error("hasFeature accepted an incompatible receiver");
}
