import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  buildWPTProgressReport,
  renderWPTProgressMarkdown,
  selectWPTURLs,
} from "../conformance/wpt-progress.js";
import type {
  WPTCampaignReport,
  WPTProgressReport,
  WPTSubtestResult,
  WPTTestResult,
} from "../conformance/wpt-progress.js";

type CampaignLifecycle = WPTCampaignReport["state"];

interface CommandOptions {
  readonly cwd?: string;
  readonly env?: NodeJS.ProcessEnv;
}

interface ParsedOptions {
  readonly resume?: string;
  readonly id?: string;
  readonly jobs?: number;
  readonly attemptTimeoutSeconds?: number;
  readonly mergeEvery?: number;
  readonly mergeIntervalSeconds?: number;
}

interface CampaignOptions {
  readonly jobs: number;
  readonly attemptTimeoutSeconds: number;
  readonly mergeEvery: number;
  readonly mergeIntervalSeconds: number;
}

interface CampaignFile {
  readonly schemaVersion: 1;
  readonly id: string;
  readonly createdAt: string;
  readonly repositoryRoot: string;
  readonly wpt: {
    readonly revision: string;
    readonly checkoutRevision: string;
    readonly checkoutDiffDigest: string;
    readonly manifestDigest: string;
    readonly include: readonly string[];
    readonly exclude: readonly string[];
    readonly includeDigest: string;
    readonly excludeDigest: string;
    readonly selectedURLDigest: string;
  };
  readonly palim: {
    readonly revision: string;
    readonly dirty: boolean;
    readonly imageTag: string;
    readonly imageId: string;
  };
  readonly runner: {
    readonly timeoutMultiplier: 5;
    readonly attemptTimeoutSeconds: number;
  };
  readonly defaults: CampaignOptions;
}

interface CampaignStateFile {
  readonly schemaVersion: 1;
  readonly state: CampaignLifecycle;
  readonly nextAttemptSequence: number;
  readonly workerFailures: number;
  readonly retries: number;
  readonly updatedAt: string;
}

interface AttemptFile {
  readonly schemaVersion: 1;
  readonly campaignId: string;
  readonly sequence: number;
  readonly url: string;
  readonly workerId: number;
  readonly state: "running" | "completed" | "failed";
  readonly startedAt: string;
  readonly finishedAt?: string;
  readonly processExitCode?: number;
  readonly processSignal?: NodeJS.Signals;
  readonly exceededDeadline?: boolean;
  readonly resultFile?: string;
}

export interface CampaignAttemptResult {
  readonly sequence: number;
  readonly url: string;
  readonly state: AttemptFile["state"];
  readonly result?: WPTTestResult;
}

interface Runtime {
  readonly root: string;
  readonly directory: string;
  readonly campaign: CampaignFile;
  readonly urls: readonly string[];
  readonly options: CampaignOptions;
  state: CampaignStateFile;
}

interface ProcessResult {
  readonly exitCode?: number;
  readonly signal?: NodeJS.Signals;
  readonly exceededDeadline: boolean;
}

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, "../..");
const campaignsRoot = resolve(repositoryRoot, "tmp/wpt/campaigns");
const reportLockPath = resolve(repositoryRoot, "tmp/wpt/campaign-report.lock");

function usage(): string {
  return [
    "usage: npm run wpt:test -- --campaign [OPTIONS]",
    "",
    "Options:",
    "  --resume ID                       Resume an existing campaign",
    "  --id ID                           Set a new campaign ID",
    "  --jobs N                          Concurrent workers (default: 10)",
    "  --attempt-timeout-seconds N       Whole-attempt deadline (default: 360)",
    "  --merge-every N                   Merge after N completions (default: 10)",
    "  --merge-interval-seconds N        Periodic merge interval (default: 60)",
  ].join("\n");
}

function positiveInteger(name: string, value: string | undefined): number {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number <= 0) {
    throw new TypeError(`${name} requires a positive integer`);
  }
  return number;
}

