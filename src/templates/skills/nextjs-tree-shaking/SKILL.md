---
name: nextjs-tree-shaking
description: Optimize Next.js 15 bundle size through better export patterns and tree-shaking. Use when converting default exports to named exports, refactoring barrel files, configuring optimizePackageImports, or implementing the 'use cache' directive for better code splitting.
---

# Next.js 15 Tree-Shaking & Export Pattern Optimization

Expert knowledge for optimizing module export patterns to improve tree-shaking effectiveness and reduce bundle size in Next.js 15 applications.

> **Next.js 15 Key Changes:**
> - `use cache` directive for granular caching control (experimental)
> - Enhanced `optimizePackageImports` support
> - Improved static analysis for Server Components
> - Better tree-shaking with React 19

## When to Use This Skill

- Converting default exports to named exports for better tree-shaking
- Refactoring barrel files (index.ts) to use optimal re-export patterns
- Configuring `optimizePackageImports` in next.config.js
- Using the `use cache` directive for function-level caching
- Reducing bundle size through better static analysis
- Improving build performance and HMR (Hot Module Replacement)

## The Problem: Default Exports vs Named Exports

### Why Named Exports Are Better for Tree-Shaking

| Aspect | Default Export | Named Export |
|--------|---------------|--------------|
| **Static Analysis** | More difficult | More predictable |
| **Barrel Files** | ⚠️ Problematic | ✅ Optimal |
| **Import Aliases** | Can fail tree-shaking | Works reliably |
| **Code Splitting** | Less precise | More granular |
| **Build Tools** | Less reliable | Better support |

### The Real Problem: Barrel Files (index.ts)

Barrel files are convenient but can break tree-shaking when combined with default exports:

```typescript
// ❌ PROBLEM: Default exports in barrel files
// components/index.ts
export { default as Button } from './button';
export { default as Input } from './input';
export { default as Modal } from './modal';  // 50KB component

// usage.tsx
import { Button } from '@/components';
// ⚠️ May bundle Modal even though unused (depends on bundler configuration)
```

```typescript
// ✅ SOLUTION: Named exports
// components/index.ts
export { Button } from './button';
export { Input } from './input';
export { Modal } from './modal';

// usage.tsx
import { Button } from '@/components';
// ✅ Reliable tree-shaking - Modal is excluded
```

## Step-by-Step Migration Guide

### Step 1: Audit Current Export Patterns

Run the analyzer to identify issues:

```bash
npx @silverassist/performance-toolkit --audit-exports
```

This will show:
- Files using default exports
- Barrel files with problematic re-export patterns
- next.config.js optimization status
- Actionable recommendations

### Step 2: Convert Default Exports to Named Exports

**In component files:**

```typescript
// ❌ Before: Default export
// components/button.tsx
export default function Button({ children }) {
  return <button>{children}</button>;
}

// ✅ After: Named export
// components/button.tsx
export function Button({ children }) {
  return <button>{children}</button>;
}
```

**In React component files:**

```typescript
// ❌ Before: Default export with separate function
// components/card.tsx
const Card = ({ title, children }) => {
  return <div className="card">...</div>;
};

export default Card;

// ✅ After: Named export
// components/card.tsx
export const Card = ({ title, children }) => {
  return <div className="card">...</div>;
};

// OR (preferred for better type inference):
export function Card({ title, children }: CardProps) {
  return <div className="card">...</div>;
}
```

### Step 3: Update Barrel Files (index.ts)

**Update re-exports:**

```typescript
// ❌ Before: Re-exporting default exports
// components/index.ts
export { default as Button } from './button';
export { default as Card } from './card';
export { default as Input } from './input';

// ✅ After: Re-exporting named exports
// components/index.ts
export { Button } from './button';
export { Card } from './card';
export { Input } from './input';
```

**Avoid namespace re-exports:**

```typescript
// ❌ Problematic: Namespace re-export
// utils/index.ts
export * from './string-utils';
export * from './date-utils';
export * from './validation';
// ⚠️ Bundler must include ALL exports, even unused ones

// ✅ Better: Explicit named re-exports
// utils/index.ts
export { capitalize, slugify } from './string-utils';
export { formatDate, parseDate } from './date-utils';
export { validateEmail, validatePhone } from './validation';
// ✅ Bundler knows exactly what's imported
```

