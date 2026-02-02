/**
 * Tests for PageSpeed Insights Extractors
 */

import {
  extractDetailedInsights,
  extractCacheIssues,
  extractImageIssues,
  extractUnusedCode,
  extractLegacyJavaScript,
  extractThirdParties,
  extractLongTasks,
  extractRenderBlockingResources,
  extractLCPBreakdown,
} from "../src/pagespeed/insights";
import type { LighthouseAudit } from "../src/types";

// Mock audits structure helper
function createMockAudits(
  overrides: Record<string, Partial<LighthouseAudit>> = {}
): Record<string, LighthouseAudit> {
  const baseAudit: Omit<LighthouseAudit, "id"> = {
    title: "",
    description: "",
    score: null,
    scoreDisplayMode: "informative",
  };

  const base: Record<string, Partial<LighthouseAudit>> = {
    "uses-long-cache-ttl": { details: { type: "table", items: [] } },
    "modern-image-formats": { details: { type: "table", items: [] } },
    "uses-responsive-images": { details: { type: "table", items: [] } },
    "offscreen-images": { details: { type: "table", items: [] } },
    "uses-optimized-images": { details: { type: "table", items: [] } },
    "unused-javascript": { details: { type: "table", items: [] } },
    "unused-css-rules": { details: { type: "table", items: [] } },
    "legacy-javascript": { details: { type: "table", items: [] } },
    "third-party-summary": { details: { type: "table", items: [] } },
    "long-tasks": { details: { type: "table", items: [] } },
    "render-blocking-resources": { details: { type: "table", items: [] } },
    "lcp-lazy-loaded": {},
    "largest-contentful-paint-element": { details: { type: "table", items: [] } },
  };

  const merged = { ...base, ...overrides };

  return Object.fromEntries(
    Object.entries(merged).map(([key, value]) => [
      key,
      { ...baseAudit, id: key, ...value } as LighthouseAudit,
    ])
  );
}

describe("extractDetailedInsights", () => {
  it("should return empty insights when audits are empty", () => {
    const audits = createMockAudits();
    const insights = extractDetailedInsights(audits);

    expect(insights.cacheIssues).toHaveLength(0);
    expect(insights.imageIssues).toHaveLength(0);
    expect(insights.unusedJavaScript).toHaveLength(0);
    expect(insights.unusedCSS).toHaveLength(0);
    expect(insights.legacyJavaScript).toHaveLength(0);
    expect(insights.thirdParties).toHaveLength(0);
    expect(insights.longTasks).toHaveLength(0);
    expect(insights.renderBlocking).toHaveLength(0);
    expect(insights.totalSavings.timeMs).toBe(0);
    expect(insights.totalSavings.sizeBytes).toBe(0);
  });

  it("should calculate total savings from all issues", () => {
    const audits = createMockAudits({
      "unused-javascript": {
        details: { type: "table",
          items: [{ url: "https://example.com/app.js", totalBytes: 100000, wastedBytes: 50000 }],
        },
      },
      "unused-css-rules": {
        details: { type: "table",
          items: [{ url: "https://example.com/styles.css", totalBytes: 50000, wastedBytes: 25000 }],
        },
      },
      "render-blocking-resources": {
        details: { type: "table",
          items: [{ url: "https://example.com/critical.css", transferSize: 20000, wastedMs: 300 }],
        },
      },
    });

    const insights = extractDetailedInsights(audits, "https://example.com");

    expect(insights.totalSavings.sizeBytes).toBe(75000); // 50000 + 25000
    expect(insights.totalSavings.timeMs).toBe(300);
  });

  it("should use host domain for first-party detection", () => {
    const audits = createMockAudits({
      "unused-javascript": {
        details: { type: "table",
          items: [
            { url: "https://example.com/app.js", totalBytes: 100000, wastedBytes: 50000 },
            { url: "https://cdn.external.com/vendor.js", totalBytes: 80000, wastedBytes: 40000 },
          ],
        },
      },
    });

    const insights = extractDetailedInsights(audits, "https://example.com");

    expect(insights.unusedJavaScript[0].isFirstParty).toBe(true);
    expect(insights.unusedJavaScript[1].isFirstParty).toBe(false);
  });
});

