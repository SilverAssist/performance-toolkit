/**
 * @silverassist/performance-toolkit
 *
 * PageSpeed Insights API v5 type definitions.
 *
 * @module types/pagespeed
 * @author Miguel Colmenares <me@miguelcolmenares.com>
 * @license PolyForm-Noncommercial-1.0.0
 */

// =============================================================================
// Strategy & Category Types
// =============================================================================

/**
 * PageSpeed analysis strategy
 */
export type Strategy = "mobile" | "desktop";

/**
 * PageSpeed analysis category
 */
export type Category =
  | "performance"
  | "accessibility"
  | "best-practices"
  | "seo";

// =============================================================================
// Request Types
// =============================================================================

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

// =============================================================================
// Response Types
// =============================================================================

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

// =============================================================================
// CrUX (Chrome UX Report) Types
// =============================================================================

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

// =============================================================================
// Lighthouse Result Types (from PSI API)
// =============================================================================

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
  scoreDisplayMode:
    | "numeric"
    | "binary"
    | "informative"
    | "notApplicable"
    | "manual"
    | "error";
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
