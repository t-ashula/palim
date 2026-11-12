import {
  createExtensionHostServices,
  createHostServiceKey,
  createHostServices,
  createWindowExtension,
  hostService,
} from "@palim/polyfills";
import { describe, expect, it } from "vitest";

describe("HostServices", () => {
  it("retrieves a service using its typed key", () => {
    const clock = createHostServiceKey<{ now(): number }>("clock");
    const service = { now: () => 42 };
    const services = createHostServices([hostService(clock, service)]);

    expect(services.require(clock)).toBe(service);
    expect(services.require(clock).now()).toBe(42);
  });

  it("rejects a missing service at extension installation time", () => {
    const entropy = createHostServiceKey<Uint8Array>("entropy");

    expect(() => createHostServices().require(entropy)).toThrow(
      'Required host service "entropy" is not available',
    );
  });

  it("rejects duplicate registrations", () => {
    const clock = createHostServiceKey<number>("clock");

    expect(() =>
      createHostServices([hostService(clock, 1), hostService(clock, 2)]),
    ).toThrow('Host service "clock" is registered twice');
  });

  it("composes only services declared by selected extensions", () => {
    const clock = createHostServiceKey<number>("clock");
    const extension = createWindowExtension(
      () => undefined,
      [hostService(clock, 42)],
    );

    expect(() => createExtensionHostServices([]).require(clock)).toThrow(
      'Required host service "clock" is not available',
    );
    expect(createExtensionHostServices([extension]).require(clock)).toBe(42);
  });
});
