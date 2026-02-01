---
agent: agent
description: Analyze and optimize JavaScript bundle size with code splitting and tree shaking
---

# Optimize Bundle

Reduce JavaScript bundle size and improve loading performance.

## Prerequisites

- Run `analyze-performance` to identify unused JavaScript
- Access to build configuration
- Reference: Performance analysis report

## Steps

### 1. Analyze Bundle Composition

**Step: Generate bundle analysis**

For Next.js:
```bash
# Install analyzer
npm install --save-dev @next/bundle-analyzer

# Update next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});
module.exports = withBundleAnalyzer(nextConfig);

# Run analysis
ANALYZE=true npm run build
```

For Vite/Webpack:
```bash
# Use source-map-explorer
npx source-map-explorer dist/**/*.js

# Or webpack-bundle-analyzer
npm install --save-dev webpack-bundle-analyzer
```

### 2. Identify Optimization Targets

**Step: Review unused JavaScript from perf-check**

From the analysis, note:
1. First-party unused code (your code)
2. Third-party unused code (node_modules)
3. Largest modules by size
4. Percentage of code unused

**Priority targets:**
- Files with > 50% unused code
- Large dependencies (> 100KB)
- Polyfills for modern browsers
- Duplicated code across chunks

### 3. Implement Code Splitting

**For Next.js (App Router)**
```typescript
// Use dynamic imports for heavy components
import dynamic from 'next/dynamic';

// Client-only component (no SSR)
const HeavyChart = dynamic(() => import('@/components/Chart'), {
  ssr: false,
  loading: () => <ChartSkeleton />,
});

// SSR-enabled but lazy loaded
const Modal = dynamic(() => import('@/components/Modal'));

// Named export
const Tab = dynamic(() => 
  import('@/components/Tabs').then(mod => mod.Tab)
);
```

**For React (Standard)**
```typescript
import { lazy, Suspense } from 'react';

// Lazy load components
const Dashboard = lazy(() => import('./Dashboard'));
const Settings = lazy(() => import('./Settings'));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Suspense>
  );
}
```

### 4. Optimize Dependencies

**Step: Audit and replace heavy dependencies**

```bash
# Find heavy dependencies
npx depcheck

# Check bundle size impact
npx bundle-phobia <package-name>
```

**Common replacements:**

| Heavy Library | Lighter Alternative | Savings |
|---------------|---------------------|---------|
| moment | date-fns or dayjs | ~200KB |
| lodash | lodash-es + tree-shake | ~70KB |
| axios | fetch (native) | ~13KB |
| uuid | nanoid | ~3KB |
| classnames | clsx | ~1KB |

**Optimize lodash imports:**
```typescript
// ❌ Bad - imports entire library
import _ from 'lodash';
_.debounce(fn, 300);

// ✅ Good - imports only what's needed
import debounce from 'lodash/debounce';
debounce(fn, 300);

// ✅ Better - use lodash-es with tree shaking
import { debounce } from 'lodash-es';
```

### 5. Remove Unused Code

**Step: Enable tree shaking**

For Next.js/Webpack:
```javascript
// next.config.js
module.exports = {
  experimental: {
    optimizePackageImports: ['@mui/icons-material', 'lodash-es'],
  },
};
```

**Step: Mark side-effect-free packages**
```json
// package.json
{
  "sideEffects": false,
  // or specify files with side effects
  "sideEffects": ["*.css", "*.scss"]
}
```

**Step: Remove dead code**
```bash
# Find unused exports
npx ts-unused-exports tsconfig.json

# Find unused dependencies
npx depcheck
```

### 6. Optimize Third-Party Scripts

**Step: Defer non-critical scripts**

For Next.js:
```typescript
import Script from 'next/script';

// Load after page is interactive
<Script 
  src="https://analytics.example.com/script.js"
  strategy="lazyOnload"
/>

// Load after hydration
<Script 
  src="https://chat-widget.example.com/widget.js"
  strategy="afterInteractive"
/>

// Run inline script after load
<Script id="analytics-init" strategy="lazyOnload">
  {`window.analytics.init('key')`}
</Script>
```

**Step: Consider Partytown for heavy scripts**
```typescript
// Move third-party scripts to web worker
import { Partytown } from '@builder.io/partytown/react';

<Partytown forward={['dataLayer.push']} />
<script type="text/partytown" src="https://www.googletagmanager.com/gtag/js" />
```

### 7. Update Browser Targets

**Step: Reduce polyfills for modern browsers**

For Next.js:
```javascript
// next.config.js - default is good, but can customize
module.exports = {
  experimental: {
    browsersListForSwc: true,
  },
};
```

For Babel:
```json
// .browserslistrc or package.json
{
  "browserslist": [
    "last 2 Chrome versions",
    "last 2 Firefox versions",
    "last 2 Safari versions",
    "last 2 Edge versions",
    "not dead",
    "not op_mini all"
  ]
}
```

### 8. Verify Improvements

**Step: Rebuild and compare**
```bash
# Build and check size
npm run build

# Re-run analysis
ANALYZE=true npm run build

# Re-run performance check
npx perf-check {url} --insights
```

## Output

### Bundle Changes

| Chunk | Before | After | Reduction |
|-------|--------|-------|-----------|
| main.js | XXX KB | XXX KB | -XX% |
| vendor.js | XXX KB | XXX KB | -XX% |
| [page].js | XXX KB | XXX KB | -XX% |

### Code Changes Made

| Change | Impact |
|--------|--------|
| Dynamic import for `Component` | -XX KB from initial bundle |
| Replaced `moment` with `dayjs` | -180 KB |
| Tree-shaking for `lodash` | -50 KB |
| Deferred analytics scripts | -XXXms TBT |

### Performance Impact

| Metric | Before | After |
|--------|--------|-------|
| Total JS | XXX KB | XXX KB |
| Unused JS | XXX KB | XXX KB |
| TBT | XXXms | XXXms |
| TTI | X.Xs | X.Xs |

### Verification Checklist

- [ ] Bundle analyzer shows size reduction
- [ ] No runtime errors after code splitting
- [ ] Lazy components load correctly
- [ ] Third-party scripts don't block main thread
- [ ] Performance score improved

## Resources

- [Reduce JavaScript Payloads](https://web.dev/reduce-javascript-payloads-with-code-splitting/)
- [Next.js Code Splitting](https://nextjs.org/docs/app/building-your-application/optimizing/lazy-loading)
- [Bundle Phobia](https://bundlephobia.com/)
