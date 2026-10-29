import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig(
  {
    ignores: ["coverage/**", "dist/**", "node_modules/**", "conformance/**"],
  },
  {
    files: ["**/*.ts"],
    extends: [
      tseslint.configs.strictTypeChecked,
      tseslint.configs.stylisticTypeChecked,
    ],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          fixStyle: "separate-type-imports",
          prefer: "type-imports",
        },
      ],
      curly: ["error", "all"],
    },
  },
);
