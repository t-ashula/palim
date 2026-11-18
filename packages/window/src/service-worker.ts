import type { URL } from "@palim/core";
import { EventTarget } from "@palim/core";

import type { Navigator } from "./navigator.js";
import { windowNavigator } from "./navigator.js";
import type { Window } from "./window.js";

export class ServiceWorkerContainer extends EventTarget {}

export type ServiceWorkerState =
  "installing" | "installed" | "activating" | "activated" | "redundant";

export class ServiceWorkerRecord extends EventTarget {
  state: ServiceWorkerState = "installing";

  constructor(readonly scriptURL: URL) {
    super();
  }
}

export class ServiceWorkerRegistrationRecord extends EventTarget {
  installing: ServiceWorkerRecord | null = null;
  waiting: ServiceWorkerRecord | null = null;
  active: ServiceWorkerRecord | null = null;

  constructor(
    readonly origin: string,
    readonly scope: URL,
  ) {
    super();
  }
}

export class ServiceWorkerRegistrationStore {
  readonly #registrations = new Map<string, ServiceWorkerRegistrationRecord>();

  get(origin: string, scope: URL): ServiceWorkerRegistrationRecord | null {
    return this.#registrations.get(registrationKey(origin, scope)) ?? null;
  }

  getOrCreate(origin: string, scope: URL): ServiceWorkerRegistrationRecord {
    const key = registrationKey(origin, scope);
    let registration = this.#registrations.get(key);
    if (registration === undefined) {
      registration = new ServiceWorkerRegistrationRecord(origin, scope);
      this.#registrations.set(key, registration);
    }
    return registration;
  }

  remove(registration: ServiceWorkerRegistrationRecord): boolean {
    return this.#registrations.delete(
      registrationKey(registration.origin, registration.scope),
    );
  }
}

interface WindowServiceWorkerState {
  store: ServiceWorkerRegistrationStore;
}

const WINDOW_SERVICE_WORKER_STATES = new WeakMap<
  object,
  WindowServiceWorkerState
>();

const NAVIGATOR_SERVICE_WORKER_CONTAINERS = new WeakMap<
  Navigator,
  ServiceWorkerContainer
>();

export function navigatorServiceWorker(
  navigator: Navigator,
): ServiceWorkerContainer {
  let container = NAVIGATOR_SERVICE_WORKER_CONTAINERS.get(navigator);
  if (container === undefined) {
    container = new ServiceWorkerContainer();
    NAVIGATOR_SERVICE_WORKER_CONTAINERS.set(navigator, container);
  }
  return container;
}

export function windowServiceWorkerContainer(
  window: Window,
): ServiceWorkerContainer {
  return navigatorServiceWorker(windowNavigator(window));
}

export function windowServiceWorkerStore(
  window: Window,
): ServiceWorkerRegistrationStore {
  return windowServiceWorkerState(window).store;
}

export function setWindowServiceWorkerStore(
  window: Window,
  store: ServiceWorkerRegistrationStore,
): void {
  windowServiceWorkerState(window).store = store;
}

function windowServiceWorkerState(window: Window): WindowServiceWorkerState {
  let state = WINDOW_SERVICE_WORKER_STATES.get(window);
  if (state === undefined) {
    state = {
      store: new ServiceWorkerRegistrationStore(),
    };
    WINDOW_SERVICE_WORKER_STATES.set(window, state);
  }
  return state;
}

function registrationKey(origin: string, scope: URL): string {
  return `${origin}\n${scope.href}`;
}