function parseOptions(arguments_: readonly string[]): ParsedOptions {
  const options: {
    resume?: string;
    id?: string;
    jobs?: number;
    attemptTimeoutSeconds?: number;
    mergeEvery?: number;
    mergeIntervalSeconds?: number;
  } = {};
  for (let index = 0; index < arguments_.length; index += 1) {
    const argument = arguments_[index];
    const value = arguments_[index + 1];
    switch (argument) {
      case "--resume":
        if (value === undefined || value.startsWith("--")) {
          throw new TypeError("--resume requires a campaign ID");
        }
        options.resume = value;
        index += 1;
        break;
      case "--id":
        if (value === undefined || value.startsWith("--")) {
          throw new TypeError("--id requires a campaign ID");
        }
        options.id = value;
        index += 1;
        break;
      case "--jobs":
        options.jobs = positiveInteger("--jobs", value);
        index += 1;
        break;
      case "--attempt-timeout-seconds":
        options.attemptTimeoutSeconds = positiveInteger(argument, value);
        index += 1;
        break;
      case "--merge-every":
        options.mergeEvery = positiveInteger(argument, value);
        index += 1;
        break;
      case "--merge-interval-seconds":
        options.mergeIntervalSeconds = positiveInteger(argument, value);
        index += 1;
        break;
      case "--help":
      case "-h":
        console.log(usage());
        process.exit(0);
        break;
      default:
        throw new TypeError(`unknown campaign option ${String(argument)}`);
    }
  }
  if (options.resume !== undefined && options.id !== undefined) {
    throw new TypeError("--resume and --id cannot be used together");
  }
  return options;
}

