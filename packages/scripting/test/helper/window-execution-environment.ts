import { documentImplementation } from "@palim/core/internal/dom/node-implementation.js";
import type { Document } from "@palim/core/internal/dom/nodes.js";

import { Engine262Adapter } from "@palim/engine262";
import { WindowScriptingEnvironment } from "@palim/scripting/internal/window-scripting.js";
import {
  WindowDocumentLoader,
  type WindowDocumentOptions,
} from "@palim/window/internal/document-loader.js";

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
