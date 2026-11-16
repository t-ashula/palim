import { describe, expect, it } from "vitest";

import { callbackFailure, callbackSuccess } from "../src/callback-result.js";

describe("callback results", () => {
  it("preserves a successful callback value", () => {
    const value = { id: 1 };

    expect(callbackSuccess(value)).toEqual({ type: "success", value });
  });

  it("represents a callback failure without a value", () => {
    expect(callbackFailure()).toEqual({ type: "failure" });
  });
});
