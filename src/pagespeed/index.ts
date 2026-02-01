/**
 * @silverassist/performance-toolkit
 *
 * PageSpeed module - API client and utilities for PageSpeed Insights.
 *
 * @module pagespeed
 * @author Miguel Colmenares <me@miguelcolmenares.com>
 * @license PolyForm-Noncommercial-1.0.0
 */

// Main client
export { PageSpeedClient, createPageSpeedClient, analyzeUrl } from "./client";

// Extractors (for advanced usage)
export {
  extractScores,
  extractMetrics,
  extractMetricValue,
  extractLCPElement,
  extractOpportunities,
  extractDiagnostics,
} from "./extractors";

// Detailed insights extractors
export {
  extractDetailedInsights,
  extractCacheIssues,
  extractImageIssues,
  extractUnusedCode,
  extractLegacyJavaScript,
  extractThirdParties,
  extractLongTasks,
  extractRenderBlockingResources,
  extractLCPBreakdown,
} from "./insights";

// Utilities
export {
  formatCacheTTL,
  extractEntityFromUrl,
  categorizeThirdParty,
  isFirstParty,
  getHostDomain,
} from "./utils";

// Constants
export {
  PSI_API_URL,
  DEFAULT_TIMEOUT,
  DEFAULT_CATEGORIES,
  OPPORTUNITY_AUDITS,
  DIAGNOSTIC_AUDITS,
  THIRD_PARTY_PATTERNS,
} from "./constants";
