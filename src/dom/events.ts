import { DOMException } from "../dom-exception.js";
import { domString } from "./conversions.js";

export interface EventInit {
  readonly bubbles?: boolean;
  readonly cancelable?: boolean;
  readonly composed?: boolean;
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
  readonly type: string;
  readonly bubbles: boolean;
  readonly cancelable: boolean;
  readonly composed: boolean;
  readonly isTrusted = false;
  readonly timeStamp = Date.now();
  _target: EventTarget | null = null;
  _currentTarget: EventTarget | null = null;
  _eventPhase = Event.NONE;
  _defaultPrevented = false;
  _stopPropagation = false;
  _stopImmediatePropagation = false;
  _path: EventTarget[] = [];

  constructor(type: string, eventInit: EventInit = {}) {
    this.type = domString(type);
    this.bubbles = Boolean(eventInit.bubbles);
    this.cancelable = Boolean(eventInit.cancelable);
    this.composed = Boolean(eventInit.composed);
  }

  get target(): EventTarget | null {
    return this._target;
  }

  get srcElement(): EventTarget | null {
    return this._target;
  }

  get currentTarget(): EventTarget | null {
    return this._currentTarget;
  }

  get eventPhase(): number {
    return this._eventPhase;
  }

  get defaultPrevented(): boolean {
    return this._defaultPrevented;
  }

  get cancelBubble(): boolean {
    return this._stopPropagation;
  }

  set cancelBubble(value: boolean) {
    if (value) {
      this._stopPropagation = true;
    }
  }

  get returnValue(): boolean {
    return !this._defaultPrevented;
  }

  set returnValue(value: boolean) {
    if (!value) {
      this.preventDefault();
    }
  }

  composedPath(): EventTarget[] {
    return [...this._path];
  }

  stopPropagation(): void {
    this._stopPropagation = true;
  }

  stopImmediatePropagation(): void {
    this._stopPropagation = true;
    this._stopImmediatePropagation = true;
  }

  preventDefault(): void {
    if (this.cancelable) {
      this._defaultPrevented = true;
    }
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
}

interface RegisteredEventListener {
  readonly callback: EventListener | EventListenerObject;
  readonly capture: boolean;
  readonly once: boolean;
}

export class EventTarget {
  readonly #listeners = new Map<string, RegisteredEventListener[]>();

  addEventListener(
    type: string,
    callback: EventListener | EventListenerObject | null,
    options: boolean | AddEventListenerOptions = false,
  ): void {
    if (callback === null) {
      return;
    }
    const convertedType = domString(type);
    const capture =
      typeof options === "boolean" ? options : Boolean(options.capture);
    const listeners = this.#listeners.get(convertedType) ?? [];
    if (
      listeners.some(
        (listener) =>
          listener.callback === callback && listener.capture === capture,
      )
    ) {
      return;
    }
    listeners.push({
      callback,
      capture,
      once: typeof options === "object" && Boolean(options.once),
    });
    this.#listeners.set(convertedType, listeners);
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
    const listeners = this.#listeners.get(convertedType);
    if (listeners === undefined) {
      return;
    }
    const index = listeners.findIndex(
      (listener) =>
        listener.callback === callback && listener.capture === capture,
    );
    if (index >= 0) {
      listeners.splice(index, 1);
    }
  }

  dispatchEvent(event: Event): boolean {
    if (!(event instanceof Event)) {
      throw new TypeError("The event is not an Event");
    }
    if (event.type === "") {
      throw new DOMException("The event has no type", "InvalidStateError");
    }
    const path: EventTarget[] = [this];
    if (event.bubbles) {
      let parent = this._eventParent();
      while (parent !== null) {
        path.push(parent);
        parent = parent._eventParent();
      }
    }
    event._target = this;
    event._path = path;
    for (const [index, target] of path.entries()) {
      if (event._stopPropagation && index > 0) {
        break;
      }
      event._currentTarget = target;
      event._eventPhase = index === 0 ? Event.AT_TARGET : Event.BUBBLING_PHASE;
      target._invoke(event);
    }
    event._currentTarget = null;
    event._eventPhase = Event.NONE;
    return !event.defaultPrevented;
  }

  _eventParent(): EventTarget | null {
    return null;
  }

  _invoke(event: Event): void {
    const listeners = [...(this.#listeners.get(event.type) ?? [])];
    for (const listener of listeners) {
      if (listener.once) {
        this.removeEventListener(
          event.type,
          listener.callback,
          listener.capture,
        );
      }
      if (typeof listener.callback === "function") {
        listener.callback.call(this, event);
      } else {
        listener.callback.handleEvent(event);
      }
      if (event._stopImmediatePropagation) {
        break;
      }
    }
    if (!event._stopImmediatePropagation) {
      const handler: unknown = Reflect.get(this, `on${event.type}`);
      if (typeof handler === "function") {
        handler.call(this, event);
      }
    }
  }
}
