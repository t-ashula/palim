import { describe, expect, it } from "vitest";

import { DOMParser } from "./public-test-api.js";
import type {
  HTMLElement,
  HTMLSlotElement,
} from "@palim/core/internal/html-elements.js";

describe("slot assignment", () => {
  it("updates named slot assignment across atomic moves", async () => {
    const document = new DOMParser().parseFromString("", "text/html");
    const host = document.createElement("div");
    const shadowRoot = host.attachShadow({ mode: "open" });
    const slot = document.createElement("slot") as HTMLSlotElement;
    const slottable = document.createElement("p") as HTMLElement;
    slot.name = "content";
    slottable.slot = "content";
    shadowRoot.append(slot);
    document.body?.append(host, slottable);

    const changed = new Promise<void>((resolve) => {
      slot.addEventListener(
        "slotchange",
        () => {
          resolve();
        },
        { once: true },
      );
    });
    host.moveBefore(slottable, null);

    expect(slot.assignedNodes()).toEqual([slottable]);
    await changed;

    document.body?.moveBefore(slottable, null);
    expect(slot.assignedNodes()).toEqual([]);
  });

  it("signals fallback content moved into a slot", async () => {
    const document = new DOMParser().parseFromString("", "text/html");
    const host = document.createElement("div");
    const shadowRoot = host.attachShadow({ mode: "open" });
    const slot = document.createElement("slot") as HTMLSlotElement;
    const fallback = document.createElement("p");
    shadowRoot.append(slot, fallback);

    const changed = new Promise<void>((resolve) => {
      slot.addEventListener(
        "slotchange",
        () => {
          resolve();
        },
        { once: true },
      );
    });
    slot.moveBefore(fallback, null);

    await changed;
    expect(slot.assignedNodes()).toEqual([]);
    expect(slot.firstChild).toBe(fallback);
  });
});