function record(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function readJSON(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf8")) as unknown;
}

function writeTextAtomic(path: string, value: string): void {
  mkdirSync(dirname(path), { recursive: true });
  const temporaryPath = `${path}.${String(process.pid)}.tmp`;
  writeFileSync(temporaryPath, value);
  renameSync(temporaryPath, path);
}

function writeJSONAtomic(path: string, value: unknown): void {
  writeTextAtomic(path, `${JSON.stringify(value, null, 2)}\n`);
}

function digest(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function fileDigest(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function readPrefixes(path: string): string[] {
  return readFileSync(path, "utf8")
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter((line) => line !== "" && !line.startsWith("#"));
}

function commandOutput(command: string, arguments_: readonly string[]): string {
  const result = spawnSync(command, arguments_, {
    cwd: repositoryRoot,
    encoding: "utf8",
  });
  if (result.status !== 0) {
    throw new Error(
      `${command} failed: ${(result.stderr || result.stdout).trim()}`,
    );
  }
  return result.stdout.trim();
}

async function runCommand(
  command: string,
  arguments_: readonly string[],
  options: CommandOptions = {},
): Promise<number> {
  return await new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(command, arguments_, {
      cwd: options.cwd ?? repositoryRoot,
      env: options.env ?? process.env,
      stdio: "inherit",
    });
    child.once("error", rejectPromise);
    child.once("exit", (code) => {
      resolvePromise(code ?? 1);
    });
  });
}

async function requireCommand(
  command: string,
  arguments_: readonly string[],
  options?: CommandOptions,
): Promise<void> {
  const status = await runCommand(command, arguments_, options);
  if (status !== 0) {
    throw new Error(`${command} exited with status ${String(status)}`);
  }
}

function generatedCampaignId(): string {
  const timestamp = new Date()
    .toISOString()
    .replaceAll(/[-:.]/gu, "")
    .replace("Z", "z")
    .toLowerCase();
  return `${timestamp}-${String(process.pid)}`;
}

function validateCampaignId(id: string): string {
  if (!/^[a-z0-9][a-z0-9._-]{0,63}$/u.test(id)) {
    throw new TypeError(
      "campaign ID must use 1-64 lowercase letters, digits, dots, underscores, or hyphens",
    );
  }
  return id;
}

function fixtureRevision(manifest: unknown): string {
  const fixture = record(record(record(manifest)?.fixtures)?.["wpt/wpt"]);
  const revision = fixture?.revision;
  if (typeof revision !== "string") {
    throw new TypeError("conformance manifest has no wpt/wpt revision");
  }
  return revision;
}

function parseSubtest(value: unknown): WPTSubtestResult | undefined {
  const item = record(value);
  if (typeof item?.name !== "string" || typeof item.status !== "string") {
    return undefined;
  }
  const message = item.message;
  if (
    message !== undefined &&
    message !== null &&
    typeof message !== "string"
  ) {
    return undefined;
  }
  return {
    name: item.name,
    status: item.status,
    ...(message === undefined ? {} : { message }),
  };
}

function parseTestResult(value: unknown): WPTTestResult | undefined {
  const item = record(value);
  if (
    typeof item?.test !== "string" ||
    typeof item.status !== "string" ||
    !Array.isArray(item.subtests)
  ) {
    return undefined;
  }
  const subtests = item.subtests.map(parseSubtest);
  if (subtests.some((subtest) => subtest === undefined)) {
    return undefined;
  }
  const message = item.message;
  const duration = item.duration;
  if (
    (message !== undefined &&
      message !== null &&
      typeof message !== "string") ||
    (duration !== undefined && typeof duration !== "number")
  ) {
    return undefined;
  }
  return {
    test: item.test,
    status: item.status,
    ...(message === undefined ? {} : { message }),
    ...(duration === undefined ? {} : { duration }),
    subtests: subtests as WPTSubtestResult[],
  };
}

function readSingleResult(
  path: string,
  expectedURL: string,
): WPTTestResult | undefined {
  if (!existsSync(path)) {
    return undefined;
  }
  const report = record(readJSON(path));
  if (!Array.isArray(report?.results) || report.results.length !== 1) {
    return undefined;
  }
  const result = parseTestResult(report.results[0]);
  return result?.test === expectedURL ? result : undefined;
}

export function selectLatestCampaignResults(
  attempts: readonly CampaignAttemptResult[],
  selectedURLs: readonly string[],
): WPTTestResult[] {
  const selected = new Set(selectedURLs);
  const latest = new Map<string, CampaignAttemptResult>();
  for (const attempt of attempts) {
    if (
      attempt.state !== "completed" ||
      attempt.result?.test !== attempt.url ||
      !selected.has(attempt.url)
    ) {
      continue;
    }
    const current = latest.get(attempt.url);
    if (current === undefined || current.sequence < attempt.sequence) {
      latest.set(attempt.url, attempt);
    }
  }
  return selectedURLs.flatMap((url) => {
    const result = latest.get(url)?.result;
    return result === undefined ? [] : [result];
  });
}

function parseAttemptFile(path: string): AttemptFile | undefined {
  const value = record(readJSON(path));
  if (
    value?.schemaVersion !== 1 ||
    typeof value.campaignId !== "string" ||
    typeof value.sequence !== "number" ||
    typeof value.url !== "string" ||
    typeof value.workerId !== "number" ||
    (value.state !== "running" &&
      value.state !== "completed" &&
      value.state !== "failed") ||
    typeof value.startedAt !== "string"
  ) {
    return undefined;
  }
  return value as unknown as AttemptFile;
}

function scanAttempts(runtime: Runtime): CampaignAttemptResult[] {
  const directory = resolve(runtime.directory, "attempts");
  if (!existsSync(directory)) {
    return [];
  }
  const attempts: CampaignAttemptResult[] = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue;
    }
    const attemptDirectory = resolve(directory, entry.name);
    const metadataPath = resolve(attemptDirectory, "attempt.json");
    if (!existsSync(metadataPath)) {
      continue;
    }
    const metadata = parseAttemptFile(metadataPath);
    if (metadata?.campaignId !== runtime.campaign.id) {
      continue;
    }
    const result =
      metadata.state === "completed"
        ? readSingleResult(
            resolve(attemptDirectory, "wptreport.json"),
            metadata.url,
          )
        : undefined;
    attempts.push({
      sequence: metadata.sequence,
      url: metadata.url,
      state:
        metadata.state === "completed" && result === undefined
          ? "failed"
          : metadata.state,
      ...(result === undefined ? {} : { result }),
    });
  }
  return attempts;
}

function testPassed(test: WPTTestResult): boolean {
  return (
    (test.status === "OK" || test.status === "PASS") &&
    test.subtests.every(({ status }) => status === "PASS")
  );
}

function campaignReportMetadata(
  runtime: Runtime,
  attempts: readonly CampaignAttemptResult[],
): WPTCampaignReport {
  return {
    id: runtime.campaign.id,
    state: runtime.state.state,
    palim: {
      revision: runtime.campaign.palim.revision,
      dirty: runtime.campaign.palim.dirty,
      imageId: runtime.campaign.palim.imageId,
    },
    lastAttemptSequence: attempts.reduce(
      (maximum, attempt) => Math.max(maximum, attempt.sequence),
      0,
    ),
    snapshotAt: runtime.state.updatedAt,
    workerFailures: runtime.state.workerFailures,
    retries: runtime.state.retries,
  };
}

