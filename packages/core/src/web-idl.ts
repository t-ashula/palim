export function requireArguments(actual: number, required: number): void {
  if (actual < required) {
    throw new TypeError(
      `${String(required)} argument${required === 1 ? "" : "s"} required, but only ${String(actual)} present`,
    );
  }
}

export function toLong(value: unknown): number {
  const number = Number(value);
  if (!Number.isFinite(number) || number === 0) {
    return 0;
  }
  const integer = Math.trunc(number);
  const unsigned = ((integer % 4_294_967_296) + 4_294_967_296) % 4_294_967_296;
  return unsigned >= 2_147_483_648 ? unsigned - 4_294_967_296 : unsigned;
}
