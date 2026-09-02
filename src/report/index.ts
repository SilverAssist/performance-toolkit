/**
 * @silverassist/performance-toolkit
 *
 * Report module - actionable report generation with framework-aware recommendations.
 *
 * @packageDocumentation
 */

// Main generator class
export {
  ActionableReportGenerator,
  createReportGenerator,
  generateActionableReport,
} from "./generator";

// Diagnostics table generation
export { generateDiagnosticsTable } from "./diagnostics";

// LCP analysis and recommendations
export {
  detectLCPType,
  detectLoadingMechanism,
  generateLCPRecommendations,
  generateEnhancedLCP,
} from "./lcp";

// Key opportunities generation
export {
  generateKeyOpportunities,
  createLCPOpportunity,
  createJavaScriptOpportunity,
  createImageOpportunity,
  createThirdPartyOpportunity,
  createRenderBlockingOpportunity,
  createCLSOpportunity,
} from "./opportunities";

// Utility functions
export {
  formatBytes,
  truncateUrl,
  calculateScore,
  getSeverityByBytes,
  getSeverityByTime,
} from "./utils";
