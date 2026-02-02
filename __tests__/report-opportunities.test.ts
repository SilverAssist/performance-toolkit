/**
 * Tests for Key Opportunities Generation
 */

import {
  generateKeyOpportunities,
  createLCPOpportunity,
  createJavaScriptOpportunity,
  createImageOpportunity,
  createThirdPartyOpportunity,
  createRenderBlockingOpportunity,
  createCLSOpportunity,
} from "../src/report/opportunities";
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

describe("generateKeyOpportunities", () => {
  it("should return empty array when all metrics are good", () => {
    const result = createBaseResult();
    const opportunities = generateKeyOpportunities(result, null);
    expect(opportunities).toEqual([]);
  });

  it("should add LCP opportunity when LCP rating is not good", () => {
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

    const opportunities = generateKeyOpportunities(result, null);

    expect(opportunities.some((o) => o.id === "optimize-lcp")).toBe(true);
  });

  it("should add JavaScript opportunity when unused JS > 100KB", () => {
    const result = createBaseResult({
      insights: {
        unusedJavaScript: [
          { url: "https://example.com/app.js", transferSize: 500000, wastedBytes: 150000, wastedPercent: 30, isFirstParty: true },
        ],
        unusedCSS: [],
        cacheIssues: [],
        imageIssues: [],
        legacyJavaScript: [],
        thirdParties: [],
        longTasks: [],
        renderBlocking: [],
        totalSavings: { timeMs: 0, sizeBytes: 150000 },
      },
    });

    const opportunities = generateKeyOpportunities(result, null);

    expect(opportunities.some((o) => o.id === "optimize-javascript")).toBe(true);
  });

  it("should add image opportunity when image waste > 50KB", () => {
    const result = createBaseResult({
      insights: {
        unusedJavaScript: [],
        unusedCSS: [],
        cacheIssues: [],
        imageIssues: [
          { url: "https://example.com/hero.jpg", totalBytes: 500000, wastedBytes: 300000, issueType: "oversized", recommendation: "Resize" },
        ],
        legacyJavaScript: [],
        thirdParties: [],
        longTasks: [],
        renderBlocking: [],
        totalSavings: { timeMs: 0, sizeBytes: 300000 },
      },
    });

    const opportunities = generateKeyOpportunities(result, null);

    expect(opportunities.some((o) => o.id === "optimize-images")).toBe(true);
  });

  it("should add third-party opportunity when blocking time > 250ms", () => {
    const result = createBaseResult({
      insights: {
        unusedJavaScript: [],
        unusedCSS: [],
        cacheIssues: [],
        imageIssues: [],
        legacyJavaScript: [],
        thirdParties: [
          { entity: "Google Analytics", blockingTime: 300, transferSize: 50000, requestCount: 3, urls: [] },
        ],
        longTasks: [],
        renderBlocking: [],
        totalSavings: { timeMs: 300, sizeBytes: 0 },
      },
    });

    const opportunities = generateKeyOpportunities(result, null);

    expect(opportunities.some((o) => o.id === "optimize-third-parties")).toBe(true);
  });

  it("should add render-blocking opportunity when wasted ms > 200", () => {
    const result = createBaseResult({
      insights: {
        unusedJavaScript: [],
        unusedCSS: [],
        cacheIssues: [],
        imageIssues: [],
        legacyJavaScript: [],
        thirdParties: [],
        longTasks: [],
        renderBlocking: [
          { url: "https://example.com/styles.css", transferSize: 50000, wastedMs: 500, resourceType: "stylesheet" },
        ],
        totalSavings: { timeMs: 500, sizeBytes: 0 },
      },
    });

    const opportunities = generateKeyOpportunities(result, null);

    expect(opportunities.some((o) => o.id === "eliminate-render-blocking")).toBe(true);
  });

  it("should add CLS opportunity when CLS rating is not good", () => {
    const result = createBaseResult({
      metrics: {
        lcp: { value: 2500, displayValue: "2.5 s", rating: "good" },
        fcp: { value: 1200, displayValue: "1.2 s", rating: "good" },
        cls: { value: 0.3, displayValue: "0.3", rating: "poor" },
        tbt: { value: 200, displayValue: "200 ms", rating: "good" },
        si: { value: 2000, displayValue: "2.0 s", rating: "good" },
        tti: { value: 3500, displayValue: "3.5 s", rating: "needs-improvement" },
      },
    });

    const opportunities = generateKeyOpportunities(result, null);

    expect(opportunities.some((o) => o.id === "improve-cls")).toBe(true);
  });

  it("should sort opportunities by priority", () => {
    const result = createBaseResult({
      metrics: {
        lcp: { value: 4500, displayValue: "4.5 s", rating: "poor" },
        fcp: { value: 1200, displayValue: "1.2 s", rating: "good" },
        cls: { value: 0.3, displayValue: "0.3", rating: "poor" },
        tbt: { value: 200, displayValue: "200 ms", rating: "good" },
        si: { value: 2000, displayValue: "2.0 s", rating: "good" },
        tti: { value: 3500, displayValue: "3.5 s", rating: "needs-improvement" },
      },
      insights: {
        unusedJavaScript: [
          { url: "https://example.com/app.js", transferSize: 500000, wastedBytes: 200000, wastedPercent: 40, isFirstParty: true },
        ],
        unusedCSS: [],
        cacheIssues: [],
        imageIssues: [],
        legacyJavaScript: [],
        thirdParties: [],
        longTasks: [],
        renderBlocking: [],
        totalSavings: { timeMs: 0, sizeBytes: 200000 },
      },
    });

    const opportunities = generateKeyOpportunities(result, null);

    // Should be sorted by priority (LCP = 1, JS = 2, CLS = 6)
    expect(opportunities[0].id).toBe("optimize-lcp");
    expect(opportunities[1].id).toBe("optimize-javascript");
    expect(opportunities[2].id).toBe("improve-cls");
  });
});

