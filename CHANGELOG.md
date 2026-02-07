# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.0] - 2026-02-07

### Changed

- **Next.js 16 Migration** - Complete update of all skills and prompts for Next.js 16
  
  #### Cache Components & "use cache" Directive

  - **Breaking**: Route segment configs (`revalidate`, `dynamic`, `fetchCache`) deprecated with `cacheComponents`
  - New `"use cache"` directive for file, component, and function-level caching
  - `cacheLife()` for cache duration: `'seconds'`, `'minutes'`, `'hours'`, `'days'`, `'weeks'`, `'max'`
  - `cacheTag()` and `updateTag()` for granular cache invalidation
  - `revalidateTag()` now requires cache profile as second argument
  
  #### Async Dynamic APIs (Breaking Change)

  - All dynamic APIs must now be awaited: `params`, `searchParams`, `cookies()`, `headers()`, `draftMode()`
  - Updated all code examples in skills and prompts
  
  #### Turbopack (Default Bundler)

  - Turbopack is now the default bundler in Next.js 16
  - Added `turbopackFileSystemCache: true` configuration
  - New `next experimental-analyze` command for bundle analysis
  - Context detector now returns `turbopack` as build tool for Next.js 16+
  
  #### React 19.2 Features

  - React Compiler for automatic memoization (eliminates manual `useMemo`/`useCallback`)
  - View Transitions for smooth page transitions
  - Activity component for preserved state during navigation
  
  #### Image Optimization

  - Default `minimumCacheTTL` changed to 4 hours (was 60 seconds)
  - Default quality coerced to `[75]`
  - `dangerouslyAllowLocalIP` required for localhost image sources
  - `images.domains` deprecated, use `remotePatterns`
  
  #### New Features

  - `proxy.ts` file convention for Node.js runtime request proxying
  - Parallel routes now require explicit `default.js` for fallback
  
  #### Removed Features

  - `next lint` CLI removed (use ESLint directly)
  - AMP support removed
  - `next/legacy/image` removed
  - `experimental.ppr` replaced by `cacheComponents: true`
  - `unstable_cache` deprecated (use `"use cache"`)
  
  #### Updated Files

  - `src/templates/skills/nextjs-performance/SKILL.md` - Complete rewrite for Next.js 16
  - `src/templates/prompts/nextjs-performance.prompt.md` - Cache Components patterns
  - `src/templates/prompts/_partials/performance-patterns.md` - All new patterns
  - `src/templates/prompts/optimize-lcp.prompt.md` - Updated for async params, new image defaults
  - `src/templates/prompts/optimize-bundle.prompt.md` - Turbopack and React Compiler
  - `src/templates/prompts/detect-context.prompt.md` - Next.js 16 feature detection
  - `src/context/index.ts` - Detect Next.js 16 features and Turbopack
  - `src/types/context/index.ts` - Documented new feature flags

### Breaking Changes

- **Node.js 20.9+** is now required by Next.js 16 projects
- Skills and prompts now target Next.js 16 patterns by default
- For Next.js 15 projects, some patterns may need adjustment

## [0.3.1] - 2026-02-03

### Added

- **CLI `--version` flag** - Show package version with `perf-check --version` or `-V`

### Changed

- **Renamed `src/.github` to `src/templates`** - Clearer naming for distributable prompts and skills
  - Updated all internal references in `package.json`, `bin/install-prompts.js`, and documentation
  - No breaking changes for consumers (installed paths remain `.github/prompts/` and `.github/skills/`)

- **Next.js 15 performance best practices** - Updated all skills and prompts with Next.js 15 patterns
  - Breaking change: `fetch()` is NOT cached by default (opt-in with `cache: 'force-cache'`)
  - Added Partial Prerendering (PPR) configuration and usage patterns
  - Added `use cache` directive for granular caching control
  - Added streaming metadata patterns
  - Added Server Actions configuration
  - Added context providers pattern (render deep, not wrapping `<html>`)
  - Updated `nextjs-performance` skill with comprehensive Next.js 15 guidance
  - Updated `nextjs-tree-shaking` skill with `optimizePackageImports` pre-configured packages
  - Updated `web-performance-analysis` skill with Next.js 15 considerations
  - Updated `performance-patterns.md` partial with all new patterns

## [0.3.0] - 2026-02-03

### Added

- **Export Pattern Analyzer** ([#13](https://github.com/SilverAssist/performance-toolkit/issues/13)) - Analyze module exports for tree-shaking optimization
  - `ExportAnalyzer` class for detecting suboptimal export patterns
  - `analyzeExports()` convenience function for quick analysis
  - `--audit-exports` CLI flag for command-line analysis
  - Detects default exports, barrel files, namespace re-exports
  - `next.config.js` analysis for `optimizePackageImports` configuration
  - Actionable recommendations with code examples and estimated impact
  - New subpath export: `@silverassist/performance-toolkit/analyzer`
  - New Copilot skill: `nextjs-tree-shaking` for AI-assisted optimization
  - New Copilot prompt: `audit-exports.prompt.md` for guided analysis

- **Bundle Analyzer Integration** ([#9](https://github.com/SilverAssist/performance-toolkit/issues/9)) - Integration with `@next/bundle-analyzer`
  - `BundleAnalyzerRunner` class with fluent builder pattern
  - `createBundleAnalyzer()` factory function
  - `analyzeBundle()` convenience function
  - `perf-bundle` CLI command for standalone bundle analysis
  - Chunk analysis with size tracking and dependency detection
  - Support for both client and server bundle analysis
  - New subpath export: `@silverassist/performance-toolkit/bundle`

- **GTM/GA Optimization Skill** ([#11](https://github.com/SilverAssist/performance-toolkit/issues/11)) - Copilot skill for Google Tag Manager optimization
  - New skill: `gtm-optimization` with validated dynamic import patterns
  - Best practices for GTM/GA4 integration in Next.js
  - Performance-focused loading strategies

### Fixed

- **ReDoS vulnerabilities** in export analyzer regex patterns
  - Replaced vulnerable nested quantifiers with bounded character classes
  - Uses `[^}]{1,1000}` pattern to prevent catastrophic backtracking

## [0.2.1] - 2026-02-01

### Added

- **Expanded test coverage** - Increased from 27.77% to 95.58% statements, 9.58% to 80.82% branches
  - Added comprehensive tests for `report/` module (utils, diagnostics, lcp, opportunities, generator)
  - Added tests for `context/` module with mocked filesystem
  - Added tests for `pagespeed/utils.ts` and `pagespeed/insights.ts`
  - Total: 242 tests across 10 test suites

### Changed

- **Improved prompt installer** (`bin/install-prompts.js`) - Major overhaul for better VS Code integration
  - Install prompts at root level (`.github/prompts/`) for proper VS Code recognition
  - Added manifest tracking (`.perf-toolkit-manifest.json`) to safely manage installed files
  - Safe directory names to protect user files from accidental overwrites
  - Prefixed prompt files with `performance/` namespace for organization

### Fixed

- **Type errors in test files** - Fixed MetricValue interface usage (removed non-existent `score` property)
- **AuditDetails type compliance** - Added required `type` field to mock audit details
- **ProjectContext completeness** - Added missing `buildTool` property in test fixtures
- **Prompt partial references** - Fixed relative paths in `nextjs-performance.prompt.md` and `optimize-lcp.prompt.md`

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

- Moved distributable Copilot prompts and skills from `.github/` to `src/templates/`
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
