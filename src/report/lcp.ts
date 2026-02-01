/**
 * @silverassist/performance-toolkit
 *
 * LCP analysis and framework-specific recommendations.
 *
 * @module report/lcp
 * @author Miguel Colmenares <me@miguelcolmenares.com>
 * @license PolyForm-Noncommercial-1.0.0
 */

import type {
  EnhancedLCPElement,
  LCPBreakdown,
  LCPRecommendation,
  PerformanceResult,
  ProjectContext,
} from "../types";

/**
 * Detects LCP element type from element info
 */
export function detectLCPType(
  lcpElement: PerformanceResult["lcpElement"],
): EnhancedLCPElement["type"] {
  if (!lcpElement) return "unknown";

  const tag = lcpElement.tagName.toLowerCase();
  if (tag === "img") return "image";
  if (tag === "video") return "video";
  if (tag === "svg") return "image";
  if (lcpElement.url?.match(/\.(jpg|jpeg|png|gif|webp|avif|svg)/i))
    return "background-image";
  if (["h1", "h2", "h3", "p", "span", "div"].includes(tag)) return "text";

  return "unknown";
}

/**
 * Detects loading mechanism from element snippet
 */
export function detectLoadingMechanism(
  lcpElement: PerformanceResult["lcpElement"],
): EnhancedLCPElement["loadingMechanism"] {
  if (!lcpElement?.snippet) return "unknown";

  const snippet = lcpElement.snippet.toLowerCase();
  if (snippet.includes('loading="lazy"')) return "lazy";
  if (snippet.includes("fetchpriority") || snippet.includes("priority"))
    return "priority";
  if (snippet.includes("defer")) return "deferred";

  return "eager";
}

/**
 * Generates LCP-specific recommendations based on type and breakdown
 */
export function generateLCPRecommendations(
  type: EnhancedLCPElement["type"],
  breakdown: LCPBreakdown | undefined,
  lcpValue: number | undefined,
  context: ProjectContext | null,
): LCPRecommendation[] {
  const recommendations: LCPRecommendation[] = [];

  // Type-specific recommendations
  if (type === "image") {
    recommendations.push({
      id: "lcp-priority-hint",
      title: "Add priority hint to LCP image",
      description:
        'Use fetchpriority="high" on the LCP image to prioritize its loading.',
      impact: "high",
      effort: "easy",
      codeHints: ['<img src="..." fetchpriority="high" />'],
    });

    if (context?.framework?.name === "next") {
      recommendations.push({
        id: "lcp-next-image-priority",
        title: "Use Next.js Image with priority",
        description:
          "Use next/image component with priority prop for the LCP image.",
        impact: "high",
        effort: "easy",
        codeHints: ['<Image src="..." priority />'],
      });
    }
  }

  // Breakdown-based recommendations
  if (breakdown) {
    if (breakdown.ttfb > 800) {
      recommendations.push({
        id: "lcp-reduce-ttfb",
        title: "Reduce server response time (TTFB)",
        description: `TTFB is ${breakdown.ttfb}ms. Consider using a CDN, optimizing server logic, or implementing edge caching.`,
        impact: "high",
        effort: "moderate",
      });
    }

    if (breakdown.resourceLoadDelay > 500) {
      recommendations.push({
        id: "lcp-preload",
        title: "Preload the LCP resource",
        description: `The LCP resource has ${breakdown.resourceLoadDelay}ms load delay. Use <link rel="preload"> to start loading earlier.`,
        impact: "medium",
        effort: "easy",
        codeHints: ['<link rel="preload" href="..." as="image" />'],
      });
    }

    if (breakdown.elementRenderDelay > 300) {
      recommendations.push({
        id: "lcp-reduce-render-delay",
        title: "Reduce render-blocking resources",
        description: `Element render is delayed by ${breakdown.elementRenderDelay}ms. Remove or defer render-blocking CSS/JS.`,
        impact: "medium",
        effort: "moderate",
      });
    }
  }

  // General LCP recommendations
  if (lcpValue && lcpValue > 2500) {
    recommendations.push({
      id: "lcp-critical-css",
      title: "Inline critical CSS",
      description:
        "Extract and inline the CSS needed for above-the-fold content to avoid render blocking.",
      impact: lcpValue > 4000 ? "high" : "medium",
      effort: "moderate",
    });
  }

  return recommendations;
}

/**
 * Generates enhanced LCP element information with recommendations
 */
export function generateEnhancedLCP(
  result: PerformanceResult,
  context: ProjectContext | null,
): EnhancedLCPElement | undefined {
  const { lcpElement, insights, metrics } = result;
  if (!lcpElement) return undefined;

  const type = detectLCPType(lcpElement);
  const recommendations = generateLCPRecommendations(
    type,
    insights?.lcpBreakdown,
    metrics.lcp.value,
    context,
  );

  return {
    ...lcpElement,
    type,
    loadingMechanism: detectLoadingMechanism(lcpElement),
    isAboveTheFold: true, // LCP is by definition above-the-fold
    recommendations,
    timing: insights?.lcpBreakdown
      ? {
          requestStart: insights.lcpBreakdown.ttfb,
          loadEnd:
            insights.lcpBreakdown.ttfb +
            insights.lcpBreakdown.resourceLoadDelay +
            insights.lcpBreakdown.resourceLoadDuration,
          renderTime: insights.lcpBreakdown.elementRenderDelay,
        }
      : undefined,
  };
}
