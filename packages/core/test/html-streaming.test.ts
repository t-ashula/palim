import { describe, expect, it } from "vitest";

import { DOMParser } from "./public-test-api.js";

function documentWithTarget() {
  const document = new DOMParser().parseFromString(
    '<body><main id="target"><i>old</i></main></body>',
    "text/html",
  );
  const target = document.querySelector("#target");
  if (target === null) {
    throw new TypeError("Missing streaming target");
  }
  return { document, target };
}

describe("HTML streaming", () => {
  it("uses shared writable stream state for locking and closing", async () => {
    const { target } = documentWithTarget();
    const stream = target.streamHTMLUnsafe();
    const writer = stream.getWriter();

    expect(stream.locked).toBe(true);
    await expect(stream.close()).rejects.toThrow("locked");
    writer.releaseLock();
    expect(stream.locked).toBe(false);
    await stream.close();

    expect(target.innerHTML).toBe("");
  });

  it("preserves tokenizer and tree-builder state across writes", async () => {
    const { target } = documentWithTarget();
    const writer = target.streamHTMLUnsafe().getWriter();

    expect(target.innerHTML).toBe("");
    await writer.write("<sp");
    expect(target.innerHTML).toBe("");
    await writer.write("an>A&l");
    expect(target.innerHTML).toBe("<span>A</span>");
    await writer.write("t;B</span>");
    await writer.close();

    expect(target.innerHTML).toBe("<span>A&lt;B</span>");
  });

  it("applies sanitization while streaming", async () => {
    const { target } = documentWithTarget();
    const writer = target
      .streamHTMLUnsafe({
        sanitizer: {
          removeElements: ["script"],
          removeAttributes: ["onclick"],
        },
      })
      .getWriter();

    await writer.write(
      '<section onclick="bad()">kept<script>removed()</script></section>',
    );
    await writer.close();

    expect(target.innerHTML).toBe("<section>kept</section>");
  });

  it("preprocesses a CRLF pair split across writes once", async () => {
    const { target } = documentWithTarget();
    const writer = target.streamHTMLUnsafe().getWriter();

    await writer.write("a\r");
    await writer.write("\nb");
    await writer.close();

    expect(target.textContent).toBe("a\nb");
  });

  it("enables declarative shadow roots only for unsafe streaming", async () => {
    const unsafe = documentWithTarget().target;
    const unsafeWriter = unsafe.streamHTMLUnsafe().getWriter();
    await unsafeWriter.write(
      '<section><template shadowrootmode="open"><b>shadow</b></template></section>',
    );
    await unsafeWriter.close();
    expect(unsafe.firstElementChild?.shadowRoot?.innerHTML).toBe(
      "<b>shadow</b>",
    );

    const safe = documentWithTarget().target;
    const safeWriter = safe.streamHTML().getWriter();
    await safeWriter.write(
      '<section><template shadowrootmode="open"><b>shadow</b></template></section>',
    );
    await safeWriter.close();
    expect(safe.firstElementChild?.shadowRoot).toBeNull();
  });

  it("uses the document scripting state for a noscript context", async () => {
    const document = new DOMParser().parseFromString(
      "<body><noscript></noscript></body>",
      "text/html",
    );
    const noscript = document.querySelector("noscript");
    if (noscript === null) {
      throw new TypeError("Missing noscript streaming target");
    }
    const writer = noscript.streamHTMLUnsafe().getWriter();

    await writer.write("<b>enabled &a");
    await writer.write("mp;</b>");
    await writer.close();

    expect(noscript.innerHTML).toBe("<b>enabled &amp;</b>");
  });

  it("replaces head and body when streaming into an html element", async () => {
    const document = new DOMParser().parseFromString(
      "<head><title>old</title></head><body><p>old</p></body>",
      "text/html",
    );
    const html = document.documentElement;
    if (html === null) {
      throw new TypeError("Missing html streaming target");
    }
    const writer = html.streamHTMLUnsafe().getWriter();

    expect(html.childNodes.length).toBe(0);
    await writer.write("<head><meta name=x></head><bo");
    await writer.write("dy><p>new</p></body>");
    await writer.close();

    expect(document.head?.innerHTML).toBe('<meta name="x">');
    expect(document.body?.innerHTML).toBe("<p>new</p>");
  });
});
