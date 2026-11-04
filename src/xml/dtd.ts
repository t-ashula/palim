export interface DTDEntity {
  readonly value?: string;
  readonly external: boolean;
  readonly unparsed?: boolean;
  readonly wellFormed?: boolean;
  readonly notation?: string;
}

export interface DTDDefaultAttribute {
  readonly elementName: string;
  readonly attributeName: string;
  readonly value: string;
  readonly tokenized: boolean;
}

interface DTDResult {
  readonly generalEntities: ReadonlyMap<string, DTDEntity>;
  readonly tokenizedAttributes: ReadonlySet<string>;
  readonly defaultAttributes: readonly DTDDefaultAttribute[];
  readonly externalDeclarationsSkipped: boolean;
}

class DTDFailure extends Error {}

function inRange(value: number, start: number, end: number): boolean {
  return value >= start && value <= end;
}

function isNameStart(character: string): boolean {
  const value = character.codePointAt(0) ?? -1;
  return (
    character === ":" ||
    character === "_" ||
    inRange(value, 0x41, 0x5a) ||
    inRange(value, 0x61, 0x7a) ||
    inRange(value, 0xc0, 0xd6) ||
    inRange(value, 0xd8, 0xf6) ||
    inRange(value, 0xf8, 0x2ff) ||
    inRange(value, 0x370, 0x37d) ||
    inRange(value, 0x37f, 0x1fff) ||
    inRange(value, 0x200c, 0x200d) ||
    inRange(value, 0x2070, 0x218f) ||
    inRange(value, 0x2c00, 0x2fef) ||
    inRange(value, 0x3001, 0xd7ff) ||
    inRange(value, 0xf900, 0xfdcf) ||
    inRange(value, 0xfdf0, 0xfffd) ||
    inRange(value, 0x10000, 0xeffff)
  );
}

function isNameCharacter(character: string): boolean {
  const value = character.codePointAt(0) ?? -1;
  return (
    isNameStart(character) ||
    character === "-" ||
    character === "." ||
    inRange(value, 0x30, 0x39) ||
    value === 0xb7 ||
    inRange(value, 0x300, 0x36f) ||
    inRange(value, 0x203f, 0x2040)
  );
}

function isWhitespace(character: string | undefined): boolean {
  return (
    character === " " ||
    character === "\t" ||
    character === "\n" ||
    character === "\r"
  );
}

class InternalSubsetParser {
  #source: string;
  #position = 0;
  readonly #generalEntities = new Map<string, DTDEntity>();
  readonly #parameterEntities = new Map<string, DTDEntity>();
  readonly #tokenizedAttributes = new Set<string>();
  readonly #defaultAttributes: DTDDefaultAttribute[] = [];
  readonly #declaredAttributes = new Set<string>();
  #externalParameterEntitySkipped = false;
  #parameterEntityReferenced = false;
  #expansionCount = 0;

  constructor(source: string) {
    this.#source = source;
  }

