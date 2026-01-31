# Copilot Instructions for @silverassist/performance-toolkit

## Project Overview

NPM package providing PageSpeed Insights API v5 and Lighthouse CI integration for performance monitoring. Dual ESM/CJS output with TypeScript.

## Architecture

```
src/
├── index.ts              # Re-exports everything, update when adding modules
├── pagespeed/index.ts    # PageSpeedClient class - API wrapper, transforms PSI response to PerformanceResult
├── lighthouse/index.ts   # LighthouseRunner class - fluent builder pattern wrapping @lhci/cli
└── types/index.ts        # All TypeScript interfaces - export new types here
bin/cli.js                # CLI entry (perf-check) - pure JavaScript, no build step
```

**Key patterns:**
- `PageSpeedClient.analyze()` returns `PerformanceResult` with normalized metrics
- `LighthouseRunner` uses builder pattern: `createPSIRunner(urls, key).withAssertions().withTemporaryStorage().run()`
- Types are centralized in `src/types/index.ts` - always export from there and re-export from `src/index.ts`

## Development Commands

```bash
npm run build          # tsup → dist/ (ESM + CJS + .d.ts)
npm test               # Jest tests
npm run typecheck      # tsc --noEmit
npm run lint           # ESLint
```

## Key Conventions

**Adding new exports:**
1. Create module in `src/[module]/index.ts`
2. Add types to `src/types/index.ts`
3. Re-export from `src/index.ts`
4. Add entry to `tsup.config.ts` and `package.json` exports field

**CLI changes ([bin/cli.js](bin/cli.js)):**
- Pure JS (no TypeScript) - directly executable
- Dynamically imports built library from `../dist/index.mjs`
- Loads `.env.local` or `.env` automatically

**Test files:**
- Location: `__tests__/[module].test.ts`
- Mock `global.fetch` for PageSpeed tests
- Test `LighthouseRunner` config generation (don't call actual `@lhci/cli`)

## API Design Patterns

**Thresholds use milliseconds/scores:**
```typescript
getDefaultThresholds() // { performance: 75, lcp: 2500, fcp: 1800, cls: 0.1, tbt: 300 }
```

**Two Lighthouse methods:**
- `createPSIRunner()` - For production URLs (uses Google's infrastructure)
- `createNodeRunner()` - For staging/internal URLs (local Chrome)

**DetailedInsights types** (for AI consumption): `UnusedCodeIssue`, `CacheIssue`, `ImageIssue`, `ThirdPartyIssue`, etc.

## Environment

- `PAGESPEED_API_KEY` - Google API key for higher rate limits
- Node >= 18.0.0 required
- `@lhci/cli` is optional peer dependency (only needed for Lighthouse runner)