function mergeCampaign(runtime: Runtime): WPTProgressReport {
  const attempts = scanAttempts(runtime);
  const results = selectLatestCampaignResults(attempts, runtime.urls);
  const runStatus: WPTProgressReport["runStatus"] =
    runtime.state.state === "completed"
      ? results.every(testPassed)
        ? "passed"
        : "failed"
      : "interrupted";
  const report = buildWPTProgressReport(
    { results },
    runtime.urls,
    runtime.campaign.wpt.include,
    runtime.campaign.wpt.exclude,
    runtime.campaign.wpt.revision,
    runStatus,
    campaignReportMetadata(runtime, attempts),
  );
  const mergedDirectory = resolve(runtime.directory, "merged");
  writeJSONAtomic(resolve(mergedDirectory, "wptreport.json"), { results });
  writeJSONAtomic(resolve(mergedDirectory, "report.json"), report);
  writeTextAtomic(
    resolve(mergedDirectory, "report.md"),
    renderWPTProgressMarkdown(report),
  );
  const reportDirectory = resolve(runtime.root, "reports/wpt");
  writeJSONAtomic(resolve(reportDirectory, "report.json"), report);
  writeTextAtomic(
    resolve(reportDirectory, "report.md"),
    renderWPTProgressMarkdown(report),
  );
  console.log(
    `Campaign ${runtime.campaign.id}: ${String(report.totals.executed)}/${String(report.totals.total)} URLs executed`,
  );
  return report;
}

function writeState(runtime: Runtime, state: CampaignStateFile): void {
  runtime.state = state;
  writeJSONAtomic(resolve(runtime.directory, "state.json"), state);
}

function nextState(
  runtime: Runtime,
  updates: Partial<Omit<CampaignStateFile, "schemaVersion" | "updatedAt">>,
): CampaignStateFile {
  return {
    ...runtime.state,
    ...updates,
    schemaVersion: 1,
    updatedAt: new Date().toISOString(),
  };
}

function readCampaignFile(path: string): CampaignFile {
  const value = record(readJSON(path));
  if (value?.schemaVersion !== 1 || typeof value.id !== "string") {
    throw new TypeError(`invalid campaign file ${path}`);
  }
  return value as unknown as CampaignFile;
}

function readStateFile(path: string): CampaignStateFile {
  const value = record(readJSON(path));
  if (
    value?.schemaVersion !== 1 ||
    (value.state !== "running" &&
      value.state !== "interrupted" &&
      value.state !== "completed") ||
    typeof value.nextAttemptSequence !== "number" ||
    typeof value.workerFailures !== "number" ||
    typeof value.retries !== "number" ||
    typeof value.updatedAt !== "string"
  ) {
    throw new TypeError(`invalid campaign state ${path}`);
  }
  return value as unknown as CampaignStateFile;
}

function readURLs(path: string): string[] {
  const value = record(readJSON(path));
  if (
    value?.schemaVersion !== 1 ||
    !Array.isArray(value.urls) ||
    !value.urls.every((url) => typeof url === "string")
  ) {
    throw new TypeError(`invalid campaign URL file ${path}`);
  }
  return value.urls;
}

async function ensureFixtures(): Promise<void> {
  const required = [
    resolve(repositoryRoot, "conformance/wpt/wpt"),
    resolve(repositoryRoot, "packages/core/src/html/entities.json"),
    resolve(repositoryRoot, "packages/core/src/url/idna-mapping.json"),
    resolve(repositoryRoot, "packages/core/src/url/idna-properties.json"),
    resolve(repositoryRoot, "vendor/engine262/package.json"),
  ];
  if (required.every(existsSync)) {
    return;
  }
  await requireCommand(
    "sh",
    [resolve(repositoryRoot, "tools/conformance/sync.sh")],
    {
      env: { ...process.env, PALIM_REPOSITORY_ROOT: repositoryRoot },
    },
  );
}

async function prepareImage(imageTag: string): Promise<string> {
  await requireCommand("docker", [
    "build",
    "--file",
    resolve(repositoryRoot, "tools/wpt/Dockerfile"),
    "--tag",
    imageTag,
    repositoryRoot,
  ]);
  const imageId = commandOutput("docker", [
    "image",
    "inspect",
    "--format",
    "{{.Id}}",
    imageTag,
  ]);
  await prepareWPTEnvironment(imageTag);
  return imageId;
}

