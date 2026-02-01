/**
 * @silverassist/performance-toolkit
 *
 * PageSpeed data extractors for scores, metrics, opportunities, and diagnostics.
 *
 * @module pagespeed/extractors
 * @author Miguel Colmenares <me@miguelcolmenares.com>
 * @license PolyForm-Noncommercial-1.0.0
 */

import type {
  CoreWebVitals,
  CategoryScores,
  Diagnostic,
  LCPElement,
  MetricValue,
  Opportunity,
  PageSpeedResponse,
} from "../types";
import { OPPORTUNITY_AUDITS, DIAGNOSTIC_AUDITS } from "./constants";

type LighthouseResult = PageSpeedResponse["lighthouseResult"];
type LighthouseAudit = LighthouseResult["audits"][string];

/**
 * Extracts category scores from Lighthouse result
 */
export function extractScores(result: LighthouseResult): CategoryScores {
  const { categories } = result;

  return {
    performance:
      categories.performance?.score != null
        ? Math.round(categories.performance.score * 100)
        : null,
    accessibility:
      categories.accessibility?.score != null
        ? Math.round(categories.accessibility.score * 100)
        : null,
    bestPractices:
      categories["best-practices"]?.score != null
        ? Math.round(categories["best-practices"].score * 100)
        : null,
    seo:
      categories.seo?.score != null
        ? Math.round(categories.seo.score * 100)
        : null,
  };
}

/**
 * Extracts Core Web Vitals metrics from audits
 */
export function extractMetrics(result: LighthouseResult): CoreWebVitals {
  const { audits } = result;

  return {
    lcp: extractMetricValue(audits["largest-contentful-paint"]),
    fcp: extractMetricValue(audits["first-contentful-paint"]),
    cls: extractMetricValue(audits["cumulative-layout-shift"]),
    tbt: extractMetricValue(audits["total-blocking-time"]),
    si: extractMetricValue(audits["speed-index"]),
    tti: extractMetricValue(audits["interactive"]),
  };
}

/**
 * Extracts a single metric value from audit
 */
export function extractMetricValue(audit?: LighthouseAudit): MetricValue {
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
export function extractLCPElement(
  result: LighthouseResult,
): LCPElement | undefined {
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
export function extractOpportunities(result: LighthouseResult): Opportunity[] {
  const opportunities: Opportunity[] = [];

  for (const id of OPPORTUNITY_AUDITS) {
    const audit = result.audits[id];
    if (
      !audit ||
      audit.score === 1 ||
      audit.scoreDisplayMode === "notApplicable"
    ) {
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
export function extractDiagnostics(result: LighthouseResult): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  for (const id of DIAGNOSTIC_AUDITS) {
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
