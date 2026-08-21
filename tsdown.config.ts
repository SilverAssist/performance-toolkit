import { defineConfig } from "tsdown";

// Migrated from tsup, which is no longer maintained ("This project is not
// actively maintained anymore. Please consider using tsdown instead.").
export default defineConfig({
  entry: {
    index: "src/index.ts",
    "pagespeed/index": "src/pagespeed/index.ts",
    "lighthouse/index": "src/lighthouse/index.ts",
    "bundle/index": "src/bundle/index.ts",
    "analyzer/index": "src/analyzer/index.ts",
    "context/index": "src/context/index.ts",
    "report/index": "src/report/index.ts",
    "types/index": "src/types/index.ts",
  },
  format: ["cjs", "esm"],
  // tsdown defaults to fixed .mjs/.cjs. Preserve the names the published
  // `exports` map already points at; changing them would break consumers.
  fixedExtension: false,
  dts: { sourcemap: false },
  clean: true,
  sourcemap: true,
  treeshake: true,
  minify: false,
  // Was an `esbuildOptions` banner under tsup; tsdown is rolldown-based and
  // exposes `banner` directly.
  banner:
    "// @silverassist/performance-toolkit - PageSpeed & Lighthouse CI integration",
});
