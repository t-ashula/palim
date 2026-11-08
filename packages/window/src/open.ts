import { documentImplementation } from "@palim/core/internal/dom/node-implementation.js";
import { parseXML } from "@palim/core/internal/xml/parser.js";
import type { URL } from "@palim/core/internal/url/index.js";

import { WindowDocumentLoader } from "./document-loader.js";
import type {
  Resource,
  ResourceLoader,
  WindowScripting,
} from "./document-loader.js";
import { decodeHTMLBytes } from "./html-byte-input.js";
import type { Window, WindowConsoleCall } from "./window.js";

export interface OpenHTMLOptions {
  readonly html: string;
  readonly baseURL?: string;
}

export interface OpenOptions {
  readonly scripting?: "enabled";
}

export interface OpenResult {
  readonly window: Window;
}

export type Open = (
  input: string | OpenHTMLOptions,
  options?: OpenOptions,
) => Promise<OpenResult>;

export type ScriptingFactory = (
  window: Window,
  resourceLoader: ResourceLoader | null,
) => Promise<WindowScripting> | WindowScripting;

interface HostResponse {
  readonly ok: boolean;
  readonly status: number;
  readonly url: string;
  readonly headers: {
    get(name: string): string | null;
  };
  arrayBuffer(): Promise<ArrayBuffer>;
}

export function createOpen(scriptingFactory?: ScriptingFactory): Open {
  return async (input, options = {}) => {
    const scriptingEnabled = options.scripting === "enabled";
    if (scriptingEnabled && scriptingFactory === undefined) {
      throw new TypeError("Scripting is not available in @palim/window");
    }

    const loader = new FetchResourceLoader();
    const initial =
      typeof input === "string"
        ? await loadInitialDocument(input)
        : {
            source: input.html,
            encoding: "UTF-8",
            url: input.baseURL ?? "about:blank",
            mimeType: "text/html",
          };
    const xmlDocument = isXMLMIMEType(initial.mimeType)
      ? parseXML(initial.source, initial.mimeType)
      : undefined;
    if (xmlDocument !== undefined) {
      documentImplementation(xmlDocument).scriptingMode = scriptingEnabled
        ? "enabled"
        : "disabled";
    }
    const environment = new WindowDocumentLoader(
      {
        consoleHandler: forwardConsoleCall,
        url: initial.url,
        resourceLoader: loader,
      },
      xmlDocument,
    );
    const implementation = documentImplementation(environment.window.document);
    implementation.encoding = initial.encoding;
    implementation.scriptingMode = scriptingEnabled ? "enabled" : "disabled";
    const scripting =
      scriptingEnabled && scriptingFactory !== undefined
        ? await scriptingFactory(environment.window, loader)
        : null;
    if (xmlDocument === undefined) {
      await environment.loadHTML(initial.source, scripting);
    } else {
      await environment.loadParsedDocument(scripting);
    }
    return { window: environment.window };
  };
}

export const open: Open = createOpen();

function forwardConsoleCall(call: WindowConsoleCall): void {
  const platform: unknown = globalThis;
  const hostConsole = (
    platform as {
      readonly console: Record<
        string,
        ((...data: unknown[]) => void) | undefined
      >;
    }
  ).console;
  const operation = hostConsole[call.method] ?? hostConsole.log;
  if (operation === undefined) {
    return;
  }
  operation.call(
    hostConsole,
    ...(call.method === "assert" ? [false, ...call.arguments] : call.arguments),
  );
}

class FetchResourceLoader implements ResourceLoader {
  async load(url: URL): Promise<Resource> {
    const response = await hostFetch(url.href);
    if (!response.ok) {
      throw new TypeError(
        `Failed to load resource: ${String(response.status)}`,
      );
    }
    return responseResource(response);
  }
}

async function loadInitialDocument(url: string): Promise<{
  readonly source: string;
  readonly encoding: string;
  readonly url: string;
  readonly mimeType: string;
}> {
  const response = await hostFetch(url);
  const resource = await responseResource(response);
  const mimeType =
    contentTypeEssence(response.headers.get("content-type")) ?? "text/html";
  const decoded = decodeHTMLBytes(resource.body, {
    ...(resource.encoding === undefined
      ? {}
      : { transportEncoding: resource.encoding }),
  });
  return {
    source: decoded.text,
    encoding: decoded.encoding,
    url: resource.url?.toString() ?? url,
    mimeType,
  };
}

async function responseResource(response: HostResponse): Promise<Resource> {
  const encoding = contentTypeEncoding(response.headers.get("content-type"));
  return {
    body: new Uint8Array(await response.arrayBuffer()),
    ...(response.url === "" ? {} : { url: response.url }),
    ...(encoding === undefined ? {} : { encoding }),
  };
}

function hostFetch(input: string): Promise<HostResponse> {
  const host: unknown = globalThis;
  return (
    host as {
      fetch(input: string): Promise<HostResponse>;
    }
  ).fetch(input);
}

function contentTypeEncoding(contentType: string | null): string | undefined {
  if (contentType === null) {
    return undefined;
  }
  const match =
    /(?:^|;)\s*charset\s*=\s*(?:"([^"]+)"|'([^']+)'|([^;\s]+))/iu.exec(
      contentType,
    );
  return match?.[1] ?? match?.[2] ?? match?.[3];
}

function contentTypeEssence(contentType: string | null): string | undefined {
  const essence = contentType?.split(";", 1)[0]?.trim().toLowerCase();
  return essence === undefined || essence === "" ? undefined : essence;
}

function isXMLMIMEType(mimeType: string): boolean {
  const slash = mimeType.indexOf("/");
  return (
    mimeType === "text/xml" ||
    mimeType === "application/xml" ||
    (slash > 0 && mimeType.slice(slash + 1).endsWith("+xml"))
  );
}
