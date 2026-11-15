const promise = customElements.whenDefined("invalid");
promise.then(undefined, () => undefined);
Promise.resolve().then(() => undefined);
