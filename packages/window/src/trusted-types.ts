const TRUSTED_TYPE_CONSTRUCTION = Symbol("Trusted Type construction");

export type TrustedTypePolicyCallbackCompletion =
  | { readonly type: "normal"; readonly value: unknown }
  | { readonly type: "throw"; readonly value: unknown };

export type TrustedTypePolicyCallback = (
  input: unknown,
  argumentsList: readonly unknown[],
) => TrustedTypePolicyCallbackCompletion;

export interface TrustedTypePolicyOptions {
  readonly createHTML?: TrustedTypePolicyCallback;
  readonly createScript?: TrustedTypePolicyCallback;
  readonly createScriptURL?: TrustedTypePolicyCallback;
  readonly createParserOptions?: TrustedTypePolicyCallback;
}

abstract class TrustedTypeValue {
  constructor(
    construction: symbol,
    readonly policyName: string,
    readonly data: unknown,
  ) {
    if (construction !== TRUSTED_TYPE_CONSTRUCTION) {
      throw new Error("Trusted Type values must be created by a policy");
    }
  }
}

export class TrustedHTML extends TrustedTypeValue {}
export class TrustedScript extends TrustedTypeValue {}
export class TrustedScriptURL extends TrustedTypeValue {}
export class TrustedHTMLParserOptions extends TrustedTypeValue {}

export type TrustedTypePolicyCompletion<T extends TrustedTypeValue> =
  | { readonly type: "normal"; readonly value: T }
  | { readonly type: "throw"; readonly value: unknown }
  | { readonly type: "missing-callback" }
  | { readonly type: "invalid-parser-options" };

export class TrustedTypePolicy {
  readonly #options: TrustedTypePolicyOptions;

  constructor(
    readonly name: string,
    options: TrustedTypePolicyOptions,
  ) {
    this.#options = options;
  }

  createHTML(
    input: unknown,
    argumentsList: readonly unknown[],
  ): TrustedTypePolicyCompletion<TrustedHTML> {
    return this.#create(
      this.#options.createHTML,
      input,
      argumentsList,
      TrustedHTML,
    );
  }

  createScript(
    input: unknown,
    argumentsList: readonly unknown[],
  ): TrustedTypePolicyCompletion<TrustedScript> {
    return this.#create(
      this.#options.createScript,
      input,
      argumentsList,
      TrustedScript,
    );
  }

  createScriptURL(
    input: unknown,
    argumentsList: readonly unknown[],
  ): TrustedTypePolicyCompletion<TrustedScriptURL> {
    return this.#create(
      this.#options.createScriptURL,
      input,
      argumentsList,
      TrustedScriptURL,
    );
  }

  createParserOptions(
    input: unknown,
    argumentsList: readonly unknown[],
  ): TrustedTypePolicyCompletion<TrustedHTMLParserOptions> {
    return this.#create(
      this.#options.createParserOptions,
      input,
      argumentsList,
      TrustedHTMLParserOptions,
    );
  }

  #create<T extends TrustedTypeValue>(
    callback: TrustedTypePolicyCallback | undefined,
    input: unknown,
    argumentsList: readonly unknown[],
    Value: new (construction: symbol, policyName: string, data: unknown) => T,
  ): TrustedTypePolicyCompletion<T> {
    if (callback === undefined) {
      return { type: "missing-callback" };
    }
    const completion = callback(input, argumentsList);
    if (completion.type === "throw") {
      return completion;
    }
    if (
      Value === TrustedHTMLParserOptions &&
      (completion.value === null || completion.value === undefined)
    ) {
      return { type: "invalid-parser-options" };
    }
    const data = completion.value ?? "";
    return {
      type: "normal",
      value: new Value(TRUSTED_TYPE_CONSTRUCTION, this.name, data),
    };
  }
}

export class TrustedTypePolicyFactory {
  readonly #policyNames = new Set<string>();
  #defaultPolicy: TrustedTypePolicy | null = null;

  get defaultPolicy(): TrustedTypePolicy | null {
    return this.#defaultPolicy;
  }

  createPolicy(
    name: string,
    options: TrustedTypePolicyOptions,
  ): TrustedTypePolicy | null {
    if (name === "default" && this.#defaultPolicy !== null) {
      return null;
    }
    const policy = new TrustedTypePolicy(name, options);
    this.#policyNames.add(name);
    if (name === "default") {
      this.#defaultPolicy = policy;
    }
    return policy;
  }

  isHTML(value: unknown): value is TrustedHTML {
    return value instanceof TrustedHTML;
  }

  isScript(value: unknown): value is TrustedScript {
    return value instanceof TrustedScript;
  }

  isScriptURL(value: unknown): value is TrustedScriptURL {
    return value instanceof TrustedScriptURL;
  }

  isHTMLParserOptions(value: unknown): value is TrustedHTMLParserOptions {
    return value instanceof TrustedHTMLParserOptions;
  }
}
