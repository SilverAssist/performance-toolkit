---
agent: agent
description: Audit and improve module export patterns for better tree-shaking in Next.js projects
---

# Audit Export Patterns for Tree-Shaking Optimization

Analyze module export patterns in a Next.js codebase and provide recommendations for improving tree-shaking effectiveness.

## Context

This prompt helps you audit export patterns that may impact bundle size and tree-shaking reliability. It's particularly useful for:
- Large Next.js applications with many components
- Projects using barrel files (index.ts) for re-exports
- Codebases migrating from default to named exports
- Bundle size optimization initiatives

## Prerequisites

- Access to the codebase
- `@silverassist/performance-toolkit` installed
- Next.js project (or similar framework)

## Steps

### 1. Run Export Pattern Analysis

First, analyze the current state of export patterns:

```bash
npx @silverassist/performance-toolkit --audit-exports
```

Or for JSON output:

```bash
npx @silverassist/performance-toolkit --audit-exports --json > export-analysis.json
```

### 2. Review the Analysis Report

The tool will show:

**Summary Statistics:**
- Total files analyzed
- Default vs named export counts
- Barrel files with issues
- Total issues found

**Common Issues Detected:**
- `default-in-barrel`: Barrel files using default exports
- `default-reexport`: Re-exporting defaults as named (suboptimal)
- `mixed-exports`: Files with both default and named exports
- `namespace-reexport`: Using `export *` (prevents tree-shaking)

**Recommendations:**
- Prioritized by impact (high/medium/low)
- Code examples (before/after)
- Estimated bundle size impact
- Affected files list

### 3. Prioritize Based on Impact

Focus on high-priority issues first:

1. **Barrel files with default re-exports** (Highest impact)
   - These most directly affect tree-shaking
   - Common in component libraries

2. **Configure optimizePackageImports** (High impact)
   - Quick win if not already configured
   - Requires minimal code changes

3. **Convert default exports to named** (Medium impact)
   - More widespread changes
   - Better long-term maintainability

### 4. Execute Refactoring

For each issue type, follow the migration pattern:

#### Pattern A: Fix Barrel Files

```typescript
// Before (components/index.ts)
export { default as Button } from './button';
export { default as Card } from './card';

// After (components/index.ts)
export { Button } from './button';
export { Card } from './card';
```

Then update source files:

```typescript
// Before (components/button.tsx)
export default function Button() { ... }

// After (components/button.tsx)
export function Button() { ... }
```

#### Pattern B: Replace Namespace Exports

```typescript
// Before (utils/index.ts)
export * from './string-utils';
export * from './validation';

// After (utils/index.ts)
export { capitalize, slugify } from './string-utils';
export { validateEmail, validatePhone } from './validation';
```

#### Pattern C: Configure Next.js Optimization

```javascript
// next.config.mjs
export default {
  experimental: {
    optimizePackageImports: [
      '@/components',
      '@/lib',
      '@/utils',
    ],
  },
};
```

### 5. Update Import Statements

After converting exports, update imports:

```bash
# Use your IDE's find-and-replace with regex
# Example for VSCode:

# Find:    import (\w+) from ['"]@/components/(\w+)['"];
# Replace: import { $1 } from '@/components/$2';
```

### 6. Verify Changes

```bash
# Clear Next.js cache
rm -rf .next

# Rebuild and check bundle size
npm run build

# Optionally run analysis again
npx @silverassist/performance-toolkit --audit-exports
```

## Output Format

Provide a summary report with:

### Summary
- Files analyzed: X
- Issues found: Y
- High-priority recommendations: Z

### Changes Made
1. **Converted N default exports to named exports**
   - File: `components/button.tsx`
   - Before: `export default function Button()`
   - After: `export function Button()`

2. **Updated M barrel files**
   - File: `components/index.ts`
   - Removed: `export { default as Button }`
   - Added: `export { Button }`

3. **Configured optimizePackageImports**
   - Added: `@/components`, `@/lib` to next.config.mjs

### Verification
- ✅ Build successful
- ✅ No type errors
- ✅ Bundle size reduced by X%
- ✅ Re-ran audit: Y issues remaining

### Next Steps (if any)
- [ ] Address remaining medium-priority issues
- [ ] Update team documentation
- [ ] Add linting rules to prevent default exports

## Common Patterns to Look For

### Pattern: Component Libraries

```typescript
// Common issue in component directories
components/
  ├── index.ts          # ⚠️ Often uses default re-exports
  ├── button.tsx        # ⚠️ Often has default export
  ├── card.tsx
  └── modal.tsx
```

**Fix**: Convert all to named exports and update barrel file.

### Pattern: Utility Functions

```typescript
// utils/index.ts - Common issue
export * from './string';   // ⚠️ Namespace export
export * from './date';     // ⚠️ Prevents tree-shaking
```

**Fix**: Use explicit named re-exports.

### Pattern: Next.js Pages

```typescript
// app/dashboard/page.tsx
export default function DashboardPage() { ... }  // ✅ OK for pages
```

**Note**: Pages/layouts in App Router should keep default exports (Next.js convention).

## Automated Migration Script

For large codebases, consider creating a codemod:

```javascript
// Example using jscodeshift (optional)
// migrate-exports.js

module.exports = function transformer(file, api) {
  const j = api.jscodeshift;
  const root = j(file.source);

  // Find default export function declarations
  root
    .find(j.ExportDefaultDeclaration, {
      declaration: { type: 'FunctionDeclaration' }
    })
    .forEach(path => {
      const funcDecl = path.value.declaration;
      
      // Convert to named export
      j(path).replaceWith(
        j.exportNamedDeclaration(funcDecl)
      );
    });

  return root.toSource();
};
```

Run with:
```bash
npx jscodeshift -t migrate-exports.js src/components/**/*.tsx
```

## Related Prompts

- `@workspace /performance/optimize-bundle` - For general bundle optimization
- `@workspace /performance/nextjs-performance` - For LCP and performance optimization
- `@workspace /performance/detect-context` - To understand project tech stack

## Tips

1. **Start small**: Pick one directory (e.g., `components/`) and refactor completely before moving to the next.

2. **Use TypeScript**: Named exports have better type inference and IDE support.

3. **Test thoroughly**: Especially dynamic imports and lazy-loaded components.

4. **Communicate**: Update team about the change in convention.

5. **Add linting**: Consider ESLint rules to enforce named exports going forward:
   ```json
   {
     "rules": {
       "import/no-default-export": "error"
     }
   }
   ```

## Troubleshooting

**Issue**: Build fails after conversion
- Check all import statements were updated
- Verify barrel files export names match
- Clear `.next` and rebuild

**Issue**: Tree-shaking still not working
- Confirm `optimizePackageImports` is configured
- Check that ALL files in a barrel use named exports
- Verify no circular dependencies exist

**Issue**: Type errors after migration
- Named exports may need explicit type annotations
- Update type imports: `import type { Props } from '...'`
