const IMPLEMENTATIONS = new WeakMap<object, object>();
const INTERFACES = new WeakMap<object, object>();

export function bindDOMInterface(
  interfaceObject: object,
  implementationObject: object,
): void {
  IMPLEMENTATIONS.set(interfaceObject, implementationObject);
  INTERFACES.set(implementationObject, interfaceObject);
}

export function implementationFor(interfaceObject: object): object {
  const implementation = IMPLEMENTATIONS.get(interfaceObject);
  if (implementation === undefined) {
    throw new TypeError("The object is not bound to a DOM implementation");
  }
  return implementation;
}

export function interfaceFor(implementationObject: object): object {
  const interfaceObject = INTERFACES.get(implementationObject);
  if (interfaceObject === undefined) {
    throw new TypeError("The DOM implementation has no interface object");
  }
  return interfaceObject;
}
