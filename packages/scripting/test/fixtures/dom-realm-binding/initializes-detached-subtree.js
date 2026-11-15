const document = new Document();
const root = document.createElement("div");
const child = document.createElement("span");
root.append(child);
const registry = new CustomElementRegistry();
registry.initialize(root);
if (root.customElementRegistry !== registry) {
  throw new Error("root registry missing");
}
if (child.customElementRegistry !== registry) {
  throw new Error("child registry missing");
}
