/**
 * @silverassist/performance-toolkit - Types
 *
 * Type definitions for PageSpeed Insights API and Lighthouse CI integration
 *
 * @packageDocumentation
 */

// =============================================================================
// Core Web Vitals Types
// =============================================================================

/**
 * Core Web Vitals metrics with values and ratings
 */
export interface CoreWebVitals {
  /** Largest Contentful Paint in milliseconds */
  lcp: MetricValue;
  /** First Contentful Paint in milliseconds */
  fcp: MetricValue;
  /** Cumulative Layout Shift (unitless) */
  cls: MetricValue;
  /** Total Blocking Time in milliseconds */
  tbt: MetricValue;
  /** Speed Index in milliseconds */
  si: MetricValue;
  /** Time to Interactive in milliseconds */
  tti: MetricValue;
}

/**
 * Metric value with numeric value and performance rating
 */
export interface MetricValue {
  /** Numeric value of the metric */
  value: number;
  /** Display value with units (e.g., "2.5 s", "0.1") */
  displayValue: string;
  /** Performance rating */
  rating: "good" | "needs-improvement" | "poor";
}

// =============================================================================
// PageSpeed Insights API Types
// =============================================================================

/**
 * PageSpeed analysis strategy
 */
export type Strategy = "mobile" | "desktop";

/**
 * PageSpeed analysis category
 */
export type Category = "performance" | "accessibility" | "best-practices" | "seo";

/**
 * Options for PageSpeed Insights API request
 */
export interface PageSpeedOptions {
  /** URL to analyze */
  url: string;
  /** Analysis strategy */
  strategy?: Strategy;
  /** Categories to analyze */
  categories?: Category[];
  /** API key for higher rate limits */
  apiKey?: string;
  /** Request timeout in milliseconds */
  timeout?: number;
}

/**
 * PageSpeed Insights API response (simplified)
 */
export interface PageSpeedResponse {
  /** Unique identifier for this analysis */
  id: string;
  /** Loading experience data (CrUX real-world data) */
  loadingExperience: LoadingExperience;
  /** Origin loading experience (aggregate for domain) */
  originLoadingExperience?: LoadingExperience;
  /** Lighthouse lab results */
  lighthouseResult: LighthouseResult;
  /** Analysis timestamp */
  analysisUTCTimestamp: string;
}

/**
 * Chrome UX Report (CrUX) loading experience data
 */
export interface LoadingExperience {
  /** Initial URL analyzed */
  initial_url: string;
  /** Overall performance category */
  overall_category: "FAST" | "AVERAGE" | "SLOW";
  /** Metrics data */
  metrics: Record<string, CrUXMetric>;
}

/**
 * CrUX metric with percentile and distribution
 */
export interface CrUXMetric {
  /** Percentile value */
  percentile: number;
  /** Distribution across good/needs-improvement/poor */
  distributions: Array<{
    min: number;
    max?: number;
    proportion: number;
  }>;
  /** Category for this metric */
  category: "FAST" | "AVERAGE" | "SLOW";
}

/**
 * Lighthouse result from PageSpeed API
 */
export interface LighthouseResult {
  /** Lighthouse version */
  lighthouseVersion: string;
  /** Requested URL */
  requestedUrl: string;
  /** Final URL after redirects */
  finalUrl: string;
  /** Fetch time */
  fetchTime: string;
  /** Category scores */
  categories: LighthouseCategories;
  /** Audit results */
  audits: Record<string, LighthouseAudit>;
}

/**
 * Lighthouse category scores
 */
export interface LighthouseCategories {
  performance?: LighthouseCategory;
  accessibility?: LighthouseCategory;
  "best-practices"?: LighthouseCategory;
  seo?: LighthouseCategory;
}

/**
 * Single Lighthouse category
 */
export interface LighthouseCategory {
  /** Category ID */
  id: string;
  /** Category title */
  title: string;
  /** Score from 0 to 1 */
  score: number | null;
  /** Audit references */
  auditRefs: Array<{ id: string; weight: number }>;
}

/**
 * Individual Lighthouse audit result
 */
