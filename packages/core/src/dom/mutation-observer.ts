import { bindDOMInterface } from "./binding.js";
import { createNodeList, type NodeList } from "./collections.js";
import type { Node } from "./nodes.js";

export interface MutationObserverInit {
  readonly childList?: boolean;
  readonly subtree?: boolean;
}

export type MutationCallback = (
  records: readonly MutationRecord[],
  observer: MutationObserver,
) => void;

export type MutationObserverMicrotaskScheduler = (callback: () => void) => void;
type MicrotaskScheduler = MutationObserverMicrotaskScheduler;

interface RegisteredObserver {
  readonly observer: MutationObserver;
  readonly target: Node;
  options: MutationObserverInit;
  readonly transient: boolean;
}

const REGISTERED_OBSERVERS = new WeakMap<Node, Set<RegisteredObserver>>();
const HOST_SCHEDULER: MicrotaskScheduler = (callback) => {
  void Promise.resolve().then(callback);
};
const PENDING_OBSERVERS = new WeakMap<
  MicrotaskScheduler,
  Set<MutationObserver>
>();
const QUEUED_SCHEDULERS = new WeakSet<MicrotaskScheduler>();

export class MutationRecord {
  readonly type = "childList";
  readonly addedNodes: NodeList;
  readonly removedNodes: NodeList;

  constructor(
    readonly target: Node,
    addedNodes: readonly Node[],
    removedNodes: readonly Node[],
    readonly previousSibling: Node | null,
    readonly nextSibling: Node | null,
  ) {
    const added = [...addedNodes];
    const removed = [...removedNodes];
    this.addedNodes = createNodeList(() => added);
    this.removedNodes = createNodeList(() => removed);
    bindDOMInterface(this, this);
  }
}

export class MutationObserver {
  readonly #records: MutationRecord[] = [];
  readonly #registrations = new Set<RegisteredObserver>();

  constructor(
    readonly callback: MutationCallback,
    readonly microtaskScheduler: MicrotaskScheduler = HOST_SCHEDULER,
  ) {
    bindDOMInterface(this, this);
  }

  observe(target: Node, options: MutationObserverInit): void {
    if (options.childList !== true) {
      throw new TypeError("The childList option must be true");
    }
    const registrations = registrationsFor(target);
    const existing = Array.from(registrations).find(
      (registration) =>
        registration.observer === this && !registration.transient,
    );
    if (existing !== undefined) {
      existing.options = { ...options };
      return;
    }
    const registration: RegisteredObserver = {
      observer: this,
      target,
      options: { ...options },
      transient: false,
    };
    registrations.add(registration);
    this.#registrations.add(registration);
  }

  disconnect(): void {
    this.removeRegistrations();
    this.#records.length = 0;
  }

  takeRecords(): MutationRecord[] {
    return this.#records.splice(0);
  }

  enqueue(record: MutationRecord): void {
    this.#records.push(record);
    pendingObservers(this.microtaskScheduler).add(this);
    queueMutationObserverMicrotask(this.microtaskScheduler);
  }

  addTransientRegistration(target: Node, source: RegisteredObserver): void {
    const registration: RegisteredObserver = {
      observer: this,
      target,
      options: source.options,
      transient: true,
    };
    registrationsFor(target).add(registration);
    this.#registrations.add(registration);
  }

  removeTransientRegistrations(): void {
    for (const registration of this.#registrations) {
      if (registration.transient) {
        registrationsFor(registration.target).delete(registration);
        this.#registrations.delete(registration);
      }
    }
  }

  private removeRegistrations(): void {
    for (const registration of this.#registrations) {
      registrationsFor(registration.target).delete(registration);
    }
    this.#registrations.clear();
  }
}

export function queueTreeMutationRecord(
  target: Node,
  addedNodes: readonly Node[],
  removedNodes: readonly Node[],
  previousSibling: Node | null,
  nextSibling: Node | null,
): void {
  const interestedObservers = new Set<MutationObserver>();
  let current: Node | null = target;
  while (current !== null) {
    for (const registration of REGISTERED_OBSERVERS.get(current) ?? []) {
      if (current === target || registration.options.subtree === true) {
        interestedObservers.add(registration.observer);
      }
    }
    current = current.parentNode;
  }

  for (const observer of interestedObservers) {
    observer.enqueue(
      new MutationRecord(
        target,
        addedNodes,
        removedNodes,
        previousSibling,
        nextSibling,
      ),
    );
  }

  for (const removedNode of removedNodes) {
    addTransientRegisteredObservers(target, removedNode);
  }
}

function registrationsFor(target: Node): Set<RegisteredObserver> {
  const existing = REGISTERED_OBSERVERS.get(target);
  if (existing !== undefined) {
    return existing;
  }
  const registrations = new Set<RegisteredObserver>();
  REGISTERED_OBSERVERS.set(target, registrations);
  return registrations;
}

function addTransientRegisteredObservers(
  target: Node,
  removedNode: Node,
): void {
  let current: Node | null = target;
  const observers = new Set<MutationObserver>();
  while (current !== null) {
    for (const registration of REGISTERED_OBSERVERS.get(current) ?? []) {
      if (
        registration.options.subtree === true &&
        !observers.has(registration.observer)
      ) {
        registration.observer.addTransientRegistration(
          removedNode,
          registration,
        );
        observers.add(registration.observer);
      }
    }
    current = current.parentNode;
  }
}

function pendingObservers(
  scheduler: MicrotaskScheduler,
): Set<MutationObserver> {
  let observers = PENDING_OBSERVERS.get(scheduler);
  if (observers === undefined) {
    observers = new Set();
    PENDING_OBSERVERS.set(scheduler, observers);
  }
  return observers;
}

function queueMutationObserverMicrotask(scheduler: MicrotaskScheduler): void {
  if (QUEUED_SCHEDULERS.has(scheduler)) {
    return;
  }
  QUEUED_SCHEDULERS.add(scheduler);
  scheduler(() => {
    notifyMutationObservers(scheduler);
  });
}

function notifyMutationObservers(scheduler: MicrotaskScheduler): void {
  QUEUED_SCHEDULERS.delete(scheduler);
  const pending = pendingObservers(scheduler);
  const observers = Array.from(pending);
  pending.clear();
  for (const observer of observers) {
    observer.removeTransientRegistrations();
    const records = observer.takeRecords();
    if (records.length > 0) {
      observer.callback(records, observer);
    }
  }
}
