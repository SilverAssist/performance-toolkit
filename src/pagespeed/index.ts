/**
 * PageSpeed Insights API Client
 *
 * Fetches performance data from Google PageSpeed Insights API v5
 *
 * @packageDocumentation
 */

import type {
  CacheIssue,
  Category,
  CoreWebVitals,
  DetailedInsights,
  Diagnostic,
  ImageIssue,
  LCPBreakdown,
  LCPElement,
  LegacyJSIssue,
  LongTask,
  MetricValue,
  Opportunity,
  PageSpeedOptions,
  PageSpeedResponse,
  PerformanceResult,
  RenderBlockingResource,
  Strategy,
  ThirdPartyIssue,
  UnusedCodeIssue,
} from "../types";

/** PageSpeed Insights API base URL */
const PSI_API_URL = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";

/** Default request timeout in milliseconds */
const DEFAULT_TIMEOUT = 60000;

/** Default categories to analyze */
const DEFAULT_CATEGORIES: Category[] = ["performance", "accessibility", "best-practices", "seo"];

/**
 * PageSpeed Insights API client for fetching performance data
 */
export class PageSpeedClient {
  private apiKey?: string;
  private timeout: number;

  /**
   * Creates a new PageSpeed client
   * @param apiKey - Optional API key for higher rate limits
   * @param timeout - Request timeout in milliseconds
   */
  constructor(apiKey?: string, timeout = DEFAULT_TIMEOUT) {
    this.apiKey = apiKey;
    this.timeout = timeout;
  }

  /**
   * Analyzes a URL using PageSpeed Insights API
   * @param options - Analysis options
   * @returns Performance analysis result
   */
  async analyze(options: PageSpeedOptions): Promise<PerformanceResult> {
    const {
      url,
      strategy = "mobile",
      categories = DEFAULT_CATEGORIES,
      apiKey = this.apiKey,
      timeout = this.timeout,
    } = options;

    const apiUrl = this.buildApiUrl(url, strategy, categories, apiKey);
    const response = await this.fetchWithTimeout(apiUrl, timeout);
    const data: PageSpeedResponse = await response.json();

    return this.transformResponse(data, url, strategy);
  }

  /**
   * Analyzes a URL for both mobile and desktop
   * @param url - URL to analyze
   * @param categories - Categories to analyze
   * @returns Array with mobile and desktop results
   */
  async analyzeAll(
    url: string,
    categories: Category[] = DEFAULT_CATEGORIES
  ): Promise<{ mobile: PerformanceResult; desktop: PerformanceResult }> {
    const [mobile, desktop] = await Promise.all([
      this.analyze({ url, strategy: "mobile", categories }),
      this.analyze({ url, strategy: "desktop", categories }),
    ]);

    return { mobile, desktop };
  }

  /**
   * Builds the PageSpeed API URL with query parameters
   */
  private buildApiUrl(
    url: string,
    strategy: Strategy,
    categories: Category[],
    apiKey?: string
  ): string {
    const params = new URLSearchParams();
    params.append("url", url);
    params.append("strategy", strategy.toUpperCase());

    // Add each category separately (API requires separate params)
    for (const category of categories) {
      params.append("category", category.toUpperCase().replace("-", "_"));
    }

    if (apiKey) {
      params.append("key", apiKey);
    }

    return `${PSI_API_URL}?${params.toString()}`;
  }

