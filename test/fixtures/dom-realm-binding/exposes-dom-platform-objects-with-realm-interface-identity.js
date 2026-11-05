if (!(testDocument instanceof Document)) {
  throw new Error("testDocument is not a Document");
}
const first = testDocument.querySelector("main");
const second = testDocument.getElementById("target");
if (!(first instanceof Element) || first !== second) {
  throw new Error("DOM platform object identity was not preserved");
}
first.setAttribute("data-runtime", "palim");
first.innerHTML = "<span>connected</span>";
