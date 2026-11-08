import { describe, expect, it } from "vitest";

import type { Document, Element } from "./public-test-api.js";
import {
  DOMParser,
  HTMLTableCaptionElement,
  HTMLTableCellElement,
  HTMLTableColElement,
  HTMLTableElement,
  HTMLTableRowElement,
  HTMLTableSectionElement,
} from "./public-test-api.js";
import { expectDOMException } from "./helper/assertions.js";

interface ElementInterface<T extends Element> {
  [Symbol.hasInstance](value: unknown): value is T;
}

function parse(input = "<table></table>"): Document {
  return new DOMParser().parseFromString(input, "text/html");
}

function create<T extends Element>(
  document: Document,
  localName: string,
  Interface: ElementInterface<T>,
): T {
  const element = document.createElement(localName);
  if (!(element instanceof Interface)) {
    throw new Error(`${localName} has an unexpected interface`);
  }
  return element;
}

function tableIn(document: Document): HTMLTableElement {
  const table = document.querySelector("table");
  if (!(table instanceof HTMLTableElement)) {
    throw new Error("missing table");
  }
  return table;
}

describe("HTML table mutation", () => {
  it("orders table rows independently of section tree order", () => {
    const document = parse();
    const table = tableIn(document);
    const foot = create(document, "tfoot", HTMLTableSectionElement);
    const footRow = create(document, "tr", HTMLTableRowElement);
    foot.appendChild(footRow);
    const body = create(document, "tbody", HTMLTableSectionElement);
    const bodyRow = create(document, "tr", HTMLTableRowElement);
    body.appendChild(bodyRow);
    const directRow = create(document, "tr", HTMLTableRowElement);
    const head = create(document, "thead", HTMLTableSectionElement);
    const headRow = create(document, "tr", HTMLTableRowElement);
    head.appendChild(headRow);
    table.appendChild(foot);
    table.appendChild(body);
    table.appendChild(directRow);
    table.appendChild(head);

    const rows = table.rows;
    expect(table.rows).toBe(rows);
    expect(Array.from(rows)).toEqual([headRow, bodyRow, directRow, footRow]);
    expect(headRow.rowIndex).toBe(0);
    expect(bodyRow.rowIndex).toBe(1);
    expect(directRow.rowIndex).toBe(2);
    expect(footRow.rowIndex).toBe(3);

    const secondHeadRow = create(document, "tr", HTMLTableRowElement);
    head.appendChild(secondHeadRow);
    expect(Array.from(rows)).toEqual([
      headRow,
      secondHeadRow,
      bodyRow,
      directRow,
      footRow,
    ]);
  });

  it("places caption, head, foot, and bodies at their table positions", () => {
    const document = parse(
      "<table>text<colgroup></colgroup><tbody></tbody><tfoot></tfoot></table>",
    );
    const table = tableIn(document);
    const colgroup = table.querySelector("colgroup");
    const firstBody = table.tBodies.item(0);
    const foot = table.tFoot;
    if (!(colgroup instanceof HTMLTableColElement)) {
      throw new Error("missing colgroup");
    }
    if (firstBody === null || foot === null) {
      throw new Error("missing table section");
    }

    const caption = table.createCaption();
    const head = table.createTHead();
    const secondBody = table.createTBody();

    expect(caption).toBeInstanceOf(HTMLTableCaptionElement);
    expect(table.firstChild).toBe(caption);
    expect(Array.from(table.children)).toEqual([
      caption,
      colgroup,
      head,
      firstBody,
      secondBody,
      foot,
    ]);

    const replacementFoot = create(document, "tfoot", HTMLTableSectionElement);
    table.tFoot = replacementFoot;
    expect(table.lastChild).toBe(replacementFoot);
  });

  it("uses the first caption, head, and foot child", () => {
    const document = parse();
    const table = tableIn(document);
    const firstCaption = create(document, "caption", HTMLTableCaptionElement);
    const secondCaption = create(document, "caption", HTMLTableCaptionElement);
    const firstHead = create(document, "thead", HTMLTableSectionElement);
    const secondHead = create(document, "thead", HTMLTableSectionElement);
    const firstFoot = create(document, "tfoot", HTMLTableSectionElement);
    const secondFoot = create(document, "tfoot", HTMLTableSectionElement);
    for (const child of [
      firstCaption,
      secondCaption,
      firstHead,
      secondHead,
      firstFoot,
      secondFoot,
    ]) {
      table.appendChild(child);
    }

    expect(table.createCaption()).toBe(firstCaption);
    expect(table.createTHead()).toBe(firstHead);
    expect(table.createTFoot()).toBe(firstFoot);

    table.deleteCaption();
    table.deleteTHead();
    table.deleteTFoot();
    expect(table.caption).toBe(secondCaption);
    expect(table.tHead).toBe(secondHead);
    expect(table.tFoot).toBe(secondFoot);

    const replacement = create(document, "caption", HTMLTableCaptionElement);
    table.caption = replacement;
    expect(table.firstChild).toBe(replacement);
    expect(secondCaption.parentNode).toBeNull();
    table.caption = null;
    expect(table.caption).toBeNull();
  });

  it("keeps table collections live and stable", () => {
    const document = parse();
    const table = tableIn(document);
    const bodies = table.tBodies;
    const rows = table.rows;
    const body = table.createTBody();
    const sectionRows = body.rows;
    const row = body.insertRow();
    const cells = row.cells;
    const cell = row.insertCell();

    expect(table.tBodies).toBe(bodies);
    expect(table.rows).toBe(rows);
    expect(body.rows).toBe(sectionRows);
    expect(row.cells).toBe(cells);
    expect(Array.from(bodies)).toEqual([body]);
    expect(Array.from(rows)).toEqual([row]);
    expect(Array.from(sectionRows)).toEqual([row]);
    expect(Array.from(cells)).toEqual([cell]);

    row.remove();
    expect(rows.length).toBe(0);
    expect(sectionRows.length).toBe(0);
  });

  it("validates section setters and inserts a head before table content", () => {
    const document = parse(
      "<table><caption></caption><colgroup></colgroup><tr></tr></table>",
    );
    const table = tableIn(document);
    const row = table.querySelector("tr");
    if (!(row instanceof HTMLTableRowElement)) {
      throw new Error("missing row");
    }

    const body = create(document, "tbody", HTMLTableSectionElement);
    expectDOMException(() => {
      table.tHead = body;
    }, "HierarchyRequestError");

    const head = create(document, "thead", HTMLTableSectionElement);
    table.tHead = head;
    const rowParent = row.parentElement;
    if (rowParent === null) {
      throw new Error("row has no parent");
    }
    expect(Array.from(table.children).indexOf(head)).toBe(
      Array.from(table.children).indexOf(rowParent) - 1,
    );
    expect(table.tHead).toBe(head);
  });

  it("inserts table rows using the logical rows collection", () => {
    const document = parse();
    const table = tableIn(document);

    const first = table.insertRow();
    expect(table.tBodies.length).toBe(1);
    expect(first.parentElement).toBe(table.tBodies.item(0));

    const head = table.createTHead();
    const headRow = head.insertRow();
    const beforeFirst = table.insertRow(0);
    expect(beforeFirst.parentElement).toBe(head);
    expect(Array.from(table.rows)).toEqual([beforeFirst, headRow, first]);

    const last = table.insertRow(-1);
    expect(last.parentElement).toBe(first.parentElement);
    expect(Array.from(table.rows)).toEqual([beforeFirst, headRow, first, last]);

    const emptyTable = create(document, "table", HTMLTableElement);
    const firstEmptyBody = create(document, "tbody", HTMLTableSectionElement);
    const lastEmptyBody = create(document, "tbody", HTMLTableSectionElement);
    emptyTable.appendChild(firstEmptyBody);
    emptyTable.appendChild(lastEmptyBody);
    expect(emptyTable.insertRow().parentElement).toBe(lastEmptyBody);
  });

  it("applies insertion and deletion index boundaries", () => {
    const document = parse();
    const table = tableIn(document);
    const section = create(document, "tbody", HTMLTableSectionElement);
    const row = create(document, "tr", HTMLTableRowElement);
    table.appendChild(section);
    section.appendChild(row);

    const cells = row.cells;
    const last = row.insertCell();
    const first = row.insertCell(0);
    expect(first).toBeInstanceOf(HTMLTableCellElement);
    expect(Array.from(cells)).toEqual([first, last]);
    expect(first.cellIndex).toBe(0);
    expect(last.cellIndex).toBe(1);

    row.deleteCell(-1);
    expect(Array.from(cells)).toEqual([first]);
    row.deleteCell(-1);
    row.deleteCell(-1);
    expect(cells.length).toBe(0);

    const original = row.insertCell();
    let inserted: HTMLTableCellElement | null = null;
    row.deleteCell({
      valueOf(): number {
        inserted = row.insertCell(0);
        return 1;
      },
    } as unknown as number);
    expect(original.parentNode).toBeNull();
    expect(Array.from(cells)).toEqual([inserted]);
    row.deleteCell(-1);

    section.deleteRow(-1);
    section.deleteRow(-1);
    table.deleteRow(-1);

    expectDOMException(() => row.insertCell(-2), "IndexSizeError");
    expectDOMException(() => row.insertCell(1), "IndexSizeError");
    expectDOMException(() => section.insertRow(-2), "IndexSizeError");
    expectDOMException(() => table.insertRow(1), "IndexSizeError");
    expectDOMException(() => {
      row.deleteCell(0);
    }, "IndexSizeError");
    expectDOMException(() => {
      section.deleteRow(0);
    }, "IndexSizeError");
    expectDOMException(() => {
      table.deleteRow(0);
    }, "IndexSizeError");

    expect(() => {
      (table.deleteRow as (index?: number) => void)();
    }).toThrow(TypeError);
    expect(() => {
      (section.deleteRow as (index?: number) => void)();
    }).toThrow(TypeError);
    expect(() => {
      (row.deleteCell as (index?: number) => void)();
    }).toThrow(TypeError);
  });
});
