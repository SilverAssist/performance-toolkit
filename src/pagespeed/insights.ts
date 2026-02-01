/**
 * @silverassist/performance-toolkit
 *
 * Detailed insights extractors for AI agents and actionable data.
 *
 * @module pagespeed/insights
 * @author Miguel Colmenares <me@miguelcolmenares.com>
 * @license PolyForm-Noncommercial-1.0.0
 */

import type {
  CacheIssue,
  DetailedInsights,
  ImageIssue,
  LCPBreakdown,
  LegacyJSIssue,
  LongTask,
  PageSpeedResponse,
  RenderBlockingResource,
  ThirdPartyIssue,
  UnusedCodeIssue,
} from "../types";
import {
  formatCacheTTL,
  extractEntityFromUrl,
  categorizeThirdParty,
  isFirstParty,
  getHostDomain,
} from "./utils";

type LighthouseAudits = PageSpeedResponse["lighthouseResult"]["audits"];

/**
 * Extracts all detailed insights for actionable improvements
 */
export function extractDetailedInsights(
  audits: LighthouseAudits,
  analyzedUrl?: string,
): DetailedInsights {
  const hostDomain = analyzedUrl ? getHostDomain(analyzedUrl) : "";

  const cacheIssues = extractCacheIssues(audits);
  const imageIssues = extractImageIssues(audits);
  const unusedJavaScript = extractUnusedCode(
    audits,
    "unused-javascript",
    hostDomain,
  );
  const unusedCSS = extractUnusedCode(audits, "unused-css-rules", hostDomain);
  const legacyJavaScript = extractLegacyJavaScript(audits);
  const thirdParties = extractThirdParties(audits);
  const longTasks = extractLongTasks(audits);
  const renderBlocking = extractRenderBlockingResources(audits);
  const lcpBreakdown = extractLCPBreakdown(audits);

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
export function extractCacheIssues(audits: LighthouseAudits): CacheIssue[] {
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
      cacheTTLDisplay: formatCacheTTL((item.cacheLifetimeMs as number) ?? 0),
      transferSize: (item.totalBytes as number) ?? 0,
      wastedBytes: (item.wastedBytes as number) ?? 0,
      entity: extractEntityFromUrl(url),
    });
  }

  return issues.sort((a, b) => b.wastedBytes - a.wastedBytes);
}

/**
 * Extracts image optimization issues from multiple audits
 */
export function extractImageIssues(audits: LighthouseAudits): ImageIssue[] {
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
        snippet: (item.node as Record<string, unknown>)?.snippet as
          | string
          | undefined,
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
        snippet: (item.node as Record<string, unknown>)?.snippet as
          | string
          | undefined,
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
        snippet: (item.node as Record<string, unknown>)?.snippet as
          | string
          | undefined,
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
        snippet: (item.node as Record<string, unknown>)?.snippet as
          | string
          | undefined,
      });
    }
  }

  return issues.sort((a, b) => b.wastedBytes - a.wastedBytes);
}

/**
 * Extracts unused JavaScript or CSS
 */
export function extractUnusedCode(
  audits: LighthouseAudits,
  auditId: "unused-javascript" | "unused-css-rules",
  hostDomain: string,
): UnusedCodeIssue[] {
  const audit = audits[auditId];
  if (!audit?.details?.items) return [];

  const items = audit.details.items as Array<Record<string, unknown>>;
  const issues: UnusedCodeIssue[] = [];

  for (const item of items) {
    const url = item.url as string;
    if (!url) continue;

    const transferSize = (item.totalBytes as number) ?? 0;
    const wastedBytes = (item.wastedBytes as number) ?? 0;

    issues.push({
      url,
      transferSize,
      wastedBytes,
      wastedPercent:
        transferSize > 0 ? Math.round((wastedBytes / transferSize) * 100) : 0,
      entity: extractEntityFromUrl(url),
      isFirstParty: isFirstParty(url, hostDomain),
    });
  }

  return issues.sort((a, b) => b.wastedBytes - a.wastedBytes);
}

/**
 * Extracts legacy JavaScript polyfills
 */
export function extractLegacyJavaScript(
  audits: LighthouseAudits,
): LegacyJSIssue[] {
  const audit = audits["legacy-javascript"];
  if (!audit?.details?.items) return [];

  const items = audit.details.items as Array<Record<string, unknown>>;
  const issues: LegacyJSIssue[] = [];

  for (const item of items) {
    const url = item.url as string;
    if (!url) continue;

    const subItems = item.subItems as
      | { items?: Array<{ signal?: string }> }
      | undefined;
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
      entity: extractEntityFromUrl(url),
    });
  }

  return issues.sort((a, b) => b.wastedBytes - a.wastedBytes);
}

/**
 * Extracts third-party script impact
 */
export function extractThirdParties(
  audits: LighthouseAudits,
): ThirdPartyIssue[] {
  const audit = audits["third-party-summary"];
  if (!audit?.details?.items) return [];

  const items = audit.details.items as Array<Record<string, unknown>>;
  const issues: ThirdPartyIssue[] = [];

  for (const item of items) {
    const entity = item.entity as string | { text?: string } | undefined;
    const entityName =
      typeof entity === "string" ? entity : (entity?.text ?? "Unknown");

    // Get URLs from subItems
    const subItems = item.subItems as
      | { items?: Array<{ url?: string }> }
      | undefined;
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
      category: categorizeThirdParty(entityName),
    });
  }

  return issues.sort((a, b) => b.blockingTime - a.blockingTime);
}

/**
 * Extracts long tasks blocking main thread
 */
export function extractLongTasks(audits: LighthouseAudits): LongTask[] {
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
export function extractRenderBlockingResources(
  audits: LighthouseAudits,
): RenderBlockingResource[] {
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
export function extractLCPBreakdown(
  audits: LighthouseAudits,
): LCPBreakdown | undefined {
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
  const resourceLoadDuration = Math.max(0, (totalLcp - fcp) * 0.6);
  const elementRenderDelay = Math.max(
    0,
    totalLcp - ttfb - resourceLoadDelay - resourceLoadDuration,
  );

  return {
    ttfb: Math.round(ttfb),
    resourceLoadDelay: Math.round(resourceLoadDelay),
    resourceLoadDuration: Math.round(resourceLoadDuration),
    elementRenderDelay: Math.round(elementRenderDelay),
    total: Math.round(totalLcp),
  };
}