async function prepareWPTEnvironment(imageTag: string): Promise<void> {
  await requireCommand("docker", [
    "run",
    "--rm",
    "--volume",
    `${resolve(repositoryRoot, "conformance")}:/workspace/conformance`,
    imageTag,
    "--prepare",
  ]);
}

function selectedURLContext(): {
  readonly manifest: unknown;
  readonly manifestPath: string;
  readonly includePath: string;
  readonly excludePath: string;
  readonly include: string[];
  readonly exclude: string[];
  readonly urls: string[];
} {
  const manifestPath = resolve(
    repositoryRoot,
    "conformance/wpt/wpt/MANIFEST.json",
  );
  const includePath = resolve(repositoryRoot, "tools/wpt/include.txt");
  const excludePath = resolve(repositoryRoot, "tools/wpt/exclude.txt");
  const manifest = readJSON(manifestPath);
  const include = readPrefixes(includePath);
  const exclude = readPrefixes(excludePath);
  return {
    manifest,
    manifestPath,
    includePath,
    excludePath,
    include,
    exclude,
    urls: selectWPTURLs(manifest, include, exclude),
  };
}

function wptCheckoutDiffDigest(): string {
  return digest(
    commandOutput("git", [
      "-C",
      resolve(repositoryRoot, "conformance/wpt/wpt"),
      "diff",
      "--no-ext-diff",
      "--binary",
      "HEAD",
      "--",
    ]),
  );
}

async function createRuntime(
  id: string,
  parsed: ParsedOptions,
): Promise<Runtime> {
  await ensureFixtures();
  const options: CampaignOptions = {
    jobs: parsed.jobs ?? 10,
    attemptTimeoutSeconds: parsed.attemptTimeoutSeconds ?? 360,
    mergeEvery: parsed.mergeEvery ?? 10,
    mergeIntervalSeconds: parsed.mergeIntervalSeconds ?? 60,
  };
  const directory = resolve(campaignsRoot, id);
  if (existsSync(directory)) {
    throw new Error(`campaign ${id} already exists; use --resume ${id}`);
  }
  const imageTag = `palim-wpt-campaign:${id}`;
  const imageId = await prepareImage(imageTag);
  const context = selectedURLContext();
  mkdirSync(directory, { recursive: true });
  const conformanceManifestPath = resolve(
    repositoryRoot,
    "conformance/conformance.json",
  );
  const conformanceManifest = readJSON(conformanceManifestPath);
  const campaign: CampaignFile = {
    schemaVersion: 1,
    id,
    createdAt: new Date().toISOString(),
    repositoryRoot,
    wpt: {
      revision: fixtureRevision(conformanceManifest),
      checkoutRevision: commandOutput("git", [
        "-C",
        resolve(repositoryRoot, "conformance/wpt/wpt"),
        "rev-parse",
        "HEAD",
      ]),
      checkoutDiffDigest: wptCheckoutDiffDigest(),
      manifestDigest: fileDigest(context.manifestPath),
      include: context.include,
      exclude: context.exclude,
      includeDigest: fileDigest(context.includePath),
      excludeDigest: fileDigest(context.excludePath),
      selectedURLDigest: digest(JSON.stringify(context.urls)),
    },
    palim: {
      revision: commandOutput("git", ["rev-parse", "HEAD"]),
      dirty: commandOutput("git", ["status", "--porcelain"]) !== "",
      imageTag,
      imageId,
    },
    runner: {
      timeoutMultiplier: 5,
      attemptTimeoutSeconds: options.attemptTimeoutSeconds,
    },
    defaults: options,
  };
  const state: CampaignStateFile = {
    schemaVersion: 1,
    state: "running",
    nextAttemptSequence: 1,
    workerFailures: 0,
    retries: 0,
    updatedAt: new Date().toISOString(),
  };
  writeJSONAtomic(resolve(directory, "campaign.json"), campaign);
  writeJSONAtomic(resolve(directory, "urls.json"), {
    schemaVersion: 1,
    urls: context.urls,
  });
  writeJSONAtomic(resolve(directory, "state.json"), state);
  return {
    root: repositoryRoot,
    directory,
    campaign,
    urls: context.urls,
    options,
    state,
  };
}

