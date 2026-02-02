/**
 * Tests for LCP Analysis Functions
 */

import {
  detectLCPType,
  detectLoadingMechanism,
  generateLCPRecommendations,
  generateEnhancedLCP,
} from "../src/report/lcp";
import type { PerformanceResult, ProjectContext, LCPElement, LCPBreakdown } from "../src/types";

describe("detectLCPType", () => {
  it("should return 'image' for img elements", () => {
    const lcpElement: LCPElement = {
      tagName: "IMG",
      selector: "img.hero",
      url: "https://example.com/hero.jpg",
    };
    expect(detectLCPType(lcpElement)).toBe("image");
  });

  it("should return 'image' for svg elements", () => {
    const lcpElement: LCPElement = {
      tagName: "SVG",
      selector: "svg.logo",
    };
    expect(detectLCPType(lcpElement)).toBe("image");
  });

  it("should return 'video' for video elements", () => {
    const lcpElement: LCPElement = {
      tagName: "VIDEO",
      selector: "video.hero-video",
    };
    expect(detectLCPType(lcpElement)).toBe("video");
  });

  it("should return 'background-image' when URL contains image extension", () => {
    const lcpElement: LCPElement = {
      tagName: "DIV",
      selector: "div.hero-bg",
      url: "https://example.com/bg.webp",
    };
    expect(detectLCPType(lcpElement)).toBe("background-image");
  });

  it("should detect background images with various extensions", () => {
    const extensions = ["jpg", "jpeg", "png", "gif", "webp", "avif", "svg"];

    for (const ext of extensions) {
      const lcpElement: LCPElement = {
        tagName: "DIV",
        selector: "div.hero",
        url: `https://example.com/image.${ext}`,
      };
      expect(detectLCPType(lcpElement)).toBe("background-image");
    }
  });

  it("should return 'text' for text elements", () => {
    const textElements = ["h1", "h2", "h3", "p", "span", "div"];

    for (const tag of textElements) {
      const lcpElement: LCPElement = {
        tagName: tag.toUpperCase(),
        selector: `${tag}.main`,
      };
      // div without image URL should be text
      if (tag !== "div") {
        expect(detectLCPType(lcpElement)).toBe("text");
      }
    }
  });

  it("should return 'unknown' for null/undefined lcpElement", () => {
    expect(detectLCPType(undefined)).toBe("unknown");
    expect(detectLCPType(null as unknown as LCPElement)).toBe("unknown");
  });

  it("should return 'unknown' for unrecognized elements", () => {
    const lcpElement: LCPElement = {
      tagName: "CANVAS",
      selector: "canvas.chart",
    };
    expect(detectLCPType(lcpElement)).toBe("unknown");
  });
});

describe("detectLoadingMechanism", () => {
  it("should return 'lazy' when loading=lazy is in snippet", () => {
    const lcpElement: LCPElement = {
      tagName: "IMG",
      selector: "img.hero",
      snippet: '<img src="hero.jpg" loading="lazy" alt="Hero">',
    };
    expect(detectLoadingMechanism(lcpElement)).toBe("lazy");
  });

  it("should return 'priority' when fetchpriority is in snippet", () => {
    const lcpElement: LCPElement = {
      tagName: "IMG",
      selector: "img.hero",
      snippet: '<img src="hero.jpg" fetchpriority="high" alt="Hero">',
    };
    expect(detectLoadingMechanism(lcpElement)).toBe("priority");
  });

  it("should return 'priority' when priority attribute is in snippet", () => {
    const lcpElement: LCPElement = {
      tagName: "IMG",
      selector: "img.hero",
      snippet: '<Image src="hero.jpg" priority alt="Hero">',
    };
    expect(detectLoadingMechanism(lcpElement)).toBe("priority");
  });

  it("should return 'deferred' when defer is in snippet", () => {
    const lcpElement: LCPElement = {
      tagName: "SCRIPT",
      selector: "script",
      snippet: '<script src="app.js" defer></script>',
    };
    expect(detectLoadingMechanism(lcpElement)).toBe("deferred");
  });

  it("should return 'eager' for normal elements without special attributes", () => {
    const lcpElement: LCPElement = {
      tagName: "IMG",
      selector: "img.hero",
      snippet: '<img src="hero.jpg" alt="Hero">',
    };
    expect(detectLoadingMechanism(lcpElement)).toBe("eager");
  });

  it("should return 'unknown' when no snippet is provided", () => {
    const lcpElement: LCPElement = {
      tagName: "IMG",
      selector: "img.hero",
    };
    expect(detectLoadingMechanism(lcpElement)).toBe("unknown");
  });

  it("should return 'unknown' for null/undefined lcpElement", () => {
    expect(detectLoadingMechanism(undefined)).toBe("unknown");
    expect(detectLoadingMechanism(null as unknown as LCPElement)).toBe("unknown");
  });
});

