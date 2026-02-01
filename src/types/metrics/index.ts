/**
 * Core Web Vitals & Metrics Types
 *
 * Fundamental metric types used across the toolkit
 *
 * @packageDocumentation
 */

// =============================================================================
// Metric Value Types
// =============================================================================

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

/**
 * Performance rating type
 */
export type MetricRating = "good" | "needs-improvement" | "poor";

// =============================================================================
// Core Web Vitals
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

// =============================================================================
// Category Scores
// =============================================================================

/**
 * Category scores from 0 to 100
 */
export interface CategoryScores {
  performance: number | null;
  accessibility: number | null;
  bestPractices: number | null;
  seo: number | null;
}
