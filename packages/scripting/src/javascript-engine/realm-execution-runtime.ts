import type {
  EngineCallable,
  EngineJob,
  EngineObject,
  EngineRealm,
  EngineResult,
  EngineScript,
  EngineValue,
  JavaScriptEngineAdapter,
} from "./adapter.js";
import { normal } from "./adapter.js";

export interface RealmExecutionSettings {
  readonly realm: EngineRealm;
  readonly reportException?: (value: EngineValue) => void;
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
  readonly #jobIncumbentSettings = new WeakMap<
    EngineJob,
    RealmExecutionSettings
  >();
  readonly #scriptSettings = new WeakMap<
    EngineScript,
    RealmExecutionSettings
  >();

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

  registerScriptSettings(
    script: EngineScript,
    settings: RealmExecutionSettings,
  ): void {
    this.#scriptSettings.set(script, settings);
  }

  enqueueMicrotask(
    settings: RealmExecutionSettings,
    callback: () => void,
  ): void {
    const job = this.engine.enqueueJob(settings.realm, callback);
    this.#jobIncumbentSettings.set(job, settings);
  }

  performMicrotaskCheckpoint(): void {
    for (;;) {
      const job = this.engine.dequeueJob();
      if (job === null) {
        return;
      }
      const realm = this.engine.jobRealm(job);
      const relevantSettings =
        realm === null ? null : this.settingsForRealm(realm);
      const script = this.engine.jobScript(job);
      const incumbentSettings =
        this.#jobIncumbentSettings.get(job) ??
        (script === null ? null : this.#scriptSettings.get(script)) ??
        relevantSettings;
      const run = (): EngineResult<EngineValue> => this.engine.runJob(job);
      const result =
        relevantSettings === null
          ? run()
          : this.run(
              relevantSettings,
              incumbentSettings ?? relevantSettings,
              run,
            );
      if (result.type === "throw") {
        if (relevantSettings?.reportException === undefined) {
          throw new TypeError("The engine job has no exception reporter");
        }
        relevantSettings.reportException(result.value);
      }
    }
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
