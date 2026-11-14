import { EventTarget, MessageEvent } from "@palim/core/internal/dom.js";
import type {
  EngineObject,
  EngineResult,
  EngineValue,
} from "@palim/scripting/internal/javascript-engine/adapter.js";
import { normal } from "@palim/scripting/internal/javascript-engine/adapter.js";
import type { DOMRealmBinding } from "@palim/scripting/internal/javascript-engine/dom-realm-binding.js";
import type { RealmBindingContext } from "@palim/scripting/internal/javascript-engine/realm-binding-context.js";

import type { StructuredValue } from "./structured-value.js";
import {
  deserializeEngineValue,
  serializeEngineValue,
} from "./structured-value.js";

interface TimerPlatform {
  setTimeout(callback: () => void, delay?: number): unknown;
}

const timerPlatform = globalThis as typeof globalThis & TimerPlatform;

export class MessageEndpoint extends EventTarget {
  #peer: MessageEndpoint | null = null;
  #recipient: (() => void) | null = null;
  readonly #messages: StructuredValue[] = [];
  #started: boolean;
  #closed = false;
  #scheduled = false;

  constructor(started = false) {
    super();
    this.#started = started;
  }

  entangle(peer: MessageEndpoint): void {
    this.#peer = peer;
  }

  setRecipient(recipient: () => void): void {
    this.#recipient = recipient;
    this.#schedule();
  }

  post(message: StructuredValue): void {
    if (this.#closed) {
      return;
    }
    const peer = this.#peer;
    if (peer !== null) {
      peer.#enqueue(message);
    }
  }

  start(): void {
    if (this.#closed) {
      return;
    }
    this.#started = true;
    this.#schedule();
  }

  close(): void {
    this.#closed = true;
    this.#messages.length = 0;
    const peer = this.#peer;
    this.#peer = null;
    if (peer !== null && peer.#peer === this) {
      peer.#peer = null;
    }
  }

  shift(): StructuredValue | undefined {
    return this.#messages.shift();
  }

  #enqueue(message: StructuredValue): void {
    if (this.#closed) {
      return;
    }
    this.#messages.push(message);
    this.#schedule();
  }

  #schedule(): void {
    if (
      this.#scheduled ||
      this.#closed ||
      !this.#started ||
      this.#recipient === null ||
      this.#messages.length === 0
    ) {
      return;
    }
    this.#scheduled = true;
    timerPlatform.setTimeout(() => {
      this.#scheduled = false;
      if (!this.#closed && this.#started) {
        this.#recipient?.();
      }
      this.#schedule();
    }, 0);
  }
}

export function createMessageEndpointPair(
  started = false,
): readonly [MessageEndpoint, MessageEndpoint] {
  const first = new MessageEndpoint(started);
  const second = new MessageEndpoint(started);
  first.entangle(second);
  second.entangle(first);
  return [first, second];
}

export class MessagingRealm {
  readonly #portPrototype: EngineObject;
  readonly #ports = new WeakMap<MessageEndpoint, EngineObject>();
  readonly #portEventHandlers = new WeakMap<
    MessageEndpoint,
    Map<"message" | "messageerror", EngineValue>
  >();