  /**
   * Fetches URL with timeout using AbortController
   */
  private async fetchWithTimeout(url: string, timeout: number): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, { signal: controller.signal });

      if (!response.ok) {
        throw new Error(`PageSpeed API error: ${response.status} ${response.statusText}`);
      }

      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Transforms PageSpeed API response to PerformanceResult
   */
  private transformResponse(
    data: PageSpeedResponse,
    url: string,
    strategy: Strategy
  ): PerformanceResult {
    const { lighthouseResult, loadingExperience } = data;

    return {
      url,
      strategy,
      timestamp: data.analysisUTCTimestamp,
      scores: this.extractScores(lighthouseResult),
      metrics: this.extractMetrics(lighthouseResult),
      lcpElement: this.extractLCPElement(lighthouseResult),
      opportunities: this.extractOpportunities(lighthouseResult),
      diagnostics: this.extractDiagnostics(lighthouseResult),
      insights: this.extractDetailedInsights(lighthouseResult),
      fieldData: loadingExperience,
      rawResponse: data,
    };
  }

  /**
   * Extracts category scores from Lighthouse result
   */
  private extractScores(result: PageSpeedResponse["lighthouseResult"]) {
    const { categories } = result;

    return {
      performance: categories.performance?.score != null ? Math.round(categories.performance.score * 100) : null,
      accessibility: categories.accessibility?.score != null ? Math.round(categories.accessibility.score * 100) : null,
      bestPractices: categories["best-practices"]?.score != null ? Math.round(categories["best-practices"].score * 100) : null,
      seo: categories.seo?.score != null ? Math.round(categories.seo.score * 100) : null,
    };
  }

  /**
   * Extracts Core Web Vitals metrics from audits
   */
  private extractMetrics(result: PageSpeedResponse["lighthouseResult"]): CoreWebVitals {
    const { audits } = result;

    return {
      lcp: this.extractMetricValue(audits["largest-contentful-paint"]),
      fcp: this.extractMetricValue(audits["first-contentful-paint"]),
      cls: this.extractMetricValue(audits["cumulative-layout-shift"]),
      tbt: this.extractMetricValue(audits["total-blocking-time"]),
      si: this.extractMetricValue(audits["speed-index"]),
      tti: this.extractMetricValue(audits["interactive"]),
    };
  }

  /**
   * Extracts a single metric value from audit
   */
  private extractMetricValue(audit?: PageSpeedResponse["lighthouseResult"]["audits"][string]): MetricValue {
    if (!audit) {
      return { value: 0, displayValue: "N/A", rating: "poor" };
    }

    const value = audit.numericValue ?? 0;
    const displayValue = audit.displayValue ?? "N/A";
    const score = audit.score ?? 0;

    let rating: MetricValue["rating"];
    if (score >= 0.9) {
      rating = "good";
    } else if (score >= 0.5) {
      rating = "needs-improvement";
    } else {
      rating = "poor";
    }

    return { value, displayValue, rating };
  }

  /**
   * Extracts LCP element information
   */
  private extractLCPElement(result: PageSpeedResponse["lighthouseResult"]): LCPElement | undefined {
    const lcpAudit = result.audits["largest-contentful-paint-element"];

    if (!lcpAudit?.details?.items?.[0]) {
      return undefined;
    }

    const item = lcpAudit.details.items[0] as Record<string, unknown>;
    const node = item.node as Record<string, unknown> | undefined;

    return {
      tagName: (node?.nodeLabel as string) ?? "Unknown",
      selector: (node?.selector as string) ?? "",
      url: node?.lhId as string | undefined,
      nodePath: (node?.path as string) ?? "",
      snippet: (node?.snippet as string) ?? undefined,
    };
  }

  /**
   * Extracts performance improvement opportunities
   */
  private extractOpportunities(result: PageSpeedResponse["lighthouseResult"]): Opportunity[] {
    const opportunityAudits = [
      "render-blocking-resources",
      "unused-css-rules",
      "unused-javascript",
      "modern-image-formats",
      "offscreen-images",
      "unminified-css",
      "unminified-javascript",
      "efficient-animated-content",
      "uses-optimized-images",
      "uses-responsive-images",
      "server-response-time",
      "uses-text-compression",
      "uses-rel-preconnect",
      "uses-rel-preload",
      "font-display",
      "third-party-summary",
    ];

    const opportunities: Opportunity[] = [];

    for (const id of opportunityAudits) {
      const audit = result.audits[id];
      if (!audit || audit.score === 1 || audit.scoreDisplayMode === "notApplicable") {
        continue;
      }

      opportunities.push({
        id,
        title: audit.title,
        description: audit.description,
        savingsMs: audit.details?.overallSavingsMs,
        savingsBytes: audit.details?.overallSavingsBytes,
        score: audit.score,
        items: audit.details?.items as Array<Record<string, unknown>> | undefined,
      });
    }

    return opportunities.sort((a, b) => (b.savingsMs ?? 0) - (a.savingsMs ?? 0));
  }

  /**
   * Extracts diagnostic information
   */
  private extractDiagnostics(result: PageSpeedResponse["lighthouseResult"]): Diagnostic[] {
    const diagnosticAudits = [
      "mainthread-work-breakdown",
      "bootup-time",
      "dom-size",
      "critical-request-chains",
      "network-requests",
      "network-rtt",
      "network-server-latency",
      "long-tasks",
      "non-composited-animations",
      "unsized-images",
      "viewport",
      "no-document-write",
      "js-libraries",
    ];

    const diagnostics: Diagnostic[] = [];

    for (const id of diagnosticAudits) {
      const audit = result.audits[id];
      if (!audit || audit.scoreDisplayMode === "notApplicable") {
        continue;
      }

      diagnostics.push({
        id,
        title: audit.title,
        description: audit.description,
        displayValue: audit.displayValue,
        score: audit.score,
        details: audit.details,
      });
    }

    return diagnostics;
  }

  // ===========================================================================
  // DETAILED INSIGHTS EXTRACTION (for AI agents / actionable data)
  // ===========================================================================

  /**
   * Extracts all detailed insights for actionable improvements
   * This data is structured for AI agents to propose specific code changes
   */
  private extractDetailedInsights(result: PageSpeedResponse["lighthouseResult"]): DetailedInsights {
    const { audits } = result;

    const cacheIssues = this.extractCacheIssues(audits);
    const imageIssues = this.extractImageIssues(audits);
    const unusedJavaScript = this.extractUnusedCode(audits, "unused-javascript");
    const unusedCSS = this.extractUnusedCode(audits, "unused-css-rules");
    const legacyJavaScript = this.extractLegacyJavaScript(audits);
    const thirdParties = this.extractThirdParties(audits);
    const longTasks = this.extractLongTasks(audits);
    const renderBlocking = this.extractRenderBlockingResources(audits);
    const lcpBreakdown = this.extractLCPBreakdown(audits);

    // Calculate total savings
    let totalTimeMs = 0;
    let totalSizeBytes = 0;

    for (const issue of [...unusedJavaScript, ...unusedCSS]) {
      totalSizeBytes += issue.wastedBytes;
    }
    for (const issue of cacheIssues) {
      totalSizeBytes += issue.wastedBytes;
    }
    for (const issue of imageIssues) {
      totalSizeBytes += issue.wastedBytes;
    }
    for (const resource of renderBlocking) {
      totalTimeMs += resource.wastedMs;
    }

    return {
      lcpBreakdown,
      cacheIssues,
      imageIssues,
      unusedJavaScript,
      unusedCSS,
      legacyJavaScript,
      thirdParties,
      longTasks,
      renderBlocking,
      totalSavings: {
        timeMs: Math.round(totalTimeMs),
        sizeBytes: Math.round(totalSizeBytes),
      },
    };
  }

  /**
   * Extracts resources with poor cache policies
   */
  private extractCacheIssues(audits: PageSpeedResponse["lighthouseResult"]["audits"]): CacheIssue[] {
    const audit = audits["uses-long-cache-ttl"];
    if (!audit?.details?.items) return [];

    const items = audit.details.items as Array<Record<string, unknown>>;
    const issues: CacheIssue[] = [];

    for (const item of items) {
      const url = item.url as string;
      if (!url) continue;

      issues.push({
        url,
        cacheTTL: (item.cacheLifetimeMs as number) ?? 0,
        cacheTTLDisplay: this.formatCacheTTL((item.cacheLifetimeMs as number) ?? 0),
        transferSize: (item.totalBytes as number) ?? 0,
        wastedBytes: (item.wastedBytes as number) ?? 0,
        entity: this.extractEntityFromUrl(url),
      });
    }

    return issues.sort((a, b) => b.wastedBytes - a.wastedBytes);
  }

  /**
   * Extracts image optimization issues from multiple audits
   */
  private extractImageIssues(audits: PageSpeedResponse["lighthouseResult"]["audits"]): ImageIssue[] {
    const issues: ImageIssue[] = [];
    const seenUrls = new Set<string>();

    // Modern image formats (WebP/AVIF)
    const modernFormats = audits["modern-image-formats"];
    if (modernFormats?.details?.items) {
      const items = modernFormats.details.items as Array<Record<string, unknown>>;
      for (const item of items) {
        const url = item.url as string;
        if (!url || seenUrls.has(url)) continue;
        seenUrls.add(url);

        issues.push({
          url,
          totalBytes: (item.totalBytes as number) ?? 0,
          wastedBytes: (item.wastedBytes as number) ?? 0,
          issueType: "format",
          recommendation: "Convert to WebP or AVIF format",
          snippet: (item.node as Record<string, unknown>)?.snippet as string | undefined,
        });
      }
    }

    // Responsive images (oversized)
    const responsive = audits["uses-responsive-images"];
    if (responsive?.details?.items) {
      const items = responsive.details.items as Array<Record<string, unknown>>;
      for (const item of items) {
        const url = item.url as string;
        if (!url || seenUrls.has(url)) continue;
        seenUrls.add(url);

        issues.push({
          url,
          totalBytes: (item.totalBytes as number) ?? 0,
          wastedBytes: (item.wastedBytes as number) ?? 0,
          issueType: "oversized",
          recommendation: "Serve properly sized images for viewport",
          snippet: (item.node as Record<string, unknown>)?.snippet as string | undefined,
        });
      }
    }

    // Offscreen images (lazy load candidates)
    const offscreen = audits["offscreen-images"];
    if (offscreen?.details?.items) {
      const items = offscreen.details.items as Array<Record<string, unknown>>;
      for (const item of items) {
        const url = item.url as string;
        if (!url || seenUrls.has(url)) continue;
        seenUrls.add(url);

        issues.push({
          url,
          totalBytes: (item.totalBytes as number) ?? 0,
          wastedBytes: (item.wastedBytes as number) ?? 0,
          issueType: "offscreen",
          recommendation: "Lazy-load offscreen images with loading='lazy'",
          snippet: (item.node as Record<string, unknown>)?.snippet as string | undefined,
        });
      }
    }

    // Unoptimized images (compression)
    const unoptimized = audits["uses-optimized-images"];
    if (unoptimized?.details?.items) {
      const items = unoptimized.details.items as Array<Record<string, unknown>>;
      for (const item of items) {
        const url = item.url as string;
        if (!url || seenUrls.has(url)) continue;
        seenUrls.add(url);

        issues.push({
          url,
          totalBytes: (item.totalBytes as number) ?? 0,
          wastedBytes: (item.wastedBytes as number) ?? 0,
          issueType: "unoptimized",
          recommendation: "Compress image or use better optimization",
          snippet: (item.node as Record<string, unknown>)?.snippet as string | undefined,
        });
      }
    }

    return issues.sort((a, b) => b.wastedBytes - a.wastedBytes);
  }

  /**
   * Extracts unused JavaScript or CSS
   */
  private extractUnusedCode(
    audits: PageSpeedResponse["lighthouseResult"]["audits"],
    auditId: "unused-javascript" | "unused-css-rules"
  ): UnusedCodeIssue[] {
    const audit = audits[auditId];
    if (!audit?.details?.items) return [];

    const items = audit.details.items as Array<Record<string, unknown>>;
    const issues: UnusedCodeIssue[] = [];
    const hostDomain = this.getHostDomain();

    for (const item of items) {
      const url = item.url as string;
      if (!url) continue;

      const transferSize = (item.totalBytes as number) ?? 0;
      const wastedBytes = (item.wastedBytes as number) ?? 0;

      issues.push({
        url,
        transferSize,
        wastedBytes,
        wastedPercent: transferSize > 0 ? Math.round((wastedBytes / transferSize) * 100) : 0,
        entity: this.extractEntityFromUrl(url),
        isFirstParty: this.isFirstParty(url, hostDomain),
      });
    }

    return issues.sort((a, b) => b.wastedBytes - a.wastedBytes);
  }

  /**
   * Extracts legacy JavaScript polyfills
   */
  private extractLegacyJavaScript(audits: PageSpeedResponse["lighthouseResult"]["audits"]): LegacyJSIssue[] {
    const audit = audits["legacy-javascript"];
    if (!audit?.details?.items) return [];

    const items = audit.details.items as Array<Record<string, unknown>>;
    const issues: LegacyJSIssue[] = [];

    for (const item of items) {
      const url = item.url as string;
      if (!url) continue;

      const subItems = item.subItems as { items?: Array<{ signal?: string }> } | undefined;
      const polyfills: string[] = [];

      if (subItems?.items) {
        for (const sub of subItems.items) {
          if (sub.signal) {
            polyfills.push(sub.signal);
          }
        }
      }

      issues.push({
        url,
        wastedBytes: (item.wastedBytes as number) ?? 0,
        polyfills,
        entity: this.extractEntityFromUrl(url),
      });
    }

    return issues.sort((a, b) => b.wastedBytes - a.wastedBytes);
  }

  /**
   * Extracts third-party script impact
   */
  private extractThirdParties(audits: PageSpeedResponse["lighthouseResult"]["audits"]): ThirdPartyIssue[] {
    const audit = audits["third-party-summary"];
    if (!audit?.details?.items) return [];

    const items = audit.details.items as Array<Record<string, unknown>>;
    const issues: ThirdPartyIssue[] = [];

    for (const item of items) {
      const entity = item.entity as string | { text?: string } | undefined;
      const entityName = typeof entity === "string" ? entity : entity?.text ?? "Unknown";

      // Get URLs from subItems
      const subItems = item.subItems as { items?: Array<{ url?: string }> } | undefined;
      const urls: string[] = [];
      if (subItems?.items) {
        for (const sub of subItems.items) {
          if (sub.url) urls.push(sub.url);
        }
      }

      issues.push({
        entity: entityName,
        blockingTime: (item.blockingTime as number) ?? 0,
        transferSize: (item.transferSize as number) ?? 0,
        requestCount: urls.length,
        urls,
        category: this.categorizeThirdParty(entityName),
      });
    }

    return issues.sort((a, b) => b.blockingTime - a.blockingTime);
  }

  /**
   * Extracts long tasks blocking main thread
   */
  private extractLongTasks(audits: PageSpeedResponse["lighthouseResult"]["audits"]): LongTask[] {
    const audit = audits["long-tasks"];
    if (!audit?.details?.items) return [];

    const items = audit.details.items as Array<Record<string, unknown>>;
    const tasks: LongTask[] = [];

    for (const item of items) {
      tasks.push({
        duration: (item.duration as number) ?? 0,
        startTime: (item.startTime as number) ?? 0,
        url: item.url as string | undefined,
        attribution: (item.attribution as string) ?? undefined,
      });
    }

    return tasks.sort((a, b) => b.duration - a.duration);
  }

  /**
   * Extracts render-blocking resources
   */
  private extractRenderBlockingResources(audits: PageSpeedResponse["lighthouseResult"]["audits"]): RenderBlockingResource[] {
    const audit = audits["render-blocking-resources"];
    if (!audit?.details?.items) return [];

    const items = audit.details.items as Array<Record<string, unknown>>;
    const resources: RenderBlockingResource[] = [];

    for (const item of items) {
      const url = item.url as string;
      if (!url) continue;

      let resourceType: RenderBlockingResource["resourceType"] = "other";
      if (url.endsWith(".js") || url.includes(".js?")) {
        resourceType = "script";
      } else if (url.endsWith(".css") || url.includes(".css?")) {
        resourceType = "stylesheet";
      }

      resources.push({
        url,
        transferSize: (item.totalBytes as number) ?? 0,
        wastedMs: (item.wastedMs as number) ?? 0,
        resourceType,
      });
    }

    return resources.sort((a, b) => b.wastedMs - a.wastedMs);
  }

  /**
   * Extracts LCP timing breakdown
   */
  private extractLCPBreakdown(audits: PageSpeedResponse["lighthouseResult"]["audits"]): LCPBreakdown | undefined {
    // Try to get LCP breakdown from lcp-lazy-loaded or experimental metrics
    const lcpAudit = audits["largest-contentful-paint"];
    if (!lcpAudit?.numericValue) return undefined;

    const fcpAudit = audits["first-contentful-paint"];
    const ttfbAudit = audits["server-response-time"];

    // Get TTFB
    const ttfb = ttfbAudit?.numericValue ?? 0;

    // Estimate breakdown based on available metrics
    const totalLcp = lcpAudit.numericValue;
    const fcp = fcpAudit?.numericValue ?? 0;

    // These are estimates when precise breakdown isn't available
    const resourceLoadDelay = Math.max(0, fcp - ttfb);
    const resourceLoadDuration = Math.max(0, (totalLcp - fcp) * 0.6); // estimate 60% is resource load
    const elementRenderDelay = Math.max(0, totalLcp - ttfb - resourceLoadDelay - resourceLoadDuration);

    return {
      ttfb: Math.round(ttfb),
      resourceLoadDelay: Math.round(resourceLoadDelay),
      resourceLoadDuration: Math.round(resourceLoadDuration),
      elementRenderDelay: Math.round(elementRenderDelay),
      total: Math.round(totalLcp),
    };
  }

  // ===========================================================================
  // Helper methods
  // ===========================================================================

  /**
   * Formats cache TTL to human-readable string
   */
  private formatCacheTTL(ms: number): string {
    if (ms === 0) return "No cache";
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 365) return `${days}d`;
    const years = Math.floor(days / 365);
    return `${years}y`;
  }

  /**
   * Extracts entity/third-party name from URL
   */
  private extractEntityFromUrl(url: string): string | undefined {
    try {
      const hostname = new URL(url).hostname;
      // Common third-party patterns
      const patterns: Record<string, string> = {
        "facebook": "Facebook",
        "fb.com": "Facebook",
        "fbcdn": "Facebook",
        "google": "Google",
        "googleapis": "Google APIs",
        "gstatic": "Google Static",
        "googletagmanager": "Google Tag Manager",
        "google-analytics": "Google Analytics",
        "doubleclick": "DoubleClick",
        "twitter": "Twitter",
        "twimg": "Twitter",
        "linkedin": "LinkedIn",
        "trustedform": "TrustedForm",
        "leadid": "LeadID",
        "jornaya": "Jornaya",
        "cloudflare": "Cloudflare",
        "cloudfront": "CloudFront",
        "amazonaws": "AWS",
        "cdn": "CDN",
        "jquery": "jQuery",
        "unpkg": "unpkg",
        "cdnjs": "cdnjs",
        "bootstrapcdn": "Bootstrap CDN",
      };

      for (const [pattern, name] of Object.entries(patterns)) {
        if (hostname.includes(pattern)) {
          return name;
        }
      }

      return undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Categorizes third-party by type
   */
  private categorizeThirdParty(entity: string): string {
    const lower = entity.toLowerCase();
    if (lower.includes("analytics") || lower.includes("tag manager")) return "analytics";
    if (lower.includes("facebook") || lower.includes("twitter") || lower.includes("linkedin")) return "social";
    if (lower.includes("ad") || lower.includes("doubleclick")) return "advertising";
    if (lower.includes("cdn") || lower.includes("cloudflare") || lower.includes("cloudfront")) return "cdn";
    if (lower.includes("font")) return "fonts";
    if (lower.includes("trustedform") || lower.includes("leadid") || lower.includes("jornaya")) return "lead-tracking";
    return "other";
  }

  /**
   * Checks if URL is first-party
   */
  private isFirstParty(url: string, hostDomain: string): boolean {
    try {
      const urlHost = new URL(url).hostname;
      return urlHost.includes(hostDomain) || urlHost === hostDomain;
    } catch {
      return false;
    }
  }

  /**
   * Gets host domain (placeholder - would need to be passed in)
   */
  private getHostDomain(): string {
    // This would ideally be extracted from the analyzed URL
    return "familyassets.com";
  }
}

/**
 * Creates a configured PageSpeed client instance
 * @param apiKey - Optional API key
 * @returns Configured PageSpeedClient instance
 */
export function createPageSpeedClient(apiKey?: string): PageSpeedClient {
  return new PageSpeedClient(apiKey);
}

/**
 * Quick function to analyze a single URL
 * @param url - URL to analyze
 * @param options - Analysis options
 * @returns Performance result
 */
export async function analyzeUrl(
  url: string,
  options: Omit<PageSpeedOptions, "url"> = {}
): Promise<PerformanceResult> {
  const client = new PageSpeedClient(options.apiKey, options.timeout);
  return client.analyze({ url, ...options });
}
