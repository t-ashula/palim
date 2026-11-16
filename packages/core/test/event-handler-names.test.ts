import { describe, expect, it } from "vitest";

import {
  GLOBAL_EVENT_HANDLER_NAMES,
  WINDOW_EVENT_HANDLER_NAMES,
} from "../src/event-handler-names.js";

describe("event handler names", () => {
  it("keeps global and Window-only handler names distinct", () => {
    expect(GLOBAL_EVENT_HANDLER_NAMES).toContain("click");
    expect(GLOBAL_EVENT_HANDLER_NAMES).not.toContain("hashchange");
    expect(WINDOW_EVENT_HANDLER_NAMES).toContain("hashchange");
    expect(WINDOW_EVENT_HANDLER_NAMES).not.toContain("click");
  });

  it("does not contain duplicate names", () => {
    expect(new Set(GLOBAL_EVENT_HANDLER_NAMES).size).toBe(
      GLOBAL_EVENT_HANDLER_NAMES.length,
    );
    expect(new Set(WINDOW_EVENT_HANDLER_NAMES).size).toBe(
      WINDOW_EVENT_HANDLER_NAMES.length,
    );
  });
});
