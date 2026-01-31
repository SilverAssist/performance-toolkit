/**
 * @silverassist/performance-toolkit
 *
 * PageSpeed Insights and Lighthouse CI integration for performance monitoring
 * across SilverAssist projects (FamilyAssets, CareConnect, AgingAdvocate, OSA).
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
 *
 * @packageDocumentation
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
} from "./types";

/**
 * Package version
 */
export const VERSION = "0.1.0";

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
