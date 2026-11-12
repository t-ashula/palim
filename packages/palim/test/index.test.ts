import * as palim from "palim";
import { describe, expect, it } from "vitest";

describe("palim", () => {
  it("loads the public entry point", () => {
    expect(palim).toBeTypeOf("object");
  });
});
