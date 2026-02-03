/**
 * @silverassist/performance-toolkit
 *
 * Type definitions organized by domain following DDD pattern.
 *
 * @module types
 * @author Miguel Colmenares <me@miguelcolmenares.com>
 * @license PolyForm-Noncommercial-1.0.0
 */

// =============================================================================
// Domain Exports (Barrel Pattern)
// =============================================================================

// Metrics Domain - Core Web Vitals and scores
export type {
  MetricValue,
  MetricRating,
  CoreWebVitals,
  CategoryScores,
} from "./metrics";

// PageSpeed Domain - API types and responses
export type {
  Strategy,
  Category,
  PageSpeedOptions,
  PageSpeedResponse,
  LoadingExperience,
  CrUXMetric,
  LighthouseResult,
  LighthouseCategories,
  LighthouseCategory,
  LighthouseAudit,
  AuditDetails,
} from "./pagespeed";

// Lighthouse Domain - LHCI configuration
export type {
  LHCIMethod,
  LHCIOptions,
  LHCIAssertions,
  LHCIConfig,
} from "./lighthouse";

// Analysis Domain - Results, diagnostics, insights
export type {
  LCPElement,
  LCPBreakdown,
  EnhancedLCPElement,
  LCPRecommendation,
  Opportunity,
  Diagnostic,
  DiagnosticItem,
  DiagnosticDetailItem,
  CacheIssue,
  ImageIssue,
  UnusedCodeIssue,
  LegacyJSIssue,
  ThirdPartyIssue,
  LongTask,
  RenderBlockingResource,
  DetailedInsights,
  PerformanceResult,
} from "./analysis";

// Context Domain - Project detection
export type {
  FrameworkInfo,
  ProjectContext,
  FrameworkSpecificNote,
} from "./context";

// Report Domain - Actionable reports
export type {
  KeyOpportunity,
  ActionStep,
  NextStep,
  ActionableReport,
} from "./report";

// CLI Domain - Command-line interface
export type { CLIOptions, ThresholdViolation, CLIResult } from "./cli";

// Config Domain - Thresholds and configuration
export type {
  PerformanceThresholds,
  ProjectConfig,
  ToolkitConfig,
} from "./config";

// Bundle Domain - Bundle analysis
export type {
  BundleAnalyzerOptions,
  BundleAnalysisResult,
  BundleSummary,
  ChunkInfo,
  DependencyInfo,
} from "./bundle";
