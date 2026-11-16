import { describe, expect, it } from "vitest";

import { uuidV4 } from "../src/uuid.js";

describe("uuidV4", () => {
  it("returns distinct RFC 4122 version 4 identifiers", () => {
    const first = uuidV4();
    const second = uuidV4();

    expect(first).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u,
    );
    expect(second).not.toBe(first);
  });
});