  parse(): DTDResult {
    while (!this.#atEnd()) {
      this.#skipWhitespace();
      if (this.#atEnd()) {
        break;
      }
      if (this.#startsWith("<!--")) {
        this.#parseComment();
      } else if (this.#startsWith("<?")) {
        this.#parseProcessingInstruction();
      } else if (this.#startsWith("<!ELEMENT")) {
        this.#parseElementDeclaration();
      } else if (this.#startsWith("<!ATTLIST")) {
        this.#parseAttributeListDeclaration();
      } else if (this.#startsWith("<!ENTITY")) {
        this.#parseEntityDeclaration();
      } else if (this.#startsWith("<!NOTATION")) {
        this.#parseNotationDeclaration();
      } else if (this.#startsWith("%")) {
        this.#expandParameterEntity();
      } else {
        throw new DTDFailure("Invalid declaration in the internal subset");
      }
    }
    this.#validateEntities();
    return {
      generalEntities: new Map(
        [...this.#generalEntities].map(([name, entity]) => [
          name,
          entity.value === undefined
            ? entity
            : { ...entity, wellFormed: wellFormedContent(entity.value) },
        ]),
      ),
      tokenizedAttributes: this.#tokenizedAttributes,
      defaultAttributes: this.#defaultAttributes,
      externalDeclarationsSkipped:
        this.#externalParameterEntitySkipped || this.#parameterEntityReferenced,
    };
  }

  #parseComment(): void {
    const end = this.#source.indexOf("-->", this.#position + 4);
    if (end < 0) {
      throw new DTDFailure("Unclosed DTD comment");
    }
    const data = this.#source.slice(this.#position + 4, end);
    if (data.includes("--") || data.endsWith("-")) {
      throw new DTDFailure("Invalid DTD comment");
    }
    this.#position = end + 3;
  }

  #parseProcessingInstruction(): void {
    this.#position += 2;
    const target = this.#parseName();
    if (target.toLowerCase() === "xml") {
      throw new DTDFailure("Reserved DTD processing instruction target");
    }
    const end = this.#source.indexOf("?>", this.#position);
    if (end < 0) {
      throw new DTDFailure("Unclosed DTD processing instruction");
    }
    if (this.#position !== end && !isWhitespace(this.#source[this.#position])) {
      throw new DTDFailure("Invalid DTD processing instruction");
    }
    this.#position = end + 2;
  }

  #parseElementDeclaration(): void {
    this.#position += "<!ELEMENT".length;
    this.#requireWhitespace();
    this.#parseName();
    this.#requireWhitespace();
    if (this.#consumeKeyword("EMPTY") || this.#consumeKeyword("ANY")) {
      // The keyword is the complete content specification.
    } else if (this.#startsWith("(")) {
      this.#parseContentModel();
    } else {
      throw new DTDFailure("Invalid element content specification");
    }
    this.#skipWhitespace();
    this.#expect(">");
  }

  #parseContentModel(): void {
    this.#expect("(");
    this.#skipWhitespace();
    if (this.#startsWith("#PCDATA")) {
      this.#position += "#PCDATA".length;
      this.#skipWhitespace();
      if (this.#startsWith(")")) {
        this.#position += 1;
        if (this.#startsWith("*")) {
          this.#position += 1;
        }
        return;
      }
      let names = 0;
      while (this.#startsWith("|")) {
        this.#position += 1;
        this.#skipWhitespace();
        this.#parseName();
        names += 1;
        this.#skipWhitespace();
      }
      this.#expect(")");
      if (names === 0 || !this.#startsWith("*")) {
        throw new DTDFailure("Invalid mixed content model");
      }
      this.#position += 1;
      return;
    }

    this.#parseContentParticle();
    this.#skipWhitespace();
    const separator = this.#source[this.#position];
    if (separator === ")") {
      this.#position += 1;
      this.#parseOccurrence();
      return;
    }
    if (separator !== "|" && separator !== ",") {
      throw new DTDFailure("Invalid children content model");
    }
    let count = 0;
    while (this.#source[this.#position] === separator) {
      this.#position += 1;
      this.#skipWhitespace();
      this.#parseContentParticle();
      this.#skipWhitespace();
      count += 1;
    }
    if (
      count === 0 ||
      this.#source[this.#position] === (separator === "|" ? "," : "|")
    ) {
      throw new DTDFailure("Mixed separators in a content model");
    }
    this.#expect(")");
    this.#parseOccurrence();
  }

  #parseContentParticle(): void {
    if (this.#startsWith("(")) {
      if (this.#source.startsWith("(#PCDATA", this.#position)) {
        throw new DTDFailure("Mixed content cannot be nested");
      }
      this.#parseContentModel();
      return;
    }
    this.#parseName();
    this.#parseOccurrence();
  }

  #parseOccurrence(): void {
    const character = this.#source[this.#position];
    if (character === "?" || character === "*" || character === "+") {
      this.#position += 1;
    }
  }

  #parseAttributeListDeclaration(): void {
    this.#position += "<!ATTLIST".length;
    this.#requireWhitespace();
    const elementName = this.#parseName();
    for (;;) {
      const spaced = this.#skipWhitespace();
      if (this.#startsWith(">")) {
        this.#position += 1;
        return;
      }
      if (!spaced) {
        throw new DTDFailure("Invalid attribute-list declaration");
      }
      const attributeName = this.#parseName();
      this.#requireWhitespace();
      const tokenized = this.#parseAttributeType();
      this.#requireWhitespace();
      const defaultValue = this.#parseDefaultDeclaration();
      const key = `${elementName}\u0000${attributeName}`;
      if (!this.#declaredAttributes.has(key)) {
        this.#declaredAttributes.add(key);
        if (tokenized) {
          this.#tokenizedAttributes.add(key);
        }
        if (defaultValue !== null) {
          this.#defaultAttributes.push({
            elementName,
            attributeName,
            value: defaultValue,
            tokenized,
          });
        }
      }
    }
  }

  #parseAttributeType(): boolean {
    const tokenized = [
      "IDREFS",
      "IDREF",
      "ID",
      "ENTITIES",
      "ENTITY",
      "NMTOKENS",
      "NMTOKEN",
      "CDATA",
    ];
    if (tokenized.some((keyword) => this.#consumeKeyword(keyword))) {
      return !this.#source.slice(0, this.#position).endsWith("CDATA");
    }
    if (this.#consumeKeyword("NOTATION")) {
      this.#requireWhitespace();
      this.#parseEnumeration(true);
      return true;
    }
    this.#parseEnumeration(false);
    return true;
  }

  #parseEnumeration(namesOnly: boolean): void {
    this.#expect("(");
    this.#skipWhitespace();
    if (namesOnly) {
      this.#parseName();
    } else {
      this.#parseNameToken();
    }
    this.#skipWhitespace();
    while (this.#startsWith("|")) {
      this.#position += 1;
      this.#skipWhitespace();
      if (namesOnly) {
        this.#parseName();
      } else {
        this.#parseNameToken();
      }
      this.#skipWhitespace();
    }
    this.#expect(")");
  }

  #parseDefaultDeclaration(): string | null {
    if (this.#consumeKeyword("#REQUIRED") || this.#consumeKeyword("#IMPLIED")) {
      return null;
    }
    if (this.#consumeKeyword("#FIXED")) {
      this.#requireWhitespace();
    }
    return this.#parseAttributeLiteral();
  }

  #parseEntityDeclaration(): void {
    this.#position += "<!ENTITY".length;
    this.#requireWhitespace();
    const parameter = this.#startsWith("%");
    if (parameter) {
      this.#position += 1;
      this.#requireWhitespace();
    }
    const name = this.#parseName();
    if (name.includes(":")) {
      throw new DTDFailure("Entity names must be namespace names");
    }
    this.#requireWhitespace();
    const entity = this.#parseEntityDefinition(parameter);
    this.#skipWhitespace();
    this.#expect(">");
    const entities = parameter
      ? this.#parameterEntities
      : this.#generalEntities;
    if (!entities.has(name)) {
      entities.set(name, entity);
    }
  }

  #parseEntityDefinition(parameter: boolean): DTDEntity {
    if (this.#startsWith('"') || this.#startsWith("'")) {
      return { value: this.#parseEntityValue(), external: false };
    }
    this.#parseExternalIdentifier(false);
    let notation: string | undefined;
    if (!parameter) {
      const position = this.#position;
      if (this.#skipWhitespace() && this.#consumeKeyword("NDATA")) {
        this.#requireWhitespace();
        notation = this.#parseName();
      } else {
        this.#position = position;
      }
    }
    return notation === undefined
      ? { external: true }
      : { external: true, unparsed: true, notation };
  }

  #parseNotationDeclaration(): void {
    this.#position += "<!NOTATION".length;
    this.#requireWhitespace();
    const name = this.#parseName();
    if (name.includes(":")) {
      throw new DTDFailure("Notation names must be namespace names");
    }
    this.#requireWhitespace();
    this.#parseExternalIdentifier(true);
    this.#skipWhitespace();
    this.#expect(">");
  }

  #parseExternalIdentifier(publicWithoutSystem: boolean): void {
    if (this.#consumeKeyword("SYSTEM")) {
      this.#requireWhitespace();
      this.#parseQuotedLiteral();
      return;
    }
    if (!this.#consumeKeyword("PUBLIC")) {
      throw new DTDFailure("Expected an external identifier");
    }
    this.#requireWhitespace();
    const publicId = this.#parseQuotedLiteral();
    if (!Array.from(publicId).every(isPublicIdentifierCharacter)) {
      throw new DTDFailure("Invalid public identifier");
    }
    const position = this.#position;
    if (
      this.#skipWhitespace() &&
      (this.#startsWith('"') || this.#startsWith("'"))
    ) {
      this.#parseQuotedLiteral();
    } else {
      this.#position = position;
      if (!publicWithoutSystem) {
        throw new DTDFailure(
          "A PUBLIC entity identifier requires a system identifier",
        );
      }
    }
  }

  #parseEntityValue(): string {
    const quote = this.#source[this.#position];
    if (quote !== '"' && quote !== "'") {
      throw new DTDFailure("Expected an entity value");
    }
    this.#position += 1;
    const start = this.#position;
    while (!this.#atEnd() && this.#source[this.#position] !== quote) {
      if (this.#startsWith("%")) {
        this.#parseReference("%");
      } else if (this.#startsWith("&")) {
        this.#parseReference("&");
      } else {
        this.#position += this.#currentCharacter().length;
      }
    }
    if (this.#atEnd()) {
      throw new DTDFailure("Unclosed entity value");
    }
    const value = decodeCharacterReferences(
      this.#source.slice(start, this.#position),
    );
    this.#position += 1;
    return value;
  }

  #parseAttributeLiteral(): string {
    const quote = this.#source[this.#position];
    if (quote !== '"' && quote !== "'") {
      throw new DTDFailure("Expected a default attribute value");
    }
    this.#position += 1;
    const start = this.#position;
    while (!this.#atEnd() && this.#source[this.#position] !== quote) {
      if (this.#startsWith("<")) {
        throw new DTDFailure("< in a default attribute value");
      }
      if (this.#startsWith("&")) {
        this.#position += 1;
        if (this.#startsWith("#")) {
          this.#position -= 1;
          this.#parseReference("&");
        } else {
          const name = this.#parseName();
          this.#expect(";");
          if (
            name !== "amp" &&
            name !== "lt" &&
            name !== "gt" &&
            name !== "apos" &&
            name !== "quot"
          ) {
            const entity = this.#generalEntities.get(name);
            if (
              entity === undefined ||
              entity.external ||
              entity.unparsed === true
            ) {
              throw new DTDFailure(
                `Invalid entity in a default attribute value: ${name}`,
              );
            }
          }
        }
      } else {
        this.#position += this.#currentCharacter().length;
      }
    }
    if (this.#atEnd()) {
      throw new DTDFailure("Unclosed default attribute value");
    }
    const value = this.#expandDefaultAttributeValue(
      this.#source.slice(start, this.#position),
      new Set(),
    );
    this.#position += 1;
    return value;
  }

  #expandDefaultAttributeValue(
    value: string,
    activeEntities: ReadonlySet<string>,
  ): string {
    return value.replaceAll(
      /&(#x[0-9A-Fa-f]+|#[0-9]+|[^;\s<&]+);/gu,
      (reference, name: string) => {
        if (name.startsWith("#")) {
          return decodeCharacterReferences(reference);
        }
        const predefined = new Map([
          ["amp", "&"],
          ["lt", "<"],
          ["gt", ">"],
          ["apos", "'"],
          ["quot", '"'],
        ]).get(name);
        if (predefined !== undefined) {
          return predefined;
        }
        const entity = this.#generalEntities.get(name);
        if (
          entity?.value === undefined ||
          entity.external ||
          entity.unparsed === true
        ) {
          throw new DTDFailure(
            `Invalid entity in a default attribute value: ${name}`,
          );
        }
        if (activeEntities.has(name)) {
          throw new DTDFailure(`Recursive entity declaration: ${name}`);
        }
        return this.#expandDefaultAttributeValue(
          entity.value,
          new Set([...activeEntities, name]),
        );
      },
    );
  }

  #parseReference(marker: "%" | "&"): string {
    this.#expect(marker);
    if (marker === "&" && this.#startsWith("#")) {
      this.#position += 1;
      if (this.#startsWith("x")) {
        this.#position += 1;
        this.#parseDigits(/[0-9A-Fa-f]/u);
      } else {
        this.#parseDigits(/[0-9]/u);
      }
    } else {
      this.#parseName();
    }
    this.#expect(";");
    return this.#source.slice(0, this.#position);
  }

  #expandParameterEntity(): void {
    const start = this.#position;
    this.#position += 1;
    const name = this.#parseName();
    this.#expect(";");
    const end = this.#position;
    const entity = this.#parameterEntities.get(name);
    this.#parameterEntityReferenced = true;
    if (entity === undefined) {
      if (this.#externalParameterEntitySkipped) {
        this.#source = `${this.#source.slice(0, start)} ${this.#source.slice(end)}`;
        this.#position = start;
        return;
      }
      throw new DTDFailure(`Undefined parameter entity: ${name}`);
    }
    if (entity.external) {
      this.#externalParameterEntitySkipped = true;
    }
    const replacement = entity.external ? "" : (entity.value ?? "");
    this.#expansionCount += 1;
    if (this.#expansionCount > 10_000) {
      throw new DTDFailure("Parameter entity expansion limit exceeded");
    }
    this.#source = `${this.#source.slice(0, start)} ${replacement} ${this.#source.slice(end)}`;
    this.#position = start;
  }

  #validateEntities(): void {
    const all = new Map<string, DTDEntity>();
    for (const [name, entity] of this.#generalEntities) {
      all.set(`&${name}`, entity);
    }
    for (const [name, entity] of this.#parameterEntities) {
      all.set(`%${name}`, entity);
    }
    const active = new Set<string>();
    const complete = new Set<string>();
    const visit = (key: string): void => {
      if (active.has(key)) {
        throw new DTDFailure(`Recursive entity declaration: ${key.slice(1)}`);
      }
      if (complete.has(key)) {
        return;
      }
      const entity = all.get(key);
      if (entity?.value === undefined) {
        complete.add(key);
        return;
      }
      active.add(key);
      for (const { marker, name } of entityReferences(entity.value)) {
        if (
          name.startsWith("#") ||
          (marker === "&" &&
            (name === "amp" ||
              name === "lt" ||
              name === "gt" ||
              name === "apos" ||
              name === "quot"))
        ) {
          continue;
        }
        if (marker === "%") {
          throw new DTDFailure(
            "A parameter entity reference occurs within a declaration in the internal subset",
          );
        }
        const dependency = `&${name}`;
        if (!all.has(dependency) && !this.#parameterEntityReferenced) {
          throw new DTDFailure(`Undefined entity in entity value: ${name}`);
        }
        visit(dependency);
      }
      active.delete(key);
      complete.add(key);
    };
    for (const key of all.keys()) {
      visit(key);
    }
  }

  #parseName(): string {
    const first = this.#currentCharacter();
    if (!isNameStart(first)) {
      throw new DTDFailure("Expected an XML name in the DTD");
    }
    let result = first;
    this.#position += first.length;
    while (!this.#atEnd()) {
      const character = this.#currentCharacter();
      if (!isNameCharacter(character)) {
        break;
      }
      result += character;
      this.#position += character.length;
    }
    return result;
  }

  #parseNameToken(): void {
    const start = this.#position;
    while (!this.#atEnd() && isNameCharacter(this.#currentCharacter())) {
      this.#position += this.#currentCharacter().length;
    }
    if (this.#position === start) {
      throw new DTDFailure("Expected an XML name token");
    }
  }

  #parseDigits(expression: RegExp): void {
    const start = this.#position;
    while (expression.test(this.#source[this.#position] ?? "")) {
      this.#position += 1;
    }
    if (this.#position === start) {
      throw new DTDFailure("Expected digits in a character reference");
    }
  }

  #parseQuotedLiteral(): string {
    const quote = this.#source[this.#position];
    if (quote !== '"' && quote !== "'") {
      throw new DTDFailure("Expected a quoted DTD literal");
    }
    const end = this.#source.indexOf(quote, this.#position + 1);
    if (end < 0) {
      throw new DTDFailure("Unclosed DTD literal");
    }
    const value = this.#source.slice(this.#position + 1, end);
    this.#position = end + 1;
    return value;
  }

  #consumeKeyword(value: string): boolean {
    if (!this.#startsWith(value)) {
      return false;
    }
    const next = this.#source[this.#position + value.length];
    if (next !== undefined && isNameCharacter(next)) {
      return false;
    }
    this.#position += value.length;
    return true;
  }

  #requireWhitespace(): void {
    if (!this.#skipWhitespace()) {
      throw new DTDFailure("Expected whitespace in the DTD");
    }
  }

  #skipWhitespace(): boolean {
    const start = this.#position;
    while (isWhitespace(this.#source[this.#position])) {
      this.#position += 1;
    }
    return this.#position !== start;
  }

  #expect(value: string): void {
    if (!this.#startsWith(value)) {
      throw new DTDFailure(`Expected ${value} in the DTD`);
    }
    this.#position += value.length;
  }

  #currentCharacter(): string {
    const value = this.#source.codePointAt(this.#position);
    return value === undefined ? "" : String.fromCodePoint(value);
  }

  #startsWith(value: string): boolean {
    return this.#source.startsWith(value, this.#position);
  }

  #atEnd(): boolean {
    return this.#position >= this.#source.length;
  }
}

