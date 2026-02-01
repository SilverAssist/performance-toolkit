/**
 * @silverassist/performance-toolkit
 *
 * Key opportunities generation with framework-specific guidance.
 *
 * @module report/opportunities
 * @author Miguel Colmenares <me@miguelcolmenares.com>
 * @license PolyForm-Noncommercial-1.0.0
 */

import type {
  ActionStep,
  FrameworkSpecificNote,
  KeyOpportunity,
  PerformanceResult,
  ProjectContext,
} from "../types";
import { formatBytes } from "./utils";
import { detectLCPType } from "./lcp";

/**
 * Generates ranked key opportunities with framework-specific guidance
 */
export function generateKeyOpportunities(
  result: PerformanceResult,
  context: ProjectContext | null,
): KeyOpportunity[] {
  const opportunities: KeyOpportunity[] = [];
  const { insights, metrics } = result;

  // Opportunity 1: LCP Optimization
  if (metrics.lcp.rating !== "good") {
    opportunities.push(createLCPOpportunity(result, context));
  }

  // Opportunity 2: JavaScript Optimization
  const jsWaste =
    insights?.unusedJavaScript?.reduce((sum, js) => sum + js.wastedBytes, 0) ??
    0;
  if (jsWaste > 100000) {
    opportunities.push(createJavaScriptOpportunity(result, context, jsWaste));
  }

  // Opportunity 3: Image Optimization
  const imgWaste =
    insights?.imageIssues?.reduce((sum, img) => sum + img.wastedBytes, 0) ?? 0;
  if (imgWaste > 50000) {
    opportunities.push(createImageOpportunity(result, context, imgWaste));
  }

  // Opportunity 4: Third-Party Script Management
  const tpBlocking =
    insights?.thirdParties?.reduce((sum, tp) => sum + tp.blockingTime, 0) ?? 0;
  if (tpBlocking > 250) {
    opportunities.push(
      createThirdPartyOpportunity(result, context, tpBlocking),
    );
  }

  // Opportunity 5: Render-Blocking Resources
  const rbWaste =
    insights?.renderBlocking?.reduce((sum, rb) => sum + rb.wastedMs, 0) ?? 0;
  if (rbWaste > 200) {
    opportunities.push(createRenderBlockingOpportunity(rbWaste));
  }

  // Opportunity 6: CLS Improvement
  if (metrics.cls.rating !== "good") {
    opportunities.push(createCLSOpportunity(result));
  }

  // Sort by priority and return
  return opportunities.sort((a, b) => a.priority - b.priority);
}

/**
 * Creates LCP optimization opportunity
 */