describe("extractCacheIssues", () => {
  it("should return empty array when audit is missing", () => {
    const audits = {} as Record<string, LighthouseAudit>;
    expect(extractCacheIssues(audits)).toEqual([]);
  });

  it("should return empty array when audit has no details", () => {
    const audits = createMockAudits({
      "uses-long-cache-ttl": { details: undefined },
    });
    expect(extractCacheIssues(audits)).toEqual([]);
  });

  it("should return empty array when audit has no items", () => {
    const audits = createMockAudits({
      "uses-long-cache-ttl": { details: { type: "table" } },
    });
    expect(extractCacheIssues(audits)).toEqual([]);
  });

  it("should extract cache issues correctly", () => {
    const audits = createMockAudits({
      "uses-long-cache-ttl": {
        details: {
          type: "table",
          items: [
            { url: "https://example.com/script.js", cacheLifetimeMs: 3600000, totalBytes: 50000, wastedBytes: 50000 },
            { url: "https://example.com/image.png", cacheLifetimeMs: 0, totalBytes: 100000, wastedBytes: 100000 },
          ],
        },
      },
    });

    const issues = extractCacheIssues(audits);

    expect(issues).toHaveLength(2);
    expect(issues[0].wastedBytes).toBe(100000); // Sorted by wastedBytes desc
    expect(issues[0].cacheTTL).toBe(0);
    expect(issues[0].cacheTTLDisplay).toBe("No cache");
    expect(issues[1].cacheTTL).toBe(3600000);
    expect(issues[1].cacheTTLDisplay).toBe("1h");
  });

  it("should skip items without URL", () => {
    const audits = createMockAudits({
      "uses-long-cache-ttl": {
        details: { type: "table",
          items: [
            { cacheLifetimeMs: 3600000, totalBytes: 50000, wastedBytes: 50000 },
            { url: "https://example.com/valid.js", cacheLifetimeMs: 0, totalBytes: 100000, wastedBytes: 100000 },
          ],
        },
      },
    });

    const issues = extractCacheIssues(audits);

    expect(issues).toHaveLength(1);
    expect(issues[0].url).toBe("https://example.com/valid.js");
  });
});

describe("extractImageIssues", () => {
  it("should return empty array when all audits are missing", () => {
    const audits = {} as Record<string, LighthouseAudit>;
    expect(extractImageIssues(audits)).toEqual([]);
  });

  it("should extract modern format issues", () => {
    const audits = createMockAudits({
      "modern-image-formats": {
        details: { type: "table",
          items: [
            { url: "https://example.com/hero.jpg", totalBytes: 500000, wastedBytes: 200000 },
          ],
        },
      },
    });

    const issues = extractImageIssues(audits);

    expect(issues).toHaveLength(1);
    expect(issues[0].issueType).toBe("format");
    expect(issues[0].recommendation).toContain("WebP");
  });

  it("should extract responsive image issues", () => {
    const audits = createMockAudits({
      "uses-responsive-images": {
        details: { type: "table",
          items: [
            { url: "https://example.com/photo.png", totalBytes: 300000, wastedBytes: 150000 },
          ],
        },
      },
    });

    const issues = extractImageIssues(audits);

    expect(issues).toHaveLength(1);
    expect(issues[0].issueType).toBe("oversized");
    expect(issues[0].recommendation).toContain("properly sized");
  });

  it("should extract offscreen image issues", () => {
    const audits = createMockAudits({
      "offscreen-images": {
        details: { type: "table",
          items: [
            { url: "https://example.com/lazy.jpg", totalBytes: 100000, wastedBytes: 100000 },
          ],
        },
      },
    });

    const issues = extractImageIssues(audits);

    expect(issues).toHaveLength(1);
    expect(issues[0].issueType).toBe("offscreen");
    expect(issues[0].recommendation).toContain("lazy");
  });

  it("should extract unoptimized image issues", () => {
    const audits = createMockAudits({
      "uses-optimized-images": {
        details: { type: "table",
          items: [
            { url: "https://example.com/unoptimized.jpg", totalBytes: 200000, wastedBytes: 80000 },
          ],
        },
      },
    });

    const issues = extractImageIssues(audits);

    expect(issues).toHaveLength(1);
    expect(issues[0].issueType).toBe("unoptimized");
  });

  it("should deduplicate images across audits", () => {
    const audits = createMockAudits({
      "modern-image-formats": {
        details: { type: "table",
          items: [{ url: "https://example.com/hero.jpg", totalBytes: 500000, wastedBytes: 200000 }],
        },
      },
      "uses-responsive-images": {
        details: { type: "table",
          items: [{ url: "https://example.com/hero.jpg", totalBytes: 500000, wastedBytes: 150000 }],
        },
      },
    });

    const issues = extractImageIssues(audits);

    // Should only have one entry for hero.jpg (first one wins)
    expect(issues).toHaveLength(1);
    expect(issues[0].url).toBe("https://example.com/hero.jpg");
  });

  it("should sort by wasted bytes descending", () => {
    const audits = createMockAudits({
      "modern-image-formats": {
        details: { type: "table",
          items: [
            { url: "https://example.com/small.jpg", totalBytes: 100000, wastedBytes: 50000 },
            { url: "https://example.com/large.jpg", totalBytes: 500000, wastedBytes: 300000 },
          ],
        },
      },
    });

    const issues = extractImageIssues(audits);

    expect(issues[0].wastedBytes).toBe(300000);
    expect(issues[1].wastedBytes).toBe(50000);
  });
});