async function resumeRuntime(
  id: string,
  parsed: ParsedOptions,
): Promise<Runtime> {
  const directory = resolve(campaignsRoot, id);
  const campaign = readCampaignFile(resolve(directory, "campaign.json"));
  const urls = readURLs(resolve(directory, "urls.json"));
  await prepareWPTEnvironment(campaign.palim.imageTag);
  const context = selectedURLContext();
  const conformanceManifest = readJSON(
    resolve(repositoryRoot, "conformance/conformance.json"),
  );
  if (
    fixtureRevision(conformanceManifest) !== campaign.wpt.revision ||
    fileDigest(context.manifestPath) !== campaign.wpt.manifestDigest ||
    fileDigest(context.includePath) !== campaign.wpt.includeDigest ||
    fileDigest(context.excludePath) !== campaign.wpt.excludeDigest ||
    digest(JSON.stringify(urls)) !== campaign.wpt.selectedURLDigest ||
    commandOutput("git", [
      "-C",
      resolve(repositoryRoot, "conformance/wpt/wpt"),
      "rev-parse",
      "HEAD",
    ]) !== campaign.wpt.checkoutRevision ||
    wptCheckoutDiffDigest() !== campaign.wpt.checkoutDiffDigest
  ) {
    throw new Error(
      `campaign ${id} cannot resume because its WPT inputs changed`,
    );
  }
  const currentImageId = commandOutput("docker", [
    "image",
    "inspect",
    "--format",
    "{{.Id}}",
    campaign.palim.imageTag,
  ]);
  if (currentImageId !== campaign.palim.imageId) {
    throw new Error(`campaign ${id} container image is unavailable or changed`);
  }
  const attemptTimeoutSeconds =
    parsed.attemptTimeoutSeconds ?? campaign.runner.attemptTimeoutSeconds;
  if (attemptTimeoutSeconds !== campaign.runner.attemptTimeoutSeconds) {
    throw new Error("an existing campaign cannot change its attempt deadline");
  }
  const state = readStateFile(resolve(directory, "state.json"));
  const options: CampaignOptions = {
    jobs: parsed.jobs ?? campaign.defaults.jobs,
    attemptTimeoutSeconds,
    mergeEvery: parsed.mergeEvery ?? campaign.defaults.mergeEvery,
    mergeIntervalSeconds:
      parsed.mergeIntervalSeconds ?? campaign.defaults.mergeIntervalSeconds,
  };
  const runtime: Runtime = {
    root: repositoryRoot,
    directory,
    campaign,
    urls,
    options,
    state,
  };
  const attempts = scanAttempts(runtime);
  const maximumSequence = attempts.reduce(
    (maximum, attempt) => Math.max(maximum, attempt.sequence),
    0,
  );
  writeState(
    runtime,
    nextState(runtime, {
      state: "running",
      nextAttemptSequence: Math.max(
        runtime.state.nextAttemptSequence,
        maximumSequence + 1,
      ),
    }),
  );
  return runtime;
}

function errnoCode(error: unknown): string | undefined {
  return record(error)?.code as string | undefined;
}

function acquireReportLock(campaignId: string): () => void {
  mkdirSync(dirname(reportLockPath), { recursive: true });
  const contents = JSON.stringify({ campaignId, pid: process.pid });
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      writeFileSync(reportLockPath, contents, { flag: "wx" });
      return () => {
        if (
          existsSync(reportLockPath) &&
          readFileSync(reportLockPath, "utf8") === contents
        ) {
          unlinkSync(reportLockPath);
        }
      };
    } catch (error) {
      if (errnoCode(error) !== "EEXIST") {
        throw error;
      }
      const lock = record(readJSON(reportLockPath));
      const pid = lock?.pid;
      if (typeof pid === "number") {
        try {
          process.kill(pid, 0);
          throw new Error(
            `campaign ${String(lock?.campaignId)} is already updating the WPT report`,
          );
        } catch (signalError) {
          if (errnoCode(signalError) !== "ESRCH") {
            throw signalError;
          }
        }
      }
      rmSync(reportLockPath, { force: true });
    }
  }
  throw new Error("unable to acquire WPT campaign report lock");
}

async function stopContainer(name: string): Promise<void> {
  await runCommand("docker", ["stop", "--time", "5", name]);
}

