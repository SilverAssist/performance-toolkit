import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "pagespeed/index": "src/pagespeed/index.ts",
    "lighthouse/index": "src/lighthouse/index.ts",
    "bundle/index": "src/bundle/index.ts",
    "types/index": "src/types/index.ts",
  },
  format: ["cjs", "esm"],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  minify: false,
  esbuildOptions(options) {
    options.banner = {
      js: "// @silverassist/performance-toolkit - PageSpeed & Lighthouse CI integration",
    };
  },
});
