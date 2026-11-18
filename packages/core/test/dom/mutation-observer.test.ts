import { describe, expect, it } from "vitest";

import { Document, MutationObserver } from "../public-test-api.js";

describe("MutationObserver", () => {
  it("normalizes observation options and rejects contradictory options", () => {
    const document = new Document();
    const target = document.createElement("div");
    const observer = new MutationObserver(() => undefined);

    observer.observe(target, { attributeOldValue: true });
    target.setAttribute("data-value", "first");
    expect(observer.takeRecords()).toHaveLength(1);

    observer.observe(target, { characterDataOldValue: true });
    expect(() => {
      observer.observe(target, { attributes: false, attributeOldValue: true });
    }).toThrow(TypeError);
    expect(() => {
      observer.observe(target, {
        characterData: false,
        characterDataOldValue: true,
      });
    }).toThrow(TypeError);
    expect(() => {
      observer.observe(target, {});
    }).toThrow(TypeError);
  });

  it("queues filtered attribute records with observer-specific old values", () => {
    const document = new Document();
    const root = document.createElement("main");
    const target = document.createElement("div");
    root.append(target);
    target.setAttribute("data-kept", "before");

    const withOldValue = new MutationObserver(() => undefined);
    const withoutOldValue = new MutationObserver(() => undefined);
    withOldValue.observe(root, {
      attributes: true,
      attributeOldValue: true,
      attributeFilter: ["data-kept"],
      subtree: true,
    });
    withoutOldValue.observe(target, { attributes: true });

    target.setAttribute("data-ignored", "value");
    target.setAttribute("data-kept", "after");

    const filtered = withOldValue.takeRecords();
    expect(filtered).toHaveLength(1);
    expect(filtered[0]).toMatchObject({
      type: "attributes",
      target,
      attributeName: "data-kept",
      attributeNamespace: null,
      oldValue: "before",
      previousSibling: null,
      nextSibling: null,
    });
    expect(Array.from(filtered[0]?.addedNodes ?? [])).toEqual([]);
    expect(Array.from(filtered[0]?.removedNodes ?? [])).toEqual([]);

    const unfiltered = withoutOldValue.takeRecords();
    expect(unfiltered).toHaveLength(2);
    expect(unfiltered.map((record) => record.attributeName)).toEqual([
      "data-ignored",
      "data-kept",
    ]);
    expect(unfiltered.map((record) => record.oldValue)).toEqual([null, null]);
  });

  it("queues character data records and observes removed subtrees", async () => {
    const document = new Document();
    const root = document.createElement("main");
    const target = document.createElement("span");
    const text = document.createTextNode("before");
    target.append(text);
    root.append(target);
    const observer = new MutationObserver(() => undefined);
    observer.observe(root, {
      childList: true,
      characterData: true,
      characterDataOldValue: true,
      subtree: true,
    });

    target.remove();
    text.data = "during";

    const records = observer.takeRecords();
    expect(records).toHaveLength(2);
    expect(records[1]).toMatchObject({
      type: "characterData",
      target: text,
      oldValue: "before",
      attributeName: null,
      attributeNamespace: null,
    });
    await Promise.resolve();

    text.data = "after";
    expect(observer.takeRecords()).toHaveLength(0);
  });

  it("notifies observers in creation order", async () => {
    const document = new Document();
    const firstTarget = document.createElement("first");
    const secondTarget = document.createElement("second");
    const order: string[] = [];
    const first = new MutationObserver(() => order.push("first"));
    const second = new MutationObserver(() => order.push("second"));
    first.observe(firstTarget, { attributes: true });
    second.observe(secondTarget, { attributes: true });

    secondTarget.setAttribute("data-value", "second");
    firstTarget.setAttribute("data-value", "first");
    await Promise.resolve();

    expect(order).toEqual(["first", "second"]);
  });

  it("removes transient registrations when observe updates a target", () => {
    const document = new Document();
    const root = document.createElement("root");
    const child = document.createElement("child");
    root.append(child);
    const observer = new MutationObserver(() => undefined);
    observer.observe(root, { attributes: true, subtree: true });

    child.remove();
    observer.observe(root, { attributes: true, subtree: true });
    child.setAttribute("data-value", "after-removal");

    expect(observer.takeRecords()).toHaveLength(0);
  });

  it("queues one combined record when replacing all children", () => {
    const document = new Document();
    const parent = document.createElement("main");
    const first = document.createElement("first");
    const retained = document.createElement("retained");
    const last = document.createElement("last");
    parent.append(first, retained, last);
    const observer = new MutationObserver(() => undefined);
    observer.observe(parent, { childList: true });

    parent.replaceChildren(retained);

    const retainedRecords = observer.takeRecords();
    expect(retainedRecords).toHaveLength(1);
    expect(retainedRecords[0]).toMatchObject({
      target: parent,
      previousSibling: null,
      nextSibling: null,
    });
    expect(Array.from(retainedRecords[0]?.addedNodes ?? [])).toEqual([
      retained,
    ]);
    expect(Array.from(retainedRecords[0]?.removedNodes ?? [])).toEqual([
      first,
      retained,
      last,
    ]);

    const source = document.createElement("source");
    const moved = document.createElement("moved");
    source.append(moved);
    const replaced = document.createElement("replaced");
    parent.replaceChildren(replaced);
    observer.takeRecords();
    observer.observe(source, { childList: true });

    parent.replaceChildren(moved);

    const movedRecords = observer.takeRecords();
    expect(movedRecords).toHaveLength(2);
    expect(movedRecords[0]).toMatchObject({
      target: source,
      previousSibling: null,
      nextSibling: null,
    });
    expect(Array.from(movedRecords[0]?.addedNodes ?? [])).toEqual([]);
    expect(Array.from(movedRecords[0]?.removedNodes ?? [])).toEqual([moved]);
    expect(movedRecords[1]).toMatchObject({
      target: parent,
      previousSibling: null,
      nextSibling: null,
    });
    expect(Array.from(movedRecords[1]?.addedNodes ?? [])).toEqual([moved]);
    expect(Array.from(movedRecords[1]?.removedNodes ?? [])).toEqual([replaced]);

    parent.replaceChildren();

    const removalRecords = observer.takeRecords();
    expect(removalRecords).toHaveLength(1);
    expect(Array.from(removalRecords[0]?.addedNodes ?? [])).toEqual([]);
    expect(Array.from(removalRecords[0]?.removedNodes ?? [])).toEqual([moved]);
  });

  it("queues replacement mutation records in replace algorithm order", () => {
    const document = new Document();

    const parent = document.createElement("main");
    const before = document.createElement("before");
    const replaced = document.createElement("replaced");
    const after = document.createElement("after");
    const replacement = document.createElement("replacement");
    parent.append(before, replaced, after);
    const observer = new MutationObserver(() => undefined);
    observer.observe(parent, { childList: true });

    parent.replaceChild(replacement, replaced);

    const replacementRecords = observer.takeRecords();
    expect(replacementRecords).toHaveLength(1);
    expect(replacementRecords[0]).toMatchObject({
      target: parent,
      previousSibling: before,
      nextSibling: after,
    });
    expect(Array.from(replacementRecords[0]?.addedNodes ?? [])).toEqual([
      replacement,
    ]);
    expect(Array.from(replacementRecords[0]?.removedNodes ?? [])).toEqual([
      replaced,
    ]);

    const movingParent = document.createElement("section");
    const first = document.createElement("first");
    const last = document.createElement("last");
    movingParent.append(first, last);
    observer.observe(movingParent, { childList: true });

    movingParent.replaceChild(last, first);

    const movingRecords = observer.takeRecords();
    expect(movingRecords).toHaveLength(2);
    expect(movingRecords[0]).toMatchObject({
      target: movingParent,
      previousSibling: first,
      nextSibling: null,
    });
    expect(Array.from(movingRecords[0]?.addedNodes ?? [])).toEqual([]);
    expect(Array.from(movingRecords[0]?.removedNodes ?? [])).toEqual([last]);
    expect(movingRecords[1]).toMatchObject({
      target: movingParent,
      previousSibling: null,
      nextSibling: null,
    });
    expect(Array.from(movingRecords[1]?.addedNodes ?? [])).toEqual([last]);
    expect(Array.from(movingRecords[1]?.removedNodes ?? [])).toEqual([first]);

    const selfParent = document.createElement("article");
    const self = document.createElement("self");
    selfParent.append(self);
    observer.observe(selfParent, { childList: true });

    selfParent.replaceChild(self, self);

    const selfRecords = observer.takeRecords();
    expect(selfRecords).toHaveLength(2);
    expect(Array.from(selfRecords[0]?.addedNodes ?? [])).toEqual([]);
    expect(Array.from(selfRecords[0]?.removedNodes ?? [])).toEqual([self]);
    expect(Array.from(selfRecords[1]?.addedNodes ?? [])).toEqual([self]);
    expect(Array.from(selfRecords[1]?.removedNodes ?? [])).toEqual([]);
  });

  it("queues one removal and insertion record for a document fragment", () => {
    const document = new Document();
    const parent = document.createElement("main");
    const before = document.createElement("before");
    const after = document.createElement("after");
    const fragment = document.createDocumentFragment();
    const first = document.createElement("first");
    const second = document.createElement("second");
    parent.append(before, after);
    fragment.append(first, second);

    const observer = new MutationObserver(() => undefined);
    observer.observe(fragment, { childList: true });
    observer.observe(parent, { childList: true });

    parent.insertBefore(fragment, after);

    const records = observer.takeRecords();
    expect(records).toHaveLength(2);
    expect(records[0]).toMatchObject({
      target: fragment,
      previousSibling: null,
      nextSibling: null,
    });
    expect(Array.from(records[0]?.addedNodes ?? [])).toEqual([]);
    expect(Array.from(records[0]?.removedNodes ?? [])).toEqual([first, second]);
    expect(records[1]).toMatchObject({
      target: parent,
      previousSibling: before,
      nextSibling: after,
    });
    expect(Array.from(records[1]?.addedNodes ?? [])).toEqual([first, second]);
    expect(Array.from(records[1]?.removedNodes ?? [])).toEqual([]);
    expect(fragment.childNodes).toHaveLength(0);
    expect(Array.from(parent.childNodes)).toEqual([
      before,
      first,
      second,
      after,
    ]);
  });

  it("queues removal and insertion records for an atomic move", async () => {
    const document = new Document();
    const root = document.createElement("div");
    const oldParent = document.createElement("section");
    const newParent = document.createElement("main");
    const target = document.createElement("span");
    document.append(root);
    root.append(oldParent, newParent);
    oldParent.append(target);

    const delivered = new Promise<readonly unknown[]>((resolve) => {
      const observer = new MutationObserver((records) => {
        resolve(records);
      });
      observer.observe(root, { childList: true, subtree: true });
      newParent.moveBefore(target, null);
    });

    const records = await delivered;
    expect(records).toHaveLength(2);
    expect(records[0]).toMatchObject({
      target: oldParent,
      previousSibling: null,
      nextSibling: null,
    });
    expect(records[1]).toMatchObject({
      target: newParent,
      previousSibling: null,
      nextSibling: null,
    });
  });

  it("observes a removed subtree only until observer notification", async () => {
    const document = new Document();
    const root = document.createElement("div");
    const oldParent = document.createElement("section");
    const newParent = document.createElement("main");
    const target = document.createElement("span");
    document.append(root);
    root.append(oldParent, newParent);
    oldParent.append(target);

    const observer = new MutationObserver(() => undefined);
    observer.observe(oldParent, { childList: true, subtree: true });
    newParent.moveBefore(target, null);
    target.append(document.createElement("b"));

    expect(observer.takeRecords()).toHaveLength(2);
    await Promise.resolve();

    target.append(document.createElement("i"));
    expect(observer.takeRecords()).toHaveLength(0);
  });
});