function isPublicIdentifierCharacter(character: string): boolean {
  return /[\u000a\u000d\u0020a-zA-Z0-9\-'()+,./:=?;!*#@$_%]/u.test(character);
}

function decodeCharacterReferences(value: string): string {
  return value.replaceAll(
    /&#(?:x([0-9A-Fa-f]+)|([0-9]+));/gu,
    (
      _reference,
      hexadecimal: string | undefined,
      decimal: string | undefined,
    ) => {
      const codePoint = Number.parseInt(
        hexadecimal ?? decimal ?? "",
        hexadecimal === undefined ? 10 : 16,
      );
      if (
        codePoint !== 0x9 &&
        codePoint !== 0xa &&
        codePoint !== 0xd &&
        !(codePoint >= 0x20 && codePoint <= 0xd7ff) &&
        !(codePoint >= 0xe000 && codePoint <= 0xfffd) &&
        !(codePoint >= 0x10000 && codePoint <= 0x10ffff)
      ) {
        throw new DTDFailure("Invalid character reference in an entity value");
      }
      return String.fromCodePoint(codePoint);
    },
  );
}

function entityReferences(
  value: string,
): { readonly marker: string; readonly name: string }[] {
  const references: { readonly marker: string; readonly name: string }[] = [];
  let position = 0;
  while (position < value.length) {
    if (value.startsWith("<![CDATA[", position)) {
      const end = value.indexOf("]]>", position + 9);
      position = end < 0 ? value.length : end + 3;
      continue;
    }
    if (value.startsWith("<!--", position)) {
      const end = value.indexOf("-->", position + 4);
      position = end < 0 ? value.length : end + 3;
      continue;
    }
    const match = /^([&%])([^;]+);/u.exec(value.slice(position));
    if (match?.[1] !== undefined && match[2] !== undefined) {
      references.push({ marker: match[1], name: match[2] });
      position += match[0].length;
    } else {
      position += Array.from(value.slice(position))[0]?.length ?? 1;
    }
  }
  return references;
}

function wellFormedContent(value: string): boolean {
  const elements: string[] = [];
  let position = 0;
  while (position < value.length) {
    if (value.startsWith("<!--", position)) {
      const end = value.indexOf("-->", position + 4);
      if (end < 0 || value.slice(position + 4, end).includes("--")) {
        return false;
      }
      position = end + 3;
      continue;
    }
    if (value.startsWith("<![CDATA[", position)) {
      const end = value.indexOf("]]>", position + 9);
      if (end < 0) {
        return false;
      }
      position = end + 3;
      continue;
    }
    if (value.startsWith("<?", position)) {
      const end = value.indexOf("?>", position + 2);
      if (end < 0) {
        return false;
      }
      position = end + 2;
      continue;
    }
    if (value.startsWith("</", position)) {
      const end = value.indexOf(">", position + 2);
      if (end < 0) {
        return false;
      }
      const name = value.slice(position + 2, end).trim();
      if (elements.pop() !== name) {
        return false;
      }
      position = end + 1;
      continue;
    }
    if (value[position] === "<") {
      let end = position + 1;
      let quote: string | null = null;
      for (; end < value.length; end += 1) {
        const character = value[end] ?? "";
        if (quote !== null) {
          if (character === quote) {
            quote = null;
          }
        } else if (character === '"' || character === "'") {
          quote = character;
        } else if (character === ">") {
          break;
        }
      }
      if (end >= value.length) {
        return false;
      }
      const body = value.slice(position + 1, end).trim();
      if (body === "" || body.startsWith("!")) {
        return false;
      }
      const selfClosing = body.endsWith("/");
      const name = body
        .slice(0, selfClosing ? -1 : undefined)
        .trim()
        .split(/\s/u, 1)[0];
      if (name === undefined || name === "") {
        return false;
      }
      if (!selfClosing) {
        elements.push(name);
      }
      position = end + 1;
      continue;
    }
    if (value[position] === "&") {
      const reference = /^&(?:#[0-9]+|#x[0-9A-Fa-f]+|[^;\s<&]+);/u.exec(
        value.slice(position),
      )?.[0];
      if (reference === undefined) {
        return false;
      }
      position += reference.length;
      continue;
    }
    position += Array.from(value.slice(position))[0]?.length ?? 1;
  }
  return elements.length === 0;
}

export function parseInternalSubset(source: string): DTDResult {
  try {
    return new InternalSubsetParser(source).parse();
  } catch (error: unknown) {
    if (error instanceof DTDFailure) {
      throw new SyntaxError(error.message);
    }
    throw error;
  }
}