describe("createLCPOpportunity", () => {
  it("should create LCP opportunity with correct structure", () => {
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

    const opportunity = createLCPOpportunity(result, null);

    expect(opportunity.id).toBe("optimize-lcp");
    expect(opportunity.priority).toBe(1);
    expect(opportunity.title).toContain("LCP");
    expect(opportunity.impact.level).toBe("critical");
    expect(opportunity.steps.length).toBeGreaterThan(0);
    expect(opportunity.relatedAudits).toContain("largest-contentful-paint");
  });

  it("should have high impact level when LCP <= 4000ms", () => {
    const result = createBaseResult({
      metrics: {
        lcp: { value: 3500, displayValue: "3.5 s", rating: "needs-improvement" },
        fcp: { value: 1200, displayValue: "1.2 s", rating: "good" },
        cls: { value: 0.05, displayValue: "0.05", rating: "good" },
        tbt: { value: 200, displayValue: "200 ms", rating: "good" },
        si: { value: 2000, displayValue: "2.0 s", rating: "good" },
        tti: { value: 3500, displayValue: "3.5 s", rating: "needs-improvement" },
      },
    });

    const opportunity = createLCPOpportunity(result, null);

    expect(opportunity.impact.level).toBe("high");
  });

  it("should include Next.js specific notes when using Next.js", () => {
    const result = createBaseResult({
      metrics: {
        lcp: { value: 3500, displayValue: "3.5 s", rating: "needs-improvement" },
        fcp: { value: 1200, displayValue: "1.2 s", rating: "good" },
        cls: { value: 0.05, displayValue: "0.05", rating: "good" },
        tbt: { value: 200, displayValue: "200 ms", rating: "good" },
        si: { value: 2000, displayValue: "2.0 s", rating: "good" },
        tti: { value: 3500, displayValue: "3.5 s", rating: "needs-improvement" },
      },
      lcpElement: {
        tagName: "IMG",
        selector: "img.hero",
        url: "https://example.com/hero.jpg",
      },
    });

    const opportunity = createLCPOpportunity(result, nextJsContext);

    expect(opportunity.frameworkNotes).toBeDefined();
    expect(opportunity.frameworkNotes?.some((n) => n.framework === "Next.js")).toBe(true);
  });
});

describe("createJavaScriptOpportunity", () => {
  it("should create JavaScript opportunity with correct structure", () => {
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
        longTasks: [],
        renderBlocking: [],
        totalSavings: { timeMs: 0, sizeBytes: 200000 },
      },
    });

    const opportunity = createJavaScriptOpportunity(result, null, 200000);

    expect(opportunity.id).toBe("optimize-javascript");
    expect(opportunity.priority).toBe(2);
    expect(opportunity.description).toContain("195 KiB"); // formatBytes(200000)
    expect(opportunity.impact.sizeSavings).toBe(200000);
    expect(opportunity.relatedAudits).toContain("unused-javascript");
  });

  it("should have critical impact for very large JS waste", () => {
    const result = createBaseResult();
    const opportunity = createJavaScriptOpportunity(result, null, 600000);

    expect(opportunity.impact.level).toBe("critical");
  });

  it("should have high impact for large JS waste", () => {
    const result = createBaseResult();
    const opportunity = createJavaScriptOpportunity(result, null, 300000);

    expect(opportunity.impact.level).toBe("high");
  });

  it("should have medium impact for moderate JS waste", () => {
    const result = createBaseResult();
    const opportunity = createJavaScriptOpportunity(result, null, 150000);

    expect(opportunity.impact.level).toBe("medium");
  });

  it("should include Next.js dynamic import notes", () => {
    const result = createBaseResult({
      insights: {
        unusedJavaScript: [
          { url: "https://example.com/app.js", transferSize: 300000, wastedBytes: 100000, wastedPercent: 33, isFirstParty: true },
        ],
        unusedCSS: [],
        cacheIssues: [],
        imageIssues: [],
        legacyJavaScript: [],
        thirdParties: [],
        longTasks: [],
        renderBlocking: [],
        totalSavings: { timeMs: 0, sizeBytes: 100000 },
      },
    });

    const opportunity = createJavaScriptOpportunity(result, nextJsContext, 200000);

    expect(opportunity.frameworkNotes).toBeDefined();
    expect(opportunity.frameworkNotes?.some((n) => n.codeExample?.includes("dynamic"))).toBe(true);
  });
});

