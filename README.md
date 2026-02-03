# @silverassist/performance-toolkit

PageSpeed Insights and Lighthouse CI integration for performance monitoring across SilverAssist projects.

[![npm version](https://img.shields.io/npm/v/@silverassist/performance-toolkit.svg)](https://www.npmjs.com/package/@silverassist/performance-toolkit)
[![License](https://img.shields.io/badge/license-PolyForm%20Noncommercial-blue.svg)](https://github.com/SilverAssist/performance-toolkit/blob/main/LICENSE)

## Features

- ✅ **PageSpeed Insights API v5** - Full API integration with CrUX data
- ✅ **Lighthouse CI** - Programmatic LHCI with node/psi methods
- ✅ **Bundle Analysis** - Next.js bundle size analysis with @next/bundle-analyzer
- ✅ **Core Web Vitals** - LCP, FCP, CLS, TBT extraction
- ✅ **LCP Element Detection** - Identify the LCP element
- ✅ **Opportunities & Diagnostics** - Performance improvement suggestions
- ✅ **Actionable Reports** - Framework-aware optimization recommendations
- ✅ **Project Context Detection** - Auto-detect Next.js, React, Vue, etc.
- ✅ **CLI Tool** - Command-line interface for quick analysis
- ✅ **Copilot Prompts & Skills** - Pre-built AI workflows for performance optimization
- ✅ **TypeScript** - Full type definitions with subpath exports
- ✅ **Multi-Project** - Support for FA, CC, AA, OSA

## Installation

```bash
npm install @silverassist/performance-toolkit
# or
yarn add @silverassist/performance-toolkit
# or
pnpm add @silverassist/performance-toolkit
```

## Quick Start

### PageSpeed Insights API

```typescript
import { analyzeUrl } from "@silverassist/performance-toolkit";

const result = await analyzeUrl("https://www.example.com", {
  strategy: "mobile",
  apiKey: process.env.PAGESPEED_API_KEY,
});

console.log("Performance Score:", result.scores.performance);
console.log("LCP:", result.metrics.lcp.displayValue);
console.log("CLS:", result.metrics.cls.displayValue);
```

### Lighthouse CI Integration

```typescript
import { createPSIRunner, getDefaultThresholds } from "@silverassist/performance-toolkit";

// Production URLs - use PSI method (consistent hardware)
const runner = createPSIRunner(
  ["https://www.example.com/care-type"],
  process.env.PAGESPEED_API_KEY
)
  .withAssertions(getDefaultThresholds())
  .withTemporaryStorage();

const exitCode = await runner.run();
```

### Staging/Internal URLs

```typescript
import { createNodeRunner } from "@silverassist/performance-toolkit";

// Staging URLs - use node method (local Chrome)
const runner = createNodeRunner([
  "https://staging.example.com/care-type",
]).withAssertions({
  performance: 50,
  lcp: 4000,
  fcp: 3000,
});

const exitCode = await runner.run();
```

## CLI Usage

```bash
# Basic analysis
perf-check https://www.example.com

# Desktop strategy with verbose output
perf-check https://www.example.com --desktop --verbose

# CI mode (exit code 1 on failures)
perf-check https://www.example.com --ci --output results.json
```

### CLI Options

| Option | Alias | Description |
|--------|-------|-------------|
| `--mobile` | `-m` | Use mobile strategy (default) |
| `--desktop` | `-d` | Use desktop strategy |
| `--verbose` | `-v` | Show detailed output including opportunities |
| `--insights` | `-i` | Show all detailed insights (for AI agents) |
| `--diagnostics` | | Show diagnostics table (PageSpeed format) |
| `--actionable` | `-a` | Generate actionable report with key opportunities |
| `--detect-context` | | Detect project technology stack |
| `--json` | `-j` | Output structured JSON (for programmatic use) |
| `--ci` | | CI mode (exit with error on violations) |
| `--output` | `-o` | Output results to JSON file |
| `--baseline` | `-b` | Compare against baseline file |
| `--config` | `-c` | Path to configuration file |
| `--help` | `-h` | Show help message |

## Bundle Analysis

Analyze Next.js bundle size and composition using `@next/bundle-analyzer`. This feature helps identify large dependencies, unused code, and optimization opportunities to reduce JavaScript bundle sizes.

### Quick Start

```bash
# Analyze current Next.js project
perf-bundle

# Analyze specific project with auto-install
perf-bundle /path/to/nextjs-project --auto-install

# Generate reports and open in browser
perf-bundle --open --auto-install
```

### Bundle Analysis Options

| Option | Description |
|--------|-------------|
| `project-path` | Path to Next.js project directory (default: current directory) |
| `--auto-install` | Automatically install @next/bundle-analyzer if missing |
| `--open` | Open HTML reports in browser after analysis |
| `--help`, `-h` | Show help message |

### How It Works

The `perf-bundle` command:

1. **Detects Next.js Project**: Verifies the project is a Next.js application
2. **Checks Dependencies**: Looks for `@next/bundle-analyzer` in package.json
3. **Auto-Install (Optional)**: Installs the analyzer if `--auto-install` flag is provided
4. **Injects Configuration**: Temporarily adds bundle analyzer to next.config
5. **Runs Build**: Executes `ANALYZE=true npm run build`
6. **Generates Reports**: Creates interactive HTML visualizations in `.next/analyze/`
7. **Restores Config**: Automatically restores original next.config file

### Generated Reports

Reports are created in `.next/analyze/` directory:

- **client.html**: Client-side JavaScript bundle breakdown
- **server.html**: Server-side bundle composition (if SSR is used)
- **edge.html**: Edge runtime bundles (if edge runtime is used)

Each report shows:
- Bundle size (parsed vs gzipped)
- Dependency tree visualization
- Package-by-package breakdown
- Module composition

### Integration with Performance Analysis

When `perf-check` identifies "Reduce unused JavaScript" opportunities, use `perf-bundle` to discover which specific dependencies are causing bloat:

```bash
# 1. Run performance check
perf-check https://your-site.com --insights

# 2. If "Unused JavaScript" is flagged, analyze bundle
perf-bundle --auto-install

# 3. Review generated reports to identify optimization targets
open .next/analyze/client.html
```

### Programmatic Usage

```typescript
import { analyzeBundle } from "@silverassist/performance-toolkit";

const result = await analyzeBundle({
  projectPath: "/path/to/nextjs-project",
  autoInstall: true,
});

if (result.success) {
  console.log("Reports:", result.reports);
  console.log("Summary:", result.summary);
} else {
  console.error("Error:", result.error);
}
```

**Note:** The `openBrowser` option is only available via the CLI. For programmatic usage, handle report opening in your own code using the returned `result.reports` paths.

### Best Practices

1. **Regular Analysis**: Run bundle analysis before major releases
2. **Set Budgets**: Establish bundle size budgets for your project
3. **Monitor Trends**: Track bundle size over time in CI/CD
4. **Review Dependencies**: Regularly audit large dependencies for lighter alternatives
5. **Code Splitting**: Use dynamic imports for heavy components identified in reports

### Troubleshooting

**"Not a Next.js project" error**:
- Ensure `package.json` contains `next` in dependencies

**Build fails during analysis**:
- Check that your Next.js project builds successfully without the analyzer
- Verify all dependencies are installed (`npm install`)

**No reports generated**:
- Check `.next/analyze/` directory exists
- Ensure build completed successfully

### AI Agent Usage

The toolkit provides detailed, structured insights that AI agents (like GitHub Copilot) can use to identify performance optimization opportunities and propose specific code changes.

```bash
# Get detailed insights in terminal format
perf-check https://www.example.com --insights

# Get machine-readable JSON for programmatic analysis
perf-check https://www.example.com --json > report.json
```

The `--insights` flag shows:
- **LCP Timing Breakdown**: TTFB, resource load delay, render delay
- **Third-Party Impact**: Blocking time and transfer size per vendor
- **Unused JavaScript**: Wasted bytes with first-party/third-party attribution
- **Unused CSS**: Stylesheets with coverage analysis
- **Cache Policy Issues**: Resources with poor or missing cache headers
- **Image Optimization**: Format, sizing, and lazy-loading opportunities
- **Legacy JavaScript**: Polyfills that can be removed
- **Render-Blocking Resources**: Scripts/styles delaying first paint
- **Long Tasks**: Main-thread blocking tasks with attribution

Example workflow for AI agents:

```bash
# 1. Generate structured report
perf-check https://example.com --json > perf-report.json

# 2. AI agent reads the report and identifies issues
# 3. AI agent proposes code changes based on insights.unusedJavaScript, etc.
```

### GitHub Copilot Prompts

The toolkit includes pre-built prompts for GitHub Copilot that provide structured workflows for performance optimization.

**Install prompts:**

```bash
# Create symlink to prompts (recommended - auto-updates with package)
npx perf-prompts install

# Or copy files instead (if you want to customize)
npx perf-prompts install --copy

# Check installation status
npx perf-prompts status

# Remove prompts
npx perf-prompts uninstall
```

**Available prompts:**

| Prompt | Description |
|--------|-------------|
| `analyze-performance` | Full performance analysis with actionable report |
| `optimize-lcp` | LCP optimization with Next.js streaming-aware patterns |
| `optimize-bundle` | JavaScript bundle analysis and code splitting |
| `nextjs-performance` | Next.js App Router specific optimizations |
| `detect-context` | Detect project technology stack |
| `performance-audit` | Complete multi-phase audit |

**Usage in VS Code:**

```
@workspace /performance/analyze-performance https://your-site.com
@workspace /performance/optimize-lcp
@workspace /performance/nextjs-performance
```

**Why symlinks?** Symlinks ensure prompts stay up-to-date automatically when you update the package. If you need to customize prompts, use `--copy` instead.

### Agent Skills

Agent Skills are auto-loaded by GitHub Copilot based on context relevance (requires `chat.useAgentSkills` setting in VS Code).

| Skill | Description |
|-------|-------------|
| `nextjs-performance` | Next.js App Router performance patterns |
| `web-performance-analysis` | General web performance optimization |

Skills are installed automatically with `npx perf-prompts install`.

## API Reference

### `analyzeUrl(url, options)`

Analyze a single URL using PageSpeed Insights API.

```typescript
interface PageSpeedOptions {
  url: string;
  strategy?: "mobile" | "desktop";
  categories?: ("performance" | "accessibility" | "best-practices" | "seo")[];
  apiKey?: string;
  timeout?: number;
}
```

### `PageSpeedClient`

Full client for multiple analyses:

```typescript
import { PageSpeedClient } from "@silverassist/performance-toolkit";

const client = new PageSpeedClient(process.env.PAGESPEED_API_KEY);

// Analyze both strategies
const { mobile, desktop } = await client.analyzeAll(
  "https://www.example.com"
);
```

### `LighthouseRunner`

Programmatic Lighthouse CI:

```typescript
import { LighthouseRunner } from "@silverassist/performance-toolkit";

const runner = new LighthouseRunner({
  urls: ["https://example.com"],
  method: "psi", // or "node"
  psiApiKey: process.env.PAGESPEED_API_KEY,
  numberOfRuns: 3,
});

// Add assertions
runner.withAssertions({
  performance: 90,
  lcp: 2500,
  cls: 0.1,
});

// Configure upload
runner.withTemporaryStorage();
// or
runner.withLHCIServer("https://lhci.example.com", "build-token");

// Run
const exitCode = await runner.run();
```

### `getDefaultThresholds(strict?)`

Get recommended thresholds:

```typescript
import { getDefaultThresholds } from "@silverassist/performance-toolkit";

// Standard thresholds
const standard = getDefaultThresholds();
// { performance: 50, lcp: 4000, fcp: 3000, cls: 0.25, tbt: 600 }

// Strict thresholds
const strict = getDefaultThresholds(true);
// { performance: 90, lcp: 2500, fcp: 1800, cls: 0.1, tbt: 200 }
```

### `detectProjectContext()`

Detect the project's technology stack:

```typescript
import { detectProjectContext } from "@silverassist/performance-toolkit";

const context = await detectProjectContext();

console.log(context.framework); // { name: "Next.js", version: "14.2.0" }
console.log(context.isSSR);     // true
console.log(context.hasAppDir); // true
```

### `generateActionableReport(result, context?)`

Generate an actionable report with framework-specific recommendations:

```typescript
import { analyzeUrl, generateActionableReport, detectProjectContext } from "@silverassist/performance-toolkit";

const result = await analyzeUrl("https://example.com");
const context = await detectProjectContext();
const report = generateActionableReport(result, context);

console.log(report.keyOpportunities);  // Top 3 prioritized opportunities
console.log(report.lcpAnalysis);       // LCP breakdown and recommendations
console.log(report.nextSteps);         // Prioritized action items
```

### `analyzeBundle(options?)`

Analyze Next.js bundle size and composition:

```typescript
import { analyzeBundle } from "@silverassist/performance-toolkit";

const result = await analyzeBundle({
  projectPath: "/path/to/nextjs-project",
  autoInstall: true,
});

if (result.success) {
  console.log("Client bundle:", result.reports?.client);
  console.log("Recommendations:", result.summary?.recommendations);
} else {
  console.error("Analysis failed:", result.error);
}
```

### `BundleAnalyzerRunner`

Full control over bundle analysis with logging callbacks:

```typescript
import { BundleAnalyzerRunner } from "@silverassist/performance-toolkit";

const runner = new BundleAnalyzerRunner({
  projectPath: process.cwd(),
  autoInstall: true,
});

// Set up logging (optional)
runner.setLogCallback((msg) => console.log(msg));
runner.setErrorCallback((msg) => console.error(msg));

const result = await runner.analyze();
```

## Performance Result

```typescript
interface PerformanceResult {
  url: string;
  strategy: "mobile" | "desktop";
  timestamp: string;
  scores: {
    performance: number | null;
    accessibility: number | null;
    bestPractices: number | null;
    seo: number | null;
  };
  metrics: {
    lcp: MetricValue;
    fcp: MetricValue;
    cls: MetricValue;
    tbt: MetricValue;
    si: MetricValue;
    tti: MetricValue;
  };
  lcpElement?: {
    tagName: string;
    selector: string;
    url?: string;
  };
  opportunities: Opportunity[];
  diagnostics: Diagnostic[];
  fieldData?: LoadingExperience;
}
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `PAGESPEED_API_KEY` | Google PageSpeed Insights API key |

Get your API key at: <https://developers.google.com/speed/docs/insights/v5/get-started>

### Local Development

The CLI automatically loads `.env.local` or `.env` files from the current directory:

```bash
# .env.local
PAGESPEED_API_KEY=your-api-key-here
```

Then simply run:

```bash
perf-check https://www.example.com --insights
```

### CI/CD Integration

#### GitHub Actions

```yaml
name: Performance Check

on: [push, pull_request]

jobs:
  performance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run Performance Check
        env:
          PAGESPEED_API_KEY: ${{ secrets.PAGESPEED_API_KEY }}
        run: npx perf-check https://www.example.com --ci
```

#### Bitbucket Pipelines

```yaml
pipelines:
  default:
    - step:
        name: Performance Check
        script:
          - npm ci
          - npx perf-check https://www.example.com --ci
        # Set PAGESPEED_API_KEY in Repository Settings > Pipelines > Environment variables
```

## Core Web Vitals Thresholds

Based on Google's guidelines:

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| LCP | < 2.5s | 2.5s - 4s | > 4s |
| FCP | < 1.8s | 1.8s - 3s | > 3s |
| CLS | < 0.1 | 0.1 - 0.25 | > 0.25 |
| TBT | < 200ms | 200ms - 600ms | > 600ms |

## TypeScript

Full TypeScript support with exported types:

```typescript
import type {
  CoreWebVitals,
  MetricValue,
  PerformanceResult,
  PageSpeedOptions,
  LHCIOptions,
  PerformanceThresholds,
  BundleAnalyzerOptions,
  BundleAnalysisResult,
} from "@silverassist/performance-toolkit";
```

### Subpath Exports

Import specific modules for smaller bundle size:

```typescript
// PageSpeed module only
import { PageSpeedClient, analyzeUrl } from "@silverassist/performance-toolkit/pagespeed";

// Lighthouse module only
import { LighthouseRunner, createPSIRunner } from "@silverassist/performance-toolkit/lighthouse";

// Bundle module only
import { BundleAnalyzerRunner, analyzeBundle } from "@silverassist/performance-toolkit/bundle";

// Types only (no runtime code)
import type { PerformanceResult, CoreWebVitals } from "@silverassist/performance-toolkit/types";
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Test
npm test

# Type check
npm run typecheck

# Lint
npm run lint
```

## License

[PolyForm Noncommercial License 1.0.0](LICENSE)

## Links

- [GitHub Repository](https://github.com/SilverAssist/performance-toolkit)
- [npm Package](https://www.npmjs.com/package/@silverassist/performance-toolkit)
- [PageSpeed Insights API](https://developers.google.com/speed/docs/insights/v5/get-started)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)

---

**Made with ❤️ by [Silver Assist](https://silverassist.com)**
