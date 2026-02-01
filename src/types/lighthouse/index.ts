/**
 * @silverassist/performance-toolkit
 *
 * Lighthouse CI type definitions.
 *
 * @module types/lighthouse
 * @author Miguel Colmenares <me@miguelcolmenares.com>
 * @license PolyForm-Noncommercial-1.0.0
 */

import type { Strategy } from "../pagespeed";

// =============================================================================
// Method & Configuration Types
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

// =============================================================================
// Assertion Types
// =============================================================================

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

// =============================================================================
// Full Configuration Types
// =============================================================================

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
