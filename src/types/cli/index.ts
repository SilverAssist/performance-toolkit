/**
 * CLI Types
 *
 * Types for command-line interface options and results
 *
 * @packageDocumentation
 */

import type { Strategy, Category } from "../pagespeed";
import type { PerformanceThresholds } from "../config";

// =============================================================================
// CLI Options Types
// =============================================================================

/**
 * CLI command options
 */
export interface CLIOptions {
  /** URL to analyze */
  url: string;
  /** Analysis strategy */
  strategy: Strategy;
  /** Categories to analyze */
  categories: Category[];
  /** Performance thresholds for pass/fail */
  thresholds: PerformanceThresholds;
  /** Output format */
  format: "json" | "text" | "html";
  /** Output file path */
  output?: string;
  /** Verbose output */
  verbose: boolean;
  /** Include detailed insights */
  includeInsights: boolean;
  /** Include raw API response */
  includeRaw: boolean;
}

// =============================================================================
// CLI Result Types
// =============================================================================

/**
 * Threshold violation details
 */
export interface ThresholdViolation {
  /** Metric name */
  metric: string;
  /** Current value */
  current: number;
  /** Threshold value */
  threshold: number;
  /** How much over threshold */
  difference: number;
  /** Severity level */
  severity: "critical" | "warning";
  /** Human-readable message */
  message: string;
}

/**
 * CLI execution result
 */
export interface CLIResult {
  /** Whether analysis passed all thresholds */
  success: boolean;
  /** Exit code (0 = success, 1 = threshold violation, 2 = error) */
  exitCode: number;
  /** URL analyzed */
  url: string;
  /** Strategy used */
  strategy: Strategy;
  /** Performance score (0-100) */
  performanceScore: number;
  /** Any threshold violations */
  violations: ThresholdViolation[];
  /** Summary message */
  message: string;
  /** Execution duration in ms */
  duration: number;
  /** Timestamp */
  timestamp: string;
}
