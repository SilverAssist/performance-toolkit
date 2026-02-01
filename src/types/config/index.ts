/**
 * @silverassist/performance-toolkit
 *
 * Configuration and threshold type definitions.
 *
 * @module types/config
 * @author Miguel Colmenares <me@miguelcolmenares.com>
 * @license PolyForm-Noncommercial-1.0.0
 */

import type { Strategy, Category } from "../pagespeed";
import type { LHCIAssertions } from "../lighthouse";

// =============================================================================
// Threshold Types
// =============================================================================

/**
 * Performance thresholds for pass/fail decisions
 */
export interface PerformanceThresholds {
  /** Minimum performance score (0-100) */
  performance?: number;
  /** Maximum LCP in milliseconds */
  lcp?: number;
  /** Maximum FCP in milliseconds */
  fcp?: number;
  /** Maximum CLS (unitless) */
  cls?: number;
  /** Maximum TBT in milliseconds */
  tbt?: number;
  /** Maximum TTI in milliseconds */
  tti?: number;
  /** Maximum SI (Speed Index) in milliseconds */
  si?: number;
  /** Minimum accessibility score (0-100) */
  accessibility?: number;
  /** Minimum best-practices score (0-100) */
  bestPractices?: number;
  /** Minimum SEO score (0-100) */
  seo?: number;
}

// =============================================================================
// Project Configuration Types
// =============================================================================

/**
 * Project-level performance configuration
 */
export interface ProjectConfig {
  /** URLs to analyze */
  urls: string[];
  /** Default strategy */
  strategy: Strategy;
  /** Categories to analyze */
  categories: Category[];
  /** Thresholds for each URL pattern */
  thresholds: PerformanceThresholds;
  /** URL-specific threshold overrides */
  urlThresholds?: Record<string, Partial<PerformanceThresholds>>;
  /** CI/CD integration settings */
  ci?: {
    /** Fail build on threshold violation */
    failOnViolation: boolean;
    /** Comment on PR */
    commentOnPR: boolean;
    /** Upload to dashboard */
    uploadToDashboard: boolean;
  };
}

// =============================================================================
// Toolkit Configuration Types
// =============================================================================

/**
 * Complete toolkit configuration
 */
export interface ToolkitConfig {
  /** Google PageSpeed API key */
  apiKey?: string;
  /** Default strategy */
  defaultStrategy: Strategy;
  /** Default categories */
  defaultCategories: Category[];
  /** Default thresholds */
  defaultThresholds: PerformanceThresholds;
  /** LHCI assertions config */
  assertions?: LHCIAssertions;
  /** Enable detailed insights extraction */
  extractInsights: boolean;
  /** Cache settings */
  cache?: {
    /** Enable caching */
    enabled: boolean;
    /** Cache TTL in seconds */
    ttl: number;
    /** Cache directory */
    directory?: string;
  };
  /** Retry settings */
  retry?: {
    /** Max retry attempts */
    maxAttempts: number;
    /** Initial delay in ms */
    initialDelay: number;
    /** Backoff multiplier */
    backoffMultiplier: number;
  };
}