  constructor(
    readonly context: RealmBindingContext,
    readonly dom: DOMRealmBinding,
    installInterfaces = true,
  ) {
    this.#portPrototype = this.context.engine.createObject(
      this.context.realm,
      this.dom.eventTargetPrototype,
    );
    if (installInterfaces) {
      this.#installInterfaces();
    }
  }

  bindTarget(target: MessageEndpoint): void {
    target.setRecipient(() => {
      const message = target.shift();
      if (message === undefined) {
        return;
      }
      this.#dispatch(target, message);
    });
  }

  wrapPort(port: MessageEndpoint): EngineObject {
    const existing = this.#ports.get(port);
    if (existing !== undefined) {
      return existing;
    }
    const object = this.context.engine.createObject(
      this.context.realm,
      this.#portPrototype,
    );
    this.#ports.set(port, object);
    this.dom.bindPlatformObject(port, object);
    this.bindTarget(port);
    return object;
  }

  postMessage(
    endpoint: MessageEndpoint,
    value: EngineValue | undefined,
  ): EngineResult<EngineValue> {
    if (value === undefined) {
      return this.context.typeError("postMessage requires 1 argument");
    }
    const serialized = serializeEngineValue(
      this.context.engine,
      this.context.realm,
      value,
    );
    if (serialized.type === "throw") {
      return serialized;
    }
    endpoint.post(serialized.value);
    return this.context.undefined();
  }

  #dispatch(target: MessageEndpoint, message: StructuredValue): void {
    const value = deserializeEngineValue(
      this.context.engine,
      this.context.realm,
      message,
    );
    if (value.type === "throw") {
      this.dom.dispatchEvent(target, new MessageEvent("messageerror"));
      return;
    }
    const event = new MessageEvent("message");
    this.dom.setMessageEventData(event, value.value);
    this.dom.dispatchEvent(target, event);
  }

  #installInterfaces(): void {
    const engine = this.context.engine;
    const realm = this.context.realm;
    const portConstructor = this.context.function("MessagePort", 0, () =>
      this.context.typeError("Illegal constructor"),
    );
    this.context.installInterface(
      "MessagePort",
      portConstructor,
      this.#portPrototype,
    );
    this.context.method(
      this.#portPrototype,
      "postMessage",
      1,
      (thisValue, argumentsList) => {
        const endpoint = this.#endpoint(thisValue);
        return endpoint === null
          ? this.context.invalidReceiver("MessagePort", "postMessage")
          : this.postMessage(endpoint, argumentsList[0]);
      },
    );
    this.context.method(this.#portPrototype, "start", 0, (thisValue) => {
      const endpoint = this.#endpoint(thisValue);
      if (endpoint === null) {
        return this.context.invalidReceiver("MessagePort", "start");
      }
      endpoint.start();
      return this.context.undefined();
    });
    this.context.method(this.#portPrototype, "close", 0, (thisValue) => {
      const endpoint = this.#endpoint(thisValue);
      if (endpoint === null) {
        return this.context.invalidReceiver("MessagePort", "close");
      }
      endpoint.close();
      return this.context.undefined();
    });
    for (const type of ["message", "messageerror"] as const) {
      this.context.attribute(
        this.#portPrototype,
        `on${type}`,
        (thisValue) => {
          const endpoint = this.#endpoint(thisValue);
          return endpoint === null
            ? this.context.invalidReceiver("MessagePort", `on${type}`)
            : normal(
                this.#portEventHandlers.get(endpoint)?.get(type) ??
                  engine.fromPrimitive(null),
              );
        },
        (thisValue, argumentsList) => {
          const endpoint = this.#endpoint(thisValue);
          if (endpoint === null) {
            return this.context.invalidReceiver("MessagePort", `on${type}`);
          }
          const value = argumentsList[0] ?? engine.fromPrimitive(undefined);
          let handlers = this.#portEventHandlers.get(endpoint);
          if (handlers === undefined) {
            handlers = new Map();
            this.#portEventHandlers.set(endpoint, handlers);
          }
          if (engine.isNull(value) || engine.isUndefined(value)) {
            handlers.delete(type);
          } else {
            handlers.set(type, value);
            endpoint.start();
          }
          return this.context.undefined();
        },
      );
    }
    this.context.tag(this.#portPrototype, "MessagePort");

    const channelPrototype = engine.createObject(
      realm,
      engine.objectPrototype(realm),
    );
    const channelConstructor = this.context.createConstructor(
      "MessageChannel",
      0,
      () => {
        const [port1, port2] = createMessageEndpointPair();
        const object = engine.createObject(realm, channelPrototype);
        engine.initializeDataProperty(object, "port1", this.wrapPort(port1), {
          configurable: true,
          enumerable: true,
          writable: false,
        });
        engine.initializeDataProperty(object, "port2", this.wrapPort(port2), {
          configurable: true,
          enumerable: true,
          writable: false,
        });
        return normal(object);
      },
    );
    this.context.installInterface(
      "MessageChannel",
      channelConstructor,
      channelPrototype,
    );
    this.context.tag(channelPrototype, "MessageChannel");
  }

  #endpoint(value: EngineValue): MessageEndpoint | null {
    const target = this.dom.interfaceObject(value);
    return target instanceof MessageEndpoint ? target : null;
  }
}
