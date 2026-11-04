import {
  bindDOMInterface,
  implementationFor,
  interfaceFor,
} from "./binding.js";

import type {
  AbortSignal,
  Event,
  EventListener,
  EventListenerObject,
  EventTarget,
} from "./events.js";

export interface RegisteredEventListener {
  readonly callback: EventListener | EventListenerObject;
  readonly capture: boolean;
  readonly once: boolean;
  readonly passive: boolean;
  readonly signal: AbortSignal | null;
  readonly abortAlgorithm: (() => void) | null;
  removed: boolean;
}

export class EventTargetImplementation {
  readonly listeners = new Map<string, RegisteredEventListener[]>();
  parent: EventTargetImplementation | null = null;
}

export class AbortControllerImplementation {
  constructor(readonly signal: AbortSignal) {}
}

export class EventImplementation {
  target: EventTargetImplementation | null = null;
  currentTarget: EventTargetImplementation | null = null;
  eventPhase = 0;
  defaultPrevented = false;
  inPassiveListener = false;
  stopPropagation = false;
  stopImmediatePropagation = false;
  path: EventTargetImplementation[] = [];

  constructor(
    readonly type: string,
    readonly bubbles: boolean,
    readonly cancelable: boolean,
    readonly composed: boolean,
  ) {}
}

export function bindEventTarget(
  target: EventTarget,
  implementation: EventTargetImplementation,
): void {
  bindDOMInterface(target, implementation);
}

export function bindAbortController(
  controller: object,
  implementation: AbortControllerImplementation,
): void {
  bindDOMInterface(controller, implementation);
}

export function abortControllerImplementation(
  controller: object,
): AbortControllerImplementation {
  return implementationFor(controller) as AbortControllerImplementation;
}

export function eventTargetImplementation(
  target: EventTarget,
): EventTargetImplementation {
  return implementationFor(target) as EventTargetImplementation;
}

export function eventTargetInterface(
  implementation: EventTargetImplementation,
): EventTarget {
  return interfaceFor(implementation) as EventTarget;
}

export function bindEvent(
  event: Event,
  implementation: EventImplementation,
): void {
  bindDOMInterface(event, implementation);
}

export function eventImplementation(event: Event): EventImplementation {
  return implementationFor(event) as EventImplementation;
}
