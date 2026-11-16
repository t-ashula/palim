import { describe, expect, it } from "vitest";

import {
  parseHost,
  parseIPv4,
  parseIPv6,
  serializeHost,
} from "../../src/url/host.js";

describe("URL hosts", () => {
  it("parses and serializes IPv4 addresses", () => {
    const address = parseIPv4("127.0.0.1");
    expect(address).toBe(2_130_706_433);
    expect(serializeHost({ type: "ipv4", value: address ?? 0 })).toBe(
      "127.0.0.1",
    );
    expect(parseIPv4("256.0.0.1")).toBeNull();
  });

  it("parses and serializes compressed IPv6 addresses", () => {
    const address = parseIPv6("2001:db8::1");
    expect(address).toEqual([0x2001, 0xdb8, 0, 0, 0, 0, 0, 1]);
    expect(
      address === null ? null : serializeHost({ type: "ipv6", value: address }),
    ).toBe("[2001:db8::1]");
  });

  it("distinguishes opaque and domain hosts", () => {
    expect(parseHost("EXAMPLE.test", false)).toEqual({
      type: "domain",
      value: "example.test",
    });
    expect(parseHost("a_b", true)).toEqual({
      type: "opaque",
      value: "a_b",
    });
  });
});
