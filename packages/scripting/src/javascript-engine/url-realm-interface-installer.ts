import { URL, URLSearchParams } from "@palim/core/internal/url/index.js";
import { normal } from "./adapter.js";
import type {
  EngineRealm,
  EngineResult,
  EngineValue,
  JavaScriptEngineAdapter,
} from "./adapter.js";
import type { RealmBindingContext } from "./realm-binding-context.js";
import type { URLRealmBindingContext } from "./url-realm-binding-context.js";
import { type SearchParamsIteratorKind } from "./url-realm-binding-context.js";

type SearchParamsPair = readonly [string, string];

export function installURLInterfaces(
  binding: RealmBindingContext,
  domain: URLRealmBindingContext,
): void {
  const state: URLInterfaceInstallationState = {
    engine: binding.engine,
    realm: binding.realm,
    context: binding,
    domain,
  };
  installInterfaces(state);
  installURLMembers(state);
  installURLSearchParamsMembers(state);
  installURLSearchParamsIteratorMembers(state);
}

interface URLInterfaceInstallationState {
  readonly engine: JavaScriptEngineAdapter;
  readonly realm: EngineRealm;
  readonly context: RealmBindingContext;
  readonly domain: URLRealmBindingContext;
}

function installInterfaces(state: URLInterfaceInstallationState): void {
  const urlConstructor = state.engine.createConstructor(
    state.realm,
    "URL",
    1,
    (_thisValue, argumentsList) => {
      const input = requiredString(state, argumentsList, 0, "URL");
      if (input.type === "throw") {
        return input;
      }
      const base = optionalString(state, argumentsList, 1);
      if (base.type === "throw") {
        return base;
      }
      try {
        return normal(
          state.domain.wrapURL(
            base.value === undefined
              ? new URL(input.value)
              : new URL(input.value, base.value),
          ),
        );
      } catch (error: unknown) {
        if (error instanceof TypeError) {
          return state.context.typeError(error.message);
        }
        throw error;
      }
    },
  );
  state.context.installInterface(
    "URL",
    urlConstructor,
    state.domain.urlPrototype,
  );
  state.context.interfaceProperty("webkitURL", urlConstructor);
  state.context.method(
    urlConstructor,
    "canParse",
    1,
    (_thisValue, argumentsList) => {
      const input = requiredString(state, argumentsList, 0, "canParse");
      if (input.type === "throw") {
        return input;
      }
      const base = optionalString(state, argumentsList, 1);
      return base.type === "throw"
        ? base
        : state.context.primitive(
            base.value === undefined
              ? URL.canParse(input.value)
              : URL.canParse(input.value, base.value),
          );
    },
  );
  state.context.method(
    urlConstructor,
    "parse",
    1,
    (_thisValue, argumentsList) => {
      const input = requiredString(state, argumentsList, 0, "parse");
      if (input.type === "throw") {
        return input;
      }
      const base = optionalString(state, argumentsList, 1);
      if (base.type === "throw") {
        return base;
      }
      const parsed =
        base.value === undefined
          ? URL.parse(input.value)
          : URL.parse(input.value, base.value);
      return normal(
        parsed === null
          ? state.engine.fromPrimitive(null)
          : state.domain.wrapURL(parsed),
      );
    },
  );

  const searchParamsConstructor = state.engine.createConstructor(
    state.realm,
    "URLSearchParams",
    0,
    (_thisValue, argumentsList) => {
      const converted = createURLSearchParams(state, argumentsList[0]);
      return converted.type === "throw"
        ? converted
        : normal(state.domain.wrapSearchParams(converted.value));
    },
  );
  state.context.installInterface(
    "URLSearchParams",
    searchParamsConstructor,
    state.domain.searchParamsPrototype,
  );

  state.context.tag(state.domain.urlPrototype, "URL");
  state.context.tag(state.domain.searchParamsPrototype, "URLSearchParams");
  state.context.tag(
    state.domain.searchParamsIteratorPrototype,
    "URLSearchParams Iterator",
  );
}

