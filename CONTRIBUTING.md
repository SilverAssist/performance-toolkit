# Contributing to @silverassist/performance-toolkit

## Project Overview

This is a **performance monitoring toolkit** for SilverAssist projects, built as an NPM package. It integrates PageSpeed Insights API and Lighthouse CI for comprehensive performance analysis.

**Key Architecture:**

- Build: TypeScript + tsup → dual ESM/CJS outputs
- Distribution: NPM package `@silverassist/performance-toolkit`
- CLI: `perf-check` command for quick analysis

## Project Structure

```
performance-toolkit/
├── src/
│   ├── index.ts              # Main entry point
│   ├── pagespeed/            # PageSpeed Insights API client
│   │   └── index.ts
│   ├── lighthouse/           # Lighthouse CI runner
│   │   └── index.ts
│   └── types/                # TypeScript definitions
│       └── index.ts
├── bin/
│   └── cli.js                # CLI entry point
├── __tests__/                # Test files
├── dist/                     # Build output (gitignored)
├── .github/
│   └── workflows/            # CI/CD workflows
├── package.json
├── tsconfig.json
└── tsup.config.ts
```

## Development Setup

```bash
# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Type check
npm run typecheck

# Lint
npm run lint

# Format
npm run format
```

## Coding Standards

### TypeScript

- Use explicit types, avoid `any`
- Export types from `src/types/index.ts`
- Use JSDoc comments for public APIs

### Testing

- Write tests for all new functionality
- Maintain >70% coverage
- Use Jest with ts-jest

### Documentation

- Update README.md for API changes
- Update CHANGELOG.md following Keep a Changelog format
- Add JSDoc comments for exported functions

## Git Workflow

### Commit Messages

```
feat: Add new feature
fix: Fix bug
docs: Update documentation
refactor: Refactor code
test: Add tests
chore: Maintenance
```

### Branches

- `main` - Production releases
- `dev` - Development branch
- `feature/*` - Feature branches
- `bugfix/*` - Bug fix branches

## Publishing

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Create GitHub release
4. CI will automatically publish to npm

## License

PolyForm Noncommercial License 1.0.0 - SilverAssist

This is NOT MIT. The library is for internal use and SilverAssist projects only.
