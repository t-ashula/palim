import { isAbsolute, posix, relative, resolve, sep } from "node:path";

export type DOMShellSubtestStatus =
  | "pass"
  | "fail"
  | "timeout"
  | "not-run"
  | "precondition-failed";

export type DOMShellHarnessStatus =
  | "ok"
  | "error"
  | "timeout"
  | "precondition-failed";

export interface DOMShellSubtestResult {
  readonly name: string;
  readonly status: DOMShellSubtestStatus;
  readonly message: string | null;
  readonly stack: string | null;
}

export interface DOMShellHarnessResult {
  readonly status: DOMShellHarnessStatus;
  readonly message: string | null;
  readonly stack: string | null;
}

export interface DOMShellCompletedResult {
  readonly schemaVersion: 1;
  readonly profile: "dom-shell";
  readonly source: string;
  readonly result: "complete";
  readonly harness: DOMShellHarnessResult;
  readonly subtests: readonly DOMShellSubtestResult[];
}

export interface DOMShellRunnerErrorResult {
  readonly schemaVersion: 1;
  readonly profile: "dom-shell";
  readonly source: string;
  readonly result: "runner-error";
  readonly message: string;
  readonly stack?: string;
}

export type DOMShellExclusion =
  | "browser-profile-only"
  | "host-unsupported";

export interface DOMShellExcludedResult {
  readonly schemaVersion: 1;
  readonly profile: "dom-shell";
  readonly source: string;
  readonly result: "excluded";
  readonly classification: DOMShellExclusion;
  readonly message: string;
}

export type DOMShellSourceResult =
  | DOMShellCompletedResult
  | DOMShellExcludedResult
  | DOMShellRunnerErrorResult;

export type DOMShellSourceEligibility =
  | { readonly classification: "runnable" }
  | {
      readonly classification: DOMShellExclusion;
      readonly message: string;
    };

type JSONRecord = Readonly<Record<string, unknown>>;

export const DOM_SHELL_SOURCE_PREFIXES = [
  "dom/abort/",
  "dom/collections/",
  "dom/events/",
  "dom/lists/",
  "dom/nodes/",
  "dom/ranges/",
  "dom/traversal/",
  "domparsing/",
  "html/dom/documents/dom-tree-accessors/",
  "html/dom/elements/",
] as const;

function isRecord(value: unknown): value is JSONRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function manifestScope(
  testharness: JSONRecord,
  prefix: string,
): JSONRecord {
  const segments = prefix.replace(/\/$/u, "").split("/");
  let scope = testharness;
  for (const segment of segments) {
    const child = scope[segment];
    if (!isRecord(child)) {
      throw new TypeError(
        `WPT manifest has no testharness ${prefix.replace(/\/$/u, "")} scope`,
      );
    }
    scope = child;
  }
  return scope;
}

export function selectDOMShellSources(manifest: unknown): string[] {
  if (!isRecord(manifest)) {
    throw new TypeError("WPT manifest must be an object");
  }
  const items = manifest.items;
  const testharness = isRecord(items) ? items.testharness : undefined;
  if (!isRecord(testharness)) {
    throw new TypeError("WPT manifest has no testharness scope");
  }
  const sources: string[] = [];
  for (const prefix of DOM_SHELL_SOURCE_PREFIXES) {
    collectManifestSources(manifestScope(testharness, prefix), prefix, sources);
  }
  return sources.sort();
}

function collectManifestSources(
  scope: JSONRecord,
  prefix: string,
  sources: string[],
): void {
  for (const [name, entry] of Object.entries(scope)) {
    const path = `${prefix}${name}`;
    if (Array.isArray(entry)) {
      sources.push(path);
      continue;
    }
    if (isRecord(entry)) {
      collectManifestSources(entry, `${path}/`, sources);
    }
  }
}