export interface LighthouseAudit {
  /** Audit ID */
  id: string;
  /** Audit title */
  title: string;
  /** Description of what this audit measures */
  description: string;
  /** Score from 0 to 1, or null if not applicable */
  score: number | null;
  /** Score display mode */
  scoreDisplayMode: "numeric" | "binary" | "informative" | "notApplicable" | "manual" | "error";
  /** Display value (e.g., "2.5 s") */
  displayValue?: string;
  /** Numeric value */
  numericValue?: number;
  /** Numeric unit */
  numericUnit?: string;
  /** Additional details */
  details?: AuditDetails;
}

/**
 * Audit details (varies by audit type)
 */
export interface AuditDetails {
  /** Detail type */
  type: string;
  /** Table headings */
  headings?: Array<{ key: string; label: string }>;
  /** Table items */
  items?: Array<Record<string, unknown>>;
  /** Overall savings in ms */
  overallSavingsMs?: number;
  /** Overall savings in bytes */
  overallSavingsBytes?: number;
}

// =============================================================================
// LCP Element Types
// =============================================================================

/**
 * Information about the Largest Contentful Paint element
 */
export interface LCPElement {
  /** Element tag name (e.g., "IMG", "DIV") */
  tagName: string;
  /** Element selector path */
  selector: string;
  /** Element URL (for images) */
  url?: string;
  /** Element size in bytes */
  size?: number;
  /** Node path for identification */
  nodePath?: string;
  /** HTML snippet of the element */
  snippet?: string;
}

/**
 * LCP timing breakdown for understanding delays
 */
export interface LCPBreakdown {
  /** Time to First Byte in ms */
  ttfb: number;
  /** Resource load delay in ms (time before resource starts loading) */
  resourceLoadDelay: number;
  /** Resource load duration in ms */
  resourceLoadDuration: number;
  /** Element render delay in ms (time after load before render) */
  elementRenderDelay: number;
  /** Total LCP time in ms */
  total: number;
}

// =============================================================================
// Detailed Insights Types (for actionable recommendations)
// =============================================================================

/**
 * Cache issue for a specific resource
 */
export interface CacheIssue {
  /** Resource URL */
  url: string;
  /** Cache TTL in seconds (0 = no cache) */
  cacheTTL: number;
  /** Cache TTL as display string */
  cacheTTLDisplay: string;
  /** Transfer size in bytes */
  transferSize: number;
  /** Potential savings in bytes */
  wastedBytes: number;
  /** Resource type/category */
  resourceType?: string;
  /** Third-party entity name if applicable */
  entity?: string;
}

/**
 * Image optimization issue
 */
export interface ImageIssue {
  /** Image URL */
  url: string;
  /** Current file size in bytes */
  totalBytes: number;
  /** Potential savings in bytes */
  wastedBytes: number;
  /** Current dimensions */
  actualDimensions?: { width: number; height: number };
  /** Displayed dimensions on page */
  displayedDimensions?: { width: number; height: number };
  /** HTML snippet */
  snippet?: string;
  /** Issue type */
  issueType: "oversized" | "format" | "offscreen" | "unoptimized";
  /** Recommended action */
  recommendation: string;
}

/**
 * Unused code (JS/CSS) issue
 */
export interface UnusedCodeIssue {
  /** Script/stylesheet URL */
  url: string;
  /** Total transfer size in bytes */
  transferSize: number;
  /** Unused bytes that could be removed */
  wastedBytes: number;
  /** Percentage of code that is unused */
  wastedPercent: number;
  /** Entity/third-party name */
  entity?: string;
  /** Whether this is first-party code */
  isFirstParty: boolean;
}

/**
 * Legacy JavaScript polyfill issue
 */
export interface LegacyJSIssue {
  /** Script URL */
  url: string;
  /** Wasted bytes from polyfills */
  wastedBytes: number;
  /** List of unnecessary polyfills/transforms */
  polyfills: string[];
  /** Entity name */
  entity?: string;
}

/**
 * Third-party script impact
 */
export interface ThirdPartyIssue {
  /** Third-party entity name */
  entity: string;
  /** Main thread blocking time in ms */
  blockingTime: number;
  /** Transfer size in bytes */
  transferSize: number;
  /** Number of requests */
  requestCount: number;
  /** URLs from this third-party */
  urls: string[];
  /** Category (analytics, social, ads, etc.) */
  category?: string;
}

/**
 * Long task on main thread
 */
export interface LongTask {
  /** Task duration in ms */
  duration: number;
  /** Start time in ms */
  startTime: number;
  /** Script URL causing the task */
  url?: string;
  /** Attribution/source */
  attribution?: string;
}

