import { IDNA_MAPPING_TABLE, type IDNAMappingRange } from "./idna-mapping.js";
import {
  IDNA_BIDI_CLASS_RANGES,
  IDNA_JOINING_TYPE_RANGES,
  IDNA_VIRAMA_RANGES,
  type IDNACodePointRange,
  type IDNAPropertyRange,
} from "./idna-properties.js";
import { punycodeDecode, punycodeEncode } from "./punycode.js";

function propertyValue(
  point: number,
  ranges: readonly IDNAPropertyRange[],
  fallback: string,
): string {
  let low = 0;
  let high = ranges.length - 1;
  while (low <= high) {
    const middle = (low + high) >> 1;
    const range = ranges[middle];
    if (range === undefined) {
      return fallback;
    }
    if (point < range.start) {
      high = middle - 1;
    } else if (point > range.end) {
      low = middle + 1;
    } else {
      return range.value;
    }
  }
  return fallback;
}

function mappingRule(point: number): IDNAMappingRange | null {
  let low = 0;
  let high = IDNA_MAPPING_TABLE.length - 1;
  while (low <= high) {
    const middle = (low + high) >> 1;
    const rule = IDNA_MAPPING_TABLE[middle];
    if (rule === undefined) {
      return null;
    }
    if (point < rule.start) {
      high = middle - 1;
    } else if (point > rule.end) {
      low = middle + 1;
    } else {
      return rule;
    }
  }
  return null;
}

function mapDomain(input: string): string | null {
  const output: number[] = [];
  for (const character of input) {
    const point = character.codePointAt(0) ?? 0;
    const rule = mappingRule(point);
    if (rule === null || rule.status === "disallowed") {
      return null;
    }
    if (rule.status === "mapped") {
      output.push(...rule.mapping);
    } else if (rule.status !== "ignored") {
      output.push(point);
    }
  }
  return String.fromCodePoint(...output).normalize("NFC");
}

function codePoint(character: string): number {
  return character.codePointAt(0) ?? 0;
}

function rangeContains(
  point: number,
  ranges: readonly IDNACodePointRange[],
): boolean {
  let low = 0;
  let high = ranges.length - 1;
  while (low <= high) {
    const middle = (low + high) >> 1;
    const range = ranges[middle];
    if (range === undefined) {
      return false;
    }
    if (point < range.start) {
      high = middle - 1;
    } else if (point > range.end) {
      low = middle + 1;
    } else {
      return true;
    }
  }
  return false;
}

function isVirama(character: string): boolean {
  const point = codePoint(character);
  return rangeContains(point, IDNA_VIRAMA_RANGES);
}

function joiningType(character: string): string {
  return propertyValue(codePoint(character), IDNA_JOINING_TYPE_RANGES, "U");
}

function bidiClass(character: string): string {
  return propertyValue(codePoint(character), IDNA_BIDI_CLASS_RANGES, "L");
}

function validJoiners(label: string): boolean {
  const characters = Array.from(label);
  for (const [index, character] of characters.entries()) {
    if (character !== "\u200C" && character !== "\u200D") {
      continue;
    }
    const previous = characters[index - 1] ?? "";
    if (isVirama(previous)) {
      continue;
    }
    if (character === "\u200C") {
      let before = index - 1;
      while (before >= 0 && joiningType(characters[before] ?? "") === "T") {
        before -= 1;
      }
      let after = index + 1;
      while (
        after < characters.length &&
        joiningType(characters[after] ?? "") === "T"
      ) {
        after += 1;
      }
      const beforeType = joiningType(characters[before] ?? "");
      const afterType = joiningType(characters[after] ?? "");
      if (
        (beforeType === "L" || beforeType === "D") &&
        (afterType === "R" || afterType === "D")
      ) {
        continue;
      }
    }
    return false;
  }
  return true;
}

function validContextO(label: string): boolean {
  const characters = Array.from(label);
  for (const [index, character] of characters.entries()) {
    if (
      character === "\u00B7" &&
      (characters[index - 1] !== "l" || characters[index + 1] !== "l")
    ) {
      return false;
    }
    if (
      character === "\u0375" &&
      !/\p{Script_Extensions=Greek}/u.test(characters[index + 1] ?? "")
    ) {
      return false;
    }
    if (
      (character === "\u05F3" || character === "\u05F4") &&
      !/\p{Script_Extensions=Hebrew}/u.test(characters[index - 1] ?? "")
    ) {
      return false;
    }
    if (
      character === "\u30FB" &&
      !/[\p{Script_Extensions=Hiragana}\p{Script_Extensions=Katakana}\p{Script_Extensions=Han}]/u.test(
        label,
      )
    ) {
      return false;
    }
  }
  return !(/[\u0660-\u0669]/u.test(label) && /[\u06F0-\u06F9]/u.test(label));
}

function validBidiLabel(label: string): boolean {
  const classes = Array.from(label, bidiClass);
  const first = classes[0];
  const withoutTrailingMarks = classes.toSpliced(
    classes.findLastIndex((value) => value !== "NSM") + 1,
  );
  const last = withoutTrailingMarks.at(-1);
  if (first === "L") {
    return (
      classes.every((value) =>
        ["L", "EN", "ES", "CS", "ET", "ON", "BN", "NSM"].includes(value),
      ) &&
      (last === "L" || last === "EN")
    );
  }
  if (first !== "R" && first !== "AL") {
    return false;
  }
  return (
    classes.every((value) =>
      ["R", "AL", "AN", "EN", "ES", "CS", "ET", "ON", "BN", "NSM"].includes(
        value,
      ),
    ) &&
    ["R", "AL", "EN", "AN"].includes(last ?? "") &&
    !(classes.includes("EN") && classes.includes("AN"))
  );
}

function validBidiDomain(labels: readonly string[]): boolean {
  const bidiDomain = labels.some((label) =>
    Array.from(label, bidiClass).some((value) =>
      ["R", "AL", "AN"].includes(value),
    ),
  );
  return (
    !bidiDomain ||
    labels.every((label) => label === "" || validBidiLabel(label))
  );
}

function validLabel(label: string): boolean {
  return (
    label !== "" &&
    !/^\p{Mark}/u.test(label) &&
    validJoiners(label) &&
    validContextO(label) &&
    Array.from(label).every((character) => {
      const point = character.codePointAt(0) ?? 0;
      const status = mappingRule(point)?.status;
      return status === "valid" || status === "deviation";
    })
  );
}

export function domainToASCII(input: string): string | null {
  if (!/[^\x00-\x7F]/u.test(input)) {
    return input.toLowerCase();
  }
  const mapped = mapDomain(input);
  if (mapped === null) {
    return null;
  }
  const output: string[] = [];
  const unicodeLabels: string[] = [];
  for (const label of mapped.split(".")) {
    if (label === "") {
      output.push("");
      unicodeLabels.push("");
      continue;
    }
    if (/^xn--/iu.test(label)) {
      const decoded = punycodeDecode(label.slice(4));
      if (decoded === null || !validLabel(decoded)) {
        return null;
      }
      unicodeLabels.push(decoded);
      output.push(`xn--${punycodeEncode(decoded)}`);
    } else if (!validLabel(label)) {
      return null;
    } else {
      unicodeLabels.push(label);
      output.push(
        /[^\x00-\x7F]/u.test(label) ? `xn--${punycodeEncode(label)}` : label,
      );
    }
  }
  return validBidiDomain(unicodeLabels) ? output.join(".") : null;
}
