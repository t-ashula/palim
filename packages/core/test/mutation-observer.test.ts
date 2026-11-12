import { describe, expect, it } from "vitest";

import { Document, MutationObserver } from "./public-test-api.js";

describe("MutationObserver", () => {
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
