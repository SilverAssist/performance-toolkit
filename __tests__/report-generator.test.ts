/**
 * Tests for Actionable Report Generator
 */

import {
  ActionableReportGenerator,
  createReportGenerator,
  generateActionableReport,
} from "../src/report/generator";
import type { PerformanceResult, ProjectContext } from "../src/types";

// Helper to create base PerformanceResult
function createBaseResult(
  overrides: Partial<PerformanceResult> = {}
): PerformanceResult {
  return {
    url: "https://example.com",
    strategy: "mobile",
    timestamp: "2026-01-30T10:00:00.000Z",
    scores: {
      performance: 85,
      accessibility: 90,
      bestPractices: 88,
      seo: 92,
    },
    metrics: {
      lcp: { value: 2500, displayValue: "2.5 s", rating: "good" },
      fcp: { value: 1200, displayValue: "1.2 s", rating: "good" },
      cls: { value: 0.05, displayValue: "0.05", rating: "good" },
      tbt: { value: 200, displayValue: "200 ms", rating: "good" },
      si: { value: 2000, displayValue: "2.0 s", rating: "good" },
      tti: { value: 3500, displayValue: "3.5 s", rating: "needs-improvement" },
    },
    opportunities: [],
    diagnostics: [],
    ...overrides,
  };
}

const nextJsContext: ProjectContext = {
  framework: {
    name: "next",
    version: "14.0.0",
    routerType: "app",
    renderingMode: "hybrid",
  },
  packageManager: "npm",
  isTypeScript: true,
  analytics: [],
  thirdPartyIntegrations: [],
  dependencies: { production: [], development: [], total: 0 },
};

