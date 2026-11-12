import {
  FormData,
  type FormDataEntry,
} from "@palim/window/internal/form-data.js";
import type { EngineObject, EngineValue } from "./adapter.js";
import type { RealmBindingContext } from "./realm-binding-context.js";

export type FormDataIteratorKind = "keys" | "values" | "entries";
type FormDataIterator = IterableIterator<string | FormDataEntry>;

export class FormDataRealmBindingContext {
  readonly formDataPrototype: EngineObject;
  readonly iteratorPrototype: EngineObject;
  readonly #objects = new WeakMap<FormData, EngineObject>();
  readonly #formData = new WeakMap<EngineObject, FormData>();
  readonly #iterators = new WeakMap<EngineObject, FormDataIterator>();

  constructor(readonly binding: RealmBindingContext) {
    const objectPrototype = binding.engine.objectPrototype(binding.realm);
    this.formDataPrototype = binding.engine.createObject(
      binding.realm,
      objectPrototype,
    );
    this.iteratorPrototype = binding.engine.createObject(
      binding.realm,
      binding.engine.iteratorPrototype(binding.realm),
    );
  }

  create(entries: Iterable<readonly [string, string]> = []): EngineObject {
    return this.wrap(new FormData(entries));
  }

  wrap(formData: FormData): EngineObject {
    const existing = this.#objects.get(formData);
    if (existing !== undefined) {
      return existing;
    }
    const object = this.binding.engine.createObject(
      this.binding.realm,
      this.formDataPrototype,
    );
    this.#objects.set(formData, object);
    this.#formData.set(object, formData);
    return object;
  }

  wrapIterator(formData: FormData, kind: FormDataIteratorKind): EngineObject {
    const object = this.binding.engine.createObject(
      this.binding.realm,
      this.iteratorPrototype,
    );
    this.#iterators.set(object, formData[kind]() as FormDataIterator);
    return object;
  }

  value(value: EngineValue): FormData | null {
    const object = this.binding.engine.asObject(value);
    return object === null ? null : (this.#formData.get(object) ?? null);
  }

  iterator(value: EngineValue): FormDataIterator | null {
    const object = this.binding.engine.asObject(value);
    return object === null ? null : (this.#iterators.get(object) ?? null);
  }
}