async function runContainerAttempt(
  runtime: Runtime,
  containerName: string,
  attemptDirectory: string,
  url: string,
  runningContainers: Set<string>,
): Promise<ProcessResult> {
  const containerAttemptDirectory = `/workspace/tmp/${relative(
    resolve(runtime.root, "tmp"),
    attemptDirectory,
  )}`;
  const arguments_ = [
    "run",
    "--rm",
    "--name",
    containerName,
    "--volume",
    `${resolve(runtime.root, "conformance")}:/workspace/conformance`,
    "--volume",
    `${resolve(runtime.root, "tmp")}:/workspace/tmp`,
    "--env",
    "PALIM_WPT_ENVIRONMENT_PREPARED=1",
    "--env",
    `PALIM_CONFORMANCE_RAW_DIRECTORY=${containerAttemptDirectory}`,
    "--env",
    `PALIM_CONFORMANCE_REPORT_DIRECTORY=${containerAttemptDirectory}/report`,
    "--env",
    "PALIM_CONFORMANCE_MANIFEST=/workspace/conformance/conformance.json",
    "--env",
    "PALIM_WPT_MANIFEST=/workspace/conformance/wpt/wpt/MANIFEST.json",
    "--env",
    "PALIM_WPT_INCLUDE_FILE=/workspace/tools/wpt/include.txt",
    "--env",
    "PALIM_WPT_EXCLUDE_FILE=/workspace/tools/wpt/exclude.txt",
    runtime.campaign.palim.imageTag,
    url,
  ];
  return await new Promise((resolvePromise, rejectPromise) => {
    let exceededDeadline = false;
    let settled = false;
    const child = spawn("docker", arguments_, {
      cwd: runtime.root,
      stdio: "inherit",
    });
    runningContainers.add(containerName);
    const deadlineMilliseconds = runtime.options.attemptTimeoutSeconds * 1000;
    const deadlineTimer = setTimeout(() => {
      exceededDeadline = true;
      void stopContainer(containerName);
    }, deadlineMilliseconds);
    const forceTimer = setTimeout(() => {
      if (!settled) {
        child.kill("SIGKILL");
        void runCommand("docker", ["rm", "--force", containerName]);
      }
    }, deadlineMilliseconds + 10_000);
    child.once("error", (error) => {
      settled = true;
      clearTimeout(deadlineTimer);
      clearTimeout(forceTimer);
      runningContainers.delete(containerName);
      rejectPromise(error);
    });
    child.once("exit", (code, signal) => {
      settled = true;
      clearTimeout(deadlineTimer);
      clearTimeout(forceTimer);
      runningContainers.delete(containerName);
      resolvePromise({
        ...(code === null ? {} : { exitCode: code }),
        ...(signal === null ? {} : { signal }),
        exceededDeadline,
      });
    });
  });
}

