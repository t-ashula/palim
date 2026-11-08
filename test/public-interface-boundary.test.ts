import { describe, expect, it } from "vitest";

import {
  Attr,
  CDATASection,
  CharacterData,
  Comment,
  Document,
  DocumentFragment,
  DocumentType,
  DOMParser,
  DOMStringMap,
  DOMTokenList,
  Element,
  HTMLAnchorElement,
  HTMLCollection,
  HTMLElement,
  NamedNodeMap,
  Node,
  NodeList,
  ProcessingInstruction,
  Text,
  TimeRanges,
} from "../packages/palim/src/index.js";
import { Window, createWindow } from "@palim/window/internal/window.js";

describe("public standard interface boundaries", () => {
  it("uses the standard constructors that are available", () => {
    const document = new Document();
    const fragment = new DocumentFragment();
    const text = new Text("text");
    const comment = new Comment("comment");
    const instruction = new ProcessingInstruction("target", "data");

    expect(document.URL).toBe("about:blank");
    expect(document.documentURI).toBe("about:blank");
    expect(document.compatMode).toBe("CSS1Compat");
    expect(document.characterSet).toBe("UTF-8");
    expect(document.charset).toBe("UTF-8");
    expect(document.inputEncoding).toBe("UTF-8");
    expect(document.contentType).toBe("application/xml");
    expect(
      document.createElementNS("http://www.w3.org/1999/xhtml", "a"),
    ).toBeInstanceOf(HTMLAnchorElement);
    expect(fragment).toBeInstanceOf(DocumentFragment);
    expect(text.data).toBe("text");
    expect(comment.data).toBe("comment");
    expect(instruction.target).toBe("target");
    expect(instruction.data).toBe("data");
  });

  it("uses UTF-8 for DOMParser string input regardless of meta charset", () => {
    const document = new DOMParser().parseFromString(
      '<meta charset="windows-1252"><p>€</p>',
      "text/html",
    );

    expect(document.characterSet).toBe("UTF-8");
    expect(document.charset).toBe("UTF-8");
    expect(document.inputEncoding).toBe("UTF-8");
    expect(document.querySelector("p")?.textContent).toBe("€");
  });

  it("rejects constructor calls for interfaces without constructors", () => {
    for (const Interface of [
      Attr,
      CDATASection,
      CharacterData,
      DocumentType,
      DOMStringMap,
      DOMTokenList,
      Element,
      HTMLCollection,
      HTMLElement,
      NamedNodeMap,
      Node,
      NodeList,
      TimeRanges,
      Window,
    ]) {
      expect(() =>
        Reflect.construct(
          Interface as unknown as new (...arguments_: never[]) => unknown,
          [],
        ),
      ).toThrow(TypeError);
    }
  });

  it("exposes standard interface object names and lengths", () => {
    expect(Document.length).toBe(0);
    expect(DocumentFragment.length).toBe(0);
    expect(ProcessingInstruction.length).toBe(1);
    expect(Node.length).toBe(0);
    expect(HTMLElement.length).toBe(0);
    expect(Window.name).toBe("Window");
    expect(Window.length).toBe(0);
  });

  it("keeps palim APIs separate from standard interfaces", () => {
    expect("parseFragment" in DOMParser.prototype).toBe(false);
    expect("remove" in Node.prototype).toBe(false);
    expect(
      Object.getOwnPropertyDescriptor(Attr.prototype, "name"),
    ).toMatchObject({ set: undefined });
    expect(
      Object.getOwnPropertyDescriptor(Attr.prototype, "prefix"),
    ).toMatchObject({ set: undefined });

    const window = createWindow();
    expect(window).toBeInstanceOf(Window);
    expect(window.document.defaultView).toBe(window);
  });
});
