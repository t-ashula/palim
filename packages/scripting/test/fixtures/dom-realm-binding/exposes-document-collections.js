for (const name of ["forms", "images", "links", "scripts", "embeds"]) {
  if (!(testDocument[name] instanceof HTMLCollection)) {
    throw new Error(`document.${name} is not an HTMLCollection`);
  }
  if (testDocument[name] !== testDocument[name]) {
    throw new Error(`document.${name} does not preserve identity`);
  }
}
if (testDocument.plugins !== testDocument.embeds) {
  throw new Error("document.plugins is not the document.embeds collection");
}
if (testDocument.forms.form.id !== "form") {
  throw new Error("document.forms does not expose named properties");
}

const forms = testDocument.forms;
const form = testDocument.createElement("form");
testDocument.body.appendChild(form);
if (forms.length !== 2) {
  throw new Error("document.forms is not live");
}
form.remove();
if (forms.length !== 1) {
  throw new Error("document.forms did not observe removal");
}
