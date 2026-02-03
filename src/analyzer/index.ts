/**
 * @silverassist/performance-toolkit
 *
 * Export pattern analyzer for Next.js tree-shaking optimization.
 *
 * @module analyzer
 * @author Miguel Colmenares <me@miguelcolmenares.com>
 * @license PolyForm-Noncommercial-1.0.0
 */

import type {
  ExportAnalyzerOptions,
  ExportAnalysisResult,
  ExportAnalysisSummary,
  ExportIssue,
  ExportRecommendation,
  ExportType,
  FileExportInfo,
  NextConfigAnalysis,
  ReExportType,
} from "../types";

/**
 * Export pattern analyzer for detecting suboptimal module export patterns
 * that impact tree-shaking effectiveness in Next.js projects.
 */
export class ExportAnalyzer {
  private options: Required<ExportAnalyzerOptions>;
  private fs: typeof import("fs") | null = null;
  private path: typeof import("path") | null = null;

  constructor(options: ExportAnalyzerOptions = {}) {
    this.options = {
      projectRoot: options.projectRoot || process.cwd(),
      includeDirs: options.includeDirs || [
        "src",
        "app",
        "pages",
        "components",
        "lib",
      ],
      excludeDirs: options.excludeDirs || [
        "node_modules",
        "dist",
        "build",
        ".next",
        ".turbo",
        "coverage",
        "__tests__",
        ".test",
        ".spec",
      ],
      extensions: options.extensions || [".ts", ".tsx", ".js", ".jsx"],
      analyzeNextConfig: options.analyzeNextConfig ?? true,
      minBarrelFileReexports: options.minBarrelFileReexports ?? 3,
    };
  }

  /**
   * Performs complete export pattern analysis
   */
  async analyze(): Promise<ExportAnalysisResult> {
    await this.loadModules();

    const files = await this.scanFiles();
    const fileAnalyses = await this.analyzeFiles(files);

    const summary = this.createSummary(fileAnalyses);
    const filesWithIssues = fileAnalyses.filter((f) => f.issues.length > 0);

    const nextConfig = this.options.analyzeNextConfig
      ? await this.analyzeNextConfig()
      : undefined;

    const recommendations = this.generateRecommendations(
      summary,
      filesWithIssues,
      nextConfig,
    );

    // Detect framework info if available
    const framework = await this.detectFramework();

    return {
      timestamp: new Date().toISOString(),
      projectRoot: this.options.projectRoot,
      framework,
      summary,
      filesWithIssues,
      nextConfig,
      recommendations,
    };
  }

  /**
   * Dynamically load fs and path modules
   */
  private async loadModules(): Promise<void> {
    try {
      this.fs = await import("fs");
      this.path = await import("path");
    } catch {
      throw new Error(
        "File system access not available in this environment. ExportAnalyzer requires Node.js environment.",
      );
    }
  }

  /**
   * Scans project directories for files to analyze
   */
  private async scanFiles(): Promise<string[]> {
    if (!this.fs || !this.path) return [];

    const files: string[] = [];

    for (const dir of this.options.includeDirs) {
      const dirPath = this.path.join(this.options.projectRoot, dir);

      if (this.fs.existsSync(dirPath)) {
        const foundFiles = await this.scanDirectory(dirPath);
        files.push(...foundFiles);
      }
    }

    return files;
  }

