import type { Element } from "@palim/core";
import { expect } from "vitest";

interface ElementConstructor<T extends Element> {
  readonly prototype: T;
  [Symbol.hasInstance](value: unknown): boolean;
}

export function assertElement<T extends Element>(
  actual: unknown,
  expected: ElementConstructor<T>,
): asserts actual is T {
  expect(actual).toBeInstanceOf(expected);
}
