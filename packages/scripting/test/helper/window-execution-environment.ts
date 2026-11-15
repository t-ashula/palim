import type { Document } from "@palim/core";
import { documentImplementation } from "@palim/core";
import { Engine262Adapter } from "@palim/engine262";
import type { WindowDocumentOptions } from "@palim/window";
import { WindowDocumentLoader } from "@palim/window";

import { WindowScriptingEnvironment } from "../../src/window-scripting.js";

export class WindowExecutionEnvironment extends WindowScriptingEnvironment {
  readonly #loader: WindowDocumentLoader;

  constructor(options: WindowDocumentOptions = {}, document?: Document) {
    const loader = new WindowDocumentLoader(options, document);
    documentImplementation(loader.window.document).scriptingMode = "enabled";
    super(new Engine262Adapter(), loader.window, loader.resourceLoader);
    this.#loader = loader;
  }

  loadHTML(source: string): Promise<Document> {
    return this.#loader.loadHTML(source, this);
  }

  loadParsedDocument(): Promise<Document> {
    return this.#loader.loadParsedDocument(this);
  }
}
