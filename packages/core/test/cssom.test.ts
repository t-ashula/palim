import { describe, expect, test } from "vitest";

import {
  CSSRule,
  CSSRuleList,
  CSSStyleRule,
  CSSStyleSheet,
  MediaList,
} from "../src/cssom.js";

describe("CSSRule", () => {
  test("returns the rule text and common rule metadata", () => {
    const rule = new CSSRule("@namespace svg url(example)");

    expect(rule.cssText).toBe("@namespace svg url(example)");
    expect(rule.parentRule).toBeNull();
    expect(rule.parentStyleSheet).toBeNull();
    expect(rule.type).toBe(CSSRule.STYLE_RULE);
    expect(rule.STYLE_RULE).toBe(CSSRule.STYLE_RULE);
  });

  test("updates the rule text", () => {
    const rule = new CSSRule("first");

    rule.cssText = "second";

    expect(rule.cssText).toBe("second");
  });
});

describe("CSSStyleRule", () => {
  test("serializes its selector and declarations", () => {
    const rule = new CSSStyleRule("main", "display: block");

    expect(rule).toBeInstanceOf(CSSRule);
    expect(rule.selectorText).toBe("main");
    expect(rule.cssText).toBe("main { display: block }");
    expect(rule.style).toBe(rule.style);
    expect(rule.style.parentRule).toBe(rule);
    expect(rule.style.cssText).toBe("display: block;");
  });

  test("updates a valid selector", () => {
    const rule = new CSSStyleRule("main", "display: block");

    rule.selectorText = "article";

    expect(rule.selectorText).toBe("article");
    expect(rule.cssText).toBe("article { display: block }");
  });

  test("ignores an empty selector", () => {
    const rule = new CSSStyleRule("main", "display: block");

    rule.selectorText = "  ";

    expect(rule.selectorText).toBe("main");
    expect(rule.cssText).toBe("main { display: block }");
  });

  test("updates from valid style rule text", () => {
    const rule = new CSSStyleRule("main", "display: block");

    rule.cssText = "article { display: none }";

    expect(rule.selectorText).toBe("article");
    expect(rule.cssText).toBe("article { display: none }");
  });

  test("ignores invalid style rule text", () => {
    const rule = new CSSStyleRule("main", "display: block");

    rule.cssText = "invalid";

    expect(rule.selectorText).toBe("main");
    expect(rule.cssText).toBe("main { display: block }");
  });

  test("updates rule text through its declaration object", () => {
    const rule = new CSSStyleRule("main", "display: block");

    rule.style.setProperty("display", "none");

    expect(rule.style.getPropertyValue("display")).toBe("none");
    expect(rule.cssText).toBe("main { display: none; }");
  });

  test("updates the same declaration object when rule text changes", () => {
    const rule = new CSSStyleRule("main", "display: block");
    const style = rule.style;

    rule.cssText = "article { color: red }";

    expect(rule.style).toBe(style);
    expect(style.getPropertyValue("display")).toBe("");
    expect(style.getPropertyValue("color")).toBe("red");
  });
});

describe("CSSRuleList", () => {
  test("reads the current rules returned by its input function", () => {
    const first = new CSSRule("first");
    const second = new CSSRule("second");
    const rules = [first];
    const list = new CSSRuleList(() => rules);

    expect(list.length).toBe(1);
    expect(list.item(0)).toBe(first);
    expect(list.item(1)).toBeNull();
    expect([...list]).toEqual([first]);

    rules.push(second);

    expect(list.length).toBe(2);
    expect(list.item(1)).toBe(second);
    expect([...list]).toEqual([first, second]);
  });
});