const MARKUP_SOURCE = /\.(?:html?|xhtml|xht|xml|svg)$/u;
const GENERATED_CONTEXT_SOURCE = /\.(?:window|worker)\.js$/u;
const BROWSER_CAPABILITY =
  /\b(?:CSS|customElements|contentDocument|contentWindow|DOMContentLoaded|fetch|frames|getAnimations|getComputedStyle|iframe|location|navigator|performance|requestAnimationFrame|screen|trustedTypes|visualViewport|window|XMLHttpRequest)\b|\b(?:client|offset|scroll)(?:Height|Left|Top|Width)\b|\bgetBoundingClientRect\b|\.onload\b|\baddEventListener\s*\(\s*["'](?:animationstart|load)["']/iu;
const MODULE_SCRIPT = /<script\b[^>]*\btype\s*=\s*["']?module\b/iu;
const SCRIPT_SOURCE =
  /<script\b[^>]*\bsrc\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/giu;
const META_SCRIPT = /^\/\/ META: script=(.+)$/gmu;

export function referencedLocalScripts(sourceText: string): string[] {
  const resources = [
    ...[...sourceText.matchAll(META_SCRIPT)].map(
      (match) => match[1]?.trim() ?? "",
    ),
    ...[...sourceText.matchAll(SCRIPT_SOURCE)].map(
      (match) => match[1] ?? match[2] ?? match[3] ?? "",
    ),
  ];
  return resources.filter(
    (resource) =>
      resource !== "" &&
      resource !== "/resources/testharness.js" &&
      resource !== "/resources/testharnessreport.js",
  );
}

export function classifyDOMShellSource(
  source: string,
  sourceText: string,
): DOMShellSourceEligibility {
  if (GENERATED_CONTEXT_SOURCE.test(source)) {
    return {
      classification: "browser-profile-only",
      message: "generated source requires a Window or Worker global",
    };
  }
  if (source.includes(".sub.")) {
    return {
      classification: "host-unsupported",
      message: "source requires WPT substitution preprocessing",
    };
  }
  if (source.endsWith(".any.js")) {
    return { classification: "runnable" };
  }
  if (!MARKUP_SOURCE.test(source)) {
    return {
      classification: "host-unsupported",
      message: "source type is not supported by the DOM shell",
    };
  }
  if (MODULE_SCRIPT.test(sourceText)) {
    return {
      classification: "browser-profile-only",
      message: "module script execution requires the browser profile",
    };
  }
  if (BROWSER_CAPABILITY.test(sourceText)) {
    return {
      classification: "browser-profile-only",
      message: "source requires Window, layout, navigation, or network",
    };
  }
  for (const resource of referencedLocalScripts(sourceText)) {
    if (
      resource.includes("?") ||
      resource.includes("#") ||
      /^(?:https?:)?\/\//u.test(resource) ||
      /^[a-z][a-z0-9+.-]*:/iu.test(resource) ||
      /\.(?:asis|py)(?:$|[?#])/u.test(resource)
    ) {
      return {
        classification: "host-unsupported",
        message: "script resource requires WPT server processing",
      };
    }
  }
  return { classification: "runnable" };
}

export function resolveWPTSourcePath(wptRoot: string, source: string): string {
  if (isAbsolute(source)) {
    throw new TypeError("DOM shell source must be relative to the WPT root");
  }
  const root = resolve(wptRoot);
  const path = resolve(root, source);
  const relativePath = relative(root, path);
  if (
    relativePath === "" ||
    relativePath === ".." ||
    relativePath.startsWith(`..${sep}`) ||
    isAbsolute(relativePath)
  ) {
    throw new TypeError("DOM shell source must stay inside the WPT root");
  }
  return path;
}

export function resolveWPTResourcePath(
  wptRoot: string,
  source: string,
  resource: string,
): string {
  if (resource.includes("?") || resource.includes("#")) {
    throw new TypeError("DOM shell local resources cannot use query or fragment");
  }
  const resourcePath = resource.startsWith("/")
    ? resource.slice(1)
    : posix.join(posix.dirname(source), resource);
  return resolveWPTSourcePath(wptRoot, resourcePath);
}

export function isPassingDOMShellResult(
  result: DOMShellSourceResult,
): boolean {
  return (
    result.result === "complete" &&
    result.harness.status === "ok" &&
    result.subtests.every((subtest) => subtest.status === "pass")
  );
}

export function isSuccessfulDOMShellResult(
  result: DOMShellSourceResult,
): boolean {
  return result.result === "excluded" || isPassingDOMShellResult(result);
}

export function isDOMShellSourceResult(
  value: unknown,
): value is DOMShellSourceResult {
  if (!isRecord(value)) {
    return false;
  }
  if (
    value.schemaVersion !== 1 ||
    value.profile !== "dom-shell" ||
    typeof value.source !== "string"
  ) {
    return false;
  }
  if (value.result === "runner-error") {
    return typeof value.message === "string";
  }
  if (value.result === "excluded") {
    return (
      (value.classification === "browser-profile-only" ||
        value.classification === "host-unsupported") &&
      typeof value.message === "string"
    );
  }
  if (value.result !== "complete" || !isRecord(value.harness)) {
    return false;
  }
  const subtests = value.subtests;
  return (
    typeof value.harness.status === "string" &&
    Array.isArray(subtests) &&
    subtests.every(
      (subtest) =>
        isRecord(subtest) &&
        typeof subtest.name === "string" &&
        typeof subtest.status === "string",
    )
  );
}