describe("createImageOpportunity", () => {
  it("should create image opportunity with correct structure", () => {
    const result = createBaseResult({
      insights: {
        unusedJavaScript: [],
        unusedCSS: [],
        cacheIssues: [],
        imageIssues: [
          { url: "https://example.com/hero.jpg", totalBytes: 500000, wastedBytes: 200000, issueType: "format", recommendation: "Convert to WebP" },
          { url: "https://example.com/photo.png", totalBytes: 300000, wastedBytes: 150000, issueType: "oversized", recommendation: "Resize" },
        ],
        legacyJavaScript: [],
        thirdParties: [],
        longTasks: [],
        renderBlocking: [],
        totalSavings: { timeMs: 0, sizeBytes: 350000 },
      },
    });

    const opportunity = createImageOpportunity(result, null, 350000);

    expect(opportunity.id).toBe("optimize-images");
    expect(opportunity.priority).toBe(3);
    expect(opportunity.description).toContain("2 images");
    expect(opportunity.relatedAudits).toContain("modern-image-formats");
  });

  it("should include step for format conversion when format issues exist", () => {
    const result = createBaseResult({
      insights: {
        unusedJavaScript: [],
        unusedCSS: [],
        cacheIssues: [],
        imageIssues: [
          { url: "https://example.com/hero.jpg", totalBytes: 500000, wastedBytes: 200000, issueType: "format", recommendation: "Convert to WebP" },
        ],
        legacyJavaScript: [],
        thirdParties: [],
        longTasks: [],
        renderBlocking: [],
        totalSavings: { timeMs: 0, sizeBytes: 200000 },
      },
    });

    const opportunity = createImageOpportunity(result, null, 200000);

    expect(opportunity.steps.some((s) => s.title.includes("modern formats"))).toBe(true);
  });

  it("should include Next.js Image component notes", () => {
    const result = createBaseResult({
      insights: {
        unusedJavaScript: [],
        unusedCSS: [],
        cacheIssues: [],
        imageIssues: [
          { url: "https://example.com/hero.jpg", totalBytes: 500000, wastedBytes: 200000, issueType: "oversized", recommendation: "Resize" },
        ],
        legacyJavaScript: [],
        thirdParties: [],
        longTasks: [],
        renderBlocking: [],
        totalSavings: { timeMs: 0, sizeBytes: 200000 },
      },
    });

    const opportunity = createImageOpportunity(result, nextJsContext, 200000);

    expect(opportunity.frameworkNotes).toBeDefined();
    expect(opportunity.frameworkNotes?.some((n) => n.codeExample?.includes("next/image"))).toBe(true);
  });
});

describe("createThirdPartyOpportunity", () => {
  it("should create third-party opportunity with correct structure", () => {
    const result = createBaseResult({
      insights: {
        unusedJavaScript: [],
        unusedCSS: [],
        cacheIssues: [],
        imageIssues: [],
        legacyJavaScript: [],
        thirdParties: [
          { entity: "Google Analytics", blockingTime: 300, transferSize: 50000, requestCount: 3, urls: [] },
          { entity: "Facebook", blockingTime: 200, transferSize: 30000, requestCount: 2, urls: [] },
        ],
        longTasks: [],
        renderBlocking: [],
        totalSavings: { timeMs: 500, sizeBytes: 0 },
      },
    });

    const opportunity = createThirdPartyOpportunity(result, null, 500);

    expect(opportunity.id).toBe("optimize-third-parties");
    expect(opportunity.priority).toBe(4);
    expect(opportunity.description).toContain("500ms");
    expect(opportunity.description).toContain("Google Analytics");
  });

  it("should have high impact for blocking > 1000ms", () => {
    const result = createBaseResult({
      insights: {
        unusedJavaScript: [],
        unusedCSS: [],
        cacheIssues: [],
        imageIssues: [],
        legacyJavaScript: [],
        thirdParties: [
          { entity: "Heavy Script", blockingTime: 1500, transferSize: 100000, requestCount: 5, urls: [] },
        ],
        longTasks: [],
        renderBlocking: [],
        totalSavings: { timeMs: 1500, sizeBytes: 0 },
      },
    });

    const opportunity = createThirdPartyOpportunity(result, null, 1500);

    expect(opportunity.impact.level).toBe("high");
  });

  it("should include Next.js Script component notes", () => {
    const result = createBaseResult({
      insights: {
        unusedJavaScript: [],
        unusedCSS: [],
        cacheIssues: [],
        imageIssues: [],
        legacyJavaScript: [],
        thirdParties: [
          { entity: "Analytics", blockingTime: 500, transferSize: 50000, requestCount: 3, urls: [] },
        ],
        longTasks: [],
        renderBlocking: [],
        totalSavings: { timeMs: 500, sizeBytes: 0 },
      },
    });

    const opportunity = createThirdPartyOpportunity(result, nextJsContext, 500);

    expect(opportunity.frameworkNotes).toBeDefined();
    expect(opportunity.frameworkNotes?.some((n) => n.codeExample?.includes("next/script"))).toBe(true);
  });
});

