/**
 * @silverassist/performance-toolkit
 *
 * Export pattern analyzer type definitions.
 *
 * @module types/analyzer
 * @author Miguel Colmenares <me@miguelcolmenares.com>
 * @license PolyForm-Noncommercial-1.0.0
 */

// =============================================================================
// Export Pattern Analysis Types
// =============================================================================

/**
 * Type of export detected in a file
 */
export type ExportType = "default" | "named" | "namespace" | "mixed";

/**
 * Type of re-export pattern in barrel files
 */
export type ReExportType =
  | "default-as-named" // export { default as Name } from './file'
  | "named" // export { Name } from './file'
  | "namespace" // export * from './file'
  | "mixed";

/**
 * Individual file export analysis
 */
export interface FileExportInfo {
  /** File path relative to project root */
  path: string;
  /** Primary export type detected */
  exportType: ExportType;
  /** Number of default exports (usually 0 or 1) */
  defaultExportCount: number;
  /** Number of named exports */
  namedExportCount: number;
  /** Whether this is a barrel file (index.ts/js) */
  isBarrelFile: boolean;
  /** Re-export patterns if barrel file */
  reExportType?: ReExportType;
  /** Number of re-exports */
  reExportCount?: number;
  /** Specific issues detected */
  issues: ExportIssue[];
}

/**
 * Specific export pattern issue
 */
export interface ExportIssue {
  /** Issue type */
  type:
    | "default-in-barrel"
    | "default-reexport"
    | "mixed-exports"
    | "namespace-reexport";
  /** Issue severity */
  severity: "warning" | "info";
  /** Human-readable description */
  message: string;
  /** Line number where issue occurs (if available) */
  line?: number;
  /** Suggested fix */
  suggestion?: string;
}

/**
 * Summary of export patterns across project
 */
export interface ExportAnalysisSummary {
  /** Total files analyzed */
  totalFiles: number;
  /** Files with default exports */
  defaultExportFiles: number;
  /** Files with named exports */
  namedExportFiles: number;
  /** Files with mixed exports */
  mixedExportFiles: number;
  /** Barrel files found */
  barrelFiles: number;
  /** Barrel files with default re-exports (problematic) */
  problematicBarrelFiles: number;
  /** Total issues found */
  totalIssues: number;
  /** Issues by severity */
  issuesBySeverity: {
    warning: number;
    info: number;
  };
}

/**
 * next.config.js/mjs analysis results
 */
export interface NextConfigAnalysis {
  /** Whether next.config file was found */
  configFound: boolean;
  /** File path if found */
  configPath?: string;
  /** Whether optimizePackageImports is configured */
  hasOptimizePackageImports: boolean;
  /** Packages configured for optimization */
  optimizedPackages?: string[];
  /** Suggested packages to add */
  suggestedPackages?: string[];
}

/**
 * Complete export analysis result
 */
export interface ExportAnalysisResult {
  /** When analysis was performed */
  timestamp: string;
  /** Project root directory */
  projectRoot: string;
  /** Framework info (if Next.js) */
  framework?: {
    name: string;
    version: string;
  };
  /** Summary statistics */
  summary: ExportAnalysisSummary;
  /** Files with issues */
  filesWithIssues: FileExportInfo[];
  /** Next.js config analysis */
  nextConfig?: NextConfigAnalysis;
  /** Recommendations */
  recommendations: ExportRecommendation[];
}

/**
 * Actionable recommendation for export pattern improvements
 */
export interface ExportRecommendation {
  /** Priority level */
  priority: "high" | "medium" | "low";
  /** Category of recommendation */
  category:
    | "barrel-files"
    | "default-exports"
    | "config-optimization"
    | "general";
  /** Title */
  title: string;
  /** Detailed description */
  description: string;
  /** Estimated impact */
  impact: {
    /** Bundle size impact (percentage) */
    bundleSize?: string;
    /** Tree-shaking effectiveness */
    treeShaking?: "high" | "medium" | "low";
    /** Build performance */
    buildPerformance?: "improved" | "neutral" | "degraded";
  };
  /** Code examples */
  examples?: {
    /** Current problematic pattern */
    before: string;
    /** Recommended pattern */
    after: string;
  };
  /** Files affected */
  affectedFiles?: string[];
}

/**
 * Configuration options for export analyzer
 */
export interface ExportAnalyzerOptions {
  /** Project root directory */
  projectRoot?: string;
  /** Directories to scan (default: ["src", "app", "pages", "components", "lib"]) */
  includeDirs?: string[];
  /** Directories to exclude (default: ["node_modules", "dist", "build", ".next", ".turbo", "coverage", "__tests__"]) */
  excludeDirs?: string[];
  /** File extensions to analyze (default: [".ts", ".tsx", ".js", ".jsx"]) */
  extensions?: string[];
  /** Whether to analyze next.config.js/mjs */
  analyzeNextConfig?: boolean;
  /** Minimum files for barrel file detection (default: 3) */
  minBarrelFileReexports?: number;
}