describe("extractUnusedCode", () => {
  it("should return empty array when audit is missing", () => {
    const audits = {} as Record<string, LighthouseAudit>;
    expect(extractUnusedCode(audits, "unused-javascript", "example.com")).toEqual([]);
  });

  it("should extract unused JavaScript", () => {
    const audits = createMockAudits({
      "unused-javascript": {
        details: { type: "table",
          items: [
            { url: "https://example.com/app.js", totalBytes: 100000, wastedBytes: 40000 },
          ],
        },
      },
    });

    const issues = extractUnusedCode(audits, "unused-javascript", "example.com");

    expect(issues).toHaveLength(1);
    expect(issues[0].wastedPercent).toBe(40);
    expect(issues[0].isFirstParty).toBe(true);
  });

  it("should extract unused CSS", () => {
    const audits = createMockAudits({
      "unused-css-rules": {
        details: { type: "table",
          items: [
            { url: "https://cdn.external.com/styles.css", totalBytes: 50000, wastedBytes: 30000 },
          ],
        },
      },
    });

    const issues = extractUnusedCode(audits, "unused-css-rules", "example.com");

    expect(issues).toHaveLength(1);
    expect(issues[0].wastedPercent).toBe(60);
    expect(issues[0].isFirstParty).toBe(false);
  });

  it("should handle zero transfer size", () => {
    const audits = createMockAudits({
      "unused-javascript": {
        details: { type: "table",
          items: [{ url: "https://example.com/empty.js", totalBytes: 0, wastedBytes: 0 }],
        },
      },
    });

    const issues = extractUnusedCode(audits, "unused-javascript", "example.com");

    expect(issues).toHaveLength(1);
    expect(issues[0].wastedPercent).toBe(0);
  });
});

describe("extractLegacyJavaScript", () => {
  it("should return empty array when audit is missing", () => {
    const audits = {} as Record<string, LighthouseAudit>;
    expect(extractLegacyJavaScript(audits)).toEqual([]);
  });

  it("should extract legacy JavaScript with polyfills", () => {
    const audits = createMockAudits({
      "legacy-javascript": {
        details: { type: "table",
          items: [
            {
              url: "https://example.com/bundle.js",
              wastedBytes: 50000,
              subItems: {
                items: [{ signal: "Array.from" }, { signal: "Object.assign" }],
              },
            },
          ],
        },
      },
    });

    const issues = extractLegacyJavaScript(audits);

    expect(issues).toHaveLength(1);
    expect(issues[0].polyfills).toContain("Array.from");
    expect(issues[0].polyfills).toContain("Object.assign");
  });

  it("should handle missing subItems", () => {
    const audits = createMockAudits({
      "legacy-javascript": {
        details: { type: "table",
          items: [{ url: "https://example.com/bundle.js", wastedBytes: 50000 }],
        },
      },
    });

    const issues = extractLegacyJavaScript(audits);

    expect(issues).toHaveLength(1);
    expect(issues[0].polyfills).toHaveLength(0);
  });
});

describe("extractThirdParties", () => {
  it("should return empty array when audit is missing", () => {
    const audits = {} as Record<string, LighthouseAudit>;
    expect(extractThirdParties(audits)).toEqual([]);
  });

  it("should extract third-party information", () => {
    const audits = createMockAudits({
      "third-party-summary": {
        details: { type: "table",
          items: [
            {
              entity: "Google Analytics",
              blockingTime: 150,
              transferSize: 50000,
              subItems: {
                items: [
                  { url: "https://www.google-analytics.com/analytics.js" },
                  { url: "https://www.google-analytics.com/gtm.js" },
                ],
              },
            },
          ],
        },
      },
    });

    const issues = extractThirdParties(audits);

    expect(issues).toHaveLength(1);
    expect(issues[0].entity).toBe("Google Analytics");
    expect(issues[0].blockingTime).toBe(150);
    expect(issues[0].requestCount).toBe(2);
  });

  it("should sort by blocking time descending", () => {
    const audits = createMockAudits({
      "third-party-summary": {
        details: { type: "table",
          items: [
            { entity: "Low Impact", blockingTime: 50, transferSize: 20000 },
            { entity: "High Impact", blockingTime: 500, transferSize: 100000 },
          ],
        },
      },
    });

    const issues = extractThirdParties(audits);

    expect(issues[0].entity).toBe("High Impact");
    expect(issues[1].entity).toBe("Low Impact");
  });
});

