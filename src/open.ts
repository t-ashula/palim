import { decodeHTMLBytes } from "./html-byte-input.js";
import { WindowExecutionEnvironment } from "./window-javascript.js";
import type { Resource, ResourceLoader } from "./window-javascript.js";
import type { Window, WindowConsoleCall } from "./window.js";
import type { URL } from "./url/index.js";

export interface OpenHTMLOptions {
  readonly html: string;
  readonly baseURL?: string;
}

export interface OpenResult {
  readonly window: Window;
}

interface HostResponse {
  readonly ok: boolean;
  readonly status: number;
  readonly url: string;
  readonly headers: {
    get(name: string): string | null;
  };
  arrayBuffer(): Promise<ArrayBuffer>;
}

export async function open(
  input: string | OpenHTMLOptions,
): Promise<OpenResult> {
  const loader = new FetchResourceLoader();
  const initial =
    typeof input === "string"
      ? await loadInitialDocument(input)
      : {
          source: input.html,
          url: input.baseURL ?? "about:blank",
        };
  const environment = new WindowExecutionEnvironment({
    consoleHandler: forwardConsoleCall,
    url: initial.url,
    resourceLoader: loader,
  });
  await environment.loadHTML(initial.source);
  return new OpenedEnvironment(environment);
}

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

class OpenedEnvironment implements OpenResult {
  readonly #environment: WindowExecutionEnvironment;

  constructor(environment: WindowExecutionEnvironment) {
    this.#environment = environment;
  }

  get window(): Window {
    return this.#environment.window;
  }
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

async function loadInitialDocument(
  url: string,
): Promise<{ readonly source: string; readonly url: string }> {
  const response = await hostFetch(url);
  const resource = await responseResource(response);
  return {
    source: decodeHTMLBytes(resource.body, {
      ...(resource.encoding === undefined
        ? {}
        : { transportEncoding: resource.encoding }),
    }).text,
    url: resource.url?.toString() ?? url,
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
