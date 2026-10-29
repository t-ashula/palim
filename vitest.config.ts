import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "project",
          include: ["test/*.test.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "conformance",
          include: ["test/conformance/**/*.test.ts"],
        },
      },
    ],
  },
});
