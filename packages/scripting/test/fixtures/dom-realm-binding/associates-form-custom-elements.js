const form = testDocument.getElementById("form");
const fieldset = testDocument.getElementById("fieldset");
const inside = testDocument.getElementById("inside");
const external = testDocument.getElementById("external");

if (fieldset.elements.length !== 0 || form.elements.length !== 1) {
  throw new Error("undefined custom elements were listed form controls");
}

class FormControl extends HTMLElement {
  static formAssociated = true;

  constructor() {
    super();
    this.internals = this.attachInternals();
    this.formHistory = [];
    if (this === inside && fieldset.elements.length !== 0) {
      throw new Error("pre-customized element was listed during construction");
    }
  }

  formAssociatedCallback(owner) {
    this.formHistory.push(owner);
  }
}

customElements.define("x-control", FormControl);

if (
  fieldset.elements.length !== 1 ||
  fieldset.elements[0] !== inside ||
  form.elements.length !== 3 ||
  form.elements.namedItem("control") !== inside ||
  form.elements.namedItem("group") !== external ||
  inside.internals.form !== form ||
  external.internals.form !== form ||
  inside.formHistory.length !== 1 ||
  inside.formHistory[0] !== form ||
  external.formHistory.length !== 1 ||
  external.formHistory[0] !== form
) {
  throw new Error("form-associated custom elements were not associated");
}

inside.setAttribute("name", "renamed");
if (
  form.elements.namedItem("control") !== null ||
  form.elements.namedItem("renamed") !== inside
) {
  throw new Error("form collection did not reflect the name change");
}

external.removeAttribute("form");
if (
  form.elements.length !== 2 ||
  external.internals.form !== null ||
  external.formHistory.length !== 2 ||
  external.formHistory[1] !== null
) {
  throw new Error("form owner removal was not reflected");
}
