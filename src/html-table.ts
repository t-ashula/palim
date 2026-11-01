import { Element } from "./dom.js";
import { DOMException } from "./dom-exception.js";
import { HTML_NAMESPACE } from "./namespaces.js";

type CreatedTableElementName = "tbody" | "tr" | "td";
type CreateTableElement = (localName: CreatedTableElementName) => Element;

export function tableCaption(table: Element): Element | null {
  return firstChildWithName(table, "caption");
}

export function tableHead(table: Element): Element | null {
  return firstChildWithName(table, "thead");
}

export function tableFoot(table: Element): Element | null {
  return firstChildWithName(table, "tfoot");
}

export function tableBodies(table: Element): Element[] {
  return childElements(table).filter((child) => hasName(child, "tbody"));
}

export function tableRows(table: Element): Element[] {
  const headRows: Element[] = [];
  const bodyRows: Element[] = [];
  const footRows: Element[] = [];
  for (const child of childElements(table)) {
    if (hasName(child, "thead")) {
      headRows.push(...tableSectionRows(child));
    } else if (hasName(child, "tbody")) {
      bodyRows.push(...tableSectionRows(child));
    } else if (hasName(child, "tfoot")) {
      footRows.push(...tableSectionRows(child));
    } else if (hasName(child, "tr")) {
      bodyRows.push(child);
    }
  }
  return [...headRows, ...bodyRows, ...footRows];
}

export function tableSectionRows(section: Element): Element[] {
  return childElements(section).filter((child) => hasName(child, "tr"));
}

export function tableRowCells(row: Element): Element[] {
  return childElements(row).filter(
    (child) => hasName(child, "td") || hasName(child, "th"),
  );
}

export function placeTableCaption(table: Element, caption: Element): void {
  table.insertBefore(caption, table.firstChild);
}

export function placeTableHead(table: Element, head: Element): void {
  const reference = childElements(table).find(
    (child) => !hasName(child, "caption") && !hasName(child, "colgroup"),
  );
  table.insertBefore(head, reference ?? null);
}

export function placeTableFoot(table: Element, foot: Element): void {
  table.appendChild(foot);
}

export function placeTableBody(table: Element, body: Element): void {
  const lastBody = tableBodies(table).at(-1);
  table.insertBefore(body, lastBody?.nextSibling ?? null);
}

export function insertTableRow(
  table: Element,
  index: number,
  create: CreateTableElement,
): Element {
  const rows = tableRows(table);
  const position = insertionPosition(index, rows.length);
  const row = create("tr");
  if (rows.length === 0) {
    const bodies = tableBodies(table);
    const body = bodies.at(-1);
    if (body !== undefined) {
      body.appendChild(row);
    } else {
      const createdBody = create("tbody");
      createdBody.appendChild(row);
      table.appendChild(createdBody);
    }
    return row;
  }
  const reference = rows[position];
  if (reference !== undefined) {
    const parent = reference.parentElement;
    if (parent === null) {
      throw new DOMException("The row has no parent", "InvalidStateError");
    }
    parent.insertBefore(row, reference);
    return row;
  }
  const parent = rows.at(-1)?.parentElement;
  if (parent === null || parent === undefined) {
    throw new DOMException("The row has no parent", "InvalidStateError");
  }
  parent.appendChild(row);
  return row;
}

export function insertTableSectionRow(
  section: Element,
  index: number,
  create: CreateTableElement,
): Element {
  const rows = tableSectionRows(section);
  const position = insertionPosition(index, rows.length);
  const row = create("tr");
  section.insertBefore(row, rows[position] ?? null);
  return row;
}

export function insertTableRowCell(
  row: Element,
  index: number,
  create: CreateTableElement,
): Element {
  const cells = tableRowCells(row);
  const position = insertionPosition(index, cells.length);
  const cell = create("td");
  row.insertBefore(cell, cells[position] ?? null);
  return cell;
}

export function deleteTableItem(
  items: readonly Element[],
  index: number,
): void {
  if (index < -1 || index >= items.length) {
    throw new DOMException(
      "The index is outside the permitted range",
      "IndexSizeError",
    );
  }
  const item = index === -1 ? items.at(-1) : items[index];
  item?.remove();
}

function insertionPosition(index: number, length: number): number {
  if (index < -1 || index > length) {
    throw new DOMException(
      "The index is outside the permitted range",
      "IndexSizeError",
    );
  }
  return index === -1 ? length : index;
}

function firstChildWithName(
  element: Element,
  localName: string,
): Element | null {
  return (
    childElements(element).find((child) => hasName(child, localName)) ?? null
  );
}

function childElements(element: Element): Element[] {
  return Array.from(element.childNodes).filter(
    (child): child is Element => child instanceof Element,
  );
}

function hasName(element: Element, localName: string): boolean {
  return (
    element.namespaceURI === HTML_NAMESPACE && element.localName === localName
  );
}