/**
 * Render-blocking resource
 */
export interface RenderBlockingResource {
  /** Resource URL */
  url: string;
  /** Transfer size in bytes */
  transferSize: number;
  /** Potential time savings in ms */
  wastedMs: number;
  /** Resource type (script, stylesheet) */
  resourceType: "script" | "stylesheet" | "other";
}

/**
 * All detailed insights for actionable improvements
 */
export interface DetailedInsights {
  /** LCP timing breakdown */
  lcpBreakdown?: LCPBreakdown;
  /** Resources with poor cache policies */
  cacheIssues: CacheIssue[];
  /** Images that need optimization */
  imageIssues: ImageIssue[];
  /** Unused JavaScript */
  unusedJavaScript: UnusedCodeIssue[];
  /** Unused CSS */
  unusedCSS: UnusedCodeIssue[];
  /** Legacy JavaScript with polyfills */
  legacyJavaScript: LegacyJSIssue[];
  /** Third-party script impact */
  thirdParties: ThirdPartyIssue[];
  /** Long tasks blocking main thread */
  longTasks: LongTask[];
  /** Render-blocking resources */
  renderBlocking: RenderBlockingResource[];
  /** Total estimated savings */
  totalSavings: {
    /** Time savings in ms */
    timeMs: number;
    /** Size savings in bytes */
    sizeBytes: number;
  };
}

// =============================================================================
// Opportunity & Diagnostic Types
// =============================================================================

/**
 * Performance improvement opportunity
 */
export interface Opportunity {
  /** Audit ID */
  id: string;
  /** Human-readable title */
  title: string;
  /** Detailed description */
  description: string;
  /** Potential time savings in milliseconds */
  savingsMs?: number;
  /** Potential size savings in bytes */
  savingsBytes?: number;
  /** Score from 0 to 1 */
  score: number | null;
  /** Affected items */
  items?: Array<Record<string, unknown>>;
}

/**
 * Performance diagnostic information
 */
export interface Diagnostic {
  /** Audit ID */
  id: string;
  /** Human-readable title */
  title: string;
  /** Detailed description */
  description: string;
  /** Display value */
  displayValue?: string;
  /** Score from 0 to 1 */
  score: number | null;
  /** Diagnostic details */
  details?: AuditDetails;
}

// =============================================================================
// Analysis Result Types
// =============================================================================

/**
 * Complete performance analysis result
 */
export interface PerformanceResult {
  /** Analyzed URL */
  url: string;
  /** Analysis strategy used */
  strategy: Strategy;
  /** Analysis timestamp */
  timestamp: string;
  /** Category scores (0-100) */
  scores: CategoryScores;
  /** Core Web Vitals metrics */
  metrics: CoreWebVitals;
  /** LCP element information */
  lcpElement?: LCPElement;
  /** Performance improvement opportunities */
  opportunities: Opportunity[];
  /** Diagnostic information */
  diagnostics: Diagnostic[];
  /** Detailed insights for actionable improvements (AI-friendly) */
  insights?: DetailedInsights;
  /** CrUX real-world data (if available) */
  fieldData?: LoadingExperience;
  /** Raw API response (for debugging) */
  rawResponse?: PageSpeedResponse;
}

/**
 * Category scores from 0 to 100
 */
export interface CategoryScores {
  performance: number | null;
  accessibility: number | null;
  bestPractices: number | null;
  seo: number | null;
}

// =============================================================================
// Lighthouse CI Types
// =============================================================================

/**
 * Lighthouse CI execution method
 */
export type LHCIMethod = "node" | "psi";

/**
 * Lighthouse CI configuration options
 */
export interface LHCIOptions {
  /** URLs to analyze */
  urls: string[];
  /** Execution method */
  method?: LHCIMethod;
  /** Number of runs per URL */
  numberOfRuns?: number;
  /** PSI API key (required for 'psi' method) */
  psiApiKey?: string;
  /** PSI strategy (for 'psi' method) */
  psiStrategy?: Strategy;
  /** Chrome flags (for 'node' method) */
  chromeFlags?: string[];
  /** Lighthouse config path */
  configPath?: string;
  /** Output directory for reports */
  outputDir?: string;
}

/**
 * Lighthouse CI assertion configuration
 */