describe("createRenderBlockingOpportunity", () => {
  it("should create render-blocking opportunity with correct structure", () => {
    const opportunity = createRenderBlockingOpportunity(800);

    expect(opportunity.id).toBe("eliminate-render-blocking");
    expect(opportunity.priority).toBe(5);
    expect(opportunity.description).toContain("800ms");
    expect(opportunity.steps.length).toBe(3);
    expect(opportunity.relatedAudits).toContain("render-blocking-resources");
  });

  it("should have high impact for wasted > 1000ms", () => {
    const opportunity = createRenderBlockingOpportunity(1200);

    expect(opportunity.impact.level).toBe("high");
  });

  it("should have medium impact for wasted <= 1000ms", () => {
    const opportunity = createRenderBlockingOpportunity(500);

    expect(opportunity.impact.level).toBe("medium");
  });

  it("should include steps for inlining critical CSS", () => {
    const opportunity = createRenderBlockingOpportunity(800);

    expect(opportunity.steps.some((s) => s.title.includes("critical CSS"))).toBe(true);
  });
});

describe("createCLSOpportunity", () => {
  it("should create CLS opportunity with correct structure", () => {
    const result = createBaseResult({
      metrics: {
        lcp: { value: 2500, displayValue: "2.5 s", rating: "good" },
        fcp: { value: 1200, displayValue: "1.2 s", rating: "good" },
        cls: { value: 0.3, displayValue: "0.3", rating: "poor" },
        tbt: { value: 200, displayValue: "200 ms", rating: "good" },
        si: { value: 2000, displayValue: "2.0 s", rating: "good" },
        tti: { value: 3500, displayValue: "3.5 s", rating: "needs-improvement" },
      },
    });

    const opportunity = createCLSOpportunity(result);

    expect(opportunity.id).toBe("improve-cls");
    expect(opportunity.priority).toBe(6);
    expect(opportunity.description).toContain("0.3");
    expect(opportunity.description).toContain("poor");
    expect(opportunity.steps.length).toBe(4);
    expect(opportunity.relatedAudits).toContain("cumulative-layout-shift");
  });

  it("should have high impact for CLS > 0.25", () => {
    const result = createBaseResult({
      metrics: {
        lcp: { value: 2500, displayValue: "2.5 s", rating: "good" },
        fcp: { value: 1200, displayValue: "1.2 s", rating: "good" },
        cls: { value: 0.3, displayValue: "0.3", rating: "poor" },
        tbt: { value: 200, displayValue: "200 ms", rating: "good" },
        si: { value: 2000, displayValue: "2.0 s", rating: "good" },
        tti: { value: 3500, displayValue: "3.5 s", rating: "needs-improvement" },
      },
    });

    const opportunity = createCLSOpportunity(result);

    expect(opportunity.impact.level).toBe("high");
  });

  it("should have medium impact for CLS <= 0.25", () => {
    const result = createBaseResult({
      metrics: {
        lcp: { value: 2500, displayValue: "2.5 s", rating: "good" },
        fcp: { value: 1200, displayValue: "1.2 s", rating: "good" },
        cls: { value: 0.15, displayValue: "0.15", rating: "needs-improvement" },
        tbt: { value: 200, displayValue: "200 ms", rating: "good" },
        si: { value: 2000, displayValue: "2.0 s", rating: "good" },
        tti: { value: 3500, displayValue: "3.5 s", rating: "needs-improvement" },
      },
    });

    const opportunity = createCLSOpportunity(result);

    expect(opportunity.impact.level).toBe("medium");
  });
});