function installURLMembers(state: URLInterfaceInstallationState): void {
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
    state.context.attribute(
      state.domain.urlPrototype,
      name,
      (thisValue) => {
        const url = state.domain.url(thisValue);
        return url === null
          ? state.context.invalidReceiver("URL", name)
          : state.context.primitive(url[name]);
      },
      (thisValue, argumentsList) => {
        const url = state.domain.url(thisValue);
        if (url === null) {
          return state.context.invalidReceiver("URL", name);
        }
        const value = requiredString(state, argumentsList, 0, name);
        if (value.type === "throw") {
          return value;
        }
        url[name] = value.value;
        return state.context.undefined();
      },
    );
  }
  state.context.attribute(state.domain.urlPrototype, "origin", (thisValue) => {
    const url = state.domain.url(thisValue);
    return url === null
      ? state.context.invalidReceiver("URL", "origin")
      : state.context.primitive(url.origin);
  });
  state.context.attribute(
    state.domain.urlPrototype,
    "searchParams",
    (thisValue) => {
      const url = state.domain.url(thisValue);
      return url === null
        ? state.context.invalidReceiver("URL", "searchParams")
        : normal(state.domain.wrapSearchParams(url.searchParams));
    },
  );
  state.context.method(state.domain.urlPrototype, "toJSON", 0, (thisValue) => {
    const url = state.domain.url(thisValue);
    return url === null
      ? state.context.invalidReceiver("URL", "toJSON")
      : state.context.primitive(url.toJSON());
  });
  state.context.method(
    state.domain.urlPrototype,
    "toString",
    0,
    (thisValue) => {
      const url = state.domain.url(thisValue);
      return url === null
        ? state.context.invalidReceiver("URL", "toString")
        : state.context.primitive(url.toString());
    },
  );
}

