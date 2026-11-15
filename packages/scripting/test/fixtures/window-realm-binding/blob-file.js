const source = new Uint8Array([65, 66, 67, 68]);
const view = new DataView(source.buffer, 1, 2);
const blob = new Blob(["x", view, source.buffer], { type: "Text/Plain" });
source[1] = 90;

if (!(blob instanceof Blob) || blob.size !== 7 || blob.type !== "text/plain") {
  throw new Error("Blob construction is invalid");
}
const slice = blob.slice(1, -1, "APPLICATION/OCTET-STREAM");
if (
  !(slice instanceof Blob) ||
  slice.size !== 5 ||
  slice.type !== "application/octet-stream"
) {
  throw new Error("Blob slicing is invalid");
}
if (
  !(blob.text() instanceof Promise) ||
  !(blob.arrayBuffer() instanceof Promise)
) {
  throw new Error("Blob asynchronous methods do not return realm Promises");
}

const file = new File([blob], "example.txt", {
  type: "Text/Plain",
  lastModified: 42,
});
if (
  !(file instanceof File) ||
  !(file instanceof Blob) ||
  file.name !== "example.txt" ||
  file.lastModified !== 42 ||
  file.webkitRelativePath !== "" ||
  file.type !== "text/plain"
) {
  throw new Error("File construction is invalid");
}

const data = new FormData();
data.append("same", file);
data.append("renamed", file, "renamed.txt");
data.set("blob", blob);
if (
  data.get("same") !== file ||
  !(data.get("renamed") instanceof File) ||
  data.get("renamed").name !== "renamed.txt" ||
  !(data.get("blob") instanceof File) ||
  data.get("blob").name !== "blob"
) {
  throw new Error("FormData binary entries are invalid");
}
if ([...data.values()][0] !== file || [...data.entries()][0][1] !== file) {
  throw new Error("FormData iterator File identity is invalid");
}