### Step 4: Update Import Statements

After converting to named exports, update imports throughout your codebase:

```typescript
// ❌ Before: Default import
import Button from '@/components/button';
import Card from '@/components/card';

// ✅ After: Named import
import { Button } from '@/components/button';
import { Card } from '@/components/card';

// OR from barrel file:
import { Button, Card } from '@/components';
```

**Use find-and-replace with care:**

```bash
# Example regex pattern for VSCode/IDE
# Find:    import (\w+) from ['"]@/components/(\w+)['"];
# Replace: import { $1 } from '@/components/$2';
```

### Step 5: Configure Next.js optimizePackageImports

Once you've converted to named exports, enable Next.js's built-in optimization:

```javascript
// next.config.mjs
export default {
  experimental: {
    optimizePackageImports: [
      '@/components',
      '@/lib',
      '@/utils',
      '@/hooks',
    ],
  },
};
```

**How it works:**

- Next.js automatically tree-shakes imports from these packages
- Works best with named exports
- Significantly improves build performance
- Reduces client-side bundle size

### Step 6: Verify Tree-Shaking

Build your app and check bundle analysis:

```bash
# Build with bundle analysis
ANALYZE=true npm run build

# Or manually check bundle size
npm run build
```

Expected improvements:
- **Bundle size**: 0-5% reduction (varies by project)
- **Build time**: Neutral or slightly better
- **HMR (dev)**: Slightly faster
- **Code maintainability**: Significantly better

## Common Patterns & Solutions

### Pattern 1: Next.js Page/Layout Components

Pages and layouts in App Router can remain default exports (Next.js convention):

```typescript
// ✅ OK: Default export for page.tsx
// app/dashboard/page.tsx
export default function DashboardPage() {
  return <div>...</div>;
}
```

But prefer named exports for regular components:

```typescript
// ✅ Better: Named exports for components
// components/dashboard-header.tsx
export function DashboardHeader() {
  return <header>...</header>;
}
```

### Pattern 2: Server Components vs Client Components

Both benefit from named exports:

```typescript
// ✅ Server Component with named export
// components/user-profile.tsx
export async function UserProfile({ userId }: Props) {
  const user = await fetchUser(userId);
  return <div>...</div>;
}

// ✅ Client Component with named export
// components/like-button.tsx
'use client';

export function LikeButton({ postId }: Props) {
  const [liked, setLiked] = useState(false);
  return <button onClick={() => setLiked(!liked)}>...</button>;
}
```

### Pattern 3: TypeScript Types and Interfaces

Always use named exports for types:

```typescript
// ✅ Named type exports
// types/user.ts
export interface User {
  id: string;
  name: string;
}

export type UserRole = 'admin' | 'user' | 'guest';

// Re-export in barrel file
// types/index.ts
export type { User, UserRole } from './user';
```

### Pattern 4: Utility Functions

Named exports work best:

```typescript
// ✅ Named function exports
// lib/string-utils.ts
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function slugify(str: string): string {
  return str.toLowerCase().replace(/\s+/g, '-');
}

// Usage
import { capitalize, slugify } from '@/lib/string-utils';
```

## Next.js 15-Specific Optimizations

### The 'use cache' Directive (Experimental)

Next.js 15 introduces a new `use cache` directive for granular caching control at the function level:

```typescript
// Enable in next.config.ts
const config = {
  experimental: {
    dynamicIO: true,
  },
};

// Use in components or functions
async function getData() {
  'use cache';
  const response = await fetch('https://api.example.com/data');
  return response.json();
}

// With cache lifetime configuration
async function getCachedData() {
  'use cache';
  cacheLife('hours'); // 'seconds' | 'minutes' | 'hours' | 'days' | 'weeks' | 'max'
  return fetchExpensiveData();
}

// With cache tag for manual invalidation
async function getUserProfile(userId: string) {
  'use cache';
  cacheTag(`user-${userId}`);
  return db.users.findUnique({ where: { id: userId } });
}
// Invalidate with: revalidateTag(`user-${userId}`)
```

### Using optimizePackageImports (Enhanced in Next.js 15)

