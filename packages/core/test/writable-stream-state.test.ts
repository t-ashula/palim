import { describe, expect, it, vi } from "vitest";

import { WritableStreamState } from "../src/writable-stream-state.js";

describe("WritableStreamState", () => {
  it("tracks writer locking and close state", () => {
    const sink = { write: vi.fn(), close: vi.fn(), abort: vi.fn() };
    const state = new WritableStreamState(sink);

    state.acquireWriter();
    expect(state.locked).toBe(true);
    expect(() => {
      state.acquireWriter();
    }).toThrow("locked");
    expect(() => {
      state.close(true);
    }).toThrow("locked");

    state.releaseWriter();
    state.write("chunk");
    state.close();

    expect(sink.write).toHaveBeenCalledWith("chunk");
    expect(sink.close).toHaveBeenCalledOnce();
    expect(state.status).toBe("closed");
    expect(state.desiredSize).toBe(0);
  });

  it("records abort reasons and rejects later writes", () => {
    const sink = { write: vi.fn(), close: vi.fn(), abort: vi.fn() };
    const state = new WritableStreamState(sink);
    const reason = new Error("stopped");

    state.abort(reason);

    expect(sink.abort).toHaveBeenCalledWith(reason);
    expect(state.status).toBe("errored");
    expect(state.error).toBe(reason);
    expect(state.desiredSize).toBeNull();
    expect(() => {
      state.write("late");
    }).toThrow("closed");
  });
});
