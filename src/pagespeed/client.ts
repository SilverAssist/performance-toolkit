/**
 * @silverassist/performance-toolkit
 *
 * PageSpeed API client for fetching and analyzing performance data.
 *
 * @module pagespeed/client
 * @author Miguel Colmenares <me@miguelcolmenares.com>
 * @license PolyForm-Noncommercial-1.0.0
 */

import type {
  Category,
  PageSpeedOptions,
  PageSpeedResponse,
  PerformanceResult,
  Strategy,
} from "../types";
import { PSI_API_URL, DEFAULT_TIMEOUT, DEFAULT_CATEGORIES } from "./constants";
import {
  extractScores,
  extractMetrics,
  extractLCPElement,
  extractOpportunities,
  extractDiagnostics,
} from "./extractors";
import { extractDetailedInsights } from "./insights";

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
    const data = (await response.json()) as PageSpeedResponse;

    return this.transformResponse(data, url, strategy);
  }

  /**
   * Analyzes a URL for both mobile and desktop
   * @param url - URL to analyze
   * @param categories - Categories to analyze
   * @returns Object with mobile and desktop results
   */
  async analyzeAll(
    url: string,
    categories: Category[] = DEFAULT_CATEGORIES,
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
    apiKey?: string,
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
  private async fetchWithTimeout(
    url: string,
    timeout: number,
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, { signal: controller.signal });

      if (!response.ok) {
        throw new Error(
          `PageSpeed API error: ${response.status} ${response.statusText}`,
        );
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
    strategy: Strategy,
  ): PerformanceResult {
    const { lighthouseResult, loadingExperience } = data;

    return {
      url,
      strategy,
      timestamp: data.analysisUTCTimestamp,
      scores: extractScores(lighthouseResult),
      metrics: extractMetrics(lighthouseResult),
      lcpElement: extractLCPElement(lighthouseResult),
      opportunities: extractOpportunities(lighthouseResult),
      diagnostics: extractDiagnostics(lighthouseResult),
      insights: extractDetailedInsights(lighthouseResult.audits, url),
      fieldData: loadingExperience,
      rawResponse: data,
    };
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
  options: Omit<PageSpeedOptions, "url"> = {},
): Promise<PerformanceResult> {
  const client = new PageSpeedClient(options.apiKey, options.timeout);
  return client.analyze({ url, ...options });
}
