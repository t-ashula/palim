import type { Blob } from "@palim/window";
import { File } from "@palim/window";

import type {
  EngineCallable,
  EngineObject,
  EngineResult,
  EngineValue,
} from "./adapter.js";
import type { RealmBindingContext } from "./realm-binding-context.js";

export class BlobRealmBindingContext {
  readonly blobPrototype: EngineObject;
  readonly filePrototype: EngineObject;
  readonly #objects = new WeakMap<Blob, EngineObject>();
  readonly #values = new WeakMap<EngineObject, Blob>();
  readonly #iteratorFactory: EngineCallable;

  constructor(readonly binding: RealmBindingContext) {
    this.blobPrototype = binding.engine.createObject(
      binding.realm,
      binding.engine.objectPrototype(binding.realm),
    );
    this.filePrototype = binding.engine.createObject(
      binding.realm,
      this.blobPrototype,
    );
    const iteratorFactory = binding.engine.evaluate(
      binding.realm,
      `(value) => {
        if (Object(value) !== value) throw new TypeError("Blob parts must be an object");
        const method = value[Symbol.iterator];
        if (method == null) throw new TypeError("Blob parts must be iterable");
        const iterator = method.call(value);
        return () => iterator.next();
      }`,
    );
    const callable =
      iteratorFactory.type === "normal"
        ? binding.engine.asCallable(iteratorFactory.value)
        : null;
    if (callable === null) {
      throw new TypeError("Could not create Blob part sequence converter");
    }
    this.#iteratorFactory = callable;
  }

  wrap(blob: Blob): EngineObject {
    const existing = this.#objects.get(blob);
    if (existing !== undefined) {
      return existing;
    }
    const object = this.binding.engine.createObject(
      this.binding.realm,
      blob instanceof File ? this.filePrototype : this.blobPrototype,
    );
    this.#objects.set(blob, object);
    this.#values.set(object, blob);
    return object;
  }

  value(value: EngineValue): Blob | null {
    const object = this.binding.engine.asObject(value);
    return object === null ? null : (this.#values.get(object) ?? null);
  }

  file(value: EngineValue): File | null {
    const blob = this.value(value);
    return blob instanceof File ? blob : null;
  }

  iterator(value: EngineValue): EngineResult<EngineValue> {
    return this.binding.call(
      this.#iteratorFactory,
      this.binding.engine.fromPrimitive(undefined),
      [value],
    );
  }
}
