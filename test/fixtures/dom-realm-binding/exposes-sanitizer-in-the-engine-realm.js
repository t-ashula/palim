const sanitizer = new Sanitizer({
  elements: [
    { name: "html" },
    { name: "body" },
    { name: "div", attributes: ["title"] },
  ],
  comments: false,
});

if (!(sanitizer instanceof Sanitizer)) {
  throw new Error("Sanitizer constructor is not exposed");
}
const config = sanitizer.get();
if (
  config.elements[2].name !== "html" ||
  config.elements[0].name !== "body" ||
  config.elements[1].attributes[0].name !== "title"
) {
  throw new Error("Sanitizer.get() did not return a sorted canonical config");
}
config.elements.length = 0;
if (sanitizer.get().elements.length !== 3) {
  throw new Error("Sanitizer.get() exposed mutable internal state");
}

const parsed = Document.parseHTMLUnsafe(
  '<div title="kept" class="removed">a<!--comment-->b</div>',
  { sanitizer },
);
const div = parsed.querySelector("div");
if (
  div === null ||
  div.getAttribute("title") !== "kept" ||
  div.hasAttribute("class") ||
  div.textContent !== "ab"
) {
  throw new Error(
    "Sanitizer instance was not used by Document.parseHTMLUnsafe",
  );
}

if (!sanitizer.removeElement("div") || sanitizer.removeElement("div")) {
  throw new Error("Sanitizer modifier return values are invalid");
}
