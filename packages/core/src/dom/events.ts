import { DOMException } from "../dom-exception.js";
import { asciiLowercase, domString } from "./conversions.js";
import type { RegisteredEventListener } from "./event-implementation.js";
import {
  AbortControllerImplementation,
  abortControllerImplementation,
  bindAbortController,
  bindEvent,
  bindEventTarget,
  EventImplementation,
  eventImplementation,
  EventTargetImplementation,
  eventTargetImplementation,
  eventTargetInterface,
} from "./event-implementation.js";

export interface EventInit {
  readonly bubbles?: boolean;
  readonly cancelable?: boolean;
  readonly composed?: boolean;
}

export interface CustomEventInit<T = unknown> extends EventInit {
  readonly detail?: T;
}

export interface ErrorEventInit<T = unknown> extends EventInit {
  readonly message?: string;
  readonly filename?: string;
  readonly lineno?: number;
  readonly colno?: number;
  readonly error?: T;
}

export interface PromiseRejectionEventInit<
  TPromise = unknown,
  TReason = unknown,
> extends EventInit {
  readonly promise: TPromise;
  readonly reason?: TReason;
}

export interface MessageEventInit<T = unknown> extends EventInit {
  readonly data?: T;
  readonly origin?: string;
  readonly lastEventId?: string;
  readonly source?: EventTarget | null;
  readonly ports?: readonly EventTarget[];
}

export class Event {
  static readonly NONE = 0;
  static readonly CAPTURING_PHASE = 1;
  static readonly AT_TARGET = 2;
  static readonly BUBBLING_PHASE = 3;
  readonly NONE = 0;
  readonly CAPTURING_PHASE = 1;
  readonly AT_TARGET = 2;
  readonly BUBBLING_PHASE = 3;
  readonly isTrusted = false;
  readonly timeStamp = Date.now();

  constructor(type: string, eventInit: EventInit = {}) {
    bindEvent(
      this,
      new EventImplementation(
        domString(type),
        Boolean(eventInit.bubbles),
        Boolean(eventInit.cancelable),
        Boolean(eventInit.composed),
      ),
    );
  }

  get type(): string {
    return eventImplementation(this).type;
  }

  get bubbles(): boolean {
    return eventImplementation(this).bubbles;
  }

  get cancelable(): boolean {
    return eventImplementation(this).cancelable;
  }

  get composed(): boolean {
    return eventImplementation(this).composed;
  }

  get target(): EventTarget | null {
    const implementation = eventImplementation(this).target;
    return implementation === null
      ? null
      : eventTargetInterface(implementation);
  }

  get srcElement(): EventTarget | null {
    return this.target;
  }

  get currentTarget(): EventTarget | null {
    const implementation = eventImplementation(this).currentTarget;
    return implementation === null
      ? null
      : eventTargetInterface(implementation);
  }

  get eventPhase(): number {
    return eventImplementation(this).eventPhase;
  }

  get defaultPrevented(): boolean {
    return eventImplementation(this).defaultPrevented;
  }

  get cancelBubble(): boolean {
    return eventImplementation(this).stopPropagation;
  }

  set cancelBubble(value: boolean) {
    if (value) {
      eventImplementation(this).stopPropagation = true;
    }
  }

  get returnValue(): boolean {
    return !this.defaultPrevented;
  }

  set returnValue(value: boolean) {
    if (!value) {
      this.preventDefault();
    }
  }

  composedPath(): EventTarget[] {
    return eventImplementation(this).path.map(eventTargetInterface);
  }

  stopPropagation(): void {
    eventImplementation(this).stopPropagation = true;
  }

  stopImmediatePropagation(): void {
    const implementation = eventImplementation(this);
    implementation.stopPropagation = true;
    implementation.stopImmediatePropagation = true;
  }

  preventDefault(): void {
    const implementation = eventImplementation(this);
    if (this.cancelable && !implementation.inPassiveListener) {
      implementation.defaultPrevented = true;
    }
  }

  initEvent(type: string, bubbles = false, cancelable = false): void {
    const implementation = eventImplementation(this);
    if (implementation.dispatching) {
      return;
    }
    implementation.initialized = true;
    implementation.type = domString(type);
    implementation.bubbles = bubbles;
    implementation.cancelable = cancelable;
    implementation.target = null;
    implementation.defaultPrevented = false;
    implementation.stopPropagation = false;
    implementation.stopImmediatePropagation = false;
  }
}

export class CustomEvent<T = unknown> extends Event {
  #detail: T;

  constructor(type: string, eventInit: CustomEventInit<T> = {}) {
    super(type, eventInit);
    this.#detail = eventInit.detail ?? (null as T);
  }

  get detail(): T {
    return this.#detail;
  }

  initCustomEvent(
    type: string,
    bubbles = false,
    cancelable = false,
    detail: T = null as T,
  ): void {
    if (eventImplementation(this).dispatching) {
      return;
    }
    this.initEvent(type, bubbles, cancelable);
    this.#detail = detail;
  }
}