describe("MediaList", () => {
  test("parses and serializes the current media query list", () => {
    let source = "SCREEN, print";
    const list = new MediaList(
      () => source,
      (value) => {
        source = value;
      },
    );

    expect(list.mediaText).toBe("screen, print");
    expect(list.length).toBe(2);
    expect(list.item(-1)).toBeNull();
    expect(list.item(0)).toBe("screen");
    expect(list.item(2)).toBeNull();
    expect([...list]).toEqual(["screen", "print"]);
    expect(list.toString()).toBe("screen, print");
  });

  test("writes a serialized media query list through mediaText", () => {
    let source = "";
    const list = new MediaList(
      () => source,
      (value) => {
        source = value;
      },
    );

    list.mediaText = "SCREEN and (min-width:480px), print";

    expect(source).toBe("screen and (min-width: 480px), print");
    expect(list.mediaText).toBe(source);
  });

  test("appends one non-duplicate query", () => {
    let source = "all";
    const list = new MediaList(
      () => source,
      (value) => {
        source = value;
      },
    );

    list.appendMedium("screen");
    list.appendMedium("screen");
    list.appendMedium("print, speech");

    expect(source).toBe("all, screen");
  });

  test("deletes every query equal after parsing", () => {
    let source =
      "screen and (min-width: 480px), print, SCREEN and (min-width:480px)";
    const list = new MediaList(
      () => source,
      (value) => {
        source = value;
      },
    );

    list.deleteMedium("screen and (min-width:480px)");

    expect(source).toBe("print");
  });

  test("reports a missing medium without changing the list", () => {
    let source = "all";
    const list = new MediaList(
      () => source,
      (value) => {
        source = value;
      },
    );

    expect(() => {
      list.deleteMedium("screen");
    }).toThrow(expect.objectContaining({ name: "NotFoundError" }));
    expect(source).toBe("all");
  });
});

describe("CSSStyleSheet", () => {
  test("starts with an empty stable rule list", () => {
    const sheet = new CSSStyleSheet();

    expect(sheet.ownerNode).toBeNull();
    expect(sheet.media).toBe(sheet.media);
    expect(sheet.media.mediaText).toBe("");
    expect(sheet.cssRules).toBe(sheet.cssRules);
    expect(sheet.rules).toBe(sheet.cssRules);
    expect(sheet.cssRules.length).toBe(0);
  });

  test("retains media for a constructed stylesheet", () => {
    const sheet = new CSSStyleSheet();

    sheet.media.mediaText = "screen, print";

    expect(sheet.media.mediaText).toBe("screen, print");
  });

  test("inserts a style rule at the requested index", () => {
    const sheet = new CSSStyleSheet();

    expect(sheet.insertRule("main { display: block }", 0)).toBe(0);
    expect(sheet.insertRule("aside { display: none }", 0)).toBe(0);

    const first = sheet.cssRules.item(0);
    const second = sheet.cssRules.item(1);
    expect(first).toBeInstanceOf(CSSStyleRule);
    expect(first?.cssText).toBe("aside { display: none }");
    expect(first?.parentStyleSheet).toBe(sheet);
    expect(second?.cssText).toBe("main { display: block }");
    expect(second?.parentStyleSheet).toBe(sheet);
  });

  test("keeps an inserted rule attached when its declaration changes", () => {
    const sheet = new CSSStyleSheet();
    sheet.insertRule("main { display: block }");
    const rule = sheet.cssRules.item(0);
    if (!(rule instanceof CSSStyleRule)) {
      throw new Error("Expected a CSSStyleRule fixture");
    }

    rule.style.setProperty("display", "none");

    expect(sheet.cssRules.item(0)).toBe(rule);
    expect(rule.cssText).toBe("main { display: none; }");
  });

  test("appends a rule when the index is omitted", () => {
    const sheet = new CSSStyleSheet();

    sheet.insertRule("main { display: block }");
    expect(sheet.insertRule("aside { display: none }")).toBe(1);

    expect(sheet.cssRules.item(1)?.cssText).toBe("aside { display: none }");
  });

  test("rejects invalid rule text", () => {
    const sheet = new CSSStyleSheet();

    expect(() => sheet.insertRule("invalid", 0)).toThrow(
      expect.objectContaining({ name: "SyntaxError" }),
    );
    expect(sheet.cssRules.length).toBe(0);
  });

  test("rejects an insertion index after the end of the list", () => {
    const sheet = new CSSStyleSheet();

    expect(() => sheet.insertRule("main { display: block }", 1)).toThrow(
      expect.objectContaining({ name: "IndexSizeError" }),
    );
    expect(sheet.cssRules.length).toBe(0);
  });

  test("deletes the rule at the requested index", () => {
    const sheet = new CSSStyleSheet();
    sheet.insertRule("main { display: block }");
    sheet.insertRule("aside { display: none }");

    sheet.deleteRule(0);

    expect(sheet.cssRules.length).toBe(1);
    expect(sheet.cssRules.item(0)?.cssText).toBe("aside { display: none }");
  });

  test("rejects a deletion index outside the list", () => {
    const sheet = new CSSStyleSheet();

    expect(() => {
      sheet.deleteRule(0);
    }).toThrow(expect.objectContaining({ name: "IndexSizeError" }));
  });
});
