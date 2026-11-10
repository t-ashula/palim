export type CallbackResult<T> =
  | { readonly type: "success"; readonly value: T }
  | { readonly type: "failure" };

export function callbackSuccess<T>(value: T): CallbackResult<T> {
  return { type: "success", value };
}

export function callbackFailure(): CallbackResult<never> {
  return { type: "failure" };
}