function installURLSearchParamsMembers(
  state: URLInterfaceInstallationState,
): void {
  state.context.attribute(
    state.domain.searchParamsPrototype,
    "size",
    (thisValue) => {
      const params = state.domain.params(thisValue);
      return params === null
        ? state.context.invalidReceiver("URLSearchParams", "size")
        : state.context.primitive(params.size);
    },
  );

  state.context.method(
    state.domain.searchParamsPrototype,
    "append",
    2,
    (thisValue, argumentsList) => {
      const params = state.domain.params(thisValue);
      if (params === null) {
        return state.context.invalidReceiver("URLSearchParams", "append");
      }
      const name = requiredString(state, argumentsList, 0, "append");
      if (name.type === "throw") {
        return name;
      }
      const value = requiredString(state, argumentsList, 1, "append");
      if (value.type === "throw") {
        return value;
      }
      params.append(name.value, value.value);
      return state.context.undefined();
    },
  );
  state.context.method(
    state.domain.searchParamsPrototype,
    "delete",
    1,
    (thisValue, argumentsList) => {
      const params = state.domain.params(thisValue);
      if (params === null) {
        return state.context.invalidReceiver("URLSearchParams", "delete");
      }
      const name = requiredString(state, argumentsList, 0, "delete");
      if (name.type === "throw") {
        return name;
      }
      const value = optionalString(state, argumentsList, 1);
      if (value.type === "throw") {
        return value;
      }
      if (value.value === undefined) {
        params.delete(name.value);
      } else {
        params.delete(name.value, value.value);
      }
      return state.context.undefined();
    },
  );
  state.context.method(
    state.domain.searchParamsPrototype,
    "get",
    1,
    (thisValue, argumentsList) => {
      const params = state.domain.params(thisValue);
      if (params === null) {
        return state.context.invalidReceiver("URLSearchParams", "get");
      }
      const name = requiredString(state, argumentsList, 0, "get");
      return name.type === "throw"
        ? name
        : state.context.primitive(params.get(name.value));
    },
  );
  state.context.method(
    state.domain.searchParamsPrototype,
    "getAll",
    1,
    (thisValue, argumentsList) => {
      const params = state.domain.params(thisValue);
      if (params === null) {
        return state.context.invalidReceiver("URLSearchParams", "getAll");
      }
      const name = requiredString(state, argumentsList, 0, "getAll");
      return name.type === "throw"
        ? name
        : normal(
            state.engine.createArray(
              state.realm,
              params
                .getAll(name.value)
                .map((value) => state.engine.fromPrimitive(value)),
            ),
          );
    },
  );
  state.context.method(
    state.domain.searchParamsPrototype,
    "has",
    1,
    (thisValue, argumentsList) => {
      const params = state.domain.params(thisValue);
      if (params === null) {
        return state.context.invalidReceiver("URLSearchParams", "has");
      }
      const name = requiredString(state, argumentsList, 0, "has");
      if (name.type === "throw") {
        return name;
      }
      const value = optionalString(state, argumentsList, 1);
      if (value.type === "throw") {
        return value;
      }
      return state.context.primitive(
        value.value === undefined
          ? params.has(name.value)
          : params.has(name.value, value.value),
      );
    },
  );
  state.context.method(
    state.domain.searchParamsPrototype,
    "set",
    2,
    (thisValue, argumentsList) => {
      const params = state.domain.params(thisValue);
      if (params === null) {
        return state.context.invalidReceiver("URLSearchParams", "set");
      }
      const name = requiredString(state, argumentsList, 0, "set");
      if (name.type === "throw") {
        return name;
      }
      const value = requiredString(state, argumentsList, 1, "set");
      if (value.type === "throw") {
        return value;
      }
      params.set(name.value, value.value);
      return state.context.undefined();
    },
  );
  state.context.method(
    state.domain.searchParamsPrototype,
    "sort",
    0,
    (thisValue) => {
      const params = state.domain.params(thisValue);
      if (params === null) {
        return state.context.invalidReceiver("URLSearchParams", "sort");
      }
      params.sort();
      return state.context.undefined();
    },
  );
  state.context.method(
    state.domain.searchParamsPrototype,
    "forEach",
    1,
    (thisValue, argumentsList) => {
      const params = state.domain.params(thisValue);
      if (params === null) {
        return state.context.invalidReceiver("URLSearchParams", "forEach");
      }
      const callback = state.context.requiredCallable(
        argumentsList[0],
        "forEach callback is not callable",
      );
      if (callback.type === "throw") {
        return callback;
      }
      const callbackThis =
        argumentsList[1] ?? state.engine.fromPrimitive(undefined);
      const platformObject = state.domain.wrapSearchParams(params);
      for (const [name, value] of params) {
        const result = state.context.invokeCallback(
          callback.value,
          callbackThis,
          [
            state.engine.fromPrimitive(value),
            state.engine.fromPrimitive(name),
            platformObject,
          ],
        );
        if (result.type === "throw") {
          return result;
        }
      }
      return state.context.undefined();
    },
  );
  state.context.method(
    state.domain.searchParamsPrototype,
    "keys",
    0,
    (thisValue) => searchParamsIterator(state, thisValue, "keys"),
  );
  state.context.method(
    state.domain.searchParamsPrototype,
    "values",
    0,
    (thisValue) => searchParamsIterator(state, thisValue, "values"),
  );
  const entries = state.context.method(
    state.domain.searchParamsPrototype,
    "entries",
    0,
    (thisValue) => searchParamsIterator(state, thisValue, "entries"),
  );
  state.context.dataProperty(
    state.domain.searchParamsPrototype,
    state.engine.wellKnownSymbol("iterator"),
    entries,
  );
  state.context.method(
    state.domain.searchParamsPrototype,
    "toString",
    0,
    (thisValue) => {
      const params = state.domain.params(thisValue);
      return params === null
        ? state.context.invalidReceiver("URLSearchParams", "toString")
        : state.context.primitive(params.toString());
    },
  );
}

