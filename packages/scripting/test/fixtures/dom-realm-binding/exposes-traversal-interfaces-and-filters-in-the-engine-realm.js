const root = testDocument.createElement("main");
const text = testDocument.createTextNode("before");
const first = testDocument.createElement("section");
const second = testDocument.createElement("p");
const comment = testDocument.createComment("after");
root.appendChild(text);
root.appendChild(first);
root.appendChild(second);
root.appendChild(comment);
if (
  !(text instanceof Text) ||
  !(comment instanceof Comment) ||
  text.nodeValue !== "before" ||
  comment.nodeValue !== "after" ||
  first.previousSibling !== text ||
  first.nextSibling !== second
) {
  throw new Error("traversal node binding is invalid");
}

const iterator = testDocument.createNodeIterator(root, NodeFilter.SHOW_ELEMENT);
if (
  !(iterator instanceof NodeIterator) ||
  iterator.toString() !== "[object NodeIterator]" ||
  iterator.root !== root ||
  iterator.referenceNode !== root ||
  !iterator.pointerBeforeReferenceNode ||
  iterator.whatToShow !== NodeFilter.SHOW_ELEMENT ||
  iterator.filter !== null ||
  iterator.nextNode() !== root ||
  iterator.nextNode() !== first ||
  iterator.nextNode() !== second ||
  iterator.nextNode() !== null
) {
  throw new Error("NodeIterator binding is invalid");
}

let receiver;
let argument;
const filter = {
  acceptNode(node) {
    receiver = this;
    argument = node;
    return node === first ? NodeFilter.FILTER_SKIP : NodeFilter.FILTER_ACCEPT;
  },
};
const walker = testDocument.createTreeWalker(
  root,
  NodeFilter.SHOW_ELEMENT,
  filter,
);
if (
  !(walker instanceof TreeWalker) ||
  walker.toString() !== "[object TreeWalker]" ||
  walker.root !== root ||
  walker.currentNode !== root ||
  walker.whatToShow !== NodeFilter.SHOW_ELEMENT ||
  walker.filter !== filter ||
  walker.nextNode() !== second ||
  receiver !== filter ||
  argument !== second
) {
  throw new Error("TreeWalker binding is invalid");
}
walker.currentNode = first;
if (walker.currentNode !== first || walker.parentNode() !== root) {
  throw new Error("TreeWalker currentNode is invalid");
}

const marker = {};
const throwing = testDocument.createTreeWalker(root, undefined, () => {
  throw marker;
});
try {
  throwing.nextNode();
  throw new Error("throwing filter was accepted");
} catch (error) {
  if (error !== marker) {
    throw error;
  }
}

let recursive;
recursive = testDocument.createNodeIterator(root, undefined, () => {
  recursive.nextNode();
  return NodeFilter.FILTER_ACCEPT;
});
try {
  recursive.nextNode();
  throw new Error("recursive filter was accepted");
} catch (error) {
  if (
    !(error instanceof DOMException) ||
    error.name !== "InvalidStateError" ||
    error.code !== DOMException.INVALID_STATE_ERR
  ) {
    throw error;
  }
}

const xmlDocument = new Document();
const cdata = xmlDocument.createCDATASection("data");
const instruction = xmlDocument.createProcessingInstruction("pi", "data");
const doctype = testDocument.implementation.createDocumentType("root", "", "");
const foreignDocument = testDocument.implementation.createDocument(
  null,
  null,
  doctype,
);
const xhtmlDocument = testDocument.implementation.createDocument(
  "http://www.w3.org/1999/xhtml",
  "html",
  undefined,
);
const htmlDocument = testDocument.implementation.createHTMLDocument("");
if (
  !(cdata instanceof CDATASection) ||
  !(cdata instanceof Text) ||
  Object.getPrototypeOf(cdata) !== CDATASection.prototype ||
  Object.getPrototypeOf(CDATASection.prototype) !== Text.prototype ||
  cdata.nodeType !== Node.CDATA_SECTION_NODE ||
  instruction.nodeType !== Node.PROCESSING_INSTRUCTION_NODE ||
  !(foreignDocument instanceof XMLDocument) ||
  Object.getPrototypeOf(foreignDocument) !== XMLDocument.prototype ||
  foreignDocument.doctype !== doctype ||
  !(xhtmlDocument instanceof XMLDocument) ||
  xhtmlDocument.contentType !== "application/xhtml+xml" ||
  htmlDocument.head === null ||
  htmlDocument.body === null ||
  testDocument.implementation !== testDocument.implementation
) {
  throw new Error("document fixture APIs are invalid");
}
const unusualDoctype = testDocument.implementation.createDocumentType(
  "@name",
  "public",
  "system",
);
if (unusualDoctype.name !== "@name") {
  throw new Error("doctype name validation is invalid");
}
try {
  testDocument.implementation.createDocumentType("invalid name", "", "");
  throw new Error("invalid doctype name was accepted");
} catch (error) {
  if (
    !(error instanceof DOMException) ||
    error.name !== "InvalidCharacterError"
  ) {
    throw error;
  }
}
