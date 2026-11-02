import { registerHooks } from "node:module";

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "@engine262/engine262") {
      throw new Error("JavaScript engine package was imported");
    }
    return nextResolve(specifier, context);
  },
});
