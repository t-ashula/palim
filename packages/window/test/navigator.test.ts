import { describe, expect, it } from "vitest";

import { windowNavigator } from "../src/navigator.js";
import { createWindow } from "../src/window.js";

describe("Navigator", () => {
  it("keeps Navigator identity for a Window", () => {
    const window = createWindow();

    expect(windowNavigator(window)).toBe(windowNavigator(window));
    expect(windowNavigator(window).userAgent).toBe("palim");
    expect(windowNavigator(window).onLine).toBe(true);
  });

  it("uses a different Navigator for each Window", () => {
    expect(windowNavigator(createWindow())).not.toBe(
      windowNavigator(createWindow()),
    );
  });
});
