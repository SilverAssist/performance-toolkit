#!/usr/bin/env node

/**
 * @silverassist/performance-toolkit CLI
 *
 * Command-line interface for performance analysis
 *
 * Usage:
 *   perf-check <url> [options]
 *   perf-check --config performance.config.js
 *
 * Commands:
 *   check     Analyze URL(s) and report Core Web Vitals
 *   compare   Compare results against baseline
 *   report    Generate detailed performance report
 *
 * Options:
 *   --mobile, -m       Use mobile strategy (default)
 *   --desktop, -d      Use desktop strategy
 *   --verbose, -v      Show detailed output
 *   --insights, -i     Show all detailed insights (for AI agents)
 *   --json, -j         Output structured JSON (for programmatic use)
 *   --ci               CI mode (exit with error on threshold violations)
 *   --config, -c       Path to configuration file
 *   --output, -o       Output file path (JSON)
 *   --baseline, -b     Compare against baseline file
 *
 * Environment:
 *   PAGESPEED_API_KEY  Google PageSpeed API key (recommended for higher rate limits)
 *   CI                 Set automatically in CI/CD environments
 *
 * @module @silverassist/performance-toolkit/cli
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ===========================================================================
// Environment Detection & Configuration
// ===========================================================================

/**
 * Detect if running in CI/CD environment
 * @returns {boolean}
 */
function isCI() {
  return !!(
    process.env.CI ||
    process.env.CONTINUOUS_INTEGRATION ||
    process.env.GITHUB_ACTIONS ||
    process.env.GITLAB_CI ||
    process.env.BITBUCKET_BUILD_NUMBER ||
    process.env.JENKINS_URL ||
    process.env.CIRCLECI ||
    process.env.TRAVIS
  );
}

/**
 * Load environment variables from .env files (simple implementation without dependencies)
 * Checks: .env.local, .env in current working directory
 */
function loadEnvFile() {
  const cwd = process.cwd();
  const envFiles = [".env.local", ".env"];

  for (const envFile of envFiles) {
    const envPath = path.join(cwd, envFile);

    if (fs.existsSync(envPath)) {
      try {
        const content = fs.readFileSync(envPath, "utf-8");
        const lines = content.split("\n");

        for (const line of lines) {
          // Skip comments and empty lines
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith("#")) continue;

          // Parse KEY=value (handle quotes)
          const match = trimmed.match(/^([^=]+)=(.*)$/);
          if (match) {
            const key = match[1].trim();
            let value = match[2].trim();

            // Remove surrounding quotes if present
            if ((value.startsWith('"') && value.endsWith('"')) ||
                (value.startsWith("'") && value.endsWith("'"))) {
              value = value.slice(1, -1);
            }

            // Only set if not already defined (env vars take precedence)
            if (process.env[key] === undefined) {
              process.env[key] = value;
            }
          }
        }

        return envFile; // Return which file was loaded
      } catch {
        // Silently ignore read errors
      }
    }
  }

  return null;
}

// ===========================================================================
// ANSI color codes
// ===========================================================================

const COLORS = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
};

/**
 * Print colored message to console
 * @param {string} message - Message to print
 * @param {string} color - Color key from COLORS
 */
