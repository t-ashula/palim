export function isXMLCharacter(codePoint: number): boolean {
  return (
    codePoint === 0x9 ||
    codePoint === 0xa ||
    codePoint === 0xd ||
    (codePoint >= 0x20 && codePoint <= 0xd7ff) ||
    (codePoint >= 0xe000 && codePoint <= 0xfffd) ||
    (codePoint >= 0x10000 && codePoint <= 0x10ffff)
  );
}

export function isXMLNameStart(character: string, allowColon = true): boolean {
  const value = character.codePointAt(0) ?? -1;
  return (
    character === "_" ||
    (allowColon && character === ":") ||
    (value >= 0x41 && value <= 0x5a) ||
    (value >= 0x61 && value <= 0x7a) ||
    (value >= 0xc0 && value <= 0xd6) ||
    (value >= 0xd8 && value <= 0xf6) ||
    (value >= 0xf8 && value <= 0x2ff) ||
    (value >= 0x370 && value <= 0x37d) ||
    (value >= 0x37f && value <= 0x1fff) ||
    (value >= 0x200c && value <= 0x200d) ||
    (value >= 0x2070 && value <= 0x218f) ||
    (value >= 0x2c00 && value <= 0x2fef) ||
    (value >= 0x3001 && value <= 0xd7ff) ||
    (value >= 0xf900 && value <= 0xfdcf) ||
    (value >= 0xfdf0 && value <= 0xfffd) ||
    (value >= 0x10000 && value <= 0xeffff)
  );
}

export function isXMLNameCharacter(
  character: string,
  allowColon = true,
): boolean {
  const value = character.codePointAt(0) ?? -1;
  return (
    isXMLNameStart(character, allowColon) ||
    character === "-" ||
    character === "." ||
    (value >= 0x30 && value <= 0x39) ||
    value === 0xb7 ||
    (value >= 0x300 && value <= 0x36f) ||
    (value >= 0x203f && value <= 0x2040)
  );
}

export function isXMLName(value: string, allowColon = true): boolean {
  const characters = Array.from(value);
  const first = characters[0];
  return (
    first !== undefined &&
    isXMLNameStart(first, allowColon) &&
    characters
      .slice(1)
      .every((character) => isXMLNameCharacter(character, allowColon))
  );
}

export function containsOnlyXMLCharacters(value: string): boolean {
  return Array.from(value).every((character) => {
    const codePoint = character.codePointAt(0);
    return codePoint !== undefined && isXMLCharacter(codePoint);
  });
}
