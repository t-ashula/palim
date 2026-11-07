export interface WritableStreamSink<Chunk> {
  write(chunk: Chunk): void;
  close(): void;
  abort(reason?: unknown): void;
}

type QueuedOperation<Chunk> =
  | { readonly type: "write"; readonly chunk: Chunk }
  | { readonly type: "close" };

export class WritableStreamState<Chunk> {
  #locked = false;
  #status: "writable" | "closed" | "errored" = "writable";
  #error: unknown = null;
  #performing = false;
  #closeRequested = false;
  #abortPending = false;
  readonly #queuedOperations: QueuedOperation<Chunk>[] = [];

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
    if (this.#closeRequested) {
      throw new TypeError("The HTML stream is closed");
    }
    if (this.#performing) {
      this.#queuedOperations.push({ type: "write", chunk });
      return;
    }
    this.#performWrite(chunk);
  }

  close(requireUnlocked = false): void {
    if (requireUnlocked && this.#locked) {
      throw new TypeError("The WritableStream is locked");
    }
    this.#requireWritable();
    if (this.#closeRequested) {
      throw new TypeError("The HTML stream is closed");
    }
    this.#closeRequested = true;
    if (this.#performing) {
      this.#queuedOperations.push({ type: "close" });
      return;
    }
    this.#performClose();
  }

  abort(reason?: unknown, requireUnlocked = false): void {
    if (requireUnlocked && this.#locked) {
      throw new TypeError("The WritableStream is locked");
    }
    if (this.#status !== "writable") {
      return;
    }
    this.#status = "errored";
    this.#error = reason;
    this.#queuedOperations.length = 0;
    if (this.#performing) {
      this.#abortPending = true;
      return;
    }
    this.#performAbort(reason);
  }

  fail(error: unknown): void {
    if (this.#status !== "writable") {
      return;
    }
    this.#status = "errored";
    this.#error = error;
    this.#queuedOperations.length = 0;
    if (this.#performing) {
      this.#abortPending = true;
      return;
    }
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

  #performWrite(chunk: Chunk): void {
    this.#perform(() => {
      this.sink.write(chunk);
    });
  }

  #performClose(): void {
    this.#perform(() => {
      this.sink.close();
      if (this.#status === "writable") {
        this.#status = "closed";
      }
    });
  }

  #performAbort(reason: unknown): void {
    this.#abortPending = false;
    this.#performing = true;
    try {
      this.sink.abort(reason);
    } finally {
      this.#performing = false;
    }
  }

  #perform(operation: () => void): void {
    this.#performing = true;
    try {
      operation();
    } catch (error: unknown) {
      this.#status = "errored";
      this.#error = error;
      this.#queuedOperations.length = 0;
      throw error;
    } finally {
      this.#performing = false;
    }
    this.#drain();
  }

  #drain(): void {
    if (this.#performing) {
      return;
    }
    if (this.#abortPending) {
      this.#performAbort(this.#error);
      return;
    }
    if (this.#status !== "writable") {
      return;
    }
    const operation = this.#queuedOperations.shift();
    if (operation === undefined) {
      return;
    }
    if (operation.type === "write") {
      this.#performWrite(operation.chunk);
    } else {
      this.#performClose();
    }
  }
}
