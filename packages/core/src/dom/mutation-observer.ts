import { bindDOMInterface } from "./binding.js";
import type { NodeList } from "./collections.js";
import { createNodeList } from "./collections.js";
import type { Node } from "./nodes.js";

export interface MutationObserverInit {
  readonly attributes?: boolean;
  readonly attributeOldValue?: boolean;
  readonly attributeFilter?: readonly string[];
  readonly characterData?: boolean;
  readonly characterDataOldValue?: boolean;
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
  readonly source: RegisteredObserver | null;
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
let nextObserverId = 0;

export class MutationRecord {
  readonly addedNodes: NodeList;
  readonly removedNodes: NodeList;

  constructor(
    readonly type: "attributes" | "characterData" | "childList",
    readonly target: Node,
    readonly attributeName: string | null,
    readonly attributeNamespace: string | null,
    readonly oldValue: string | null,
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

function normalizeOptions(options: MutationObserverInit): MutationObserverInit {
  const attributes =
    options.attributes ??
    (options.attributeOldValue !== undefined ||
    options.attributeFilter !== undefined
      ? true
      : undefined);
  const characterData =
    options.characterData ??
    (options.characterDataOldValue !== undefined ? true : undefined);
  if (
    options.childList !== true &&
    attributes !== true &&
    characterData !== true
  ) {
    throw new TypeError(
      "At least one of childList, attributes, or characterData must be true",
    );
  }
  if (
    (options.attributeOldValue === true ||
      options.attributeFilter !== undefined) &&
    attributes === false
  ) {
    throw new TypeError(
      "attributeOldValue and attributeFilter require attributes",
    );
  }
  if (options.characterDataOldValue === true && characterData === false) {
    throw new TypeError("characterDataOldValue requires characterData");
  }
  return {
    ...options,
    ...(attributes === undefined ? {} : { attributes }),
    ...(options.attributeFilter === undefined
      ? {}
      : { attributeFilter: [...options.attributeFilter] }),
    ...(characterData === undefined ? {} : { characterData }),
  };
}

export class MutationObserver {
  readonly #records: MutationRecord[] = [];
  readonly #registrations = new Set<RegisteredObserver>();
  readonly id = nextObserverId++;

  constructor(
    readonly callback: MutationCallback,
    readonly microtaskScheduler: MicrotaskScheduler = HOST_SCHEDULER,
  ) {
    bindDOMInterface(this, this);
  }

  observe(target: Node, options: MutationObserverInit): void {
    const normalized = normalizeOptions(options);
    const registrations = registrationsFor(target);
    const existing = Array.from(registrations).find(
      (registration) =>
        registration.observer === this && !registration.transient,
    );
    if (existing !== undefined) {
      this.removeTransientRegistrationsFor(existing);
      existing.options = normalized;
      return;
    }
    const registration: RegisteredObserver = {
      observer: this,
      target,
      options: normalized,
      transient: false,
      source: null,
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
      source: source.source ?? source,
    };
    registrationsFor(target).add(registration);
    this.#registrations.add(registration);
    pendingObservers(this.microtaskScheduler).add(this);
    queueMutationObserverMicrotask(this.microtaskScheduler);
  }

  removeTransientRegistrations(): void {
    for (const registration of this.#registrations) {
      if (registration.transient) {
        registrationsFor(registration.target).delete(registration);
        this.#registrations.delete(registration);
      }
    }
  }

  private removeTransientRegistrationsFor(source: RegisteredObserver): void {
    for (const registration of this.#registrations) {
      if (registration.transient && registration.source === source) {
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
  queueMutationRecord(
    "childList",
    target,
    null,
    null,
    null,
    addedNodes,
    removedNodes,
    previousSibling,
    nextSibling,
  );

  for (const removedNode of removedNodes) {
    addTransientRegisteredObservers(target, removedNode);
  }
}

export function queueAttributeMutationRecord(
  target: Node,
  name: string,
  namespace: string | null,
  oldValue: string | null,
): void {
  queueMutationRecord(
    "attributes",
    target,
    name,
    namespace,
    oldValue,
    [],
    [],
    null,
    null,
  );
}

export function queueCharacterDataMutationRecord(
  target: Node,
  oldValue: string,
): void {
  queueMutationRecord(
    "characterData",
    target,
    null,
    null,
    oldValue,
    [],
    [],
    null,
    null,
  );
}

function queueMutationRecord(
  type: "attributes" | "characterData" | "childList",
  target: Node,
  name: string | null,
  namespace: string | null,
  oldValue: string | null,
  addedNodes: readonly Node[],
  removedNodes: readonly Node[],
  previousSibling: Node | null,
  nextSibling: Node | null,
): void {
  const interestedObservers = new Map<MutationObserver, string | null>();
  let current: Node | null = target;
  while (current !== null) {
    for (const registration of REGISTERED_OBSERVERS.get(current) ?? []) {
      const { options, observer } = registration;
      if (current !== target && options.subtree !== true) {
        continue;
      }
      if (type === "attributes") {
        if (options.attributes !== true) {
          continue;
        }
        if (
          options.attributeFilter !== undefined &&
          (namespace !== null ||
            name === null ||
            !options.attributeFilter.includes(name))
        ) {
          continue;
        }
      } else if (type === "characterData") {
        if (options.characterData !== true) {
          continue;
        }
      } else if (options.childList !== true) {
        continue;
      }
      if (!interestedObservers.has(observer)) {
        interestedObservers.set(observer, null);
      }
      if (
        (type === "attributes" && options.attributeOldValue === true) ||
        (type === "characterData" && options.characterDataOldValue === true)
      ) {
        interestedObservers.set(observer, oldValue);
      }
    }
    current = current.parentNode;
  }

  for (const [observer, observerOldValue] of interestedObservers) {
    observer.enqueue(
      new MutationRecord(
        type,
        target,
        name,
        namespace,
        observerOldValue,
        addedNodes,
        removedNodes,
        previousSibling,
        nextSibling,
      ),
    );
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
  const sources = new Set<RegisteredObserver>();
  while (current !== null) {
    for (const registration of REGISTERED_OBSERVERS.get(current) ?? []) {
      const source = registration.source ?? registration;
      if (registration.options.subtree === true && !sources.has(source)) {
        registration.observer.addTransientRegistration(removedNode, source);
        sources.add(source);
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
  const observers = Array.from(pending).sort(
    (left, right) => left.id - right.id,
  );
  pending.clear();
  for (const observer of observers) {
    observer.removeTransientRegistrations();
    const records = observer.takeRecords();
    if (records.length > 0) {
      observer.callback(records, observer);
    }
  }
}
