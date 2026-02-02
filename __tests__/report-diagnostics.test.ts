/**
 * Tests for Report Diagnostics
 */

import { generateDiagnosticsTable } from "../src/report/diagnostics";
import type { PerformanceResult } from "../src/types";

// Helper to create a base PerformanceResult
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

describe("generateDiagnosticsTable", () => {
  describe("with no insights", () => {
    it("should return empty array when no insights are present", () => {
      const result = createBaseResult();
      const diagnostics = generateDiagnosticsTable(result);
      expect(diagnostics).toEqual([]);
    });

    it("should return empty array when insights is undefined", () => {
      const result = createBaseResult({ insights: undefined });
      const diagnostics = generateDiagnosticsTable(result);
      expect(diagnostics).toEqual([]);
    });
  });

  describe("unused JavaScript diagnostic", () => {
    it("should create diagnostic for unused JavaScript", () => {
      const result = createBaseResult({
        insights: {
          unusedJavaScript: [
            {
              url: "https://example.com/app.js",
              transferSize: 500000,
              wastedBytes: 200000,
              wastedPercent: 40,
              isFirstParty: true,
            },
            {
              url: "https://cdn.example.com/vendor.js",
              transferSize: 300000,
              wastedBytes: 150000,
              wastedPercent: 50,
              isFirstParty: false,
              entity: "CDN",
            },
          ],
          unusedCSS: [],
          cacheIssues: [],
          imageIssues: [],
          legacyJavaScript: [],
          thirdParties: [],
          longTasks: [],
          renderBlocking: [],
          totalSavings: { timeMs: 0, sizeBytes: 350000 },
        },
      });

      const diagnostics = generateDiagnosticsTable(result);

      expect(diagnostics).toHaveLength(1);
      expect(diagnostics[0].id).toBe("unused-javascript");
      expect(diagnostics[0].title).toBe("Reduce unused JavaScript");
      expect(diagnostics[0].category).toBe("javascript");
      expect(diagnostics[0].savings?.bytes).toBe(350000);
      expect(diagnostics[0].items).toHaveLength(2);
    });

    it("should limit items to 10", () => {
      const manyItems = Array.from({ length: 15 }, (_, i) => ({
        url: `https://example.com/script${i}.js`,
        transferSize: 100000,
        wastedBytes: 50000,
        wastedPercent: 50,
        isFirstParty: true,
      }));

      const result = createBaseResult({
        insights: {
          unusedJavaScript: manyItems,
          unusedCSS: [],
          cacheIssues: [],
          imageIssues: [],
          legacyJavaScript: [],
          thirdParties: [],
          longTasks: [],
          renderBlocking: [],
          totalSavings: { timeMs: 0, sizeBytes: 750000 },
        },
      });

      const diagnostics = generateDiagnosticsTable(result);
      expect(diagnostics[0].items).toHaveLength(10);
    });
  });

  describe("unused CSS diagnostic", () => {
    it("should create diagnostic for unused CSS", () => {
      const result = createBaseResult({
        insights: {
          unusedJavaScript: [],
          unusedCSS: [
            {
              url: "https://example.com/styles.css",
              transferSize: 100000,
              wastedBytes: 60000,
              wastedPercent: 60,
              isFirstParty: true,
            },
          ],
          cacheIssues: [],
          imageIssues: [],
          legacyJavaScript: [],
          thirdParties: [],
          longTasks: [],
          renderBlocking: [],
          totalSavings: { timeMs: 0, sizeBytes: 60000 },
        },
      });

      const diagnostics = generateDiagnosticsTable(result);

      expect(diagnostics).toHaveLength(1);
      expect(diagnostics[0].id).toBe("unused-css");
      expect(diagnostics[0].category).toBe("resource");
    });
  });

  describe("long tasks diagnostic", () => {
    it("should create diagnostic for long tasks", () => {
      const result = createBaseResult({
        insights: {
          unusedJavaScript: [],
          unusedCSS: [],
          cacheIssues: [],
          imageIssues: [],
          legacyJavaScript: [],
          thirdParties: [],
          longTasks: [
            { duration: 150, startTime: 1000, url: "https://example.com/app.js" },
            { duration: 200, startTime: 2000, url: "https://example.com/vendor.js" },
            { duration: 100, startTime: 3000 },
          ],
          renderBlocking: [],
          totalSavings: { timeMs: 450, sizeBytes: 0 },
        },
      });

      const diagnostics = generateDiagnosticsTable(result);

      expect(diagnostics).toHaveLength(1);
      expect(diagnostics[0].id).toBe("long-tasks");
      expect(diagnostics[0].displayValue).toBe("3 long tasks found");
      expect(diagnostics[0].savings?.timeMs).toBe(450);
      expect(diagnostics[0].category).toBe("javascript");
    });

    it("should handle single long task grammar", () => {
      const result = createBaseResult({
        insights: {
          unusedJavaScript: [],
          unusedCSS: [],
          cacheIssues: [],
          imageIssues: [],
          legacyJavaScript: [],
          thirdParties: [],
          longTasks: [{ duration: 150, startTime: 1000 }],
          renderBlocking: [],
          totalSavings: { timeMs: 150, sizeBytes: 0 },
        },
      });

      const diagnostics = generateDiagnosticsTable(result);
      expect(diagnostics[0].displayValue).toBe("1 long task found");
    });
  });

  describe("render blocking diagnostic", () => {
    it("should create diagnostic for render-blocking resources", () => {
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
            {
              url: "https://example.com/critical.css",
              transferSize: 50000,
              wastedMs: 300,
              resourceType: "stylesheet",
            },
            {
              url: "https://example.com/blocking.js",
              transferSize: 100000,
              wastedMs: 500,
              resourceType: "script",
            },
          ],
          totalSavings: { timeMs: 800, sizeBytes: 0 },
        },
      });

      const diagnostics = generateDiagnosticsTable(result);

      expect(diagnostics).toHaveLength(1);
      expect(diagnostics[0].id).toBe("render-blocking");
      expect(diagnostics[0].displayValue).toContain("800ms");
      expect(diagnostics[0].category).toBe("rendering");
    });
  });

  describe("third party diagnostic", () => {
    it("should create diagnostic for third-party impact", () => {
      const result = createBaseResult({
        insights: {
          unusedJavaScript: [],
          unusedCSS: [],
          cacheIssues: [],
          imageIssues: [],
          legacyJavaScript: [],
          thirdParties: [
            {
              entity: "Google Analytics",
              blockingTime: 300,
              transferSize: 50000,
              requestCount: 3,
              urls: ["https://google-analytics.com/analytics.js"],
              category: "analytics",
            },
            {
              entity: "Facebook Pixel",
              blockingTime: 200,
              transferSize: 30000,
              requestCount: 2,
              urls: ["https://connect.facebook.net/pixel.js"],
              category: "social",
            },
          ],
          longTasks: [],
          renderBlocking: [],
          totalSavings: { timeMs: 500, sizeBytes: 80000 },
        },
      });

      const diagnostics = generateDiagnosticsTable(result);

      expect(diagnostics).toHaveLength(1);
      expect(diagnostics[0].id).toBe("third-party-summary");
      expect(diagnostics[0].displayValue).toContain("500ms blocking time");
      expect(diagnostics[0].category).toBe("network");
    });
  });

  describe("cache issues diagnostic", () => {
    it("should create diagnostic for cache issues", () => {
      const result = createBaseResult({
        insights: {
          unusedJavaScript: [],
          unusedCSS: [],
          cacheIssues: [
            {
              url: "https://example.com/image.png",
              cacheTTL: 3600,
              cacheTTLDisplay: "1h",
              transferSize: 100000,
              wastedBytes: 100000,
            },
            {
              url: "https://example.com/script.js",
              cacheTTL: 0,
              cacheTTLDisplay: "No cache",
              transferSize: 50000,
              wastedBytes: 50000,
            },
          ],
          imageIssues: [],
          legacyJavaScript: [],
          thirdParties: [],
          longTasks: [],
          renderBlocking: [],
          totalSavings: { timeMs: 0, sizeBytes: 150000 },
        },
      });

      const diagnostics = generateDiagnosticsTable(result);

      expect(diagnostics).toHaveLength(1);
      expect(diagnostics[0].id).toBe("cache-policy");
      expect(diagnostics[0].displayValue).toBe("2 resources found");
      expect(diagnostics[0].category).toBe("network");
    });
  });

  describe("image issues diagnostic", () => {
    it("should create diagnostic for image optimization issues", () => {
      const result = createBaseResult({
        insights: {
          unusedJavaScript: [],
          unusedCSS: [],
          cacheIssues: [],
          imageIssues: [
            {
              url: "https://example.com/hero.jpg",
              totalBytes: 500000,
              wastedBytes: 300000,
              issueType: "oversized",
              recommendation: "Resize to 1200x800",
            },
            {
              url: "https://example.com/photo.png",
              totalBytes: 200000,
              wastedBytes: 150000,
              issueType: "format",
              recommendation: "Convert to WebP",
            },
          ],
          legacyJavaScript: [],
          thirdParties: [],
          longTasks: [],
          renderBlocking: [],
          totalSavings: { timeMs: 0, sizeBytes: 450000 },
        },
      });

      const diagnostics = generateDiagnosticsTable(result);

      expect(diagnostics).toHaveLength(1);
      expect(diagnostics[0].id).toBe("image-optimization");
      expect(diagnostics[0].category).toBe("resource");
      expect(diagnostics[0].description).toContain("oversized");
      expect(diagnostics[0].description).toContain("format");
    });
  });

  describe("legacy JavaScript diagnostic", () => {
    it("should create diagnostic for legacy JavaScript", () => {
      const result = createBaseResult({
        insights: {
          unusedJavaScript: [],
          unusedCSS: [],
          cacheIssues: [],
          imageIssues: [],
          legacyJavaScript: [
            {
              url: "https://example.com/bundle.js",
              wastedBytes: 50000,
              polyfills: ["Array.from", "Object.assign"],
            },
          ],
          thirdParties: [],
          longTasks: [],
          renderBlocking: [],
          totalSavings: { timeMs: 0, sizeBytes: 50000 },
        },
      });

      const diagnostics = generateDiagnosticsTable(result);

      expect(diagnostics).toHaveLength(1);
      expect(diagnostics[0].id).toBe("legacy-javascript");
      expect(diagnostics[0].category).toBe("javascript");
    });
  });

  describe("sorting", () => {
    it("should sort diagnostics by severity (critical first)", () => {
      const result = createBaseResult({
        insights: {
          unusedJavaScript: [
            // Will be moderate severity
            {
              url: "https://example.com/app.js",
              transferSize: 200000,
              wastedBytes: 150000,
              wastedPercent: 75,
              isFirstParty: true,
            },
          ],
          unusedCSS: [],
          cacheIssues: [],
          imageIssues: [],
          legacyJavaScript: [],
          thirdParties: [
            // Will be critical severity (>1000ms blocking)
            {
              entity: "Heavy Analytics",
              blockingTime: 1500,
              transferSize: 500000,
              requestCount: 10,
              urls: ["https://analytics.example.com"],
            },
          ],
          longTasks: [
            // Will be serious (>3 tasks)
            { duration: 100, startTime: 1000 },
            { duration: 100, startTime: 2000 },
            { duration: 100, startTime: 3000 },
            { duration: 100, startTime: 4000 },
          ],
          renderBlocking: [],
          totalSavings: { timeMs: 1900, sizeBytes: 650000 },
        },
      });

      const diagnostics = generateDiagnosticsTable(result);

      expect(diagnostics).toHaveLength(3);
      // Critical should be first
      expect(diagnostics[0].severity).toBe("critical");
      // Serious should be second
      expect(diagnostics[1].severity).toBe("serious");
    });
  });
});
