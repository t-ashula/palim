import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "core",
          include: ["packages/core/test/**/*.test.ts"],
          exclude: ["packages/core/test/conformance/**/*.test.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "window",
          include: ["packages/window/test/**/*.test.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "scripting",
          include: ["packages/scripting/test/**/*.test.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "engine262",
          include: ["packages/engine262/test/**/*.test.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "palim",
          include: ["packages/palim/test/**/*.test.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "integration",
          include: ["test/**/*.test.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "tooling",
          include: [
            "benchmark/test/**/*.test.ts",
            "tools/**/test/**/*.test.ts",
          ],
        },
      },
      {
        extends: true,
        test: {
          name: "conformance",
          include: ["packages/core/test/conformance/**/*.test.ts"],
        },
      },
    ],
  },
});
