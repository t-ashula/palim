import { DOMException } from "../dom-exception.js";
import { domString } from "./conversions.js";
import {
  AbortControllerImplementation,
  EventImplementation,
  EventTargetImplementation,
  abortControllerImplementation,
  bindAbortController,
  bindEvent,
  bindEventTarget,
  eventImplementation,
  eventTargetImplementation,
  eventTargetInterface,
} from "./event-implementation.js";
import type { RegisteredEventListener } from "./event-implementation.js";

export interface EventInit {
  readonly bubbles?: boolean;
  readonly cancelable?: boolean;
  readonly composed?: boolean;
}

export interface CustomEventInit<T = unknown> extends EventInit {
  readonly detail?: T;
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
    implementation.type = domString(type);
    implementation.bubbles = bubbles;
    implementation.cancelable = cancelable;
    implementation.defaultPrevented = false;
    implementation.stopPropagation = false;
    implementation.stopImmediatePropagation = false;
  }
}

export class CustomEvent<T = unknown> extends Event {
  readonly #detail: T;

  constructor(type: string, eventInit: CustomEventInit<T> = {}) {
    super(type, eventInit);
    this.#detail = eventInit.detail ?? (null as T);
  }

  get detail(): T {
    return this.#detail;
  }
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
    if (!(event instanceof Event)) {
      throw new TypeError("The event is not an Event");
    }
    if (event.type === "") {
      throw new DOMException("The event has no type", "InvalidStateError");
    }
    const implementation = eventImplementation(event);
    const targetImplementation = eventTargetImplementation(this);
    const path: EventTargetImplementation[] = [targetImplementation];
    if (event.bubbles) {
      let parent = targetImplementation.parent;
      while (parent !== null) {
        path.push(parent);
        parent = parent.parent;
      }
    }
    implementation.target = targetImplementation;
    implementation.path = path;
    for (const [index, target] of path.entries()) {
      if (implementation.stopPropagation && index > 0) {
        break;
      }
      implementation.currentTarget = target;
      implementation.eventPhase =
        index === 0 ? Event.AT_TARGET : Event.BUBBLING_PHASE;
      invokeEventListeners(target, event);
    }
    implementation.currentTarget = null;
    implementation.eventPhase = Event.NONE;
    return !event.defaultPrevented;
  }
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
    const handler: unknown = Reflect.get(target, `on${event.type}`);
    if (typeof handler === "function") {
      handler.call(target, event);
    }
  }
}
