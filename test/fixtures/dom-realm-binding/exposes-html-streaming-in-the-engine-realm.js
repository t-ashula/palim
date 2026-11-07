const target = testDocument.querySelector("main");
const stream = target.streamHTMLUnsafe();
if (!(stream instanceof WritableStream) || stream.locked) {
  throw new Error("HTML streaming did not return a realm WritableStream");
}
if (target.innerHTML !== "") {
  throw new Error("streamHTMLUnsafe did not remove children immediately");
}

const writer = stream.getWriter();
if (!stream.locked || !(writer instanceof WritableStreamDefaultWriter)) {
  throw new Error("WritableStreamDefaultWriter was not exposed in the realm");
}
if (writer.desiredSize !== 1) {
  throw new Error("WritableStreamDefaultWriter.desiredSize is invalid");
}
writer.write("<sp");
writer.write("an>A&l");
writer.write("t;B</span>");
writer.close();
if (writer.desiredSize !== 0) {
  throw new Error("Closing the writer did not update desiredSize");
}
if (target.innerHTML !== "<span>A&lt;B</span>") {
  throw new Error("stream writes did not preserve parser state");
}
writer.releaseLock();
if (stream.locked) {
  throw new Error("releaseLock did not unlock the stream");
}

const template = testDocument.createElement("template");
template.innerHTML = "<b>child</b>";
if (
  template.content.firstElementChild === null ||
  template.content.lastElementChild === null ||
  template.content.childElementCount !== 1
) {
  throw new Error("DocumentFragment ParentNode attributes are unavailable");
}