describe("extractLongTasks", () => {
  it("should return empty array when audit is missing", () => {
    const audits = {} as Record<string, LighthouseAudit>;
    expect(extractLongTasks(audits)).toEqual([]);
  });

  it("should extract long tasks", () => {
    const audits = createMockAudits({
      "long-tasks": {
        details: { type: "table",
          items: [
            { duration: 150, startTime: 1000, url: "https://example.com/app.js" },
            { duration: 200, startTime: 2000 },
          ],
        },
      },
    });

    const tasks = extractLongTasks(audits);

    expect(tasks).toHaveLength(2);
    expect(tasks[0].duration).toBe(200); // Sorted by duration desc
    expect(tasks[1].duration).toBe(150);
  });
});

describe("extractRenderBlockingResources", () => {
  it("should return empty array when audit is missing", () => {
    const audits = {} as Record<string, LighthouseAudit>;
    expect(extractRenderBlockingResources(audits)).toEqual([]);
  });

  it("should extract render-blocking resources", () => {
    const audits = createMockAudits({
      "render-blocking-resources": {
        details: { type: "table",
          items: [
            { url: "https://example.com/styles.css", transferSize: 50000, wastedMs: 300 },
            { url: "https://example.com/script.js", transferSize: 100000, wastedMs: 500 },
          ],
        },
      },
    });

    const resources = extractRenderBlockingResources(audits);

    expect(resources).toHaveLength(2);
    expect(resources[0].wastedMs).toBe(500); // Sorted by wastedMs desc
    expect(resources[0].resourceType).toBe("script");
    expect(resources[1].resourceType).toBe("stylesheet");
  });

  it("should detect resource types from URL", () => {
    const audits = createMockAudits({
      "render-blocking-resources": {
        details: { type: "table",
          items: [
            { url: "https://example.com/styles.css", transferSize: 50000, wastedMs: 300 },
            { url: "https://example.com/app.js", transferSize: 100000, wastedMs: 500 },
            { url: "https://example.com/unknown", transferSize: 20000, wastedMs: 100 },
          ],
        },
      },
    });

    const resources = extractRenderBlockingResources(audits);

    expect(resources.find((r) => r.url.includes("css"))?.resourceType).toBe("stylesheet");
    expect(resources.find((r) => r.url.includes("js"))?.resourceType).toBe("script");
    expect(resources.find((r) => r.url.includes("unknown"))?.resourceType).toBe("other");
  });
});

describe("extractLCPBreakdown", () => {
  it("should return undefined when audit is missing", () => {
    const audits = {} as Record<string, LighthouseAudit>;
    expect(extractLCPBreakdown(audits)).toBeUndefined();
  });

  it("should return undefined when LCP audit has no numericValue", () => {
    const audits = createMockAudits({
      "largest-contentful-paint": {},
    });
    expect(extractLCPBreakdown(audits)).toBeUndefined();
  });

  it("should extract LCP breakdown from audits", () => {
    const audits = createMockAudits({
      "largest-contentful-paint": {
        numericValue: 2500,
      },
      "first-contentful-paint": {
        numericValue: 1200,
      },
      "server-response-time": {
        numericValue: 200,
      },
    });

    const breakdown = extractLCPBreakdown(audits);

    expect(breakdown).toBeDefined();
    expect(breakdown?.ttfb).toBe(200);
    expect(breakdown?.total).toBe(2500);
    expect(breakdown?.resourceLoadDelay).toBe(1000); // fcp - ttfb = 1200 - 200
  });

  it("should handle missing FCP and TTFB audits", () => {
    const audits = createMockAudits({
      "largest-contentful-paint": {
        numericValue: 2500,
      },
    });

    const breakdown = extractLCPBreakdown(audits);

    expect(breakdown).toBeDefined();
    expect(breakdown?.ttfb).toBe(0);
    expect(breakdown?.total).toBe(2500);
  });
});
