/**
 * Actionable Report Generator
 *
 * Combines PageSpeed/Lighthouse data with project context to generate
 * contextual, framework-aware performance recommendations.
 *
 * @packageDocumentation
 */

import type {
  ActionableReport,
  ActionStep,
  DiagnosticItem,
  EnhancedLCPElement,
  FrameworkSpecificNote,
  KeyOpportunity,
  LCPBreakdown,
  LCPRecommendation,
  NextStep,
  PerformanceResult,
  ProjectContext,
} from "../types";

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
    const diagnosticsTable = this.generateDiagnosticsTable();
    const enhancedLCP = this.generateEnhancedLCP();
    const keyOpportunities = this.generateKeyOpportunities();
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

  // ===========================================================================
  // Diagnostics Table Generation
  // ===========================================================================

  /**
   * Generates enhanced diagnostics table similar to PageSpeed Insights
   */
  private generateDiagnosticsTable(): DiagnosticItem[] {
    const items: DiagnosticItem[] = [];
    const { insights, opportunities, diagnostics } = this.result;

    // Unused JavaScript
    if (insights?.unusedJavaScript?.length) {
      const totalWasted = insights.unusedJavaScript.reduce((sum, js) => sum + js.wastedBytes, 0);
      items.push({
        id: "unused-javascript",
        title: "Reduce unused JavaScript",
        displayValue: `Est savings of ${this.formatBytes(totalWasted)}`,
        description: "Remove unused JavaScript to reduce bytes consumed by network activity and improve page load performance.",
        score: this.calculateScore(totalWasted, 150000, 500000),
        severity: this.getSeverityByBytes(totalWasted),
        savings: { bytes: totalWasted },
        items: insights.unusedJavaScript.slice(0, 10).map(js => ({
          url: js.url,
          size: js.transferSize,
          wastedBytes: js.wastedBytes,
          metadata: { 
            isFirstParty: js.isFirstParty,
            wastedPercent: js.wastedPercent,
            entity: js.entity,
          },
        })),
        category: "javascript",
      });
    }

    // Unused CSS
    if (insights?.unusedCSS?.length) {
      const totalWasted = insights.unusedCSS.reduce((sum, css) => sum + css.wastedBytes, 0);
      items.push({
        id: "unused-css",
        title: "Reduce unused CSS",
        displayValue: `Est savings of ${this.formatBytes(totalWasted)}`,
        description: "Remove unused CSS rules to reduce bytes consumed by network activity.",
        score: this.calculateScore(totalWasted, 50000, 200000),
        severity: this.getSeverityByBytes(totalWasted, 50000, 100000, 200000),
        savings: { bytes: totalWasted },
        items: insights.unusedCSS.slice(0, 10).map(css => ({
          url: css.url,
          size: css.transferSize,
          wastedBytes: css.wastedBytes,
          metadata: { wastedPercent: css.wastedPercent },
        })),
        category: "resource",
      });
    }

    // Long Tasks
    if (insights?.longTasks?.length) {
      const count = insights.longTasks.length;
      const totalDuration = insights.longTasks.reduce((sum, task) => sum + task.duration, 0);
      items.push({
        id: "long-tasks",
        title: "Avoid long main-thread tasks",
        displayValue: `${count} long task${count > 1 ? "s" : ""} found`,
        description: `Long tasks block the main thread for ${Math.round(totalDuration)}ms total, causing the page to feel unresponsive.`,
        score: this.calculateScore(count, 2, 5),
        severity: count > 5 ? "critical" : count > 3 ? "serious" : count > 1 ? "moderate" : "minor",
        savings: { timeMs: totalDuration },
        items: insights.longTasks.map(task => ({
          label: task.url ? this.truncateUrl(task.url) : "Unknown source",
          timeMs: task.duration,
          metadata: { startTime: task.startTime, attribution: task.attribution },
        })),
        category: "javascript",
      });
    }

    // Render-Blocking Resources
    if (insights?.renderBlocking?.length) {
      const totalWastedMs = insights.renderBlocking.reduce((sum, rb) => sum + rb.wastedMs, 0);
      items.push({
        id: "render-blocking",
        title: "Eliminate render-blocking resources",
        displayValue: `Est savings of ${Math.round(totalWastedMs)}ms`,
        description: "Resources are blocking the first paint of your page. Consider delivering critical JS/CSS inline and deferring non-critical resources.",
        score: this.calculateScore(totalWastedMs, 500, 1500),
        severity: this.getSeverityByTime(totalWastedMs),
        savings: { timeMs: totalWastedMs },
        items: insights.renderBlocking.map(rb => ({
          url: rb.url,
          size: rb.transferSize,
          timeMs: rb.wastedMs,
          metadata: { resourceType: rb.resourceType },
        })),
        category: "rendering",
      });
    }

    // Third-Party Impact
    if (insights?.thirdParties?.length) {
      const totalBlocking = insights.thirdParties.reduce((sum, tp) => sum + tp.blockingTime, 0);
      const totalSize = insights.thirdParties.reduce((sum, tp) => sum + tp.transferSize, 0);
      items.push({
        id: "third-party-summary",
        title: "Reduce impact of third-party code",
        displayValue: `${Math.round(totalBlocking)}ms blocking time`,
        description: `Third-party code blocked the main thread for ${Math.round(totalBlocking)}ms and transferred ${this.formatBytes(totalSize)}.`,
        score: this.calculateScore(totalBlocking, 250, 1000),
        severity: totalBlocking > 1000 ? "critical" : totalBlocking > 500 ? "serious" : "moderate",
        savings: { timeMs: totalBlocking, bytes: totalSize },
        items: insights.thirdParties.slice(0, 10).map(tp => ({
          label: tp.entity,
          timeMs: tp.blockingTime,
          size: tp.transferSize,
          metadata: { category: tp.category, requestCount: tp.requestCount },
        })),
        category: "network",
      });
    }

    // Cache Issues
    if (insights?.cacheIssues?.length) {
      const totalWasted = insights.cacheIssues.reduce((sum, c) => sum + c.wastedBytes, 0);
      items.push({
        id: "cache-policy",
        title: "Serve static assets with efficient cache policy",
        displayValue: `${insights.cacheIssues.length} resources found`,
        description: `${insights.cacheIssues.length} static resources have short cache lifetimes. A longer cache lifetime can speed up repeat visits.`,
        score: this.calculateScore(totalWasted, 100000, 500000),
        severity: totalWasted > 500000 ? "serious" : "moderate",
        savings: { bytes: totalWasted },
        items: insights.cacheIssues.slice(0, 10).map(c => ({
          url: c.url,
          size: c.transferSize,
          wastedBytes: c.wastedBytes,
          metadata: { cacheTTL: c.cacheTTLDisplay, entity: c.entity },
        })),
        category: "network",
      });
    }

    // Image Issues
    if (insights?.imageIssues?.length) {
      const totalWasted = insights.imageIssues.reduce((sum, img) => sum + img.wastedBytes, 0);
      const issueTypes = [...new Set(insights.imageIssues.map(i => i.issueType))];
      items.push({
        id: "image-optimization",
        title: "Properly size and optimize images",
        displayValue: `Est savings of ${this.formatBytes(totalWasted)}`,
        description: `Images have optimization opportunities: ${issueTypes.join(", ")}. Properly sizing and formatting images can significantly reduce load time.`,
        score: this.calculateScore(totalWasted, 100000, 500000),
        severity: this.getSeverityByBytes(totalWasted),
        savings: { bytes: totalWasted },
        items: insights.imageIssues.slice(0, 10).map(img => ({
          url: img.url,
          size: img.totalBytes,
          wastedBytes: img.wastedBytes,
          metadata: { 
            issueType: img.issueType, 
            recommendation: img.recommendation,
            snippet: img.snippet,
          },
        })),
        category: "resource",
      });
    }

    // Legacy JavaScript
    if (insights?.legacyJavaScript?.length) {
      const totalWasted = insights.legacyJavaScript.reduce((sum, l) => sum + l.wastedBytes, 0);
      items.push({
        id: "legacy-javascript",
        title: "Avoid serving legacy JavaScript to modern browsers",
        displayValue: `Est savings of ${this.formatBytes(totalWasted)}`,
        description: "Polyfills and transforms are shipped to modern browsers. Remove unnecessary polyfills by updating browser targets.",
        score: this.calculateScore(totalWasted, 30000, 100000),
        severity: this.getSeverityByBytes(totalWasted, 30000, 60000, 100000),
        savings: { bytes: totalWasted },
        items: insights.legacyJavaScript.map(l => ({
          url: l.url,
          wastedBytes: l.wastedBytes,
          metadata: { polyfills: l.polyfills },
        })),
        category: "javascript",
      });
    }

    // Sort by severity (critical first)
    const severityOrder = { critical: 0, serious: 1, moderate: 2, minor: 3 };
    return items.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
  }

  // ===========================================================================
  // Enhanced LCP Generation
  // ===========================================================================

  /**
   * Generates enhanced LCP element information
   */
  private generateEnhancedLCP(): EnhancedLCPElement | undefined {
    const { lcpElement, insights, metrics } = this.result;
    if (!lcpElement) return undefined;

    const type = this.detectLCPType(lcpElement);
    const recommendations = this.generateLCPRecommendations(type, insights?.lcpBreakdown, metrics.lcp.value);

    return {
      ...lcpElement,
      type,
      loadingMechanism: this.detectLoadingMechanism(lcpElement),
      isAboveTheFold: true, // LCP is by definition above-the-fold
      recommendations,
      timing: insights?.lcpBreakdown ? {
        requestStart: insights.lcpBreakdown.ttfb,
        loadEnd: insights.lcpBreakdown.ttfb + insights.lcpBreakdown.resourceLoadDelay + insights.lcpBreakdown.resourceLoadDuration,
        renderTime: insights.lcpBreakdown.elementRenderDelay,
      } : undefined,
    };
  }

  /**
   * Detects LCP element type
   */
  private detectLCPType(lcpElement: PerformanceResult["lcpElement"]): EnhancedLCPElement["type"] {
    if (!lcpElement) return "unknown";
    
    const tag = lcpElement.tagName.toLowerCase();
    if (tag === "img") return "image";
    if (tag === "video") return "video";
    if (tag === "svg") return "image";
    if (lcpElement.url?.match(/\.(jpg|jpeg|png|gif|webp|avif|svg)/i)) return "background-image";
    if (["h1", "h2", "h3", "p", "span", "div"].includes(tag)) return "text";
    
    return "unknown";
  }

  /**
   * Detects loading mechanism from snippet
   */
  private detectLoadingMechanism(lcpElement: PerformanceResult["lcpElement"]): EnhancedLCPElement["loadingMechanism"] {
    if (!lcpElement?.snippet) return "unknown";
    
    const snippet = lcpElement.snippet.toLowerCase();
    if (snippet.includes('loading="lazy"')) return "lazy";
    if (snippet.includes("fetchpriority") || snippet.includes("priority")) return "priority";
    if (snippet.includes("defer")) return "deferred";
    
    return "eager";
  }

  /**
   * Generates LCP-specific recommendations
   */
  private generateLCPRecommendations(
    type: EnhancedLCPElement["type"],
    breakdown?: LCPBreakdown,
    lcpValue?: number
  ): LCPRecommendation[] {
    const recommendations: LCPRecommendation[] = [];

    // Type-specific recommendations
    if (type === "image") {
      recommendations.push({
        id: "lcp-priority-hint",
        title: "Add priority hint to LCP image",
        description: "Use fetchpriority=\"high\" on the LCP image to prioritize its loading.",
        impact: "high",
        effort: "easy",
        codeHints: ['<img src="..." fetchpriority="high" />'],
      });

      if (this.context?.framework?.name === "next") {
        recommendations.push({
          id: "lcp-next-image-priority",
          title: "Use Next.js Image with priority",
          description: "Use next/image component with priority prop for the LCP image.",
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
        description: "Extract and inline the CSS needed for above-the-fold content to avoid render blocking.",
        impact: lcpValue > 4000 ? "high" : "medium",
        effort: "moderate",
      });
    }

    return recommendations;
  }

  // ===========================================================================
  // Key Opportunities Generation
  // ===========================================================================

  /**
   * Generates ranked key opportunities with framework-specific guidance
   */
  private generateKeyOpportunities(): KeyOpportunity[] {
    const opportunities: KeyOpportunity[] = [];
    const { insights, metrics, opportunities: rawOpps } = this.result;

    // Opportunity 1: LCP Optimization
    if (metrics.lcp.rating !== "good") {
      opportunities.push(this.createLCPOpportunity());
    }

    // Opportunity 2: JavaScript Optimization
    const jsWaste = insights?.unusedJavaScript?.reduce((sum, js) => sum + js.wastedBytes, 0) ?? 0;
    if (jsWaste > 100000) {
      opportunities.push(this.createJavaScriptOpportunity(jsWaste));
    }

    // Opportunity 3: Image Optimization
    const imgWaste = insights?.imageIssues?.reduce((sum, img) => sum + img.wastedBytes, 0) ?? 0;
    if (imgWaste > 50000) {
      opportunities.push(this.createImageOpportunity(imgWaste));
    }

    // Opportunity 4: Third-Party Script Management
    const tpBlocking = insights?.thirdParties?.reduce((sum, tp) => sum + tp.blockingTime, 0) ?? 0;
    if (tpBlocking > 250) {
      opportunities.push(this.createThirdPartyOpportunity(tpBlocking));
    }

    // Opportunity 5: Render-Blocking Resources
    const rbWaste = insights?.renderBlocking?.reduce((sum, rb) => sum + rb.wastedMs, 0) ?? 0;
    if (rbWaste > 200) {
      opportunities.push(this.createRenderBlockingOpportunity(rbWaste));
    }

    // Opportunity 6: CLS Improvement
    if (metrics.cls.rating !== "good") {
      opportunities.push(this.createCLSOpportunity());
    }

    // Sort by priority and return
    return opportunities.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Creates LCP optimization opportunity
   */
  private createLCPOpportunity(): KeyOpportunity {
    const { metrics, lcpElement, insights } = this.result;
    const lcpType = lcpElement ? this.detectLCPType(lcpElement) : "unknown";
    
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
        instructions: "Add fetchpriority=\"high\" to ensure the browser prioritizes loading this image.",
        codeExample: {
          language: "html",
          code: `<img src="${lcpElement?.url || "hero-image.jpg"}" fetchpriority="high" alt="..." />`,
        },
      });

      // Next.js specific
      if (this.context?.framework?.name === "next") {
        frameworkNotes.push({
          framework: "Next.js",
          note: "Use the Image component with priority prop instead of native img tag.",
          codeExample: `import Image from 'next/image';\n\n<Image\n  src="${lcpElement?.url || "/hero.jpg"}"\n  priority\n  alt="..."\n  width={1200}\n  height={600}\n/>`,
          docLink: "https://nextjs.org/docs/app/api-reference/components/image#priority",
        });
      }
    }

    // Step 3: Preload if needed
    if (insights?.lcpBreakdown?.resourceLoadDelay && insights.lcpBreakdown.resourceLoadDelay > 300) {
      steps.push({
        order: 3,
        title: "Preload the LCP resource",
        instructions: "Add a preload link in the document head to start fetching the resource earlier.",
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
      relatedAudits: ["largest-contentful-paint", "largest-contentful-paint-element"],
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
  private createJavaScriptOpportunity(wastedBytes: number): KeyOpportunity {
    const steps: ActionStep[] = [];
    const frameworkNotes: FrameworkSpecificNote[] = [];
    const firstPartyWaste = this.result.insights?.unusedJavaScript
      ?.filter(js => js.isFirstParty)
      .reduce((sum, js) => sum + js.wastedBytes, 0) ?? 0;

    steps.push({
      order: 1,
      title: "Audit JavaScript bundles",
      instructions: "Use webpack-bundle-analyzer or source-map-explorer to identify large modules.",
      codeExample: {
        language: "bash",
        code: "npx source-map-explorer dist/**/*.js",
      },
    });

    if (firstPartyWaste > 50000) {
      steps.push({
        order: 2,
        title: "Implement code splitting",
        instructions: "Split your JavaScript into smaller chunks that can be loaded on demand.",
      });

      if (this.context?.framework?.name === "next") {
        frameworkNotes.push({
          framework: "Next.js",
          note: "Use dynamic imports for components that aren't needed immediately.",
          codeExample: `import dynamic from 'next/dynamic';\n\nconst HeavyComponent = dynamic(() => import('./HeavyComponent'), {\n  loading: () => <p>Loading...</p>,\n  ssr: false, // Optional: disable SSR for client-only components\n});`,
          docLink: "https://nextjs.org/docs/app/building-your-application/optimizing/lazy-loading",
        });
      }
    }

    steps.push({
      order: 3,
      title: "Review and remove unused dependencies",
      instructions: "Check your package.json for dependencies that are no longer used.",
      codeExample: {
        language: "bash",
        code: "npx depcheck",
      },
    });

    return {
      id: "optimize-javascript",
      priority: 2,
      title: "Reduce JavaScript bundle size",
      description: `${this.formatBytes(wastedBytes)} of JavaScript is unused. Reducing bundle size improves load time and TBT.`,
      impact: {
        level: wastedBytes > 500000 ? "critical" : wastedBytes > 200000 ? "high" : "medium",
        sizeSavings: wastedBytes,
        scoreImprovement: Math.min(15, Math.floor(wastedBytes / 50000)),
      },
      steps,
      relatedAudits: ["unused-javascript", "bootup-time", "mainthread-work-breakdown"],
      frameworkNotes: frameworkNotes.length > 0 ? frameworkNotes : undefined,
      resources: [
        { title: "Reduce JavaScript Payloads", url: "https://web.dev/reduce-javascript-payloads-with-code-splitting/" },
      ],
    };
  }

  /**
   * Creates image optimization opportunity
   */
  private createImageOpportunity(wastedBytes: number): KeyOpportunity {
    const issues = this.result.insights?.imageIssues ?? [];
    const formatIssues = issues.filter(i => i.issueType === "format");
    const sizeIssues = issues.filter(i => i.issueType === "oversized");
    const offscreenIssues = issues.filter(i => i.issueType === "offscreen");

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
    if (this.context?.framework?.name === "next") {
      frameworkNotes.push({
        framework: "Next.js",
        note: "Next.js Image component automatically handles format conversion, sizing, and lazy loading.",
        codeExample: `import Image from 'next/image';\n\n<Image\n  src="/photo.jpg"\n  alt="Description"\n  width={800}\n  height={600}\n  // priority // Only for above-the-fold images\n/>`,
        docLink: "https://nextjs.org/docs/app/building-your-application/optimizing/images",
      });
    }

    return {
      id: "optimize-images",
      priority: 3,
      title: "Optimize images",
      description: `${this.formatBytes(wastedBytes)} can be saved by properly optimizing ${issues.length} images.`,
      impact: {
        level: wastedBytes > 500000 ? "high" : "medium",
        sizeSavings: wastedBytes,
        lcpImprovementMs: issues.some(i => i.issueType === "format") ? 200 : 0,
      },
      steps,
      relatedAudits: ["modern-image-formats", "uses-responsive-images", "offscreen-images"],
      frameworkNotes: frameworkNotes.length > 0 ? frameworkNotes : undefined,
      resources: [
        { title: "Use Modern Image Formats", url: "https://web.dev/uses-webp-images/" },
        { title: "Properly Size Images", url: "https://web.dev/uses-responsive-images/" },
      ],
    };
  }

  /**
   * Creates third-party script opportunity
   */
  private createThirdPartyOpportunity(blockingTime: number): KeyOpportunity {
    const thirdParties = this.result.insights?.thirdParties ?? [];
    const topBlockers = thirdParties.slice(0, 3);

    return {
      id: "optimize-third-parties",
      priority: 4,
      title: "Reduce third-party script impact",
      description: `Third-party scripts block the main thread for ${Math.round(blockingTime)}ms. Top blockers: ${topBlockers.map(t => t.entity).join(", ")}.`,
      impact: {
        level: blockingTime > 1000 ? "high" : "medium",
        lcpImprovementMs: Math.round(blockingTime * 0.3),
      },
      steps: [
        {
          order: 1,
          title: "Audit third-party scripts",
          instructions: "Review each third-party script and determine if it's truly necessary.",
        },
        {
          order: 2,
          title: "Defer non-critical scripts",
          instructions: "Load analytics and tracking scripts after the page has finished loading.",
          codeExample: {
            language: "javascript",
            code: `// Load analytics after page load\nwindow.addEventListener('load', () => {\n  // Initialize analytics\n});`,
          },
        },
        {
          order: 3,
          title: "Use Partytown for heavy scripts",
          instructions: "Consider using Partytown to run third-party scripts in a web worker.",
        },
      ],
      relatedAudits: ["third-party-summary", "bootup-time"],
      frameworkNotes: this.context?.framework?.name === "next" ? [{
        framework: "Next.js",
        note: "Use next/script with appropriate strategy to control loading behavior.",
        codeExample: `import Script from 'next/script';\n\n<Script\n  src="https://analytics.example.com"\n  strategy="lazyOnload" // or "afterInteractive"\n/>`,
        docLink: "https://nextjs.org/docs/app/building-your-application/optimizing/scripts",
      }] : undefined,
    };
  }

  /**
   * Creates render-blocking resources opportunity
   */
  private createRenderBlockingOpportunity(wastedMs: number): KeyOpportunity {
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
          instructions: "Extract CSS needed for above-the-fold content and inline it in the HTML.",
        },
        {
          order: 2,
          title: "Defer non-critical CSS",
          instructions: "Load non-critical CSS asynchronously using media queries or JavaScript.",
          codeExample: {
            language: "html",
            code: '<link rel="stylesheet" href="non-critical.css" media="print" onload="this.media=\'all\'">',
          },
        },
        {
          order: 3,
          title: "Add async/defer to scripts",
          instructions: "Non-critical scripts should use async or defer attributes.",
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
  private createCLSOpportunity(): KeyOpportunity {
    const { metrics } = this.result;

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
          instructions: "Always specify width and height attributes on media elements.",
          codeExample: {
            language: "html",
            code: '<img src="..." width="800" height="600" alt="..." />',
          },
        },
        {
          order: 2,
          title: "Reserve space for dynamic content",
          instructions: "Use CSS to reserve space for ads, embeds, and dynamically injected content.",
        },
        {
          order: 3,
          title: "Avoid inserting content above existing content",
          instructions: "New content should be inserted below the current viewport or with user action.",
        },
        {
          order: 4,
          title: "Use CSS transform for animations",
          instructions: "Prefer transform and opacity for animations instead of properties that trigger layout.",
        },
      ],
      relatedAudits: ["cumulative-layout-shift", "unsized-images"],
      resources: [
        { title: "Optimize CLS", url: "https://web.dev/optimize-cls/" },
      ],
    };
  }

  // ===========================================================================
  // Next Steps Generation
  // ===========================================================================

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
      description: "Use this toolkit in your CI/CD pipeline to catch regressions early.",
      type: "monitoring",
      urgency: "when-possible",
    });

    // Add testing step
    if (this.result.scores.performance && this.result.scores.performance < 90) {
      steps.push({
        id: "next-perf-testing",
        title: "Add performance tests to CI pipeline",
        description: "Create performance budgets and fail builds that exceed thresholds.",
        type: "testing",
        urgency: "soon",
      });
    }

    return steps.slice(0, 5);
  }

  // ===========================================================================
  // Summary Generation
  // ===========================================================================

  /**
   * Generates executive summary
   */
  private generateSummary(
    diagnostics: DiagnosticItem[],
    opportunities: KeyOpportunity[]
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
    const quickWins = opportunities.filter(
      o => o.steps.some(s => s.estimatedTime?.includes("minute") || s.codeExample)
    ).length;

    // Calculate total potential savings
    const timeMs = insights?.totalSavings?.timeMs ?? 
      diagnostics.reduce((sum, d) => sum + (d.savings?.timeMs ?? 0), 0);
    const sizeBytes = insights?.totalSavings?.sizeBytes ?? 
      diagnostics.reduce((sum, d) => sum + (d.savings?.bytes ?? 0), 0);

    // Get top 3 priorities
    const topPriorities = opportunities
      .slice(0, 3)
      .map(o => o.title);

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

  // ===========================================================================
  // Helper Methods
  // ===========================================================================

  private formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KiB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MiB`;
  }

  private truncateUrl(url: string, maxLength: number = 50): string {
    if (url.length <= maxLength) return url;
    return url.substring(0, maxLength - 3) + "...";
  }

  private calculateScore(value: number, goodThreshold: number, poorThreshold: number): number {
    if (value <= goodThreshold) return 1;
    if (value >= poorThreshold) return 0;
    return 1 - (value - goodThreshold) / (poorThreshold - goodThreshold);
  }

  private getSeverityByBytes(
    bytes: number,
    moderate: number = 100000,
    serious: number = 300000,
    critical: number = 500000
  ): DiagnosticItem["severity"] {
    if (bytes >= critical) return "critical";
    if (bytes >= serious) return "serious";
    if (bytes >= moderate) return "moderate";
    return "minor";
  }

  private getSeverityByTime(
    ms: number,
    moderate: number = 300,
    serious: number = 800,
    critical: number = 1500
  ): DiagnosticItem["severity"] {
    if (ms >= critical) return "critical";
    if (ms >= serious) return "serious";
    if (ms >= moderate) return "moderate";
    return "minor";
  }
}

/**
 * Creates an actionable report generator
 */
export function createReportGenerator(
  result: PerformanceResult,
  context?: ProjectContext | null
): ActionableReportGenerator {
  return new ActionableReportGenerator(result, context);
}

/**
 * Quick function to generate an actionable report
 */
export function generateActionableReport(
  result: PerformanceResult,
  context?: ProjectContext | null
): ActionableReport {
  const generator = new ActionableReportGenerator(result, context);
  return generator.generate();
}