describe("generateLCPRecommendations", () => {
  it("should add priority hint recommendation for images", () => {
    const recommendations = generateLCPRecommendations("image", undefined, 3000, null);

    expect(recommendations.some((r) => r.id === "lcp-priority-hint")).toBe(true);
    const priorityRec = recommendations.find((r) => r.id === "lcp-priority-hint");
    expect(priorityRec?.impact).toBe("high");
    expect(priorityRec?.effort).toBe("easy");
  });

  it("should add Next.js specific recommendation for Next.js projects", () => {
    const context: ProjectContext = {
      framework: {
        name: "next",
        version: "14.0.0",
        routerType: "app",
        renderingMode: "hybrid",
      },
      packageManager: "npm",
      buildTool: "turbopack",
      isTypeScript: true,
      analytics: [],
      thirdPartyIntegrations: [],
      dependencies: { production: [], development: [], total: 0 },
    };

    const recommendations = generateLCPRecommendations("image", undefined, 3000, context);

    expect(recommendations.some((r) => r.id === "lcp-next-image-priority")).toBe(true);
  });

  it("should not add Next.js recommendation for non-Next.js projects", () => {
    const context: ProjectContext = {
      framework: {
        name: "react",
        version: "18.0.0",
        renderingMode: "spa",
      },
      packageManager: "npm",
      buildTool: "vite",
      isTypeScript: true,
      analytics: [],
      thirdPartyIntegrations: [],
      dependencies: { production: [], development: [], total: 0 },
    };

    const recommendations = generateLCPRecommendations("image", undefined, 3000, context);

    expect(recommendations.some((r) => r.id === "lcp-next-image-priority")).toBe(false);
  });

  it("should add TTFB recommendation when TTFB is high", () => {
    const breakdown: LCPBreakdown = {
      ttfb: 1000,
      resourceLoadDelay: 200,
      resourceLoadDuration: 300,
      elementRenderDelay: 100,
      total: 1600,
    };

    const recommendations = generateLCPRecommendations("text", breakdown, 3000, null);

    expect(recommendations.some((r) => r.id === "lcp-reduce-ttfb")).toBe(true);
    const ttfbRec = recommendations.find((r) => r.id === "lcp-reduce-ttfb");
    expect(ttfbRec?.description).toContain("1000ms");
  });

  it("should add preload recommendation when resource load delay is high", () => {
    const breakdown: LCPBreakdown = {
      ttfb: 200,
      resourceLoadDelay: 800,
      resourceLoadDuration: 300,
      elementRenderDelay: 100,
      total: 1400,
    };

    const recommendations = generateLCPRecommendations("image", breakdown, 3000, null);

    expect(recommendations.some((r) => r.id === "lcp-preload")).toBe(true);
    const preloadRec = recommendations.find((r) => r.id === "lcp-preload");
    expect(preloadRec?.description).toContain("800ms");
  });

  it("should add render delay recommendation when element render delay is high", () => {
    const breakdown: LCPBreakdown = {
      ttfb: 200,
      resourceLoadDelay: 200,
      resourceLoadDuration: 300,
      elementRenderDelay: 500,
      total: 1200,
    };

    const recommendations = generateLCPRecommendations("image", breakdown, 3000, null);

    expect(recommendations.some((r) => r.id === "lcp-reduce-render-delay")).toBe(true);
  });

  it("should add critical CSS recommendation when LCP is very high", () => {
    const recommendations = generateLCPRecommendations("text", undefined, 4500, null);

    expect(recommendations.some((r) => r.id === "lcp-critical-css")).toBe(true);
    const cssRec = recommendations.find((r) => r.id === "lcp-critical-css");
    expect(cssRec?.impact).toBe("high");
  });

  it("should have medium impact for critical CSS when LCP is moderately high", () => {
    const recommendations = generateLCPRecommendations("text", undefined, 3000, null);

    const cssRec = recommendations.find((r) => r.id === "lcp-critical-css");
    expect(cssRec?.impact).toBe("medium");
  });
});

describe("generateEnhancedLCP", () => {
  const createBaseResult = (): PerformanceResult => ({
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
  });

  it("should return undefined when no lcpElement is present", () => {
    const result = createBaseResult();
    const enhanced = generateEnhancedLCP(result, null);
    expect(enhanced).toBeUndefined();
  });

  it("should generate enhanced LCP element with type detection", () => {
    const result = createBaseResult();
    result.lcpElement = {
      tagName: "IMG",
      selector: "img.hero-image",
      url: "https://example.com/hero.jpg",
      snippet: '<img src="hero.jpg" alt="Hero">',
    };

    const enhanced = generateEnhancedLCP(result, null);

    expect(enhanced).toBeDefined();
    expect(enhanced?.type).toBe("image");
    expect(enhanced?.tagName).toBe("IMG");
    expect(enhanced?.selector).toBe("img.hero-image");
  });

  it("should include recommendations in enhanced LCP", () => {
    const result = createBaseResult();
    result.lcpElement = {
      tagName: "IMG",
      selector: "img.hero",
      url: "https://example.com/hero.jpg",
    };
    result.metrics.lcp.value = 3500;

    const enhanced = generateEnhancedLCP(result, null);

    expect(enhanced?.recommendations).toBeDefined();
    expect(enhanced?.recommendations.length).toBeGreaterThan(0);
  });

  it("should include framework-specific recommendations when context is provided", () => {
    const result = createBaseResult();
    result.lcpElement = {
      tagName: "IMG",
      selector: "img.hero",
      url: "https://example.com/hero.jpg",
    };

    const context: ProjectContext = {
      framework: {
        name: "next",
        version: "14.0.0",
        routerType: "app",
        renderingMode: "hybrid",
      },
      packageManager: "npm",
      buildTool: "turbopack",
      isTypeScript: true,
      analytics: [],
      thirdPartyIntegrations: [],
      dependencies: { production: [], development: [], total: 0 },
    };

    const enhanced = generateEnhancedLCP(result, context);

    const nextRec = enhanced?.recommendations.find(
      (r) => r.id === "lcp-next-image-priority"
    );
    expect(nextRec).toBeDefined();
  });
});