export function createLCPOpportunity(
  result: PerformanceResult,
  context: ProjectContext | null,
): KeyOpportunity {
  const { metrics, lcpElement, insights } = result;
  const lcpType = lcpElement ? detectLCPType(lcpElement) : "unknown";

  const steps: ActionStep[] = [];
  const frameworkNotes: FrameworkSpecificNote[] = [];

  // Step 1: Identify LCP element
  steps.push({
    order: 1,
    title: "Identify and understand your LCP element",
    instructions: `Your LCP element is a ${lcpType}${lcpElement?.tagName ? ` (${lcpElement.tagName})` : ""}. The current LCP time is ${metrics.lcp.displayValue}.`,
  });

  // Step 2: Add priority hint
  if (lcpType === "image") {
    steps.push({
      order: 2,
      title: "Add priority hint to LCP image",
      instructions:
        'Add fetchpriority="high" to ensure the browser prioritizes loading this image.',
      codeExample: {
        language: "html",
        code: `<img src="${lcpElement?.url || "hero-image.jpg"}" fetchpriority="high" alt="..." />`,
      },
    });

    // Next.js specific
    if (context?.framework?.name === "next") {
      frameworkNotes.push({
        framework: "Next.js",
        note: "Use the Image component with priority prop instead of native img tag.",
        codeExample: `import Image from 'next/image';\n\n<Image\n  src="${lcpElement?.url || "/hero.jpg"}"\n  priority\n  alt="..."\n  width={1200}\n  height={600}\n/>`,
        docLink:
          "https://nextjs.org/docs/app/api-reference/components/image#priority",
      });
    }
  }

  // Step 3: Preload if needed
  if (
    insights?.lcpBreakdown?.resourceLoadDelay &&
    insights.lcpBreakdown.resourceLoadDelay > 300
  ) {
    steps.push({
      order: 3,
      title: "Preload the LCP resource",
      instructions:
        "Add a preload link in the document head to start fetching the resource earlier.",
      codeExample: {
        language: "html",
        code: `<link rel="preload" href="${lcpElement?.url || "/hero.jpg"}" as="${lcpType === "image" ? "image" : "fetch"}" />`,
        filePath: "app/layout.tsx or pages/_document.tsx",
      },
    });
  }

  // Step 4: TTFB optimization
  if (insights?.lcpBreakdown?.ttfb && insights.lcpBreakdown.ttfb > 600) {
    steps.push({
      order: 4,
      title: "Improve server response time",
      instructions: `Your TTFB is ${insights.lcpBreakdown.ttfb}ms. Consider implementing caching, using a CDN, or optimizing your server.`,
      estimatedTime: "2-4 hours",
    });
  }

  return {
    id: "optimize-lcp",
    priority: 1,
    title: "Optimize Largest Contentful Paint (LCP)",
    description: `Your LCP is ${metrics.lcp.displayValue}, rated as "${metrics.lcp.rating}". The target is under 2.5 seconds.`,
    impact: {
      level: metrics.lcp.value > 4000 ? "critical" : "high",
      lcpImprovementMs: Math.max(0, metrics.lcp.value - 2500),
      scoreImprovement: metrics.lcp.rating === "poor" ? 15 : 8,
    },
    steps,
    relatedAudits: [
      "largest-contentful-paint",
      "largest-contentful-paint-element",
    ],
    frameworkNotes: frameworkNotes.length > 0 ? frameworkNotes : undefined,
    resources: [
      { title: "Optimize LCP", url: "https://web.dev/optimize-lcp/" },
      { title: "LCP Guide", url: "https://web.dev/lcp/" },
    ],
  };
}

/**
 * Creates JavaScript optimization opportunity
 */
export function createJavaScriptOpportunity(
  result: PerformanceResult,
  context: ProjectContext | null,
  wastedBytes: number,
): KeyOpportunity {
  const steps: ActionStep[] = [];
  const frameworkNotes: FrameworkSpecificNote[] = [];
  const firstPartyWaste =
    result.insights?.unusedJavaScript
      ?.filter((js) => js.isFirstParty)
      .reduce((sum, js) => sum + js.wastedBytes, 0) ?? 0;

  steps.push({
    order: 1,
    title: "Audit JavaScript bundles",
    instructions:
      "Use webpack-bundle-analyzer or source-map-explorer to identify large modules.",
    codeExample: {
      language: "bash",
      code: "npx source-map-explorer dist/**/*.js",
    },
  });

  if (firstPartyWaste > 50000) {
    steps.push({
      order: 2,
      title: "Implement code splitting",
      instructions:
        "Split your JavaScript into smaller chunks that can be loaded on demand.",
    });

    if (context?.framework?.name === "next") {
      frameworkNotes.push({
        framework: "Next.js",
        note: "Use dynamic imports for components that aren't needed immediately.",
        codeExample: `import dynamic from 'next/dynamic';\n\nconst HeavyComponent = dynamic(() => import('./HeavyComponent'), {\n  loading: () => <p>Loading...</p>,\n  ssr: false, // Optional: disable SSR for client-only components\n});`,
        docLink:
          "https://nextjs.org/docs/app/building-your-application/optimizing/lazy-loading",
      });
    }
  }

  steps.push({
    order: 3,
    title: "Review and remove unused dependencies",
    instructions:
      "Check your package.json for dependencies that are no longer used.",
    codeExample: {
      language: "bash",
      code: "npx depcheck",
    },
  });

  return {
    id: "optimize-javascript",
    priority: 2,
    title: "Reduce JavaScript bundle size",
    description: `${formatBytes(wastedBytes)} of JavaScript is unused. Reducing bundle size improves load time and TBT.`,
    impact: {
      level:
        wastedBytes > 500000
          ? "critical"
          : wastedBytes > 200000
            ? "high"
            : "medium",
      sizeSavings: wastedBytes,
      scoreImprovement: Math.min(15, Math.floor(wastedBytes / 50000)),
    },
    steps,
    relatedAudits: [
      "unused-javascript",
      "bootup-time",
      "mainthread-work-breakdown",
    ],
    frameworkNotes: frameworkNotes.length > 0 ? frameworkNotes : undefined,
    resources: [
      {
        title: "Reduce JavaScript Payloads",
        url: "https://web.dev/reduce-javascript-payloads-with-code-splitting/",
      },
    ],
  };
}

