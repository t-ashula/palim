import { URL } from "@palim/core";
import { describe, expect, it } from "vitest";

import {
  navigatorServiceWorker,
  ServiceWorkerRegistrationStore,
  setWindowServiceWorkerStore,
  windowNavigator,
  windowServiceWorkerStore,
} from "../src/index.js";
import { createWindow } from "../src/window.js";

describe("Service Worker state", () => {
  it("keeps ServiceWorkerContainer identity for a Navigator", () => {
    const window = createWindow();

    expect(navigatorServiceWorker(windowNavigator(window))).toBe(
      navigatorServiceWorker(windowNavigator(window)),
    );
  });

  it("shares registrations through an explicitly shared store", () => {
    const first = createWindow({ url: "https://example.test/a" });
    const second = createWindow({ url: "https://example.test/b" });
    const store = new ServiceWorkerRegistrationStore();
    setWindowServiceWorkerStore(first, store);
    setWindowServiceWorkerStore(second, store);
    const scope = new URL("https://example.test/scope/");

    const registration = windowServiceWorkerStore(first).getOrCreate(
      scope.origin,
      scope,
    );

    expect(windowServiceWorkerStore(second).get(scope.origin, scope)).toBe(
      registration,
    );
    expect(
      windowServiceWorkerStore(second).get(
        "https://other.test",
        new URL("https://other.test/scope/"),
      ),
    ).toBeNull();
  });
});
