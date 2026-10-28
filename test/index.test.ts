import { describe, expect, it } from "vitest";

import * as palim from "../src/index.js";

describe("palim", () => {
  it("loads the public entry point", () => {
    expect(palim).toBeTypeOf("object");
  });
});
