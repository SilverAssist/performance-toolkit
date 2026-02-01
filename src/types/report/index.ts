/**
 * Report Types
 *
 * Types for actionable reports and recommendations
 *
 * @packageDocumentation
 */

import type { CoreWebVitals, CategoryScores } from "../metrics";
import type { EnhancedLCPElement, DiagnosticItem, LCPBreakdown } from "../analysis";
import type { ProjectContext, FrameworkSpecificNote } from "../context";
import type { PerformanceThresholds } from "../config";

// =============================================================================
// Report Structure Types
// =============================================================================

/**
 * Key opportunity for improvement (high-level summary)
 */
export interface KeyOpportunity {
  /** Opportunity identifier */
  id: string;
  /** Short title */
  title: string;
  /** Impact level */
  impact: "high" | "medium" | "low";
  /** Estimated time savings in ms */
  estimatedSavingsMs?: number;
  /** Estimated size savings in bytes */
  estimatedSavingsBytes?: number;
  /** Description of the opportunity */
  description: string;
  /** Affected metrics */
  affectsMetrics: Array<keyof CoreWebVitals>;
  /** Quick win (easy to implement) */
  isQuickWin: boolean;
}

/**
 * Concrete action step for implementation
 */
export interface ActionStep {
  /** Step number */
  order: number;
  /** Action description */
  action: string;
  /** Code snippet if applicable */
  codeSnippet?: string;
  /** Relevant file path */
  filePath?: string;
  /** Effort estimate */
  effort: "minimal" | "moderate" | "significant";
  /** Tool/command to use */
  tool?: string;
}

/**
 * Next step recommendation (prioritized)
 */
export interface NextStep {
  /** Priority rank (1 = highest) */
  priority: number;
  /** Which opportunity this relates to */
  opportunityId: string;
  /** Step title */
  title: string;
  /** Detailed instructions */
  instructions: string;
  /** Concrete action steps */
  actionSteps: ActionStep[];
  /** Expected outcome */
  expectedOutcome: string;
  /** Metric improvements expected */
  expectedImprovements: Partial<Record<keyof CoreWebVitals, string>>;
  /** Framework-specific notes */
  frameworkNotes?: FrameworkSpecificNote[];
}

// =============================================================================
// Main Report Type
// =============================================================================

/**
 * Complete actionable report for AI assistants and developers
 */
export interface ActionableReport {
  /** Report metadata */
  meta: {
    /** Report generation timestamp */
    generatedAt: string;
    /** Toolkit version used */
    toolkitVersion: string;
    /** Analyzed URL */
    url: string;
    /** Strategy (mobile/desktop) */
    strategy: "mobile" | "desktop";
    /** Overall health status */
    healthStatus: "healthy" | "needs-work" | "poor";
  };

  /** Executive summary for quick overview */
  summary: {
    /** One-line verdict */
    headline: string;
    /** Key findings (2-4 bullets) */
    keyFindings: string[];
    /** Primary bottleneck identified */
    primaryBottleneck?: string;
    /** Estimated total improvement possible */
    estimatedTotalImprovementMs?: number;
  };

  /** Current performance state */
  currentState: {
    /** Category scores */
    scores: CategoryScores;
    /** Core Web Vitals with status */
    metrics: CoreWebVitals;
    /** How metrics compare to thresholds */
    thresholdComparison: {
      thresholds: PerformanceThresholds;
      violations: Array<{
        metric: string;
        current: number;
        threshold: number;
        severity: "critical" | "warning";
      }>;
    };
  };

  /** LCP deep-dive section */
  lcpAnalysis?: {
    /** Enhanced LCP element info */
    element: EnhancedLCPElement;
    /** Timing breakdown */
    breakdown: LCPBreakdown;
    /** Critical path issues */
    criticalPathIssues: string[];
    /** Quick wins specific to LCP */
    quickWins: string[];
  };

  /** Prioritized opportunities */
  opportunities: KeyOpportunity[];

  /** Detailed diagnostics */
  diagnostics: DiagnosticItem[];

  /** Prioritized next steps */
  nextSteps: NextStep[];

  /** Project context used for recommendations */
  context?: ProjectContext;

  /** Raw data references (for tools that need more detail) */
  rawDataRefs?: {
    /** Full API response available */
    hasFullResponse: boolean;
    /** Detailed insights available */
    hasDetailedInsights: boolean;
  };
}
