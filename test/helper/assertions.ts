import { expect } from "vitest";

import { DOMException } from "../../src/index.js";

export function expectDOMException(
  operation: () => unknown,
  name: string,
): DOMException {
  let error: unknown;
  try {
    operation();
  } catch (caught) {
    error = caught;
  }
  expect(error).toBeInstanceOf(DOMException);
  expect((error as DOMException).name).toBe(name);
  return error as DOMException;
}