function installURLSearchParamsIteratorMembers(
  state: URLInterfaceInstallationState,
): void {
  state.context.method(
    state.domain.searchParamsIteratorPrototype,
    "next",
    0,
    (thisValue) => {
      const iterator = state.domain.paramsIterator(thisValue);
      if (iterator === null) {
        return state.context.typeError(
          "Invalid URLSearchParams Iterator receiver",
        );
      }
      const result = iterator.next();
      const value = result.done
        ? state.engine.fromPrimitive(undefined)
        : typeof result.value === "string"
          ? state.engine.fromPrimitive(result.value)
          : state.engine.createArray(
              state.realm,
              result.value.map((item) => state.engine.fromPrimitive(item)),
            );
      const object = state.engine.createObject(
        state.realm,
        state.engine.objectPrototype(state.realm),
      );
      state.engine.initializeDataProperty(object, "value", value, {
        configurable: true,
        enumerable: true,
        writable: true,
      });
      state.engine.initializeDataProperty(
        object,
        "done",
        state.engine.fromPrimitive(result.done ?? false),
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

function searchParamsIterator(
  state: URLInterfaceInstallationState,
  thisValue: EngineValue,
  kind: SearchParamsIteratorKind,
): EngineResult<EngineValue> {
  const params = state.domain.params(thisValue);
  if (params === null) {
    return state.context.invalidReceiver("URLSearchParams", kind);
  }
  return normal(state.domain.wrapSearchParamsIterator(params, kind));
}

function createURLSearchParams(
  state: URLInterfaceInstallationState,
  value: EngineValue | undefined,
): EngineResult<URLSearchParams> {
  if (value === undefined || state.engine.isUndefined(value)) {
    return normal(new URLSearchParams());
  }
  const object = state.engine.asObject(value);
  if (object === null) {
    const string = scalarString(state, value);
    return string.type === "throw"
      ? string
      : normal(new URLSearchParams(string.value));
  }

  const iteratorValues = state.context.iterableValues(object);
  if (iteratorValues.type === "throw") {
    return iteratorValues;
  }
  if (iteratorValues.value !== null) {
    const pairs: SearchParamsPair[] = [];
    for (const pairValue of iteratorValues.value) {
      const pairObject = state.engine.asObject(pairValue);
      if (pairObject === null) {
        return state.context.typeError(
          "Each query pair must be an iterable containing two items",
        );
      }
      const pair = state.context.iterableValues(pairObject);
      if (pair.type === "throw") {
        return pair;
      }
      if (pair.value?.length !== 2) {
        return state.context.typeError(
          "Each query pair must be an iterable containing two items",
        );
      }
      const nameValue = pair.value[0];
      const pairItemValue = pair.value[1];
      if (nameValue === undefined || pairItemValue === undefined) {
        return state.context.typeError(
          "Each query pair must be an iterable containing two items",
        );
      }
      const name = scalarString(state, nameValue);
      if (name.type === "throw") {
        return name;
      }
      const itemValue = scalarString(state, pairItemValue);
      if (itemValue.type === "throw") {
        return itemValue;
      }
      pairs.push([name.value, itemValue.value]);
    }
    return normal(new URLSearchParams(pairs));
  }

  const record = state.context.stringRecord(object, true);
  return record.type === "throw"
    ? record
    : normal(new URLSearchParams(record.value));
}

function requiredString(
  state: URLInterfaceInstallationState,
  argumentsList: readonly EngineValue[],
  index: number,
  operation: string,
): EngineResult<string> {
  return state.context.requiredString(argumentsList, index, operation, true);
}

function optionalString(
  state: URLInterfaceInstallationState,
  argumentsList: readonly EngineValue[],
  index: number,
): EngineResult<string | undefined> {
  return state.context.optionalString(argumentsList[index], undefined, true);
}

function scalarString(
  state: URLInterfaceInstallationState,
  value: EngineValue,
): EngineResult<string> {
  return state.context.string(value, true);
}
