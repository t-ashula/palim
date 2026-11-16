import { describe, expect, it } from "vitest";

import {
  abortControllerImplementation,
  eventImplementation,
  eventTargetImplementation,
  eventTargetInterface,
} from "../../src/dom/event-implementation.js";
import { AbortController, Event, EventTarget } from "../public-test-api.js";

describe("event implementations", () => {
  it("resolves EventTarget interfaces and implementations", () => {
    const target = new EventTarget();
    const implementation = eventTargetImplementation(target);

    expect(eventTargetInterface(implementation)).toBe(target);
    expect(implementation.listeners.size).toBe(0);
  });

  it("stores Event and AbortController state", () => {
    const event = new Event("ready", { bubbles: true });
    const controller = new AbortController();

    expect(eventImplementation(event).type).toBe("ready");
    expect(eventImplementation(event).bubbles).toBe(true);
    expect(abortControllerImplementation(controller).signal).toBe(
      controller.signal,
    );
  });
});
