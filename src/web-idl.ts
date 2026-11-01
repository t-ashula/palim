export function requireArguments(actual: number, required: number): void {
  if (actual < required) {
    throw new TypeError(
      `${String(required)} argument${required === 1 ? "" : "s"} required, but only ${String(actual)} present`,
    );
  }
}
