/**
 * @silverassist/performance-toolkit
 *
 * Actionable report and recommendation type definitions.
 *
 * @module types/report
 * @author Miguel Colmenares <me@miguelcolmenares.com>
 * @license PolyForm-Noncommercial-1.0.0
 */

import type {
  EnhancedLCPElement,
  DiagnosticItem,
  PerformanceResult,
} from "../analysis";
import type { ProjectContext, FrameworkSpecificNote } from "../context";

// =============================================================================
// Report Structure Types
// =============================================================================

/**
 * Key opportunity for performance improvement
 */
export interface KeyOpportunity {
  /** Unique identifier */
  id: string;
  /** Priority ranking (1 = highest priority) */
  priority: number;
  /** Opportunity title */
  title: string;
  /** Detailed description */
  description: string;
  /** Estimated performance impact */
  impact: {
    /** Impact level */
    level: "critical" | "high" | "medium" | "low";
    /** Estimated LCP improvement in ms */
    lcpImprovementMs?: number;
    /** Estimated performance score improvement */
    scoreImprovement?: number;
    /** Size savings in bytes */
    sizeSavings?: number;
  };
  /** Implementation steps */
  steps: ActionStep[];
  /** Related diagnostics/audits */
  relatedAudits: string[];
  /** Framework-specific implementation notes */
  frameworkNotes?: FrameworkSpecificNote[];
  /** Resources/documentation links */
  resources?: { title: string; url: string }[];
}

/**
 * Action step for implementing an opportunity
 */
export interface ActionStep {
  /** Step number */
  order: number;
  /** Step title */
  title: string;
  /** Detailed instructions */
  instructions: string;
  /** Code example if applicable */
  codeExample?: {
    /** Programming language */
    language: string;
    /** Code snippet */
    code: string;
    /** File path hint */
    filePath?: string;
  };
  /** Estimated time to implement */
  estimatedTime?: string;
}

/**
 * Next step recommendation after analysis
 */
export interface NextStep {
  /** Step identifier */
  id: string;
  /** Step title */
  title: string;
  /** Description */
  description: string;
  /** Type of action */
  type:
    | "code-change"
    | "config-change"
    | "investigation"
    | "monitoring"
    | "testing";
  /** Urgency level */
  urgency: "immediate" | "soon" | "when-possible";
  /** Files likely to be modified */
  affectedFiles?: string[];
  /** Related opportunity IDs */
  relatedOpportunities?: string[];
}

// =============================================================================
// Main Report Type
// =============================================================================

/**
 * Complete actionable performance report
 */
export interface ActionableReport {
  /** Original performance result */
  performanceResult: PerformanceResult;
  /** Detected project context (if available) */
  projectContext?: ProjectContext;
  /** Enhanced LCP element information */
  enhancedLCP?: EnhancedLCPElement;
  /** Enhanced diagnostics table */
  diagnosticsTable: DiagnosticItem[];
  /** Key opportunities ranked by impact */
  keyOpportunities: KeyOpportunity[];
  /** Recommended next steps */
  nextSteps: NextStep[];
  /** Executive summary */
  summary: {
    /** Overall health status */
    healthStatus: "healthy" | "needs-attention" | "critical";
    /** Quick wins available */
    quickWinsCount: number;
    /** Total potential savings */
    potentialSavings: {
      timeMs: number;
      sizeBytes: number;
    };
    /** Top 3 priorities */
    topPriorities: string[];
  };
  /** Timestamp of report generation */
  generatedAt: string;
}
