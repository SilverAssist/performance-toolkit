/**
 * @silverassist/performance-toolkit
 *
 * Lighthouse CI runner - wrapper for @lhci/cli with fluent API.
 *
 * @module lighthouse
 * @author Miguel Colmenares <me@miguelcolmenares.com>
 * @license PolyForm-Noncommercial-1.0.0
 */

import type {
  LHCIAssertions,
  LHCIConfig,
  LHCIOptions,
  PerformanceThresholds,
} from "../types";

/**
 * Lighthouse CI Runner for programmatic execution
 */
export class LighthouseRunner {
  private config: LHCIConfig;

  /**
   * Creates a new Lighthouse runner
   * @param options - Runner options
   */
  constructor(options: LHCIOptions) {
    this.config = this.buildConfig(options);
  }

  /**
   * Builds LHCI configuration from options
   */
  private buildConfig(options: LHCIOptions): LHCIConfig {
    const {
      urls,
      method = "node",
      numberOfRuns = 3,
      psiApiKey,
      psiStrategy = "mobile",
      chromeFlags = ["--headless", "--no-sandbox"],
      outputDir,
    } = options;

    const config: LHCIConfig = {
      ci: {
        collect: {
          url: urls,
          method,
          numberOfRuns,
          ...(method === "psi" && psiApiKey ? { psiApiKey, psiStrategy } : {}),
          settings: {
            chromeFlags: method === "node" ? chromeFlags : undefined,
            preset: psiStrategy === "desktop" ? "desktop" : "mobile",
          },
        },
      },
    };

    if (outputDir) {
      config.ci.upload = {
        target: "filesystem",
        outputDir,
      };
    }

    return config;
  }

  /**
   * Gets the generated configuration
   * @returns LHCI configuration object
   */
  getConfig(): LHCIConfig {
    return this.config;
  }

  /**
   * Adds assertion thresholds to the configuration
   * @param thresholds - Performance thresholds to assert
   * @returns This runner instance for chaining
   */
  withAssertions(thresholds: PerformanceThresholds): this {
    const assertions: LHCIAssertions = {};

    if (thresholds.performance !== undefined) {
      assertions["categories:performance"] = [
        "error",
        { minScore: thresholds.performance / 100 },
      ];
    }
    if (thresholds.accessibility !== undefined) {
      assertions["categories:accessibility"] = [
        "error",
        { minScore: thresholds.accessibility / 100 },
      ];
    }
    if (thresholds.bestPractices !== undefined) {
      assertions["categories:best-practices"] = [
        "error",
        { minScore: thresholds.bestPractices / 100 },
      ];
    }
    if (thresholds.seo !== undefined) {
      assertions["categories:seo"] = [
        "error",
        { minScore: thresholds.seo / 100 },
      ];
    }
    if (thresholds.lcp !== undefined) {
      assertions["largest-contentful-paint"] = [
        "error",
        { maxNumericValue: thresholds.lcp },
      ];
    }
    if (thresholds.fcp !== undefined) {
      assertions["first-contentful-paint"] = [
        "error",
        { maxNumericValue: thresholds.fcp },
      ];
    }
    if (thresholds.cls !== undefined) {
      assertions["cumulative-layout-shift"] = [
        "error",
        { maxNumericValue: thresholds.cls },
      ];
    }
    if (thresholds.tbt !== undefined) {
      assertions["total-blocking-time"] = [
        "error",
        { maxNumericValue: thresholds.tbt },
      ];
    }

    this.config.ci.assert = { assertions };
    return this;
  }

  /**
   * Configures upload to temporary public storage
   * @returns This runner instance for chaining
   */
  withTemporaryStorage(): this {
    this.config.ci.upload = {
      target: "temporary-public-storage",
    };
    return this;
  }

  /**
   * Configures upload to LHCI server
   * @param serverBaseUrl - LHCI server URL
   * @param token - Build token
   * @returns This runner instance for chaining
   */
  withLHCIServer(serverBaseUrl: string, token: string): this {
    this.config.ci.upload = {
      target: "lhci",
      serverBaseUrl,
      token,
    };
    return this;
  }

  /**
   * Runs Lighthouse CI with the configured options
   * @returns Promise resolving to exit code (0 for success)
   */
  async run(): Promise<number> {
    // Dynamic import to avoid requiring @lhci/cli at module load time
    try {
      const { autorun } = await import("@lhci/cli");

      // Run with the ci config
      const result = await autorun(this.config.ci);
      return result.success ? 0 : 1;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "MODULE_NOT_FOUND") {
        throw new Error(
          "Lighthouse CI (@lhci/cli) is not installed. " +
            "Install it with: npm install -D @lhci/cli",
        );
      }
      throw error;
    }
  }

  /**
   * Generates a lighthouserc.js configuration file content
   * @returns Configuration file content as string
   */
  generateConfigFile(): string {
    const configContent = `/** @type {import('@lhci/cli').LighthouseConfig} */
module.exports = ${JSON.stringify(this.config, null, 2)};
`;
    return configContent;
  }
}

/**
 * Creates a Lighthouse runner for staging/internal URLs (uses local Chrome)
 * @param urls - URLs to analyze
 * @param options - Additional options
 * @returns Configured LighthouseRunner
 */
export function createNodeRunner(
  urls: string[],
  options: Partial<Omit<LHCIOptions, "urls" | "method">> = {},
): LighthouseRunner {
  return new LighthouseRunner({
    urls,
    method: "node",
    ...options,
  });
}

/**
 * Creates a Lighthouse runner for production URLs (uses PageSpeed API)
 * @param urls - URLs to analyze
 * @param psiApiKey - PageSpeed Insights API key
 * @param options - Additional options
 * @returns Configured LighthouseRunner
 */
export function createPSIRunner(
  urls: string[],
  psiApiKey: string,
  options: Partial<Omit<LHCIOptions, "urls" | "method" | "psiApiKey">> = {},
): LighthouseRunner {
  return new LighthouseRunner({
    urls,
    method: "psi",
    psiApiKey,
    ...options,
  });
}

/**
 * Creates a hybrid runner that uses node for staging and PSI for production
 * @param config - Configuration with staging and production URLs
 * @returns Object with staging and production runners
 */
export function createHybridRunners(config: {
  stagingUrls: string[];
  productionUrls: string[];
  psiApiKey: string;
  thresholds?: PerformanceThresholds;
}): {
  staging: LighthouseRunner;
  production: LighthouseRunner;
} {
  const { stagingUrls, productionUrls, psiApiKey, thresholds } = config;

  const staging = createNodeRunner(stagingUrls);
  const production = createPSIRunner(productionUrls, psiApiKey);

  if (thresholds) {
    staging.withAssertions(thresholds);
    production.withAssertions(thresholds);
  }

  return { staging, production };
}

/**
 * Generates default performance thresholds based on Core Web Vitals
 * @param strict - Whether to use stricter thresholds
 * @returns Performance thresholds object
 */
export function getDefaultThresholds(strict = false): PerformanceThresholds {
  if (strict) {
    return {
      performance: 90,
      accessibility: 90,
      bestPractices: 90,
      seo: 90,
      lcp: 2500, // Good: < 2.5s
      fcp: 1800,
      cls: 0.1,
      tbt: 200,
    };
  }

  return {
    performance: 50,
    accessibility: 80,
    bestPractices: 80,
    seo: 80,
    lcp: 4000, // Needs improvement: < 4s
    fcp: 3000,
    cls: 0.25,
    tbt: 600,
  };
}
