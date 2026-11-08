import { describe, expect, it } from "vitest";

import { Document, MutationObserver } from "../packages/palim/src/index.js";

describe("MutationObserver", () => {
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
