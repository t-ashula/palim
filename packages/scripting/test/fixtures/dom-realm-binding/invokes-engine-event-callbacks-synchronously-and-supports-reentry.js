const target = testDocument.getElementById("target");
let calls = 0;
target.addEventListener("activate", function (event) {
  calls += 1;
  if (this !== target || event.currentTarget !== target) {
    throw new Error("Event callback receiver was not preserved");
  }
  if (calls === 1) {
    target.dispatchEvent(new Event("activate"));
  }
  target.setAttribute("data-calls", calls);
});
target.dispatchEvent(new Event("activate"));
