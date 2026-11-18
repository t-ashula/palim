import { describe, expect, it } from "vitest";

import { expectDOMException } from "../helper/assertions.js";
import { parseHTML as parse } from "../helper/dom.js";
import {
  AbortController,
  CustomEvent,
  ErrorEvent,
  Event,
  EventTarget,
  MouseEvent,
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

  it("constructs mouse events with mouse state", () => {
    const relatedTarget = new EventTarget();
    const event = new MouseEvent("mousedown", {
      bubbles: true,
      composed: true,
      detail: 2,
      screenX: 11,
      screenY: 12,
      clientX: 21,
      clientY: 22,
      ctrlKey: true,
      shiftKey: true,
      button: 1,
      buttons: 4,
      relatedTarget,
    });

    expect(event).toBeInstanceOf(Event);
    expect(event.type).toBe("mousedown");
    expect(event.bubbles).toBe(true);
    expect(event.composed).toBe(true);
    expect(event.detail).toBe(2);
    expect(event.screenX).toBe(11);
    expect(event.screenY).toBe(12);
    expect(event.clientX).toBe(21);
    expect(event.clientY).toBe(22);
    expect(event.ctrlKey).toBe(true);
    expect(event.shiftKey).toBe(true);
    expect(event.altKey).toBe(false);
    expect(event.metaKey).toBe(false);
    expect(event.button).toBe(1);
    expect(event.buttons).toBe(4);
    expect(event.relatedTarget).toBe(relatedTarget);
    expect(event.getModifierState("Control")).toBe(true);
    expect(event.getModifierState("Shift")).toBe(true);
    expect(event.getModifierState("AltGraph")).toBe(false);
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

  it("initializes legacy mouse events and ignores initialization during dispatch", () => {
    const document = parse("");
    const event = document.createEvent("MouseEvents");
    if (!(event instanceof MouseEvent)) {
      throw new Error("Expected a MouseEvent");
    }
    const relatedTarget = new EventTarget();
    const target = new EventTarget();
    event.initMouseEvent(
      "mousedown",
      true,
      true,
      null,
      2,
      11,
      12,
      21,
      22,
      true,
      false,
      true,
      false,
      1,
      relatedTarget,
    );
    target.addEventListener("mousedown", () => {
      event.initMouseEvent("changed", false, false);
    });

    expect(event.type).toBe("mousedown");
    expect(event.detail).toBe(2);
    expect(event.screenX).toBe(11);
    expect(event.clientY).toBe(22);
    expect(event.ctrlKey).toBe(true);
    expect(event.shiftKey).toBe(true);
    expect(event.button).toBe(1);
    expect(event.buttons).toBe(0);
    expect(event.relatedTarget).toBe(relatedTarget);
    expect(target.dispatchEvent(event)).toBe(true);
    expect(event.type).toBe("mousedown");
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

  it("exposes the event path only while dispatching", () => {
    const document = parse("<main><button></button></main>");
    const main = document.querySelector("main");
    const button = document.querySelector("button");
    if (main === null || button === null) {
      throw new Error("Expected event path fixtures");
    }
    const event = new Event("path", { bubbles: true });
    const paths: EventTarget[][] = [];
    button.addEventListener("path", () => paths.push(event.composedPath()));
    main.addEventListener("path", () => paths.push(event.composedPath()));

    expect(event.composedPath()).toEqual([]);
    button.dispatchEvent(event);

    expect(paths).toEqual([
      [button, main, document.body, document.documentElement, document],
      [button, main, document.body, document.documentElement, document],
    ]);
    expect(event.composedPath()).toEqual([]);
  });

  it("hides a closed shadow tree from listeners outside it", () => {
    const document = parse("<main></main>");
    const host = document.querySelector("main");
    if (host === null) {
      throw new Error("Expected a shadow host");
    }
    const shadow = host.attachShadow({ mode: "closed" });
    const target = document.createElement("button");
    shadow.appendChild(target);
    const event = new Event("path", { bubbles: true, composed: true });
    let innerPath: EventTarget[] = [];
    let outerPath: EventTarget[] = [];
    target.addEventListener("path", () => {
      innerPath = event.composedPath();
    });
    host.addEventListener("path", () => {
      outerPath = event.composedPath();
    });

    target.dispatchEvent(event);

    expect(innerPath).toEqual([
      target,
      shadow,
      host,
      document.body,
      document.documentElement,
      document,
    ]);
    expect(outerPath).toEqual([
      host,
      document.body,
      document.documentElement,
      document,
    ]);
  });

  it("dispatches through an assigned slot", () => {
    const document = parse("<main><button></button></main>");
    const host = document.querySelector("main");
    const target = document.querySelector("button");
    if (host === null || target === null) {
      throw new Error("Expected slot fixtures");
    }
    const shadow = host.attachShadow({ mode: "open" });
    const slot = document.createElement("slot");
    shadow.appendChild(slot);
    const event = new Event("path", { bubbles: true, composed: true });
    let path: EventTarget[] = [];
    slot.addEventListener("path", () => {
      path = event.composedPath();
    });

    target.dispatchEvent(event);

    expect(path).toEqual([
      target,
      slot,
      shadow,
      host,
      document.body,
      document.documentElement,
      document,
    ]);
  });

  it("invokes capturing listeners before bubbling listeners at the target", () => {
    const target = new EventTarget();
    const calls: string[] = [];
    target.addEventListener("order", () => calls.push("bubble"));
    target.addEventListener("order", () => calls.push("capture"), true);

    target.dispatchEvent(new Event("order"));

    expect(calls).toEqual(["capture", "bubble"]);
  });

  it("uses the initial tree when clearing post-dispatch targets", () => {
    const document = parse("<main><button></button></main>");
    const host = document.querySelector("main");
    const target = document.querySelector("button");
    if (host === null || target === null) {
      throw new Error("Expected post-dispatch fixtures");
    }
    const shadow = host.attachShadow({ mode: "open" });
    const movedIntoShadow = new MouseEvent("move", { relatedTarget: host });
    target.addEventListener("move", () => shadow.appendChild(target));

    target.dispatchEvent(movedIntoShadow);

    expect(movedIntoShadow.target).toBe(target);
    expect(movedIntoShadow.relatedTarget).toBe(host);

    const movedOutOfShadow = new MouseEvent("move", { relatedTarget: host });
    target.addEventListener("move", () => host.appendChild(target));

    target.dispatchEvent(movedOutOfShadow);

    expect(movedOutOfShadow.target).toBeNull();
    expect(movedOutOfShadow.relatedTarget).toBeNull();
  });
});
