#!/usr/bin/env node

/**
 * @silverassist/performance-toolkit - Bundle Analysis CLI
 *
 * Command-line interface for Next.js bundle analysis using @next/bundle-analyzer
 *
 * Usage:
 *   perf-bundle [project-path] [options]
 *
 * Options:
 *   --auto-install     Automatically install @next/bundle-analyzer if missing
 *   --open             Open HTML reports in browser after analysis
 *   --help, -h         Show help message
 *
 * @module @silverassist/performance-toolkit/bundle-cli
 */

import fs from "fs";

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
};

// ===========================================================================
// Helper Functions
// ===========================================================================

function log(message, style = "reset") {
  console.log(`${COLORS[style]}${message}${COLORS.reset}`);
}

function info(message) {
  log(`ℹ️  ${message}`, "cyan");
}

function success(message) {
  log(`✅ ${message}`, "green");
}

function warn(message) {
  log(`⚠️  ${message}`, "yellow");
}

function error(message) {
  log(`❌ ${message}`, "red");
}

function printSectionHeader(title, emoji = "📦") {
  console.log("");
  log(`${emoji} ${title}`, "bright");
  log("═══════════════════════════════════════════════════════════════", "dim");
}

function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

// ===========================================================================
// Help Text
// ===========================================================================

function showHelp() {
  console.log(`
${COLORS.bright}@silverassist/performance-toolkit - Bundle Analysis${COLORS.reset}

${COLORS.cyan}USAGE${COLORS.reset}
  perf-bundle [project-path] [options]

${COLORS.cyan}DESCRIPTION${COLORS.reset}
  Analyze Next.js bundle size using @next/bundle-analyzer.
  Generates interactive HTML reports showing JavaScript bundle composition,
  dependencies, and optimization opportunities.

${COLORS.cyan}ARGUMENTS${COLORS.reset}
  project-path       Path to Next.js project directory (default: current directory)

${COLORS.cyan}OPTIONS${COLORS.reset}
  --auto-install     Automatically install @next/bundle-analyzer if missing
  --open             Open HTML reports in browser after analysis
  --help, -h         Show this help message

${COLORS.cyan}EXAMPLES${COLORS.reset}
  # Analyze current directory
  perf-bundle

  # Analyze specific project
  perf-bundle /path/to/nextjs-project

  # Auto-install analyzer if missing
  perf-bundle --auto-install

  # Generate reports and open in browser
  perf-bundle --open --auto-install

${COLORS.cyan}OUTPUT${COLORS.reset}
  Reports are generated in .next/analyze/ directory:
  - client.html    Client-side bundle visualization
  - server.html    Server-side bundle visualization (if SSR)
  - edge.html      Edge runtime bundle visualization (if using edge)

${COLORS.cyan}REQUIREMENTS${COLORS.reset}
  - Next.js project (package.json with "next" dependency)
  - @next/bundle-analyzer (will prompt to install if missing)

${COLORS.cyan}INTEGRATION WITH PERF-CHECK${COLORS.reset}
  When perf-check detects "Reduce unused JavaScript" opportunities,
  run perf-bundle to identify which dependencies to optimize.

${COLORS.cyan}LEARN MORE${COLORS.reset}
  https://github.com/SilverAssist/performance-toolkit#readme
`);
}

// ===========================================================================
// Argument Parsing
// ===========================================================================

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    projectPath: null,
    autoInstall: false,
    openBrowser: false,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case "--help":
      case "-h":
        options.help = true;
        break;
      case "--auto-install":
        options.autoInstall = true;
        break;
      case "--open":
        options.openBrowser = true;
        break;
      default:
        if (!arg.startsWith("-") && !options.projectPath) {
          options.projectPath = arg;
        } else if (arg.startsWith("-")) {
          warn(`Unknown option: ${arg}`);
        }
        break;
    }
  }

  // Default to current directory
  if (!options.projectPath) {
    options.projectPath = process.cwd();
  }

  return options;
}

// ===========================================================================
// Report Display
// ===========================================================================