/**
 * Creates image optimization opportunity
 */
export function createImageOpportunity(
  result: PerformanceResult,
  context: ProjectContext | null,
  wastedBytes: number,
): KeyOpportunity {
  const issues = result.insights?.imageIssues ?? [];
  const formatIssues = issues.filter((i) => i.issueType === "format");
  const sizeIssues = issues.filter((i) => i.issueType === "oversized");
  const offscreenIssues = issues.filter((i) => i.issueType === "offscreen");

  const steps: ActionStep[] = [];
  const frameworkNotes: FrameworkSpecificNote[] = [];

  if (formatIssues.length > 0) {
    steps.push({
      order: 1,
      title: "Convert images to modern formats",
      instructions: `${formatIssues.length} images should be converted to WebP or AVIF format for better compression.`,
    });
  }

  if (sizeIssues.length > 0) {
    steps.push({
      order: 2,
      title: "Serve properly sized images",
      instructions: `${sizeIssues.length} images are larger than their display size. Resize images to match their rendered dimensions.`,
    });
  }

  if (offscreenIssues.length > 0) {
    steps.push({
      order: 3,
      title: "Lazy load offscreen images",
      instructions: `${offscreenIssues.length} images are below the fold and should be lazy loaded.`,
      codeExample: {
        language: "html",
        code: '<img src="..." loading="lazy" alt="..." />',
      },
    });
  }

  // Framework-specific notes
  if (context?.framework?.name === "next") {
    frameworkNotes.push({
      framework: "Next.js",
      note: "Next.js Image component automatically handles format conversion, sizing, and lazy loading.",
      codeExample: `import Image from 'next/image';\n\n<Image\n  src="/photo.jpg"\n  alt="Description"\n  width={800}\n  height={600}\n  // priority // Only for above-the-fold images\n/>`,
      docLink:
        "https://nextjs.org/docs/app/building-your-application/optimizing/images",
    });
  }

  return {
    id: "optimize-images",
    priority: 3,
    title: "Optimize images",
    description: `${formatBytes(wastedBytes)} can be saved by properly optimizing ${issues.length} images.`,
    impact: {
      level: wastedBytes > 500000 ? "high" : "medium",
      sizeSavings: wastedBytes,
      lcpImprovementMs: issues.some((i) => i.issueType === "format") ? 200 : 0,
    },
    steps,
    relatedAudits: [
      "modern-image-formats",
      "uses-responsive-images",
      "offscreen-images",
    ],
    frameworkNotes: frameworkNotes.length > 0 ? frameworkNotes : undefined,
    resources: [
      {
        title: "Use Modern Image Formats",
        url: "https://web.dev/uses-webp-images/",
      },
      {
        title: "Properly Size Images",
        url: "https://web.dev/uses-responsive-images/",
      },
    ],
  };
}

/**
 * Creates third-party script opportunity
 */
