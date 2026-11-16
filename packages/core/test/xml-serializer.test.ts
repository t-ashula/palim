import { describe, expect, it } from "vitest";

import { XMLSerializer } from "../src/xml-serializer.js";
import { DOMParser } from "./public-test-api.js";

describe("XMLSerializer interface", () => {
  it("serializes a node through the public interface", () => {
    const document = new DOMParser().parseFromString(
      '<root xmlns="urn:test"><child/></root>',
      "application/xml",
    );

    expect(new XMLSerializer().serializeToString(document)).toBe(
      '<root xmlns="urn:test"><child/></root>',
    );
  });
});
