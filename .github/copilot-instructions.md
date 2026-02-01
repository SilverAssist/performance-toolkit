# Copilot Instructions for @silverassist/performance-toolkit

## Project Overview

NPM package providing PageSpeed Insights API v5 and Lighthouse CI integration for performance monitoring. Includes Copilot prompts and Agent Skills for AI-assisted performance optimization. Dual ESM/CJS output with TypeScript.

## Architecture

```
src/
├── index.ts              # Re-exports everything, update when adding modules
├── pagespeed/index.ts    # PageSpeedClient class - API wrapper, transforms PSI response to PerformanceResult
├── lighthouse/index.ts   # LighthouseRunner class - fluent builder pattern wrapping @lhci/cli
├── context/index.ts      # ProjectContextDetector - detects frameworks, patterns
├── report/index.ts       # ActionableReportGenerator - creates AI-friendly reports
├── types/index.ts        # All TypeScript interfaces - export new types here
└── .github/              # Distributable prompts & skills (installed to user projects)
    ├── prompts/          # Copilot prompts (manually invoked)
    │   ├── *.prompt.md
    │   └── _partials/
    └── skills/           # Agent Skills (auto-loaded by Copilot)
        ├── nextjs-performance/
        └── web-performance-analysis/

bin/
├── cli.js                # CLI entry (perf-check) - pure JavaScript, no build step
└── install-prompts.js    # Prompt & Skills installer (perf-prompts)

.github/                  # Repository-specific (CI, dependabot, copilot-instructions)
├── copilot-instructions.md
├── dependabot.yml
└── workflows/
```

## Development Commands

```bash
npm run build          # tsup → dist/ (ESM + CJS + .d.ts)
npm test               # Jest tests
npm run typecheck      # tsc --noEmit
npm run lint           # ESLint
```

## Key Conventions

### Adding New Module Exports

1. Create module in `src/[module]/index.ts`
2. Add types to `src/types/index.ts`
3. Re-export from `src/index.ts`
4. Add entry to `tsup.config.ts`:
   ```typescript
   entry: {
     "newmodule/index": "src/newmodule/index.ts",
   }
   ```
5. Add to `package.json` exports field (copy pattern from existing)

### CLI Scripts (bin/)

- **Pure JavaScript** - no TypeScript, directly executable with `#!/usr/bin/env node`
- Use ESM imports (`import fs from "fs"`)
- Dynamically import built library: `await import("../dist/index.mjs")`
- Load `.env.local` or `.env` automatically (see `loadEnvFile()` in cli.js)

### Testing Patterns

- Location: `__tests__/[module].test.ts`
- Mock `global.fetch` for PageSpeed tests:
  ```typescript
  const mockFetch = jest.fn();
  global.fetch = mockFetch;
  ```
- Test `LighthouseRunner` config generation only (don't call `@lhci/cli`)

## Prompts & Skills

**Prompts** (`src/.github/prompts/*.prompt.md`):
- Manually invoked by users with `@workspace /performance/[name]`
- Use `_partials/` for shared content via markdown includes
- Target path when installed: `.github/prompts/performance/`

**Skills** (`src/.github/skills/*/SKILL.md`):
- Auto-loaded by Copilot based on context relevance
- Require `chat.useAgentSkills` setting in VS Code
- Portable: work in VS Code, Copilot CLI, and Copilot coding agent
- Target path when installed: `.github/skills/[skill-name]/`

**Adding new prompts:**
1. Create `[name].prompt.md` in `src/.github/prompts/`
2. Use YAML frontmatter for metadata (optional)
3. Reference partials with `[label](path/to/partial.md)`

**Adding new skills:**
1. Create directory `src/.github/skills/[skill-name]/`
2. Add `SKILL.md` with required YAML frontmatter (`name`, `description`)
3. Update `ourSkills` array in `bin/install-prompts.js` for uninstall

## API Design Patterns

**Thresholds use milliseconds/scores:**
```typescript
getDefaultThresholds() // { performance: 75, lcp: 2500, fcp: 1800, cls: 0.1, tbt: 300 }
```

**Two Lighthouse methods:**
- `createPSIRunner()` - For production URLs (uses Google's infrastructure)
- `createNodeRunner()` - For staging/internal URLs (local Chrome)

**Builder pattern for LighthouseRunner:**
```typescript
createPSIRunner(urls, key)
  .withAssertions(getDefaultThresholds())
  .withTemporaryStorage()
  .run()
```

## Environment

- `PAGESPEED_API_KEY` - Google API key for higher rate limits
- Node >= 18.0.0 required
- `@lhci/cli` is optional peer dependency (only needed for Lighthouse runner)
