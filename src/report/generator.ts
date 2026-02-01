/**
 * @silverassist/performance-toolkit
 *
 * Main report generator orchestrating report generation.
 *
 * @module report/generator
 * @author Miguel Colmenares <me@miguelcolmenares.com>
 * @license PolyForm-Noncommercial-1.0.0
 */

import type {
  ActionableReport,
  DiagnosticItem,
  KeyOpportunity,
  NextStep,
  PerformanceResult,
  ProjectContext,
} from "../types";
import { generateDiagnosticsTable } from "./diagnostics";
import { generateEnhancedLCP } from "./lcp";
import { generateKeyOpportunities } from "./opportunities";

/**
 * Generates actionable performance reports with framework-specific recommendations
 */
export class ActionableReportGenerator {
  private result: PerformanceResult;
  private context: ProjectContext | null;

  constructor(result: PerformanceResult, context?: ProjectContext | null) {
    this.result = result;
    this.context = context ?? null;
  }

  /**
   * Generates a complete actionable report
   */
  generate(): ActionableReport {
    const diagnosticsTable = generateDiagnosticsTable(this.result);
    const enhancedLCP = generateEnhancedLCP(this.result, this.context);
    const keyOpportunities = generateKeyOpportunities(
      this.result,
      this.context,
    );
    const nextSteps = this.generateNextSteps(keyOpportunities);
    const summary = this.generateSummary(diagnosticsTable, keyOpportunities);

    return {
      performanceResult: this.result,
      projectContext: this.context ?? undefined,
      enhancedLCP,
      diagnosticsTable,
      keyOpportunities,
      nextSteps,
      summary,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Generates recommended next steps
   */
  private generateNextSteps(opportunities: KeyOpportunity[]): NextStep[] {
    const steps: NextStep[] = [];
    const topOpportunities = opportunities.slice(0, 3);

    // Immediate actions from top opportunities
    for (const opp of topOpportunities) {
      if (opp.impact.level === "critical" || opp.impact.level === "high") {
        steps.push({
          id: `next-${opp.id}`,
          title: opp.steps[0]?.title ?? opp.title,
          description: `Start with the first step of "${opp.title}" - this has ${opp.impact.level} impact.`,
          type: "code-change",
          urgency: opp.impact.level === "critical" ? "immediate" : "soon",
          relatedOpportunities: [opp.id],
        });
      }
    }

    // Add monitoring step
    steps.push({
      id: "next-setup-monitoring",
      title: "Set up continuous performance monitoring",
      description:
        "Use this toolkit in your CI/CD pipeline to catch regressions early.",
      type: "monitoring",
      urgency: "when-possible",
    });

    // Add testing step
    if (this.result.scores.performance && this.result.scores.performance < 90) {
      steps.push({
        id: "next-perf-testing",
        title: "Add performance tests to CI pipeline",
        description:
          "Create performance budgets and fail builds that exceed thresholds.",
        type: "testing",
        urgency: "soon",
      });
    }

    return steps.slice(0, 5);
  }

  /**
   * Generates executive summary
   */
  private generateSummary(
    diagnostics: DiagnosticItem[],
    opportunities: KeyOpportunity[],
  ): ActionableReport["summary"] {
    const { scores, insights } = this.result;

    // Determine health status
    let healthStatus: ActionableReport["summary"]["healthStatus"];
    if ((scores.performance ?? 0) >= 90) {
      healthStatus = "healthy";
    } else if ((scores.performance ?? 0) >= 50) {
      healthStatus = "needs-attention";
    } else {
      healthStatus = "critical";
    }

    // Count quick wins (easy effort, high/medium impact)
    const quickWins = opportunities.filter((o) =>
      o.steps.some((s) => s.estimatedTime?.includes("minute") || s.codeExample),
    ).length;

    // Calculate total potential savings
    const timeMs =
      insights?.totalSavings?.timeMs ??
      diagnostics.reduce((sum, d) => sum + (d.savings?.timeMs ?? 0), 0);
    const sizeBytes =
      insights?.totalSavings?.sizeBytes ??
      diagnostics.reduce((sum, d) => sum + (d.savings?.bytes ?? 0), 0);

    // Get top 3 priorities
    const topPriorities = opportunities.slice(0, 3).map((o) => o.title);

    return {
      healthStatus,
      quickWinsCount: quickWins,
      potentialSavings: {
        timeMs: Math.round(timeMs),
        sizeBytes: Math.round(sizeBytes),
      },
      topPriorities,
    };
  }
}

/**
 * Creates an actionable report generator
 */
export function createReportGenerator(
  result: PerformanceResult,
  context?: ProjectContext | null,
): ActionableReportGenerator {
  return new ActionableReportGenerator(result, context);
}

/**
 * Quick function to generate an actionable report
 */
export function generateActionableReport(
  result: PerformanceResult,
  context?: ProjectContext | null,
): ActionableReport {
  const generator = new ActionableReportGenerator(result, context);
  return generator.generate();
}
