---
description: "Prepare and validate a new release for @silverassist/performance-toolkit"
agent: agent
---

# Release Preparation for @silverassist/performance-toolkit

Prepare a new release following the checklist below. **DO NOT publish to npm directly** — use the GitHub Release workflow.

## Release Version

Target version: `{version}`

---

## Pre-Release Checklist

### 1. Run All Quality Checks

Execute all validation commands in sequence:

```bash
npm run lint           # ESLint
npm run format         # Prettier
npm run typecheck      # tsc --noEmit
npm test               # Jest tests
npm run build          # tsup → dist/ (ESM + CJS + .d.ts)
```

- [ ] Lint passes with no errors
- [ ] Format check passes
- [ ] TypeScript compilation succeeds
- [ ] All unit tests pass
- [ ] Build completes successfully

### 2. Version Consistency Check

Verify the version is consistent across all files:

- [ ] `package.json` → `version` field
- [ ] `src/index.ts` → `VERSION` constant
- [ ] `CHANGELOG.md` → Has entry for `[{version}]` with current date

**Action:** Read all three files and compare versions. If mismatched, update them to `{version}`.

### 3. CHANGELOG Validation

- [ ] `CHANGELOG.md` has an entry for version `{version}`
- [ ] Entry includes the current date in format `YYYY-MM-DD`
- [ ] `[Unreleased]` section is moved to new version section
- [ ] All changes are documented under appropriate sections (Added/Changed/Fixed/Removed)

### 4. Package.json Validation

Verify `package.json` has correct configuration:

- [ ] `name` is `@silverassist/performance-toolkit`
- [ ] `version` matches target version
- [ ] `files` array includes: `dist`, `bin`, `src/.github/prompts`, `src/.github/skills`, `README.md`, `LICENSE`, `CHANGELOG.md`
- [ ] `main` points to `./dist/index.js`
- [ ] `module` points to `./dist/index.mjs`
- [ ] `types` points to `./dist/index.d.ts`
- [ ] `type` is `module`
- [ ] `engines.node` is `>=18.0.0`
- [ ] `exports` field has entries for `.`, `./pagespeed`, `./lighthouse`, `./types`

### 5. Verify CLI Works

```bash
node bin/cli.js --help
node bin/cli.js --version
```

- [ ] `--help` shows usage information
- [ ] `--version` shows correct version

### 6. Check Package Contents

```bash
npm pack --dry-run
```

- [ ] All expected files are included:
  - `dist/` folder with built files
  - `bin/cli.js` and `bin/install-prompts.js`
  - `src/.github/prompts/` and `src/.github/skills/`
  - `README.md`, `LICENSE`, `CHANGELOG.md`
- [ ] No unnecessary files (node_modules, .git, __tests__, etc.)

### 7. Test prepublishOnly Script

```bash
npm run prepublishOnly
```

- [ ] Clean, build, and test all pass
- [ ] `dist/` folder is generated correctly

### 8. Dry Run Publish

```bash
npm publish --dry-run
```

- [ ] No errors
- [ ] Package size is reasonable (< 500KB)

### 9. Git Status Check

```bash
git status
```

- [ ] No uncommitted changes
- [ ] Working directory is clean

### 10. Verify Branch

```bash
git branch --show-current
```

- [ ] On `main` branch
- [ ] Branch is up to date with remote

---

## Release Process

**⚠️ DO NOT run `npm publish` locally!**

1. Commit all changes:
   ```bash
   git add -A
   git commit -m "chore: prepare release v{version}"
   git push origin main
   ```

2. Create a GitHub Release:
   - Go to: https://github.com/SilverAssist/performance-toolkit/releases/new
   - Tag: `v{version}` (create new tag)
   - Title: `v{version}`
   - Description: Copy from CHANGELOG.md
   - Click "Publish release"

3. The `publish.yml` workflow will automatically:
   - Run lint and tests
   - Build the package
   - Publish to npm
   - Create a summary

4. Verify publication:
   - Check workflow: https://github.com/SilverAssist/performance-toolkit/actions
   - Check npm: https://www.npmjs.com/package/@silverassist/performance-toolkit

5. Sync tags locally:
   ```bash
   git fetch --tags
   ```

---

## Post-Release Verification

After the release is published:

```bash
# Install from npm to verify
npm install @silverassist/performance-toolkit@{version}

# Test the CLI
npx perf-check --help

# Test the API
node -e "import('@silverassist/performance-toolkit').then(m => console.log('VERSION:', m.VERSION))"
```

---

## Rollback (if needed)

If something goes wrong after publishing:

1. **npm:** `npm deprecate @silverassist/performance-toolkit@{version} "reason"`
2. **GitHub:** Delete the release and tag
3. Fix the issue and release a patch version
