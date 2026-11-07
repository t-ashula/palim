export interface WritableStreamSink<Chunk> {
  write(chunk: Chunk): void;
  close(): void;
  abort(reason?: unknown): void;
}

export class WritableStreamState<Chunk> {
  #locked = false;
  #status: "writable" | "closed" | "errored" = "writable";
  #error: unknown = null;

  constructor(readonly sink: WritableStreamSink<Chunk>) {}

  get locked(): boolean {
    return this.#locked;
  }

  get status(): "writable" | "closed" | "errored" {
    return this.#status;
  }

  get error(): unknown {
    return this.#error;
  }

  get desiredSize(): number | null {
    return this.#status === "errored"
      ? null
      : this.#status === "closed"
        ? 0
        : 1;
  }

  acquireWriter(): void {
    if (this.#locked) {
      throw new TypeError("The WritableStream is locked");
    }
    this.#locked = true;
  }

  releaseWriter(): void {
    this.#locked = false;
  }

  write(chunk: Chunk): void {
    this.#requireWritable();
    this.#perform(() => {
      this.sink.write(chunk);
    });
  }

  close(requireUnlocked = false): void {
    if (requireUnlocked && this.#locked) {
      throw new TypeError("The WritableStream is locked");
    }
    this.#requireWritable();
    this.#perform(() => {
      this.sink.close();
    });
    this.#status = "closed";
  }

  abort(reason?: unknown, requireUnlocked = false): void {
    if (requireUnlocked && this.#locked) {
      throw new TypeError("The WritableStream is locked");
    }
    if (this.#status !== "writable") {
      return;
    }
    this.#perform(() => {
      this.sink.abort(reason);
    });
    this.#status = "closed";
  }

  fail(error: unknown): void {
    if (this.#status !== "writable") {
      return;
    }
    this.#status = "errored";
    this.#error = error;
    try {
      this.sink.abort(error);
    } catch {
      // Preserve the conversion or operation error that caused the failure.
    }
  }

  #requireWritable(): void {
    if (this.#status !== "writable") {
      throw new TypeError("The HTML stream is closed");
    }
  }

  #perform(operation: () => void): void {
    try {
      operation();
    } catch (error: unknown) {
      this.#status = "errored";
      this.#error = error;
      throw error;
    }
  }
}
