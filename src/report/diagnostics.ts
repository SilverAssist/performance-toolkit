/**
 * @silverassist/performance-toolkit
 *
 * Diagnostics table generation similar to PageSpeed Insights.
 *
 * @module report/diagnostics
 * @author Miguel Colmenares <me@miguelcolmenares.com>
 * @license PolyForm-Noncommercial-1.0.0
 */

import type { DiagnosticItem, PerformanceResult } from "../types";
import {
  formatBytes,
  truncateUrl,
  calculateScore,
  getSeverityByBytes,
  getSeverityByTime,
} from "./utils";

/**
 * Generates enhanced diagnostics table from performance insights
 */
export function generateDiagnosticsTable(
  result: PerformanceResult,
): DiagnosticItem[] {
  const items: DiagnosticItem[] = [];
  const { insights } = result;

  // Unused JavaScript
  if (insights?.unusedJavaScript?.length) {
    const totalWasted = insights.unusedJavaScript.reduce(
      (sum, js) => sum + js.wastedBytes,
      0,
    );
    items.push({
      id: "unused-javascript",
      title: "Reduce unused JavaScript",
      displayValue: `Est savings of ${formatBytes(totalWasted)}`,
      description:
        "Remove unused JavaScript to reduce bytes consumed by network activity and improve page load performance.",
      score: calculateScore(totalWasted, 150000, 500000),
      severity: getSeverityByBytes(totalWasted),
      savings: { bytes: totalWasted },
      items: insights.unusedJavaScript.slice(0, 10).map((js) => ({
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
    const totalWasted = insights.unusedCSS.reduce(
      (sum, css) => sum + css.wastedBytes,
      0,
    );
    items.push({
      id: "unused-css",
      title: "Reduce unused CSS",
      displayValue: `Est savings of ${formatBytes(totalWasted)}`,
      description:
        "Remove unused CSS rules to reduce bytes consumed by network activity.",
      score: calculateScore(totalWasted, 50000, 200000),
      severity: getSeverityByBytes(totalWasted, 50000, 100000, 200000),
      savings: { bytes: totalWasted },
      items: insights.unusedCSS.slice(0, 10).map((css) => ({
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
    const totalDuration = insights.longTasks.reduce(
      (sum, task) => sum + task.duration,
      0,
    );
    items.push({
      id: "long-tasks",
      title: "Avoid long main-thread tasks",
      displayValue: `${count} long task${count > 1 ? "s" : ""} found`,
      description: `Long tasks block the main thread for ${Math.round(totalDuration)}ms total, causing the page to feel unresponsive.`,
      score: calculateScore(count, 2, 5),
      severity:
        count > 5
          ? "critical"
          : count > 3
            ? "serious"
            : count > 1
              ? "moderate"
              : "minor",
      savings: { timeMs: totalDuration },
      items: insights.longTasks.map((task) => ({
        label: task.url ? truncateUrl(task.url) : "Unknown source",
        timeMs: task.duration,
        metadata: { startTime: task.startTime, attribution: task.attribution },
      })),
      category: "javascript",
    });
  }

  // Render-Blocking Resources
  if (insights?.renderBlocking?.length) {
    const totalWastedMs = insights.renderBlocking.reduce(
      (sum, rb) => sum + rb.wastedMs,
      0,
    );
    items.push({
      id: "render-blocking",
      title: "Eliminate render-blocking resources",
      displayValue: `Est savings of ${Math.round(totalWastedMs)}ms`,
      description:
        "Resources are blocking the first paint of your page. Consider delivering critical JS/CSS inline and deferring non-critical resources.",
      score: calculateScore(totalWastedMs, 500, 1500),
      severity: getSeverityByTime(totalWastedMs),
      savings: { timeMs: totalWastedMs },
      items: insights.renderBlocking.map((rb) => ({
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
    const totalBlocking = insights.thirdParties.reduce(
      (sum, tp) => sum + tp.blockingTime,
      0,
    );
    const totalSize = insights.thirdParties.reduce(
      (sum, tp) => sum + tp.transferSize,
      0,
    );
    items.push({
      id: "third-party-summary",
      title: "Reduce impact of third-party code",
      displayValue: `${Math.round(totalBlocking)}ms blocking time`,
      description: `Third-party code blocked the main thread for ${Math.round(totalBlocking)}ms and transferred ${formatBytes(totalSize)}.`,
      score: calculateScore(totalBlocking, 250, 1000),
      severity:
        totalBlocking > 1000
          ? "critical"
          : totalBlocking > 500
            ? "serious"
            : "moderate",
      savings: { timeMs: totalBlocking, bytes: totalSize },
      items: insights.thirdParties.slice(0, 10).map((tp) => ({
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
    const totalWasted = insights.cacheIssues.reduce(
      (sum, c) => sum + c.wastedBytes,
      0,
    );
    items.push({
      id: "cache-policy",
      title: "Serve static assets with efficient cache policy",
      displayValue: `${insights.cacheIssues.length} resources found`,
      description: `${insights.cacheIssues.length} static resources have short cache lifetimes. A longer cache lifetime can speed up repeat visits.`,
      score: calculateScore(totalWasted, 100000, 500000),
      severity: totalWasted > 500000 ? "serious" : "moderate",
      savings: { bytes: totalWasted },
      items: insights.cacheIssues.slice(0, 10).map((c) => ({
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
    const totalWasted = insights.imageIssues.reduce(
      (sum, img) => sum + img.wastedBytes,
      0,
    );
    const issueTypes = [
      ...new Set(insights.imageIssues.map((i) => i.issueType)),
    ];
    items.push({
      id: "image-optimization",
      title: "Properly size and optimize images",
      displayValue: `Est savings of ${formatBytes(totalWasted)}`,
      description: `Images have optimization opportunities: ${issueTypes.join(", ")}. Properly sizing and formatting images can significantly reduce load time.`,
      score: calculateScore(totalWasted, 100000, 500000),
      severity: getSeverityByBytes(totalWasted),
      savings: { bytes: totalWasted },
      items: insights.imageIssues.slice(0, 10).map((img) => ({
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
    const totalWasted = insights.legacyJavaScript.reduce(
      (sum, l) => sum + l.wastedBytes,
      0,
    );
    items.push({
      id: "legacy-javascript",
      title: "Avoid serving legacy JavaScript to modern browsers",
      displayValue: `Est savings of ${formatBytes(totalWasted)}`,
      description:
        "Polyfills and transforms are shipped to modern browsers. Remove unnecessary polyfills by updating browser targets.",
      score: calculateScore(totalWasted, 30000, 100000),
      severity: getSeverityByBytes(totalWasted, 30000, 60000, 100000),
      savings: { bytes: totalWasted },
      items: insights.legacyJavaScript.map((l) => ({
        url: l.url,
        wastedBytes: l.wastedBytes,
        metadata: { polyfills: l.polyfills },
      })),
      category: "javascript",
    });
  }

  // Sort by severity (critical first)
  const severityOrder = { critical: 0, serious: 1, moderate: 2, minor: 3 };
  return items.sort(
    (a, b) => severityOrder[a.severity] - severityOrder[b.severity],
  );
}