export function createThirdPartyOpportunity(
  result: PerformanceResult,
  context: ProjectContext | null,
  blockingTime: number,
): KeyOpportunity {
  const thirdParties = result.insights?.thirdParties ?? [];
  const topBlockers = thirdParties.slice(0, 3);

  return {
    id: "optimize-third-parties",
    priority: 4,
    title: "Reduce third-party script impact",
    description: `Third-party scripts block the main thread for ${Math.round(blockingTime)}ms. Top blockers: ${topBlockers.map((t) => t.entity).join(", ")}.`,
    impact: {
      level: blockingTime > 1000 ? "high" : "medium",
      lcpImprovementMs: Math.round(blockingTime * 0.3),
    },
    steps: [
      {
        order: 1,
        title: "Audit third-party scripts",
        instructions:
          "Review each third-party script and determine if it's truly necessary.",
      },
      {
        order: 2,
        title: "Defer non-critical scripts",
        instructions:
          "Load analytics and tracking scripts after the page has finished loading.",
        codeExample: {
          language: "javascript",
          code: `// Load analytics after page load\nwindow.addEventListener('load', () => {\n  // Initialize analytics\n});`,
        },
      },
      {
        order: 3,
        title: "Use Partytown for heavy scripts",
        instructions:
          "Consider using Partytown to run third-party scripts in a web worker.",
      },
    ],
    relatedAudits: ["third-party-summary", "bootup-time"],
    frameworkNotes:
      context?.framework?.name === "next"
        ? [
            {
              framework: "Next.js",
              note: "Use next/script with appropriate strategy to control loading behavior.",
              codeExample: `import Script from 'next/script';\n\n<Script\n  src="https://analytics.example.com"\n  strategy="lazyOnload" // or "afterInteractive"\n/>`,
              docLink:
                "https://nextjs.org/docs/app/building-your-application/optimizing/scripts",
            },
          ]
        : undefined,
  };
}

/**
 * Creates render-blocking resources opportunity
 */
export function createRenderBlockingOpportunity(
  wastedMs: number,
): KeyOpportunity {
  return {
    id: "eliminate-render-blocking",
    priority: 5,
    title: "Eliminate render-blocking resources",
    description: `Render-blocking resources delay first paint by ${Math.round(wastedMs)}ms.`,
    impact: {
      level: wastedMs > 1000 ? "high" : "medium",
      lcpImprovementMs: Math.round(wastedMs * 0.7),
    },
    steps: [
      {
        order: 1,
        title: "Inline critical CSS",
        instructions:
          "Extract CSS needed for above-the-fold content and inline it in the HTML.",
      },
      {
        order: 2,
        title: "Defer non-critical CSS",
        instructions:
          "Load non-critical CSS asynchronously using media queries or JavaScript.",
        codeExample: {
          language: "html",
          code: '<link rel="stylesheet" href="non-critical.css" media="print" onload="this.media=\'all\'">',
        },
      },
      {
        order: 3,
        title: "Add async/defer to scripts",
        instructions:
          "Non-critical scripts should use async or defer attributes.",
        codeExample: {
          language: "html",
          code: '<script src="app.js" defer></script>',
        },
      },
    ],
    relatedAudits: ["render-blocking-resources", "critical-request-chains"],
  };
}

/**
 * Creates CLS improvement opportunity
 */
export function createCLSOpportunity(
  result: PerformanceResult,
): KeyOpportunity {
  const { metrics } = result;

  return {
    id: "improve-cls",
    priority: 6,
    title: "Improve Cumulative Layout Shift (CLS)",
    description: `Your CLS is ${metrics.cls.displayValue}, rated as "${metrics.cls.rating}". Target is under 0.1.`,
    impact: {
      level: metrics.cls.value > 0.25 ? "high" : "medium",
      scoreImprovement: 5,
    },
    steps: [
      {
        order: 1,
        title: "Set explicit dimensions on images and videos",
        instructions:
          "Always specify width and height attributes on media elements.",
        codeExample: {
          language: "html",
          code: '<img src="..." width="800" height="600" alt="..." />',
        },
      },
      {
        order: 2,
        title: "Reserve space for dynamic content",
        instructions:
          "Use CSS to reserve space for ads, embeds, and dynamically injected content.",
      },
      {
        order: 3,
        title: "Avoid inserting content above existing content",
        instructions:
          "New content should be inserted below the current viewport or with user action.",
      },
      {
        order: 4,
        title: "Use CSS transform for animations",
        instructions:
          "Prefer transform and opacity for animations instead of properties that trigger layout.",
      },
    ],
    relatedAudits: ["cumulative-layout-shift", "unsized-images"],
    resources: [
      { title: "Optimize CLS", url: "https://web.dev/optimize-cls/" },
    ],
  };
}
