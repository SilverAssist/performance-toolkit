/**
 * @silverassist/performance-toolkit
 *
 * PageSpeed Insights and Lighthouse CI integration for performance monitoring
 * across SilverAssist projects (FamilyAssets, CareConnect, AgingAdvocate, OSA).
 *
 * @module @silverassist/performance-toolkit
 * @author Miguel Colmenares <me@miguelcolmenares.com>
 * @license PolyForm-Noncommercial-1.0.0
 * @see {@link https://github.com/SilverAssist/performance-toolkit}
 *
 * @example PageSpeed API usage
 * ```ts
 * import { analyzeUrl } from '@silverassist/performance-toolkit';
 *
 * const result = await analyzeUrl('https://www.familyassets.com', {
 *   strategy: 'mobile',
 *   apiKey: process.env.PAGESPEED_API_KEY,
 * });
 * console.log(result.scores.performance); // 85
 * console.log(result.metrics.lcp.displayValue); // "2.5 s"
 * ```
 *
 * @example Lighthouse CI usage
 * ```ts
 * import { createPSIRunner, getDefaultThresholds } from '@silverassist/performance-toolkit';
 *
 * const runner = createPSIRunner(
 *   ['https://www.familyassets.com/assisted-living'],
 *   process.env.PAGESPEED_API_KEY
 * ).withAssertions(getDefaultThresholds());
 *
 * const exitCode = await runner.run();
 * ```
 */

// PageSpeed Insights exports
export {
  PageSpeedClient,
  createPageSpeedClient,
  analyzeUrl,
} from "./pagespeed";

// Lighthouse CI exports
export {
  LighthouseRunner,
  createNodeRunner,
  createPSIRunner,
  createHybridRunners,
  getDefaultThresholds,
} from "./lighthouse";

// Project Context Detection exports
export {
  ProjectContextDetector,
  createContextDetector,
  detectProjectContext,
} from "./context";

// Actionable Report Generation exports
export {
  ActionableReportGenerator,
  createReportGenerator,
  generateActionableReport,
} from "./report";

// Bundle Analysis exports
export {
  BundleAnalyzerRunner,
  createBundleAnalyzer,
  analyzeBundle,
} from "./bundle";

// Export Pattern Analyzer exports
export {
  ExportAnalyzer,
  createExportAnalyzer,
  analyzeExports,
} from "./analyzer";

// Type exports
export type {
  // Core types
  CoreWebVitals,
  MetricValue,
  Strategy,
  Category,
  // PageSpeed types
  PageSpeedOptions,
  PageSpeedResponse,
  LoadingExperience,
  LighthouseResult,
  LighthouseCategories,
  LighthouseCategory,
  LighthouseAudit,
  AuditDetails,
  // Result types
  PerformanceResult,
  CategoryScores,
  LCPElement,
  LCPBreakdown,
  Opportunity,
  Diagnostic,
  // Detailed Insights types (for AI agents)
  DetailedInsights,
  CacheIssue,
  ImageIssue,
  UnusedCodeIssue,
  LegacyJSIssue,
  ThirdPartyIssue,
  LongTask,
  RenderBlockingResource,
  // Lighthouse CI types
  LHCIMethod,
  LHCIOptions,
  LHCIAssertions,
  LHCIConfig,
  // Configuration types
  PerformanceThresholds,
  ProjectConfig,
  ToolkitConfig,
  // CLI types
  CLIOptions,
  CLIResult,
  ThresholdViolation,
  // Diagnostics & Enhanced LCP types
  DiagnosticItem,
  DiagnosticDetailItem,
  EnhancedLCPElement,
  LCPRecommendation,
  // Project Context types
  ProjectContext,
  FrameworkInfo,
  // Actionable Report types
  KeyOpportunity,
  ActionStep,
  FrameworkSpecificNote,
  NextStep,
  ActionableReport,
  // Bundle types
  BundleAnalyzerOptions,
  BundleAnalysisResult,
  BundleSummary,
  ChunkInfo,
  DependencyInfo,
  // Export Analyzer types
  ExportType,
  ReExportType,
  FileExportInfo,
  ExportIssue,
  ExportAnalysisSummary,
  NextConfigAnalysis,
  ExportAnalysisResult,
  ExportRecommendation,
  ExportAnalyzerOptions,
} from "./types";

/**
 * Package version
 */
export const VERSION = "0.3.1";

/**
 * Supported SilverAssist projects
 */
export const PROJECTS = {
  FA: "FamilyAssets",
  CC: "CareConnect",
  AA: "AgingAdvocate",
  OSA: "OSA",
} as const;

/**
 * Default Core Web Vitals thresholds (based on Google's guidelines)
 */
export const CWV_THRESHOLDS = {
  LCP: {
    good: 2500,
    needsImprovement: 4000,
  },
  FCP: {
    good: 1800,
    needsImprovement: 3000,
  },
  CLS: {
    good: 0.1,
    needsImprovement: 0.25,
  },
  TBT: {
    good: 200,
    needsImprovement: 600,
  },
} as const;
