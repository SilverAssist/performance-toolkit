/**
 * @silverassist/performance-toolkit
 *
 * Analysis and diagnostics type definitions.
 *
 * @module types/analysis
 * @author Miguel Colmenares <me@miguelcolmenares.com>
 * @license PolyForm-Noncommercial-1.0.0
 */

import type { CoreWebVitals, CategoryScores } from "../metrics";
import type {
  Strategy,
  LoadingExperience,
  PageSpeedResponse,
  AuditDetails,
} from "../pagespeed";

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

/**
 * Enhanced LCP Element information with optimization hints
 */
export interface EnhancedLCPElement extends LCPElement {
  /** Element type classification */
  type: "image" | "text" | "video" | "background-image" | "unknown";
  /** Loading mechanism detected */
  loadingMechanism?: "eager" | "lazy" | "priority" | "deferred" | "unknown";
  /** Whether element is above-the-fold */
  isAboveTheFold: boolean;
  /** Optimization recommendations specific to this element */
  recommendations: LCPRecommendation[];
  /** Resource timing if available */
  timing?: {
    /** Time when resource request started */
    requestStart?: number;
    /** Time when resource finished loading */
    loadEnd?: number;
    /** Render time */
    renderTime?: number;
  };
  /** Image-specific details */
  imageDetails?: {
    /** Format (jpeg, png, webp, avif) */
    format?: string;
    /** Natural dimensions */
    naturalDimensions?: { width: number; height: number };
    /** Displayed dimensions */
    displayedDimensions?: { width: number; height: number };
    /** Is responsive (srcset used) */
    isResponsive?: boolean;
    /** Has priority hint */
    hasPriorityHint?: boolean;
  };
}

/**
 * LCP-specific recommendation
 */
export interface LCPRecommendation {
  /** Recommendation ID */
  id: string;
  /** Short title */
  title: string;
  /** Detailed description */
  description: string;
  /** Estimated impact (high, medium, low) */
  impact: "high" | "medium" | "low";
  /** Implementation effort */
  effort: "easy" | "moderate" | "complex";
  /** Related code/config changes */
  codeHints?: string[];
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

/**
 * Enhanced diagnostic item similar to PageSpeed Insights Diagnostics table
 */
export interface DiagnosticItem {
  /** Diagnostic identifier */
  id: string;
  /** Human-readable title */
  title: string;
  /** Display value (e.g., "429 KiB", "4 long tasks found") */
  displayValue: string;
  /** Detailed description with recommendations */
  description: string;
  /** Score (0-1, null if not applicable) */
  score: number | null;
  /** Severity level based on impact */
  severity: "critical" | "serious" | "moderate" | "minor";
  /** Estimated savings (if applicable) */
  savings?: {
    /** Time savings in milliseconds */
    timeMs?: number;
    /** Size savings in bytes */
    bytes?: number;
  };
  /** Items/resources affected */
  items?: DiagnosticDetailItem[];
  /** Category grouping */
  category: "performance" | "resource" | "network" | "javascript" | "rendering";
}

/**
 * Detailed item within a diagnostic
 */
export interface DiagnosticDetailItem {
  /** Resource URL */
  url?: string;
  /** Item label/identifier */
  label?: string;
  /** Transfer/total size */
  size?: number;
  /** Wasted size */
  wastedBytes?: number;
  /** Time impact */
  timeMs?: number;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
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
// Performance Result Types
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
