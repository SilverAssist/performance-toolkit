# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
