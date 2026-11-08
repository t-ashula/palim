const collection = testDocument.getElementsByClassName("text");
const table = testDocument.getElementsByTagName("table")[0];
if (collection.length !== 4 || table.tBodies !== table.tBodies) {
  throw new Error("missing table collection fixture");
}

const body = table.tBodies[0];
const row = body.rows[0];
const cell = row.cells[0];
if (
  !(body instanceof HTMLTableSectionElement) ||
  !(row instanceof HTMLTableRowElement) ||
  !(cell instanceof HTMLTableCellElement) ||
  body.rows !== body.rows ||
  row.cells !== row.cells
) {
  throw new Error("table collection accessors are invalid");
}

const newDiv = testDocument.createElement("div");
newDiv.setAttribute("class", "text");
newDiv.innerHTML = "text newDiv";
cell.appendChild(newDiv);

if (collection.length !== 5 || collection[4] !== newDiv) {
  throw new Error("table insertion did not update the live collection");
}
