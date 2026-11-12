import { decodeHTMLBytes } from "@palim/window";
import { describe, expect, it } from "vitest";

function ascii(value: string): Uint8Array {
  return Uint8Array.from(value, (character) => character.charCodeAt(0));
}

function utf8(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}

function utf16le(value: string): Uint8Array {
  const result = new Uint8Array(value.length * 2);
  for (let index = 0; index < value.length; index += 1) {
    const codeUnit = value.charCodeAt(index);
    result[index * 2] = codeUnit & 0xff;
    result[index * 2 + 1] = codeUnit >> 8;
  }
  return result;
}

function concat(...parts: readonly Uint8Array[]): Uint8Array {
  const length = parts.reduce((total, part) => total + part.length, 0);
  const result = new Uint8Array(length);
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }
  return result;
}

describe("decodeHTMLBytes", () => {
  it("decodes UTF-8 by default", () => {
    expect(decodeHTMLBytes(utf8("<!doctype html><p>日本語</p>"))).toEqual({
      text: "<!doctype html><p>日本語</p>",
      encoding: "UTF-8",
    });
  });

  it("uses a BOM before transport and document metadata", () => {
    const result = decodeHTMLBytes(
      concat(
        Uint8Array.of(0xef, 0xbb, 0xbf),
        utf8('<meta charset="windows-1252"><p>€</p>'),
      ),
      { transportEncoding: "shift_jis" },
    );

    expect(result).toEqual({
      text: '<meta charset="windows-1252"><p>€</p>',
      encoding: "UTF-8",
    });
  });

  it("recognizes UTF-16 byte order marks", () => {
    const result = decodeHTMLBytes(
      concat(Uint8Array.of(0xff, 0xfe), utf16le("<p>A</p>")),
    );

    expect(result).toEqual({ text: "<p>A</p>", encoding: "UTF-16LE" });
  });

  it("recognizes UTF-16 XML declaration prefixes", () => {
    const source = '<?xml version="1.0"?><p>A</p>';

    expect(decodeHTMLBytes(utf16le(source))).toEqual({
      text: source,
      encoding: "UTF-16LE",
    });
  });

  it("uses a supported transport encoding before meta declarations", () => {
    const result = decodeHTMLBytes(
      concat(
        ascii('<meta charset="utf-8"><p>'),
        Uint8Array.of(0x80),
        ascii("</p>"),
      ),
      { transportEncoding: "iso-8859-1" },
    );

    expect(result.text).toBe('<meta charset="utf-8"><p>€</p>');
    expect(result.encoding).toBe("windows-1252");
  });

  it("continues detection after an unsupported transport encoding", () => {
    const result = decodeHTMLBytes(
      concat(
        ascii('<meta charset="windows-1252"><p>'),
        Uint8Array.of(0x80),
        ascii("</p>"),
      ),
      { transportEncoding: "unsupported" },
    );

    expect(result.text).toBe('<meta charset="windows-1252"><p>€</p>');
    expect(result.encoding).toBe("windows-1252");
  });

  it("prescans charset meta declarations", () => {
    const result = decodeHTMLBytes(
      concat(
        ascii('<meta charset="windows-1252"><p>'),
        Uint8Array.of(0xe9),
        ascii("</p>"),
      ),
    );

    expect(result.text).toBe('<meta charset="windows-1252"><p>é</p>');
    expect(result.encoding).toBe("windows-1252");
  });

  it("prescans pragma meta declarations regardless of attribute order", () => {
    const prefix =
      '<meta content="text/html; charset=shift_jis" http-equiv="Content-Type"><p>';
    const result = decodeHTMLBytes(
      concat(ascii(prefix), Uint8Array.of(0x82, 0xa0), ascii("</p>")),
    );

    expect(result.text).toBe(`${prefix}あ</p>`);
    expect(result.encoding).toBe("Shift_JIS");
  });

  it("skips declarations in comments during the prescan", () => {
    const result = decodeHTMLBytes(
      concat(
        ascii('<!--<meta charset="windows-1252">--><p>'),
        Uint8Array.of(0x80),
        ascii("</p>"),
      ),
    );

    expect(result.text).toBe(
      '<!--<meta charset="windows-1252">--><p>\uFFFD</p>',
    );
    expect(result.encoding).toBe("UTF-8");
  });

  it("limits the meta prescan to the first 1024 bytes", () => {
    const result = decodeHTMLBytes(
      concat(
        ascii(" ".repeat(1024)),
        ascii('<meta charset="windows-1252"><p>'),
        Uint8Array.of(0x80),
        ascii("</p>"),
      ),
    );

    expect(result.text.endsWith("<p>\uFFFD</p>")).toBe(true);
    expect(result.encoding).toBe("UTF-8");
  });

  it("normalizes encodings declared by meta", () => {
    const utf16 = decodeHTMLBytes(utf8('<meta charset="utf-16le"><p>é</p>'));
    const userDefined = decodeHTMLBytes(
      concat(
        ascii('<meta charset="x-user-defined"><p>'),
        Uint8Array.of(0x80),
        ascii("</p>"),
      ),
    );

    expect(utf16.encoding).toBe("UTF-8");
    expect(utf16.text).toBe('<meta charset="utf-16le"><p>é</p>');
    expect(userDefined.encoding).toBe("windows-1252");
    expect(userDefined.text).toBe('<meta charset="x-user-defined"><p>€</p>');
  });

  it.each([
    "csiso2022kr",
    "hz-gb-2312",
    "iso-2022-cn",
    "iso-2022-cn-ext",
    "iso-2022-kr",
    "replacement",
  ])("normalizes the %s label to replacement", (label) => {
    const result = decodeHTMLBytes(
      ascii(`<meta charset=" ${label.toUpperCase()} ">`),
    );

    expect(result).toEqual({ text: "\uFFFD", encoding: "replacement" });
  });

  it("uses an encoding from an XML declaration", () => {
    const prefix = '<?xml version="1.0" encoding="windows-1252"?><p>';
    const result = decodeHTMLBytes(
      concat(ascii(prefix), Uint8Array.of(0x80), ascii("</p>")),
    );

    expect(result.text).toBe(`${prefix}€</p>`);
    expect(result.encoding).toBe("windows-1252");
  });

  it("uses the requested fallback encoding", () => {
    const result = decodeHTMLBytes(
      concat(ascii("<p>"), Uint8Array.of(0x82, 0xa0), ascii("</p>")),
      { fallbackEncoding: "shift_jis" },
    );

    expect(result.text).toBe("<p>あ</p>");
    expect(result.encoding).toBe("Shift_JIS");
  });

  it("formats canonical encoding names", () => {
    expect(
      decodeHTMLBytes(new Uint8Array(), {
        fallbackEncoding: "iso-8859-2",
      }).encoding,
    ).toBe("ISO-8859-2");
    expect(
      decodeHTMLBytes(new Uint8Array(), { fallbackEncoding: "gbk" }).encoding,
    ).toBe("GBK");
    expect(
      decodeHTMLBytes(new Uint8Array(), { fallbackEncoding: "big5" }).encoding,
    ).toBe("Big5");
    expect(
      decodeHTMLBytes(new Uint8Array(), { fallbackEncoding: "gb18030" })
        .encoding,
    ).toBe("gb18030");
    expect(
      decodeHTMLBytes(new Uint8Array(), { fallbackEncoding: "macintosh" })
        .encoding,
    ).toBe("macintosh");
  });

  it("rejects an unsupported fallback encoding", () => {
    expect(() =>
      decodeHTMLBytes(new Uint8Array(), {
        fallbackEncoding: "unsupported",
      }),
    ).toThrow(TypeError);
  });

  it("replaces decoding errors", () => {
    expect(decodeHTMLBytes(Uint8Array.of(0xff))).toEqual({
      text: "\uFFFD",
      encoding: "UTF-8",
    });
  });

  it("requires a Uint8Array", () => {
    expect(() => decodeHTMLBytes("<p></p>" as unknown as Uint8Array)).toThrow(
      TypeError,
    );
  });
});
