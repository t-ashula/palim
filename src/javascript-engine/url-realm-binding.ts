import { URL, URLSearchParams } from "../url/index.js";
import { normal, thrown } from "./adapter.js";
import type {
  EngineCallable,
  EngineHostFunction,
  EngineObject,
  EngineRealm,
  EngineResult,
  EngineValue,
  JavaScriptEngineAdapter,
} from "./adapter.js";

const INTERFACE_PROPERTY = {
  configurable: true,
  enumerable: false,
  writable: true,
} as const;

const MEMBER_PROPERTY = {
  configurable: true,
  enumerable: true,
  writable: true,
} as const;

const ATTRIBUTE_PROPERTY = {
  configurable: true,
  enumerable: true,
} as const;

const TAG_PROPERTY = {
  configurable: true,
  enumerable: false,
  writable: false,
} as const;

type SearchParamsPair = readonly [string, string];
type SearchParamsIterator = IterableIterator<string | SearchParamsPair>;

export class URLRealmBinding {
  readonly #engine: JavaScriptEngineAdapter;
  readonly #realm: EngineRealm;
  readonly #urlPrototype: EngineObject;
  readonly #searchParamsPrototype: EngineObject;
  readonly #searchParamsIteratorPrototype: EngineObject;
  readonly #urlObjects = new WeakMap<URL, EngineObject>();
  readonly #urls = new WeakMap<EngineObject, URL>();
  readonly #searchParamsObjects = new WeakMap<URLSearchParams, EngineObject>();
  readonly #searchParams = new WeakMap<EngineObject, URLSearchParams>();
  readonly #searchParamsIterators = new WeakMap<
    EngineObject,
    SearchParamsIterator
  >();

