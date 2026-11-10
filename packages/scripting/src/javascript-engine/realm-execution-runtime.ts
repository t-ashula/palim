import { normal } from "./adapter.js";
import type {
  EngineCallable,
  EngineObject,
  EngineRealm,
  EngineResult,
  EngineValue,
  JavaScriptEngineAdapter,
} from "./adapter.js";

export interface RealmExecutionSettings {
  readonly realm: EngineRealm;
}

export type CallbackExceptionBehavior = "rethrow" | "report";

export interface CallbackRecord {
  readonly callable: EngineCallable;
  readonly associatedRealm: EngineRealm;
  readonly relevantSettings: RealmExecutionSettings | null;
  readonly incumbentSettings: RealmExecutionSettings | null;
  readonly exceptionBehavior: CallbackExceptionBehavior;
  readonly reportException: ((value: EngineValue) => void) | null;
}

export interface CallbackRecordOptions {
  readonly exceptionBehavior?: CallbackExceptionBehavior;
  readonly reportException?: (value: EngineValue) => void;
}

interface ExecutionScope {
  readonly currentSettings: RealmExecutionSettings;
  readonly incumbentSettings: RealmExecutionSettings;
}

export class RealmExecutionRuntime {
  readonly #settings = new WeakMap<EngineRealm, RealmExecutionSettings>();
  readonly #scopes: ExecutionScope[] = [];

  constructor(
    readonly engine: JavaScriptEngineAdapter,
    readonly onOutermostExit: () => void = () => undefined,
  ) {}

  get currentSettings(): RealmExecutionSettings | null {
    return this.#scopes.at(-1)?.currentSettings ?? null;
  }

  get entrySettings(): RealmExecutionSettings | null {
    return this.#scopes[0]?.currentSettings ?? null;
  }

  get incumbentSettings(): RealmExecutionSettings | null {
    return this.#scopes.at(-1)?.incumbentSettings ?? null;
  }

  registerSettings(settings: RealmExecutionSettings): void {
    const existing = this.#settings.get(settings.realm);
    if (existing !== undefined && existing !== settings) {
      throw new TypeError("The realm already has execution settings");
    }
    this.#settings.set(settings.realm, settings);
  }

  settingsForRealm(realm: EngineRealm): RealmExecutionSettings | null {
    return this.#settings.get(realm) ?? null;
  }

  run<T>(
    settings: RealmExecutionSettings,
    incumbentSettings: RealmExecutionSettings,
    callback: () => T,
  ): T {
    const scope = { currentSettings: settings, incumbentSettings };
    this.#scopes.push(scope);
    try {
      return callback();
    } finally {
      const removed = this.#scopes.pop();
      if (removed !== scope) {
        throw new TypeError("Realm execution scope is inconsistent");
      }
      if (this.#scopes.length === 0) {
        this.onOutermostExit();
      }
    }
  }

  createCallbackRecord(
    operationRealm: EngineRealm,
    callable: EngineCallable,
    options: CallbackRecordOptions = {},
  ): EngineResult<CallbackRecord> {
    const associatedRealm = this.engine.callableRealm(operationRealm, callable);
    if (associatedRealm.type === "throw") {
      return associatedRealm;
    }
    const exceptionBehavior = options.exceptionBehavior ?? "rethrow";
    const reportException = options.reportException ?? null;
    if (exceptionBehavior === "report" && reportException === null) {
      throw new TypeError("Reporting callbacks require an exception reporter");
    }
    return normal({
      callable,
      associatedRealm: associatedRealm.value,
      relevantSettings: this.settingsForRealm(associatedRealm.value),
      incumbentSettings: this.incumbentSettings ?? this.currentSettings,
      exceptionBehavior,
      reportException,
    });
  }

  invokeCallback(
    callback: CallbackRecord,
    thisValue: EngineValue,
    argumentsList: readonly EngineValue[],
  ): EngineResult<EngineValue> {
    const invoke = (): EngineResult<EngineValue> =>
      this.engine.call(
        callback.associatedRealm,
        callback.callable,
        thisValue,
        argumentsList,
      );
    const relevantSettings = callback.relevantSettings;
    const result =
      relevantSettings === null
        ? invoke()
        : this.run(
            relevantSettings,
            callback.incumbentSettings ?? relevantSettings,
            invoke,
          );
    if (result.type === "normal" || callback.exceptionBehavior === "rethrow") {
      return result;
    }
    callback.reportException?.(result.value);
    return normal(this.engine.fromPrimitive(undefined));
  }

  invokeConstructor(
    callback: CallbackRecord,
    argumentsList: readonly EngineValue[],
  ): EngineResult<EngineObject> {
    if (callback.exceptionBehavior !== "rethrow") {
      throw new TypeError("Constructor callbacks must rethrow exceptions");
    }
    const invoke = (): EngineResult<EngineObject> =>
      this.engine.construct(
        callback.associatedRealm,
        callback.callable,
        argumentsList,
      );
    const relevantSettings = callback.relevantSettings;
    return relevantSettings === null
      ? invoke()
      : this.run(
          relevantSettings,
          callback.incumbentSettings ?? relevantSettings,
          invoke,
        );
  }

  call(
    operationRealm: EngineRealm,
    callable: EngineCallable,
    thisValue: EngineValue,
    argumentsList: readonly EngineValue[],
  ): EngineResult<EngineValue> {
    const callback = this.createCallbackRecord(operationRealm, callable);
    return callback.type === "throw"
      ? callback
      : this.invokeCallback(callback.value, thisValue, argumentsList);
  }
}