describe("ActionableReportGenerator", () => {
  describe("constructor", () => {
    it("should create instance with performance result only", () => {
      const result = createBaseResult();
      const generator = new ActionableReportGenerator(result);
      expect(generator).toBeInstanceOf(ActionableReportGenerator);
    });

    it("should create instance with performance result and context", () => {
      const result = createBaseResult();
      const generator = new ActionableReportGenerator(result, nextJsContext);
      expect(generator).toBeInstanceOf(ActionableReportGenerator);
    });

    it("should handle null context", () => {
      const result = createBaseResult();
      const generator = new ActionableReportGenerator(result, null);
      expect(generator).toBeInstanceOf(ActionableReportGenerator);
    });
  });

  describe("generate", () => {
    it("should generate complete actionable report", () => {
      const result = createBaseResult();
      const generator = new ActionableReportGenerator(result);
      const report = generator.generate();

      expect(report.performanceResult).toBe(result);
      expect(report.diagnosticsTable).toBeDefined();
      expect(report.keyOpportunities).toBeDefined();
      expect(report.nextSteps).toBeDefined();
      expect(report.summary).toBeDefined();
      expect(report.generatedAt).toBeDefined();
    });

    it("should include project context when provided", () => {
      const result = createBaseResult();
      const generator = new ActionableReportGenerator(result, nextJsContext);
      const report = generator.generate();

      expect(report.projectContext).toBe(nextJsContext);
    });

    it("should not include project context when not provided", () => {
      const result = createBaseResult();
      const generator = new ActionableReportGenerator(result);
      const report = generator.generate();

      expect(report.projectContext).toBeUndefined();
    });

    it("should generate enhanced LCP when lcpElement exists", () => {
      const result = createBaseResult({
        lcpElement: {
          tagName: "IMG",
          selector: "img.hero",
          url: "https://example.com/hero.jpg",
        },
      });
      const generator = new ActionableReportGenerator(result);
      const report = generator.generate();

      expect(report.enhancedLCP).toBeDefined();
      expect(report.enhancedLCP?.type).toBe("image");
    });

    it("should not have enhanced LCP when lcpElement is missing", () => {
      const result = createBaseResult();
      const generator = new ActionableReportGenerator(result);
      const report = generator.generate();

      expect(report.enhancedLCP).toBeUndefined();
    });

    it("should generate ISO timestamp for generatedAt", () => {
      const result = createBaseResult();
      const generator = new ActionableReportGenerator(result);
      const report = generator.generate();

      const date = new Date(report.generatedAt);
      expect(date.toISOString()).toBe(report.generatedAt);
    });
  });

  describe("summary generation", () => {
    it("should have healthy status when performance >= 90", () => {
      const result = createBaseResult({
        scores: { performance: 95, accessibility: 90, bestPractices: 90, seo: 90 },
      });
      const generator = new ActionableReportGenerator(result);
      const report = generator.generate();

      expect(report.summary.healthStatus).toBe("healthy");
    });

    it("should have needs-attention status when performance 50-89", () => {
      const result = createBaseResult({
        scores: { performance: 75, accessibility: 90, bestPractices: 90, seo: 90 },
      });
      const generator = new ActionableReportGenerator(result);
      const report = generator.generate();

      expect(report.summary.healthStatus).toBe("needs-attention");
    });

    it("should have critical status when performance < 50", () => {
      const result = createBaseResult({
        scores: { performance: 35, accessibility: 90, bestPractices: 90, seo: 90 },
      });
      const generator = new ActionableReportGenerator(result);
      const report = generator.generate();

      expect(report.summary.healthStatus).toBe("critical");
    });

    it("should include top priorities from opportunities", () => {
      const result = createBaseResult({
        metrics: {
          lcp: { value: 4500, displayValue: "4.5 s", rating: "poor" },
          fcp: { value: 1200, displayValue: "1.2 s", rating: "good" },
          cls: { value: 0.3, displayValue: "0.3", rating: "poor" },
          tbt: { value: 200, displayValue: "200 ms", rating: "good" },
          si: { value: 2000, displayValue: "2.0 s", rating: "good" },
          tti: { value: 3500, displayValue: "3.5 s", rating: "needs-improvement" },
        },
      });
      const generator = new ActionableReportGenerator(result);
      const report = generator.generate();

      expect(report.summary.topPriorities.length).toBeGreaterThan(0);
      expect(report.summary.topPriorities.length).toBeLessThanOrEqual(3);
    });

    it("should calculate potential savings from diagnostics", () => {
      const result = createBaseResult({
        insights: {
          unusedJavaScript: [
            { url: "https://example.com/app.js", transferSize: 500000, wastedBytes: 200000, wastedPercent: 40, isFirstParty: true },
          ],
          unusedCSS: [],
          cacheIssues: [],
          imageIssues: [],
          legacyJavaScript: [],
          thirdParties: [],
          longTasks: [{ duration: 300, startTime: 1000 }],
          renderBlocking: [],
          totalSavings: { timeMs: 300, sizeBytes: 200000 },
        },
      });
      const generator = new ActionableReportGenerator(result);
      const report = generator.generate();

      expect(report.summary.potentialSavings.timeMs).toBeGreaterThanOrEqual(0);
      expect(report.summary.potentialSavings.sizeBytes).toBeGreaterThanOrEqual(0);
    });
  });

  describe("next steps generation", () => {
    it("should always include monitoring step", () => {
      const result = createBaseResult();
      const generator = new ActionableReportGenerator(result);
      const report = generator.generate();

      expect(report.nextSteps.some((s) => s.id === "next-setup-monitoring")).toBe(true);
    });

    it("should include performance testing step when performance < 90", () => {
      const result = createBaseResult({
        scores: { performance: 75, accessibility: 90, bestPractices: 90, seo: 90 },
      });
      const generator = new ActionableReportGenerator(result);
      const report = generator.generate();

      expect(report.nextSteps.some((s) => s.id === "next-perf-testing")).toBe(true);
    });

    it("should not include performance testing step when performance >= 90", () => {
      const result = createBaseResult({
        scores: { performance: 95, accessibility: 90, bestPractices: 90, seo: 90 },
      });
      const generator = new ActionableReportGenerator(result);
      const report = generator.generate();

      expect(report.nextSteps.some((s) => s.id === "next-perf-testing")).toBe(false);
    });

    it("should include steps from critical/high impact opportunities", () => {
      const result = createBaseResult({
        metrics: {
          lcp: { value: 4500, displayValue: "4.5 s", rating: "poor" },
          fcp: { value: 1200, displayValue: "1.2 s", rating: "good" },
          cls: { value: 0.05, displayValue: "0.05", rating: "good" },
          tbt: { value: 200, displayValue: "200 ms", rating: "good" },
          si: { value: 2000, displayValue: "2.0 s", rating: "good" },
          tti: { value: 3500, displayValue: "3.5 s", rating: "needs-improvement" },
        },
      });
      const generator = new ActionableReportGenerator(result);
      const report = generator.generate();

      // Should have action items from LCP opportunity (critical impact)
      const actionSteps = report.nextSteps.filter((s) => s.type === "code-change");
      expect(actionSteps.length).toBeGreaterThan(0);
    });
  });
});

describe("createReportGenerator", () => {
  it("should create ActionableReportGenerator instance", () => {
    const result = createBaseResult();
    const generator = createReportGenerator(result);

    expect(generator).toBeInstanceOf(ActionableReportGenerator);
  });

  it("should pass context to generator", () => {
    const result = createBaseResult();
    const generator = createReportGenerator(result, nextJsContext);
    const report = generator.generate();

    expect(report.projectContext).toBe(nextJsContext);
  });
});

describe("generateActionableReport", () => {
  it("should generate report directly", () => {
    const result = createBaseResult();
    const report = generateActionableReport(result);

    expect(report.performanceResult).toBe(result);
    expect(report.diagnosticsTable).toBeDefined();
    expect(report.summary).toBeDefined();
  });

  it("should include context when provided", () => {
    const result = createBaseResult();
    const report = generateActionableReport(result, nextJsContext);

    expect(report.projectContext).toBe(nextJsContext);
  });

  it("should work with null context", () => {
    const result = createBaseResult();
    const report = generateActionableReport(result, null);

    expect(report.projectContext).toBeUndefined();
  });
});