  constructor(engine: JavaScriptEngineAdapter, realm: EngineRealm) {
    this.#engine = engine;
    this.#realm = realm;
    const objectPrototype = this.#engine.objectPrototype(this.#realm);
    this.#urlPrototype = this.#engine.createObject(
      this.#realm,
      objectPrototype,
    );
    this.#searchParamsPrototype = this.#engine.createObject(
      this.#realm,
      objectPrototype,
    );
    this.#searchParamsIteratorPrototype = this.#engine.createObject(
      this.#realm,
      this.#engine.iteratorPrototype(this.#realm),
    );

    this.#installInterfaces();
    this.#installURLMembers();
    this.#installURLSearchParamsMembers();
    this.#installURLSearchParamsIteratorMembers();
  }

  #installInterfaces(): void {
    const urlConstructor = this.#engine.createConstructor(
      this.#realm,
      "URL",
      1,
      (_thisValue, argumentsList) => {
        const input = this.#requiredString(argumentsList, 0, "URL");
        if (input.type === "throw") {
          return input;
        }
        const base = this.#optionalString(argumentsList, 1);
        if (base.type === "throw") {
          return base;
        }
        return normal(
          this.#wrapURL(
            base.value === undefined
              ? new URL(input.value)
              : new URL(input.value, base.value),
          ),
        );
      },
    );
    this.#installInterface("URL", urlConstructor, this.#urlPrototype);
    this.#engine.defineDataProperty(
      this.#engine.globalObject(this.#realm),
      "webkitURL",
      urlConstructor,
      INTERFACE_PROPERTY,
    );
    this.#method(urlConstructor, "canParse", 1, (_thisValue, argumentsList) => {
      const input = this.#requiredString(argumentsList, 0, "canParse");
      if (input.type === "throw") {
        return input;
      }
      const base = this.#optionalString(argumentsList, 1);
      return base.type === "throw"
        ? base
        : this.#primitive(
            base.value === undefined
              ? URL.canParse(input.value)
              : URL.canParse(input.value, base.value),
          );
    });
    this.#method(urlConstructor, "parse", 1, (_thisValue, argumentsList) => {
      const input = this.#requiredString(argumentsList, 0, "parse");
      if (input.type === "throw") {
        return input;
      }
      const base = this.#optionalString(argumentsList, 1);
      if (base.type === "throw") {
        return base;
      }
      const parsed =
        base.value === undefined
          ? URL.parse(input.value)
          : URL.parse(input.value, base.value);
      return normal(
        parsed === null
          ? this.#engine.fromPrimitive(null)
          : this.#wrapURL(parsed),
      );
    });

    const searchParamsConstructor = this.#engine.createConstructor(
      this.#realm,
      "URLSearchParams",
      0,
      (_thisValue, argumentsList) => {
        const converted = this.#createURLSearchParams(argumentsList[0]);
        return converted.type === "throw"
          ? converted
          : normal(this.#wrapURLSearchParams(converted.value));
      },
    );
    this.#installInterface(
      "URLSearchParams",
      searchParamsConstructor,
      this.#searchParamsPrototype,
    );

    this.#tag(this.#urlPrototype, "URL");
    this.#tag(this.#searchParamsPrototype, "URLSearchParams");
    this.#tag(this.#searchParamsIteratorPrototype, "URLSearchParams Iterator");
  }

  #installInterface(
    name: string,
    constructor: EngineCallable,
    prototype: EngineObject,
  ): void {
    this.#engine.defineDataProperty(constructor, "prototype", prototype, {
      configurable: false,
      enumerable: false,
      writable: false,
    });
    this.#engine.defineDataProperty(prototype, "constructor", constructor, {
      configurable: true,
      enumerable: false,
      writable: true,
    });
    this.#engine.defineDataProperty(
      this.#engine.globalObject(this.#realm),
      name,
      constructor,
      INTERFACE_PROPERTY,
    );
  }

  #installURLMembers(): void {
    for (const name of [
      "href",
      "protocol",
      "username",
      "password",
      "host",
      "hostname",
      "port",
      "pathname",
      "search",
      "hash",
    ] as const) {
      this.#attribute(
        this.#urlPrototype,
        name,
        (thisValue) => {
          const url = this.#url(thisValue);
          return url === null
            ? this.#invalidReceiver("URL", name)
            : this.#primitive(url[name]);
        },
        (thisValue, argumentsList) => {
          const url = this.#url(thisValue);
          if (url === null) {
            return this.#invalidReceiver("URL", name);
          }
          const value = this.#requiredString(argumentsList, 0, name);
          if (value.type === "throw") {
            return value;
          }
          url[name] = value.value;
          return this.#undefined();
        },
      );
    }
    this.#attribute(this.#urlPrototype, "origin", (thisValue) => {
      const url = this.#url(thisValue);
      return url === null
        ? this.#invalidReceiver("URL", "origin")
        : this.#primitive(url.origin);
    });
    this.#attribute(this.#urlPrototype, "searchParams", (thisValue) => {
      const url = this.#url(thisValue);
      return url === null
        ? this.#invalidReceiver("URL", "searchParams")
        : normal(this.#wrapURLSearchParams(url.searchParams));
    });
    this.#method(this.#urlPrototype, "toJSON", 0, (thisValue) => {
      const url = this.#url(thisValue);
      return url === null
        ? this.#invalidReceiver("URL", "toJSON")
        : this.#primitive(url.toJSON());
    });
    this.#method(this.#urlPrototype, "toString", 0, (thisValue) => {
      const url = this.#url(thisValue);
      return url === null
        ? this.#invalidReceiver("URL", "toString")
        : this.#primitive(url.toString());
    });
  }

  #installURLSearchParamsMembers(): void {
    this.#attribute(this.#searchParamsPrototype, "size", (thisValue) => {
      const params = this.#params(thisValue);
      return params === null
        ? this.#invalidReceiver("URLSearchParams", "size")
        : this.#primitive(params.size);
    });

    this.#method(
      this.#searchParamsPrototype,
      "append",
      2,
      (thisValue, argumentsList) => {
        const params = this.#params(thisValue);
        if (params === null) {
          return this.#invalidReceiver("URLSearchParams", "append");
        }
        const name = this.#requiredString(argumentsList, 0, "append");
        if (name.type === "throw") {
          return name;
        }
        const value = this.#requiredString(argumentsList, 1, "append");
        if (value.type === "throw") {
          return value;
        }
        params.append(name.value, value.value);
        return this.#undefined();
      },
    );
    this.#method(
      this.#searchParamsPrototype,
      "delete",
      1,
      (thisValue, argumentsList) => {
        const params = this.#params(thisValue);
        if (params === null) {
          return this.#invalidReceiver("URLSearchParams", "delete");
        }
        const name = this.#requiredString(argumentsList, 0, "delete");
        if (name.type === "throw") {
          return name;
        }
        const value = this.#optionalString(argumentsList, 1);
        if (value.type === "throw") {
          return value;
        }
        if (value.value === undefined) {
          params.delete(name.value);
        } else {
          params.delete(name.value, value.value);
        }
        return this.#undefined();
      },
    );
    this.#method(
      this.#searchParamsPrototype,
      "get",
      1,
      (thisValue, argumentsList) => {
        const params = this.#params(thisValue);
        if (params === null) {
          return this.#invalidReceiver("URLSearchParams", "get");
        }
        const name = this.#requiredString(argumentsList, 0, "get");
        return name.type === "throw"
          ? name
          : this.#primitive(params.get(name.value));
      },
    );
    this.#method(
      this.#searchParamsPrototype,
      "getAll",
      1,
      (thisValue, argumentsList) => {
        const params = this.#params(thisValue);
        if (params === null) {
          return this.#invalidReceiver("URLSearchParams", "getAll");
        }
        const name = this.#requiredString(argumentsList, 0, "getAll");
        return name.type === "throw"
          ? name
          : normal(
              this.#engine.createArray(
                this.#realm,
                params
                  .getAll(name.value)
                  .map((value) => this.#engine.fromPrimitive(value)),
              ),
            );
      },
    );
    this.#method(
      this.#searchParamsPrototype,
      "has",
      1,
      (thisValue, argumentsList) => {
        const params = this.#params(thisValue);
        if (params === null) {
          return this.#invalidReceiver("URLSearchParams", "has");
        }
        const name = this.#requiredString(argumentsList, 0, "has");
        if (name.type === "throw") {
          return name;
        }
        const value = this.#optionalString(argumentsList, 1);
        if (value.type === "throw") {
          return value;
        }
        return this.#primitive(
          value.value === undefined
            ? params.has(name.value)
            : params.has(name.value, value.value),
        );
      },
    );
    this.#method(
      this.#searchParamsPrototype,
      "set",
      2,
      (thisValue, argumentsList) => {
        const params = this.#params(thisValue);
        if (params === null) {
          return this.#invalidReceiver("URLSearchParams", "set");
        }
        const name = this.#requiredString(argumentsList, 0, "set");
        if (name.type === "throw") {
          return name;
        }
        const value = this.#requiredString(argumentsList, 1, "set");
        if (value.type === "throw") {
          return value;
        }
        params.set(name.value, value.value);
        return this.#undefined();
      },
    );
    this.#method(this.#searchParamsPrototype, "sort", 0, (thisValue) => {
      const params = this.#params(thisValue);
      if (params === null) {
        return this.#invalidReceiver("URLSearchParams", "sort");
      }
      params.sort();
      return this.#undefined();
    });
    this.#method(
      this.#searchParamsPrototype,
      "forEach",
      1,
      (thisValue, argumentsList) => {
        const params = this.#params(thisValue);
        if (params === null) {
          return this.#invalidReceiver("URLSearchParams", "forEach");
        }
        const callbackValue = argumentsList[0];
        const callback =
          callbackValue === undefined
            ? null
            : this.#engine.asCallable(callbackValue);
        if (callback === null) {
          return this.#typeError("forEach callback is not callable");
        }
        const callbackThis =
          argumentsList[1] ?? this.#engine.fromPrimitive(undefined);
        const platformObject = this.#wrapURLSearchParams(params);
        for (const [name, value] of params) {
          const result = this.#engine.call(
            this.#realm,
            callback,
            callbackThis,
            [
              this.#engine.fromPrimitive(value),
              this.#engine.fromPrimitive(name),
              platformObject,
            ],
          );
          if (result.type === "throw") {
            return result;
          }
        }
        return this.#undefined();
      },
    );
    this.#method(this.#searchParamsPrototype, "keys", 0, (thisValue) =>
      this.#searchParamsIterator(thisValue, "keys"),
    );
    this.#method(this.#searchParamsPrototype, "values", 0, (thisValue) =>
      this.#searchParamsIterator(thisValue, "values"),
    );
    const entries = this.#method(
      this.#searchParamsPrototype,
      "entries",
      0,
      (thisValue) => this.#searchParamsIterator(thisValue, "entries"),
    );
    this.#engine.defineDataProperty(
      this.#searchParamsPrototype,
      this.#engine.wellKnownSymbol("iterator"),
      entries,
      MEMBER_PROPERTY,
    );
    this.#method(this.#searchParamsPrototype, "toString", 0, (thisValue) => {
      const params = this.#params(thisValue);
      return params === null
        ? this.#invalidReceiver("URLSearchParams", "toString")
        : this.#primitive(params.toString());
    });
  }

  #installURLSearchParamsIteratorMembers(): void {
    this.#method(
      this.#searchParamsIteratorPrototype,
      "next",
      0,
      (thisValue) => {
        const iterator = this.#paramsIterator(thisValue);
        if (iterator === null) {
          return this.#typeError("Invalid URLSearchParams Iterator receiver");
        }
        const result = iterator.next();
        const value = result.done
          ? this.#engine.fromPrimitive(undefined)
          : typeof result.value === "string"
            ? this.#engine.fromPrimitive(result.value)
            : this.#engine.createArray(
                this.#realm,
                result.value.map((item) => this.#engine.fromPrimitive(item)),
              );
        const object = this.#engine.createObject(
          this.#realm,
          this.#engine.objectPrototype(this.#realm),
        );
        this.#engine.defineDataProperty(object, "value", value, {
          configurable: true,
          enumerable: true,
          writable: true,
        });
        this.#engine.defineDataProperty(
          object,
          "done",
          this.#engine.fromPrimitive(result.done ?? false),
          {
            configurable: true,
            enumerable: true,
            writable: true,
          },
        );
        return normal(object);
      },
    );
  }

  #searchParamsIterator(
    thisValue: EngineValue,
    kind: "keys" | "values" | "entries",
  ): EngineResult<EngineValue> {
    const params = this.#params(thisValue);
    if (params === null) {
      return this.#invalidReceiver("URLSearchParams", kind);
    }
    const iterator = params[kind]() as SearchParamsIterator;
    const object = this.#engine.createObject(
      this.#realm,
      this.#searchParamsIteratorPrototype,
    );
    this.#searchParamsIterators.set(object, iterator);
    return normal(object);
  }

  #createURLSearchParams(
    value: EngineValue | undefined,
  ): EngineResult<URLSearchParams> {
    if (value === undefined || this.#engine.isUndefined(value)) {
      return normal(new URLSearchParams());
    }
    const object = this.#engine.asObject(value);
    if (object === null) {
      const string = this.#scalarString(value);
      return string.type === "throw"
        ? string
        : normal(new URLSearchParams(string.value));
    }

    const iteratorValues = this.#iteratorValues(object);
    if (iteratorValues.type === "throw") {
      return iteratorValues;
    }
    if (iteratorValues.value !== null) {
      const pairs: SearchParamsPair[] = [];
      for (const pairValue of iteratorValues.value) {
        const pairObject = this.#engine.asObject(pairValue);
        if (pairObject === null) {
          return this.#typeError(
            "Each query pair must be an iterable containing two items",
          );
        }
        const pair = this.#iteratorValues(pairObject);
        if (pair.type === "throw") {
          return pair;
        }
        if (pair.value?.length !== 2) {
          return this.#typeError(
            "Each query pair must be an iterable containing two items",
          );
        }
        const nameValue = pair.value[0];
        const pairItemValue = pair.value[1];
        if (nameValue === undefined || pairItemValue === undefined) {
          return this.#typeError(
            "Each query pair must be an iterable containing two items",
          );
        }
        const name = this.#scalarString(nameValue);
        if (name.type === "throw") {
          return name;
        }
        const itemValue = this.#scalarString(pairItemValue);
        if (itemValue.type === "throw") {
          return itemValue;
        }
        pairs.push([name.value, itemValue.value]);
      }
      return normal(new URLSearchParams(pairs));
    }

    const names = this.#engine.ownEnumerablePropertyNames(this.#realm, object);
    if (names.type === "throw") {
      return names;
    }
    const record = new Map<string, string>();
    for (const name of names.value) {
      const property = this.#engine.get(this.#realm, object, name);
      if (property.type === "throw") {
        return property;
      }
      const itemValue = this.#scalarString(property.value);
      if (itemValue.type === "throw") {
        return itemValue;
      }
      record.set(name.toWellFormed(), itemValue.value);
    }
    return normal(new URLSearchParams(record));
  }

  #iteratorValues(
    object: EngineObject,
  ): EngineResult<readonly EngineValue[] | null> {
    const methodValue = this.#engine.get(
      this.#realm,
      object,
      this.#engine.wellKnownSymbol("iterator"),
    );
    if (methodValue.type === "throw") {
      return methodValue;
    }
    if (
      this.#engine.isUndefined(methodValue.value) ||
      this.#engine.isNull(methodValue.value)
    ) {
      return normal(null);
    }
    const method = this.#engine.asCallable(methodValue.value);
    if (method === null) {
      return this.#typeError("The iterator property is not callable");
    }
    const iteratorValue = this.#engine.call(this.#realm, method, object, []);
    if (iteratorValue.type === "throw") {
      return iteratorValue;
    }
    const iterator = this.#engine.asObject(iteratorValue.value);
    if (iterator === null) {
      return this.#typeError("The iterator did not return an object");
    }
    const nextValue = this.#engine.get(this.#realm, iterator, "next");
    if (nextValue.type === "throw") {
      return nextValue;
    }
    const next = this.#engine.asCallable(nextValue.value);
    if (next === null) {
      return this.#typeError("The iterator next property is not callable");
    }

    const values: EngineValue[] = [];
    for (;;) {
      const resultValue = this.#engine.call(this.#realm, next, iterator, []);
      if (resultValue.type === "throw") {
        return resultValue;
      }
      const result = this.#engine.asObject(resultValue.value);
      if (result === null) {
        return this.#typeError("Iterator result is not an object");
      }
      const done = this.#engine.get(this.#realm, result, "done");
      if (done.type === "throw") {
        return done;
      }
      if (this.#engine.toBoolean(done.value)) {
        return normal(values);
      }
      const item = this.#engine.get(this.#realm, result, "value");
      if (item.type === "throw") {
        return item;
      }
      values.push(item.value);
    }
  }

  #wrapURL(url: URL): EngineObject {
    const existing = this.#urlObjects.get(url);
    if (existing !== undefined) {
      return existing;
    }
    const object = this.#engine.createObject(this.#realm, this.#urlPrototype);
    this.#urlObjects.set(url, object);
    this.#urls.set(object, url);
    return object;
  }

  #wrapURLSearchParams(params: URLSearchParams): EngineObject {
    const existing = this.#searchParamsObjects.get(params);
    if (existing !== undefined) {
      return existing;
    }
    const object = this.#engine.createObject(
      this.#realm,
      this.#searchParamsPrototype,
    );
    this.#searchParamsObjects.set(params, object);
    this.#searchParams.set(object, params);
    return object;
  }

  #url(value: EngineValue): URL | null {
    const object = this.#engine.asObject(value);
    return object === null ? null : (this.#urls.get(object) ?? null);
  }

  #params(value: EngineValue): URLSearchParams | null {
    const object = this.#engine.asObject(value);
    return object === null ? null : (this.#searchParams.get(object) ?? null);
  }

  #paramsIterator(value: EngineValue): SearchParamsIterator | null {
    const object = this.#engine.asObject(value);
    return object === null
      ? null
      : (this.#searchParamsIterators.get(object) ?? null);
  }

  #method(
    object: EngineObject,
    name: string,
    length: number,
    callback: EngineHostFunction,
  ): EngineCallable {
    const method = this.#engine.createFunction(
      this.#realm,
      name,
      length,
      callback,
    );
    this.#engine.defineDataProperty(object, name, method, MEMBER_PROPERTY);
    return method;
  }

  #attribute(
    prototype: EngineObject,
    name: string,
    getter: EngineHostFunction,
    setter: EngineHostFunction | null = null,
  ): void {
    this.#engine.defineAccessorProperty(
      prototype,
      name,
      this.#engine.createFunction(this.#realm, `get ${name}`, 0, getter),
      setter === null
        ? null
        : this.#engine.createFunction(this.#realm, `set ${name}`, 1, setter),
      ATTRIBUTE_PROPERTY,
    );
  }

  #tag(prototype: EngineObject, value: string): void {
    this.#engine.defineDataProperty(
      prototype,
      this.#engine.wellKnownSymbol("toStringTag"),
      this.#engine.fromPrimitive(value),
      TAG_PROPERTY,
    );
  }

  #requiredString(
    argumentsList: readonly EngineValue[],
    index: number,
    operation: string,
  ): EngineResult<string> {
    const value = argumentsList[index];
    return value === undefined
      ? this.#typeError(
          `${operation} requires ${String(index + 1)} argument(s)`,
        )
      : this.#scalarString(value);
  }

  #optionalString(
    argumentsList: readonly EngineValue[],
    index: number,
  ): EngineResult<string | undefined> {
    const value = argumentsList[index];
    return value === undefined || this.#engine.isUndefined(value)
      ? normal(undefined)
      : this.#scalarString(value);
  }

  #scalarString(value: EngineValue): EngineResult<string> {
    const converted = this.#engine.toString(this.#realm, value);
    return converted.type === "throw"
      ? converted
      : normal(converted.value.toWellFormed());
  }

  #primitive(
    value: undefined | null | boolean | string | number | bigint,
  ): EngineResult<EngineValue> {
    return normal(this.#engine.fromPrimitive(value));
  }

  #undefined(): EngineResult<EngineValue> {
    return this.#primitive(undefined);
  }

  #invalidReceiver(interfaceName: string, member: string): EngineResult<never> {
    return this.#typeError(`Invalid ${interfaceName} receiver for ${member}`);
  }

  #typeError(message: string): EngineResult<never> {
    return thrown(this.#engine.createTypeError(this.#realm, message));
  }
}