Next.js 15 has improved the `optimizePackageImports` feature for better tree-shaking:

```javascript
// next.config.mjs
export default {
  experimental: {
    optimizePackageImports: [
      // Internal packages
      '@/components',
      '@/lib',
      '@/utils',
      
      // External UI libraries (if they support it)
      '@mui/material',
      '@chakra-ui/react',
      'lucide-react',
      '@radix-ui/react-icons',
    ],
  },
};
```

**Pre-configured packages (automatic optimization):**
Next.js 15 automatically optimizes these packages without configuration:
- `lucide-react`
- `date-fns`
- `lodash-es`
- `ramda`
- `antd`
- `react-bootstrap`
- `ahooks`
- `@headlessui/react`
- `@heroicons/react`
- `@visx/*`
- `@tremor/*`
- `rxjs`
- `@mui/material`
- `@mui/icons-material`
- `recharts`
- `react-use`
- `effect`
- `@material-ui/core`
- `@material-ui/icons`
- `@tabler/icons-react`
- `mui-core`
- `react-icons/*`

### Checking Optimization Status

```bash
# Analyze the build output
npm run build

# Look for these indicators:
# ✓ Static pages
# ✓ Optimized package imports: @/components, @/lib
```

## Troubleshooting

### Issue: "Cannot use import statement outside a module"

**Cause**: Mixing ESM and CommonJS incorrectly.

**Solution**:
```json
// package.json
{
  "type": "module"
}
```

Or use `.mjs` extension for ES modules.

### Issue: Tree-shaking not working after conversion

**Checklist**:
1. ✅ Did you convert ALL default exports to named exports?
2. ✅ Did you update the barrel files (index.ts)?
3. ✅ Did you update import statements?
4. ✅ Did you add packages to `optimizePackageImports`?
5. ✅ Did you clear `.next` and rebuild?

```bash
# Clear cache and rebuild
rm -rf .next
npm run build
```

### Issue: Module not found after refactoring

**Cause**: Import path or export name changed.

**Solution**: Use your IDE's "Find References" feature:
1. Select the component name
2. Find all references
3. Update imports systematically

## Migration Checklist

Use this checklist when migrating a project:

- [ ] Run `npx @silverassist/performance-toolkit --audit-exports`
- [ ] Review the analysis report
- [ ] Convert default exports to named exports (start with most-used components)
- [ ] Update barrel files to use named re-exports
- [ ] Update import statements throughout codebase
- [ ] Remove namespace re-exports (`export *`)
- [ ] Add packages to `optimizePackageImports` in next.config.js
- [ ] Clear `.next` cache and rebuild
- [ ] Run bundle analysis to verify improvements
- [ ] Test application thoroughly (especially dynamic imports)
- [ ] Update team documentation and guidelines

## Performance Impact

### Expected Improvements

| Metric | Impact |
|--------|--------|
| **Bundle Size** | 0-5% reduction (varies by project) |
| **Initial Load** | Slightly faster (fewer bytes) |
| **Build Time** | Neutral or slightly better |
| **HMR Speed** | Slightly faster |
| **Code Maintainability** | Significantly better |

### Real-World Example

Before optimization:
```
Route (app)              Size     First Load JS
────────────────────────────────────────────────
/                        8.2 kB    92.8 kB
/dashboard              15.4 kB    99.1 kB
```

After optimization (named exports + optimizePackageImports):
```
Route (app)              Size     First Load JS
────────────────────────────────────────────────
/                        7.8 kB    88.2 kB (-4.6 kB)
/dashboard              14.1 kB    94.8 kB (-4.3 kB)
```

## References

- [Next.js 15 optimizePackageImports Documentation](https://nextjs.org/docs/15/app/api-reference/config/next-config-js/optimizePackageImports)
- [Next.js 15 Caching and Revalidating](https://nextjs.org/docs/15/app/getting-started/caching-and-revalidating)
- [Webpack Tree Shaking Guide](https://webpack.js.org/guides/tree-shaking/)
- [ES Modules and Tree Shaking (MDN)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)
- [Why ESM is the future](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c)

## See Also

- `@workspace /performance/nextjs-performance` - For LCP and Core Web Vitals optimization
- `@workspace /performance/optimize-bundle` - For general bundle optimization strategies
