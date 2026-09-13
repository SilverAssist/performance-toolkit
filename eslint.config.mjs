import base from "@silverassist/npm-package-standards/eslint/base";
import tseslint from "typescript-eslint";

export default tseslint.config(
  ...base,
  {
    ignores: ["dist/**", "node_modules/**", "coverage/**", "bin/**"],
  },
  {
    files: ["src/**/*.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
);
