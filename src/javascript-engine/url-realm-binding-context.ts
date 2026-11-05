import type { URL, URLSearchParams } from "../url/index.js";
import type { EngineObject, EngineValue } from "./adapter.js";
import type { RealmBindingContext } from "./realm-binding-context.js";

type SearchParamsPair = readonly [string, string];
type SearchParamsIterator = IterableIterator<string | SearchParamsPair>;

export type SearchParamsIteratorKind = "keys" | "values" | "entries";

export class URLRealmBindingContext {
  readonly urlPrototype: EngineObject;
  readonly searchParamsPrototype: EngineObject;
  readonly searchParamsIteratorPrototype: EngineObject;
  readonly #urlObjects = new WeakMap<URL, EngineObject>();
  readonly #urls = new WeakMap<EngineObject, URL>();
  readonly #searchParamsObjects = new WeakMap<URLSearchParams, EngineObject>();
  readonly #searchParams = new WeakMap<EngineObject, URLSearchParams>();
  readonly #searchParamsIterators = new WeakMap<
    EngineObject,
    SearchParamsIterator
  >();

  constructor(readonly binding: RealmBindingContext) {
    const objectPrototype = binding.engine.objectPrototype(binding.realm);
    this.urlPrototype = binding.engine.createObject(
      binding.realm,
      objectPrototype,
    );
    this.searchParamsPrototype = binding.engine.createObject(
      binding.realm,
      objectPrototype,
    );
    this.searchParamsIteratorPrototype = binding.engine.createObject(
      binding.realm,
      binding.engine.iteratorPrototype(binding.realm),
    );
  }

  wrapURL(url: URL): EngineObject {
    const existing = this.#urlObjects.get(url);
    if (existing !== undefined) {
      return existing;
    }
    const object = this.binding.engine.createObject(
      this.binding.realm,
      this.urlPrototype,
    );
    this.#urlObjects.set(url, object);
    this.#urls.set(object, url);
    return object;
  }

  wrapSearchParams(params: URLSearchParams): EngineObject {
    const existing = this.#searchParamsObjects.get(params);
    if (existing !== undefined) {
      return existing;
    }
    const object = this.binding.engine.createObject(
      this.binding.realm,
      this.searchParamsPrototype,
    );
    this.#searchParamsObjects.set(params, object);
    this.#searchParams.set(object, params);
    return object;
  }

  wrapSearchParamsIterator(
    params: URLSearchParams,
    kind: SearchParamsIteratorKind,
  ): EngineObject {
    const object = this.binding.engine.createObject(
      this.binding.realm,
      this.searchParamsIteratorPrototype,
    );
    this.#searchParamsIterators.set(
      object,
      params[kind]() as SearchParamsIterator,
    );
    return object;
  }

  url(value: EngineValue): URL | null {
    const object = this.binding.engine.asObject(value);
    return object === null ? null : (this.#urls.get(object) ?? null);
  }

  params(value: EngineValue): URLSearchParams | null {
    const object = this.binding.engine.asObject(value);
    return object === null ? null : (this.#searchParams.get(object) ?? null);
  }

  paramsIterator(value: EngineValue): SearchParamsIterator | null {
    const object = this.binding.engine.asObject(value);
    return object === null
      ? null
      : (this.#searchParamsIterators.get(object) ?? null);
  }
}
