import { describe, expect, it } from "vitest";

import {
  DOM_EXCEPTION_CONSTANTS,
  DOMException,
  domExceptionCode,
} from "../src/dom-exception.js";

describe("DOMException", () => {
  it("maps exception names to their legacy numeric codes", () => {
    expect(domExceptionCode("InvalidStateError")).toBe(
      DOM_EXCEPTION_CONSTANTS.INVALID_STATE_ERR,
    );
    expect(domExceptionCode("UnknownErrorName")).toBe(0);
  });

  it("exposes the platform constructor and constants", () => {
    const error = new DOMException("invalid", "InvalidStateError");

    expect(error.name).toBe("InvalidStateError");
    expect(error.message).toBe("invalid");
    expect(error.code).toBe(DOM_EXCEPTION_CONSTANTS.INVALID_STATE_ERR);
    expect(Object.isFrozen(DOM_EXCEPTION_CONSTANTS)).toBe(true);
  });
});
