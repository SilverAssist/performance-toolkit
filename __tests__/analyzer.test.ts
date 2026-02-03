/**
 * Tests for Export Pattern Analyzer
 */

import {
  ExportAnalyzer,
  createExportAnalyzer,
  analyzeExports,
} from "../src/analyzer";
import type {
  ExportAnalysisResult,
  ExportType,
  ReExportType,
} from "../src/types";

// Mock fs and path modules
jest.mock("fs", () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
  readdirSync: jest.fn(),
}));

jest.mock("path", () => ({
  join: (...args: string[]) => args.join("/"),
  relative: (from: string, to: string) => to.replace(from + "/", ""),
  basename: (filePath: string, ext?: string) => {
    const base = filePath.split("/").pop() || "";
    if (ext) return base.replace(ext, "");
    return base;
  },
  extname: (filePath: string) => {
    const match = filePath.match(/\.[^.]+$/);
    return match ? match[0] : "";
  },
}));

// Get the mocked fs
import * as fs from "fs";
const mockedFs = fs as jest.Mocked<typeof fs>;

describe("ExportAnalyzer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default: no files found
    mockedFs.existsSync.mockReturnValue(false);
    mockedFs.readdirSync.mockReturnValue([]);
  });

  describe("constructor", () => {
    it("should create instance with default options", () => {
      const analyzer = new ExportAnalyzer();
      expect(analyzer).toBeInstanceOf(ExportAnalyzer);
    });

    it("should create instance with custom options", () => {
      const analyzer = new ExportAnalyzer({
        projectRoot: "/custom/path",
        includeDirs: ["src"],
        excludeDirs: ["node_modules"],
      });
      expect(analyzer).toBeInstanceOf(ExportAnalyzer);
    });
  });

  describe("export pattern detection", () => {
    it("should detect default export in component", async () => {
      const fileContent = `
        export default function Button() {
          return <button>Click me</button>;
        }
      `;

      setupMockFiles([
        { path: "/test/src/components/button.tsx", content: fileContent },
      ]);

      const analyzer = new ExportAnalyzer({ projectRoot: "/test" });
      const result = await analyzer.analyze();

      expect(result.summary.totalFiles).toBe(1);
      expect(result.summary.defaultExportFiles).toBe(1);
      expect(result.summary.namedExportFiles).toBe(0);
    });

    it("should detect named export in component", async () => {
      const fileContent = `
        export function Button() {
          return <button>Click me</button>;
        }
      `;

      setupMockFiles([
        { path: "/test/src/components/button.tsx", content: fileContent },
      ]);

      const analyzer = new ExportAnalyzer({ projectRoot: "/test" });
      const result = await analyzer.analyze();

      expect(result.summary.totalFiles).toBe(1);
      expect(result.summary.defaultExportFiles).toBe(0);
      expect(result.summary.namedExportFiles).toBe(1);
    });

    it("should detect mixed exports", async () => {
      const fileContent = `
        export function Button() {
          return <button>Click me</button>;
        }
        export default Button;
      `;

      setupMockFiles([
        { path: "/test/src/components/button.tsx", content: fileContent },
      ]);

      const analyzer = new ExportAnalyzer({ projectRoot: "/test" });
      const result = await analyzer.analyze();

      expect(result.summary.mixedExportFiles).toBe(1);
      expect(result.filesWithIssues.length).toBeGreaterThan(0);
      expect(result.filesWithIssues[0].issues[0].type).toBe("mixed-exports");
    });
  });

  describe("barrel file detection", () => {
    it("should detect barrel file with named re-exports", async () => {
      const indexContent = `
        export { Button } from './button';
        export { Input } from './input';
      `;

      setupMockFiles([
        { path: "/test/src/components/index.ts", content: indexContent },
      ]);

      const analyzer = new ExportAnalyzer({ projectRoot: "/test" });
      const result = await analyzer.analyze();

      expect(result.summary.barrelFiles).toBe(1);
      expect(result.summary.problematicBarrelFiles).toBe(0);
    });

    it("should detect barrel file with default re-exports as named", async () => {
      const indexContent = `
        export { default as Button } from './button';
        export { default as Input } from './input';
      `;

      setupMockFiles([
        { path: "/test/src/components/index.ts", content: indexContent },
      ]);

      const analyzer = new ExportAnalyzer({ projectRoot: "/test" });
      const result = await analyzer.analyze();

      expect(result.summary.barrelFiles).toBe(1);
      expect(result.summary.problematicBarrelFiles).toBe(1);
      expect(result.filesWithIssues.length).toBeGreaterThan(0);
      expect(result.filesWithIssues[0].issues[0].type).toBe("default-reexport");
    });

    it("should detect barrel file with namespace re-exports", async () => {
      const indexContent = `
        export * from './utils';
        export * from './helpers';
      `;

      setupMockFiles([
        { path: "/test/src/lib/index.ts", content: indexContent },
      ]);

      const analyzer = new ExportAnalyzer({ projectRoot: "/test" });
      const result = await analyzer.analyze();

      expect(result.summary.barrelFiles).toBe(1);
      expect(result.summary.problematicBarrelFiles).toBe(1);
      expect(result.filesWithIssues[0].issues[0].type).toBe(
        "namespace-reexport",
      );
    });

    it("should not flag regular index file as barrel if no re-exports", async () => {
      const indexContent = `
        export function myFunction() {
          return 'hello';
        }
      `;

      setupMockFiles([
        { path: "/test/src/utils/index.ts", content: indexContent },
      ]);

      const analyzer = new ExportAnalyzer({ projectRoot: "/test" });
      const result = await analyzer.analyze();

      expect(result.summary.barrelFiles).toBe(1);
      expect(result.summary.problematicBarrelFiles).toBe(0);
    });
  });

  describe("next.config.js analysis", () => {
    it("should detect next.config.mjs with optimizePackageImports", async () => {
      const nextConfigContent = `
        export default {
          experimental: {
            optimizePackageImports: ['@/components', '@/lib']
          }
        };
      `;

      setupMockFiles([
        { path: "/test/next.config.mjs", content: nextConfigContent },
      ]);

      const analyzer = new ExportAnalyzer({
        projectRoot: "/test",
        analyzeNextConfig: true,
        includeDirs: [], // No source files
      });
      const result = await analyzer.analyze();

      expect(result.nextConfig?.configFound).toBe(true);
      expect(result.nextConfig?.hasOptimizePackageImports).toBe(true);
    });

    it("should detect next.config.mjs without optimizePackageImports", async () => {
      const nextConfigContent = `
        export default {
          reactStrictMode: true
        };
      `;

      setupMockFiles([
        { path: "/test/next.config.mjs", content: nextConfigContent },
      ]);

      const analyzer = new ExportAnalyzer({
        projectRoot: "/test",
        analyzeNextConfig: true,
        includeDirs: [],
      });
      const result = await analyzer.analyze();

      expect(result.nextConfig?.configFound).toBe(true);
      expect(result.nextConfig?.hasOptimizePackageImports).toBe(false);
    });

    it("should suggest packages when no optimizePackageImports", async () => {
      const nextConfigContent = `export default {};`;

      setupMockFiles([
        { path: "/test/next.config.mjs", content: nextConfigContent },
      ]);

      // Mock src directory existence
      mockedFs.existsSync.mockImplementation((path) => {
        if (path === "/test/next.config.mjs") return true;
        if (path === "/test/src") return true;
        return false;
      });

      const analyzer = new ExportAnalyzer({
        projectRoot: "/test",
        analyzeNextConfig: true,
        includeDirs: [],
      });
      const result = await analyzer.analyze();

      expect(result.nextConfig?.suggestedPackages).toBeDefined();
      expect(result.nextConfig?.suggestedPackages).toContain("@/components");
    });
  });

  describe("recommendations", () => {
    it("should generate high-priority recommendation for problematic barrel files", async () => {
      const indexContent = `
        export { default as Button } from './button';
      `;

      setupMockFiles([
        { path: "/test/src/components/index.ts", content: indexContent },
      ]);

      const analyzer = new ExportAnalyzer({ projectRoot: "/test" });
      const result = await analyzer.analyze();

      expect(result.recommendations.length).toBeGreaterThan(0);
      const barrelRec = result.recommendations.find(
        (r) => r.category === "barrel-files",
      );
      expect(barrelRec).toBeDefined();
      expect(barrelRec?.priority).toBe("high");
    });

    it("should generate medium-priority recommendation for high default export usage", async () => {
      const files = Array.from({ length: 10 }, (_, i) => ({
        path: `/test/src/component${i}.tsx`,
        content: `export default function Component${i}() {}`,
      }));

      setupMockFiles(files);

      const analyzer = new ExportAnalyzer({ projectRoot: "/test" });
      const result = await analyzer.analyze();

      const defaultRec = result.recommendations.find(
        (r) => r.category === "default-exports",
      );
      expect(defaultRec).toBeDefined();
      expect(defaultRec?.priority).toBe("medium");
    });

    it("should generate config recommendation when optimizePackageImports not configured", async () => {
      const nextConfigContent = `export default {};`;

      setupMockFiles([
        { path: "/test/next.config.mjs", content: nextConfigContent },
        { path: "/test/src/components/button.tsx", content: "export function Button() {}" },
      ]);

      mockedFs.existsSync.mockImplementation((path) => {
        if (path === "/test/next.config.mjs") return true;
        if (path === "/test/src") return true;
        return false;
      });

      const analyzer = new ExportAnalyzer({
        projectRoot: "/test",
        analyzeNextConfig: true,
      });
      const result = await analyzer.analyze();

      const configRec = result.recommendations.find(
        (r) => r.category === "config-optimization",
      );
      expect(configRec).toBeDefined();
      expect(configRec?.priority).toBe("high");
    });
  });

  describe("framework detection", () => {
    it("should detect Next.js from package.json", async () => {
      const packageJsonContent = JSON.stringify({
        dependencies: {
          next: "^14.0.0",
          react: "^18.0.0",
        },
      });

      setupMockFiles([
        { path: "/test/package.json", content: packageJsonContent },
      ]);

      const analyzer = new ExportAnalyzer({
        projectRoot: "/test",
        includeDirs: [],
      });
      const result = await analyzer.analyze();

      expect(result.framework).toBeDefined();
      expect(result.framework?.name).toBe("Next.js");
      expect(result.framework?.version).toBe("14.0.0");
    });

    it("should handle missing package.json", async () => {
      setupMockFiles([]);

      const analyzer = new ExportAnalyzer({
        projectRoot: "/test",
        includeDirs: [],
      });
      const result = await analyzer.analyze();

      expect(result.framework).toBeUndefined();
    });
  });

  describe("factory functions", () => {
    it("should create analyzer via factory function", () => {
      const analyzer = createExportAnalyzer({ projectRoot: "/test" });
      expect(analyzer).toBeInstanceOf(ExportAnalyzer);
    });

    it("should analyze via convenience function", async () => {
      setupMockFiles([
        {
          path: "/test/src/button.tsx",
          content: "export function Button() {}",
        },
      ]);

      const result = await analyzeExports({ projectRoot: "/test" });
      expect(result).toBeDefined();
      expect(result.summary).toBeDefined();
    });
  });
});

/**
 * Helper to setup mock file system
 */
function setupMockFiles(
  files: Array<{ path: string; content: string }>,
): void {
  mockedFs.existsSync.mockImplementation((filePath) => {
    return files.some((f) => f.path === filePath) || filePath.includes("/src");
  });

  mockedFs.readFileSync.mockImplementation((filePath) => {
    const file = files.find((f) => f.path === filePath);
    if (!file) throw new Error(`File not found: ${filePath}`);
    return file.content;
  });

  // Mock directory scanning
  mockedFs.readdirSync.mockImplementation((dirPath) => {
    const dirFiles = files
      .filter((f) => f.path.startsWith(dirPath as string))
      .map((f) => {
        const relativePath = (f.path as string).replace(
          (dirPath as string) + "/",
          "",
        );
        const parts = relativePath.split("/");
        return parts[0];
      })
      .filter((name, idx, arr) => arr.indexOf(name) === idx); // unique

    return dirFiles.map((name) => {
      const fullPath = `${dirPath}/${name}`;
      const isFile = files.some((f) => f.path === fullPath);
      return {
        name,
        isDirectory: () => !isFile,
        isFile: () => isFile,
      };
    }) as unknown as fs.Dirent[];
  });
}