async function runCampaign(runtime: Runtime): Promise<WPTProgressReport> {
  const initialAttempts = scanAttempts(runtime);
  const initialResults = selectLatestCampaignResults(
    initialAttempts,
    runtime.urls,
  );
  const completedURLs = new Set(initialResults.map(({ test }) => test));
  const queue = runtime.urls.filter((url) => !completedURLs.has(url));
  const runningContainers = new Set<string>();
  const failuresByURL = new Map<string, number>();
  const control = { stopping: false, interrupted: false };
  const isStopping = (): boolean => control.stopping;
  let completionsSinceMerge = 0;
  let mergeChain = Promise.resolve<WPTProgressReport | undefined>(undefined);

  const requestMerge = (): Promise<WPTProgressReport | undefined> => {
    mergeChain = mergeChain.then(() => mergeCampaign(runtime));
    return mergeChain;
  };
  const stop = (signal: NodeJS.Signals): void => {
    if (control.stopping) {
      return;
    }
    control.stopping = true;
    control.interrupted = true;
    console.log(`Stopping WPT campaign after ${signal}`);
    for (const name of runningContainers) {
      void stopContainer(name);
    }
  };
  const onInterrupt = (): void => {
    stop("SIGINT");
  };
  const onTerminate = (): void => {
    stop("SIGTERM");
  };
  process.once("SIGINT", onInterrupt);
  process.once("SIGTERM", onTerminate);
  const interval = setInterval(() => {
    void requestMerge();
  }, runtime.options.mergeIntervalSeconds * 1000);

  const worker = async (workerId: number): Promise<void> => {
    while (!isStopping()) {
      const url = queue.shift();
      if (url === undefined) {
        return;
      }
      const sequence = runtime.state.nextAttemptSequence;
      writeState(
        runtime,
        nextState(runtime, { nextAttemptSequence: sequence + 1 }),
      );
      const attemptDirectory = resolve(
        runtime.directory,
        "attempts",
        String(sequence).padStart(8, "0"),
      );
      mkdirSync(attemptDirectory, { recursive: true });
      const startedAt = new Date().toISOString();
      const runningAttempt: AttemptFile = {
        schemaVersion: 1,
        campaignId: runtime.campaign.id,
        sequence,
        url,
        workerId,
        state: "running",
        startedAt,
      };
      writeJSONAtomic(
        resolve(attemptDirectory, "attempt.json"),
        runningAttempt,
      );
      const containerName = `palim-wpt-${runtime.campaign.id}-${String(sequence)}`;
      const processResult = await runContainerAttempt(
        runtime,
        containerName,
        attemptDirectory,
        url,
        runningContainers,
      );
      const finishedAt = new Date().toISOString();
      const result = readSingleResult(
        resolve(attemptDirectory, "wptreport.json"),
        url,
      );
      const completed = result !== undefined;
      const attempt: AttemptFile = {
        ...runningAttempt,
        state: completed ? "completed" : "failed",
        finishedAt,
        ...(processResult.exitCode === undefined
          ? {}
          : { processExitCode: processResult.exitCode }),
        ...(processResult.signal === undefined
          ? {}
          : { processSignal: processResult.signal }),
        ...(processResult.exceededDeadline ? { exceededDeadline: true } : {}),
        ...(completed ? { resultFile: "wptreport.json" } : {}),
      };
      writeJSONAtomic(resolve(attemptDirectory, "attempt.json"), attempt);
      if (completed) {
        completedURLs.add(url);
        failuresByURL.delete(url);
        writeState(runtime, nextState(runtime, {}));
        completionsSinceMerge += 1;
        if (completionsSinceMerge >= runtime.options.mergeEvery) {
          completionsSinceMerge = 0;
          await requestMerge();
        }
        continue;
      }
      const failures = (failuresByURL.get(url) ?? 0) + 1;
      failuresByURL.set(url, failures);
      writeState(
        runtime,
        nextState(runtime, {
          workerFailures: runtime.state.workerFailures + 1,
          retries: isStopping()
            ? runtime.state.retries
            : runtime.state.retries + 1,
        }),
      );
      if (!isStopping()) {
        const backoffMilliseconds = Math.min(
          30_000,
          1000 * 2 ** Math.min(failures - 1, 5),
        );
        await delay(backoffMilliseconds);
        queue.push(url);
      }
    }
  };

  try {
    await requestMerge();
    const workers = Array.from(
      { length: Math.min(runtime.options.jobs, Math.max(queue.length, 1)) },
      (_, index) => worker(index + 1),
    );
    await Promise.all(workers);
    writeState(
      runtime,
      nextState(runtime, {
        state: control.interrupted ? "interrupted" : "completed",
      }),
    );
    return mergeCampaign(runtime);
  } finally {
    clearInterval(interval);
    process.off("SIGINT", onInterrupt);
    process.off("SIGTERM", onTerminate);
    await mergeChain;
  }
}

async function main(): Promise<void> {
  const parsed = parseOptions(process.argv.slice(2));
  const id = validateCampaignId(
    parsed.resume ?? parsed.id ?? generatedCampaignId(),
  );
  const releaseLock = acquireReportLock(id);
  let runtime: Runtime | undefined;
  try {
    runtime =
      parsed.resume === undefined
        ? await createRuntime(id, parsed)
        : await resumeRuntime(id, parsed);
    console.log(
      `WPT campaign ${id}: ${String(runtime.urls.length)} URLs, ${String(runtime.options.jobs)} workers`,
    );
    const report = await runCampaign(runtime);
    console.log(`Campaign results: ${resolve(runtime.directory, "merged")}`);
    console.log(`Report: ${resolve(runtime.root, "reports/wpt")}`);
    if (runtime.state.state === "interrupted") {
      process.exitCode = 130;
    } else if (report.runStatus === "failed") {
      process.exitCode = 1;
    }
  } catch (error) {
    if (runtime?.state.state === "running") {
      writeState(runtime, nextState(runtime, { state: "interrupted" }));
      mergeCampaign(runtime);
    }
    throw error;
  } finally {
    releaseLock();
  }
}

const entryPath = process.argv[1];
if (
  entryPath !== undefined &&
  import.meta.url === pathToFileURL(entryPath).href
) {
  main().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
}
