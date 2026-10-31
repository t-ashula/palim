import { describe, expect, it } from "vitest";

import { inspectDocument, loadCorpus } from "../benchmark/corpus.js";
import { DOMParser } from "../src/index.js";

describe("benchmark corpus", () => {
  it("loads corpus files and verifies DOMParser output", () => {
    const corpus = loadCorpus();

    expect(corpus.schemaVersion).toBe(1);
    expect(corpus.cases.map(({ name }) => name)).toEqual([
      "document",
      "table",
      "list-1",
      "list-16",
      "list-64",
    ]);

    for (const fixture of corpus.cases) {
      const document = new DOMParser().parseFromString(
        fixture.input,
        "text/html",
      );
      expect(inspectDocument(document)).toEqual(fixture.expected);
    }
  });
});
