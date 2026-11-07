const first = testDocument.querySelector("form");
const button = testDocument.querySelector("button");
if (button.form !== first) {
  throw new Error("button did not expose its initial form owner");
}

const second = testDocument.createElement("form");
second.id = "form1";
testDocument.body.append(second);
if (button.form !== first) {
  throw new Error("later duplicate form replaced the initial form owner");
}

testDocument.body.moveBefore(second, first);
if (button.form !== second) {
  throw new Error("atomic move did not update the form owner by tree order");
}
