import { normal } from "./adapter.js";
import type {
  EngineRealm,
  EngineResult,
  EngineValue,
  JavaScriptEngineAdapter,
} from "./adapter.js";
import type {
  FormDataIteratorKind,
  FormDataRealmBindingContext,
} from "./form-data-realm-binding-context.js";
import type { RealmBindingContext } from "./realm-binding-context.js";

interface InstallationState {
  readonly engine: JavaScriptEngineAdapter;
  readonly realm: EngineRealm;
  readonly context: RealmBindingContext;
  readonly domain: FormDataRealmBindingContext;
}

export function installFormDataInterface(
  context: RealmBindingContext,
  domain: FormDataRealmBindingContext,
): void {
  const state = {
    engine: context.engine,
    realm: context.realm,
    context,
    domain,
  };
  installInterface(state);
  installMembers(state);
  installIteratorMembers(state);
}

function installInterface(state: InstallationState): void {
  const constructor = state.engine.createConstructor(
    state.realm,
    "FormData",
    0,
    (_thisValue, argumentsList) => {
      const form = argumentsList[0];
      if (form !== undefined && !state.engine.isUndefined(form)) {
        return state.context.typeError(
          "Constructing FormData from a form is not supported",
        );
      }
      return normal(state.domain.create());
    },
  );
  state.context.installInterface(
    "FormData",
    constructor,
    state.domain.formDataPrototype,
  );
  state.context.tag(state.domain.formDataPrototype, "FormData");
  state.context.tag(state.domain.iteratorPrototype, "FormData Iterator");
}

function installMembers(state: InstallationState): void {
  state.context.method(
    state.domain.formDataPrototype,
    "append",
    2,
    (thisValue, argumentsList) => {
      const formData = state.domain.value(thisValue);
      if (formData === null) {
        return state.context.invalidReceiver("FormData", "append");
      }
      const name = requiredString(state, argumentsList, 0, "append");
      if (name.type === "throw") {
        return name;
      }
      const value = requiredString(state, argumentsList, 1, "append");
      if (value.type === "throw") {
        return value;
      }
      formData.append(name.value, value.value);
      return state.context.undefined();
    },
  );
  state.context.method(
    state.domain.formDataPrototype,
    "delete",
    1,
    (thisValue, argumentsList) => {
      const formData = state.domain.value(thisValue);
      if (formData === null) {
        return state.context.invalidReceiver("FormData", "delete");
      }
      const name = requiredString(state, argumentsList, 0, "delete");
      if (name.type === "throw") {
        return name;
      }
      formData.delete(name.value);
      return state.context.undefined();
    },
  );
  state.context.method(
    state.domain.formDataPrototype,
    "get",
    1,
    (thisValue, argumentsList) => {
      const formData = state.domain.value(thisValue);
      if (formData === null) {
        return state.context.invalidReceiver("FormData", "get");
      }
      const name = requiredString(state, argumentsList, 0, "get");
      return name.type === "throw"
        ? name
        : state.context.primitive(formData.get(name.value));
    },
  );
  state.context.method(
    state.domain.formDataPrototype,
    "getAll",
    1,
    (thisValue, argumentsList) => {
      const formData = state.domain.value(thisValue);
      if (formData === null) {
        return state.context.invalidReceiver("FormData", "getAll");
      }
      const name = requiredString(state, argumentsList, 0, "getAll");
      return name.type === "throw"
        ? name
        : normal(
            state.engine.createArray(
              state.realm,
              formData
                .getAll(name.value)
                .map((value) => state.engine.fromPrimitive(value)),
            ),
          );
    },
  );
  state.context.method(
    state.domain.formDataPrototype,
    "has",
    1,
    (thisValue, argumentsList) => {
      const formData = state.domain.value(thisValue);
      if (formData === null) {
        return state.context.invalidReceiver("FormData", "has");
      }
      const name = requiredString(state, argumentsList, 0, "has");
      return name.type === "throw"
        ? name
        : state.context.primitive(formData.has(name.value));
    },
  );
  state.context.method(
    state.domain.formDataPrototype,
    "set",
    2,
    (thisValue, argumentsList) => {
      const formData = state.domain.value(thisValue);
      if (formData === null) {
        return state.context.invalidReceiver("FormData", "set");
      }
      const name = requiredString(state, argumentsList, 0, "set");
      if (name.type === "throw") {
        return name;
      }
      const value = requiredString(state, argumentsList, 1, "set");
      if (value.type === "throw") {
        return value;
      }
      formData.set(name.value, value.value);
      return state.context.undefined();
    },
  );
  state.context.method(
    state.domain.formDataPrototype,
    "forEach",
    1,
    (thisValue, argumentsList) => {
      const formData = state.domain.value(thisValue);
      if (formData === null) {
        return state.context.invalidReceiver("FormData", "forEach");
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
      const platformObject = state.domain.wrap(formData);
      for (const [name, value] of formData) {
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
  state.context.method(state.domain.formDataPrototype, "keys", 0, (thisValue) =>
    formDataIterator(state, thisValue, "keys"),
  );
  state.context.method(
    state.domain.formDataPrototype,
    "values",
    0,
    (thisValue) => formDataIterator(state, thisValue, "values"),
  );
  const entries = state.context.method(
    state.domain.formDataPrototype,
    "entries",
    0,
    (thisValue) => formDataIterator(state, thisValue, "entries"),
  );
  state.context.dataProperty(
    state.domain.formDataPrototype,
    state.engine.wellKnownSymbol("iterator"),
    entries,
  );
}

function installIteratorMembers(state: InstallationState): void {
  state.context.method(
    state.domain.iteratorPrototype,
    "next",
    0,
    (thisValue) => {
      const iterator = state.domain.iterator(thisValue);
      if (iterator === null) {
        return state.context.typeError("Invalid FormData Iterator receiver");
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
        { configurable: true, enumerable: true, writable: true },
      );
      return normal(object);
    },
  );
}

function formDataIterator(
  state: InstallationState,
  thisValue: EngineValue,
  kind: FormDataIteratorKind,
): EngineResult<EngineValue> {
  const formData = state.domain.value(thisValue);
  return formData === null
    ? state.context.invalidReceiver("FormData", kind)
    : normal(state.domain.wrapIterator(formData, kind));
}

function requiredString(
  state: InstallationState,
  argumentsList: readonly EngineValue[],
  index: number,
  operation: string,
): EngineResult<string> {
  return state.context.requiredString(argumentsList, index, operation, true);
}
