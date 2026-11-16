import { describe, expectTypeOf, it } from "vitest";

import type {
  FrameRequestCallback,
  Location,
  Window,
  WindowConsoleCall,
  WindowErrorHandler,
} from "../src/window-types.js";

describe("Window integration types", () => {
  it("describes the callbacks and values supplied by Window packages", () => {
    expectTypeOf<FrameRequestCallback>().toBeFunction();
    expectTypeOf<WindowErrorHandler>().toBeFunction();
    expectTypeOf<WindowConsoleCall["arguments"]>().toEqualTypeOf<
      readonly string[]
    >();
    expectTypeOf<Location["href"]>().toEqualTypeOf<string>();
    expectTypeOf<Window["requestAnimationFrame"]>().toBeFunction();
  });
});
