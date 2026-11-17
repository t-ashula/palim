import type { EventTarget } from "./dom/events.js";
import type { Document, Element } from "./dom/nodes.js";
import type { CSSStyleDeclaration } from "./html-elements.js";

export interface WindowErrorReport {
  readonly message: string;
  readonly url: string;
  readonly stack?: string;
}

export type WindowConsoleMethod =
  | "assert"
  | "clear"
  | "count"
  | "countReset"
  | "debug"
  | "dir"
  | "dirxml"
  | "error"
  | "group"
  | "groupCollapsed"
  | "groupEnd"
  | "info"
  | "log"
  | "table"
  | "time"
  | "timeEnd"
  | "timeLog"
  | "trace"
  | "warn";

export interface WindowConsoleCall {
  readonly method: WindowConsoleMethod;
  readonly arguments: readonly string[];
}

export type WindowErrorHandler = (report: WindowErrorReport) => void;
export type WindowConsoleHandler = (call: WindowConsoleCall) => void;
export type FrameRequestCallback = (timestamp: number) => void;

export interface Location {
  readonly href: string;
  readonly origin: string;
  readonly pathname: string;
  readonly search: string;
  readonly hash: string;
  toString(): string;
}

export interface Window extends EventTarget {
  readonly window: Window;
  readonly self: Window;
  readonly frames: Window;
  readonly document: Document;
  readonly location: Location;
  readonly top: Window;
  readonly parent: Window;
  readonly frameElement: Element | null;
  readonly innerWidth: number;
  readonly innerHeight: number;
  getComputedStyle(
    element: Element,
    pseudoElement?: string | null,
  ): CSSStyleDeclaration;
  requestAnimationFrame(callback: FrameRequestCallback): number;
  cancelAnimationFrame(handle: number): void;
  onerror(handler: WindowErrorHandler): () => void;
}
