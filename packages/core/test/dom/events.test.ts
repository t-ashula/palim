import { describe, expect, it } from "vitest";

import { expectDOMException } from "../helper/assertions.js";
import { parseHTML as parse } from "../helper/dom.js";
import {
  AbortController,
  CustomEvent,
  ErrorEvent,
  Event,
  EventTarget,
} from "../public-test-api.js";

describe("EventTarget", () => {
  it("constructs error events with diagnostic fields", () => {
    const error = { reason: "failure" };
    const event = new ErrorEvent("error", {
      cancelable: true,
      message: "failed",
      filename: "https://example.test/script.js",
      lineno: 12,
      colno: 34,
      error,
    });

    expect(event).toBeInstanceOf(Event);
    expect(event.type).toBe("error");
    expect(event.cancelable).toBe(true);
    expect(event.message).toBe("failed");
    expect(event.filename).toBe("https://example.test/script.js");
    expect(event.lineno).toBe(12);
    expect(event.colno).toBe(34);
    expect(event.error).toBe(error);
  });

  it("constructs custom events with detail", () => {
    const event = new CustomEvent("custom", {
      bubbles: true,
      cancelable: true,
      detail: { value: 54 },
    });

    expect(event.type).toBe("custom");
    expect(event.bubbles).toBe(true);
    expect(event.cancelable).toBe(true);
    expect(event.detail).toEqual({ value: 54 });
  });

  it("creates and initializes legacy events", () => {
    const document = parse("");
    const event = document.createEvent("eVeNtS");

    expect(event).toBeInstanceOf(Event);
    expect(event.type).toBe("");
    expectDOMException(
      () => document.dispatchEvent(event),
      "InvalidStateError",
    );

    event.initEvent("ready", true, true);
    expect(event.type).toBe("ready");
    expect(event.bubbles).toBe(true);
    expect(event.cancelable).toBe(true);
    expect(document.dispatchEvent(event)).toBe(true);

    event.initEvent("again");
    expect(event.target).toBeNull();
    expect(event.type).toBe("again");
    expect(event.bubbles).toBe(false);
    expect(event.cancelable).toBe(false);

    expectDOMException(() => document.createEvent("foo"), "NotSupportedError");
  });

  it("initializes legacy custom events and ignores initialization during dispatch", () => {
    const document = parse("");
    const event = document.createEvent("CustomEvent");
    if (!(event instanceof CustomEvent)) {
      throw new Error("Expected a CustomEvent");
    }
    const initialDetail = { value: 54 };
    event.initCustomEvent("custom", true, true, initialDetail);
    const target = new EventTarget();

    target.addEventListener("custom", () => {
      event.initCustomEvent("changed", false, false, { value: 0 });
      expectDOMException(
        () => target.dispatchEvent(event),
        "InvalidStateError",
      );
    });

    expect(target.dispatchEvent(event)).toBe(true);
    expect(event.type).toBe("custom");
    expect(event.bubbles).toBe(true);
    expect(event.cancelable).toBe(true);
    expect(event.detail).toBe(initialDetail);
  });

  it("ignores cancellation from passive listeners", () => {
    const target = new EventTarget();
    target.addEventListener(
      "passive",
      (event) => {
        event.preventDefault();
        event.returnValue = false;
      },
      { passive: true },
    );
    const passiveEvent = new Event("passive", { cancelable: true });

    expect(target.dispatchEvent(passiveEvent)).toBe(true);
    expect(passiveEvent.defaultPrevented).toBe(false);

    target.addEventListener("active", (event) => {
      event.preventDefault();
    });
    const activeEvent = new Event("active", { cancelable: true });

    expect(target.dispatchEvent(activeEvent)).toBe(false);
    expect(activeEvent.defaultPrevented).toBe(true);
  });

  it("removes signal-bound listeners when aborted", () => {
    const target = new EventTarget();
    const controller = new AbortController();
    let calls = 0;
    const listener = (): void => {
      calls += 1;
    };

    target.addEventListener("signal", listener, {
      signal: controller.signal,
    });
    target.dispatchEvent(new Event("signal"));
    controller.abort();
    target.dispatchEvent(new Event("signal"));
    target.addEventListener("signal", listener, {
      signal: controller.signal,
    });
    target.dispatchEvent(new Event("signal"));

    expect(calls).toBe(1);
    expect(controller.signal.aborted).toBe(true);
  });

  it("skips later listeners removed by an abort during dispatch", () => {
    const target = new EventTarget();
    const controller = new AbortController();
    let laterCalls = 0;

    target.addEventListener(
      "signal",
      () => {
        controller.abort();
      },
      { signal: controller.signal },
    );
    target.addEventListener(
      "signal",
      () => {
        laterCalls += 1;
      },
      { signal: controller.signal },
    );
    target.dispatchEvent(new Event("signal"));

    expect(laterCalls).toBe(0);
  });
});