export class ErrorEvent<T = unknown> extends Event {
  readonly message: string;
  readonly filename: string;
  readonly lineno: number;
  readonly colno: number;
  readonly error: T;

  constructor(type: string, eventInit: ErrorEventInit<T> = {}) {
    super(type, eventInit);
    this.message = domString(eventInit.message ?? "");
    this.filename = domString(eventInit.filename ?? "").toWellFormed();
    this.lineno = toUnsignedLong(eventInit.lineno ?? 0);
    this.colno = toUnsignedLong(eventInit.colno ?? 0);
    this.error = eventInit.error as T;
  }
}

export class PromiseRejectionEvent<
  TPromise = unknown,
  TReason = unknown,
> extends Event {
  readonly promise: TPromise;
  readonly reason: TReason;

  constructor(
    type: string,
    eventInit: PromiseRejectionEventInit<TPromise, TReason>,
  ) {
    super(type, eventInit);
    this.promise = eventInit.promise;
    this.reason = eventInit.reason as TReason;
  }
}

export class MessageEvent<T = unknown> extends Event {
  readonly data: T;
  readonly origin: string;
  readonly lastEventId: string;
  readonly source: EventTarget | null;
  readonly ports: readonly EventTarget[];

  constructor(type: string, eventInit: MessageEventInit<T> = {}) {
    super(type, eventInit);
    this.data = eventInit.data as T;
    this.origin = domString(eventInit.origin ?? "");
    this.lastEventId = domString(eventInit.lastEventId ?? "");
    this.source = eventInit.source ?? null;
    this.ports = eventInit.ports ?? [];
  }
}

export function createLegacyEvent(interfaceName: string): Event {
  let event: Event;
  switch (asciiLowercase(domString(interfaceName))) {
    case "event":
    case "events":
    case "htmlevents":
    case "svgevents":
      event = new Event("");
      break;
    case "customevent":
      event = new CustomEvent("");
      break;
    default:
      throw new DOMException(
        `The event interface "${interfaceName}" is not supported`,
        "NotSupportedError",
      );
  }
  eventImplementation(event).initialized = false;
  return event;
}

export type EventListener = (event: Event) => void;

export interface EventListenerObject {
  handleEvent(event: Event): void;
}

export interface AddEventListenerOptions {
  readonly capture?: boolean;
  readonly once?: boolean;
  readonly passive?: boolean;
  readonly signal?: AbortSignal;
}

export class EventTarget {
  constructor() {
    bindEventTarget(this, new EventTargetImplementation());
  }

  addEventListener(
    type: string,
    callback: EventListener | EventListenerObject | null,
    options: boolean | AddEventListenerOptions = false,
  ): void {
    let signal: AbortSignal | null = null;
    if (typeof options === "object") {
      const candidate: unknown = options.signal;
      if (candidate !== undefined) {
        if (!(candidate instanceof AbortSignal)) {
          throw new TypeError("The signal option is not an AbortSignal");
        }
        signal = candidate;
      }
    }
    if (callback === null) {
      return;
    }
    if (signal?.aborted === true) {
      return;
    }
    const convertedType = domString(type);
    const capture =
      typeof options === "boolean" ? options : Boolean(options.capture);
    const implementation = eventTargetImplementation(this);
    const listeners = implementation.listeners.get(convertedType) ?? [];
    if (
      listeners.some(
        (listener) =>
          listener.callback === callback && listener.capture === capture,
      )
    ) {
      return;
    }
    const abortAlgorithm =
      signal === null
        ? null
        : (): void => {
            this.removeEventListener(convertedType, callback, capture);
          };
    const listener: RegisteredEventListener = {
      callback,
      capture,
      once: typeof options === "object" && Boolean(options.once),
      passive: typeof options === "object" && Boolean(options.passive),
      signal,
      abortAlgorithm,
      removed: false,
    };
    listeners.push(listener);
    implementation.listeners.set(convertedType, listeners);
    if (signal !== null && abortAlgorithm !== null) {
      addAbortAlgorithm(signal, abortAlgorithm);
    }
  }

  removeEventListener(
    type: string,
    callback: EventListener | EventListenerObject | null,
    options: boolean | { readonly capture?: boolean } = false,
  ): void {
    if (callback === null) {
      return;
    }
    const capture =
      typeof options === "boolean" ? options : Boolean(options.capture);
    const convertedType = domString(type);
    const listeners =
      eventTargetImplementation(this).listeners.get(convertedType);
    if (listeners === undefined) {
      return;
    }
    const index = listeners.findIndex(
      (listener) =>
        listener.callback === callback && listener.capture === capture,
    );
    if (index >= 0) {
      const [listener] = listeners.splice(index, 1);
      if (listener !== undefined) {
        listener.removed = true;
        if (listener.signal !== null && listener.abortAlgorithm !== null) {
          removeAbortAlgorithm(listener.signal, listener.abortAlgorithm);
        }
      }
    }
  }