  /**
   * Recursively scans a directory for matching files
   */
  private async scanDirectory(dirPath: string): Promise<string[]> {
    if (!this.fs || !this.path) return [];

    const files: string[] = [];

    try {
      const entries = this.fs.readdirSync(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = this.path.join(dirPath, entry.name);

        // Skip excluded directories
        if (entry.isDirectory()) {
          if (this.options.excludeDirs.includes(entry.name)) continue;
          if (entry.name.startsWith(".")) continue;

          const subFiles = await this.scanDirectory(fullPath);
          files.push(...subFiles);
        } else if (entry.isFile()) {
          // Check if file has valid extension
          const ext = this.path.extname(entry.name);
          if (this.options.extensions.includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    } catch {
      // Directory not accessible, skip
    }

    return files;
  }

  /**
   * Analyzes export patterns in multiple files
   */
  private async analyzeFiles(files: string[]): Promise<FileExportInfo[]> {
    const analyses: FileExportInfo[] = [];

    for (const filePath of files) {
      const analysis = await this.analyzeFile(filePath);
      analyses.push(analysis);
    }

    return analyses;
  }

  /**
   * Analyzes export patterns in a single file
   */
  private async analyzeFile(filePath: string): Promise<FileExportInfo> {
    if (!this.fs || !this.path) {
      throw new Error("File system modules not loaded");
    }

    const content = this.fs.readFileSync(filePath, "utf-8");
    const relativePath = this.path.relative(
      this.options.projectRoot,
      filePath,
    );

    const fileName = this.path.basename(filePath, this.path.extname(filePath));
    const isBarrelFile = fileName === "index";

    // Detect export patterns using regex
    const defaultExportCount = this.countDefaultExports(content);
    const namedExportCount = this.countNamedExports(content);

    // Determine primary export type
    let exportType: ExportType = "named";
    if (defaultExportCount > 0 && namedExportCount > 0) {
      exportType = "mixed";
    } else if (defaultExportCount > 0) {
      exportType = "default";
    } else if (content.includes("export *")) {
      exportType = "namespace";
    }

    // Analyze re-exports for barrel files
    let reExportType: ReExportType | undefined;
    let reExportCount: number | undefined;

    if (isBarrelFile) {
      const reExports = this.analyzeReExports(content);
      reExportType = reExports.type;
      reExportCount = reExports.count;
    }

    // Detect issues
    const issues = this.detectIssues(
      content,
      exportType,
      isBarrelFile,
      reExportType,
    );

    return {
      path: relativePath,
      exportType,
      defaultExportCount,
      namedExportCount,
      isBarrelFile,
      reExportType,
      reExportCount,
      issues,
    };
  }

  /**
   * Counts default exports in file content
   */
  private countDefaultExports(content: string): number {
    // Match: export default ...
    const patterns = [
      /export\s+default\s+/g,
      /export\s*\{\s*\w+\s+as\s+default\s*\}/g,
    ];

    let count = 0;
    for (const pattern of patterns) {
      const matches = content.match(pattern);
      if (matches) count += matches.length;
    }

    return count;
  }

  /**
   * Counts named exports in file content
   */
  private countNamedExports(content: string): number {
    const patterns = [
      // export function/const/class Name
      /export\s+(function|const|let|var|class|interface|type|enum)\s+\w+/g,
      // export { Name1, Name2 }
      /export\s*\{\s*[\w\s,]+\s*\}/g,
    ];

    let count = 0;
    for (const pattern of patterns) {
      const matches = content.match(pattern);
      if (matches) count += matches.length;
    }

    return count;
  }

  /**
   * Analyzes re-export patterns in barrel files
   */
  private analyzeReExports(
    content: string,
  ): { type: ReExportType; count: number } {
    const defaultAsNamedPattern =
      /export\s*\{\s*default\s+as\s+\w+\s*\}\s*from/g;
    const namedPattern = /export\s*\{\s*[\w\s,]+\s*\}\s*from/g;
    const namespacePattern = /export\s*\*\s*from/g;

    const defaultAsNamed = content.match(defaultAsNamedPattern)?.length || 0;
    const named = content.match(namedPattern)?.length || 0;
    const namespace = content.match(namespacePattern)?.length || 0;

    let type: ReExportType = "named";
    if (defaultAsNamed > 0 && named > 0) {
      type = "mixed";
    } else if (defaultAsNamed > 0) {
      type = "default-as-named";
    } else if (namespace > 0) {
      type = "namespace";
    }

    const count = defaultAsNamed + named + namespace;

    return { type, count };
  }

  /**
   * Detects export pattern issues
   */
  private detectIssues(
    content: string,
    exportType: ExportType,
    isBarrelFile: boolean,
    reExportType?: ReExportType,
  ): ExportIssue[] {
    const issues: ExportIssue[] = [];

    // Issue 1: Default exports in barrel files
    if (isBarrelFile && exportType === "default") {
      issues.push({
        type: "default-in-barrel",
        severity: "warning",
        message:
          "Barrel file (index) uses default export, which can prevent tree-shaking",
        suggestion:
          'Use named exports instead: "export { MyComponent }" or "export function MyComponent()"',
      });
    }

    // Issue 2: Default re-exports in barrel files
    if (isBarrelFile && reExportType === "default-as-named") {
      issues.push({
        type: "default-reexport",
        severity: "warning",
        message:
          'Re-exporting default exports as named (export { default as Name }) is suboptimal for tree-shaking',
        suggestion:
          'Change source files to use named exports, then re-export: "export { Name } from \'./file\'"',
      });
    }

    // Issue 3: Mixed exports (less critical)
    if (exportType === "mixed") {
      issues.push({
        type: "mixed-exports",
        severity: "info",
        message:
          "File contains both default and named exports, which can reduce tree-shaking predictability",
        suggestion:
          "Consider using only named exports for better tree-shaking reliability",
      });
    }

    // Issue 4: Namespace re-exports (can prevent tree-shaking)
    if (isBarrelFile && reExportType === "namespace") {
      issues.push({
        type: "namespace-reexport",
        severity: "warning",
        message:
          'Using "export * from" prevents static analysis and may include unused exports',
        suggestion:
          "Use explicit named re-exports: \"export { Name1, Name2 } from './file'\"",
      });
    }

    return issues;
  }

  /**
   * Creates summary statistics from file analyses
   */
  private createSummary(
    analyses: FileExportInfo[],
  ): ExportAnalysisSummary {
    return {
      totalFiles: analyses.length,
      defaultExportFiles: analyses.filter(
        (a) => a.exportType === "default" || a.exportType === "mixed",
      ).length,
      namedExportFiles: analyses.filter((a) => a.exportType === "named").length,
      mixedExportFiles: analyses.filter((a) => a.exportType === "mixed").length,
      barrelFiles: analyses.filter((a) => a.isBarrelFile).length,
      problematicBarrelFiles: analyses.filter(
        (a) =>
          a.isBarrelFile &&
          (a.reExportType === "default-as-named" ||
            a.reExportType === "namespace"),
      ).length,
      totalIssues: analyses.reduce((sum, a) => sum + a.issues.length, 0),
      issuesBySeverity: {
        warning: analyses.reduce(
          (sum, a) =>
            sum + a.issues.filter((i) => i.severity === "warning").length,
          0,
        ),
        info: analyses.reduce(
          (sum, a) =>
            sum + a.issues.filter((i) => i.severity === "info").length,
          0,
        ),
      },
    };
  }

  /**
   * Analyzes next.config.js/mjs for optimizePackageImports
   */
  private async analyzeNextConfig(): Promise<NextConfigAnalysis> {
    if (!this.fs || !this.path) {
      return { configFound: false, hasOptimizePackageImports: false };
    }

    const configFiles = ["next.config.mjs", "next.config.js", "next.config.ts"];
    let configPath: string | undefined;
    let content: string | undefined;

    for (const fileName of configFiles) {
      const filePath = this.path.join(this.options.projectRoot, fileName);
      if (this.fs.existsSync(filePath)) {
        configPath = fileName;
        content = this.fs.readFileSync(filePath, "utf-8");
        break;
      }
    }

    if (!content || !configPath) {
      return {
        configFound: false,
        hasOptimizePackageImports: false,
      };
    }

    // Check for optimizePackageImports configuration
    const hasOptimizePackageImports = content.includes(
      "optimizePackageImports",
    );

    let optimizedPackages: string[] = [];
    if (hasOptimizePackageImports) {
      // Try to extract package names (simplified regex approach)
      const match = content.match(
        /optimizePackageImports\s*:\s*\[([\s\S]*?)\]/,
      );
      if (match) {
        const packageList = match[1];
        const packages = packageList.match(/['"`]([^'"`]+)['"`]/g);
        if (packages) {
          optimizedPackages = packages.map((p) => p.replace(/['"`]/g, ""));
        }
      }
    }

    // Suggest common internal package patterns if not configured
    const suggestedPackages: string[] = [];
    if (!hasOptimizePackageImports) {
      if (this.fs.existsSync(this.path.join(this.options.projectRoot, "src"))) {
        suggestedPackages.push("@/components", "@/lib", "@/utils");
      }
    }

    return {
      configFound: true,
      configPath,
      hasOptimizePackageImports,
      optimizedPackages: optimizedPackages.length > 0 ? optimizedPackages : undefined,
      suggestedPackages: suggestedPackages.length > 0 ? suggestedPackages : undefined,
    };
  }

  /**
   * Detects Next.js framework info
   */
  private async detectFramework(): Promise<
    { name: string; version: string } | undefined
  > {
    if (!this.fs || !this.path) return undefined;

    try {
      const packagePath = this.path.join(
        this.options.projectRoot,
        "package.json",
      );
      if (!this.fs.existsSync(packagePath)) return undefined;

      const content = this.fs.readFileSync(packagePath, "utf-8");
      const pkg = JSON.parse(content) as {
        dependencies?: Record<string, string>;
        devDependencies?: Record<string, string>;
      };

      const nextVersion =
        pkg.dependencies?.["next"] || pkg.devDependencies?.["next"];

      if (nextVersion) {
        return {
          name: "Next.js",
          version: nextVersion.replace(/^[\^~]/, ""),
        };
      }
    } catch {
      // Failed to parse package.json
    }

    return undefined;
  }

  /**
   * Generates actionable recommendations based on analysis results
   */
  private generateRecommendations(
    summary: ExportAnalysisSummary,
    filesWithIssues: FileExportInfo[],
    nextConfig?: NextConfigAnalysis,
  ): ExportRecommendation[] {
    const recommendations: ExportRecommendation[] = [];

    // Recommendation 1: Fix barrel files with default re-exports
    if (summary.problematicBarrelFiles > 0) {
      const affectedFiles = filesWithIssues
        .filter(
          (f) =>
            f.isBarrelFile &&
            (f.reExportType === "default-as-named" ||
              f.reExportType === "namespace"),
        )
        .map((f) => f.path);

      recommendations.push({
        priority: "high",
        category: "barrel-files",
        title: "Convert barrel files to use named re-exports",
        description: `Found ${summary.problematicBarrelFiles} barrel file(s) using default re-exports or namespace exports, which reduces tree-shaking effectiveness. Convert to named exports for better optimization.`,
        impact: {
          bundleSize: "0-5%",
          treeShaking: "high",
          buildPerformance: "neutral",
        },
        examples: {
          before:
            "// ❌ Problematic\nexport { default as Button } from './button';\nexport * from './utils';",
          after:
            "// ✅ Optimal\nexport { Button } from './button';\nexport { util1, util2 } from './utils';",
        },
        affectedFiles,
      });
    }

    // Recommendation 2: Convert default exports to named exports
    const defaultExportPercentage =
      summary.totalFiles > 0
        ? Math.round((summary.defaultExportFiles / summary.totalFiles) * 100)
        : 0;

    if (defaultExportPercentage > 30) {
      recommendations.push({
        priority: "medium",
        category: "default-exports",
        title: "Migrate from default exports to named exports",
        description: `${defaultExportPercentage}% of files use default exports, which work less predictably with tree-shaking than named exports.`,
        impact: {
          bundleSize: "1-3%",
          treeShaking: "medium",
          buildPerformance: "neutral",
        },
        examples: {
          before:
            "// ❌ Default export\nexport default function Button() { ... }",
          after: "// ✅ Named export\nexport function Button() { ... }",
        },
      });
    }

    // Recommendation 3: Configure optimizePackageImports
    if (
      nextConfig?.configFound &&
      !nextConfig.hasOptimizePackageImports &&
      nextConfig.suggestedPackages
    ) {
      recommendations.push({
        priority: "high",
        category: "config-optimization",
        title: "Enable optimizePackageImports in next.config",
        description:
          "Next.js can automatically optimize package imports for better tree-shaking. Add your internal packages to the configuration.",
        impact: {
          bundleSize: "2-8%",
          treeShaking: "high",
          buildPerformance: "improved",
        },
        examples: {
          before:
            "// next.config.mjs\nexport default {\n  // no optimization\n};",
          after: `// next.config.mjs\nexport default {\n  experimental: {\n    optimizePackageImports: ${JSON.stringify(nextConfig.suggestedPackages, null, 6)}\n  }\n};`,
        },
      });
    }

    // Recommendation 4: General guidance if issues found
    if (summary.totalIssues > 0 && recommendations.length === 0) {
      recommendations.push({
        priority: "low",
        category: "general",
        title: "Review export patterns for consistency",
        description: `Found ${summary.totalIssues} export pattern issue(s). While not critical, addressing these can improve tree-shaking reliability and code maintainability.`,
        impact: {
          bundleSize: "0-2%",
          treeShaking: "low",
          buildPerformance: "neutral",
        },
      });
    }

    return recommendations;
  }
}

/**
 * Creates an export analyzer instance
 */
export function createExportAnalyzer(
  options?: ExportAnalyzerOptions,
): ExportAnalyzer {
  return new ExportAnalyzer(options);
}

/**
 * Quick function to analyze export patterns in a project
 */
export async function analyzeExports(
  options?: ExportAnalyzerOptions,
): Promise<ExportAnalysisResult> {
  const analyzer = new ExportAnalyzer(options);
  return analyzer.analyze();
}