function log(message, color = "reset") {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

/**
 * Print success message
 * @param {string} message - Message to print
 */
function success(message) {
  log(`✅ ${message}`, "green");
}

/**
 * Print warning message
 * @param {string} message - Message to print
 */
function warn(message) {
  log(`⚠️  ${message}`, "yellow");
}

/**
 * Print error message
 * @param {string} message - Message to print
 */
function error(message) {
  log(`❌ ${message}`, "red");
}

/**
 * Print info message
 * @param {string} message - Message to print
 */
function info(message) {
  log(`ℹ️  ${message}`, "cyan");
}

/**
 * Get rating color based on metric rating
 * @param {string} rating - Metric rating (good, needs-improvement, poor)
 * @returns {string} Color key
 */
function getRatingColor(rating) {
  switch (rating) {
    case "good":
      return "green";
    case "needs-improvement":
      return "yellow";
    case "poor":
      return "red";
    default:
      return "reset";
  }
}

/**
 * Get score color based on numeric score
 * @param {number} score - Score from 0-100
 * @returns {string} Color key
 */
function getScoreColor(score) {
  if (score >= 90) return "green";
  if (score >= 50) return "yellow";
  return "red";
}

/**
 * Format metric value with color
 * @param {object} metric - Metric object with value, displayValue, rating
 * @returns {string} Formatted string
 */
function formatMetric(metric) {
  const color = getRatingColor(metric.rating);
  return `${COLORS[color]}${metric.displayValue}${COLORS.reset}`;
}

/**
 * Format bytes to human readable
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted string
 */
function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Truncate URL for display
 * @param {string} url - Full URL
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated URL
 */
function truncateUrl(url, maxLength = 60) {
  if (url.length <= maxLength) return url;
  return url.substring(0, maxLength - 3) + "...";
}

/**
 * Print Core Web Vitals summary
 * @param {object} result - Performance result
 */
function printSummary(result) {
  console.log("");
  log("═══════════════════════════════════════════════════════════════", "dim");
  log(`📊 Performance Report: ${result.url}`, "bright");
  log(`   Strategy: ${result.strategy.toUpperCase()} | ${result.timestamp}`, "dim");
  log("═══════════════════════════════════════════════════════════════", "dim");

  // Category Scores
  console.log("");
  log("📈 Category Scores", "cyan");
  log("───────────────────────────────────────────────────────────────", "dim");

  const scores = result.scores;
  if (scores.performance !== null) {
    const color = getScoreColor(scores.performance);
    console.log(`   Performance:    ${COLORS[color]}${scores.performance}${COLORS.reset}/100`);
  }
  if (scores.accessibility !== null) {
    const color = getScoreColor(scores.accessibility);
    console.log(`   Accessibility:  ${COLORS[color]}${scores.accessibility}${COLORS.reset}/100`);
  }
  if (scores.bestPractices !== null) {
    const color = getScoreColor(scores.bestPractices);
    console.log(`   Best Practices: ${COLORS[color]}${scores.bestPractices}${COLORS.reset}/100`);
  }
  if (scores.seo !== null) {
    const color = getScoreColor(scores.seo);
    console.log(`   SEO:            ${COLORS[color]}${scores.seo}${COLORS.reset}/100`);
  }

  // Core Web Vitals
  console.log("");
  log("⚡ Core Web Vitals", "cyan");
  log("───────────────────────────────────────────────────────────────", "dim");

  const metrics = result.metrics;
  console.log(`   LCP (Largest Contentful Paint):  ${formatMetric(metrics.lcp)}`);
  console.log(`   FCP (First Contentful Paint):    ${formatMetric(metrics.fcp)}`);
  console.log(`   CLS (Cumulative Layout Shift):   ${formatMetric(metrics.cls)}`);
  console.log(`   TBT (Total Blocking Time):       ${formatMetric(metrics.tbt)}`);
  console.log(`   SI  (Speed Index):               ${formatMetric(metrics.si)}`);
  console.log(`   TTI (Time to Interactive):       ${formatMetric(metrics.tti)}`);

  // LCP Element
  if (result.lcpElement) {
    console.log("");
    log("🖼️  LCP Element", "cyan");
    log("───────────────────────────────────────────────────────────────", "dim");
    console.log(`   Tag:      ${result.lcpElement.tagName}`);
    console.log(`   Selector: ${result.lcpElement.selector || "N/A"}`);
    if (result.lcpElement.url) {
      console.log(`   URL:      ${truncateUrl(result.lcpElement.url)}`);
    }
    if (result.lcpElement.snippet) {
      console.log(`   Snippet:  ${result.lcpElement.snippet.substring(0, 80)}...`);
    }
  }

  console.log("");
  log("═══════════════════════════════════════════════════════════════", "dim");
}

/**
 * Print opportunities for improvement
 * @param {Array} opportunities - Array of opportunity objects
 */
function printOpportunities(opportunities) {
  if (opportunities.length === 0) return;

  console.log("");
  log("💡 Opportunities for Improvement", "cyan");
  log("───────────────────────────────────────────────────────────────", "dim");

  const topOpportunities = opportunities.slice(0, 5);
  topOpportunities.forEach((op, index) => {
    const savings = op.savingsMs ? `(~${Math.round(op.savingsMs)}ms)` : "";
    console.log(`   ${index + 1}. ${op.title} ${COLORS.yellow}${savings}${COLORS.reset}`);
  });

  if (opportunities.length > 5) {
    info(`   ... and ${opportunities.length - 5} more`);
  }
}

/**
 * Print detailed insights for AI agents
 * @param {object} insights - Detailed insights object
 */
function printDetailedInsights(insights) {
  if (!insights) {
    warn("No detailed insights available");
    return;
  }

  console.log("");
  log("═══════════════════════════════════════════════════════════════", "dim");
  log("🔍 DETAILED INSIGHTS (AI-Actionable Data)", "bright");
  log("═══════════════════════════════════════════════════════════════", "dim");

  // LCP Breakdown
  if (insights.lcpBreakdown) {
    console.log("");
    log("⏱️  LCP Timing Breakdown", "magenta");
    log("───────────────────────────────────────────────────────────────", "dim");
    const b = insights.lcpBreakdown;
    console.log(`   TTFB (Server Response):     ${COLORS.yellow}${b.ttfb}ms${COLORS.reset}`);
    console.log(`   Resource Load Delay:        ${COLORS.yellow}${b.resourceLoadDelay}ms${COLORS.reset}`);
    console.log(`   Resource Load Duration:     ${COLORS.yellow}${b.resourceLoadDuration}ms${COLORS.reset}`);
    console.log(`   Element Render Delay:       ${COLORS.yellow}${b.elementRenderDelay}ms${COLORS.reset}`);
    console.log(`   ─────────────────────────────`);
    console.log(`   Total LCP:                  ${COLORS.bright}${b.total}ms${COLORS.reset}`);
  }

  // Third-Party Impact
  if (insights.thirdParties?.length > 0) {
    console.log("");
    log("🌐 Third-Party Script Impact", "magenta");
    log("───────────────────────────────────────────────────────────────", "dim");
    
    insights.thirdParties.slice(0, 10).forEach((tp) => {
      const blockingColor = tp.blockingTime > 200 ? "red" : tp.blockingTime > 50 ? "yellow" : "green";
      console.log(`   ${COLORS.bright}${tp.entity}${COLORS.reset} (${tp.category || "other"})`);
      console.log(`      Blocking Time: ${COLORS[blockingColor]}${tp.blockingTime.toFixed(0)}ms${COLORS.reset}`);
      console.log(`      Transfer Size: ${formatBytes(tp.transferSize)}`);
      console.log(`      Requests: ${tp.requestCount}`);
    });
    
    if (insights.thirdParties.length > 10) {
      info(`   ... and ${insights.thirdParties.length - 10} more third-parties`);
    }
  }

  // Unused JavaScript
  if (insights.unusedJavaScript?.length > 0) {
    console.log("");
    log("📦 Unused JavaScript", "magenta");
    log("───────────────────────────────────────────────────────────────", "dim");
    
    let totalWasted = 0;
    insights.unusedJavaScript.slice(0, 10).forEach((js) => {
      totalWasted += js.wastedBytes;
      const partyTag = js.isFirstParty ? `${COLORS.cyan}[1st]${COLORS.reset}` : `${COLORS.dim}[3rd: ${js.entity || "unknown"}]${COLORS.reset}`;
      console.log(`   ${partyTag} ${truncateUrl(js.url, 50)}`);
      console.log(`      Wasted: ${COLORS.yellow}${formatBytes(js.wastedBytes)}${COLORS.reset} (${js.wastedPercent}% unused)`);
    });
    
    console.log(`   ─────────────────────────────`);
    console.log(`   ${COLORS.bright}Total Wasted: ${formatBytes(totalWasted)}${COLORS.reset}`);
    
    if (insights.unusedJavaScript.length > 10) {
      info(`   ... and ${insights.unusedJavaScript.length - 10} more scripts`);
    }
  }

  // Unused CSS
  if (insights.unusedCSS?.length > 0) {
    console.log("");
    log("🎨 Unused CSS", "magenta");
    log("───────────────────────────────────────────────────────────────", "dim");
    
    let totalWasted = 0;
    insights.unusedCSS.slice(0, 5).forEach((css) => {
      totalWasted += css.wastedBytes;
      const partyTag = css.isFirstParty ? `${COLORS.cyan}[1st]${COLORS.reset}` : `${COLORS.dim}[3rd]${COLORS.reset}`;
      console.log(`   ${partyTag} ${truncateUrl(css.url, 50)}`);
      console.log(`      Wasted: ${COLORS.yellow}${formatBytes(css.wastedBytes)}${COLORS.reset} (${css.wastedPercent}% unused)`);
    });
    
    console.log(`   ${COLORS.bright}Total Wasted: ${formatBytes(totalWasted)}${COLORS.reset}`);
  }

  // Cache Issues
  if (insights.cacheIssues?.length > 0) {
    console.log("");
    log("💾 Cache Policy Issues", "magenta");
    log("───────────────────────────────────────────────────────────────", "dim");
    
    insights.cacheIssues.slice(0, 8).forEach((cache) => {
      const entityTag = cache.entity ? `${COLORS.dim}[${cache.entity}]${COLORS.reset}` : "";
      const ttlColor = cache.cacheTTL === 0 ? "red" : cache.cacheTTL < 86400000 ? "yellow" : "green";
      console.log(`   ${truncateUrl(cache.url, 50)} ${entityTag}`);
      console.log(`      TTL: ${COLORS[ttlColor]}${cache.cacheTTLDisplay}${COLORS.reset} | Size: ${formatBytes(cache.transferSize)}`);
    });
    
    if (insights.cacheIssues.length > 8) {
      info(`   ... and ${insights.cacheIssues.length - 8} more resources`);
    }
  }

  // Image Issues
  if (insights.imageIssues?.length > 0) {
    console.log("");
    log("🖼️  Image Optimization Issues", "magenta");
    log("───────────────────────────────────────────────────────────────", "dim");
    
    insights.imageIssues.slice(0, 5).forEach((img) => {
      const typeColor = img.issueType === "offscreen" ? "cyan" : img.issueType === "format" ? "yellow" : "red";
      console.log(`   ${COLORS[typeColor]}[${img.issueType}]${COLORS.reset} ${truncateUrl(img.url, 45)}`);
      console.log(`      Potential Savings: ${COLORS.yellow}${formatBytes(img.wastedBytes)}${COLORS.reset}`);
      console.log(`      Action: ${img.recommendation}`);
    });
    
    if (insights.imageIssues.length > 5) {
      info(`   ... and ${insights.imageIssues.length - 5} more images`);
    }
  }

  // Legacy JavaScript
  if (insights.legacyJavaScript?.length > 0) {
    console.log("");
    log("📜 Legacy JavaScript (Polyfills)", "magenta");
    log("───────────────────────────────────────────────────────────────", "dim");
    
    insights.legacyJavaScript.slice(0, 5).forEach((legacy) => {
      console.log(`   ${truncateUrl(legacy.url, 50)}`);
      console.log(`      Wasted: ${COLORS.yellow}${formatBytes(legacy.wastedBytes)}${COLORS.reset}`);
      if (legacy.polyfills.length > 0) {
        console.log(`      Polyfills: ${legacy.polyfills.slice(0, 3).join(", ")}${legacy.polyfills.length > 3 ? "..." : ""}`);
      }
    });
  }

  // Render-Blocking Resources
  if (insights.renderBlocking?.length > 0) {
    console.log("");
    log("🚧 Render-Blocking Resources", "magenta");
    log("───────────────────────────────────────────────────────────────", "dim");
    
    insights.renderBlocking.slice(0, 5).forEach((rb) => {
      const typeEmoji = rb.resourceType === "script" ? "📜" : rb.resourceType === "stylesheet" ? "🎨" : "📄";
      console.log(`   ${typeEmoji} ${truncateUrl(rb.url, 50)}`);
      console.log(`      Blocking Time: ${COLORS.red}${rb.wastedMs.toFixed(0)}ms${COLORS.reset} | Size: ${formatBytes(rb.transferSize)}`);
    });
    
    if (insights.renderBlocking.length > 5) {
      info(`   ... and ${insights.renderBlocking.length - 5} more resources`);
    }
  }

  // Long Tasks
  if (insights.longTasks?.length > 0) {
    console.log("");
    log("⏳ Long Main-Thread Tasks", "magenta");
    log("───────────────────────────────────────────────────────────────", "dim");
    
    insights.longTasks.slice(0, 5).forEach((task) => {
      const durationColor = task.duration > 200 ? "red" : task.duration > 100 ? "yellow" : "green";
      console.log(`   Duration: ${COLORS[durationColor]}${task.duration.toFixed(0)}ms${COLORS.reset} at ${task.startTime.toFixed(0)}ms`);
      if (task.url) {
        console.log(`      Source: ${truncateUrl(task.url, 50)}`);
      }
    });
  }

  // Total Savings Summary
  if (insights.totalSavings) {
    console.log("");
    log("═══════════════════════════════════════════════════════════════", "dim");
    log("📊 TOTAL POTENTIAL SAVINGS", "bright");
    log("───────────────────────────────────────────────────────────────", "dim");
    console.log(`   Time Savings:  ${COLORS.green}~${insights.totalSavings.timeMs}ms${COLORS.reset}`);
    console.log(`   Size Savings:  ${COLORS.green}${formatBytes(insights.totalSavings.sizeBytes)}${COLORS.reset}`);
    log("═══════════════════════════════════════════════════════════════", "dim");
  }
}

/**
 * Check thresholds and return violations
 * @param {object} result - Performance result
 * @param {object} thresholds - Threshold configuration
 * @returns {Array} Array of threshold violations
 */
function checkThresholds(result, thresholds) {
  const violations = [];

  if (thresholds.performance && result.scores.performance < thresholds.performance) {
    violations.push({
      metric: "performance",
      actual: result.scores.performance,
      threshold: thresholds.performance,
      severity: "error",
      url: result.url,
    });
  }

  if (thresholds.lcp && result.metrics.lcp.value > thresholds.lcp) {
    violations.push({
      metric: "LCP",
      actual: Math.round(result.metrics.lcp.value),
      threshold: thresholds.lcp,
      severity: "error",
      url: result.url,
    });
  }

  if (thresholds.fcp && result.metrics.fcp.value > thresholds.fcp) {
    violations.push({
      metric: "FCP",
      actual: Math.round(result.metrics.fcp.value),
      threshold: thresholds.fcp,
      severity: "error",
      url: result.url,
    });
  }

  if (thresholds.cls && result.metrics.cls.value > thresholds.cls) {
    violations.push({
      metric: "CLS",
      actual: result.metrics.cls.value.toFixed(3),
      threshold: thresholds.cls,
      severity: "error",
      url: result.url,
    });
  }

  if (thresholds.tbt && result.metrics.tbt.value > thresholds.tbt) {
    violations.push({
      metric: "TBT",
      actual: Math.round(result.metrics.tbt.value),
      threshold: thresholds.tbt,
      severity: "error",
      url: result.url,
    });
  }

  return violations;
}

/**
 * Print threshold violations
 * @param {Array} violations - Array of threshold violations
 */
function printViolations(violations) {
  if (violations.length === 0) {
    success("All thresholds passed!");
    return;
  }

  console.log("");
  error("Threshold Violations:");
  log("───────────────────────────────────────────────────────────────", "dim");

  violations.forEach((v) => {
    console.log(`   ❌ ${v.metric}: ${v.actual} (threshold: ${v.threshold})`);
  });
}

/**
 * Parse command line arguments
 * @returns {object} Parsed arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    url: null,
    strategy: "mobile",
    verbose: false,
    insights: false,
    json: false,
    ci: false,
    config: null,
    output: null,
    baseline: null,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case "--help":
      case "-h":
        options.help = true;
        break;
      case "--mobile":
      case "-m":
        options.strategy = "mobile";
        break;
      case "--desktop":
      case "-d":
        options.strategy = "desktop";
        break;
      case "--verbose":
      case "-v":
        options.verbose = true;
        break;
      case "--insights":
      case "-i":
        options.insights = true;
        break;
      case "--json":
      case "-j":
        options.json = true;
        break;
      case "--ci":
        options.ci = true;
        break;
      case "--config":
      case "-c":
        options.config = args[++i];
        break;
      case "--output":
      case "-o":
        options.output = args[++i];
        break;
      case "--baseline":
      case "-b":
        options.baseline = args[++i];
        break;
      default:
        if (!arg.startsWith("-") && !options.url) {
          options.url = arg;
        }
    }
  }

  return options;
}

/**
 * Show help message
 */
function showHelp() {
  log("\n📦 @silverassist/performance-toolkit\n", "bright");
  console.log("Usage: perf-check <url> [options]\n");

  log("Commands:", "cyan");
  console.log("  <url>              Analyze a URL and display Core Web Vitals\n");

  log("Options:", "cyan");
  console.log("  --mobile, -m       Use mobile strategy (default)");
  console.log("  --desktop, -d      Use desktop strategy");
  console.log("  --verbose, -v      Show detailed output including opportunities");
  console.log("  --insights, -i     Show all detailed insights (for AI agents)");
  console.log("  --json, -j         Output structured JSON (for programmatic use)");
  console.log("  --ci               CI mode (exit code 1 on threshold violations)");
  console.log("  --config, -c       Path to configuration file");
  console.log("  --output, -o       Output results to JSON file");
  console.log("  --baseline, -b     Compare against baseline file");
  console.log("  --help, -h         Show this help message\n");

  log("Examples:", "cyan");
  console.log("  perf-check https://www.familyassets.com");
  console.log("  perf-check https://www.familyassets.com --desktop --verbose");
  console.log("  perf-check https://www.familyassets.com --insights");
  console.log("  perf-check https://www.familyassets.com --json > report.json");
  console.log("  perf-check https://www.familyassets.com --ci --output results.json\n");

  log("Environment Variables:", "cyan");
  console.log("  PAGESPEED_API_KEY  Google PageSpeed API key (recommended for higher rate limits)");
  console.log("");
  console.log("  The CLI automatically loads .env.local or .env files from the current directory.");
  console.log("  In CI/CD pipelines, set PAGESPEED_API_KEY as a secret/environment variable.\n");

  log("CI/CD Integration:", "cyan");
  console.log("  # GitHub Actions");
  console.log("  env:");
  console.log("    PAGESPEED_API_KEY: ${{ secrets.PAGESPEED_API_KEY }}");
  console.log("");
  console.log("  # Bitbucket Pipelines");
  console.log("  export PAGESPEED_API_KEY=$PAGESPEED_API_KEY\n");

  log("AI Agent Usage:", "cyan");
  console.log("  Use --insights flag for detailed data that AI agents can use to");
  console.log("  identify optimization opportunities and propose specific code changes.");
  console.log("  Use --json for machine-readable output.\n");
}

/**
 * Main CLI entry point
 */
async function main() {
  const options = parseArgs();

  if (options.help) {
    showHelp();
    process.exit(0);
  }

  if (!options.url && !options.config) {
    error("No URL provided");
    showHelp();
    process.exit(1);
  }

  // Load .env.local or .env file if exists (for local development)
  const loadedEnvFile = loadEnvFile();
  
  const apiKey = process.env.PAGESPEED_API_KEY;
  const runningInCI = isCI();

  // Show environment info (unless in JSON mode)
  if (!options.json) {
    if (loadedEnvFile && apiKey) {
      info(`Loaded API key from ${loadedEnvFile}`);
    } else if (runningInCI && apiKey) {
      info("Using API key from CI/CD environment");
    } else if (!apiKey) {
      warn("PAGESPEED_API_KEY not found. Running in free tier mode (2 requests/min limit).");
      warn("Set PAGESPEED_API_KEY in .env.local or as environment variable for higher limits.");
    }
  }

  try {
    if (!options.json) {
      info(`Analyzing ${options.url} (${options.strategy})...`);
      console.log("");
    }

    // Dynamic import of the main module
    const { analyzeUrl } = await import("../dist/index.js");

    const result = await analyzeUrl(options.url, {
      strategy: options.strategy,
      apiKey,
    });

    // JSON output mode
    if (options.json) {
      const outputData = {
        url: result.url,
        strategy: result.strategy,
        timestamp: result.timestamp,
        scores: result.scores,
        metrics: {
          lcp: result.metrics.lcp,
          fcp: result.metrics.fcp,
          cls: result.metrics.cls,
          tbt: result.metrics.tbt,
          si: result.metrics.si,
          tti: result.metrics.tti,
        },
        lcpElement: result.lcpElement,
        insights: result.insights,
        opportunities: result.opportunities.map(op => ({
          id: op.id,
          title: op.title,
          savingsMs: op.savingsMs,
          savingsBytes: op.savingsBytes,
        })),
      };
      console.log(JSON.stringify(outputData, null, 2));
      process.exit(0);
    }

    // Print summary
    printSummary(result);

    // Print opportunities if verbose
    if (options.verbose && result.opportunities.length > 0) {
      printOpportunities(result.opportunities);
    }

    // Print detailed insights if requested
    if (options.insights && result.insights) {
      printDetailedInsights(result.insights);
    }

    // Save output if requested
    if (options.output) {
      const outputData = {
        ...result,
        rawResponse: undefined, // Remove raw response from output
      };
      fs.writeFileSync(options.output, JSON.stringify(outputData, null, 2));
      success(`Results saved to ${options.output}`);
    }

    // Check thresholds in CI mode
    if (options.ci) {
      const thresholds = {
        performance: 50,
        lcp: 4000,
        fcp: 3000,
        cls: 0.25,
        tbt: 600,
      };

      const violations = checkThresholds(result, thresholds);
      printViolations(violations);

      if (violations.length > 0) {
        process.exit(1);
      }
    }

    process.exit(0);
  } catch (err) {
    if (options.json) {
      console.log(JSON.stringify({ error: err.message }, null, 2));
    } else {
      error(`Analysis failed: ${err.message}`);
      if (options.verbose || options.insights) {
        console.error(err);
      }
    }
    process.exit(1);
  }
}

main();