function displayResults(result) {
  printSectionHeader("Bundle Analysis Results", "📊");

  if (!result.success) {
    error(`Analysis failed: ${result.error}`);
    console.log("");

    if (result.error && result.error.includes("not installed")) {
      info("To install @next/bundle-analyzer, run:");
      log("  npm install --save-dev @next/bundle-analyzer", "dim");
      log("  # or", "dim");
      log("  perf-bundle --auto-install", "dim");
    }

    return;
  }

  success("Bundle analysis completed successfully!");
  console.log("");

  // Project info
  log(`Project: ${COLORS.bright}${result.projectPath}${COLORS.reset}`);

  if (result.installedAnalyzer) {
    info("@next/bundle-analyzer was installed automatically");
  }

  console.log("");

  // Reports
  if (result.reports && Object.keys(result.reports).length > 0) {
    printSectionHeader("Generated Reports", "📄");

    if (result.reports.client) {
      log(
        `  Client Bundle: ${COLORS.cyan}${result.reports.client}${COLORS.reset}`,
      );
    }
    if (result.reports.server) {
      log(
        `  Server Bundle: ${COLORS.cyan}${result.reports.server}${COLORS.reset}`,
      );
    }
    if (result.reports.edge) {
      log(
        `  Edge Runtime:  ${COLORS.cyan}${result.reports.edge}${COLORS.reset}`,
      );
    }

    console.log("");
  }

  // Summary
  if (result.summary) {
    printSectionHeader("Summary & Recommendations", "💡");

    if (result.summary.totalClientSize > 0) {
      log(
        `  Total Client Bundle: ${COLORS.yellow}${formatBytes(result.summary.totalClientSize)}${COLORS.reset}`,
      );
    }

    if (result.summary.totalServerSize) {
      log(
        `  Total Server Bundle: ${COLORS.yellow}${formatBytes(result.summary.totalServerSize)}${COLORS.reset}`,
      );
    }

    console.log("");

    if (
      result.summary.recommendations &&
      result.summary.recommendations.length > 0
    ) {
      log("  Recommendations:", "bright");
      result.summary.recommendations.forEach((rec, i) => {
        log(`    ${i + 1}. ${rec}`, "dim");
      });
    }

    console.log("");
  }

  // Next steps
  printSectionHeader("Next Steps", "🚀");
  log("  1. Open the HTML reports to explore bundle composition", "dim");
  log("  2. Identify large dependencies that can be optimized", "dim");
  log("  3. Consider dynamic imports for heavy components", "dim");
  log("  4. Review third-party packages for lighter alternatives", "dim");
  console.log("");

  if (result.reports && result.reports.client) {
    info("To open reports:");
    log(`  open ${result.reports.client}`, "dim");
  }
}

// ===========================================================================
// Main Function
// ===========================================================================

async function main() {
  const options = parseArgs();

  if (options.help) {
    showHelp();
    process.exit(0);
  }

  // Verify project path exists
  if (!fs.existsSync(options.projectPath)) {
    error(`Project path does not exist: ${options.projectPath}`);
    process.exit(1);
  }

  printSectionHeader("Next.js Bundle Analyzer", "🔍");
  info(`Analyzing project: ${options.projectPath}`);
  console.log("");

  try {
    // Dynamic import of the bundle analyzer
    const { BundleAnalyzerRunner } = await import("../dist/index.js");

    const runner = new BundleAnalyzerRunner({
      projectPath: options.projectPath,
      autoInstall: options.autoInstall,
    });

    // Set up logging callbacks
    runner.setLogCallback((message) => {
      console.log(message);
    });

    runner.setErrorCallback((message) => {
      console.error(message);
    });

    const result = await runner.analyze();

    displayResults(result);

    if (!result.success) {
      process.exit(1);
    }

    // Open browser if requested
    if (options.openBrowser && result.reports && result.reports.client) {
      info("Opening reports in browser...");
      const { exec } = await import("child_process");
      const open =
        process.platform === "darwin"
          ? "open"
          : process.platform === "win32"
            ? "start"
            : "xdg-open";
      exec(`${open} ${result.reports.client}`);
    }

    process.exit(0);
  } catch (err) {
    error(`Bundle analysis failed: ${err.message}`);
    if (process.env.DEBUG) {
      console.error(err);
    }
    process.exit(1);
  }
}

main();
