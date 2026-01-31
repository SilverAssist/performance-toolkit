/**
 * Tests for PageSpeed Client
 */

import { PageSpeedClient } from "../src/pagespeed";

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Sample PageSpeed API response
const mockPageSpeedResponse = {
  id: "https://example.com/",
  loadingExperience: {
    initial_url: "https://example.com/",
    overall_category: "AVERAGE",
    metrics: {},
  },
  lighthouseResult: {
    lighthouseVersion: "11.0.0",
    requestedUrl: "https://example.com/",
    finalUrl: "https://example.com/",
    fetchTime: "2026-01-30T10:00:00.000Z",
    categories: {
      performance: { id: "performance", title: "Performance", score: 0.85 },
      accessibility: { id: "accessibility", title: "Accessibility", score: 0.92 },
      "best-practices": { id: "best-practices", title: "Best Practices", score: 0.88 },
      seo: { id: "seo", title: "SEO", score: 0.95 },
    },
    audits: {
      "largest-contentful-paint": {
        id: "largest-contentful-paint",
        title: "Largest Contentful Paint",
        score: 0.8,
        numericValue: 2500,
        displayValue: "2.5 s",
      },
      "first-contentful-paint": {
        id: "first-contentful-paint",
        title: "First Contentful Paint",
        score: 0.9,
        numericValue: 1200,
        displayValue: "1.2 s",
      },
      "cumulative-layout-shift": {
        id: "cumulative-layout-shift",
        title: "Cumulative Layout Shift",
        score: 0.95,
        numericValue: 0.05,
        displayValue: "0.05",
      },
      "total-blocking-time": {
        id: "total-blocking-time",
        title: "Total Blocking Time",
        score: 0.7,
        numericValue: 350,
        displayValue: "350 ms",
      },
      "speed-index": {
        id: "speed-index",
        title: "Speed Index",
        score: 0.85,
        numericValue: 2000,
        displayValue: "2.0 s",
      },
      interactive: {
        id: "interactive",
        title: "Time to Interactive",
        score: 0.75,
        numericValue: 3500,
        displayValue: "3.5 s",
      },
    },
  },
  analysisUTCTimestamp: "2026-01-30T10:00:00.000Z",
};

describe("PageSpeedClient", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockPageSpeedResponse),
    });
  });

  describe("constructor", () => {
    it("should create instance without API key", () => {
      const client = new PageSpeedClient();
      expect(client).toBeInstanceOf(PageSpeedClient);
    });

    it("should create instance with API key", () => {
      const client = new PageSpeedClient("test-api-key");
      expect(client).toBeInstanceOf(PageSpeedClient);
    });
  });

  describe("analyze", () => {
    it("should analyze URL and return performance result", async () => {
      const client = new PageSpeedClient();
      const result = await client.analyze({ url: "https://example.com" });

      expect(result.url).toBe("https://example.com");
      expect(result.strategy).toBe("mobile");
      expect(result.scores.performance).toBe(85);
      expect(result.scores.accessibility).toBe(92);
      expect(result.scores.bestPractices).toBe(88);
      expect(result.scores.seo).toBe(95);
    });

    it("should extract Core Web Vitals metrics", async () => {
      const client = new PageSpeedClient();
      const result = await client.analyze({ url: "https://example.com" });

      expect(result.metrics.lcp.value).toBe(2500);
      expect(result.metrics.lcp.displayValue).toBe("2.5 s");
      expect(result.metrics.fcp.value).toBe(1200);
      expect(result.metrics.cls.value).toBe(0.05);
      expect(result.metrics.tbt.value).toBe(350);
    });

    it("should use desktop strategy when specified", async () => {
      const client = new PageSpeedClient();
      await client.analyze({ url: "https://example.com", strategy: "desktop" });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("strategy=DESKTOP"),
        expect.any(Object)
      );
    });

    it("should include API key in request when provided", async () => {
      const client = new PageSpeedClient("my-api-key");
      await client.analyze({ url: "https://example.com" });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("key=my-api-key"),
        expect.any(Object)
      );
    });

    it("should include categories in request", async () => {
      const client = new PageSpeedClient();
      await client.analyze({
        url: "https://example.com",
        categories: ["performance", "accessibility"],
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("category=PERFORMANCE"),
        expect.any(Object)
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("category=ACCESSIBILITY"),
        expect.any(Object)
      );
    });

    it("should throw error on API failure", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      });

      const client = new PageSpeedClient();
      await expect(client.analyze({ url: "https://example.com" })).rejects.toThrow(
        "PageSpeed API error: 500 Internal Server Error"
      );
    });
  });

  describe("analyzeAll", () => {
    it("should analyze both mobile and desktop strategies", async () => {
      const client = new PageSpeedClient();
      const { mobile, desktop } = await client.analyzeAll("https://example.com");

      expect(mobile.strategy).toBe("mobile");
      expect(desktop.strategy).toBe("desktop");
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });
});

describe("Metric rating extraction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should rate metric as good when score >= 0.9", async () => {
    const response = { ...mockPageSpeedResponse };
    response.lighthouseResult.audits["largest-contentful-paint"].score = 0.95;

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(response),
    });

    const client = new PageSpeedClient();
    const result = await client.analyze({ url: "https://example.com" });

    expect(result.metrics.lcp.rating).toBe("good");
  });

  it("should rate metric as needs-improvement when score >= 0.5", async () => {
    const response = { ...mockPageSpeedResponse };
    response.lighthouseResult.audits["largest-contentful-paint"].score = 0.6;

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(response),
    });

    const client = new PageSpeedClient();
    const result = await client.analyze({ url: "https://example.com" });

    expect(result.metrics.lcp.rating).toBe("needs-improvement");
  });

  it("should rate metric as poor when score < 0.5", async () => {
    const response = { ...mockPageSpeedResponse };
    response.lighthouseResult.audits["largest-contentful-paint"].score = 0.3;

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(response),
    });

    const client = new PageSpeedClient();
    const result = await client.analyze({ url: "https://example.com" });

    expect(result.metrics.lcp.rating).toBe("poor");
  });
});