export interface LHCIAssertions {
  /** Minimum performance score (0-1) */
  "categories:performance"?: ["error" | "warn", { minScore: number }];
  /** Minimum accessibility score (0-1) */
  "categories:accessibility"?: ["error" | "warn", { minScore: number }];
  /** Minimum best practices score (0-1) */
  "categories:best-practices"?: ["error" | "warn", { minScore: number }];
  /** Minimum SEO score (0-1) */
  "categories:seo"?: ["error" | "warn", { minScore: number }];
  /** Maximum LCP in milliseconds */
  "largest-contentful-paint"?: ["error" | "warn", { maxNumericValue: number }];
  /** Maximum FCP in milliseconds */
  "first-contentful-paint"?: ["error" | "warn", { maxNumericValue: number }];
  /** Maximum CLS */
  "cumulative-layout-shift"?: ["error" | "warn", { maxNumericValue: number }];
  /** Maximum TBT in milliseconds */
  "total-blocking-time"?: ["error" | "warn", { maxNumericValue: number }];
}

/**
 * Lighthouse CI full configuration
 */
export interface LHCIConfig {
  ci: {
    collect: {
      url: string[];
      method?: LHCIMethod;
      numberOfRuns?: number;
      psiApiKey?: string;
      psiStrategy?: Strategy;
      settings?: {
        chromeFlags?: string[];
        preset?: "desktop" | "mobile";
      };
    };
    assert?: {
      assertions: LHCIAssertions;
    };
    upload?: {
      target: "temporary-public-storage" | "lhci" | "filesystem";
      serverBaseUrl?: string;
      token?: string;
      outputDir?: string;
    };
  };
}

// =============================================================================
// Thresholds & Configuration Types
// =============================================================================

/**
 * Performance thresholds for pass/fail determination
 */
export interface PerformanceThresholds {
  /** Minimum performance score (0-100) */
  performance?: number;
  /** Minimum accessibility score (0-100) */
  accessibility?: number;
  /** Minimum best practices score (0-100) */
  bestPractices?: number;
  /** Minimum SEO score (0-100) */
  seo?: number;
  /** Maximum LCP in milliseconds */
  lcp?: number;
  /** Maximum FCP in milliseconds */
  fcp?: number;
  /** Maximum CLS */
  cls?: number;
  /** Maximum TBT in milliseconds */
  tbt?: number;
}

/**
 * Project configuration for performance monitoring
 */
export interface ProjectConfig {
  /** Project name identifier */
  name: string;
  /** Base URL for the project */
  baseUrl: string;
  /** URLs to monitor (relative to baseUrl) */
  urls: string[];
  /** Default analysis strategy */
  strategy?: Strategy;
  /** Performance thresholds */
  thresholds?: PerformanceThresholds;
  /** PageSpeed API key */
  apiKey?: string;
  /** Environment-specific overrides */
  environments?: Record<string, Partial<ProjectConfig>>;
}

/**
 * Multi-project configuration
 */
export interface ToolkitConfig {
  /** Project configurations */
  projects: ProjectConfig[];
  /** Global defaults */
  defaults?: {
    strategy?: Strategy;
    thresholds?: PerformanceThresholds;
    timeout?: number;
  };
}

// =============================================================================
// CLI Types
// =============================================================================

/**
 * CLI command options
 */
export interface CLIOptions {
  /** Target URL or config file */
  target?: string;
  /** Analysis strategy */
  strategy?: Strategy;
  /** Output format */
  format?: "json" | "table" | "summary";
  /** Output file path */
  output?: string;
  /** Verbose logging */
  verbose?: boolean;
  /** Compare with baseline */
  baseline?: string;
  /** CI mode (exit with error code on failure) */
  ci?: boolean;
  /** Configuration file path */
  config?: string;
}

/**
 * CLI check result
 */
export interface CLIResult {
  /** Whether all checks passed */
  success: boolean;
  /** Result summary message */
  message: string;
  /** Detailed results */
  results: PerformanceResult[];
  /** Threshold violations */
  violations?: ThresholdViolation[];
  /** Exit code for CI */
  exitCode: number;
}

/**
 * Threshold violation details
 */
export interface ThresholdViolation {
  /** Metric name */
  metric: string;
  /** Actual value */
  actual: number;
  /** Threshold value */
  threshold: number;
  /** Violation severity */
  severity: "error" | "warn";
  /** URL where violation occurred */
  url: string;
}
