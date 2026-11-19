import { supportsCSSDeclaration } from "./css-properties.js";

export const CSS = {
  escape(value: string): string {
    return serializeIdentifier(value);
  },

  supports(propertyOrCondition: string, value?: string): boolean {
    return value === undefined
      ? evaluateCondition(propertyOrCondition.trim())
      : supportsCSSDeclaration(propertyOrCondition, value);
  },
};

function evaluateCondition(condition: string): boolean {
  if (condition === "") {
    return false;
  }
  const not = /^not\s+/iu.exec(condition);
  if (not !== null) {
    return !evaluateCondition(condition.slice(not[0].length).trim());
  }
  for (const operator of ["or", "and"] as const) {
    const parts = splitAtTopLevel(condition, operator);
    if (parts !== null) {
      if (parts.some((part) => part === "")) {
        return false;
      }
      return operator === "or"
        ? parts.some(evaluateCondition)
        : parts.every(evaluateCondition);
    }
  }
  if (condition.startsWith("(") && enclosesEntireCondition(condition)) {
    return evaluateCondition(condition.slice(1, -1).trim());
  }
  const colon = topLevelColon(condition);
  return colon > 0
    ? supportsCSSDeclaration(
        condition.slice(0, colon),
        condition.slice(colon + 1),
      )
    : false;
}

function splitAtTopLevel(
  condition: string,
  operator: "and" | "or",
): string[] | null {
  let depth = 0;
  let start = 0;
  const parts: string[] = [];
  const pattern = new RegExp(`^\\s+${operator}(?:\\s+|$)`, "iu");
  for (let index = 0; index < condition.length; index += 1) {
    if (condition[index] === "(") {
      depth += 1;
    } else if (condition[index] === ")") {
      depth -= 1;
    } else if (depth === 0) {
      const match = pattern.exec(condition.slice(index));
      if (match !== null) {
        parts.push(condition.slice(start, index).trim());
        index += match[0].length - 1;
        start = index + 1;
      }
    }
    if (depth < 0) {
      return [""];
    }
  }
  if (depth !== 0 || parts.length === 0) {
    return null;
  }
  parts.push(condition.slice(start).trim());
  return parts;
}

function enclosesEntireCondition(condition: string): boolean {
  let depth = 0;
  for (let index = 0; index < condition.length; index += 1) {
    if (condition[index] === "(") {
      depth += 1;
    } else if (condition[index] === ")") {
      depth -= 1;
    }
    if (depth === 0 && index < condition.length - 1) {
      return false;
    }
    if (depth < 0) {
      return false;
    }
  }
  return depth === 0;
}

function topLevelColon(condition: string): number {
  let depth = 0;
  for (let index = 0; index < condition.length; index += 1) {
    if (condition[index] === "(") {
      depth += 1;
    } else if (condition[index] === ")") {
      depth -= 1;
    } else if (condition[index] === ":" && depth === 0) {
      return index;
    }
    if (depth < 0) {
      return -1;
    }
  }
  return -1;
}

function serializeIdentifier(value: string): string {
  let result = "";
  let index = 0;
  for (const character of value) {
    const codePoint = character.codePointAt(0) ?? 0;
    const leadingDigit = index === 0 && codePoint >= 0x30 && codePoint <= 0x39;
    const digitAfterHyphen =
      index === 1 &&
      value.charCodeAt(0) === 0x2d &&
      codePoint >= 0x30 &&
      codePoint <= 0x39;
    if (codePoint === 0) {
      result += "\uFFFD";
    } else if (
      (codePoint >= 0x1 && codePoint <= 0x1f) ||
      codePoint === 0x7f ||
      leadingDigit ||
      digitAfterHyphen
    ) {
      result += `\\${codePoint.toString(16)} `;
    } else if (index === 0 && codePoint === 0x2d && value.length === 1) {
      result += "\\-";
    } else if (
      codePoint >= 0x80 ||
      codePoint === 0x2d ||
      codePoint === 0x5f ||
      (codePoint >= 0x30 && codePoint <= 0x39) ||
      (codePoint >= 0x41 && codePoint <= 0x5a) ||
      (codePoint >= 0x61 && codePoint <= 0x7a)
    ) {
      result += character;
    } else {
      result += `\\${character}`;
    }
    index += character.length;
  }
  return result;
}