  dispatchEvent(event: Event): boolean {
    return dispatchEvent(this, event);
  }
}

export function dispatchEvent(
  target: EventTarget,
  event: Event,
  eventHandler?: (event: Event) => void,
): boolean {
  if (!(event instanceof Event)) {
    throw new TypeError("The event is not an Event");
  }
  const implementation = eventImplementation(event);
  if (implementation.dispatching || !implementation.initialized) {
    throw new DOMException(
      "The event is dispatching or is not initialized",
      "InvalidStateError",
    );
  }
  const targetImplementation = eventTargetImplementation(target);
  const path: EventTargetImplementation[] = [targetImplementation];
  if (event.bubbles) {
    let parent = targetImplementation.parent;
    while (parent !== null) {
      path.push(parent);
      parent = parent.parent;
    }
  }
  implementation.dispatching = true;
  try {
    implementation.target = targetImplementation;
    implementation.path = path;
    for (const [index, pathTarget] of path.entries()) {
      if (implementation.stopPropagation && index > 0) {
        break;
      }
      implementation.currentTarget = pathTarget;
      implementation.eventPhase =
        index === 0 ? Event.AT_TARGET : Event.BUBBLING_PHASE;
      invokeEventListeners(
        pathTarget,
        event,
        index === 0 ? eventHandler : undefined,
      );
    }
  } finally {
    implementation.currentTarget = null;
    implementation.eventPhase = Event.NONE;
    implementation.dispatching = false;
  }
  return !event.defaultPrevented;
}

interface AbortSignalState {
  aborted: boolean;
  reason: unknown;
  readonly algorithms: Set<() => void>;
}

const abortSignalStates = new WeakMap<AbortSignal, AbortSignalState>();

export class AbortSignal extends EventTarget {
  constructor() {
    super();
    abortSignalStates.set(this, {
      aborted: false,
      reason: undefined,
      algorithms: new Set(),
    });
  }

  get aborted(): boolean {
    return abortSignalState(this).aborted;
  }

  get reason(): unknown {
    return abortSignalState(this).reason;
  }

  throwIfAborted(): void {
    const state = abortSignalState(this);
    if (state.aborted) {
      throw state.reason;
    }
  }
}

export class AbortController {
  constructor() {
    bindAbortController(
      this,
      new AbortControllerImplementation(new AbortSignal()),
    );
  }

  get signal(): AbortSignal {
    return abortControllerImplementation(this).signal;
  }

  abort(
    reason: unknown = new DOMException(
      "This operation was aborted",
      "AbortError",
    ),
  ): void {
    const signal = this.signal;
    const state = abortSignalState(signal);
    if (state.aborted) {
      return;
    }
    state.aborted = true;
    state.reason = reason;
    for (const algorithm of [...state.algorithms]) {
      algorithm();
    }
    state.algorithms.clear();
    signal.dispatchEvent(new Event("abort"));
  }
}

function abortSignalState(signal: AbortSignal): AbortSignalState {
  const state = abortSignalStates.get(signal);
  if (state === undefined) {
    throw new TypeError("Invalid AbortSignal receiver");
  }
  return state;
}

function addAbortAlgorithm(signal: AbortSignal, algorithm: () => void): void {
  abortSignalState(signal).algorithms.add(algorithm);
}

function removeAbortAlgorithm(
  signal: AbortSignal,
  algorithm: () => void,
): void {
  abortSignalState(signal).algorithms.delete(algorithm);
}

function invokeEventListeners(
  targetImplementation: EventTargetImplementation,
  event: Event,
  eventHandler?: (event: Event) => void,
): void {
  const target = eventTargetInterface(targetImplementation);
  const listeners = [...(targetImplementation.listeners.get(event.type) ?? [])];
  const implementation = eventImplementation(event);
  for (const listener of listeners) {
    if (listener.removed) {
      continue;
    }
    if (listener.once) {
      target.removeEventListener(
        event.type,
        listener.callback,
        listener.capture,
      );
    }
    const previousPassiveState = implementation.inPassiveListener;
    implementation.inPassiveListener = listener.passive;
    try {
      if (typeof listener.callback === "function") {
        listener.callback.call(target, event);
      } else {
        listener.callback.handleEvent(event);
      }
    } finally {
      implementation.inPassiveListener = previousPassiveState;
    }
    if (implementation.stopImmediatePropagation) {
      break;
    }
  }
  if (!implementation.stopImmediatePropagation) {
    if (eventHandler !== undefined) {
      eventHandler(event);
    } else {
      const handler: unknown = Reflect.get(target, `on${event.type}`);
      if (typeof handler === "function") {
        handler.call(target, event);
      }
    }
  }
}

function toUnsignedLong(value: unknown): number {
  const number = Number(value);
  if (!Number.isFinite(number) || number === 0) {
    return 0;
  }
  const integer = Math.trunc(number);
  return ((integer % 0x1_0000_0000) + 0x1_0000_0000) % 0x1_0000_0000;
}
