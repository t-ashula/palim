const BASE = 36;
const T_MIN = 1;
const T_MAX = 26;
const SKEW = 38;
const DAMP = 700;
const INITIAL_BIAS = 72;
const INITIAL_N = 128;

function adapt(delta: number, points: number, first: boolean): number {
  let value = first ? Math.floor(delta / DAMP) : Math.floor(delta / 2);
  value += Math.floor(value / points);
  let offset = 0;
  while (value > 455) {
    value = Math.floor(value / 35);
    offset += BASE;
  }
  return offset + Math.floor((36 * value) / (value + SKEW));
}

function digit(value: number): string {
  return String.fromCharCode(value < 26 ? value + 97 : value + 22);
}

export function punycodeEncode(input: string): string {
  const points = Array.from(input, (value) => value.codePointAt(0) ?? 0xfffd);
  let output = points
    .filter((point) => point < 0x80)
    .map((point) => String.fromCodePoint(point))
    .join("");
  const basic = output.length;
  let handled = basic;
  if (basic > 0 && handled < points.length) {
    output += "-";
  }
  let n = INITIAL_N;
  let delta = 0;
  let bias = INITIAL_BIAS;
  while (handled < points.length) {
    const next = Math.min(...points.filter((point) => point >= n));
    delta += (next - n) * (handled + 1);
    n = next;
    for (const point of points) {
      if (point < n) {
        delta += 1;
      } else if (point === n) {
        let value = delta;
        for (let k = BASE; ; k += BASE) {
          const threshold =
            k <= bias + T_MIN ? T_MIN : k >= bias + T_MAX ? T_MAX : k - bias;
          if (value < threshold) {
            break;
          }
          output += digit(
            threshold + ((value - threshold) % (BASE - threshold)),
          );
          value = Math.floor((value - threshold) / (BASE - threshold));
        }
        output += digit(value);
        bias = adapt(delta, handled + 1, handled === basic);
        delta = 0;
        handled += 1;
      }
    }
    delta += 1;
    n += 1;
  }
  return output;
}

export function punycodeDecode(input: string): string | null {
  const output: number[] = [];
  const delimiter = input.lastIndexOf("-");
  let inputIndex = 0;
  if (delimiter >= 0) {
    for (const character of input.slice(0, delimiter)) {
      const point = character.codePointAt(0) ?? 0;
      if (point >= 0x80) {
        return null;
      }
      output.push(point);
    }
    inputIndex = delimiter + 1;
  }
  let codePoint = INITIAL_N;
  let index = 0;
  let bias = INITIAL_BIAS;
  while (inputIndex < input.length) {
    const previousIndex = index;
    let weight = 1;
    for (let k = BASE; ; k += BASE) {
      const character = input.charCodeAt(inputIndex);
      inputIndex += 1;
      const digit =
        character >= 0x30 && character <= 0x39
          ? character - 0x16
          : character >= 0x41 && character <= 0x5a
            ? character - 0x41
            : character >= 0x61 && character <= 0x7a
              ? character - 0x61
              : BASE;
      if (digit >= BASE || digit > Math.floor((0x7fffffff - index) / weight)) {
        return null;
      }
      index += digit * weight;
      const threshold =
        k <= bias ? T_MIN : k >= bias + T_MAX ? T_MAX : k - bias;
      if (digit < threshold) {
        break;
      }
      const baseMinusThreshold = BASE - threshold;
      if (weight > Math.floor(0x7fffffff / baseMinusThreshold)) {
        return null;
      }
      weight *= baseMinusThreshold;
    }
    const length = output.length + 1;
    bias = adapt(index - previousIndex, length, previousIndex === 0);
    const increment = Math.floor(index / length);
    if (increment > 0x10ffff - codePoint) {
      return null;
    }
    codePoint += increment;
    index %= length;
    output.splice(index, 0, codePoint);
    index += 1;
  }
  try {
    return String.fromCodePoint(...output);
  } catch {
    return null;
  }
}
