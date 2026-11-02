import { registerHooks } from "node:module";

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "@engine262/engine262") {
      throw new Error("JavaScript engine package was imported");
    }
    if (
      (specifier === "node:url" || specifier === "url") &&
      context.parentURL?.includes("/src/")
    ) {
      throw new Error("Host URL module was imported by implementation code");
    }
    return nextResolve(specifier, context);
  },
});
