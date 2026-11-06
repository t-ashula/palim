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

export type DOMShellSourceResult =
  | DOMShellCompletedResult
  | DOMShellRunnerErrorResult;

type JSONRecord = Readonly<Record<string, unknown>>;

export const DOM_SHELL_SOURCE_SCOPES = [
  { prefix: "dom/abort/", suffixes: [".any.js"] },
  { prefix: "dom/events/", suffixes: [".any.js"] },
  { prefix: "dom/lists/", suffixes: [".html"] },
] as const;

export const DOM_SHELL_SOURCE_PREFIXES = DOM_SHELL_SOURCE_SCOPES.map(
  ({ prefix }) => prefix,
);

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
  return DOM_SHELL_SOURCE_SCOPES.flatMap(({ prefix, suffixes }) =>
    Object.entries(manifestScope(testharness, prefix))
      .filter(
        ([name, entry]) =>
          suffixes.some((suffix) => name.endsWith(suffix)) &&
          Array.isArray(entry),
      )
      .map(([name]) => `${prefix}${name}`),
  ).sort();
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
