const writeTarget = document.querySelector("#write-target");
const writeWriter = writeTarget
  .streamHTMLUnsafe({ runScripts: true })
  .getWriter();
window.currentStreamingWriter = writeWriter;
writeWriter.write(
  "<p id='a'>a</p>" +
    "<script>" +
    "document.body.setAttribute('data-streaming-write-at-script', " +
    "Array.from(document.querySelector('#write-target').querySelectorAll('[id]'), element => element.id).join(','));" +
    "window.currentStreamingWriter.write('<p id=\"c\">c</p>');" +
    "window.currentStreamingWriter.close();" +
    "</" +
    "script>" +
    "<p id='b'>b</p>",
);
document.body.setAttribute(
  "data-streaming-write-after",
  Array.from(
    writeTarget.querySelectorAll("[id]"),
    (element) => element.id,
  ).join(","),
);

const abortTarget = document.querySelector("#abort-target");
const abortWriter = abortTarget
  .streamHTMLUnsafe({ runScripts: true })
  .getWriter();
window.currentStreamingWriter = abortWriter;
abortWriter.write(
  "<p id='a'>a</p>" +
    "<script>window.currentStreamingWriter.abort('aborted');</" +
    "script>" +
    "<p id='b'>b</p><div id='c'><p id='d'>d</p>",
);
document.body.setAttribute(
  "data-streaming-abort-after",
  Array.from(
    abortTarget.querySelectorAll("[id]"),
    (element) => element.id,
  ).join(","),
);
delete window.currentStreamingWriter;
