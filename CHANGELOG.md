# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-02-01

### Changed

#### Module Refactoring (DDD Pattern)

- **Refactored `src/pagespeed/` module** - Split monolithic 814-line file into 6 focused modules:
  - `constants.ts` - API URLs, timeouts, audit IDs, third-party patterns
  - `utils.ts` - Formatting helpers (cache TTL, URL truncation, entity extraction)
  - `extractors.ts` - Score, metric, LCP, opportunity, diagnostic extractors
  - `insights.ts` - Detailed insights for AI agents (cache, images, JS, third-parties)
  - `client.ts` - PageSpeedClient class and factory functions
  - `index.ts` - Barrel exports for public API

- **Refactored `src/report/` module** - Split monolithic 959-line file into 6 focused modules:
  - `utils.ts` - Formatting and severity calculation helpers
  - `diagnostics.ts` - Diagnostics table generation
  - `lcp.ts` - LCP analysis and recommendations
  - `opportunities.ts` - Key opportunities with framework-specific guidance
  - `generator.ts` - ActionableReportGenerator class
  - `index.ts` - Barrel exports for public API

- **Refactored `bin/cli.js`** - Applied DRY principles to 1350+ line CLI:
  - Added global constants for colors/emojis (SEVERITY_*, IMPACT_*, STATUS_*, URGENCY_*)
  - Added helper functions: `getSeverityStyle()`, `getImpactStyle()`, `getStatusStyle()`
  - Added print helpers: `printSectionHeader()`, `printSectionFooter()`, `printLabeledValue()`, etc.
  - Refactored all major print functions to use shared helpers

#### JSDoc Header Standardization

- **Standardized file headers** across all TypeScript files (24 files updated):
  - Replaced `@packageDocumentation` with standard JSDoc tags
  - Added `@module` following DDD path structure (e.g., `pagespeed/client`)
  - Added `@author` with email
  - Added `@license PolyForm-Noncommercial-1.0.0`
  - Added `@see` link to repository (main entry point only)
  - Documented standards in `.github/copilot-instructions.md`

#### Types Refactoring (DDD Pattern)

- **Reorganized `src/types/` folder** following Domain-Driven Design pattern with barrel exports
- Split monolithic 967-line `index.ts` into 8 domain-specific modules:
  - `metrics/` - Core Web Vitals, MetricValue, CategoryScores
  - `pagespeed/` - PageSpeed API types (Strategy, Category, Options, Response, CrUX, Lighthouse)
  - `lighthouse/` - LHCI types (Method, Options, Assertions, Config)
  - `analysis/` - Results, diagnostics, opportunities, LCP elements, insights
  - `context/` - ProjectContext, FrameworkInfo
  - `report/` - ActionableReport, KeyOpportunity, NextStep
  - `cli/` - CLIOptions, CLIResult, ThresholdViolation
  - `config/` - PerformanceThresholds, ProjectConfig, ToolkitConfig
- Main `index.ts` now re-exports all domains using `export type {}` pattern
- **Backward compatible** - existing imports continue to work

#### Project Organization

- Moved distributable Copilot prompts and skills from `.github/` to `src/.github/`
  - Separates repository config from installable content
  - Updated `bin/install-prompts.js` paths
  - Updated `package.json` files array
- Updated `copilot-instructions.md` with current architecture documentation

## [0.1.0] - 2026-01-30

### Added

#### Core Features

- **PageSpeed Insights API Client** - Full integration with Google PageSpeed Insights API v5
  - `PageSpeedClient` class for multiple analyses
  - `analyzeUrl()` function for quick single-URL analysis
  - Support for mobile/desktop strategies
  - All four categories: Performance, Accessibility, Best Practices, SEO

#### Metrics Extraction

- **Core Web Vitals** - LCP, FCP, CLS, TBT, Speed Index, TTI
- **LCP Element Detection** - Identify the largest contentful paint element
- **Opportunities** - Performance improvement suggestions with estimated savings
- **Diagnostics** - Detailed diagnostic information

#### Detailed Insights for AI Agents

- **LCP Timing Breakdown** - TTFB, resource load delay, load duration, render delay
- **Third-Party Impact Analysis** - Blocking time and transfer size per vendor with category classification
- **Unused JavaScript Tracking** - Wasted bytes with first-party/third-party attribution
- **Unused CSS Analysis** - Stylesheets with coverage percentage
- **Cache Policy Issues** - Resources with poor or missing cache headers
- **Image Optimization** - Format, sizing, offscreen, and compression issues
- **Legacy JavaScript Detection** - Polyfills that can be removed
- **Render-Blocking Resources** - Scripts/styles delaying first paint
- **Long Tasks Detection** - Main-thread blocking tasks with URL attribution
- **Total Savings Summary** - Aggregate time and size savings

#### Lighthouse CI Integration

- **LighthouseRunner** class for programmatic LHCI execution
- Two execution methods:
  - `node` - Local Chrome for staging/internal URLs
  - `psi` - PageSpeed API for production URLs
- Assertion configuration for CI/CD pipelines
- Upload targets: temporary-public-storage, LHCI server, filesystem

#### CLI Tool

- `perf-check` command for command-line analysis
- Mobile/desktop strategy options
- Verbose mode with opportunities display
- `--insights` / `-i` flag - Show detailed insights in terminal format
- `--json` / `-j` flag - Output structured JSON for programmatic use
- CI mode with threshold validation
- JSON output support

#### Utilities

- `getDefaultThresholds()` - Standard and strict threshold presets
- `createNodeRunner()` - Quick setup for staging analysis
- `createPSIRunner()` - Quick setup for production analysis
- `createHybridRunners()` - Combined staging + production setup

#### TypeScript

- Complete type definitions for all APIs
- Exported types for external use
- Strict type checking

### Security

- API key support for higher rate limits
- No credentials stored in package

---

**Initial Release** for SilverAssist performance monitoring.
